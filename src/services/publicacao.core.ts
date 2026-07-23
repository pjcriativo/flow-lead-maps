// Fase 4 — NÚCLEO da publicação (SERVER-ONLY). Contém a lógica real de subir o
// HTML no Storage, registrar/derrubar o site e servir a página pública.
// Recebe os clients Supabase por parâmetro (não importa nada de client.server),
// então é reaproveitado tanto pela server function quanto por scripts de teste
// E2E — o MESMO código roda nos dois. NÃO importar este arquivo no client.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type DB = SupabaseClient<Database>;

export const BUCKET = "sites-publicados";
const DIAS_VALIDADE = 15;
const MAX_SLUG_TRIES = 4;

/** URL base dos sites publicados. Trocável por env (ex.: subdomínio próprio). */
export function baseSiteUrl(): string {
  const raw = process.env.PUBLIC_SITE_BASE_URL || "https://flow-leads-dusky.vercel.app";
  return raw.replace(/\/+$/, "");
}

export function slugify(nome: string): string {
  const base = nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return base || "site";
}

function sufixo(): string {
  // 4 hex aleatórios → slug único e seguro p/ URL (ex.: vfc-...-a1b2).
  return crypto.randomUUID().replace(/-/g, "").slice(0, 4);
}

function storagePath(slug: string): string {
  return `${slug}/index.html`;
}

export type SitePublicadoRow = Database["public"]["Tables"]["sites_publicados"]["Row"];

/**
 * Publica o site de um redesign: lê o html_editado (ou html_gerado), sobe no
 * Storage e cria o registro em sites_publicados. `db` grava a linha (RLS aplica
 * quando é o client do usuário); `storage` deve ter service role (Storage).
 */
export async function publishCore(opts: {
  db: DB;
  storage: DB;
  userId: string;
  redesignId: string;
  baseUrl?: string;
}): Promise<SitePublicadoRow> {
  const { db, storage, userId, redesignId } = opts;
  const baseUrl = (opts.baseUrl ?? baseSiteUrl()).replace(/\/+$/, "");

  const { data: rd, error: rdErr } = await db
    .from("redesigns")
    .select("id, lead_id, status, html_gerado, html_editado")
    .eq("id", redesignId)
    .single();
  if (rdErr || !rd) throw new Error("Redesign não encontrado");

  const html = rd.html_editado ?? rd.html_gerado;
  if (!html || html.length < 100)
    throw new Error("Este redesign ainda não tem HTML pronto para publicar");

  const { data: lead } = await db
    .from("leads")
    .select("business_name")
    .eq("id", rd.lead_id)
    .single();
  const slugBase = slugify(lead?.business_name ?? "site");

  const blob = new Blob([html], { type: "text/html; charset=utf-8" });

  // Sobe + registra com slug único; em colisão (23505), tenta outro sufixo.
  let ultimoErro = "";
  for (let tentativa = 0; tentativa < MAX_SLUG_TRIES; tentativa++) {
    const slug = `${slugBase}-${sufixo()}`;
    const path = storagePath(slug);

    const { error: upErr } = await storage.storage
      .from(BUCKET)
      .upload(path, blob, { contentType: "text/html; charset=utf-8", upsert: true });
    if (upErr) {
      ultimoErro = `Falha ao subir o site: ${upErr.message}`;
      continue;
    }

    // ⚙️ Configurações (admin): dias de validade do site — override de config_plataforma,
    // cai no padrão (DIAS_VALIDADE) se a linha/campo não existir. RLS: qualquer autenticado lê.
    const { data: config } = await db
      .from("config_plataforma")
      .select("dias_validade_site")
      .eq("id", true)
      .maybeSingle();
    const diasValidade = config?.dias_validade_site ?? DIAS_VALIDADE;

    const agora = new Date();
    const expira = new Date(agora);
    expira.setDate(expira.getDate() + diasValidade);
    const url = `${baseUrl}/site/${slug}`;

    const { data: row, error: insErr } = await db
      .from("sites_publicados")
      .insert({
        user_id: userId,
        lead_id: rd.lead_id,
        redesign_id: rd.id,
        slug,
        url_publica: url,
        status: "publicado",
        publicado_em: agora.toISOString(),
        expira_em: expira.toISOString(),
        arquivos_removidos: false,
      })
      .select()
      .single();

    if (!insErr && row) return row;

    // Insert falhou → remove o arquivo recém-subido para não deixar lixo.
    await storage.storage
      .from(BUCKET)
      .remove([path])
      .catch(() => {});
    // 23505 = unique_violation (slug já usado) → tenta de novo com outro sufixo.
    if ((insErr as { code?: string } | null)?.code === "23505") {
      ultimoErro = "Conflito de slug";
      continue;
    }
    throw new Error(`Falha ao registrar o site: ${insErr?.message ?? "erro"}`);
  }
  throw new Error(ultimoErro || "Não foi possível publicar (slug em conflito)");
}

/**
 * Despublica/exclui: apaga os arquivos do Storage e MANTÉM o registro
 * (arquivos_removidos = true, status = 'reprovado') para histórico.
 */
export async function unpublishCore(opts: { db: DB; storage: DB; id: string }): Promise<void> {
  const { db, storage, id } = opts;
  const { data: site, error } = await db
    .from("sites_publicados")
    .select("slug")
    .eq("id", id)
    .single();
  if (error || !site) throw new Error("Site não encontrado");

  await storage.storage
    .from(BUCKET)
    .remove([storagePath(site.slug)])
    .catch(() => {});

  const { error: upErr } = await db
    .from("sites_publicados")
    .update({ arquivos_removidos: true, status: "reprovado" })
    .eq("id", id);
  if (upErr) throw new Error(`Falha ao despublicar: ${upErr.message}`);
}

export type ServeResult = { ok: true; html: string } | { ok: false; code: number; motivo: string };

/**
 * Carrega o HTML de um site publicado para servir na rota pública /site/<slug>.
 * `admin` PRECISA ter service role: a rota é pública (sem sessão), então lê a
 * tabela e o Storage por fora do RLS. Só serve sites ativos e não expirados.
 */
export async function loadSiteForServe(admin: DB, slug: string): Promise<ServeResult> {
  const { data: site, error } = await admin
    .from("sites_publicados")
    .select("slug, status, expira_em, arquivos_removidos")
    .eq("slug", slug)
    .maybeSingle();
  if (error) return { ok: false, code: 500, motivo: "Erro ao carregar o site" };
  if (!site) return { ok: false, code: 404, motivo: "Site não encontrado" };
  if (site.arquivos_removidos || site.status === "reprovado")
    return { ok: false, code: 410, motivo: "Este site não está mais disponível" };
  if (new Date(site.expira_em).getTime() < Date.now())
    return { ok: false, code: 410, motivo: "Este site expirou" };

  const { data: blob, error: dlErr } = await admin.storage.from(BUCKET).download(storagePath(slug));
  if (dlErr || !blob) return { ok: false, code: 404, motivo: "Arquivo do site não encontrado" };
  return { ok: true, html: await blob.text() };
}
