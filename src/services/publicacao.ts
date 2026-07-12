// Camada de serviço — Publicação de sites TEMPORÁRIOS (Fase 4) LIGADA ao real.
// - Leituras (listar/marcar status): client do browser com RLS (dono).
// - Publicar/Despublicar (mexem no Storage): server functions do TanStack, que
//   rodam no servidor com service role e reaproveitam publicacao.core.
// As telas consomem ESTAS assinaturas e não mudam.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabase } from "@/integrations/supabase/client";
import type { SitePublicado, SitePublicadoStatus, LeadPublicavel } from "@/types";
import type { SitePublicadoRow } from "@/services/publicacao.core";

// O join `leads(business_name)` do PostgREST pode vir como objeto ou null.
type ComLead<T> = T & { leads: { business_name: string } | null };

function toSite(row: SitePublicadoRow, leadNome?: string | null): SitePublicado {
  return {
    id: row.id,
    lead_id: row.lead_id,
    redesign_id: row.redesign_id,
    slug: row.slug,
    url_publica: row.url_publica,
    status: row.status as SitePublicadoStatus,
    publicado_em: row.publicado_em,
    expira_em: row.expira_em,
    arquivos_removidos: row.arquivos_removidos,
    lead_nome: leadNome ?? undefined,
  };
}

/* --------------------------- server functions --------------------------- */

const publicarSiteFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { redesignId: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { publishCore } = await import("@/services/publicacao.core");
    const row = await publishCore({
      db: context.supabase,
      storage: supabaseAdmin,
      userId: context.userId,
      redesignId: data.redesignId,
    });
    const { data: lead } = await context.supabase
      .from("leads")
      .select("business_name")
      .eq("id", row.lead_id)
      .single();
    return toSite(row, lead?.business_name);
  });

const despublicarSiteFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { unpublishCore } = await import("@/services/publicacao.core");
    await unpublishCore({ db: context.supabase, storage: supabaseAdmin, id: data.id });
  });

/* ------------------------------- leituras ------------------------------- */

/** Lista os sites do usuário (ativos + expirados; despublicados somem da lista). */
export async function listarSites(): Promise<SitePublicado[]> {
  const { data, error } = await supabase
    .from("sites_publicados")
    .select("*, leads(business_name)")
    .order("publicado_em", { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as unknown as ComLead<SitePublicadoRow>[];
  return rows
    .map((r) => toSite(r, r.leads?.business_name))
    .filter((s) => !s.arquivos_removidos || s.status === "expirado");
}

/** Redesigns prontos que ainda NÃO têm site publicado (candidatos a publicar). */
export async function listarLeadsPublicaveis(): Promise<LeadPublicavel[]> {
  const [{ data: redesigns, error: rErr }, { data: sites, error: sErr }] = await Promise.all([
    supabase
      .from("redesigns")
      .select("id, lead_id, leads(business_name)")
      .eq("status", "pronto")
      .order("criado_em", { ascending: false }),
    supabase.from("sites_publicados").select("redesign_id").eq("arquivos_removidos", false),
  ]);
  if (rErr) throw rErr;
  if (sErr) throw sErr;
  const jaPublicados = new Set((sites ?? []).map((s) => s.redesign_id));
  const rows = (redesigns ?? []) as unknown as ComLead<{ id: string; lead_id: string }>[];
  return rows
    .filter((r) => !jaPublicados.has(r.id))
    .map((r) => ({
      lead_id: r.lead_id,
      lead_nome: r.leads?.business_name ?? "Lead",
      redesign_id: r.id,
    }));
}

/* ------------------------------- mutações ------------------------------- */

/** Publica o site de um redesign pronto → sobe no Storage e devolve a URL. */
export async function publicarSite(redesignId: string): Promise<SitePublicado> {
  return publicarSiteFn({ data: { redesignId } });
}

/** Despublica/exclui: apaga os arquivos do Storage, MANTÉM o registro. */
export async function despublicarSite(id: string): Promise<void> {
  await despublicarSiteFn({ data: { id } });
}

/** Marca o site como aprovado/reprovado/expirado/publicado (aprovação do cliente). */
export async function marcarStatus(
  id: string,
  status: SitePublicadoStatus,
): Promise<SitePublicado> {
  const { data, error } = await supabase
    .from("sites_publicados")
    .update({ status })
    .eq("id", id)
    .select("*, leads(business_name)")
    .single();
  if (error) throw error;
  const r = data as unknown as ComLead<SitePublicadoRow>;
  return toSite(r, r.leads?.business_name);
}
