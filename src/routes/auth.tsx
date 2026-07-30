import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FlowLeadsLogo } from "@/components/FlowLeadsLogo";
import { ArrowLeft, Eye, EyeOff, Sparkles } from "lucide-react";
import { posthog } from "@/lib/posthog";
import { lerConfigPublica } from "@/services/config-publica";
import { z } from "zod";

const authSearchSchema = z.object({
  mode: z.enum(["signin", "signup", "forgot"]).optional(),
  tab: z.string().optional(),
});

const cadastroSchema = z
  .object({
    nome: z.string().trim().min(2, "Informe seu nome completo."),
    email: z.string().trim().email("Informe um e-mail válido."),
    phone: z.string().trim().min(8, "Informe um telefone/WhatsApp válido."),
    password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
    confirmPassword: z.string(),
  })
  .refine((dados) => dados.password === dados.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

export const Route = createFileRoute("/auth")({
  validateSearch: authSearchSchema,
  head: () => ({
    meta: [
      { title: "Entrar ou Criar Conta — Flow Leads" },
      { name: "description", content: "Acesse ou crie sua conta no Flow Leads." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const initialMode =
    search.mode === "signup" || search.tab === "signup"
      ? "signup"
      : search.mode === "forgot"
        ? "forgot"
        : "signin";

  const [mode, setMode] = useState<"signin" | "signup" | "forgot">(initialMode);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [cadastroAtivo, setCadastroAtivo] = useState(true);
  const [termosAtivo, setTermosAtivo] = useState(false);
  const [aceitouTermos, setAceitouTermos] = useState(false);

  useEffect(() => {
    if (search.mode === "signup" || search.tab === "signup") {
      setMode("signup");
    } else if (search.mode === "signin") {
      setMode("signin");
    }
  }, [search.mode, search.tab]);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        // Verificar portão de aprovação antes de ir para o dashboard
        const { data: perfil } = await supabase
          .from("profiles")
          .select("is_super_admin, acesso_liberado")
          .eq("id", data.user.id)
          .maybeSingle();

        if (perfil?.is_super_admin === true || perfil?.acesso_liberado === true) {
          navigate({ to: "/dashboard", replace: true });
        } else {
          navigate({ to: "/aguardando-aprovacao", replace: true });
        }
      }
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
        const validacao = cadastroSchema.safeParse({ nome, email, phone, password, confirmPassword });
        if (!validacao.success) {
          setError(validacao.error.issues[0]?.message ?? "Revise os dados do cadastro.");
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email: validacao.data.email,
          password: validacao.data.password,
          options: {
            data: {
              full_name: validacao.data.nome,
              phone: validacao.data.phone,
            },
            emailRedirectTo: `${window.location.origin}/aguardando-aprovacao`,
          },
        });
        if (error) throw error;
        posthog.capture("user_signed_up", { email });
        if (data.session) {
          navigate({ to: "/aguardando-aprovacao", replace: true });
        } else {
          setInfo(
            "Conta criada. Confirme seu e-mail e, depois, aguarde a liberação manual do administrador.",
          );
        }
        return;
      } else {
        const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (authData.user) {
          const { data: perfil } = await supabase
            .from("profiles")
            .select("is_super_admin, acesso_liberado")
            .eq("id", authData.user.id)
            .maybeSingle();

          if (perfil?.is_super_admin === true || perfil?.acesso_liberado === true) {
            navigate({ to: "/dashboard", replace: true });
          } else {
            navigate({ to: "/aguardando-aprovacao", replace: true });
          }
          return;
        }
      }
      navigate({ to: "/dashboard", replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha na autenticação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-2">
      {/* 🟢 Coluna da Esquerda: Painel Hero com Imagem Profissional e Badges (Oculto em telas pequenas) */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-slate-950 p-12 text-white lg:flex">
        {/* Banner com Overlay em Gradiente */}
        <div className="absolute inset-0 z-0">
          <img
            src="/auth-hero.png"
            alt="Flow Leads Prospecção B2B"
            className="h-full w-full object-cover object-center opacity-55 transition-transform duration-1000 hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/40 to-transparent" />
        </div>

        {/* Top Branding Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <FlowLeadsLogo className="h-9 w-auto text-white" />
        </div>

        {/* Conteúdo Central e Badges de Métricas */}
        <div className="relative z-10 my-auto max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-blue-200 backdrop-blur-md shadow-lg">
            <Sparkles className="h-3.5 w-3.5 text-blue-400" />
            <span>Inteligência de Vendas B2B</span>
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-white leading-tight md:text-4xl">
            Gere leads qualificados do Google Maps em um único clique.
          </h2>

          <p className="text-sm leading-relaxed text-slate-300">
            Descubra empresas locais, colete telefones e e-mails verificados, envie propostas pelo WhatsApp e potencialize a prospecção da sua equipe.
          </p>

          {/* Cards com efeito Glassmorphism */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-md">
              <p className="text-2xl font-bold text-white">+50k</p>
              <p className="text-xs text-slate-400">Leads pesquisados/mês</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-md">
              <p className="text-2xl font-bold text-blue-400">99.8%</p>
              <p className="text-xs text-slate-400">Precisão de contatos</p>
            </div>
          </div>
        </div>

        {/* Rodapé da Coluna Esquerda */}
        <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-6 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Flow Leads. Todos os direitos reservados.</p>
          <Link to="/privacy" className="transition-colors hover:text-white">
            Privacidade
          </Link>
        </div>
      </div>

      {/* 🔵 Coluna da Direita: Formulário de Login / Cadastro Responsivo */}
      <div className="flex flex-col justify-between bg-background p-6 md:p-10 lg:p-14 overflow-y-auto">
        {/* Topo: Atalho de voltar */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar ao site
          </Link>
          <div className="lg:hidden">
            <FlowLeadsLogo className="h-8 w-auto" />
          </div>
        </div>

        {/* Caixa Central do Formulário */}
        <div className="mx-auto my-auto w-full max-w-sm space-y-6 py-6">
          {mode !== "forgot" && cadastroAtivo && (
            <div className="flex rounded-lg bg-muted p-1 text-sm font-medium">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setInfo(null);
                  setMode("signin");
                }}
                className={`flex-1 rounded-md py-2 text-center transition-all ${
                  mode === "signin"
                    ? "bg-background text-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setInfo(null);
                  setMode("signup");
                }}
                className={`flex-1 rounded-md py-2 text-center transition-all ${
                  mode === "signup"
                    ? "bg-background text-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Criar conta
              </button>
            </div>
          )}

          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {mode === "signin"
                ? "Bem-vindo de volta"
                : mode === "signup"
                  ? "Crie sua conta"
                  : "Redefina sua senha"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {mode === "signin"
                ? "Entre para acessar seu painel."
                : mode === "signup"
                  ? "Comece a encontrar leads em segundos."
                  : "Informe seu e-mail e enviaremos um link de redefinição."}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="nome">Nome completo</Label>
                  <Input
                    id="nome"
                    type="text"
                    required
                    placeholder="Seu nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="seuemail@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone">Telefone / WhatsApp</Label>
                  <Input
                    id="phone"
                    type="tel"
                    required
                    placeholder="(11) 99999-9999"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password">Criar senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={8}
                      placeholder="Sua senha"
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
                  <p className="text-xs text-muted-foreground">Use pelo menos 8 caracteres.</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password">Confirmar senha</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={8}
                      placeholder="Confirme sua senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pr-10"
                      aria-invalid={confirmPassword.length > 0 && password !== confirmPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "Ocultar senhas" : "Mostrar senhas"}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {confirmPassword.length > 0 && password !== confirmPassword && (
                    <p className="text-xs text-destructive">As senhas não coincidem.</p>
                  )}
                </div>
              </>
            )}

            {mode === "signin" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="seuemail@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Senha</Label>
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
                </div>
              </>
            )}

            {mode === "forgot" && (
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="seuemail@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
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

            <Button type="submit" className="w-full h-10 font-semibold" disabled={loading}>
              {loading
                ? "Aguarde..."
                : mode === "signin"
                  ? "Entrar"
                  : mode === "signup"
                    ? "Criar minha conta"
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
                setConfirmPassword("");
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

        {/* Rodapé Direita */}
        <div className="text-center text-xs text-muted-foreground">
          Ao continuar, você concorda com nossos{" "}
          <Link to="/terms" className="underline hover:text-foreground">
            Termos de Serviço
          </Link>
        </div>
      </div>
    </div>
  );
}


