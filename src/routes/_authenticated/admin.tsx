// /admin — painel do SUPER ADMIN da plataforma.
// Guard: papel REAL no banco (profiles.is_super_admin, migration 041 — coluna imutável pela API,
// só service role muda). Sem e-mail hardcoded: a fonte é o flag. A Edge admin-metricas revalida
// o papel no servidor (403), então este guard é só UX.
import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AdminPanel } from "@/components/admin/AdminPanel";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) throw redirect({ to: "/auth" });
    const { data: perfil } = await supabase
      .from("profiles")
      .select("is_super_admin")
      .eq("id", user.id)
      .maybeSingle();
    // quem não é super admin volta pro app normal — o painel nunca fica aberto
    if (perfil?.is_super_admin !== true) throw redirect({ to: "/dashboard" });
    return { adminEmail: user.email ?? "" };
  },
  component: AdminPage,
});

function AdminPage() {
  const { adminEmail } = Route.useRouteContext();
  return <AdminPanel email={adminEmail} />;
}
