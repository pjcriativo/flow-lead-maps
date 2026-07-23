import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FlowLeadsLogo } from "@/components/FlowLeadsLogo";
import {
  Users,
  Sheet as SheetIcon,
  Settings as SettingsIcon,
  Search,
  LayoutGrid,
  FolderOpen,
  FileText,
  ScrollText,
  Wallet,
  Wand2,
  Rocket,
  Loader2,
  CheckCircle2,
  XCircle,
  LogOut,
  MessageCircle,
  Megaphone,
  Bot,
  ShieldCheck,
  LifeBuoy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { posthog } from "@/lib/posthog";
import { SearchSection } from "@/components/leads/SearchSection";
import { PipelineSection } from "@/components/leads/PipelineSection";
import { LeadsManager } from "@/components/leads/LeadsManager";
import { PropostasSection } from "@/components/propostas/PropostasSection";
import { FinanceiroSection } from "@/components/financeiro/FinanceiroSection";
import { ContratosSection } from "@/components/contratos/ContratosSection";
import { RedesignSection } from "@/components/redesign/RedesignSection";
import { MinhasListasSection } from "@/components/leads/MinhasListasSection";
import { PublicarSection } from "@/components/publicar/PublicarSection";
import { WhatsAppSection } from "@/components/whatsapp/WhatsAppSection";
import { CampanhasSection } from "@/components/campanhas/CampanhasSection";
import { AutomacaoSection } from "@/components/automacao/AutomacaoSection";
import { SuporteSection } from "@/components/suporte/SuporteSection";
import { lerPerfilEmail, salvarNomeRemetente, salvarReplyTo, emailValido } from "@/services/perfil";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Painel — Flow Leads" },
      {
        name: "description",
        content: "Prospecte, qualifique e gerencie seus leads no painel do Flow Leads.",
      },
      { property: "og:title", content: "Painel — Flow Leads" },
      {
        property: "og:description",
        content: "Prospecte, qualifique e gerencie seus leads no painel do Flow Leads.",
      },
      { property: "og:url", content: "https://flowleads.com.br/dashboard" },
    ],
    links: [{ rel: "canonical", href: "https://flowleads.com.br/dashboard" }],
  }),
  component: Dashboard,
});

// Backend legado do Google Sheets (fluxo antigo). A busca/qualificação da Fase 1
// roda 100% nas Edge Functions do Supabase — não usa este API_BASE.
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

let currentUserId = "";
function getUserId(): string {
  return currentUserId;
}

type Section =
  | "buscar"
  | "listas"
  | "pipeline"
  | "leads"
  | "propostas"
  | "campanhas"
  | "whatsapp"
  | "automacao"
  | "contratos"
  | "financeiro"
  | "redesign"
  | "publicar"
  | "suporte"
  // "sheets" (Google Sheets) segue no código como DEPRECATED — fora da navegação
  // (o dono não usa). A seção ainda renderiza p/ não quebrar o callback de OAuth.
  | "sheets"
  | "settings";

// "Google Sheets" saiu da sidebar (deprecated). No lugar entrou "Campanhas".
const NAV: { id: Section; label: string; Icon: typeof Search }[] = [
  { id: "buscar", label: "Buscar", Icon: Search },
  { id: "listas", label: "Minhas Listas", Icon: FolderOpen },
  { id: "pipeline", label: "Pipeline", Icon: LayoutGrid },
  { id: "leads", label: "Meus Leads", Icon: Users },
  { id: "propostas", label: "Propostas", Icon: FileText },
  { id: "campanhas", label: "Campanhas", Icon: Megaphone },
  { id: "whatsapp", label: "WhatsApp", Icon: MessageCircle },
  { id: "automacao", label: "Automação", Icon: Bot },
  { id: "contratos", label: "Contratos", Icon: ScrollText },
  { id: "financeiro", label: "Financeiro", Icon: Wallet },
  { id: "redesign", label: "Redesign", Icon: Wand2 },
  { id: "publicar", label: "Publicar", Icon: Rocket },
  { id: "suporte", label: "Suporte", Icon: LifeBuoy },
  { id: "settings", label: "Configurações", Icon: SettingsIcon },
];

function Dashboard() {
  const navigate = useNavigate();
  const [section, setSection] = useState<Section>("buscar");
  const [focusRedesignLead, setFocusRedesignLead] = useState<string | null>(null);
  const [sheetUrl, setSheetUrl] = useState("");
  const [sheetVerified, setSheetVerified] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [userReady, setUserReady] = useState(false);
  const [superAdmin, setSuperAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        currentUserId = data.user.id;
        // porta do painel /admin — só aparece para quem tem o papel no banco (profiles)
        const { data: perfil } = await supabase
          .from("profiles")
          .select("is_super_admin")
          .eq("id", data.user.id)
          .maybeSingle();
        setSuperAdmin(perfil?.is_super_admin === true);
      }
      setUserReady(true);
    });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("sheets_connected") === "true") setSection("sheets");
    // deep-link de seção (ex.: /dashboard?secao=automacao — usado pelo painel /admin)
    const secao = params.get("secao");
    if (secao && NAV.some((n) => n.id === secao)) setSection(secao as Section);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  if (!userReady) return null;

  return (
    <div className="flex min-h-screen w-full bg-white text-foreground">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
        <Link to="/" className="flex items-center px-4 py-5">
          <FlowLeadsLogo variant="dark" className="h-12 w-auto" />
        </Link>
        <nav className="flex-1 space-y-1 px-3 py-2">
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                section === item.id
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              )}
            >
              <item.Icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="px-3 pb-2">
          {superAdmin && (
            <Link
              to="/admin"
              className="flex w-full items-center gap-3 rounded-md border border-gold/30 px-3 py-2 text-sm text-gold transition-colors hover:bg-sidebar-accent/60"
            >
              <ShieldCheck className="h-4 w-4" />
              Painel Admin
            </Link>
          )}
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
        <div className="border-t border-sidebar-border p-4 text-xs text-sidebar-foreground/50">
          v1.0
        </div>
      </aside>

      {/* Mobile top tabs */}
      <div className="fixed left-0 right-0 top-0 z-30 flex items-center gap-1 overflow-x-auto border-b border-border bg-sidebar px-2 py-2 md:hidden">
        {NAV.map((item) => (
          <button
            key={item.id}
            onClick={() => setSection(item.id)}
            className={cn(
              "shrink-0 rounded-md px-3 py-1.5 text-xs",
              section === item.id
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <main className="min-w-0 flex-1 bg-white px-4 pb-10 pt-16 md:px-8 md:pt-8">
        {section === "buscar" && <SearchSection />}
        {section === "listas" && (
          <MinhasListasSection
            onOpenRedesign={(leadId) => {
              setFocusRedesignLead(leadId);
              setSection("redesign");
            }}
          />
        )}
        {section === "pipeline" && <PipelineSection />}
        {section === "leads" && (
          <LeadsManager
            onOpenRedesign={(leadId) => {
              setFocusRedesignLead(leadId);
              setSection("redesign");
            }}
          />
        )}
        {section === "propostas" && <PropostasSection />}
        {section === "campanhas" && <CampanhasSection />}
        {section === "whatsapp" && <WhatsAppSection />}
        {section === "automacao" && <AutomacaoSection onRevisar={() => setSection("campanhas")} />}
        {section === "contratos" && <ContratosSection />}
        {section === "financeiro" && <FinanceiroSection />}
        {section === "redesign" && (
          <RedesignSection
            focusLeadId={focusRedesignLead}
            onFocusConsumed={() => setFocusRedesignLead(null)}
          />
        )}
        {section === "publicar" && <PublicarSection />}
        {section === "suporte" && <SuporteSection />}
        {/* DEPRECATED: Google Sheets saiu da sidebar. Render mantido só para não
            quebrar o callback de OAuth (?sheets_connected=true). Remover em passo à parte. */}
        {section === "sheets" && (
          <SheetsSection
            sheetUrl={sheetUrl}
            setSheetUrl={setSheetUrl}
            googleConnected={googleConnected}
            setGoogleConnected={setGoogleConnected}
            sheetVerified={sheetVerified}
            setSheetVerified={setSheetVerified}
          />
        )}
        {section === "settings" && <SettingsSection />}
      </main>
    </div>
  );
}

/* -------------------- Google Sheets (fluxo legado) -------------------- */
function SheetsSection({
  sheetUrl,
  setSheetUrl,
  googleConnected,
  setGoogleConnected,
  sheetVerified,
  setSheetVerified,
}: {
  sheetUrl: string;
  setSheetUrl: (s: string) => void;
  googleConnected: boolean;
  setGoogleConnected: (b: boolean) => void;
  sheetVerified: boolean;
  setSheetVerified: (b: boolean) => void;
}) {
  const [connecting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [sheetTitle, setSheetTitle] = useState<string>("");
  const [sheetError, setSheetError] = useState<string>("");
  const [sheetsList, setSheetsList] = useState<Array<{ name: string; url: string }>>([]);
  const [loadingSheets, setLoadingSheets] = useState(false);
  const [sheetsError, setSheetsError] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("sheets_connected") === "true") {
        const returnedUserId = params.get("user_id");
        if (returnedUserId) currentUserId = returnedUserId;
        setGoogleConnected(true);
        posthog.capture("google_sheets_connected");
        window.history.replaceState({}, "", "/dashboard");
        return;
      }
    }
    const userId = getUserId();
    fetch(`${API_BASE}/auth/status/${userId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.authenticated) setGoogleConnected(true);
      })
      .catch(() => {});
  }, [setGoogleConnected]);

  const connectGoogle = async () => {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id;
    if (!userId) return;
    window.location.href = `${API_BASE}/auth/login?user_id=${encodeURIComponent(userId)}`;
  };

  const loadSheets = async () => {
    setLoadingSheets(true);
    setSheetsError(null);
    setSheetsList([]);
    try {
      const userId = getUserId();
      const res = await fetch(`${API_BASE}/sheets/list?user_id=${encodeURIComponent(userId)}`);
      if (!res.ok) throw new Error(`Falha ao carregar as planilhas: ${res.status}`);
      const json = await res.json();
      const list: Array<{
        url?: string;
        id?: string;
        name?: string;
        title?: string;
        sheet_name?: string;
      }> = Array.isArray(json.sheets) ? json.sheets : Array.isArray(json) ? json : [];
      const normalized = list
        .filter((s) => s && (s.url || s.id))
        .map((s) => ({
          name: s.name ?? s.title ?? s.sheet_name ?? "Planilha sem título",
          url: s.url ?? `https://docs.google.com/spreadsheets/d/${s.id}/edit`,
        }));
      if (normalized.length === 0)
        setSheetsError("Nenhuma planilha encontrada. Cole uma URL manualmente.");
      else setSheetsList(normalized);
    } catch {
      setSheetsError("Não foi possível carregar as planilhas. Cole a URL manualmente.");
    } finally {
      setLoadingSheets(false);
    }
  };

  const handleSelectSheet = (url: string) => {
    setSheetUrl(url);
    setSheetVerified(false);
    setSheetTitle("");
    setSheetError("");
  };

  const verifySheet = async () => {
    setTesting(true);
    setSheetError("");
    setSheetVerified(false);
    setSheetTitle("");
    try {
      const res = await fetch(`${API_BASE}/sheets/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: getUserId(), sheet_url: sheetUrl, sheet_name: "Leads" }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok && (j.success ?? j.ok)) {
        setSheetVerified(true);
        setSheetTitle(j.sheet_title ?? j.title ?? j.spreadsheet_title ?? "Planilha");
      } else {
        setSheetError(j.error ?? j.message ?? "Não foi possível acessar a planilha");
      }
    } catch (e) {
      setSheetError(e instanceof Error ? e.message : "Erro de rede");
    } finally {
      setTesting(false);
    }
  };

  const disconnect = async () => {
    const userId = getUserId();
    try {
      await fetch(`${API_BASE}/auth/revoke/${userId}`, { method: "POST" });
    } catch {
      /* ignora erro de revogação (best-effort) */
    }
    setGoogleConnected(false);
    setSheetVerified(false);
    setSheetUrl("");
    setSheetTitle("");
    setSheetError("");
    setSheetsList([]);
    setSheetsError(null);
    setManualMode(false);
    setAuthError(null);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Google Sheets</h1>
        <p className="text-sm text-muted-foreground">
          Sincronize leads direto para uma planilha (fluxo legado).
        </p>
      </div>
      <div className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        {!googleConnected ? (
          <>
            <p className="text-sm text-muted-foreground">
              Conecte sua conta Google para sincronizar leads nas suas planilhas.
            </p>
            <button
              onClick={connectGoogle}
              disabled={connecting}
              className="inline-flex h-11 items-center gap-3 rounded-md border border-[#dadce0] bg-white px-5 text-sm font-medium text-[#3c4043] shadow-sm transition hover:bg-[#f8f9fa] disabled:opacity-60"
            >
              {connecting ? (
                <Loader2 className="h-4 w-4 animate-spin text-[#4285F4]" />
              ) : (
                <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                  <path
                    fill="#4285F4"
                    d="M17.64 9.2c0-.64-.06-1.25-.17-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.92c1.71-1.57 2.68-3.88 2.68-6.61z"
                  />
                  <path
                    fill="#34A853"
                    d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M3.97 10.71A5.41 5.41 0 0 1 3.68 9c0-.59.1-1.17.29-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.04l3.01-2.33z"
                  />
                  <path
                    fill="#EA4335"
                    d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A8.99 8.99 0 0 0 9 0 9 9 0 0 0 .96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
                  />
                </svg>
              )}
              {connecting ? "Aguardando o Google..." : "Conectar conta Google"}
            </button>
            {authError && <p className="text-sm text-destructive">{authError}</p>}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between rounded-md border border-[oklch(0.7_0.18_150)]/40 bg-[oklch(0.7_0.18_150)]/10 p-3 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[oklch(0.55_0.18_150)]" />
                <span className="font-medium text-[oklch(0.45_0.18_150)]">
                  Conta Google conectada
                </span>
              </div>
              <button
                onClick={disconnect}
                className="text-xs text-muted-foreground underline underline-offset-2 hover:text-destructive"
              >
                Desconectar
              </button>
            </div>

            {!manualMode && (
              <div className="space-y-2">
                <Button
                  variant="outline"
                  onClick={loadSheets}
                  disabled={loadingSheets}
                  className="w-full justify-start gap-2"
                >
                  {loadingSheets ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <SheetIcon className="h-4 w-4" />
                  )}
                  {loadingSheets ? "Carregando suas planilhas..." : "Carregar minhas planilhas"}
                </Button>
                {sheetsError && <p className="text-sm text-destructive">{sheetsError}</p>}
                {sheetsList.length > 0 && (
                  <div className="space-y-1">
                    <Label htmlFor="sheet-select">Selecione uma planilha</Label>
                    <Select value={sheetUrl} onValueChange={handleSelectSheet}>
                      <SelectTrigger id="sheet-select" aria-label="Selecione uma planilha">
                        <SelectValue placeholder="Escolha uma planilha..." />
                      </SelectTrigger>
                      <SelectContent>
                        {sheetsList.map((s) => (
                          <SelectItem key={s.url} value={s.url}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setManualMode(true);
                    setSheetsError(null);
                  }}
                  className="text-xs text-muted-foreground underline underline-offset-2 hover:text-primary"
                >
                  Ou cole a URL manualmente
                </button>
              </div>
            )}

            {manualMode && (
              <div className="space-y-2">
                <Label htmlFor="url">URL da planilha do Google</Label>
                <Input
                  id="url"
                  placeholder="Cole aqui a URL da sua planilha do Google"
                  value={sheetUrl}
                  onChange={(e) => {
                    setSheetUrl(e.target.value);
                    setSheetVerified(false);
                    setSheetTitle("");
                    setSheetError("");
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setManualMode(false);
                    setSheetsError(null);
                  }}
                  className="text-xs text-muted-foreground underline underline-offset-2 hover:text-primary"
                >
                  Voltar para Carregar minhas planilhas
                </button>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={verifySheet} disabled={testing || !sheetUrl}>
                {testing ? (
                  <>
                    <Loader2 className="animate-spin" /> Verificando acesso à planilha…
                  </>
                ) : (
                  "Testar e salvar planilha"
                )}
              </Button>
            </div>
            {sheetVerified && (
              <div className="flex items-center gap-2 rounded-md border border-[oklch(0.7_0.18_150)]/40 bg-[oklch(0.7_0.18_150)]/10 p-3 text-sm text-[oklch(0.45_0.18_150)]">
                <CheckCircle2 className="h-4 w-4 text-[oklch(0.55_0.18_150)]" />
                <span className="font-medium">Planilha conectada: {sheetTitle}</span>
              </div>
            )}
            {sheetError && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                <XCircle className="h-4 w-4" />
                <span className="font-medium">{sheetError}</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* -------------------- Configurações -------------------- */
function SettingsSection() {
  const [nome, setNome] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState<null | "nome" | "reply">(null);

  useEffect(() => {
    (async () => {
      try {
        const p = await lerPerfilEmail();
        setNome(p.nome);
        setReplyTo(p.replyTo);
      } finally {
        setCarregando(false);
      }
    })();
  }, []);

  const salvar = async () => {
    setSalvando("nome");
    try {
      await salvarNomeRemetente(nome);
      toast.success("Nome salvo — é ele que assina os seus e-mails.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao salvar");
    } finally {
      setSalvando(null);
    }
  };

  const salvarResposta = async () => {
    setSalvando("reply");
    try {
      await salvarReplyTo(replyTo);
      toast.success("E-mail de respostas salvo — é nele que as respostas chegam.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao salvar");
    } finally {
      setSalvando(null);
    }
  };

  const replyInvalido = !!replyTo.trim() && !emailValido(replyTo);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground">Preferências do app.</p>
      </div>

      {/* Assinatura dos e-mails ({remetente} da proposta e do follow-up). Sem isto a
          geração da proposta para: assinar com um nome inventado seria pior. */}
      <div className="space-y-3 rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <div>
          <Label htmlFor="remetente" className="text-sm font-medium">
            Seu nome (assina os e-mails)
          </Label>
          <div className="text-xs text-muted-foreground">
            Vai no fim da proposta e do follow-up. É um nome pessoal — quem recebe responde pra uma
            pessoa, não pra uma empresa.
          </div>
        </div>
        <div className="flex gap-2">
          <Input
            id="remetente"
            placeholder={carregando ? "Carregando..." : "Ex.: Marcos Pereira"}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            disabled={carregando}
          />
          <Button onClick={salvar} disabled={!!salvando || carregando || !nome.trim()}>
            {salvando === "nome" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
          </Button>
        </div>
        {!carregando && !nome.trim() && (
          <p className="text-xs text-amber-700">
            Enquanto estiver vazio, a geração de propostas fica bloqueada.
          </p>
        )}
      </div>

      {/* Reply-To. NÃO é o remetente: o From fica no domínio verificado (trocá-lo pelo
          e-mail pessoal, sem verificar o domínio, seria spoofing → spam). A UI precisa
          deixar essa diferença explícita, senão o usuário acha que mudou o remetente. */}
      <div className="space-y-3 rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <div>
          <Label htmlFor="reply-to" className="text-sm font-medium">
            E-mail para respostas
          </Label>
          <div className="text-xs text-muted-foreground">
            As respostas dos leads chegam neste e-mail. Pode ser o seu e-mail de sempre — não
            precisa ser do mesmo domínio.
          </div>
        </div>
        <div className="flex gap-2">
          <Input
            id="reply-to"
            type="email"
            inputMode="email"
            placeholder={carregando ? "Carregando..." : "Ex.: voce@suaempresa.com.br"}
            value={replyTo}
            onChange={(e) => setReplyTo(e.target.value)}
            disabled={carregando}
            aria-invalid={replyInvalido}
          />
          <Button
            onClick={salvarResposta}
            disabled={!!salvando || carregando || !replyTo.trim() || replyInvalido}
          >
            {salvando === "reply" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
          </Button>
        </div>
        {replyInvalido && (
          <p className="text-xs text-destructive">Este e-mail não parece válido.</p>
        )}
        {!carregando && !replyTo.trim() && (
          <p className="text-xs text-amber-700">
            Enquanto estiver vazio, o envio de propostas fica bloqueado — sem isto a resposta do
            lead cai numa caixa que você não lê.
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Os e-mails continuam saindo de{" "}
          <b className="text-foreground">contato@flowgenius.com.br</b> (domínio verificado, para não
          cair em spam). Só a <b className="text-foreground">resposta</b> vem para o endereço acima.
        </p>
      </div>

      <div className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between rounded-md border border-border p-3">
          <div>
            <Label htmlFor="email-enrich" className="cursor-pointer text-sm font-medium">
              Buscar e-mails por padrão
            </Label>
            <div className="text-xs text-muted-foreground">
              Ativar "Buscar e-mails" (visita o site) em toda nova busca.
            </div>
          </div>
          <Switch id="email-enrich" defaultChecked />
        </div>
      </div>
    </div>
  );
}
