// /admin — painel do DONO da plataforma (super admin).
// Guard: por ora a base não tem papéis/memberships, então restringimos pelo e-mail do dono.
// TODO: quando existir multi-org com memberships/roles, trocar este check por role='super_admin'.
import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AdminPanel } from "@/components/admin/AdminPanel";

const OWNER_EMAIL = "marcosg1.pereira@gmail.com";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    const email = data.user?.email ?? "";
    // qualquer um que não seja o dono volta pro app normal — o painel nunca fica aberto
    if (email.toLowerCase() !== OWNER_EMAIL) throw redirect({ to: "/dashboard" });
    return { adminEmail: email };
  },
  component: AdminPage,
});

function AdminPage() {
  const { adminEmail } = Route.useRouteContext();
  return <AdminPanel email={adminEmail} />;
}
