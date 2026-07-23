import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FlowLeadsLogo } from "@/components/FlowLeadsLogo";
import { Eye, EyeOff } from "lucide-react";
import { posthog } from "@/lib/posthog";
import { lerConfigPublica } from "@/services/config-publica";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Flow Leads" },
      { name: "description", content: "Entre na sua conta do Flow Leads." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [cadastroAtivo, setCadastroAtivo] = useState(true);
  const [termosAtivo, setTermosAtivo] = useState(false);
  const [aceitouTermos, setAceitouTermos] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard", replace: true });
    });
    // ⚙️ Configurações (admin → Painel de controle): cadastro de usuário / termos e condições.
    lerConfigPublica().then((c) => {
      setCadastroAtivo(c.cadastro_usuario_ativo);
      setTermosAtivo(c.termos_condicoes_ativo);
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setInfo("Enviamos o link de redefinição de senha. Verifique seu e-mail.");
        return;
      }
      if (mode === "signup") {
        if (!cadastroAtivo) {
          setError("Cadastro de novos usuários está temporariamente desativado.");
          return;
        }
        if (termosAtivo && !aceitouTermos) {
          setError("Você precisa aceitar os Termos e Condições para criar uma conta.");
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/dashboard` },
        });
        if (error) throw error;
        posthog.capture("user_signed_up", { email });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/dashboard", replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha na autenticação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
        <div className="flex justify-center">
          <FlowLeadsLogo className="h-10 w-auto" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            {mode === "signin"
              ? "Bem-vindo de volta"
              : mode === "signup"
                ? "Crie sua conta"
                : "Redefina sua senha"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Entre para acessar seu painel."
              : mode === "signup"
                ? "Comece a encontrar leads em segundos."
                : "Informe seu e-mail e enviaremos um link de redefinição."}
          </p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {mode !== "forgot" && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                {mode === "signin" && (
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setError(null);
                      setInfo(null);
                      setMode("forgot");
                    }}
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <label className="flex items-center gap-2 pt-1 text-xs text-muted-foreground select-none">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-border"
                />
                Mostrar senha
              </label>
            </div>
          )}
          {mode === "signup" && termosAtivo && (
            <label className="flex items-start gap-2 text-xs text-muted-foreground select-none">
              <input
                type="checkbox"
                checked={aceitouTermos}
                onChange={(e) => setAceitouTermos(e.target.checked)}
                className="mt-0.5 h-3.5 w-3.5 rounded border-border"
              />
              <span>
                Li e aceito os{" "}
                <Link to="/terms" target="_blank" className="underline hover:text-foreground">
                  Termos e Condições
                </Link>
              </span>
            </label>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {info && <p className="text-sm text-emerald-600">{info}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading
              ? "Aguarde..."
              : mode === "signin"
                ? "Entrar"
                : mode === "signup"
                  ? "Cadastrar"
                  : "Enviar link de redefinição"}
          </Button>
        </form>
        {(mode !== "signin" || cadastroAtivo) && (
          <button
            type="button"
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
            onClick={() => {
              setError(null);
              setInfo(null);
              setMode(mode === "signin" ? "signup" : "signin");
            }}
          >
            {mode === "signin"
              ? "Não tem conta? Cadastre-se"
              : mode === "signup"
                ? "Já tem conta? Entrar"
                : "Voltar para entrar"}
          </button>
        )}
      </div>
    </div>
  );
}
