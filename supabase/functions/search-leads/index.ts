// Edge Function: search-leads
// Busca com PROVEDOR PLUGÁVEL: 'osm' (Overpass, grátis), 'foursquare' (Service
// Key grátis) e 'places' (Google, requer billing). O provedor devolve lugares
// normalizados (RawPlace); o pipeline comum enriquece (e-mail/WhatsApp via site),
// pontua (score cliente-ouro) e grava em `leads` respeitando RLS.
// Responde em streaming NDJSON.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { corsHeaders, json } from "../_shared/cors.ts";
import { acessoFerramentaLiberado } from "../_shared/acesso.ts";
import type { Fonte, ProviderSearch } from "../_shared/providers/types.ts";
import { searchOsm } from "../_shared/providers/osm.ts";
import { searchGeoapify, setGeoapifyKeyOverride } from "../_shared/providers/geoapify.ts";
import { searchApify, setApifyPoolContext } from "../_shared/providers/apify.ts";
import { searchApifyComCache } from "../_shared/apify-cache.ts";
import { planejarColetaApify } from "../_shared/apify-economy.ts";
import { searchPlaces } from "../_shared/providers/places.ts";
import { enrichFromWebsite } from "../_shared/enrich.ts";
import { computeScore } from "../_shared/score.ts";
import { firstBrWhatsapp } from "../_shared/phone.ts";
import { extrairBairro } from "../../../src/lib/bairro.ts";
import { geocodeCidade } from "../_shared/geocode.ts";
import { orgDoUsuario, estadoConsumo, consumir } from "../_shared/limite.ts";
import { resolverChave } from "../_shared/chaves.ts";
import { lerConfigPlataforma } from "../_shared/config.ts";
import type { ProviderUsage } from "../_shared/providers/types.ts";
import { leadBusinessIdentity, loadSeenLeadIdentitiesForOrg } from "../_shared/lead-dedupe.ts";

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
  /** Distingue o pino manual das coordenadas automáticas da cidade. */
  usar_area_mapa?: boolean;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) return json({ error: "Não autenticado" }, 401);
  if (!(await acessoFerramentaLiberado(supabase, userData.user.id)))
    return json({ error: "Acesso aguardando liberação do administrador" }, 403);
  const userId = userData.user.id;

  // service role para medir o consumo do plano (funções SECURITY DEFINER; resolvem a org)
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
  // 🔐 Cofre de chaves: GEOAPIFY_API_KEY passa a valer o override do painel.
  setGeoapifyKeyOverride(await resolverChave(admin, "GEOAPIFY_API_KEY"));
  // 🔑 Pool de chaves Apify (rodízio por esgotamento): o provider resolve/rotaciona sozinho
  // com o admin client; sem pool configurado ele cai na chave única do cofre/secret.
  setApifyPoolContext(admin);
  const orgId = await orgDoUsuario(admin, userId);
  if (!orgId) return json({ error: "Sua conta ainda não possui uma organização válida." }, 409);

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Body inválido" }, 400);
  }

  const nicho = (body.nicho ?? "").trim();
  const cidade = (body.cidade ?? "").trim();
  const uf = (body.uf ?? "").trim();
  // ⚙️ Configurações (admin → Configurações básicas): teto máximo de leads por busca —
  // null = usa o padrão de 1000 (o teto rígido de sempre).
  const configPlataforma = await lerConfigPlataforma(admin);
  const TETO_MAX_BUSCA = configPlataforma.max_leads_busca ?? 1000;
  const limite = Math.min(Math.max(Number(body.limite) || 50, 1), TETO_MAX_BUSCA);
  const buscarEmails = body.buscarEmails !== false;
  const fonte: Fonte = body.fonte && body.fonte in PROVIDERS ? body.fonte : "osm";
  const provider = PROVIDERS[fonte];
  let lat = typeof body.lat === "number" ? body.lat : null;
  let lng = typeof body.lng === "number" ? body.lng : null;
  let raioKm = typeof body.raio_km === "number" ? body.raio_km : null;
  const porMapa = lat != null && lng != null;
  const usarAreaMapa = body.usar_area_mapa === true && porMapa;

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

        // Histórico permanente da CONTA inteira, paginado para não truncar em 1.000 linhas.
        const seen = await loadSeenLeadIdentitiesForOrg(admin, orgId);

        // Limite do plano vem ANTES de qualquer provedor pago: nunca compramos leads que a
        // conta não poderá receber nesta rodada.
        let restantePlano: number | null = null;
        if (orgId) {
          const st = await estadoConsumo(admin, orgId, "leads");
          if (st.limite != null) {
            restantePlano = st.restante ?? 0;
            if (restantePlano <= 0) {
              send({
                type: "error",
                message: `Limite de leads do seu plano atingido: ${st.usado}/${st.limite} neste mês. Faça upgrade do plano para coletar mais.`,
              });
              controller.close();
              return;
            }
            if (st.perto)
              send({
                type: "log",
                message: `⚠️ Perto do limite do plano: ${st.usado}/${st.limite} leads usados neste mês.`,
              });
          }
        }
        const planoColeta = planejarColetaApify({
          solicitado: limite,
          restantePlano,
          profundidadeCache: 0,
        });
        const limiteEfetivo = planoColeta.limiteEfetivo;
        if (limiteEfetivo < limite) {
          send({
            type: "log",
            message: `Busca ajustada para ${limiteEfetivo} leads, exatamente o saldo disponível no plano.`,
          });
        }

        const reportUsage = async (usage: ProviderUsage) => {
          const costBrl = usage.costUsd * 5.6;
          const { error: usageError } = await admin.from("api_consumption_logs").upsert(
            {
              org_id: orgId,
              user_id: userId,
              service: usage.service,
              action: usage.action,
              external_id: usage.externalId,
              quantity: usage.quantity,
              cost_usd: usage.costUsd,
              cost_brl: costBrl,
              metadata: { nicho, cidade, fonte, ...usage.metadata },
            },
            { onConflict: "service,external_id" },
          );
          if (usageError) {
            throw new Error(`Falha ao registrar custo real da Apify: ${usageError.message}`);
          }
          const runStatus = usage.metadata.run_status;
          send(
            runStatus === "RUNNING" || runStatus === "READY"
              ? {
                  type: "log",
                  message: `Run Apify vinculado à sua conta: ${usage.externalId}`,
                }
              : {
                  type: "log",
                  message: `Custo real registrado: US$ ${usage.costUsd.toFixed(4)} (run ${usage.externalId})`,
                },
          );
        };

        const providerParams = {
          nicho,
          cidade,
          uf,
          lat,
          lng,
          raioKm,
          usarAreaMapa,
          alvo: Math.ceil(limiteEfetivo * 2.5),
          limite: limiteEfetivo,
          log: (message: string) => send({ type: "log", message }),
          reportUsage,
        };
        const collected =
          fonte === "apify"
            ? await searchApifyComCache({ ...providerParams, admin, orgId, userId, seen })
            : await provider({ ...providerParams, seen: new Set(seen.placeIds) });
        const candidates = collected.filter((place) => {
          const businessKey = leadBusinessIdentity(place.name, place.address);
          if (
            seen.placeIds.has(place.source_id) ||
            (businessKey !== null && seen.businessKeys.has(businessKey))
          ) {
            return false;
          }

          // Deduplica também resultados repetidos dentro da própria resposta do provedor.
          seen.placeIds.add(place.source_id);
          if (businessKey !== null) seen.businessKeys.add(businessKey);
          return true;
        });

        const alreadyKnown = collected.length - candidates.length;
        if (alreadyKnown > 0) {
          send({
            type: "log",
            message: `${alreadyKnown} estabelecimento(s) já pertenciam à conta e foram ignorados sem consumir o limite de leads.`,
          });
        }

        send({ type: "log", message: `${candidates.length} candidatos únicos. Qualificando...` });

        // Fase 2 (comum a toda fonte): enriquecer, pontuar e gravar.
        let inserted = 0;
        for (const p of candidates) {
          if (inserted >= limiteEfetivo) break;

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
            org_id: orgId,
            user_id: userId,
            assigned_to: userId,
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

          const { data: insertedLead, error: upErr } = await supabase
            .from("leads")
            .upsert(row, { onConflict: "org_id,place_id", ignoreDuplicates: true })
            .select()
            .maybeSingle();

          if (upErr) {
            send({ type: "log", message: `Falha ao gravar ${p.name}: ${upErr.message}` });
            continue;
          }
          if (!insertedLead) {
            send({
              type: "log",
              message: `${p.name} já existe nesta conta e não foi contabilizado novamente.`,
            });
            continue;
          }
          inserted++;
          send({ type: "lead", lead: insertedLead });
          send({ type: "progress", found: inserted, target: limiteEfetivo });
        }

        // registra o consumo REAL do mês (só o que entrou). super_admin também conta (para o
        // painel mostrar uso), mas nunca é bloqueado (limite null).
        if (orgId && inserted > 0) {
          await consumir(admin, orgId, "leads", inserted);
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
      ...corsHeaders(req),
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
});
