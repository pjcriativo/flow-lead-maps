import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth" });
    }
    // ⚙️ Configurações (admin → Painel de controle → Modo manutenção): bloqueia quem não é
    // super_admin. O super_admin sempre atravessa — senão ninguém conseguiria desligar de volta.
    const [{ data: config }, { data: perfil }] = await Promise.all([
      supabase
        .from("config_plataforma")
        .select("modo_manutencao_ativo")
        .eq("id", true)
        .maybeSingle(),
      supabase.from("profiles").select("is_super_admin").eq("id", data.user.id).maybeSingle(),
    ]);
    if (config?.modo_manutencao_ativo === true && perfil?.is_super_admin !== true) {
      throw redirect({ to: "/manutencao" });
    }
    return { user: data.user };
  },
  component: () => <Outlet />,
});
