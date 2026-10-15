import React, { useEffect, useRef, useState } from "react";
import { z } from "zod";
import {
  ArrowLeft,
  Search,
  Bell,
  Users,
  LayoutTemplate,
  Mail,
  Star,
  Save,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { StudioCampaignDraft, StudioStepId } from "@/types/campaign-studio";
import {
  carregarListasEstudio,
  carregarDestinatariosLista,
  criarRascunhoInicial,
  listarIdsSelecionaveis,
  obterRascunhoEstudio,
  salvarRascunhoEstudio,
  validarRascunhoCampanha,
  type SimpleListaItem,
  type StudioLeadOption,
} from "@/services/campaign-studio-service";
import { listarAssinaturasOrg, obterContextoOrgAtiva } from "@/services/templates-service";
import { applySignatureToEmail, createEditableEmail } from "@/lib/campaign-email-editor";
import { ConfiguracaoCampanhaPanel } from "./ConfiguracaoCampanhaPanel";
import { EditorEmailCanvas } from "./EditorEmailCanvas";
import { PreviaAgendamentoPanel } from "./PreviaAgendamentoPanel";
import { ModalSelecionarLista } from "./ModalSelecionarLista";
import { ModalSelecionarDestinatarios } from "./ModalSelecionarDestinatarios";
import { ModalSelecionarTemplate } from "./ModalSelecionarTemplate";
import { ModalRevisaoCampanha } from "./ModalRevisaoCampanha";
import type {
  CampaignTemplateContract,
  CorporateSignatureItem,
  EmailTemplateItem,
} from "@/types/templates";

const campaignTemplateContractSchema = z.object({
  templateId: z.string(),
  templateNome: z.string(),
  templateTipo: z.literal("email"),
  categoria: z.string(),
  versao: z.string(),
  assunto: z.string(),
  preheader: z.string(),
  htmlRenderizado: z.string(),
  variaveisUtilizadas: z.record(z.string()),
  assinaturaId: z.string().optional(),
  assinaturaHtml: z.string().optional(),
  orgId: z.string(),
  timestamp: z.string(),
});

function applyTemplateContract(
  draft: StudioCampaignDraft,
  contract: CampaignTemplateContract,
): StudioCampaignDraft {
  const editable = createEditableEmail(contract.htmlRenderizado);
  const signatureHtml = contract.assinaturaHtml ?? draft.assinaturaHtmlSnapshot;
  return {
    ...draft,
    templateId: contract.templateId,
    templateVersao: contract.versao,
    templateNome: contract.templateNome,
    templateHtmlSnapshot: applySignatureToEmail(editable.html, signatureHtml),
    blocos: editable.blocks,
    assunto: contract.assunto,
    preCabecalho: contract.preheader,
    assinaturaId: contract.assinaturaId ?? draft.assinaturaId,
    assinaturaHtmlSnapshot: signatureHtml,
  };
}

export interface EstudioCampanhasViewProps {
  user?: {
    name: string;
    avatarUrl: string;
    initials: string;
    plan?: string;
  };
  unreadNotifications?: number;
  preselectedListId?: string | null;
  campaignId?: string | null;
  onBack: () => void;
  onCampaignCreated?: () => void;
}

export function EstudioCampanhasView({
  user = {
    name: "João Silva",
    avatarUrl: "",
    initials: "JS",
    plan: "Plano Pro",
  },
  unreadNotifications = 3,
  preselectedListId = null,
  campaignId = null,
  onBack,
  onCampaignCreated,
}: EstudioCampanhasViewProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orgId, setOrgId] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [activeStep, setActiveStep] = useState<StudioStepId>("conteudo");
  const [saveState, setSaveState] = useState<
    "idle" | "dirty" | "saving" | "saved" | "error" | "conflict"
  >("idle");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const savedFingerprintRef = useRef("");

  // Estado do Rascunho da Campanha
  const [draft, setDraft] = useState<StudioCampaignDraft | null>(null);
  const [pendingTemplateContract, setPendingTemplateContract] =
    useState<CampaignTemplateContract | null>(null);
  const [listas, setListas] = useState<SimpleListaItem[]>([]);
  const [leadOptions, setLeadOptions] = useState<StudioLeadOption[]>([]);
  const [signatures, setSignatures] = useState<CorporateSignatureItem[]>([]);

  // Modais
  const [isAlterarListaOpen, setIsAlterarListaOpen] = useState(false);
  const [isDestinatariosOpen, setIsDestinatariosOpen] = useState(false);
  const [isAlterarTemplateOpen, setIsAlterarTemplateOpen] = useState(false);
  const [isRevisaoModalOpen, setIsRevisaoModalOpen] = useState(false);

  // Inicialização e carregamento de contexto real
  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        setLoading(true);
        setLoadError(null);
        const ctx = await obterContextoOrgAtiva();
        if (!isMounted) return;
        setOrgId(ctx.orgId);

        const [loadedListas, customSignatures] = await Promise.all([
          carregarListasEstudio(ctx.orgId),
          listarAssinaturasOrg(ctx.orgId),
        ]);
        setListas(loadedListas);
        setSignatures(customSignatures);

        // Verifica se há contrato vindo do Prompt 50 (Biblioteca de Templates)
        let templateVindoDaBiblioteca: CampaignTemplateContract | null = null;
        try {
          const rawContrato = sessionStorage.getItem("flow_campanha_contrato");
          if (rawContrato) {
            const parsed = campaignTemplateContractSchema.safeParse(JSON.parse(rawContrato));
            if (parsed.success && parsed.data.orgId === ctx.orgId) {
              templateVindoDaBiblioteca = parsed.data;
              setPendingTemplateContract(parsed.data);
            }
          }
        } catch (error) {
          console.error("Falha ao ler o contrato local da biblioteca:", error);
        }

        if (campaignId) {
          const persisted = await obterRascunhoEstudio(campaignId, ctx.orgId);
          const needsEditableRegions =
            !persisted.draft.templateHtmlSnapshot.includes("data-flow-block-id");
          const editable = needsEditableRegions
            ? createEditableEmail(persisted.draft.templateHtmlSnapshot)
            : null;
          const reopened = {
            ...persisted.draft,
            templateHtmlSnapshot: applySignatureToEmail(
              editable?.html ?? persisted.draft.templateHtmlSnapshot,
              persisted.draft.assinaturaHtmlSnapshot,
            ),
            blocos: editable?.blocks ?? persisted.draft.blocos,
          };
          savedFingerprintRef.current = JSON.stringify(reopened);
          setDraft(reopened);
          setLastSavedAt(reopened.atualizadoEm);
          setSaveState("saved");
        } else if (preselectedListId) {
          const novo = await criarRascunhoInicial(ctx.orgId, preselectedListId);
          if (templateVindoDaBiblioteca) {
            setDraft(applyTemplateContract(novo, templateVindoDaBiblioteca));
            sessionStorage.removeItem("flow_campanha_contrato");
            setPendingTemplateContract(null);
          } else {
            setDraft(novo);
          }
          savedFingerprintRef.current = JSON.stringify(novo);
        } else {
          setDraft(null);
          setLoadError("Selecione uma lista para iniciar a campanha.");
          setIsAlterarListaOpen(true);
        }
      } catch (err) {
        console.error("Falha ao inicializar Estúdio de Campanhas:", err);
        if (isMounted) {
          setDraft(null);
          setLoadError(
            err instanceof Error
              ? err.message
              : "Não foi possível carregar os dados do Estúdio de Campanhas.",
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    init();
    return () => {
      isMounted = false;
    };
  }, [campaignId, preselectedListId, reloadToken]);

  useEffect(() => {
    let active = true;
    if (!orgId || !draft?.listaId) {
      return () => {
        active = false;
      };
    }
    void carregarDestinatariosLista(orgId, draft.listaId)
      .then((options) => {
        if (active) setLeadOptions(options);
      })
      .catch((error: unknown) => {
        if (active)
          toast.error(error instanceof Error ? error.message : "Falha ao carregar destinatários.");
      });
    return () => {
      active = false;
    };
  }, [draft?.listaId, orgId]);

  useEffect(() => {
    if (!draft?.id || saving) return;
    const fingerprint = JSON.stringify(draft);
    if (fingerprint === savedFingerprintRef.current) return;
    setSaveState("dirty");
    setSaveError(null);
    const workspaceAtSchedule = draft.orgId;
    const timer = window.setTimeout(() => {
      setSaveState("saving");
      void salvarRascunhoEstudio(draft)
        .then((saved) => {
          if (saved.orgId !== workspaceAtSchedule) return;
          savedFingerprintRef.current = JSON.stringify(saved);
          setDraft(saved);
          setLastSavedAt(saved.atualizadoEm);
          setSaveState("saved");
        })
        .catch((error: unknown) => {
          const message = error instanceof Error ? error.message : "Falha ao salvar rascunho.";
          setSaveError(message);
          setSaveState(/conflito de revis/i.test(message) ? "conflict" : "error");
        });
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [draft, saving]);

  if (loading) {
    return (
      <div className="flex min-h-[600px] w-full items-center justify-center bg-[#090b10] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-[#ff6200] border-t-transparent" />
          <span className="text-xs font-semibold text-zinc-400">
            Carregando Estúdio de Campanhas...
          </span>
        </div>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="flex min-h-[600px] w-full items-center justify-center bg-[#090b10] px-6 text-white">
        <div className="max-w-md rounded-2xl border border-rose-900/50 bg-[#12141c] p-6 text-center">
          <h2 className="text-base font-bold">Não foi possível abrir o Estúdio</h2>
          <p className="mt-2 text-sm text-zinc-400">{loadError}</p>
          <button
            type="button"
            onClick={() => setReloadToken((value) => value + 1)}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#ff6200] px-4 py-2 text-xs font-bold text-white"
          >
            <RefreshCw className="size-3.5" /> Tentar novamente
          </button>
          <ModalSelecionarLista
            isOpen={isAlterarListaOpen}
            listas={listas}
            selectedListaId={null}
            onClose={onBack}
            onSelectLista={(list) => {
              setLoading(true);
              void criarRascunhoInicial(orgId, list.id)
                .then((created) => {
                  setDraft(
                    pendingTemplateContract
                      ? applyTemplateContract(created, pendingTemplateContract)
                      : created,
                  );
                  setActiveStep("destinatarios");
                  if (pendingTemplateContract) {
                    sessionStorage.removeItem("flow_campanha_contrato");
                    setPendingTemplateContract(null);
                  }
                  setIsAlterarListaOpen(false);
                  setLoadError(null);
                })
                .catch((error: unknown) =>
                  setLoadError(
                    error instanceof Error ? error.message : "Falha ao iniciar campanha.",
                  ),
                )
                .finally(() => setLoading(false));
            }}
          />
        </div>
      </div>
    );
  }

  const validation = validarRascunhoCampanha(draft);
  const recipientMetrics = {
    elegiveis: leadOptions.filter((lead) => lead.elegibilidade === "elegivel_confirmado").length,
    naoValidados: leadOptions.filter((lead) => lead.elegibilidade === "nao_validado").length,
    bloqueados: leadOptions.filter(
      (lead) => lead.elegibilidade === "sem_email" || lead.elegibilidade === "descadastro",
    ).length,
  };
  const updateDraft = (updater: (current: StudioCampaignDraft) => StudioCampaignDraft) => {
    setDraft((current) => (current ? updater(current) : current));
    setSaveState("dirty");
    setSaveError(null);
  };

  // Manipuladores de Ação
  const handleSaveDraft = async () => {
    try {
      setSaving(true);
      const saved = await salvarRascunhoEstudio(draft);
      savedFingerprintRef.current = JSON.stringify(saved);
      setDraft(saved);
      setLastSavedAt(saved.atualizadoEm);
      setSaveState("saved");
      toast.success("Rascunho salvo no Supabase.");
    } catch (error) {
      console.error("Falha ao salvar rascunho:", error);
      const message =
        error instanceof Error ? error.message : "Não foi possível salvar o rascunho.";
      setSaveError(message);
      setSaveState(/conflito de revis/i.test(message) ? "conflict" : "error");
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleSelectTemplate = (template: EmailTemplateItem) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const editable = createEditableEmail(template.conteudoHtml);
      return {
        ...prev,
        templateId: template.id,
        templateVersao: template.versao ?? "1.0",
        templateNome: template.nome,
        templateHtmlSnapshot: applySignatureToEmail(editable.html, prev.assinaturaHtmlSnapshot),
        blocos: editable.blocks,
        assunto: template.assuntoPadrao,
        preCabecalho: template.preheaderPadrao,
      };
    });
    toast.success(`Template "${template.nome}" aplicado ao editor.`);
  };

  const handleAvancarRevisao = () => {
    setActiveStep("revisao");
    setIsRevisaoModalOpen(true);
  };

  const handleContinue = () => {
    if (activeStep === "destinatarios") {
      setActiveStep("conteudo");
      return;
    }
    handleAvancarRevisao();
  };

  const handleSaveDraftAndExit = async () => {
    try {
      setSaving(true);
      const saved = await salvarRascunhoEstudio({ ...draft, status: "rascunho" });
      savedFingerprintRef.current = JSON.stringify(saved);
      setDraft(saved);
      setLastSavedAt(saved.atualizadoEm);
      setSaveState("saved");
      setIsRevisaoModalOpen(false);
      toast.success("Rascunho validado e salvo no Supabase.");
      if (onCampaignCreated) {
        onCampaignCreated();
      } else {
        onBack();
      }
    } catch (error) {
      console.error("Falha ao salvar rascunho:", error);
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar o rascunho.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-svh w-full bg-[#08090d] text-white flex flex-col font-sans select-none">
      {/* =========================================================================
          TOPBAR SUPERIOR (Breadcrumbs, Busca Global, Notificações e Perfil)
          ========================================================================= */}
      <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-zinc-800/80 bg-[#0c0e14]/90 px-4 sm:px-6 backdrop-blur-md">
        {/* Lado Esquerdo: Breadcrumb e Voltar */}
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <div
              className={cn(
                "text-[10px] font-semibold",
                saveState === "error" || saveState === "conflict"
                  ? "text-rose-400"
                  : "text-zinc-400",
              )}
            >
              {saveState === "saving" || saving
                ? "Salvando..."
                : saveState === "saved"
                  ? "Salvo"
                  : saveState === "conflict"
                    ? "Conflito de revisao"
                    : saveState === "error"
                      ? "Erro ao salvar"
                      : saveState === "dirty"
                        ? "Alteracoes nao salvas"
                        : "Novo rascunho"}
            </div>
            {lastSavedAt ? (
              <div className="text-[9px] text-zinc-600">
                Ultima gravacao{" "}
                {new Date(lastSavedAt).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            ) : null}
            {saveError ? (
              <div className="max-w-52 truncate text-[9px] text-rose-400">{saveError}</div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onBack}
            className="flex size-8 items-center justify-center rounded-lg border border-zinc-800 bg-[#12141c] text-zinc-400 hover:border-zinc-700 hover:text-white transition-colors"
            title="Voltar para Campanhas"
          >
            <ArrowLeft className="size-4" />
          </button>

          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400">
            <button type="button" onClick={onBack} className="hover:text-white transition-colors">
              Campanhas
            </button>
            <span className="text-zinc-600">&gt;</span>
            <span className="font-bold text-white">Estúdio de Campanhas</span>
          </div>
        </div>

        {/* Centro: Barra de Busca com Tecla de Atalho */}
        <div className="relative hidden md:block w-96">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar templates, categorias, palavras-chave..."
            className="h-9 w-full rounded-xl border border-zinc-800 bg-[#12141c] pl-9 pr-12 text-xs text-white placeholder-zinc-500 focus:border-[#ff6200] focus:outline-none"
          />
          <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-zinc-700/60 bg-zinc-800/60 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400">
            ⌘ K
          </kbd>
        </div>

        {/* Lado Direito: Notificações e Perfil */}
        <div className="flex items-center gap-4">
          <div className="relative cursor-pointer">
            <Bell className="size-4 text-zinc-400 hover:text-white transition-colors" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-sm">
                {unreadNotifications}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 border-l border-zinc-800 pl-4">
            <div className="size-8 rounded-full border border-zinc-700 bg-zinc-800 flex items-center justify-center text-xs font-bold text-white overflow-hidden">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user.initials || "JS"
              )}
            </div>
            <div className="hidden sm:block text-left leading-tight">
              <div className="text-xs font-bold text-white">{user.name}</div>
              <div className="text-[10px] text-zinc-400">{user.plan || "Plano Pro"}</div>
            </div>
          </div>
        </div>
      </header>

      {/* =========================================================================
          CONTEÚDO PRINCIPAL (Hero, KPIs, Stepper, 3 Colunas, Bottom Bar)
          ========================================================================= */}
      <main className="mx-auto w-full max-w-[1720px] flex-1 space-y-5 px-3 py-4 sm:px-6 sm:py-6">
        {/* 1. HERO CABEÇALHO COM BACKGROUND ATMOSFÉRICO DE MONTANHAS */}
        <div className="relative overflow-hidden rounded-3xl border border-zinc-800/80 bg-gradient-to-r from-[#0d1017] via-[#121622] to-[#181a24] p-6 shadow-xl">
          <div className="relative z-10">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Estúdio de Campanhas
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-zinc-400 max-w-2xl">
              Escolha os destinatários, personalize o conteúdo e salve um rascunho profissional.
            </p>
          </div>

          {/* Gradiente sutil simulando pôr do sol na montanha da referência aprovada */}
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-amber-600/10 via-rose-600/5 to-transparent pointer-events-none" />
        </div>

        {/* 2. OS 4 CARDS SUPERIORES DE KPI / RESUMO (Lista, Template, Remetente, Assinatura) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Lista selecionada */}
          <div
            onClick={() => setIsAlterarListaOpen(true)}
            className="flex items-center gap-3.5 rounded-2xl border border-zinc-800/80 bg-[#10131b] p-3.5 shadow-sm cursor-pointer hover:border-zinc-700 transition-all"
          >
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-cyan-800/40 bg-cyan-950/40 text-cyan-400">
              <Users className="size-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-medium text-zinc-400">Lista selecionada</span>
              <div className="text-xs sm:text-sm font-bold text-white truncate">
                {draft.listaNome}
              </div>
              <span className="block text-[10px] text-zinc-500">
                {draft.leadsComEmail} com e-mail · {recipientMetrics.elegiveis} elegiveis
              </span>
              <span className="block text-[9px] text-amber-500/80">
                {recipientMetrics.naoValidados} nao validados · {recipientMetrics.bloqueados}{" "}
                bloqueados
              </span>
            </div>
          </div>

          {/* Card 2: Template escolhido */}
          <div
            onClick={() => setIsAlterarTemplateOpen(true)}
            className="flex items-center gap-3.5 rounded-2xl border border-zinc-800/80 bg-[#10131b] p-3.5 shadow-sm cursor-pointer hover:border-zinc-700 transition-all"
          >
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-purple-800/40 bg-purple-950/40 text-purple-400">
              <LayoutTemplate className="size-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-medium text-zinc-400">Template escolhido</span>
              <div className="text-xs sm:text-sm font-bold text-white truncate">
                {draft.templateNome}
              </div>
              <span className="text-[10.5px] text-zinc-500">Pronto para personalização</span>
            </div>
          </div>

          {/* Card 3: Remetente */}
          <div className="flex items-center gap-3.5 rounded-2xl border border-zinc-800/80 bg-[#10131b] p-3.5 shadow-sm">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-emerald-800/40 bg-emerald-950/40 text-emerald-400">
              <Mail className="size-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-medium text-zinc-400">Remetente</span>
              <div className="text-xs sm:text-sm font-bold text-white truncate">
                {draft.remetenteNome}
              </div>
              <span className="text-[10.5px] text-zinc-500 truncate block">
                {draft.remetenteEmail}
              </span>
            </div>
          </div>

          {/* Card 4: Assinatura */}
          <div className="flex items-center gap-3.5 rounded-2xl border border-zinc-800/80 bg-[#10131b] p-3.5 shadow-sm">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-amber-800/40 bg-amber-950/40 text-amber-400">
              <Star className="size-5 fill-amber-400/20" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-medium text-zinc-400">Assinatura</span>
              <div className="text-xs sm:text-sm font-bold text-white truncate">
                {draft.assinaturaNome}
              </div>
              <span className="text-[10.5px] text-zinc-500">Modelo corporativo ativo</span>
            </div>
          </div>
        </div>

        {/* 3. FLUXO PRINCIPAL EM TRES ETAPAS */}
        <nav
          aria-label="Etapas da campanha"
          className="rounded-2xl border border-zinc-800/80 bg-[#10131b] px-4 py-3"
        >
          <ol className="grid grid-cols-3 gap-2">
            {(
              [
                ["destinatarios", "Destinatarios"],
                ["conteudo", "Conteudo"],
                ["revisao", "Revisao"],
              ] as const
            ).map(([step, label], index) => (
              <li key={step}>
                <button
                  type="button"
                  onClick={() => setActiveStep(step)}
                  aria-current={activeStep === step ? "step" : undefined}
                  className={cn(
                    "flex w-full items-center justify-center gap-2 rounded-xl px-2 py-2 text-[11px] font-semibold transition-colors sm:text-xs",
                    activeStep === step
                      ? "bg-[#ff6200]/15 text-[#ff6200]"
                      : "text-zinc-400 hover:bg-zinc-800/60 hover:text-white",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-6 items-center justify-center rounded-full border text-[10px]",
                      activeStep === step
                        ? "border-[#ff6200] bg-[#ff6200] text-white"
                        : "border-zinc-700",
                    )}
                  >
                    {index + 1}
                  </span>
                  {label}
                </button>
              </li>
            ))}
          </ol>
        </nav>

        {/* 4. ÁREA DE TRABALHO PRINCIPAL EM 3 COLUNAS */}
        <div className="flex flex-col xl:flex-row gap-5 items-start">
          {/* COLUNA 1 (ESQUERDA): CONFIGURAÇÃO DA CAMPANHA */}
          <div className="w-full xl:w-[320px] shrink-0">
            <ConfiguracaoCampanhaPanel
              draft={draft}
              signatures={signatures}
              onChangeDraft={updateDraft}
              onOpenAlterarLista={() => setIsAlterarListaOpen(true)}
              onOpenDestinatarios={() => setIsDestinatariosOpen(true)}
              onOpenTemplate={() => setIsAlterarTemplateOpen(true)}
            />
          </div>

          {/* COLUNA 2 (CENTRAL): EDITOR VISUAL DE E-MAIL */}
          <div className="flex-1 w-full min-w-0">
            <EditorEmailCanvas
              draft={draft}
              onChangeDraft={updateDraft}
              onChangeTemplate={() => setIsAlterarTemplateOpen(true)}
            />
          </div>

          {/* COLUNA 3 (DIREITA): PRÉVIA RÁPIDA, TESTE & AGENDAMENTO */}
          <div className="w-full xl:w-[320px] shrink-0">
            <PreviaAgendamentoPanel
              draft={draft}
              validation={validation}
              onAvancarRevisao={handleAvancarRevisao}
            />
          </div>
        </div>
      </main>

      {/* =========================================================================
          BARRA DE AÇÃO INFERIOR FLUTUANTE / FIXADA
          ========================================================================= */}
      <footer className="sticky bottom-0 z-30 flex items-center justify-between border-t border-zinc-800 bg-[#0c0e14]/95 px-4 sm:px-8 py-3 backdrop-blur-md">
        <button
          type="button"
          onClick={onBack}
          className="rounded-xl border border-zinc-700 bg-zinc-800/60 px-5 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
        >
          Voltar
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800/60 px-5 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <Save className="size-3.5" />
            <span>{saving ? "Salvando..." : "Salvar rascunho"}</span>
          </button>

          <button
            type="button"
            onClick={handleContinue}
            className="flex items-center gap-1.5 rounded-xl bg-[#ff6200] px-6 py-2 text-xs font-bold text-white shadow-md shadow-[#ff6200]/25 hover:bg-[#e65800] active:scale-[0.98] transition-all"
          >
            <span>{activeStep === "revisao" ? "Revisar campanha" : "Continuar"}</span>
            <ArrowRight className="size-4" />
          </button>
        </div>
      </footer>

      {/* =========================================================================
          MODAIS AUXILIARES
          ========================================================================= */}
      <ModalSelecionarLista
        isOpen={isAlterarListaOpen}
        listas={listas}
        selectedListaId={draft.listaId}
        onClose={() => setIsAlterarListaOpen(false)}
        onSelectLista={(lista) => {
          void listarIdsSelecionaveis(orgId, lista.id)
            .then((selectedIds) =>
              setDraft((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  listaId: lista.id,
                  listaNome: lista.nome,
                  totalLeads: lista.totalLeads,
                  leadsComEmail: lista.leadsComEmail,
                  leadsQualificados: lista.leadsQualificados,
                  quantidadeSelecionada: selectedIds.length,
                  leadsIdsSelecionados: selectedIds,
                };
              }),
            )
            .catch((error: unknown) =>
              toast.error(
                error instanceof Error ? error.message : "Falha ao carregar destinatários.",
              ),
            );
          toast.success(`Lista "${lista.nome}" conectada ao Estúdio.`);
        }}
      />

      <ModalSelecionarTemplate
        isOpen={isAlterarTemplateOpen}
        selectedTemplateId={draft.templateId}
        onClose={() => setIsAlterarTemplateOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />

      <ModalSelecionarDestinatarios
        key={`${isDestinatariosOpen}:${draft.listaId}:${draft.leadsIdsSelecionados.join(",")}`}
        isOpen={isDestinatariosOpen}
        leads={leadOptions}
        selectedIds={draft.leadsIdsSelecionados}
        onClose={() => setIsDestinatariosOpen(false)}
        onConfirm={(selectedIds) =>
          setDraft((current) =>
            current
              ? {
                  ...current,
                  leadsIdsSelecionados: selectedIds,
                  quantidadeSelecionada: selectedIds.length,
                }
              : current,
          )
        }
      />

      <ModalRevisaoCampanha
        isOpen={isRevisaoModalOpen}
        draft={draft}
        validation={validation}
        onClose={() => setIsRevisaoModalOpen(false)}
        onSaveDraftAndExit={handleSaveDraftAndExit}
      />
    </div>
  );
}
