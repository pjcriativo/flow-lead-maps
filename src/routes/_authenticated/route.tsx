import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!active) return;
      if (error || !data.user) {
        await navigate({ to: "/auth", replace: true });
        return;
      }
      // A sessão vive no storage do navegador, portanto este portão precisa rodar depois da
      // hidratação. Assim o servidor e o primeiro render entregam o mesmo HTML.
      const [{ data: config }, { data: perfil }] = await Promise.all([
        supabase
          .from("config_plataforma")
          .select("modo_manutencao_ativo")
          .eq("id", true)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("is_super_admin, acesso_liberado")
          .eq("id", data.user.id)
          .maybeSingle(),
      ]);
      if (!active) return;
      if (perfil?.is_super_admin !== true && perfil?.acesso_liberado !== true) {
        await navigate({ to: "/aguardando-aprovacao", replace: true });
        return;
      }
      if (config?.modo_manutencao_ativo === true && perfil?.is_super_admin !== true) {
        await navigate({ to: "/manutencao", replace: true });
        return;
      }
      setAllowed(true);
    })();
    return () => {
      active = false;
    };
  }, [navigate]);

  return allowed ? <Outlet /> : null;
}
