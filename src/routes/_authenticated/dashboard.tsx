import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Sheet as SheetIcon, Loader2, CheckCircle2, XCircle } from "lucide-react";
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
import { InstagramWorkspace } from "@/components/instagram/InstagramWorkspace";
import { FlowAcademyComingSoon } from "@/components/academy/FlowAcademyComingSoon";
import { BusinessNetworkComingSoon } from "@/components/network/BusinessNetworkComingSoon";
import { PipelineSection } from "@/components/leads/PipelineSection";
import { PipelinePremiumView } from "@/components/pipeline-premium/PipelinePremiumView";
import { LeadsManager } from "@/components/leads/LeadsManager";
import { LeadsPremiumView } from "@/components/leads-premium/LeadsPremiumView";
import { PropostasSection } from "@/components/propostas/PropostasSection";
import { FinanceiroSection } from "@/components/financeiro/FinanceiroSection";
import { ContratosSection } from "@/components/contratos/ContratosSection";
import { RedesignSection } from "@/components/redesign/RedesignSection";
import { MinhasListasSection } from "@/components/leads/MinhasListasSection";
import { PublicarSection } from "@/components/publicar/PublicarSection";
import { WhatsAppSection } from "@/components/whatsapp/WhatsAppSection";
import { CampanhasSection } from "@/components/campanhas/CampanhasSection";
import { CampanhasPremiumView } from "@/components/campanhas-premium/CampanhasPremiumView";
import { AutomacaoSection } from "@/components/automacao/AutomacaoSection";
import { SuporteSection } from "@/components/suporte/SuporteSection";
import { NotificacoesSection } from "@/components/notificacoes/NotificacoesSection";
import { UserProfileSection } from "@/components/perfil/UserProfileSection";
import { DashboardSidebar } from "@/components/home-premium/DashboardSidebar";
import { HomePremiumView } from "@/components/home-premium/HomePremiumView";
import { usePlanPermissions } from "@/hooks/usePlanPermissions";
import { UpgradePlanModal } from "@/components/planos/UpgradePlanModal";
import { listarMinhasNotificacoes } from "@/services/notificacoes";
import { lerConfigPublica } from "@/services/config-publica";
import { setFusoHorario } from "@/lib/format";
import { lerPerfilEmail, salvarNomeRemetente, salvarReplyTo, emailValido } from "@/services/perfil";
import { toast } from "sonner";
import { BRAND_NAME, BRAND_PRODUCT_DESCRIPTION, BRAND_SITE_URL } from "@/lib/brand";
import {
  dashboardSectionFromSearch,
  dashboardUrlForSection,
  isDashboardSection,
  type DashboardSection,
} from "@/lib/dashboard-navigation";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: `Painel — ${BRAND_NAME}` },
      {
        name: "description",
        content: BRAND_PRODUCT_DESCRIPTION,
      },
      { property: "og:title", content: `Painel — ${BRAND_NAME}` },
      {
        property: "og:description",
        content: BRAND_PRODUCT_DESCRIPTION,
      },
      { property: "og:url", content: `${BRAND_SITE_URL}/dashboard` },
    ],
    links: [{ rel: "canonical", href: `${BRAND_SITE_URL}/dashboard` }],
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

type Section = DashboardSection;

function Dashboard() {
  const planPerms = usePlanPermissions();
  const [section, setSection] = useState<Section>(() =>
    typeof window === "undefined" ? "home" : dashboardSectionFromSearch(window.location.search),
  );
  const [focusRedesignLead, setFocusRedesignLead] = useState<string | null>(null);
  const [sheetUrl, setSheetUrl] = useState("");
  const [sheetVerified, setSheetVerified] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [userReady, setUserReady] = useState(false);
  const [naoLidas, setNaoLidas] = useState(0);
  const [userProfile, setUserProfile] = useState<{
    full_name: string;
    email: string;
    avatar_url: string;
    plan: string;
  } | null>(null);
  const [upgradeModal, setUpgradeModal] = useState<{ isOpen: boolean; recurso: string }>({
    isOpen: false,
    recurso: "",
  });

  const restrictedSections = [
    "propostas",
    "contratos",
    "financeiro",
    "whatsapp",
    "automacao",
    "redesign",
    "publicar",
  ];

  const selectSection = useCallback((nextSection: Section) => {
    setSection(nextSection);
    if (typeof window !== "undefined") {
      window.history.replaceState(
        {},
        "",
        dashboardUrlForSection(window.location.href, nextSection),
      );
    }
  }, []);

  const handleNavClick = (id: Section, label: string) => {
    if (restrictedSections.includes(id) && !planPerms.canAccessPropostas && !planPerms.loading) {
      setUpgradeModal({ isOpen: true, recurso: label });
      return;
    }
    selectSection(id);
  };

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        currentUserId = data.user.id;
        // porta do painel /admin — só aparece para quem tem o papel no banco (profiles)
        const { data: perfil } = await supabase
          .from("profiles")
          .select("full_name, email, avatar_url, plan, is_super_admin")
          .eq("id", data.user.id)
          .maybeSingle();

        if (perfil) {
          setUserProfile({
            full_name: perfil.full_name ?? "",
            email: perfil.email ?? data.user.email ?? "",
            avatar_url: perfil.avatar_url ?? "",
            plan: perfil.plan ?? "starter",
          });
        }
      }
      setUserReady(true);
    });
    // badge de "Notificações" no menu — conta real (não decorativo)
    listarMinhasNotificacoes()
      .then((ns) => setNaoLidas(ns.filter((n) => !n.lida_em).length))
      .catch(() => setNaoLidas(0));
    // ⚙️ Configurações (admin): fuso horário de exibição das datas do painel
    lerConfigPublica().then((c) => setFusoHorario(c.fuso_horario));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("sheets_connected") === "true") selectSection("sheets");
    if (params.get("flow_business_connected") === "true") {
      selectSection("instagram");
      toast.success("Conta do Instagram conectada ao Flow Business.");
    }
    if (params.get("flow_business_error")) {
      selectSection("instagram");
      toast.error("Não foi possível conectar a conta do Instagram.");
    }
    // deep-link de seção (ex.: /dashboard?secao=automacao — usado pelo painel /admin)
    const secao = params.get("secao");
    if (secao === "configuracoes" || secao === "perfil") selectSection("settings");
    else if (secao === "inteligencia" || secao === "competitors") selectSection("instagram");
    else if (isDashboardSection(secao)) selectSection(secao);
  }, [selectSection]);

  if (!userReady) return null;

  const userIniciais = (userProfile?.full_name || userProfile?.email || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div
      className={cn(
        "flex min-h-svh w-full",
        section === "home" || section === "leads" || section === "pipeline" || section === "campanhas"
          ? "bg-home-background text-home-foreground"
          : "bg-background text-foreground",
      )}
    >
      {section !== "instagram" ? (
        <DashboardSidebar
          activeSection={section}
          onNavigate={handleNavClick}
          unreadNotifications={naoLidas}
          user={{
            name: userProfile?.full_name || "Meu Perfil",
            email: userProfile?.email || "Configurar perfil",
            avatarUrl: userProfile?.avatar_url || "",
            initials: userIniciais,
          }}
        />
      ) : null}

      <main
        className={cn(
          "min-w-0 flex-1",
          (section === "home" || section === "leads" || section === "pipeline" || section === "campanhas") &&
            "bg-home-background pt-14 lg:pt-0",
          section === "instagram" && "p-0",
          section !== "home" &&
            section !== "leads" &&
            section !== "pipeline" &&
            section !== "campanhas" &&
            section !== "instagram" &&
            "bg-background px-4 pb-10 pt-20 sm:px-6 lg:px-8 lg:pt-8",
        )}
      >
        {section === "home" && (
          <HomePremiumView
            user={{
              name: userProfile?.full_name || "Marcos Gonçalves",
              avatarUrl: userProfile?.avatar_url || "",
              initials: userIniciais,
            }}
            unreadNotifications={naoLidas}
            onNewCampaign={() => handleNavClick("campanhas", "Campanhas")}
            onOpenLeads={() => selectSection("leads")}
          />
        )}
        {section === "buscar" && (
          <SearchSection onOpenInstagram={() => selectSection("instagram")} />
        )}
        {section === "instagram" && <InstagramWorkspace onExit={() => selectSection("home")} />}
        {section === "listas" && (
          <MinhasListasSection
            onOpenRedesign={(leadId) => {
              setFocusRedesignLead(leadId);
              selectSection("redesign");
            }}
          />
        )}
        {section === "pipeline" && (
          <PipelinePremiumView
            user={{
              name: userProfile?.full_name || "Marcos Gonçalves",
              avatarUrl: userProfile?.avatar_url || "",
              initials: userIniciais,
            }}
            unreadNotifications={naoLidas}
          />
        )}
        {section === "leads" && (
          <LeadsPremiumView
            user={{
              name: userProfile?.full_name || "Marcos Gonçalves",
              avatarUrl: userProfile?.avatar_url || "",
              initials: userIniciais,
            }}
            unreadNotifications={naoLidas}
            onOpenRedesign={(leadId) => {
              setFocusRedesignLead(leadId);
              selectSection("redesign");
            }}
          />
        )}
        {section === "propostas" && <PropostasSection />}
        {section === "campanhas" && (
          <CampanhasPremiumView
            user={{
              name: userProfile?.full_name || "Marcos Gonçalves",
              avatarUrl: userProfile?.avatar_url || "",
              initials: userIniciais,
            }}
            unreadNotifications={naoLidas}
          />
        )}
        {section === "whatsapp" && <WhatsAppSection />}
        {section === "automacao" && (
          <AutomacaoSection onRevisar={() => selectSection("campanhas")} />
        )}
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
        {section === "notificacoes" && (
          <NotificacoesSection
            onMudou={() =>
              listarMinhasNotificacoes()
                .then((ns) => setNaoLidas(ns.filter((n) => !n.lida_em).length))
                .catch(() => {})
            }
          />
        )}
        {section === "academy" && <FlowAcademyComingSoon />}
        {section === "network" && <BusinessNetworkComingSoon />}
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
        {section === "settings" && <UserProfileSection />}
      </main>

      <UpgradePlanModal
        isOpen={upgradeModal.isOpen}
        onClose={() => setUpgradeModal({ isOpen: false, recurso: "" })}
        recursoNome={upgradeModal.recurso}
      />
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
