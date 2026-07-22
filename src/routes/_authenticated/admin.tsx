// /admin — painel do DONO da plataforma (super admin).
// Guard: papel REAL no banco (profiles.is_super_admin, migration 041 — a coluna é imutável
// pela API, só service role muda). O e-mail do dono fica como fallback se o profile não
// carregar. TODO: memberships/roles completos quando houver multi-org.
import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AdminPanel } from "@/components/admin/AdminPanel";

const OWNER_EMAIL = "marcosg1.pereira@gmail.com";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    const email = (user?.email ?? "").toLowerCase();
    let ehAdmin = email === OWNER_EMAIL;
    if (user) {
      const { data: perfil } = await supabase
        .from("profiles")
        .select("is_super_admin")
        .eq("id", user.id)
        .maybeSingle();
      ehAdmin = perfil?.is_super_admin === true || ehAdmin;
    }
    // quem não é super admin volta pro app normal — o painel nunca fica aberto
    if (!ehAdmin) throw redirect({ to: "/dashboard" });
    return { adminEmail: email };
  },
  component: AdminPage,
});

function AdminPage() {
  const { adminEmail } = Route.useRouteContext();
  return <AdminPanel email={adminEmail} />;
}
