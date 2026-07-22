// Edge Function: search-leads
// Busca com PROVEDOR PLUGÁVEL: 'osm' (Overpass, grátis), 'foursquare' (Service
// Key grátis) e 'places' (Google, requer billing). O provedor devolve lugares
// normalizados (RawPlace); o pipeline comum enriquece (e-mail/WhatsApp via site),
// pontua (score cliente-ouro) e grava em `leads` respeitando RLS.
// Responde em streaming NDJSON.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { corsHeaders, json } from "../_shared/cors.ts";
import type { Fonte, ProviderSearch } from "../_shared/providers/types.ts";
import { searchOsm } from "../_shared/providers/osm.ts";
import { searchGeoapify } from "../_shared/providers/geoapify.ts";
import { searchApify } from "../_shared/providers/apify.ts";
import { searchPlaces } from "../_shared/providers/places.ts";
import { enrichFromWebsite } from "../_shared/enrich.ts";
import { computeScore } from "../_shared/score.ts";
import { firstBrWhatsapp } from "../_shared/phone.ts";
import { extrairBairro } from "../../../src/lib/bairro.ts";
import { geocodeCidade } from "../_shared/geocode.ts";

// Registrar fonte nova (ex.: Apify) = adicionar uma linha aqui.
const PROVIDERS: Record<Fonte, ProviderSearch> = {
  osm: searchOsm,
  geoapify: searchGeoapify,
  apify: searchApify,
  places: searchPlaces,
};

type Body = {
  nicho?: string;
  cidade?: string;
  uf?: string;
  limite?: number;
  buscarEmails?: boolean;
  fonte?: Fonte;
  /** Busca por área no mapa (alternativa a cidade/uf). */
  lat?: number;
  lng?: number;
  raio_km?: number;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });

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
  const fonte: Fonte = body.fonte && body.fonte in PROVIDERS ? body.fonte : "osm";
  const provider = PROVIDERS[fonte];
  let lat = typeof body.lat === "number" ? body.lat : null;
  let lng = typeof body.lng === "number" ? body.lng : null;
  let raioKm = typeof body.raio_km === "number" ? body.raio_km : null;
  const porMapa = lat != null && lng != null;

  if (!nicho || (!cidade && !porMapa)) {
    return json({ error: "Informe o nicho e a cidade (ou marque um ponto no mapa)." }, 400);
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));

      try {
        send({
          type: "log",
          message: `Fonte: ${fonte} — ${nicho} em ${cidade}${uf ? "/" + uf : ""} (meta ${limite})`,
        });

        // Caminho padrão: sem pino, geocodifica cidade+UF (respeita a UF) e busca
        // por raio. Evita o modo-cidade do OSM, que ignora a UF.
        if (!(lat != null && lng != null) && cidade) {
          const g = await geocodeCidade(cidade, uf);
          if (g) {
            lat = g.lat;
            lng = g.lng;
            raioKm = raioKm ?? g.raioKm;
            send({
              type: "log",
              message: `Geocode ${cidade}/${uf}: ${g.lat.toFixed(3)},${g.lng.toFixed(3)} · raio ${raioKm}km`,
            });
          } else {
            send({
              type: "log",
              message: `Geocode falhou — usando busca por nome da cidade (a fonte pode ignorar a UF)`,
            });
          }
        }

        // ids já vistos pelo usuário (dedupe entre buscas)
        const { data: existing } = await supabase
          .from("leads")
          .select("place_id")
          .eq("user_id", userId)
          .not("place_id", "is", null);
        const seen = new Set<string>((existing ?? []).map((r: any) => r.place_id));

        // Fase 1: o provedor coleta candidatos normalizados (multi-query interna).
        const candidates = await provider({
          nicho,
          cidade,
          uf,
          lat,
          lng,
          raioKm,
          alvo: Math.ceil(limite * 1.6),
          limite,
          seen,
          log: (message) => send({ type: "log", message }),
        });

        send({ type: "log", message: `${candidates.length} candidatos únicos. Qualificando...` });

        // Fase 2 (comum a toda fonte): enriquecer, pontuar e gravar.
        let inserted = 0;
        for (const p of candidates) {
          if (inserted >= limite) break;

          // Às vezes o "site" cadastrado é, na verdade, um perfil de Instagram/Facebook.
          let website = p.website;
          let instagram: string | null = p.instagram;
          let facebook: string | null = p.facebook;
          if (website) {
            const igm = website.match(/instagram\.com\/([A-Za-z0-9_.]+)/i);
            const fbm = website.match(/facebook\.com\/([A-Za-z0-9_.]+)/i);
            if (igm && !instagram) {
              instagram = `https://instagram.com/${igm[1].replace(/\/$/, "")}`;
              website = null;
            } else if (fbm && !facebook) {
              facebook = website;
              website = null;
            }
          }
          const hasWebsite = !!website;
          let email: string | null = null;
          let whatsapp: string | null = firstBrWhatsapp(p.phone);
          let site = null;

          if (buscarEmails && hasWebsite) {
            const enr = await enrichFromWebsite(website!, p.phone);
            email = enr.email;
            whatsapp = enr.whatsapp ?? whatsapp;
            instagram = instagram ?? enr.instagram; // fonte tem prioridade; senão, o que o site trouxe
            facebook = facebook ?? enr.facebook;
            site = enr.site;
            send({ type: "log", message: `↳ ${p.name}: ${enr.debug}` });
          }

          const breakdown = computeScore({
            hasWebsite,
            site,
            hasInstagram: !!instagram,
            hasFacebook: !!facebook,
            hasWhatsapp: !!whatsapp,
            hasPhone: !!p.phone,
            hasEmail: !!email,
            rating: p.rating,
            reviewCount: p.review_count,
          });

          const row = {
            user_id: userId,
            place_id: p.source_id,
            business_name: p.name,
            address: p.address,
            bairro: extrairBairro(p.address),
            city: cidade,
            state: uf || null,
            phone: p.phone,
            whatsapp,
            website,
            category: p.category ?? nicho,
            rating: p.rating,
            review_count: p.review_count ?? 0,
            has_website: hasWebsite,
            has_phone: !!p.phone,
            email,
            instagram_url: instagram,
            facebook_url: facebook,
            latitude: p.lat,
            longitude: p.lng,
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
            send({ type: "log", message: `Falha ao gravar ${p.name}: ${upErr.message}` });
            continue;
          }
          inserted++;
          send({ type: "lead", lead: up });
          send({ type: "progress", found: inserted, target: limite });
        }

        send({ type: "done", inserted, total: inserted, fonte });
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
