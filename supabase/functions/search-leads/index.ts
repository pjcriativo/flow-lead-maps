// Edge Function: search-leads
// Busca negócios no Google Places (multi-query p/ superar o limite de ~60),
// deduplica por place_id, qualifica (score cliente-ouro) e grava em `leads`
// respeitando RLS (usa o JWT do usuário). Responde em streaming NDJSON.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { corsHeaders, json } from "../_shared/cors.ts";
import { buildQueries, placeDetails, textSearchAll } from "../_shared/places.ts";
import { enrichFromWebsite } from "../_shared/enrich.ts";
import { computeScore } from "../_shared/score.ts";
import { toBrWhatsapp } from "../_shared/phone.ts";

type Body = {
  nicho?: string;
  cidade?: string;
  uf?: string;
  limite?: number;
  buscarEmails?: boolean;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);

  const PLACES_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY");
  if (!PLACES_KEY) {
    return json(
      { error: "GOOGLE_PLACES_API_KEY não configurada no secret da Edge Function." },
      500,
    );
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) return json({ error: "Não autenticado" }, 401);
  const userId = userData.user.id;

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Body inválido" }, 400);
  }

  const nicho = (body.nicho ?? "").trim();
  const cidade = (body.cidade ?? "").trim();
  const uf = (body.uf ?? "").trim();
  const limite = Math.min(Math.max(Number(body.limite) || 50, 1), 1000);
  const buscarEmails = body.buscarEmails !== false;

  if (!nicho || !cidade) {
    return json({ error: "Informe nicho e cidade." }, 400);
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));

      try {
        send({ type: "log", message: `Iniciando: ${nicho} em ${cidade}${uf ? "/" + uf : ""} (meta ${limite})` });

        // place_ids que o usuário já tem (evita reprocessar)
        const { data: existing } = await supabase
          .from("leads")
          .select("place_id")
          .eq("user_id", userId)
          .not("place_id", "is", null);
        const seen = new Set<string>((existing ?? []).map((r: any) => r.place_id));
        const alreadyHad = seen.size;

        const queries = buildQueries(nicho, cidade, uf);
        let inserted = 0;
        // candidatos ainda não detalhados nesta rodada
        const candidates: string[] = [];

        // Fase 1: coletar place_ids únicos via multi-query até juntar candidatos
        // suficientes (um pouco acima da meta, pois alguns caem no filtro).
        const candidateTarget = Math.ceil(limite * 1.6);
        for (const q of queries) {
          if (candidates.length >= candidateTarget) break;
          send({ type: "log", message: `Buscando: "${q}"` });
          let stop = false;
          await textSearchAll(q, PLACES_KEY, (p) => {
            if (seen.has(p.place_id)) return true; // já visto
            seen.add(p.place_id);
            candidates.push(p.place_id);
            if (candidates.length >= candidateTarget) {
              stop = true;
              return false;
            }
            return true;
          });
          if (stop) break;
        }

        send({ type: "log", message: `${candidates.length} candidatos únicos. Detalhando e qualificando...` });

        // Fase 2: detalhar, enriquecer, pontuar e gravar
        for (const placeId of candidates) {
          if (inserted >= limite) break;
          const det = await placeDetails(placeId, PLACES_KEY);
          if (!det) continue;

          const phone = det.formatted_phone_number ?? det.international_phone_number;
          const hasWebsite = !!det.website;
          let email: string | null = null;
          let whatsapp: string | null = toBrWhatsapp(phone);
          let site = null;

          if (buscarEmails && hasWebsite) {
            const enr = await enrichFromWebsite(det.website!, phone);
            email = enr.email;
            whatsapp = enr.whatsapp ?? whatsapp;
            site = enr.site;
          }

          const breakdown = computeScore({
            rating: det.rating,
            reviewCount: det.user_ratings_total,
            hasWebsite,
            site,
            hasEmail: !!email,
          });

          const row = {
            user_id: userId,
            place_id: det.place_id,
            business_name: det.name,
            address: det.formatted_address,
            city: cidade,
            state: uf || null,
            phone: phone ?? null,
            whatsapp,
            website: det.website ?? null,
            category: det.types?.[0] ?? nicho,
            rating: det.rating,
            review_count: det.user_ratings_total ?? 0,
            has_website: hasWebsite,
            has_phone: !!phone,
            email,
            score: breakdown.score,
            score_breakdown: breakdown,
            status: email ? "enriched" : "new",
            enriched_at: buscarEmails && hasWebsite ? new Date().toISOString() : null,
          };

          const { data: up, error: upErr } = await supabase
            .from("leads")
            .upsert(row, { onConflict: "user_id,place_id" })
            .select()
            .single();

          if (upErr) {
            send({ type: "log", message: `Falha ao gravar ${det.name}: ${upErr.message}` });
            continue;
          }
          inserted++;
          send({ type: "lead", lead: up });
          send({ type: "progress", found: inserted, target: limite });
        }

        send({ type: "done", inserted, total: inserted });
        controller.close();
      } catch (e) {
        send({ type: "error", message: e instanceof Error ? e.message : String(e) });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
});
