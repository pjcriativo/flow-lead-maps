import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Clock3, Loader2, LogOut, RefreshCw, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FlowLeadsLogo } from "@/components/FlowLeadsLogo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/aguardando-aprovacao")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Aguardando liberação — Flow Leads" },
      {
        name: "description",
        content: "Seu cadastro está aguardando a liberação do administrador.",
      },
    ],
  }),
  component: AguardandoAprovacaoPage,
});

function AguardandoAprovacaoPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [verificando, setVerificando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const verificarAcesso = useCallback(async () => {
    setVerificando(true);
    setErro(null);

    const { data: usuario, error: userError } = await supabase.auth.getUser();
    if (userError || !usuario.user) {
      navigate({ to: "/auth", replace: true });
      return;
    }

    setEmail(usuario.user.email ?? "");
    const { data: perfil, error: profileError } = await supabase
      .from("profiles")
      .select("acesso_liberado, is_super_admin")
      .eq("id", usuario.user.id)
      .maybeSingle();

    if (profileError) {
      setErro("Não foi possível verificar sua liberação. Tente novamente.");
      setVerificando(false);
      return;
    }

    if (perfil?.is_super_admin === true) {
      navigate({ to: "/admin", replace: true });
      return;
    }
    if (perfil?.acesso_liberado === true) {
      navigate({ to: "/dashboard", replace: true });
      return;
    }

    setVerificando(false);
  }, [navigate]);

  useEffect(() => {
    void verificarAcesso();
  }, [verificarAcesso]);

  const sair = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-lg overflow-hidden shadow-[var(--shadow-card)]">
        <div className="h-1.5 bg-primary" />
        <CardHeader className="items-center space-y-4 pb-3 text-center">
          <FlowLeadsLogo className="h-10 w-auto" />
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Clock3 className="size-8" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl">Cadastro em análise</CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              Sua conta foi criada, mas o acesso aos recursos do Flow Leads precisa ser liberado
              manualmente por um administrador.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-lg border border-border bg-muted/40 p-4">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium">Aguardando liberação</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {email || "Sua conta"} será avisada pelo administrador quando o acesso estiver
                  disponível.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 text-sm text-muted-foreground">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <p>Depois da liberação, clique em “Verificar acesso” para entrar no painel.</p>
          </div>

          {erro && (
            <p
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
            >
              {erro}
            </p>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button className="flex-1" onClick={verificarAcesso} disabled={verificando}>
              {verificando ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              {verificando ? "Verificando..." : "Verificar acesso"}
            </Button>
            <Button variant="outline" onClick={sair}>
              <LogOut className="size-4" />
              Sair
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
