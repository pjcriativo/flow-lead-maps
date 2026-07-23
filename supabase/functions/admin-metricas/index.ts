// Edge: admin-metricas — o painel /admin de VERDADE (visão da PLATAFORMA, multi-org).
//
// 🔒 GUARD SERVER-SIDE: getUser (JWT) → profiles.is_super_admin TEM que ser true (checado com
// service role; a coluna é imutável pela API — migration 041). Não-admin recebe 403 — o guard
// do client é só UX, ESTE é o que vale.
// 📊 Agregação com service role (atravessa todas as orgs): cada campo do retorno alimenta UM
// card/gráfico/tabela do painel — a rastreabilidade continua 1:1, agora da plataforma inteira.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { corsHeaders, json } from "../_shared/cors.ts";

type Rec = Record<string, unknown>;

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
    .select("id, email, plan, created_at")
    .order("created_at", { ascending: true });
  const emailDe = new Map<string, string>(
    (usuarios ?? []).map((u: Rec) => [String(u.id), String(u.email ?? "?")]),
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
    gastoRows,
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
    admin.from("redes_buscas").select("custo_usd").eq("mes_ref", mesRef),
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
      .select("id, user_id, fonte, estrategia, status, inseridos, custo_usd, criado_em")
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
        "id, nome, descricao, preco, periodo, limite_leads, limite_sites, limite_campanhas, limite_mensagens, limite_whatsapp, limite_templates, limite_segmentos, ativo, ordem",
      )
      .order("ordem", { ascending: true }),
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
      gastoMesUsd: (gastoRows.data ?? []).reduce(
        (s: number, r: Rec) => s + Number(r.custo_usd ?? 0),
        0,
      ),
      tetoMesUsd: 50,
      ticketsAbertos: ticketsAbertos ?? 0,
    },
    usuarios: (usuarios ?? []).map((u: Rec) => ({
      email: u.email,
      plan: u.plan,
      created_at: u.created_at,
    })),
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
