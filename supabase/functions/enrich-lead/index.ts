// Edge Function: enrich-lead
// Dado um lead com website, visita o site (só fetch, sem browser) e extrai
// e-mail e WhatsApp; reavalia a qualidade do site, recalcula o score e marca
// status='enriched'. Respeita RLS (usa o JWT do usuário).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { json, corsHeaders } from "../_shared/cors.ts";
import { enrichFromWebsite } from "../_shared/enrich.ts";
import { computeScore } from "../_shared/score.ts";
import { firstBrWhatsapp } from "../_shared/phone.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) return json({ error: "Não autenticado" }, 401);

  let leadId: string | undefined;
  try {
    leadId = (await req.json())?.lead_id;
  } catch {
    return json({ error: "Body inválido" }, 400);
  }
  if (!leadId) return json({ error: "Informe lead_id" }, 400);

  // RLS garante que só o dono lê/edita
  const { data: lead, error: leadErr } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .single();
  if (leadErr || !lead) return json({ error: "Lead não encontrado" }, 404);

  if (!lead.website) {
    return json({ error: "Lead não tem site para enriquecer." }, 422);
  }

  const enr = await enrichFromWebsite(lead.website, lead.phone);
  const email = enr.email ?? lead.email ?? null;
  const whatsapp = enr.whatsapp ?? lead.whatsapp ?? firstBrWhatsapp(lead.phone);
  const instagram = lead.instagram_url ?? enr.instagram; // fonte tem prioridade; senão o que o site trouxe
  const facebook = lead.facebook_url ?? enr.facebook;

  const breakdown = computeScore({
    hasWebsite: true,
    site: enr.site,
    hasInstagram: !!instagram,
    hasFacebook: !!lead.facebook_url,
    hasWhatsapp: !!whatsapp,
    hasPhone: !!lead.phone,
    hasEmail: !!email,
    rating: lead.rating,
    reviewCount: lead.review_count,
  });

  const { data: updated, error: updErr } = await supabase
    .from("leads")
    .update({
      email,
      whatsapp,
      instagram_url: instagram,
      facebook_url: facebook,
      score: breakdown.score,
      score_breakdown: breakdown,
      status: "enriched",
      enriched_at: new Date().toISOString(),
    })
    .eq("id", leadId)
    .select()
    .single();

  if (updErr) return json({ error: updErr.message }, 500);

  return json({ lead: updated, enrichment: enr });
});
