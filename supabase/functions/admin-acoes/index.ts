// Edge: admin-acoes — mutações das telas de admin (Roles/Staffs/Users). Guard super_admin
// SERVER-SIDE em toda ação (o client é só UX). Tudo escrito com service role, escopado à org
// do super admin (roles/staffs) ou à plataforma (users).
//
// Ações:
//   role_toggle  { papel, ativo }               → liga/desliga um papel na org do admin (org_papeis)
//   staff_add    { email, papel }               → cria (ou acha) o usuário e o vincula à org
//   staff_remove { user_id }                     → remove o membership (não apaga a conta)
//   user_add     { email, papel? }               → cria conta + org própria (admin) ou vincula
//   user_access_set { user_id, liberado }         → libera/bloqueia o acesso à plataforma
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { corsHeaders, json } from "../_shared/cors.ts";
import { cifrar, decifrar } from "../_shared/cofre.ts";
import { resolverChave } from "../_shared/chaves.ts";
import {
  consolidarContasFinanceirasApify,
  consultarContaFinanceiraApify,
  deduplicarContasFinanceirasApify,
  resumirContaFinanceiraApify,
  type ContaFinanceiraApify,
} from "../_shared/apify-financeiro.ts";
import { buildApiUsagePeriodSummary } from "../_shared/api-usage-summary.ts";
import { planApifyRunLedgerSync, type RemoteApifyRun } from "../_shared/apify-run-ledger.ts";

const PAPEIS = ["admin", "gerente", "vendedor", "sdr", "suporte"];
type Rec = Record<string, unknown>;

// Chaves conhecidas do painel "Chaves e integrações" — a lista sempre aparece, configurada
// ou não; o admin também pode salvar um nome novo (campo livre) que não está aqui.
const CHAVES_CONHECIDAS = [
  "ANTHROPIC_API_KEY",
  "OPENAI_API_KEY",
  "APIFY_API_TOKEN",
  "GEOAPIFY_API_KEY",
  "RESEND_API_KEY",
  "EVOLUTION_URL",
  "EVOLUTION_API_KEY",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) return json({ error: "Não autenticado" }, 401);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
  const { data: perfil } = await admin
    .from("profiles")
    .select("is_super_admin")
    .eq("id", userData.user.id)
    .maybeSingle();
  if (perfil?.is_super_admin !== true) return json({ error: "Acesso negado" }, 403);

  // org do admin (roles/staffs operam nela)
  const { data: minhaOrg } = await admin
    .from("memberships")
    .select("org_id")
    .eq("user_id", userData.user.id)
    .order("criada_em", { ascending: true })
    .limit(1)
    .maybeSingle();
  const orgAdmin = minhaOrg?.org_id ?? null;

  let b: Record<string, unknown> = {};
  try {
    b = await req.json();
  } catch {
    return json({ error: "Body inválido" }, 400);
  }
  const acao = String(b.acao || "");

  const acharUsuarioPorEmail = async (email: string) => {
    const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    return (data?.users ?? []).find((u) => u.email?.toLowerCase() === email.toLowerCase()) ?? null;
  };

  try {
    if (acao === "role_toggle") {
      if (!orgAdmin) return json({ ok: false, reason: "sem_org" });
      const papel = String(b.papel || "");
      if (!PAPEIS.includes(papel)) return json({ ok: false, reason: "papel_invalido" });
      const ativo = b.ativo === true;
      await admin
        .from("org_papeis")
        .upsert({ org_id: orgAdmin, papel, ativo }, { onConflict: "org_id,papel" });
      return json({ ok: true, papel, ativo });
    }

    if (acao === "staff_add") {
      if (!orgAdmin) return json({ ok: false, reason: "sem_org" });
      const email = String(b.email || "")
        .trim()
        .toLowerCase();
      const papel = String(b.papel || "vendedor");
      if (!email.includes("@")) return json({ ok: false, reason: "email_invalido" });
      if (!PAPEIS.includes(papel)) return json({ ok: false, reason: "papel_invalido" });
      // papel precisa estar ATIVO na org (respeita o toggle da tela Roles)
      const { data: rp } = await admin
        .from("org_papeis")
        .select("ativo")
        .eq("org_id", orgAdmin)
        .eq("papel", papel)
        .maybeSingle();
      if (rp && rp.ativo === false) return json({ ok: false, reason: "papel_desativado" });

      let u = await acharUsuarioPorEmail(email);
      if (!u) {
        const { data: novo, error } = await admin.auth.admin.createUser({
          email,
          email_confirm: true,
          password: crypto.randomUUID(),
        });
        if (error)
          return json({ ok: false, reason: "falha_criar_usuario", detalhe: error.message });
        u = novo.user;
      }
      await admin
        .from("memberships")
        .upsert({ org_id: orgAdmin, user_id: u.id, papel }, { onConflict: "org_id,user_id" });
      return json({ ok: true, user_id: u.id, email, papel });
    }

    if (acao === "staff_remove") {
      if (!orgAdmin) return json({ ok: false, reason: "sem_org" });
      const uid = String(b.user_id || "");
      if (uid === userData.user.id) return json({ ok: false, reason: "nao_remova_a_si" });
      await admin.from("memberships").delete().eq("org_id", orgAdmin).eq("user_id", uid);
      return json({ ok: true, removido: uid });
    }

    if (acao === "user_add") {
      const email = String(b.email || "")
        .trim()
        .toLowerCase();
      if (!email.includes("@")) return json({ ok: false, reason: "email_invalido" });
      let u = await acharUsuarioPorEmail(email);
      if (!u) {
        const { data: novo, error } = await admin.auth.admin.createUser({
          email,
          email_confirm: true,
          password: crypto.randomUUID(),
        });
        if (error)
          return json({ ok: false, reason: "falha_criar_usuario", detalhe: error.message });
        u = novo.user;
      }
      // novo usuário de plataforma nasce como ADMIN da própria org (mesmo backfill dos donos)
      let { data: org } = await admin
        .from("orgs")
        .select("id")
        .eq("dono_user_id", u.id)
        .maybeSingle();
      if (!org) {
        const ins = await admin
          .from("orgs")
          .insert({ nome: email.split("@")[0], dono_user_id: u.id })
          .select("id")
          .single();
        org = ins.data;
      }
      if (org)
        await admin
          .from("memberships")
          .upsert(
            { org_id: org.id, user_id: u.id, papel: "admin" },
            { onConflict: "org_id,user_id" },
          );
      // conta adicionada diretamente pelo admin nasce liberada
      await admin.from("profiles").update({ acesso_liberado: true }).eq("id", u.id);
      return json({ ok: true, user_id: u.id, email });
    }

    if (acao === "user_access_set") {
      const userId = String(b.user_id || "");
      const liberado = b.liberado === true;
      // Plano opcional passado junto com a liberação (ex: "pro", "agencia")
      const PLANOS_VALIDOS = ["basico", "pro", "agencia", "enterprise", "starter"];
      const planInformado = String(b.plan || "")
        .toLowerCase()
        .trim();
      if (!userId) return json({ ok: false, reason: "usuario_invalido" });

      const updatePayload: Record<string, unknown> = { acesso_liberado: liberado };
      if (liberado && planInformado && PLANOS_VALIDOS.includes(planInformado)) {
        updatePayload.plan = planInformado;
      }

      const { data: alvo, error } = await admin
        .from("profiles")
        .update(updatePayload)
        .eq("id", userId)
        .select("id, email, full_name, acesso_liberado, plan")
        .maybeSingle();

      if (error) return json({ ok: false, reason: "falha_atualizar", detalhe: error.message });
      if (!alvo) return json({ ok: false, reason: "usuario_nao_encontrado" });

      if (liberado) {
        // Garantia secundária: se a conta não tiver org/membership, cria agora ao liberar
        let { data: org } = await admin
          .from("orgs")
          .select("id")
          .eq("dono_user_id", alvo.id)
          .maybeSingle();

        if (!org) {
          const nome =
            String(alvo.full_name || "").trim() ||
            String(alvo.email || "").split("@")[0] ||
            "Organização";
          const ins = await admin
            .from("orgs")
            .insert({ nome, dono_user_id: alvo.id })
            .select("id")
            .single();
          org = ins.data;
        }

        if (org) {
          await admin
            .from("memberships")
            .upsert(
              { org_id: org.id, user_id: alvo.id, papel: "admin" },
              { onConflict: "org_id,user_id" },
            );
        }
      }

      return json({
        ok: true,
        user_id: alvo.id,
        email: alvo.email,
        acesso_liberado: alvo.acesso_liberado,
        plan: alvo.plan,
      });
    }

    // Atribuição manual de plano pelo admin. A RPC atualiza profiles.plan (permissões da UI)
    // e orgs.plano_id (limites/consumo) na mesma transação.
    if (acao === "user_plan_set") {
      const userId = String(b.user_id || "");
      const plan = String(b.plan || "")
        .toLowerCase()
        .trim();
      const PLANOS_VALIDOS = ["basico", "pro", "agencia", "enterprise", "starter"];
      if (!userId) return json({ ok: false, reason: "usuario_invalido" });
      if (!PLANOS_VALIDOS.includes(plan)) return json({ ok: false, reason: "plano_invalido" });

      const { data: resultado, error } = await admin.rpc("admin_set_user_plan", {
        p_user: userId,
        p_plan: plan,
      });
      if (error) return json({ ok: false, reason: "falha_atualizar", detalhe: error.message });
      if (!resultado?.ok)
        return json({ ok: false, reason: resultado?.reason ?? "falha_atualizar" });
      return json({ ok: true, ...resultado });
    }

    // Exclusão de conta pelo admin — apaga do Auth (cascata via FK/trigger para profiles,
    // memberships, orgs). Super admins nunca podem ser deletados por esta rota.
    if (acao === "user_delete") {
      const userId = String(b.user_id || "");
      if (!userId) return json({ ok: false, reason: "usuario_invalido" });
      // Nunca deletar outro super admin
      const { data: alvoP } = await admin
        .from("profiles")
        .select("is_super_admin, email")
        .eq("id", userId)
        .maybeSingle();
      if (alvoP?.is_super_admin === true)
        return json({ ok: false, reason: "nao_pode_deletar_super_admin" });
      // Limpa dados do usuário antes de deletar do auth
      await admin.from("memberships").delete().eq("user_id", userId);
      await admin.from("orgs").delete().eq("dono_user_id", userId);
      await admin.from("profiles").delete().eq("id", userId);
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) return json({ ok: false, reason: "falha_deletar", detalhe: error.message });
      return json({ ok: true, deletado: userId, email: alvoP?.email });
    }

    // ── PLANOS (billing camada 1) ──
    if (acao === "plano_upsert") {
      const p = (b.plano ?? {}) as Record<string, unknown>;
      const nome = String(p.nome || "").trim();
      if (!nome) return json({ ok: false, reason: "nome_obrigatorio" });
      const num = (v: unknown) => (v === "" || v === null || v === undefined ? null : Number(v));
      const linha = {
        nome,
        descricao: String(p.descricao ?? "") || null,
        preco: Number(p.preco ?? 0),
        periodo: p.periodo === "anual" ? "anual" : "mensal",
        limite_leads: num(p.limite_leads),
        limite_sites: num(p.limite_sites),
        limite_campanhas: num(p.limite_campanhas),
        limite_mensagens: num(p.limite_mensagens),
        limite_whatsapp: num(p.limite_whatsapp),
        limite_templates: num(p.limite_templates),
        limite_segmentos: num(p.limite_segmentos),
        ativo: p.ativo !== false,
      };
      if (p.id) {
        await admin.from("planos").update(linha).eq("id", String(p.id));
        return json({ ok: true, id: p.id });
      }
      const { data, error } = await admin.from("planos").insert(linha).select("id").single();
      if (error) return json({ ok: false, reason: "falha_criar", detalhe: error.message });
      return json({ ok: true, id: data.id });
    }

    if (acao === "plano_toggle") {
      const id = String(b.id || "");
      if (!id) return json({ ok: false, reason: "sem_id" });
      await admin
        .from("planos")
        .update({ ativo: b.ativo === true })
        .eq("id", id);
      return json({ ok: true, id, ativo: b.ativo === true });
    }

    if (acao === "plano_delete") {
      const id = String(b.id || "");
      if (!id) return json({ ok: false, reason: "sem_id" });
      // não apaga plano em uso por alguma org (protege a integridade da assinatura)
      const { count } = await admin
        .from("orgs")
        .select("id", { count: "exact", head: true })
        .eq("plano_id", id);
      if ((count ?? 0) > 0) return json({ ok: false, reason: "plano_em_uso", orgs: count });
      await admin.from("planos").delete().eq("id", id);
      return json({ ok: true, removido: id });
    }

    // ── SUPORTE (todas as orgs — o admin vê e responde tudo) ──
    if (acao === "tickets_listar") {
      const { data: tks } = await admin
        .from("tickets")
        .select(
          "id, org_id, autor_user_id, assunto, mensagem, prioridade, status, criado_em, atualizado_em",
        )
        .order("criado_em", { ascending: false });
      const ids = [...new Set((tks ?? []).map((t: Rec) => String(t.autor_user_id)))];
      const { data: perfis } = ids.length
        ? await admin.from("profiles").select("id, email").in("id", ids)
        : { data: [] as Rec[] };
      const emailDe = new Map((perfis ?? []).map((p: Rec) => [String(p.id), p.email]));
      return json({
        ok: true,
        tickets: (tks ?? []).map((t: Rec) => ({
          ...t,
          autor_email: emailDe.get(String(t.autor_user_id)) ?? "?",
        })),
      });
    }

    if (acao === "ticket_responder") {
      const ticketId = String(b.ticket_id || "");
      const texto = String(b.texto || "").trim();
      if (!ticketId || !texto) return json({ ok: false, reason: "faltam_campos" });
      const { error } = await admin
        .from("ticket_respostas")
        .insert({ ticket_id: ticketId, autor_user_id: userData.user.id, eh_admin: true, texto });
      if (error) return json({ ok: false, reason: "falha_inserir", detalhe: error.message });
      return json({ ok: true });
    }

    if (acao === "ticket_status") {
      const ticketId = String(b.ticket_id || "");
      const status = String(b.status || "");
      if (!["aberto", "em_andamento", "resolvido", "fechado"].includes(status))
        return json({ ok: false, reason: "status_invalido" });
      await admin
        .from("tickets")
        .update({ status, atualizado_em: new Date().toISOString() })
        .eq("id", ticketId);
      return json({ ok: true, ticket_id: ticketId, status });
    }

    // ── RELATÓRIOS (todas as orgs; dado real, nada inventado) ──
    // ⚠️ o funil usa o STATUS ATUAL do lead (não há histórico de estágios) — é uma aproximação
    // honesta: um lead que chegou a "proposta enviada" e depois foi marcado 'lost' conta em
    // "perdido", não em "proposta enviada". Documentado também na tela.
    if (acao === "relatorios_ler") {
      const desde = typeof b.desde === "string" ? b.desde : null;
      const ate = typeof b.ate === "string" ? b.ate : null;
      let leadsQuery = admin
        .from("leads")
        .select("origem_fonte, origem_estrategia, status, motivo_perda");
      if (desde) leadsQuery = leadsQuery.gte("created_at", desde);
      if (ate) leadsQuery = leadsQuery.lte("created_at", ate);
      const { data: leadsRows } = await leadsQuery;
      const porFonte = new Map<string, number>();
      const porEstrategia = new Map<string, number>();
      const porMotivo = new Map<string, number>();
      let novos = 0,
        contatados = 0,
        propostaEnviada = 0,
        respondeu = 0,
        ganho = 0,
        perdido = 0;
      for (const r of leadsRows ?? []) {
        const fonte = typeof r.origem_fonte === "string" ? r.origem_fonte : "google_maps";
        porFonte.set(fonte, (porFonte.get(fonte) ?? 0) + 1);
        if (typeof r.origem_estrategia === "string")
          porEstrategia.set(r.origem_estrategia, (porEstrategia.get(r.origem_estrategia) ?? 0) + 1);
        const st = String(r.status ?? "");
        if (["new", "enriched"].includes(st)) novos++;
        if (!["new", "enriched"].includes(st)) contatados++;
        if (["proposta_enviada", "responded", "meeting", "won"].includes(st)) propostaEnviada++;
        if (["responded", "meeting", "won"].includes(st)) respondeu++;
        if (st === "won") ganho++;
        if (["lost", "nurture"].includes(st)) {
          perdido++;
          if (r.motivo_perda)
            porMotivo.set(
              r.motivo_perda as string,
              (porMotivo.get(r.motivo_perda as string) ?? 0) + 1,
            );
        }
      }

      // consumo do mês vs limite do plano, por org
      const mesRef = new Date().toISOString().slice(0, 7);
      const { data: orgsRows } = await admin
        .from("orgs")
        .select("id, nome, plano_id, dono_user_id");
      const { data: planosRows } = await admin
        .from("planos")
        .select("id, nome, limite_leads, limite_sites, limite_mensagens, limite_campanhas");
      const planoDe = new Map((planosRows ?? []).map((p: Rec) => [String(p.id), p]));
      const { data: consumoRows } = await admin
        .from("consumo_org")
        .select("org_id, leads, sites, mensagens, campanhas")
        .eq("mes_ref", mesRef);
      const consumoDe = new Map((consumoRows ?? []).map((c: Rec) => [String(c.org_id), c]));
      // dono é super_admin da PLATAFORMA → ilimitado de verdade (mesma regra de limite_plano
      // no SQL). Mostrar o limite bruto do plano aqui seria MENTIR sobre o que é aplicado.
      const donoIds = [...new Set((orgsRows ?? []).map((o: Rec) => String(o.dono_user_id)))];
      const { data: perfisDono } = donoIds.length
        ? await admin.from("profiles").select("id, is_super_admin").in("id", donoIds)
        : { data: [] as Rec[] };
      const superDe = new Map(
        (perfisDono ?? []).map((p: Rec) => [String(p.id), p.is_super_admin === true]),
      );
      const consumoPorOrg = (orgsRows ?? []).map((o: Rec) => {
        const plano = planoDe.get(String(o.plano_id)) as Rec | undefined;
        const ilimitada = superDe.get(String(o.dono_user_id)) === true;
        const consumo = (consumoDe.get(String(o.id)) as Rec | undefined) ?? {
          leads: 0,
          sites: 0,
          mensagens: 0,
          campanhas: 0,
        };
        const lim = (v: unknown) => (ilimitada ? null : (v as number | null));
        return {
          org: o.nome,
          plano: ilimitada
            ? `${plano?.nome ?? "—"} (super admin: ilimitado)`
            : (plano?.nome ?? "—"),
          leads: { usado: consumo.leads, limite: lim(plano?.limite_leads) },
          sites: { usado: consumo.sites, limite: lim(plano?.limite_sites) },
          mensagens: { usado: consumo.mensagens, limite: lim(plano?.limite_mensagens) },
          campanhas: { usado: consumo.campanhas, limite: lim(plano?.limite_campanhas) },
        };
      });

      // gasto por mês (livro-caixa) — últimos 12 meses de referência que tiverem linha
      const { data: gastoRows } = await admin.from("redes_buscas").select("mes_ref, custo_usd");
      const gastoPorMesMap = new Map<string, number>();
      for (const r of gastoRows ?? [])
        gastoPorMesMap.set(
          r.mes_ref as string,
          (gastoPorMesMap.get(r.mes_ref as string) ?? 0) + Number(r.custo_usd ?? 0),
        );
      const gastoPorMes = [...gastoPorMesMap.entries()]
        .sort((a, b2) => a[0].localeCompare(b2[0]))
        .map(([mes_ref, total_usd]) => ({ mes_ref, total_usd }));

      return json({
        ok: true,
        periodo: { desde, ate },
        leadsPorFonte: [...porFonte.entries()].map(([fonte, total]) => ({ fonte, total })),
        leadsPorEstrategia: [...porEstrategia.entries()]
          .sort((a, b2) => b2[1] - a[1])
          .map(([estrategia, total]) => ({ estrategia, total })),
        funil: { novos, contatados, propostaEnviada, respondeu, ganho, perdido },
        motivosPerda: [...porMotivo.entries()]
          .sort((a, b2) => b2[1] - a[1])
          .map(([motivo, total]) => ({ motivo, total })),
        consumoPorOrg,
        gastoPorMes,
      });
    }

    // config_ler / config_salvar — a linha ÚNICA de config_plataforma (id=true). Cada campo
    // aqui é lido por uma edge de verdade (buscar-redes, redesign-site, send-proposal,
    // publicacao.core, WaCampanhas) como OVERRIDE do valor padrão — nunca decorativo.
    if (acao === "config_ler") {
      const { data: config } = await admin
        .from("config_plataforma")
        .select("*")
        .eq("id", true)
        .maybeSingle();
      return json({ ok: true, config: config ?? {} });
    }

    if (acao === "config_salvar") {
      const NUMERICOS = [
        "teto_rodada_usd",
        "teto_mes_usd",
        "dias_validade_site",
        "intervalo_disparo_min_seg",
        "intervalo_disparo_max_seg",
        "max_leads_busca",
      ] as const;
      const TEXTOS = [
        "remetente_nome_padrao",
        "remetente_email_padrao",
        "nome_plataforma",
        "logo_url",
        "favicon_url",
        "fonte_leads_padrao",
        "modelo_ia",
        "moeda",
        "simbolo_moeda",
        "fuso_horario",
        "cor_base",
        "cor_secundaria",
        "modelo_openai",
        "seo_titulo",
        "seo_descricao",
        "gdpr_texto",
        "css_personalizado",
      ] as const;
      const BOOLEANOS = [
        "cadastro_usuario_ativo",
        "termos_condicoes_ativo",
        "modo_manutencao_ativo",
      ] as const;
      const patch: Rec = {};
      for (const campo of NUMERICOS) {
        if (campo in b) {
          const v = b[campo];
          patch[campo] = v === null || v === "" ? null : Number(v);
        }
      }
      for (const campo of TEXTOS) {
        if (campo in b) {
          const v = b[campo];
          patch[campo] = typeof v === "string" && v.trim() ? v.trim() : null;
        }
      }
      for (const campo of BOOLEANOS) {
        if (campo in b) patch[campo] = b[campo] === true;
      }
      if (Object.keys(patch).length === 0) return json({ ok: false, reason: "nada_para_salvar" });
      patch.atualizado_em = new Date().toISOString();
      const { error } = await admin.from("config_plataforma").update(patch).eq("id", true);
      if (error) return json({ ok: false, reason: "erro_salvar", detalhe: error.message });
      return json({ ok: true });
    }

    // notificacao_enviar / notificacoes_listar — aviso IN-APP pra todos os usuários da
    // PLATAFORMA (profiles). Registra quem recebeu (notificacao_destinatarios). NÃO toca em
    // consumo_org nem em nenhum contador de prospecção — não consome cota nem rampa.
    if (acao === "notificacao_enviar") {
      const titulo = String(b.titulo || "").trim();
      const mensagem = String(b.mensagem || "").trim();
      if (!titulo || !mensagem) return json({ ok: false, reason: "campos_obrigatorios" });
      const { data: perfis } = await admin.from("profiles").select("id");
      const destinatarios = perfis ?? [];
      if (destinatarios.length === 0) return json({ ok: false, reason: "sem_usuarios" });
      const { data: notif, error: errNotif } = await admin
        .from("notificacoes")
        .insert({ titulo, mensagem, criado_por: userData.user.id })
        .select("id")
        .single();
      if (errNotif || !notif)
        return json({ ok: false, reason: "erro_criar", detalhe: errNotif?.message });
      const linhas = destinatarios.map((p: Rec) => ({ notificacao_id: notif.id, user_id: p.id }));
      const { error: errDest } = await admin.from("notificacao_destinatarios").insert(linhas);
      if (errDest)
        return json({ ok: false, reason: "erro_destinatarios", detalhe: errDest.message });
      return json({ ok: true, notificacao_id: notif.id, destinatarios: linhas.length });
    }

    if (acao === "notificacoes_listar") {
      const { data: notifs } = await admin
        .from("notificacoes")
        .select("id, titulo, mensagem, criado_em")
        .order("criado_em", { ascending: false })
        .limit(50);
      const ids = (notifs ?? []).map((n: Rec) => n.id);
      const { data: destRows } = ids.length
        ? await admin
            .from("notificacao_destinatarios")
            .select("notificacao_id, lida_em")
            .in("notificacao_id", ids)
        : { data: [] as Rec[] };
      const porNotif = new Map<string, { total: number; lidas: number }>();
      for (const d of destRows ?? []) {
        const k = String(d.notificacao_id);
        const c = porNotif.get(k) ?? { total: 0, lidas: 0 };
        c.total++;
        if (d.lida_em) c.lidas++;
        porNotif.set(k, c);
      }
      const lista = (notifs ?? []).map((n: Rec) => ({
        ...n,
        total: porNotif.get(String(n.id))?.total ?? 0,
        lidas: porNotif.get(String(n.id))?.lidas ?? 0,
      }));
      return json({ ok: true, notificacoes: lista });
    }

    // assinantes — CRUD manual (sem base de captura ainda; "Enviar e-mail" fica desabilitado
    // no client com o motivo — não há motor de disparo em massa/newsletter hoje).
    if (acao === "assinantes_listar") {
      const { data } = await admin
        .from("assinantes")
        .select("id, email, nome, criado_em")
        .order("criado_em", { ascending: false });
      return json({ ok: true, assinantes: data ?? [] });
    }

    if (acao === "assinante_add") {
      const email = String(b.email || "")
        .trim()
        .toLowerCase();
      const nome = typeof b.nome === "string" && b.nome.trim() ? b.nome.trim() : null;
      if (!email.includes("@")) return json({ ok: false, reason: "email_invalido" });
      const { data, error } = await admin
        .from("assinantes")
        .insert({ email, nome, criado_por: userData.user.id })
        .select("id, email, nome, criado_em")
        .single();
      if (error) {
        if ((error as { code?: string }).code === "23505")
          return json({ ok: false, reason: "email_duplicado" });
        return json({ ok: false, reason: "erro_salvar", detalhe: error.message });
      }
      return json({ ok: true, assinante: data });
    }

    if (acao === "assinante_remove") {
      const id = String(b.id || "");
      if (!id) return json({ ok: false, reason: "id_obrigatorio" });
      await admin.from("assinantes").delete().eq("id", id);
      return json({ ok: true, removido: id });
    }

    // cms_ler / cms_salvar — conteúdo da landing PÚBLICA (site_conteudo). A leitura pública
    // (/, /pricing) é direta por RLS (não passa por edge); aqui é só a ESCRITA do admin.
    if (acao === "cms_ler") {
      const { data } = await admin.from("site_conteudo").select("*").eq("id", true).maybeSingle();
      return json({ ok: true, conteudo: data ?? {} });
    }

    if (acao === "cms_salvar") {
      const CAMPOS_TEXTO = [
        "hero_badge",
        "hero_titulo",
        "hero_titulo_destaque",
        "hero_subtitulo",
        "hero_cta_primario",
        "hero_cta_secundario",
        "hero_disclaimer",
        "features_titulo",
        "features_subtitulo",
        "cta_final_titulo",
        "cta_final_subtitulo",
        "cta_final_botao",
        "footer_texto",
      ] as const;
      const patch: Rec = {};
      for (const campo of CAMPOS_TEXTO) {
        if (campo in b) {
          const v = b[campo];
          patch[campo] = typeof v === "string" && v.trim() ? v.trim() : null;
        }
      }
      if ("planos_json" in b) {
        patch.planos_json = Array.isArray(b.planos_json) ? b.planos_json : null;
      }
      if (Object.keys(patch).length === 0) return json({ ok: false, reason: "nada_para_salvar" });
      patch.atualizado_em = new Date().toISOString();
      const { error } = await admin.from("site_conteudo").update(patch).eq("id", true);
      if (error) return json({ ok: false, reason: "erro_salvar", detalhe: error.message });
      return json({ ok: true });
    }

    // ═══ Cofre de chaves — chaves_listar/chave_salvar/chaves_auditoria_listar ═══
    // O valor completo NUNCA volta pro navegador em NENHUMA dessas ações — só últimos4,
    // status e metadados. Escrita cifra ANTES de gravar (cifrar() em _shared/cofre.ts).
    if (acao === "chaves_listar") {
      const { data: rows } = await admin
        .from("config_chaves")
        .select("nome, ultimos4, atualizado_em, atualizado_por");
      const porNome = new Map((rows ?? []).map((r: Rec) => [String(r.nome), r]));
      const todosNomes = [...new Set([...CHAVES_CONHECIDAS, ...porNome.keys()])];
      const idsAutores = [...porNome.values()]
        .map((r) => (r as Rec).atualizado_por as string | null)
        .filter((v): v is string => !!v);
      const { data: perfis } = idsAutores.length
        ? await admin.from("profiles").select("id, email").in("id", idsAutores)
        : { data: [] as Rec[] };
      const emailDe = new Map((perfis ?? []).map((p: Rec) => [String(p.id), p.email as string]));
      const lista = todosNomes.map((nome) => {
        const r = porNome.get(nome) as Rec | undefined;
        return {
          nome,
          configurada: !!r,
          ultimos4: r?.ultimos4 ?? null,
          atualizado_em: r?.atualizado_em ?? null,
          atualizado_por: r?.atualizado_por
            ? (emailDe.get(String(r.atualizado_por)) ?? null)
            : null,
        };
      });
      return json({ ok: true, chaves: lista });
    }

    if (acao === "chave_salvar") {
      const nome = String(b.nome || "")
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9_]/g, "_");
      const valor = String(b.valor || "");
      if (!nome) return json({ ok: false, reason: "nome_obrigatorio" });
      if (!valor || valor.length < 4) return json({ ok: false, reason: "valor_invalido" });
      const cifrado = await cifrar(valor);
      const ultimos4 = valor.slice(-4);
      const { error } = await admin.from("config_chaves").upsert(
        {
          nome,
          valor_cifrado: cifrado,
          ultimos4,
          atualizado_em: new Date().toISOString(),
          atualizado_por: userData.user.id,
        },
        { onConflict: "nome" },
      );
      if (error) return json({ ok: false, reason: "erro_salvar", detalhe: error.message });
      await admin.from("config_chaves_auditoria").insert({ nome, alterado_por: userData.user.id });
      return json({ ok: true, ultimos4 });
    }

    if (acao === "chaves_auditoria_listar") {
      const { data } = await admin
        .from("config_chaves_auditoria")
        .select("nome, alterado_por, alterado_em")
        .order("alterado_em", { ascending: false })
        .limit(50);
      const ids = [
        ...new Set((data ?? []).map((r: Rec) => r.alterado_por as string | null)),
      ].filter((v): v is string => !!v);
      const { data: perfis } = ids.length
        ? await admin.from("profiles").select("id, email").in("id", ids)
        : { data: [] as Rec[] };
      const emailDe = new Map((perfis ?? []).map((p: Rec) => [String(p.id), p.email as string]));
      const auditoria = (data ?? []).map((r: Rec) => ({
        nome: r.nome,
        alterado_em: r.alterado_em,
        email: r.alterado_por ? (emailDe.get(String(r.alterado_por)) ?? "—") : "—",
      }));
      return json({ ok: true, auditoria });
    }

    // chave_efetiva_teste — diagnóstico SEGURO (só o `nome` que o chamador passar; nunca uma
    // chave real gerenciada): resolve via resolverChave() (cofre → fallback) e devolve
    // mascarado. Prova que o mecanismo de resolução funciona de fato no runtime da Edge — o
    // MESMO usado nas outras 11 edges (Deno.env.set NÃO funciona nesse runtime; por isso a
    // resolução é sempre via leitura direta, nunca via mutação do ambiente).
    if (acao === "chave_efetiva_teste") {
      const nome = String(b.nome || "")
        .trim()
        .toUpperCase();
      if (!nome) return json({ ok: false, reason: "nome_obrigatorio" });
      const valor = await resolverChave(admin, nome);
      return json({ ok: true, configurada: !!valor, ultimos4: valor ? valor.slice(-4) : null });
    }

    if (acao === "api_consumo_resumo") {
      const dias = Math.min(Math.max(Math.floor(Number(b.dias) || 30), 1), 365);
      const desde = new Date(Date.now() - dias * 86_400_000).toISOString();
      const mesRef = new Date().toISOString().slice(0, 7);

      const [
        logsResult,
        profilesResult,
        membershipsResult,
        orgsResult,
        plansResult,
        consumoResult,
        leadCountsResult,
        keysResult,
      ] = await Promise.all([
        admin
          .from("api_consumption_logs")
          .select(
            "id, org_id, user_id, service, action, external_id, quantity, cost_usd, cost_brl, metadata, created_at",
          )
          .gte("created_at", desde)
          .order("created_at", { ascending: false }),
        admin
          .from("profiles")
          .select("id, email, full_name, is_super_admin, plan, created_at")
          .order("created_at"),
        admin.from("memberships").select("user_id, org_id, criada_em").order("criada_em"),
        admin.from("orgs").select("id, nome, plano_id, dono_user_id"),
        admin.from("planos").select("id, nome, limite_leads"),
        admin.from("consumo_org").select("org_id, leads").eq("mes_ref", mesRef),
        admin.rpc("admin_api_lead_counts", { p_since: desde }),
        admin.from("apify_chaves").select("apelido, valor_cifrado, status").order("ordem"),
      ]);

      const queryError = [
        logsResult.error,
        profilesResult.error,
        membershipsResult.error,
        orgsResult.error,
        plansResult.error,
        consumoResult.error,
        leadCountsResult.error,
      ].find(Boolean);
      if (queryError) {
        return json({ ok: false, reason: "erro_consulta", detalhe: queryError.message }, 500);
      }

      const tokenRows: Array<{ label: string; token: string }> = [];
      const accountErrors: string[] = [];
      const financialAccountErrors: string[] = [];
      if (keysResult.error) {
        const detalhe = `pool: ${keysResult.error.message}`;
        accountErrors.push(detalhe);
        financialAccountErrors.push(detalhe);
      }
      for (const row of keysResult.data ?? []) {
        if (row.status === "invalida") {
          const detalhe = `${String(row.apelido)}: token marcado como invalido`;
          accountErrors.push(detalhe);
          financialAccountErrors.push(detalhe);
          continue;
        }
        try {
          tokenRows.push({ label: String(row.apelido), token: await decifrar(row.valor_cifrado) });
        } catch (error) {
          const detalhe = `${String(row.apelido)}: ${error instanceof Error ? error.message : String(error)}`;
          accountErrors.push(detalhe);
          financialAccountErrors.push(detalhe);
        }
      }
      if ((keysResult.data?.length ?? 0) === 0 && !keysResult.error) {
        const fallbackToken = await resolverChave(admin, "APIFY_API_TOKEN");
        if (fallbackToken) tokenRows.push({ label: "chave única", token: fallbackToken });
      }
      if (tokenRows.length === 0 && financialAccountErrors.length === 0) {
        const detalhe = "nenhuma conta Apify configurada para sincronizacao";
        accountErrors.push(detalhe);
        financialAccountErrors.push(detalhe);
      }

      const logs = (logsResult.data ?? []).map((row: Rec) => ({ ...row }));
      const remoteRuns: RemoteApifyRun[] = [];
      const remoteRunIds = new Set<string>();
      const terminalStatuses = new Set(["SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"]);
      for (const tokenRow of tokenRows) {
        for (let offset = 0; offset < 1_000; offset += 100) {
          try {
            const listResponse = await fetch(
              `https://api.apify.com/v2/acts/compass~crawler-google-places/runs?limit=100&offset=${offset}&desc=1`,
              {
                headers: { Authorization: `Bearer ${tokenRow.token}` },
                signal: AbortSignal.timeout(10_000),
              },
            );
            const listBody = await listResponse.json().catch(() => ({}));
            if (!listResponse.ok || !Array.isArray(listBody?.data?.items)) {
              accountErrors.push(
                `${tokenRow.label}: histórico de runs inválido (HTTP ${listResponse.status})`,
              );
              break;
            }
            const items = listBody.data.items as Rec[];
            let reachedOlderRun = false;
            for (const item of items) {
              const runId = typeof item.id === "string" ? item.id : null;
              const startedAt = typeof item.startedAt === "string" ? item.startedAt : null;
              const status = typeof item.status === "string" ? item.status : "UNKNOWN";
              if (!runId || !startedAt) continue;
              if (startedAt < desde) {
                reachedOlderRun = true;
                continue;
              }
              if (!terminalStatuses.has(status) || remoteRunIds.has(runId)) continue;
              remoteRunIds.add(runId);
              remoteRuns.push({
                id: runId,
                status,
                usageTotalUsd: Number.isFinite(Number(item.usageTotalUsd))
                  ? Number(item.usageTotalUsd)
                  : 0,
                startedAt,
                finishedAt: typeof item.finishedAt === "string" ? item.finishedAt : null,
                defaultDatasetId:
                  typeof item.defaultDatasetId === "string" ? item.defaultDatasetId : null,
                keyLabel: tokenRow.label,
              });
            }
            if (items.length < 100 || reachedOlderRun) break;
          } catch (error) {
            accountErrors.push(
              `${tokenRow.label}: ${error instanceof Error ? error.message : String(error)}`,
            );
            break;
          }
        }
      }

      const ledgerActions = planApifyRunLedgerSync(
        logs
          .filter((log) => log.service === "apify_maps")
          .map((log) => ({
            id: String(log.id),
            action: String(log.action),
            external_id: typeof log.external_id === "string" ? log.external_id : null,
            cost_usd: Number(log.cost_usd ?? 0),
            created_at: String(log.created_at),
          })),
        remoteRuns,
      );

      let reconciledRuns = 0;
      for (const ledgerAction of ledgerActions) {
        const { run } = ledgerAction;
        const tokenRow = tokenRows.find((row) => row.label === run.keyLabel);
        const existingLog =
          ledgerAction.kind === "insert_unattributed"
            ? undefined
            : logs.find((log) => String(log.id) === ledgerAction.logId);
        const existingMetadata: Rec =
          existingLog?.metadata &&
          typeof existingLog.metadata === "object" &&
          !Array.isArray(existingLog.metadata)
            ? { ...(existingLog.metadata as Rec) }
            : {};
        if (
          ledgerAction.kind === "update_existing" &&
          typeof existingMetadata.cost_reconciled_at === "string" &&
          Math.abs(Number(existingLog?.cost_usd ?? 0) - run.usageTotalUsd) <= 0.0001
        ) {
          continue;
        }
        let itemCount = Number(existingLog?.quantity ?? 0);
        if (itemCount === 0 && run.defaultDatasetId && tokenRow) {
          try {
            const datasetResponse = await fetch(
              `https://api.apify.com/v2/datasets/${encodeURIComponent(run.defaultDatasetId)}`,
              {
                headers: { Authorization: `Bearer ${tokenRow.token}` },
                signal: AbortSignal.timeout(10_000),
              },
            );
            if (datasetResponse.ok) {
              const datasetBody = await datasetResponse.json().catch(() => ({}));
              const remoteItemCount = Number(datasetBody?.data?.itemCount);
              if (Number.isFinite(remoteItemCount)) itemCount = remoteItemCount;
            }
          } catch (error) {
            accountErrors.push(
              `dataset ${run.defaultDatasetId}: ${error instanceof Error ? error.message : String(error)}`,
            );
          }
        }

        const reconciledAt = new Date().toISOString();
        const nextMetadata: Rec = {
          ...existingMetadata,
          run_status: run.status,
          dataset_id: run.defaultDatasetId,
          key_label: run.keyLabel,
          started_at: run.startedAt,
          finished_at: run.finishedAt,
          cost_source: "apify_usage_total_usd",
          cost_reconciled_at: reconciledAt,
          attribution:
            ledgerAction.kind === "insert_unattributed"
              ? "legacy_run_without_user_link"
              : "user_linked",
        };
        const payload: Rec = {
          service: "apify_maps",
          action:
            ledgerAction.kind === "insert_unattributed"
              ? "provider_run_unattributed"
              : "search_run_reconciled",
          external_id: run.id,
          quantity: itemCount,
          cost_usd: run.usageTotalUsd,
          cost_brl: run.usageTotalUsd * 5.6,
          metadata: nextMetadata,
        };

        if (ledgerAction.kind === "insert_unattributed") {
          const { data: inserted, error: insertError } = await admin
            .from("api_consumption_logs")
            .insert({ ...payload, org_id: null, user_id: null, created_at: run.startedAt })
            .select(
              "id, org_id, user_id, service, action, external_id, quantity, cost_usd, cost_brl, metadata, created_at",
            )
            .single();
          if (insertError) {
            if (insertError.code !== "23505") {
              accountErrors.push(`run ${run.id}: ${insertError.message}`);
            }
            continue;
          }
          logs.push(inserted as Rec);
          reconciledRuns += 1;
          continue;
        }

        const { error: updateError } = await admin
          .from("api_consumption_logs")
          .update(payload)
          .eq("id", ledgerAction.logId);
        if (updateError) {
          accountErrors.push(`run ${run.id}: ${updateError.message}`);
          continue;
        }
        if (existingLog) Object.assign(existingLog, payload);
        reconciledRuns += 1;
      }

      const periodSummary = buildApiUsagePeriodSummary({
        profiles: (profilesResult.data ?? []).map((row: Rec) => ({
          id: String(row.id),
          email: typeof row.email === "string" ? row.email : null,
          full_name: typeof row.full_name === "string" ? row.full_name : null,
          is_super_admin: row.is_super_admin === true,
          plan: typeof row.plan === "string" ? row.plan : null,
        })),
        memberships: (membershipsResult.data ?? []).map((row: Rec) => ({
          user_id: String(row.user_id),
          org_id: String(row.org_id),
          criada_em: typeof row.criada_em === "string" ? row.criada_em : null,
        })),
        orgs: (orgsResult.data ?? []).map((row: Rec) => ({
          id: String(row.id),
          nome: typeof row.nome === "string" ? row.nome : null,
          plano_id: typeof row.plano_id === "string" ? row.plano_id : null,
          dono_user_id: typeof row.dono_user_id === "string" ? row.dono_user_id : null,
        })),
        plans: (plansResult.data ?? []).map((row: Rec) => ({
          id: String(row.id),
          nome: typeof row.nome === "string" ? row.nome : null,
          limite_leads: Number.isFinite(Number(row.limite_leads)) ? Number(row.limite_leads) : null,
        })),
        orgConsumption: (consumoResult.data ?? []).map((row: Rec) => ({
          org_id: String(row.org_id),
          leads: Number.isFinite(Number(row.leads)) ? Number(row.leads) : 0,
        })),
        userLeadCounts: (leadCountsResult.data ?? []).map((row: Rec) => ({
          user_id: String(row.user_id),
          leads_period: Number.isFinite(Number(row.leads_period)) ? Number(row.leads_period) : 0,
          leads_month: Number.isFinite(Number(row.leads_month)) ? Number(row.leads_month) : 0,
          apify_leads_period: Number.isFinite(Number(row.apify_leads_period))
            ? Number(row.apify_leads_period)
            : 0,
        })),
        logs: logs.map((row: Rec) => ({
          user_id: typeof row.user_id === "string" ? row.user_id : null,
          org_id: typeof row.org_id === "string" ? row.org_id : null,
          service: String(row.service),
          action: typeof row.action === "string" ? row.action : null,
          quantity: Number.isFinite(Number(row.quantity)) ? Number(row.quantity) : 0,
          cost_usd: Number.isFinite(Number(row.cost_usd)) ? Number(row.cost_usd) : 0,
          cost_brl: Number.isFinite(Number(row.cost_brl)) ? Number(row.cost_brl) : 0,
        })),
      });

      const accounts: Array<{
        label: string;
        account_id: string;
        username: string;
        token_count: number;
        usage_usd: number;
        limit_usd: number;
        remaining_usd: number;
        included_credits_usd: number;
        included_credits_remaining_usd: number;
        hard_limit_usd: number;
        hard_remaining_usd: number;
      }> = [];
      const consultasFinanceiras = await Promise.all(
        tokenRows.map(async (row) => ({
          row,
          consulta: await consultarContaFinanceiraApify(row.token),
        })),
      );
      const contasPorToken: Array<{ label: string; conta: ContaFinanceiraApify }> = [];
      for (const { row, consulta } of consultasFinanceiras) {
        if (consulta.situacao !== "ok") {
          const detalhe = `${row.label}: ${consulta.motivo}`;
          accountErrors.push(detalhe);
          financialAccountErrors.push(detalhe);
          continue;
        }
        contasPorToken.push({ label: row.label, conta: consulta.conta });
      }
      const contasUnicas = deduplicarContasFinanceirasApify(contasPorToken.map((row) => row.conta));
      for (const conta of contasUnicas) {
        const tokensDaConta = contasPorToken.filter(
          (row) => row.conta.accountId === conta.accountId,
        );
        const resumoConta = resumirContaFinanceiraApify(conta);
        accounts.push({
          label: tokensDaConta.map((row) => row.label).join(" + "),
          account_id: conta.accountId,
          username: conta.username,
          token_count: tokensDaConta.length,
          usage_usd: resumoConta.usageUsd,
          // Compatibilidade: estes campos sempre representaram o teto mensal da conta.
          // A API oficial /limits devolve o mesmo valor exibido como "uso / limite" na Apify.
          limit_usd: resumoConta.limitUsd,
          remaining_usd: resumoConta.remainingUsd,
          included_credits_usd: resumoConta.includedCreditsUsd,
          included_credits_remaining_usd: resumoConta.includedCreditsRemainingUsd,
          hard_limit_usd: conta.hardLimitUsd,
          hard_remaining_usd: conta.hardRemainingUsd,
        });
      }

      const consolidado = consolidarContasFinanceirasApify(contasPorToken.map((row) => row.conta));
      const financialComplete =
        tokenRows.length > 0 && financialAccountErrors.length === 0 && consolidado.accountCount > 0;

      return json({
        ok: true,
        period_days: dias,
        period_started_at: desde,
        total_cost_usd: periodSummary.totalCostUsd,
        total_cost_brl: periodSummary.totalCostBrl,
        attributed_cost_usd: periodSummary.totalCostUsd - periodSummary.unattributedCostUsd,
        attributed_cost_brl: periodSummary.totalCostBrl - periodSummary.unattributedCostBrl,
        attributed_apify_cost_usd:
          periodSummary.attributedApifyCostUsd - periodSummary.unattributedApifyCostUsd,
        unattributed_cost_usd: periodSummary.unattributedCostUsd,
        unattributed_cost_brl: periodSummary.unattributedCostBrl,
        unattributed_requests: periodSummary.unattributedRequests,
        unattributed_items: periodSummary.unattributedItems,
        total_requests: periodSummary.totalRequests,
        total_leads_crawled: periodSummary.totalItemsCharged,
        top_users: periodSummary.users,
        service_breakdown: periodSummary.services,
        apify_account: {
          usage_usd: financialComplete ? consolidado.usageUsd : null,
          limit_usd: financialComplete ? consolidado.limitUsd : null,
          remaining_usd: financialComplete ? consolidado.remainingUsd : null,
          included_credits_usd: financialComplete ? consolidado.includedCreditsUsd : null,
          included_credits_remaining_usd: financialComplete
            ? consolidado.includedCreditsRemainingUsd
            : null,
          hard_limit_usd: financialComplete ? consolidado.limitUsd : null,
          hard_remaining_usd: financialComplete ? consolidado.remainingUsd : null,
          financial_complete: financialComplete,
          financial_sync_error:
            financialAccountErrors.length > 0 ? financialAccountErrors.join(" | ") : null,
          synced_at: new Date().toISOString(),
          reconciled_runs: reconciledRuns,
          accounts,
          sync_error: accountErrors.length > 0 ? accountErrors.join(" | ") : null,
        },
      });
    }

    // ═══ POOL DE CHAVES APIFY (rodízio por esgotamento) ═══
    // O valor da chave NUNCA volta em nenhuma ação — só ultimos4/status/metadados.

    // Testa uma chave contra /users/me + /users/me/limits (grátis) e PERSISTE o resultado —
    // sucesso, falha COM O MOTIVO REAL da Apify, ou "resposta ilegível". Usado pelo botão
    // "Testar" e automaticamente ao adicionar.
    const testarChaveApify = async (id: string, tokenChave: string) => {
      const agora = new Date().toISOString();
      let resultado: Rec;
      let patch: Rec;
      const consulta = await consultarContaFinanceiraApify(tokenChave);
      if (consulta.situacao === "invalida") {
        patch = {
          status: "invalida",
          testada_em: agora,
          teste_ok: false,
          teste_detalhe: consulta.motivo,
          atualizado_em: agora,
        };
        resultado = { ok: true, situacao: "invalida", motivo: consulta.motivo };
      } else if (consulta.situacao === "erro") {
        const motivo = `falha ao sincronizar conta Apify: ${consulta.motivo}`;
        patch = { testada_em: agora, teste_ok: false, teste_detalhe: motivo, atualizado_em: agora };
        resultado = { ok: true, situacao: "ilegivel", motivo };
      } else {
        const conta = consulta.conta;
        patch = {
          testada_em: agora,
          teste_ok: true,
          teste_detalhe: null,
          // O campo legado alimenta o rodizio/painel e deve refletir quanto ainda pode ser
          // consumido antes do bloqueio configurado, nao apenas os creditos incluidos no plano.
          credito_estimado: conta.hardRemainingUsd,
          atualizado_em: agora,
        };
        resultado = {
          ok: true,
          situacao: "ok",
          restante: conta.hardRemainingUsd,
          max: conta.hardLimitUsd,
          uso: conta.usageUsd,
          conta_apify_id: conta.accountId,
          conta_apify_username: conta.username,
          creditos_plano_usd: conta.planCreditsUsd,
          uso_mensal_usd: conta.usageUsd,
          saldo_creditos_usd: conta.planRemainingUsd,
          limite_duro_usd: conta.hardLimitUsd,
          saldo_limite_usd: conta.hardRemainingUsd,
          ciclo_inicio: conta.cycleStartAt,
          ciclo_fim: conta.cycleEndAt,
          saldo_sincronizado_em: agora,
        };
      }
      const { error: persistenciaError } = await admin
        .from("apify_chaves")
        .update(patch)
        .eq("id", id);
      if (persistenciaError) {
        return {
          ok: false,
          situacao: "persistencia",
          motivo: `A Apify respondeu, mas nao foi possivel salvar o teste: ${persistenciaError.message}`,
        };
      }
      return resultado;
    };

    if (acao === "apify_pool_listar") {
      const { data: chaves, error: chavesError } = await admin
        .from("apify_chaves")
        .select(
          "id, apelido, ultimos4, ordem, status, esgotada_em, ultimo_uso, credito_estimado, criado_em, testada_em, teste_ok, teste_detalhe, valor_cifrado",
        )
        .order("ordem", { ascending: true });
      if (chavesError) {
        return json(
          {
            ok: false,
            reason: "erro_pool",
            detalhe: `Falha ao ler o pool: ${chavesError.message}`,
          },
          500,
        );
      }
      const sincronizadas = await Promise.all(
        (chaves ?? []).map(async (chave: Rec) => {
          const publica = { ...chave };
          delete publica.valor_cifrado;
          try {
            const token = await decifrar(String(chave.valor_cifrado));
            const consulta = await consultarContaFinanceiraApify(token);
            if (consulta.situacao === "ok") {
              const conta = consulta.conta;
              const sincronizadaEm = new Date().toISOString();
              return {
                ...publica,
                credito_estimado: conta.hardRemainingUsd,
                testada_em: sincronizadaEm,
                teste_ok: true,
                teste_detalhe: null,
                conta_apify_id: conta.accountId,
                conta_apify_username: conta.username,
                creditos_plano_usd: conta.planCreditsUsd,
                uso_mensal_usd: conta.usageUsd,
                saldo_creditos_usd: conta.planRemainingUsd,
                limite_duro_usd: conta.hardLimitUsd,
                saldo_limite_usd: conta.hardRemainingUsd,
                ciclo_inicio: conta.cycleStartAt,
                ciclo_fim: conta.cycleEndAt,
                saldo_sincronizado_em: sincronizadaEm,
                saude_live: "ok",
              };
            }
            return {
              ...publica,
              testada_em: new Date().toISOString(),
              teste_ok: false,
              teste_detalhe: consulta.motivo,
              saude_live: consulta.situacao,
            };
          } catch (error) {
            return {
              ...publica,
              teste_ok: false,
              teste_detalhe: `cofre ilegível: ${error instanceof Error ? error.message : String(error)}`,
              saude_live: "erro",
            };
          }
        }),
      );
      // gasto acumulado por chave (livro-caixa: redes sociais + google maps)
      const [gastosRedesResult, gastosMapsResult, ultimaBuscaResult, auditoriaResult] = await Promise.all([
        admin
          .from("redes_buscas")
          .select("chave_apelido, custo_usd")
          .not("chave_apelido", "is", null),
        admin
          .from("api_consumption_logs")
          .select("metadata, cost_usd")
          .eq("service", "apify_maps"),
        admin
          .from("redes_buscas")
          .select("chave_apelido, fonte, estrategia, custo_usd, criado_em, status")
          .not("chave_apelido", "is", null)
          .order("criado_em", { ascending: false })
          .limit(1)
          .maybeSingle(),
        admin
          .from("apify_chaves_auditoria")
          .select("apelido, acao, alterado_por, alterado_em")
          .order("alterado_em", { ascending: false })
          .limit(20),
      ]);
      const poolQueryError = [
        gastosRedesResult.error,
        gastosMapsResult.error,
        ultimaBuscaResult.error,
        auditoriaResult.error,
      ].find(Boolean);
      if (poolQueryError) {
        return json(
          {
            ok: false,
            reason: "erro_pool",
            detalhe: `Falha ao completar os dados do pool: ${poolQueryError.message}`,
          },
          500,
        );
      }
      const gastosRedes = gastosRedesResult.data;
      const gastosMaps = gastosMapsResult.data;
      const ultimaBusca = ultimaBuscaResult.data;
      const auditoria = auditoriaResult.data;
      const gastoPorChave = new Map<string, number>();
      
      for (const g of gastosRedes ?? []) {
        gastoPorChave.set(
          g.chave_apelido as string,
          (gastoPorChave.get(g.chave_apelido as string) ?? 0) + Number(g.custo_usd ?? 0),
        );
      }
      for (const g of gastosMaps ?? []) {
        // A API de consumo salva a chave em metadata.key_label
        const apelido = (g.metadata as any)?.key_label;
        if (apelido && typeof apelido === "string") {
          gastoPorChave.set(
            apelido,
            (gastoPorChave.get(apelido) ?? 0) + Number(g.cost_usd ?? 0),
          );
        }
      }
      const primeiraChaveDaConta = new Map<string, string>();
      const lista = sincronizadas.map((c: Rec) => {
        const accountId = typeof c.conta_apify_id === "string" ? c.conta_apify_id : null;
        const compartilhadaCom = accountId ? (primeiraChaveDaConta.get(accountId) ?? null) : null;
        if (accountId && !compartilhadaCom) primeiraChaveDaConta.set(accountId, String(c.apelido));
        return {
          ...c,
          conta_compartilhada_com: compartilhadaCom,
          gasto_acumulado: gastoPorChave.get(String(c.apelido)) ?? 0,
        };
      });
      const ativas = lista.filter((c: Rec) => c.status === "ativa").length;
      const contasAtivas = new Set(
        lista
          .filter(
            (c: Rec) =>
              c.status === "ativa" &&
              c.saude_live === "ok" &&
              Number(c.saldo_limite_usd) > 0.1 &&
              typeof c.conta_apify_id === "string",
          )
          .map((c: Rec) => String(c.conta_apify_id)),
      ).size;
      const contasSaudeDesconhecida = lista.filter(
        (c: Rec) => c.status === "ativa" && c.saude_live === "erro",
      ).length;
      return json({
        ok: true,
        chaves: lista,
        ativas,
        contas_ativas: contasAtivas,
        contas_saude_desconhecida: contasSaudeDesconhecida,
        ultima_busca: ultimaBusca ?? null,
        auditoria: auditoria ?? [],
      });
    }

    if (acao === "apify_chave_add") {
      const apelido = String(b.apelido || "").trim();
      const valor = String(b.valor || "").trim();
      if (!apelido) return json({ ok: false, reason: "apelido_obrigatorio" });
      // validação de formato: token da Apify começa com "apify_api_"; e-mail/espaço é
      // claramente OUTRA coisa (o dono chegou a colar o e-mail achando que era o campo)
      if (valor.includes("@") || /\s/.test(valor) || valor.length < 20)
        return json({ ok: false, reason: "formato_invalido" });
      const { data: ult } = await admin
        .from("apify_chaves")
        .select("ordem")
        .order("ordem", { ascending: false })
        .limit(1)
        .maybeSingle();
      const { data: nova, error } = await admin
        .from("apify_chaves")
        .insert({
          apelido,
          valor_cifrado: await cifrar(valor),
          ultimos4: valor.slice(-4),
          ordem: (ult?.ordem ?? -1) + 1,
          criado_por: userData.user.id,
        })
        .select("id")
        .single();
      if (error || !nova) {
        if ((error as { code?: string } | null)?.code === "23505")
          return json({ ok: false, reason: "apelido_duplicado" });
        return json({ ok: false, reason: "erro_salvar", detalhe: error?.message });
      }
      await admin
        .from("apify_chaves_auditoria")
        .insert({ apelido, acao: "adicionada", alterado_por: userData.user.id });
      // TESTE AUTOMÁTICO na hora — o dono vê imediatamente se a chave funciona
      const teste = await testarChaveApify(nova.id, valor);
      return json({ ok: true, id: nova.id, teste });
    }

    if (acao === "apify_chave_importar_secret") {
      // migra a chave única (cofre/secret APIFY_API_TOKEN) pro pool — o valor NUNCA sai do
      // servidor: resolve aqui, cifra aqui, grava aqui. Útil na virada pro rodízio.
      const apelido = String(b.apelido || "principal").trim();
      const valor = await resolverChave(admin, "APIFY_API_TOKEN");
      if (!valor) return json({ ok: false, reason: "secret_ausente" });
      const { data: ult } = await admin
        .from("apify_chaves")
        .select("ordem")
        .order("ordem", { ascending: false })
        .limit(1)
        .maybeSingle();
      const { error } = await admin.from("apify_chaves").insert({
        apelido,
        valor_cifrado: await cifrar(valor),
        ultimos4: valor.slice(-4),
        ordem: (ult?.ordem ?? -1) + 1,
        criado_por: userData.user.id,
      });
      if (error) {
        if ((error as { code?: string }).code === "23505")
          return json({ ok: false, reason: "apelido_duplicado" });
        return json({ ok: false, reason: "erro_salvar", detalhe: error.message });
      }
      await admin
        .from("apify_chaves_auditoria")
        .insert({ apelido, acao: "importada_do_cofre", alterado_por: userData.user.id });
      return json({ ok: true, ultimos4: valor.slice(-4) });
    }

    if (acao === "apify_chave_remove") {
      const id = String(b.id || "");
      const { data: linha } = await admin
        .from("apify_chaves")
        .delete()
        .eq("id", id)
        .select("apelido")
        .maybeSingle();
      if (!linha) return json({ ok: false, reason: "nao_encontrada" });
      await admin
        .from("apify_chaves_auditoria")
        .insert({ apelido: linha.apelido, acao: "removida", alterado_por: userData.user.id });
      return json({ ok: true });
    }

    if (acao === "apify_chave_status") {
      const id = String(b.id || "");
      const status = String(b.status || "");
      if (!["ativa", "esgotada", "invalida", "desativada"].includes(status))
        return json({ ok: false, reason: "status_invalido" });
      const agora = new Date().toISOString();
      const { data: linha } = await admin
        .from("apify_chaves")
        .update({
          status,
          atualizado_em: agora,
          esgotada_em: status === "esgotada" ? agora : null,
        })
        .eq("id", id)
        .select("apelido")
        .maybeSingle();
      if (!linha) return json({ ok: false, reason: "nao_encontrada" });
      await admin.from("apify_chaves_auditoria").insert({
        apelido: linha.apelido,
        acao: `${status}_manual`,
        alterado_por: userData.user.id,
      });
      return json({ ok: true });
    }

    if (acao === "apify_chave_ordem") {
      const id = String(b.id || "");
      const direcao = b.direcao === "subir" ? "subir" : "descer";
      const { data: atual } = await admin
        .from("apify_chaves")
        .select("id, ordem")
        .eq("id", id)
        .maybeSingle();
      if (!atual) return json({ ok: false, reason: "nao_encontrada" });
      const { data: vizinho } = await admin
        .from("apify_chaves")
        .select("id, ordem")
        [direcao === "subir" ? "lt" : "gt"]("ordem", atual.ordem)
        .order("ordem", { ascending: direcao === "descer" })
        .limit(1)
        .maybeSingle();
      if (!vizinho) return json({ ok: true, semMudanca: true });
      await admin.from("apify_chaves").update({ ordem: vizinho.ordem }).eq("id", atual.id);
      await admin.from("apify_chaves").update({ ordem: atual.ordem }).eq("id", vizinho.id);
      return json({ ok: true });
    }

    if (acao === "apify_chave_testar") {
      // chamada MÍNIMA e GRÁTIS (GET /users/me/limits) — valida a chave, mede o crédito e
      // PERSISTE o resultado (sucesso/motivo real da falha) pra tela mostrar sempre.
      const id = String(b.id || "");
      const { data: linha } = await admin
        .from("apify_chaves")
        .select("id, apelido, valor_cifrado")
        .eq("id", id)
        .maybeSingle();
      if (!linha) return json({ ok: false, reason: "nao_encontrada" });
      let tokenChave: string;
      try {
        tokenChave = await decifrar(linha.valor_cifrado);
      } catch {
        const agora = new Date().toISOString();
        await admin
          .from("apify_chaves")
          .update({
            testada_em: agora,
            teste_ok: false,
            teste_detalhe: "valor no cofre ilegível (chave-mestra trocada?) — recadastre a chave",
            atualizado_em: agora,
          })
          .eq("id", id);
        return json({ ok: false, reason: "cofre_ilegivel" });
      }
      const resultado = await testarChaveApify(id, tokenChave);
      if (resultado.situacao === "invalida") {
        await admin.from("apify_chaves_auditoria").insert({
          apelido: linha.apelido,
          acao: "invalida_teste",
          alterado_por: userData.user.id,
        });
      }
      return json(resultado);
    }

    if (acao === "apify_simular_esgotamento") {
      // Demonstra o rodízio SEM gastar crédito: marca a chave como esgotada (o MESMO
      // caminho da marcação real) e responde quem assume em seguida. Reativação é manual.
      const id = String(b.id || "");
      const agora = new Date().toISOString();
      const { data: linha } = await admin
        .from("apify_chaves")
        .update({ status: "esgotada", esgotada_em: agora, atualizado_em: agora })
        .eq("id", id)
        .select("apelido")
        .maybeSingle();
      if (!linha) return json({ ok: false, reason: "nao_encontrada" });
      await admin.from("apify_chaves_auditoria").insert({
        apelido: linha.apelido,
        acao: "esgotada_simulacao",
        alterado_por: userData.user.id,
      });
      // quem assume: a chave ATIVA de menor ordem (a mesma seleção do rodízio real)
      const { data: proxima } = await admin
        .from("apify_chaves")
        .select("apelido")
        .eq("status", "ativa")
        .order("ordem", { ascending: true })
        .limit(1)
        .maybeSingle();
      return json({
        ok: true,
        esgotada: linha.apelido,
        proxima: proxima?.apelido ?? null,
      });
    }

    return json({ ok: false, reason: "acao_desconhecida" });
  } catch (e) {
    return json({ ok: false, reason: "erro", detalhe: e instanceof Error ? e.message : String(e) });
  }
});
