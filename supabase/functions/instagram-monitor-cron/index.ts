import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { json } from "../_shared/cors.ts";
import { processarMonitoramentoConcorrente } from "../instagram-discovery/index.ts";

// Edge Function: instagram-monitor-cron (Fase 6)
// Chamada periodicamente pelo pg_cron via pg_net.
// Varre os concorrentes ativos que atingiram o horário de reanálise e dispara o monitoramento.
// Utiliza a própria lógica do instagram-discovery reutilizando os controles de custo e cache.

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ ok: false, error: "Metodo invalido" }, 405);

  const cronSecret = req.headers.get("x-cron-secret");
  const url = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!cronSecret || !url || !serviceRole) {
    return json({ ok: false, error: "Configuracao invalida ou credenciais ausentes" }, 500);
  }

  const admin = createClient(url, serviceRole);

  const { data: secrets } = await admin
    .from("decrypted_secrets")
    .select("decrypted_secret")
    .eq("name", "followup_cron_secret")
    .maybeSingle();

  if (!secrets || secrets.decrypted_secret !== cronSecret) {
    return json({ ok: false, error: "Acesso nao autorizado" }, 401);
  }

  // 1. Encontrar todos os concorrentes ativos com next_analysis_at vencido
  const { data: competitors, error: findError } = await admin
    .from("instagram_competitors")
    .select("id, org_id, user_id, username, monitoring_interval_hours")
    .eq("status", "active")
    .lte("next_analysis_at", new Date().toISOString())
    .limit(20);

  if (findError) {
    return json({ ok: false, error: findError.message }, 500);
  }

  if (!competitors || competitors.length === 0) {
    return json({ ok: true, message: "Nenhum concorrente na fila para monitoramento.", ran: 0 }, 200);
  }

  const results = [];
  const now = new Date();

  // 2. Para cada concorrente, gerar payload e chamar a rotina central do instagram-discovery
  for (const comp of competitors) {
    const requestId = crypto.randomUUID();
    
    // Atualizar next_analysis_at antes de iniciar para não encavalar se houver lentidão
    const nextAnalysisAt = new Date(now.getTime() + comp.monitoring_interval_hours * 60 * 60 * 1000);
    await admin
      .from("instagram_competitors")
      .update({ next_analysis_at: nextAnalysisAt.toISOString(), last_analyzed_at: now.toISOString() })
      .eq("id", comp.id);

    try {
      // Mockamos o corpo para as opções padrão de monitoramento
      const body = {
        requestId,
        competitorId: comp.id,
        maxPosts: 12,
        commentPosts: 3,
        commentsPerPost: 30
      };

      const response = await processarMonitoramentoConcorrente({
        req,
        admin,
        userId: comp.user_id,
        orgId: comp.org_id,
        body
      });

      const responseData = await response.json();
      results.push({ competitor: comp.username, status: "success", data: responseData });
    } catch (err) {
      results.push({ competitor: comp.username, status: "error", error: String(err) });
    }
  }

  return json({ ok: true, ran: competitors.length, results }, 200);
});
