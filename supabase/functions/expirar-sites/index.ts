// Edge Function: expirar-sites (Fase 4) — roda 1x/dia (pg_cron via pg_net).
//
// POR QUE EXISTE: a copy do follow-up PROMETE "eu tiro essa página do ar em {N} dias". A rota
// /site/<slug> já cumpre a parte visível (410 depois do expira_em — confirmado em produção),
// mas o ARQUIVO continuava no Storage e o HTML no banco, para sempre. Esta função cumpre a
// parte invisível: passado o prazo, o arquivo some de verdade.
//
// O REGISTRO NUNCA É APAGADO. sites_publicados fica (leve) para histórico/métrica; só marca
// arquivos_removidos=true e status='expirado'. O que sai é o peso: o HTML.
//
// PROTEÇÃO (decisão do dono): lead que engajou não perde o site. Pular a limpeza NÃO bastaria
// — a rota expira pelo expira_em e o site sairia do ar mesmo com o arquivo intacto. Então,
// para lead protegido, o cron RENOVA o expira_em (+90d). A rota pública não é tocada.
// ⚠️ 'aprovado' da CAMPANHA é o dono aprovando o ENVIO, não o lead comprando — a proteção
// olha SÓ leads.status, nunca campanha_leads.estado.
//
// ÓRFÃOS: apagar o registro nunca apagou o arquivo — havia 228 kB de arquivos sem dono no
// Storage. A varredura também remove arquivo sem registro, mas só com +24h de vida: publicar
// faz upload ANTES de inserir a linha, e um órfão recém-nascido pode ser uma publicação em voo.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { json } from "../_shared/cors.ts";

const BUCKET = "sites-publicados";
const RENOVA_DIAS = 90;
const ORFAO_MIN_HORAS = 24;

/** Status de lead que PROTEGEM o site da expiração (decisão do dono). */
const STATUS_PROTEGIDOS = ["won", "meeting", "responded", "nurture"];

Deno.serve(async (req) => {
  if (req.method !== "POST" && req.method !== "GET")
    return json({ error: "Método não permitido" }, 405);

  const secret = Deno.env.get("CRON_SECRET");
  if (!secret || req.headers.get("x-cron-secret") !== secret)
    return json({ error: "Não autorizado" }, 401);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  // dry_run: só relata o que FARIA (não apaga nada). Útil pra conferir antes de soltar.
  let dryRun = false;
  if (req.method === "POST") {
    try {
      const b = await req.json();
      dryRun = !!b?.dry_run;
    } catch {
      /* corpo vazio */
    }
  }

  const agora = new Date();
  const removidos: Array<{ slug: string; lead: string; arquivo: boolean; html: boolean }> = [];
  const renovados: Array<{ slug: string; lead: string; status: string; novo_expira: string }> = [];
  const falhas: Array<{ slug: string; motivo: string }> = [];

  // Vencidos que ainda têm arquivo. arquivos_removidos=true já está limpo → IDEMPOTENTE:
  // a 2ª rodada não encontra o que a 1ª limpou.
  const { data: vencidos, error: qErr } = await admin
    .from("sites_publicados")
    .select("id, slug, lead_id, redesign_id, expira_em, leads!inner(id, business_name, status)")
    .eq("arquivos_removidos", false)
    .lt("expira_em", agora.toISOString());
  if (qErr) return json({ error: qErr.message }, 500);

  for (const s of (vencidos ?? []) as unknown as Array<{
    id: string;
    slug: string;
    lead_id: string;
    redesign_id: string | null;
    leads: { business_name: string | null; status: string };
  }>) {
    const nome = s.leads?.business_name ?? s.lead_id;

    // PROTEGIDO → renova o prazo em vez de limpar (senão a rota derruba o site do cliente).
    if (STATUS_PROTEGIDOS.includes(s.leads?.status)) {
      const novo = new Date(agora.getTime() + RENOVA_DIAS * 864e5).toISOString();
      if (!dryRun) {
        const { error } = await admin
          .from("sites_publicados")
          .update({ expira_em: novo })
          .eq("id", s.id);
        if (error) {
          falhas.push({ slug: s.slug, motivo: "renovar: " + error.message });
          continue;
        }
      }
      renovados.push({ slug: s.slug, lead: nome, status: s.leads.status, novo_expira: novo });
      continue;
    }

    // NÃO protegido → tira o peso: arquivo do Storage + HTML do redesign. Registro FICA.
    let arquivoOk = false;
    let htmlOk = false;
    if (!dryRun) {
      const { error: rmErr } = await admin.storage.from(BUCKET).remove([`${s.slug}/index.html`]);
      if (rmErr) {
        falhas.push({ slug: s.slug, motivo: "storage: " + rmErr.message });
        continue; // não marca como removido se o arquivo resistiu — tenta de novo amanhã
      }
      arquivoOk = true;

      if (s.redesign_id) {
        const { error: hErr } = await admin
          .from("redesigns")
          .update({ html_gerado: null, html_editado: null })
          .eq("id", s.redesign_id);
        htmlOk = !hErr;
        if (hErr) falhas.push({ slug: s.slug, motivo: "html: " + hErr.message });
      }

      const { error: uErr } = await admin
        .from("sites_publicados")
        .update({ arquivos_removidos: true, status: "expirado" })
        .eq("id", s.id);
      if (uErr) falhas.push({ slug: s.slug, motivo: "marcar: " + uErr.message });
    }
    removidos.push({ slug: s.slug, lead: nome, arquivo: arquivoOk, html: htmlOk });
  }

  // ÓRFÃOS: arquivo no Storage sem linha em sites_publicados (apagar o registro nunca apagou
  // o arquivo). Só os com +24h — abaixo disso pode ser publicação em voo (upload antes do insert).
  const orfaos: string[] = [];
  const { data: pastas } = await admin.storage.from(BUCKET).list("", { limit: 1000 });
  if (pastas?.length) {
    const slugs = pastas.map((p: { name: string }) => p.name);
    const { data: linhas } = await admin.from("sites_publicados").select("slug").in("slug", slugs);
    const comRegistro = new Set((linhas ?? []).map((l: { slug: string }) => l.slug));
    for (const p of pastas as Array<{ name: string; created_at?: string }>) {
      if (comRegistro.has(p.name)) continue;
      const { data: arqs } = await admin.storage.from(BUCKET).list(p.name, { limit: 10 });
      for (const a of (arqs ?? []) as Array<{ name: string; created_at?: string }>) {
        const idadeH = a.created_at
          ? (agora.getTime() - Date.parse(a.created_at)) / 3600000
          : Infinity;
        if (idadeH < ORFAO_MIN_HORAS) continue; // pode ser publicação em andamento
        const caminho = `${p.name}/${a.name}`;
        if (!dryRun) {
          const { error } = await admin.storage.from(BUCKET).remove([caminho]);
          if (error) {
            falhas.push({ slug: caminho, motivo: "orfao: " + error.message });
            continue;
          }
        }
        orfaos.push(caminho);
      }
    }
  }

  return json({
    ok: true,
    dry_run: dryRun,
    agora: agora.toISOString(),
    vencidos: (vencidos ?? []).length,
    removidos,
    renovados,
    orfaos_removidos: orfaos,
    falhas,
  });
});
