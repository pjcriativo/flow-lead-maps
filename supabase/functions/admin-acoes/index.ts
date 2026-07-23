// Edge: admin-acoes — mutações das telas de admin (Roles/Staffs/Users). Guard super_admin
// SERVER-SIDE em toda ação (o client é só UX). Tudo escrito com service role, escopado à org
// do super admin (roles/staffs) ou à plataforma (users).
//
// Ações:
//   role_toggle  { papel, ativo }               → liga/desliga um papel na org do admin (org_papeis)
//   staff_add    { email, papel }               → cria (ou acha) o usuário e o vincula à org
//   staff_remove { user_id }                     → remove o membership (não apaga a conta)
//   user_add     { email, papel? }               → cria conta + org própria (admin) ou vincula
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { corsHeaders, json } from "../_shared/cors.ts";
import { cifrar } from "../_shared/cofre.ts";
import { resolverChave } from "../_shared/chaves.ts";

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
      return json({ ok: true, user_id: u.id, email });
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
      const filtroData = (q: ReturnType<typeof admin.from>) => {
        let r = q;
        if (desde) r = r.gte("created_at", desde);
        if (ate) r = r.lte("created_at", ate);
        return r;
      };

      const { data: leadsRows } = await filtroData(
        admin.from("leads").select("origem_fonte, origem_estrategia, status, motivo_perda"),
      );
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
        const fonte = (r.origem_fonte as string | null) ?? "google_maps";
        porFonte.set(fonte, (porFonte.get(fonte) ?? 0) + 1);
        if (r.origem_estrategia)
          porEstrategia.set(
            r.origem_estrategia as string,
            (porEstrategia.get(r.origem_estrategia as string) ?? 0) + 1,
          );
        const st = r.status as string;
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

    return json({ ok: false, reason: "acao_desconhecida" });
  } catch (e) {
    return json({ ok: false, reason: "erro", detalhe: e instanceof Error ? e.message : String(e) });
  }
});
