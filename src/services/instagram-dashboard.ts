import { supabase } from "@/integrations/supabase/client";
import {
  parseInstagramDashboard,
  type InstagramDashboard,
  type InstagramDashboardPeriod,
} from "@/lib/instagram-dashboard";

export async function loadInstagramDashboard(
  days: InstagramDashboardPeriod,
): Promise<InstagramDashboard> {
  const { data, error } = await supabase.rpc("instagram_dashboard_v1", { p_days: days });
  if (error) throw new Error(`Não foi possível carregar o dashboard: ${error.message}`);
  return parseInstagramDashboard(data);
}
