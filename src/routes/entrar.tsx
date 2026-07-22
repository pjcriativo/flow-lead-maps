// /entrar — pouso de MAGIC LINK. Pública e SEM guard de propósito: quando o link de acesso
// aterrissa numa rota com beforeLoad de auth, o guard corre contra o processamento do
// #access_token e a página trava em branco (bug real, reproduzido). Aqui a página monta,
// ESPERA a sessão do fragment ser processada e só então navega — sem corrida.
import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { FlowLeadsLogo } from "@/components/FlowLeadsLogo";

export const Route = createFileRoute("/entrar")({
  ssr: false,
  component: Entrar,
});

function Entrar() {
  const navigate = useNavigate();
  const [falhou, setFalhou] = useState(false);

  useEffect(() => {
    let vivo = true;
    (async () => {
      // o supabase consome o #access_token na inicialização; aguardamos a sessão aparecer
      for (let i = 0; i < 40; i++) {
        const { data } = await supabase.auth.getSession();
        if (!vivo) return;
        if (data.session) {
          navigate({ to: "/admin", replace: true });
          return;
        }
        await new Promise((r) => setTimeout(r, 250));
      }
      if (vivo) setFalhou(true);
    })();
    return () => {
      vivo = false;
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <FlowLeadsLogo className="h-10" />
      {falhou ? (
        <div className="text-center">
          <p className="text-sm text-destructive">
            O link expirou ou já foi usado (ele vale uma vez só).
          </p>
          <button
            onClick={() => navigate({ to: "/auth" })}
            className="mt-3 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Entrar pelo login
          </button>
        </div>
      ) : (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Entrando no painel…
        </p>
      )}
    </div>
  );
}
