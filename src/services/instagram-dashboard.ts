import { supabase } from "@/integrations/supabase/client";
import {
  parseInstagramDashboard,
  mergeInstagramDashboards,
  type InstagramDashboard,
  type InstagramDashboardPeriod,
} from "@/lib/instagram-dashboard";

export async function loadInstagramDashboard(
  days: InstagramDashboardPeriod,
): Promise<InstagramDashboard> {
  const [base, advanced] = await Promise.all([
    supabase.rpc("instagram_dashboard_v1", { p_days: days }),
    supabase.rpc("instagram_dashboard_advanced_v1", { p_days: days }),
  ]);
  if (base.error) throw new Error(`Não foi possível carregar o dashboard: ${base.error.message}`);
  if (advanced.error) {
    throw new Error(`Não foi possível carregar as fontes avançadas: ${advanced.error.message}`);
  }
  return mergeInstagramDashboards(
    parseInstagramDashboard(base.data),
    parseInstagramDashboard(advanced.data),
  );
}
