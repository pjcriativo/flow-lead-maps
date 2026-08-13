import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  CheckCircle2,
  Clock3,
  ExternalLink,
  Loader2,
  Lock,
  LogOut,
  MessageSquare,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

export function AguardandoAprovacaoPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [verificando, setVerificando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [modalBoasVindasAberto, setModalBoasVindasAberto] = useState(true);

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

  const whatsappSuporteUrl = `https://wa.me/5511999999999?text=${encodeURIComponent(
    `Olá! Acabei de criar minha conta no Flow Leads${
      email ? ` (${email})` : ""
    }. Gostaria de confirmar meu pagamento e solicitar a liberação do meu acesso.`,
  )}`;

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-10">
      {/* 🟢 Modal de Boas-Vindas & Solicitação de Liberação */}
      <Dialog open={modalBoasVindasAberto} onOpenChange={setModalBoasVindasAberto}>
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader className="space-y-3 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary w-fit mx-auto sm:mx-0">
              <Sparkles className="size-3.5 text-primary" />
              <span>Bem-vindo ao Flow Leads</span>
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight">
              Sua conta foi cadastrada com sucesso! 🎉
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
              Para sua segurança e controle da plataforma, o acesso a todas as ferramentas de busca,
              prospecção e disparos é <strong className="text-foreground font-semibold">liberado exclusivamente após a confirmação do pagamento</strong> e aprovação do administrador.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 p-3.5 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
              <ShieldAlert className="size-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Importante:</strong> Em hipótese alguma a plataforma é liberada de forma automática sem a confirmação prévia da assinatura/pagamento pelo suporte.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-3.5 text-xs text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Lock className="size-3.5 text-primary" />
                Status do cadastro:
              </span>
              <span className="font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Pendente de Pagamento
              </span>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-col gap-2 pt-2">
            <a
              href={whatsappSuporteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full"
            >
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-2 h-10 shadow-md">
                <MessageSquare className="size-4" />
                Solicitar Liberação no WhatsApp
                <ExternalLink className="size-3.5 opacity-80" />
              </Button>
            </a>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setModalBoasVindasAberto(false)}
            >
              Entendi, aguardar liberação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 🔵 Card da Tela Principal de Aguardando Liberação */}
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
              Sua conta foi criada, mas o acesso aos recursos do Flow Leads só é ativado após a
              confirmação do pagamento e aprovação do suporte.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-lg border border-border bg-muted/40 p-4">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium">Aguardando liberação pelo admin</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Conta registada: <strong className="text-foreground">{email || "Sua conta"}</strong>.
                  Envie o comprovante de pagamento para acelerar a liberação.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <a
              href={whatsappSuporteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full block"
            >
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-2 h-10 shadow-sm">
                <MessageSquare className="size-4" />
                Falar com Suporte (WhatsApp)
                <ExternalLink className="size-3.5 opacity-80" />
              </Button>
            </a>
          </div>

          <div className="flex items-start gap-3 text-sm text-muted-foreground pt-1">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <p>Depois da confirmação, clique em “Verificar acesso” para entrar no seu painel.</p>
          </div>

          {erro && (
            <p
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
            >
              {erro}
            </p>
          )}

          <div className="flex flex-col gap-2 sm:flex-row pt-2">
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

