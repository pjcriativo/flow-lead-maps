// Edge: admin-metricas — o painel /admin de VERDADE (visão da PLATAFORMA, multi-org).
//
// 🔒 GUARD SERVER-SIDE: getUser (JWT) → profiles.is_super_admin TEM que ser true (checado com
// service role; a coluna é imutável pela API — migration 041). Não-admin recebe 403 — o guard
// do client é só UX, ESTE é o que vale.
// 📊 Agregação com service role (atravessa todas as orgs): cada campo do retorno alimenta UM
// card/gráfico/tabela do painel — a rastreabilidade continua 1:1, agora da plataforma inteira.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { corsHeaders, json } from "../_shared/cors.ts";
import { buildApiUsagePeriodSummary } from "../_shared/api-usage-summary.ts";
import { collectUniqueOffsetPages } from "../_shared/offset-pagination.ts";

type Rec = Record<string, unknown>;

function dateKey(value: string | Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(typeof value === "string" ? new Date(value) : value);
}

function lastDateKeys(days: number, timeZone: string): string[] {
  const now = new Date();
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(now);
    date.setUTCDate(now.getUTCDate() - (days - index - 1));
    return dateKey(date, timeZone);
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
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

  // papel checado NO SERVIDOR — e-mail não entra aqui: só o flag do banco vale
  const { data: perfil } = await admin
    .from("profiles")
    .select("is_super_admin, email")
    .eq("id", userData.user.id)
    .maybeSingle();
  if (perfil?.is_super_admin !== true) return json({ error: "Acesso negado" }, 403);

  const head = { count: "exact" as const, head: true };
  const contar = async (q: PromiseLike<{ count: number | null }>) => (await q).count ?? 0;

  // usuários (todas as orgs) — id→email para rotular o dono em cada linha das tabelas
  const { data: usuarios } = await admin
    .from("profiles")
    .select(
      "id, email, plan, plan_status, trial_ends_at, phone, created_at, acesso_liberado, is_super_admin, full_name",
    )
    .order("created_at", { ascending: true });
  const emailDe = new Map<string, string>(
    (usuarios ?? []).map((u: Rec) => [String(u.id), String(u.email ?? "?")]),
  );

  // Orgs dos donos — para enriquecer a lista de usuários com plano real, overrides e bônus
  const { data: orgsUsuarios } = await admin
    .from("orgs")
    .select(
      "id, nome, dono_user_id, plano_id, limite_leads_override, limite_sites_override, sites_bonus",
    );
  // Mapeia dono_user_id -> {plano_id, leads_override, sites_override, sites_bonus}
  const orgDe = new Map<
    string,
    {
      plano_id: string | null;
      org_id: string;
      org_nome: string;
      leads_override: number | null;
      sites_override: number | null;
      sites_bonus: number;
    }
  >(
    (orgsUsuarios ?? []).map((o: Rec) => [
      String(o.dono_user_id),
      {
        org_id: String(o.id),
        org_nome: String(o.nome ?? ""),
        plano_id: String(o.plano_id ?? "") || null,
        leads_override: o.limite_leads_override as number | null,
        sites_override: o.limite_sites_override as number | null,
        sites_bonus: (o.sites_bonus as number) ?? 0,
      },
    ]),
  );

  // card real do dashboard: tickets abertos/em andamento, TODAS as orgs
  const { count: ticketsAbertos } = await admin
    .from("tickets")
    .select("id", { count: "exact", head: true })
    .in("status", ["aberto", "em_andamento"]);

  // org do super admin (para as telas Roles/Staffs, que operam na org dele)
  const { data: minhaOrg } = await admin
    .from("memberships")
    .select("org_id")
    .eq("user_id", userData.user.id)
    .order("criada_em", { ascending: true })
    .limit(1)
    .maybeSingle();
  const orgAdmin = minhaOrg?.org_id ?? null;

  // Roles: papéis da org do admin com toggle real (org_papeis)
  const { data: rolesRows } = orgAdmin
    ? await admin.from("org_papeis").select("papel, ativo").eq("org_id", orgAdmin)
    : { data: [] as Rec[] };
  // Staffs: membros da org do admin (memberships + profile)
  const { data: staffRows } = orgAdmin
    ? await admin.from("memberships").select("user_id, papel, criada_em").eq("org_id", orgAdmin)
    : { data: [] as Rec[] };
  const staffIds = (staffRows ?? []).map((s: Rec) => String(s.user_id));
  const perfisStaff = staffIds.length
    ? await admin.from("profiles").select("id, email, full_name").in("id", staffIds)
    : { data: [] as Rec[] };
  const staffPerfil = new Map((perfisStaff.data ?? []).map((p: Rec) => [String(p.id), p]));

  const inicio14 = new Date();
  inicio14.setDate(inicio14.getDate() - 13);
  inicio14.setHours(0, 0, 0, 0);
  const iso14 = inicio14.toISOString();
  const mesRef = new Date().toISOString().slice(0, 7);
  const inicioMes = new Date(`${mesRef}-01T00:00:00.000Z`);
  const inicioOperacao = inicioMes < inicio14 ? inicioMes : inicio14;
  const { data: config } = await admin
    .from("config_plataforma")
    .select("fuso_horario")
    .eq("id", true)
    .maybeSingle();
  const timeZone = String(config?.fuso_horario || "America/Sao_Paulo");
  const diasOperacao = lastDateKeys(14, timeZone);
  const hojeKey = dateKey(new Date(), timeZone);

  const apiLogs = await collectUniqueOffsetPages<Rec>(
    async (offset, limit) => {
      const { data, error, count } = await admin
        .from("api_consumption_logs")
        .select("id,user_id,org_id,service,action,quantity,cost_usd,cost_brl,created_at,metadata", {
          count: "exact",
        })
        .gte("created_at", inicioOperacao.toISOString())
        .order("created_at", { ascending: true })
        .range(offset, offset + limit - 1);
      if (error) throw new Error(`Falha ao carregar consumo de APIs: ${error.message}`);
      return { items: (data ?? []) as Rec[], total: count };
    },
    (row) => String(row.id),
  );

  const [
    leads,
    campanhasRows,
    chips,
    chipsProntos,
    disparos,
    conversas,
    buscasMaps,
    buscasRedes,
    sites,
    fuRows,
    leadsSerie,
    enviosSerie,
    leadsRec,
    campsRec,
    buscasRec,
    scrapeRows,
    categoriaRows,
    templatesWa,
    leadsAcionaveis,
    aprovadosDisparo,
    clPorCampanha,
    enviosPorCampanha,
    propostasEnviadas,
    planosRows,
    membershipsRows,
    consumoRows,
    whatsappRows,
  ] = await Promise.all([
    contar(admin.from("leads").select("id", head)),
    admin.from("campanhas").select("status"),
    contar(admin.from("wa_instancias").select("id", head)),
    contar(
      admin
        .from("wa_instancias")
        .select("id", head)
        .eq("status", "conectado")
        .not("numero", "is", null),
    ),
    contar(admin.from("wa_envios").select("id", head)),
    contar(admin.from("wa_mensagens").select("id", head)),
    contar(admin.from("lead_lists").select("id", head)),
    contar(admin.from("redes_buscas").select("id", head).neq("fonte", "ia_site")),
    contar(admin.from("sites_publicados").select("id", head)),
    admin.from("propostas").select("follow_up_count").gt("follow_up_count", 0),
    admin.from("leads").select("created_at").gte("created_at", iso14),
    admin.from("wa_envios").select("enviado_em").gte("enviado_em", iso14),
    admin
      .from("leads")
      .select("id, user_id, business_name, city, created_at")
      .order("created_at", { ascending: false })
      .limit(6),
    admin
      .from("campanhas")
      .select("id, user_id, nome, canal, status, criada_em")
      .order("criada_em", { ascending: false })
      .limit(5),
    admin
      .from("redes_buscas")
      .select(
        "id, user_id, fonte, estrategia, status, inseridos, custo_usd, criado_em, chave_apelido",
      )
      .order("criado_em", { ascending: false })
      .limit(8),
    // Snapshot: buscas por status (ativas/concluídas/paradas no teto/erro) — livro-caixa
    admin.from("redes_buscas").select("status"),
    // Snapshot: segmentos = categorias reais dos leads (top N por contagem)
    admin.from("leads").select("category").not("category", "is", null).limit(2000),
    // Snapshot: modelos de mensagem = scripts de WhatsApp cadastrados
    contar(admin.from("wa_scripts").select("id", head)),
    // Snapshot: leads acionáveis = têm ao menos um canal de contato
    contar(admin.from("leads").select("id", head).or("sem_contato.is.null,sem_contato.eq.false")),
    // Snapshot: aprovados para disparo (portão de campanha)
    contar(admin.from("campanha_leads").select("id", head).eq("estado", "aprovado")),
    // Recent Campaigns: enviados x/total por campanha (real: campanha_leads + envios/propostas)
    admin.from("campanha_leads").select("campanha_id"),
    admin.from("wa_envios").select("campanha_id"),
    admin.from("propostas").select("campanha_id").eq("status", "enviada"),
    admin
      .from("planos")
      .select(
        "id, nome, descricao, preco, periodo, limite_leads, limite_sites, limite_campanhas, limite_mensagens, limite_whatsapp, limite_templates, limite_segmentos, has_instagram_search, has_linkedin_search, has_propostas, has_contratos, has_financeiro, has_whatsapp, has_redesign, has_publicar, ativo, ordem",
      )
      .order("ordem", { ascending: true }),
    admin.from("memberships").select("user_id,org_id,criada_em").order("criada_em"),
    admin
      .from("consumo_org")
      .select("org_id,leads,sites,campanhas,mensagens")
      .eq("mes_ref", mesRef),
    admin
      .from("wa_instancias")
      .select("id,user_id,org_id,nome,numero,status,ultima_checagem_em,atualizado_em"),
  ]);

  const campanhasStatus = new Map<string, number>();
  for (const r of campanhasRows.data ?? [])
    campanhasStatus.set(String(r.status), (campanhasStatus.get(String(r.status)) ?? 0) + 1);

  const porDia = new Map<string, { dia: string; leads: number; disparos: number }>();
  for (let i = 0; i < 14; i++) {
    const d = new Date(inicio14);
    d.setDate(inicio14.getDate() + i);
    porDia.set(d.toISOString().slice(0, 10), {
      dia: `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
      leads: 0,
      disparos: 0,
    });
  }
  for (const r of leadsSerie.data ?? []) {
    const p = porDia.get(String(r.created_at).slice(0, 10));
    if (p) p.leads++;
  }
  for (const r of enviosSerie.data ?? []) {
    const p = porDia.get(String(r.enviado_em).slice(0, 10));
    if (p) p.disparos++;
  }

  const dono = (rows: Rec[] | null | undefined): Rec[] =>
    (rows ?? []).map((r) => ({ ...r, dono: emailDe.get(String(r.user_id)) ?? "?" }));

  // Snapshot: agregações leves feitas aqui (dado cru já veio das queries acima)
  const scrape = { rodando: 0, concluidas: 0, paradasTeto: 0, erros: 0 };
  for (const r of scrapeRows.data ?? []) {
    if (r.status === "rodando") scrape.rodando++;
    else if (r.status === "concluida") scrape.concluidas++;
    else if (r.status === "parada_teto") scrape.paradasTeto++;
    else if (r.status === "erro") scrape.erros++;
  }
  const porCategoria = new Map<string, number>();
  for (const r of categoriaRows.data ?? []) {
    const c = String(r.category).trim();
    if (c) porCategoria.set(c, (porCategoria.get(c) ?? 0) + 1);
  }
  const segmentos = [...porCategoria.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([categoria, total]) => ({ categoria, total }));

  const totalPorCampanha = new Map<string, number>();
  for (const r of clPorCampanha.data ?? [])
    totalPorCampanha.set(
      String(r.campanha_id),
      (totalPorCampanha.get(String(r.campanha_id)) ?? 0) + 1,
    );
  const enviadosPorCampanha = new Map<string, number>();
  for (const r of [...(enviosPorCampanha.data ?? []), ...(propostasEnviadas.data ?? [])]) {
    if (!r.campanha_id) continue;
    enviadosPorCampanha.set(
      String(r.campanha_id),
      (enviadosPorCampanha.get(String(r.campanha_id)) ?? 0) + 1,
    );
  }

  const logsMes = apiLogs.filter((row) =>
    dateKey(String(row.created_at), timeZone).startsWith(mesRef),
  );
  const resumoApiMes = buildApiUsagePeriodSummary({
    profiles: (usuarios ?? []).map((row: Rec) => ({
      id: String(row.id),
      email: row.email ? String(row.email) : null,
      full_name: row.full_name ? String(row.full_name) : null,
      is_super_admin: row.is_super_admin === true,
      plan: row.plan ? String(row.plan) : null,
    })),
    memberships: (membershipsRows.data ?? []).map((row: Rec) => ({
      user_id: String(row.user_id),
      org_id: String(row.org_id),
      criada_em: row.criada_em ? String(row.criada_em) : null,
    })),
    orgs: (orgsUsuarios ?? []).map((row: Rec) => ({
      id: String(row.id),
      nome: row.nome ? String(row.nome) : null,
      plano_id: row.plano_id ? String(row.plano_id) : null,
      dono_user_id: row.dono_user_id ? String(row.dono_user_id) : null,
    })),
    plans: (planosRows.data ?? []).map((row: Rec) => ({
      id: String(row.id),
      nome: row.nome ? String(row.nome) : null,
      limite_leads: row.limite_leads === null ? null : Number(row.limite_leads),
      preco: row.preco === null ? null : Number(row.preco),
    })),
    orgConsumption: (consumoRows.data ?? []).map((row: Rec) => ({
      org_id: String(row.org_id),
      leads: row.leads === null ? null : Number(row.leads),
    })),
    logs: logsMes.map((row) => ({
      user_id: row.user_id ? String(row.user_id) : null,
      org_id: row.org_id ? String(row.org_id) : null,
      service: String(row.service),
      action: row.action ? String(row.action) : null,
      quantity: row.quantity === null ? null : Number(row.quantity),
      cost_usd: row.cost_usd === null ? null : Number(row.cost_usd),
      cost_brl: row.cost_brl === null ? null : Number(row.cost_brl),
    })),
  });
  const resumoApiPorUsuario = new Map(
    resumoApiMes.users.map((summary) => [summary.user_id, summary]),
  );
  const consumoPorOrg = new Map(
    (consumoRows.data ?? []).map((row: Rec) => [String(row.org_id), row]),
  );
  const whatsappPorUsuario = new Map<
    string,
    {
      total: number;
      conectados: number;
      numeros: { id: string; nome: string; numero: string | null; status: string }[];
    }
  >();
  for (const row of whatsappRows.data ?? []) {
    const userId = String(row.user_id);
    const current = whatsappPorUsuario.get(userId) ?? { total: 0, conectados: 0, numeros: [] };
    current.total += 1;
    if (row.status === "conectado" && row.numero) current.conectados += 1;
    current.numeros.push({
      id: String(row.id),
      nome: String(row.nome),
      numero: row.numero ? String(row.numero) : null,
      status: String(row.status),
    });
    whatsappPorUsuario.set(userId, current);
  }

  type DiaCusto = { data: string; custo_usd: number; requisicoes: number };
  const seriePlataforma = new Map<string, DiaCusto>(
    diasOperacao.map((data) => [data, { data, custo_usd: 0, requisicoes: 0 }]),
  );
  const seriePorUsuario = new Map<string, Map<string, DiaCusto>>();
  const ultimaAtividadePorUsuario = new Map<
    string,
    { em: string; servico: string; acao: string }
  >();
  const custoHojePorUsuario = new Map<string, number>();
  let custoHojeUsd = 0;
  for (const row of apiLogs) {
    const data = dateKey(String(row.created_at), timeZone);
    const cost = Number(row.cost_usd ?? 0);
    const platformDay = seriePlataforma.get(data);
    if (platformDay) {
      platformDay.custo_usd += cost;
      platformDay.requisicoes += 1;
    }
    if (data === hojeKey) custoHojeUsd += cost;
    if (!row.user_id) continue;
    const userId = String(row.user_id);
    if (data === hojeKey)
      custoHojePorUsuario.set(userId, (custoHojePorUsuario.get(userId) ?? 0) + cost);
    const userSeries =
      seriePorUsuario.get(userId) ??
      new Map(diasOperacao.map((day) => [day, { data: day, custo_usd: 0, requisicoes: 0 }]));
    const userDay = userSeries.get(data);
    if (userDay) {
      userDay.custo_usd += cost;
      userDay.requisicoes += 1;
    }
    seriePorUsuario.set(userId, userSeries);
    ultimaAtividadePorUsuario.set(userId, {
      em: String(row.created_at),
      servico: String(row.service),
      acao: String(row.action ?? "uso_registrado"),
    });
  }

  return json({
    ok: true,
    geradoPor: perfil.email,
    kpis: {
      usuarios: (usuarios ?? []).length,
      leads,
      campanhas: (campanhasRows.data ?? []).length,
      campanhasAtivas: campanhasStatus.get("ativa") ?? 0,
      chips,
      chipsProntos,
      disparos,
      conversas,
      buscasMaps,
      buscasRedes,
      sites,
      followups: (fuRows.data ?? []).reduce(
        (s: number, r: Rec) => s + Number(r.follow_up_count ?? 0),
        0,
      ),
      gastoMesUsd: resumoApiMes.totalCostUsd,
      tetoMesUsd: 50,
      ticketsAbertos: ticketsAbertos ?? 0,
    },
    usuarios: (usuarios ?? []).map((u: Rec) => {
      const orgInfo = orgDe.get(String(u.id));
      // Resolver nome do plano a partir do UUID (planosRows já foi buscado acima)
      const planoRow = orgInfo?.plano_id
        ? (planosRows.data ?? []).find((p: Rec) => String(p.id) === orgInfo.plano_id)
        : null;
      const api = resumoApiPorUsuario.get(String(u.id));
      const consumo = orgInfo ? consumoPorOrg.get(orgInfo.org_id) : undefined;
      const whatsapp = whatsappPorUsuario.get(String(u.id)) ?? {
        total: 0,
        conectados: 0,
        numeros: [],
      };
      return {
        id: u.id,
        email: u.email,
        full_name: u.full_name ?? null,
        plan: u.plan,
        plan_status: u.plan_status,
        trial_ends_at: u.trial_ends_at ?? null,
        phone: u.phone ?? null,
        org_id: orgInfo?.org_id ?? null,
        org_nome: orgInfo?.org_nome ?? null,
        plano_nome: (planoRow?.nome as string) ?? null,
        plano_id: orgInfo?.plano_id ?? null,
        leads_override: orgInfo?.leads_override ?? null,
        sites_override: orgInfo?.sites_override ?? null,
        sites_bonus: orgInfo?.sites_bonus ?? 0,
        created_at: u.created_at,
        acesso_liberado: u.acesso_liberado,
        is_super_admin: u.is_super_admin,
        operacao: {
          custo_hoje_usd: custoHojePorUsuario.get(String(u.id)) ?? 0,
          custo_mes_usd: api?.total_cost_usd ?? 0,
          custo_mes_brl: api?.total_cost_brl ?? 0,
          requisicoes_mes: api?.requests_count ?? 0,
          servicos: api?.services ?? [],
          serie_14d: [...(seriePorUsuario.get(String(u.id))?.values() ?? [])],
          ultima_atividade: ultimaAtividadePorUsuario.get(String(u.id)) ?? null,
          consumo_mes: {
            leads: Number(consumo?.leads ?? 0),
            sites: Number(consumo?.sites ?? 0),
            campanhas: Number(consumo?.campanhas ?? 0),
            mensagens: Number(consumo?.mensagens ?? 0),
          },
          whatsapp,
        },
      };
    }),
    operacaoUsuarios: {
      periodo: mesRef,
      fuso_horario: timeZone,
      custo_hoje_usd: custoHojeUsd,
      custo_mes_usd: resumoApiMes.totalCostUsd,
      custo_mes_brl: resumoApiMes.totalCostBrl,
      usuarios_com_custo_hoje: custoHojePorUsuario.size,
      whatsapp_total: whatsappRows.data?.length ?? 0,
      whatsapp_conectados: (whatsappRows.data ?? []).filter(
        (row) => row.status === "conectado" && Boolean(row.numero),
      ).length,
      custo_nao_atribuido_usd: resumoApiMes.unattributedCostUsd,
      serie_14d: [...seriePlataforma.values()],
    },
    statusCampanhas: [...campanhasStatus.entries()].map(([status, total]) => ({ status, total })),
    serie14d: [...porDia.values()],
    leadsRecentes: dono(leadsRec.data as Rec[]),
    campanhasRecentes: dono(campsRec.data as Rec[]).map((c) => ({
      ...c,
      total: totalPorCampanha.get(String(c.id)) ?? 0,
      enviados: enviadosPorCampanha.get(String(c.id)) ?? 0,
    })),
    buscasRecentes: dono(buscasRec.data as Rec[]),
    snapshot: {
      scrape,
      segmentos,
      templatesWa,
      leadsAcionaveis,
      aprovadosDisparo,
    },
    orgAdmin,
    // tela Roles: papéis da org do admin, com o estado do toggle (org_papeis.ativo)
    roles: (rolesRows ?? []).map((r: Rec) => ({ papel: r.papel, ativo: r.ativo })),
    // tela Staffs: colaboradores da org do admin (nome/email/papel)
    staffs: (staffRows ?? []).map((s: Rec) => {
      const p = staffPerfil.get(String(s.user_id)) as Rec | undefined;
      return {
        user_id: s.user_id,
        papel: s.papel,
        email: p?.email ?? "?",
        nome: (p?.full_name as string) ?? null,
        criada_em: s.criada_em,
      };
    }),
    // tela Subscribers: sem base de newsletter no produto → o painel mostra "Em breve"
    subscribers: null,
    // tela Planos: catálogo real (planos)
    planos: (planosRows.data ?? []) as Rec[],
  });
});
