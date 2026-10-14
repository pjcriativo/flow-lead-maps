import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  Search,
  Bell,
  Users,
  LayoutTemplate,
  Mail,
  Star,
  Check,
  Save,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { StudioCampaignDraft, StudioStepId } from "@/types/campaign-studio";
import {
  carregarListasEstudio,
  criarRascunhoInicial,
  obterUltimoRascunhoEstudio,
  salvarRascunhoEstudio,
  validarRascunhoCampanha,
  type SimpleListaItem,
} from "@/services/campaign-studio-service";
import { obterContextoOrgAtiva } from "@/services/templates-service";
import { OFFICIAL_EMAIL_TEMPLATES } from "../templates/templates-data";
import { TemplatePreviewModal } from "../templates/TemplatePreviewModal";
import { ConfiguracaoCampanhaPanel } from "./ConfiguracaoCampanhaPanel";
import { EditorEmailCanvas } from "./EditorEmailCanvas";
import { PreviaAgendamentoPanel } from "./PreviaAgendamentoPanel";
import { ModalSelecionarLista } from "./ModalSelecionarLista";
import { ModalSelecionarTemplate } from "./ModalSelecionarTemplate";
import { ModalRevisaoCampanha } from "./ModalRevisaoCampanha";
import type { EmailTemplateItem } from "@/types/templates";

export interface EstudioCampanhasViewProps {
  user?: {
    name: string;
    avatarUrl: string;
    initials: string;
    plan?: string;
  };
  unreadNotifications?: number;
  preselectedListId?: string | null;
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
  onBack,
  onCampaignCreated,
}: EstudioCampanhasViewProps) {
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState("org-default");
  const [activeStep, setActiveStep] = useState<StudioStepId>("conteudo");

  // Estado do Rascunho da Campanha
  const [draft, setDraft] = useState<StudioCampaignDraft | null>(null);
  const [listas, setListas] = useState<SimpleListaItem[]>([]);

  // Modais
  const [isAlterarListaOpen, setIsAlterarListaOpen] = useState(false);
  const [isAlterarTemplateOpen, setIsAlterarTemplateOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isRevisaoModalOpen, setIsRevisaoModalOpen] = useState(false);

  // Inicialização e carregamento de contexto real
  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        setLoading(true);
        const ctx = await obterContextoOrgAtiva();
        if (!isMounted) return;
        setOrgId(ctx.orgId);

        const loadedListas = await carregarListasEstudio(ctx.orgId);
        setListas(loadedListas);

        // Verifica se há contrato vindo do Prompt 50 (Biblioteca de Templates)
        let templateVindoDaBiblioteca: EmailTemplateItem | null = null;
        try {
          const rawContrato = sessionStorage.getItem("flow_campanha_contrato");
          if (rawContrato) {
            const parsed = JSON.parse(rawContrato);
            const found = OFFICIAL_EMAIL_TEMPLATES.find((t) => t.id === parsed.templateId);
            if (found) {
              templateVindoDaBiblioteca = found;
              sessionStorage.removeItem("flow_campanha_contrato"); // consumido
            }
          }
        } catch {}

        // Tenta recuperar rascunho anterior ou cria um novo
        const saved = obterUltimoRascunhoEstudio(ctx.orgId);
        if (saved && !preselectedListId && !templateVindoDaBiblioteca) {
          setDraft(saved);
        } else {
          const novo = await criarRascunhoInicial(ctx.orgId, preselectedListId);
          if (templateVindoDaBiblioteca) {
            novo.templateId = templateVindoDaBiblioteca.id;
            novo.templateNome = templateVindoDaBiblioteca.nome;
            novo.assunto = templateVindoDaBiblioteca.assuntoPadrao;
            novo.preCabecalho = templateVindoDaBiblioteca.preheaderPadrao;
          }
          setDraft(novo);
        }
      } catch (err) {
        console.error("Falha ao inicializar Estúdio de Campanhas:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    init();
    return () => {
      isMounted = false;
    };
  }, [preselectedListId]);

  if (loading || !draft) {
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

  const validation = validarRascunhoCampanha(draft);

  // Manipuladores de Ação
  const handleSaveDraft = () => {
    salvarRascunhoEstudio(draft);
    toast.success("Rascunho da campanha salvo com sucesso!");
  };

  const handleSelectTemplate = (template: EmailTemplateItem) => {
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        templateId: template.id,
        templateNome: template.nome,
        assunto: template.assuntoPadrao,
        preCabecalho: template.preheaderPadrao,
      };
    });
    toast.success(`Template "${template.nome}" aplicado ao editor.`);
  };

  const handleInsertVariable = (varName: string) => {
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        assunto: `${prev.assunto} ${varName}`,
      };
    });
    toast.info(`Variável ${varName} inserida no assunto do e-mail.`);
  };

  const handleAvancarRevisao = () => {
    setIsRevisaoModalOpen(true);
  };

  const handleSaveDraftAndExit = () => {
    salvarRascunhoEstudio(draft);
    setIsRevisaoModalOpen(false);
    toast.success("Campanha validada e salva com sucesso no módulo Campanhas!");
    if (onCampaignCreated) {
      onCampaignCreated();
    } else {
      onBack();
    }
  };

  const activeTemplateItem =
    OFFICIAL_EMAIL_TEMPLATES.find((t) => t.id === draft.templateId) ||
    OFFICIAL_EMAIL_TEMPLATES[0];

  return (
    <div className="min-h-svh w-full bg-[#08090d] text-white flex flex-col font-sans select-none">
      {/* =========================================================================
          TOPBAR SUPERIOR (Breadcrumbs, Busca Global, Notificações e Perfil)
          ========================================================================= */}
      <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-zinc-800/80 bg-[#0c0e14]/90 px-4 sm:px-6 backdrop-blur-md">
        {/* Lado Esquerdo: Breadcrumb e Voltar */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex size-8 items-center justify-center rounded-lg border border-zinc-800 bg-[#12141c] text-zinc-400 hover:border-zinc-700 hover:text-white transition-colors"
            title="Voltar para Campanhas"
          >
            <ArrowLeft className="size-4" />
          </button>

          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400">
            <button
              type="button"
              onClick={onBack}
              className="hover:text-white transition-colors"
            >
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
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
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
              Configure destinatários, conteúdo, assinatura, testes e agendamento da sua
              campanha de e-mail.
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
              <span className="text-[10.5px] text-zinc-500">
                {draft.leadsQualificados} leads qualificados
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

        {/* 3. STEPPER / STEP WIZARD HORIZONTAL (6 ETAPAS CONECTADAS) */}
        <div className="relative py-2 px-4 rounded-2xl border border-zinc-800/80 bg-[#10131b]">
          {/* Linha de Progresso Contínua de Fundo */}
          <div className="absolute left-8 right-8 top-1/2 -translate-y-2 h-[2px] bg-zinc-800/90 z-0" />

          <div className="relative z-10 flex items-center justify-between">
            {/* Etapa 1 */}
            <div
              onClick={() => setIsAlterarListaOpen(true)}
              className="flex flex-col items-center gap-1.5 cursor-pointer group"
            >
              <div className="flex size-6 sm:size-7 items-center justify-center rounded-full bg-[#ff6200] text-white text-[11px] font-bold shadow-sm">
                1
              </div>
              <span className="text-[10px] sm:text-xs font-semibold text-zinc-300 group-hover:text-white">
                Destinatários
              </span>
            </div>

            {/* Etapa 2 */}
            <div
              onClick={() => setIsAlterarTemplateOpen(true)}
              className="flex flex-col items-center gap-1.5 cursor-pointer group"
            >
              <div className="flex size-6 sm:size-7 items-center justify-center rounded-full bg-[#ff6200] text-white text-[11px] font-bold shadow-sm">
                2
              </div>
              <span className="text-[10px] sm:text-xs font-semibold text-zinc-300 group-hover:text-white">
                Template
              </span>
            </div>

            {/* Etapa 3 (ATIVA - CONTEÚDO) */}
            <div className="flex flex-col items-center gap-1.5 cursor-pointer">
              <div className="flex size-6 sm:size-7 items-center justify-center rounded-full bg-[#ff6200] text-white text-[11px] font-bold shadow-lg shadow-[#ff6200]/30 ring-4 ring-[#ff6200]/20">
                3
              </div>
              <span className="text-[10px] sm:text-xs font-extrabold text-[#ff6200]">
                Conteúdo
              </span>
            </div>

            {/* Etapa 4 */}
            <div className="flex flex-col items-center gap-1.5 opacity-70 hover:opacity-100 cursor-pointer">
              <div className="flex size-6 sm:size-7 items-center justify-center rounded-full border border-zinc-700 bg-[#161922] text-zinc-400 text-[11px] font-medium">
                4
              </div>
              <span className="text-[10px] sm:text-xs font-medium text-zinc-400">
                Assinatura
              </span>
            </div>

            {/* Etapa 5 */}
            <div
              onClick={handleAvancarRevisao}
              className="flex flex-col items-center gap-1.5 opacity-70 hover:opacity-100 cursor-pointer"
            >
              <div className="flex size-6 sm:size-7 items-center justify-center rounded-full border border-zinc-700 bg-[#161922] text-zinc-400 text-[11px] font-medium">
                5
              </div>
              <span className="text-[10px] sm:text-xs font-medium text-zinc-400">
                Teste &amp; Revisão
              </span>
            </div>

            {/* Etapa 6 */}
            <div className="flex flex-col items-center gap-1.5 opacity-70 hover:opacity-100 cursor-pointer">
              <div className="flex size-6 sm:size-7 items-center justify-center rounded-full border border-zinc-700 bg-[#161922] text-zinc-400 text-[11px] font-medium">
                6
              </div>
              <span className="text-[10px] sm:text-xs font-medium text-zinc-400">
                Agendamento
              </span>
            </div>
          </div>
        </div>

        {/* 4. ÁREA DE TRABALHO PRINCIPAL EM 3 COLUNAS */}
        <div className="flex flex-col xl:flex-row gap-5 items-start">
          {/* COLUNA 1 (ESQUERDA): CONFIGURAÇÃO DA CAMPANHA */}
          <div className="w-full xl:w-[320px] shrink-0">
            <ConfiguracaoCampanhaPanel
              draft={draft}
              listasDisponiveis={listas}
              onChangeDraft={setDraft}
              onOpenAlterarLista={() => setIsAlterarListaOpen(true)}
              onInsertVariable={handleInsertVariable}
            />
          </div>

          {/* COLUNA 2 (CENTRAL): EDITOR VISUAL DE E-MAIL */}
          <div className="flex-1 w-full min-w-0">
            <EditorEmailCanvas
              draft={draft}
              onChangeDraft={setDraft}
              onSaveDraft={handleSaveDraft}
              onOpenPreview={() => setIsPreviewModalOpen(true)}
              onChangeTemplate={() => setIsAlterarTemplateOpen(true)}
            />
          </div>

          {/* COLUNA 3 (DIREITA): PRÉVIA RÁPIDA, TESTE & AGENDAMENTO */}
          <div className="w-full xl:w-[320px] shrink-0">
            <PreviaAgendamentoPanel
              draft={draft}
              validation={validation}
              onChangeDraft={setDraft}
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
            className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800/60 px-5 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <Save className="size-3.5" />
            <span>Salvar rascunho</span>
          </button>

          <button
            type="button"
            onClick={handleAvancarRevisao}
            className="flex items-center gap-1.5 rounded-xl bg-[#ff6200] px-6 py-2 text-xs font-bold text-white shadow-md shadow-[#ff6200]/25 hover:bg-[#e65800] active:scale-[0.98] transition-all"
          >
            <span>Continuar</span>
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
          setDraft((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              listaId: lista.id,
              listaNome: lista.nome,
              totalLeads: lista.totalLeads,
              leadsComEmail: lista.leadsComEmail,
              leadsQualificados: lista.leadsQualificados,
              quantidadeSelecionada: lista.leadsQualificados,
            };
          });
          toast.success(`Lista "${lista.nome}" conectada ao Estúdio.`);
        }}
      />

      <ModalSelecionarTemplate
        isOpen={isAlterarTemplateOpen}
        selectedTemplateId={draft.templateId}
        onClose={() => setIsAlterarTemplateOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />

      <TemplatePreviewModal
        isOpen={isPreviewModalOpen}
        template={activeTemplateItem}
        variables={{
          nome: "Dra. Camila Santos",
          empresa: "Clínica Sorriso Curitiba",
          cidade: "Curitiba",
          nome_remetente: draft.remetenteNome,
          empresa_remetente: "Flow Business",
        }}
        onClose={() => setIsPreviewModalOpen(false)}
        onPersonalizar={() => setIsPreviewModalOpen(false)}
        onUseTemplate={() => setIsPreviewModalOpen(false)}
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
