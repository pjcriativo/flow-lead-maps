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

  const dono = (rows: Rec[] | null | undefined) =>
    (rows ?? []).map((r) => ({ ...r, dono: emailDe.get(String(r.user_id)) ?? "?" }));

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
    },
    usuarios: (usuarios ?? []).map((u: Rec) => ({
      email: u.email,
      plan: u.plan,
      created_at: u.created_at,
    })),
    statusCampanhas: [...campanhasStatus.entries()].map(([status, total]) => ({ status, total })),
    serie14d: [...porDia.values()],
    leadsRecentes: dono(leadsRec.data as Rec[]),
    campanhasRecentes: dono(campsRec.data as Rec[]),
    buscasRecentes: dono(buscasRec.data as Rec[]),
  });
});
