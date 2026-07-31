import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PlanPermissions = {
  planName: string; // 'basico', 'pro', 'agencia', 'starter', 'enterprise'
  monthlyLeadLimit: number;
  leadsUsedMonthly: number;
  leadsRemaining: number;
  isLimitReached: boolean;
  canAccessInstagramSearch: boolean;
  canAccessLinkedInSearch: boolean;
  canAccessPropostas: boolean;
  canAccessContratos: boolean;
  canAccessFinanceiro: boolean;
  canAccessWhatsApp: boolean;
  canAccessRedesign: boolean;
  canAccessPublicar: boolean;
  loading: boolean;
};

export function usePlanPermissions(): PlanPermissions {
  const [permissions, setPermissions] = useState<PlanPermissions>({
    planName: "basico",
    monthlyLeadLimit: 1000,
    leadsUsedMonthly: 0,
    leadsRemaining: 1000,
    isLimitReached: false,
    canAccessInstagramSearch: false,
    canAccessLinkedInSearch: false,
    canAccessPropostas: false,
    canAccessContratos: false,
    canAccessFinanceiro: false,
    canAccessWhatsApp: false,
    canAccessRedesign: false,
    canAccessPublicar: false,
    loading: true,
  });

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        setPermissions((p) => ({ ...p, loading: false }));
        return;
      }

      const { data: perfil } = await supabase
        .from("profiles")
        .select("plan, monthly_lead_limit, leads_used_monthly, is_super_admin")
        .eq("id", data.user.id)
        .maybeSingle();

      const rawPlan = (perfil?.plan ?? "basico").toLowerCase();
      const isSuperAdmin = perfil?.is_super_admin === true;
      const isProOrAbove =
        isSuperAdmin || rawPlan === "pro" || rawPlan === "agencia" || rawPlan === "enterprise";

      const limit = isSuperAdmin ? 999999 : (perfil?.monthly_lead_limit ?? 1000);
      const used = perfil?.leads_used_monthly ?? 0;
      const remaining = Math.max(0, limit - used);

      setPermissions({
        planName: rawPlan,
        monthlyLeadLimit: limit,
        leadsUsedMonthly: used,
        leadsRemaining: remaining,
        isLimitReached: !isSuperAdmin && used >= limit,
        // Trava de Recursos por Plano (conforme /pricing):
        // Básico: Apenas Google Maps + CRM listas.
        // Pro / Agência: Libera Instagram, LinkedIn, Propostas, Contratos, Financeiro, WhatsApp, Redesign e Publicar.
        canAccessInstagramSearch: isProOrAbove,
        canAccessLinkedInSearch: isProOrAbove,
        canAccessPropostas: isProOrAbove,
        canAccessContratos: isProOrAbove,
        canAccessFinanceiro: isProOrAbove,
        canAccessWhatsApp: isProOrAbove,
        canAccessRedesign: isProOrAbove,
        canAccessPublicar: isProOrAbove,
        loading: false,
      });
    });
  }, []);

  return permissions;
}
