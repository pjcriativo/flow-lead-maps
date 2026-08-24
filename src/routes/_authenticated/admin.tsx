// /admin — painel do SUPER ADMIN da plataforma.
// Guard: papel REAL no banco (profiles.is_super_admin, migration 041 — coluna imutável pela API,
// só service role muda). Sem e-mail hardcoded: a fonte é o flag. A Edge admin-metricas revalida
// o papel no servidor (403), então este guard é só UX.
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminPanel } from "@/components/admin/AdminPanel";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const [adminEmail, setAdminEmail] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      const { data } = await supabase.auth.getUser();
      if (!active || !data.user) return;
      const { data: perfil } = await supabase
        .from("profiles")
        .select("is_super_admin")
        .eq("id", data.user.id)
        .maybeSingle();
      if (!active) return;
      if (perfil?.is_super_admin !== true) {
        await navigate({ to: "/dashboard", replace: true });
        return;
      }
      setAdminEmail(data.user.email ?? "");
    })();
    return () => {
      active = false;
    };
  }, [navigate]);

  return adminEmail === null ? null : <AdminPanel email={adminEmail} />;
}
