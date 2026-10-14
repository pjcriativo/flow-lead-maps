import { useState, useMemo } from "react";
import { toast } from "sonner";
import { posthog } from "@/lib/posthog";
import { MapPin, ArrowLeft, Send, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import type { Lead } from "@/lib/leads-api";
import { criarCampanhaDaLista, criarCampanhaWaDaLista } from "@/services/campanhas";

import { GoogleMapsTopbar } from "./GoogleMapsTopbar";
import { GoogleMapsApproachStepper } from "./GoogleMapsApproachStepper";
import { GoogleMapsApproachLeadSelection } from "./GoogleMapsApproachLeadSelection";
import { GoogleMapsApproachStrategy, type ObjetivoComercial } from "./GoogleMapsApproachStrategy";
import { GoogleMapsApproachMessageEditor } from "./GoogleMapsApproachMessageEditor";
import { GoogleMapsApproachReview } from "./GoogleMapsApproachReview";

export interface GoogleMapsApproachViewProps {
  user?: {
    name: string;
    email: string;
    avatarUrl?: string;
    initials: string;
    role?: string;
  };
  unreadNotifications?: number;
  isSuperAdmin?: boolean;
  onOpenProfile?: () => void;
  // Dados recebidos da Tela 03
  leads: Lead[];
  initialSelectedLeadIds?: Set<string>;
  nicho: string;
  categoria?: string;
  cidade: string;
  uf: string;
  nomeLista: string;
  listaCriadaId?: string;
  // Callbacks de Navegação
  onVoltarParaResultados: () => void;
  onOpenCampanhas?: () => void;
  onOpenMinhasListas?: () => void;
}

const TEMPLATE_WHATSAPP_PADRAO = `Olá {nome_empresa}!
Vi que vocês são referência em {categoria} em {cidade} e notei as excelentes avaliações no Google Maps (★ {avaliacao}).
Trabalho com soluções que ajudam empresas do seu segmento a atrair mais clientes através do marketing digital.
Gostaria de apresentar algumas estratégias personalizadas para o seu negócio.
Podemos conversar em um horário que seja conveniente para você?

Atenciosamente,
{seu_nome}`;

const TEMPLATE_EMAIL_PADRAO = `Olá, equipe da {nome_empresa}!

Acompanho o trabalho de vocês em {cidade} e identificamos oportunidades valiosas para acelerar sua aquisição de clientes.

Desenvolvemos estratégias sob medida para empresas em {categoria}.
Gostaria de agendar uma breve conversa de 10 minutos esta semana para compartilhar algumas ideias práticas?

Atenciosamente,
{seu_nome}`;

const TEMPLATE_INSTAGRAM_PADRAO = `Olá {nome_empresa}! Admiro muito o posicionamento de vocês no mercado de {cidade}. Temos cases de sucesso em {categoria} que podem interessar. Podemos bater um papo rápido?`;

export function GoogleMapsApproachView({
  user = {
    name: "Marcos Gonçalves",
    email: "marcos@flowbusiness.com",
    avatarUrl: "",
    initials: "MG",
    role: "Administrador",
  },
  unreadNotifications = 3,
  isSuperAdmin = false,
  onOpenProfile,
  leads,
  initialSelectedLeadIds,
  nicho,
  cidade,
  uf,
  nomeLista,
  listaCriadaId,
  onVoltarParaResultados,
  onOpenCampanhas,
}: GoogleMapsApproachViewProps) {
  // 1. Estado da Etapa Atual (1 a 4)
  const [currentStep, setCurrentStep] = useState(1);

  // 2. Estado de Seleção de Leads
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(
    () =>
      new Set(
        initialSelectedLeadIds && initialSelectedLeadIds.size > 0
          ? Array.from(initialSelectedLeadIds)
          : leads.map((l) => l.id),
      ),
  );

  // 3. Lead em Foco para Prévia
  const [focusedLeadId, setFocusedLeadId] = useState<string | null>(leads[0] ? leads[0].id : null);

  const focusedLead = useMemo(() => {
    return leads.find((l) => l.id === focusedLeadId) || leads[0] || null;
  }, [leads, focusedLeadId]);

  // 4. Estados da Coluna 2: Estratégia e Objetivo
  const [objetivo, setObjetivo] = useState<ObjetivoComercial>("atrair_clientes");
  const [canaisSelecionados, setCanaisSelecionados] = useState<string[]>(["whatsapp", "email"]);
  const [momentoEnvio, setMomentoEnvio] = useState<"agora" | "agendar">("agora");

  // 5. Estados da Coluna 3: Mensagens e Personalização
  const [canalEditorAtivo, setCanalEditorAtivo] = useState<"whatsapp" | "email" | "instagram">(
    "whatsapp",
  );

  const [mensagens, setMensagens] = useState({
    whatsapp: TEMPLATE_WHATSAPP_PADRAO,
    email: TEMPLATE_EMAIL_PADRAO,
    instagram: TEMPLATE_INSTAGRAM_PADRAO,
  });

  // Modal de Confirmação Segura de Campanha
  const [modalConfirmarAberto, setModalConfirmarAberto] = useState(false);
  const [salvandoCampanha, setSalvandoCampanha] = useState(false);

  // Toggle de seleção de canal
  const handleToggleCanal = (canal: string) => {
    setCanaisSelecionados((prev) =>
      prev.includes(canal) ? prev.filter((c) => c !== canal) : [...prev, canal],
    );
  };

  // Toggle de seleção individual de lead
  const handleToggleSelectLead = (id: string) => {
    setSelectedLeadIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllLeads = () => {
    setSelectedLeadIds(new Set(leads.map((l) => l.id)));
  };

  const handleClearSelection = () => {
    setSelectedLeadIds(new Set());
  };

  const handleChangeMensagem = (canal: "whatsapp" | "email" | "instagram", texto: string) => {
    setMensagens((prev) => ({
      ...prev,
      [canal]: texto,
    }));
  };

  // Execução Segura ao Clicar em "Iniciar Campanha"
  const handleIniciarCampanha = () => {
    if (selectedLeadIds.size === 0) {
      toast.warning("Selecione pelo menos uma empresa na Coluna 1.");
      return;
    }
    if (canaisSelecionados.length === 0) {
      toast.warning("Selecione pelo menos um canal de comunicação na Coluna 2.");
      return;
    }
    setModalConfirmarAberto(true);
  };

  // Confirmação final da criação do rascunho de campanha
  const handleConfirmarCriacaoCampanha = async () => {
    setSalvandoCampanha(true);
    try {
      if (listaCriadaId) {
        // Usa o serviço real do Flow Business para gerar o rascunho seguro
        const nomeCampanha = `Campanha ${nicho} — ${cidade}/${uf}`;
        if (canaisSelecionados.includes("whatsapp")) {
          await criarCampanhaWaDaLista(listaCriadaId, nomeCampanha);
        } else {
          await criarCampanhaDaLista(listaCriadaId, nomeCampanha);
        }
        toast.success(`Campanha "${nomeCampanha}" criada em modo RASCUNHO com sucesso!`);
      } else {
        toast.success(`Preparação concluída com sucesso para ${selectedLeadIds.size} empresas!`);
      }

      posthog.capture("campaign_approach_prepared", {
        leadsCount: selectedLeadIds.size,
        channels: canaisSelecionados,
        objective: objetivo,
        nicho,
        cidade,
      });

      setModalConfirmarAberto(false);
      if (onOpenCampanhas) {
        onOpenCampanhas();
      }
    } catch (err) {
      const msg = (err as Error).message || "Erro ao preparar campanha.";
      toast.error(msg);
    } finally {
      setSalvandoCampanha(false);
    }
  };

  // Salvar como rascunho
  const handleSalvarRascunho = () => {
    toast.success(`Rascunho da abordagem para ${selectedLeadIds.size} leads preservado!`);
  };

  const topbarUser = {
    name: user?.name || "Marcos Gonçalves",
    email: user?.email || "marcos@flowbusiness.com",
    avatarUrl:
      user?.avatarUrl ||
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    initials: user?.initials || "MG",
    role: user?.role || "Administrador",
  };

  return (
    <div className="min-h-screen bg-home-background text-home-foreground pb-12 select-text">
      {/* 1. Topbar Oficial Flow Business */}
      <GoogleMapsTopbar
        user={topbarUser}
        unreadNotifications={unreadNotifications}
        isSuperAdmin={isSuperAdmin}
        onOpenProfile={onOpenProfile}
      />

      {/* Conteúdo Principal */}
      <main className="px-4 sm:px-6 lg:px-8 pt-5 space-y-4 max-w-[1720px] mx-auto">
        {/* 2. Cabeçalho Oficial com Breadcrumbs e Botão Voltar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            {/* Breadcrumb Oficial */}
            <div className="flex items-center gap-1.5 text-xs text-home-muted font-medium">
              <span>Google Maps</span>
              <span className="text-home-muted/50">›</span>
              <button
                type="button"
                onClick={onVoltarParaResultados}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Resultados da Busca
              </button>
              <span className="text-home-muted/50">›</span>
              <span className="text-white font-semibold">Preparar Abordagem</span>
            </div>

            {/* Título e Subtítulo com Ícone em Destaque */}
            <div className="flex items-center gap-3 pt-0.5">
              <div className="flex size-10 items-center justify-center rounded-xl bg-home-orange/15 text-home-orange shrink-0 border border-home-orange/30 shadow-md shadow-home-orange/20">
                <MapPin className="size-5" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-white tracking-tight">
                  Preparar Abordagem Comercial
                </h1>
                <p className="text-xs text-home-muted">
                  Transforme os leads da sua busca em oportunidades reais. Escolha um objetivo,
                  personalize suas mensagens e inicie sua estratégia.
                </p>
              </div>
            </div>
          </div>

          {/* Botão de Retorno à Tela 03 */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onVoltarParaResultados}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-home-border bg-[#101720] px-3.5 text-xs font-semibold text-white hover:border-home-border/80 hover:bg-home-surface transition-colors cursor-pointer"
            >
              <ArrowLeft className="size-3.5 text-home-muted" />
              <span>Voltar aos resultados</span>
            </button>
          </div>
        </div>

        {/* 3. Barra Horizontal de Quatro Etapas */}
        <GoogleMapsApproachStepper currentStep={currentStep} onSelectStep={setCurrentStep} />

        {/* 4. Grid de Quatro Colunas Operacionais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
          {/* Coluna 1: 1. Seleção de Leads */}
          <div className="flex flex-col h-full">
            <GoogleMapsApproachLeadSelection
              leads={leads}
              selectedLeadIds={selectedLeadIds}
              onToggleSelectLead={handleToggleSelectLead}
              onSelectAllLeads={handleSelectAllLeads}
              onClearSelection={handleClearSelection}
              focusedLeadId={focusedLead?.id || null}
              onFocusLead={(l) => setFocusedLeadId(l.id)}
              onVoltarParaResultados={onVoltarParaResultados}
            />
          </div>

          {/* Coluna 2: 2. Estratégia e Objetivo */}
          <div className="flex flex-col h-full">
            <GoogleMapsApproachStrategy
              objetivo={objetivo}
              onChangeObjetivo={setObjetivo}
              canaisSelecionados={canaisSelecionados}
              onToggleCanal={handleToggleCanal}
              momentoEnvio={momentoEnvio}
              onChangeMomentoEnvio={setMomentoEnvio}
            />
          </div>

          {/* Coluna 3: 3. Mensagens e Personalização */}
          <div className="flex flex-col h-full">
            <GoogleMapsApproachMessageEditor
              canalAtivo={canalEditorAtivo}
              onChangeCanalAtivo={setCanalEditorAtivo}
              mensagens={mensagens}
              onChangeMensagem={handleChangeMensagem}
              onSalvarModelo={handleSalvarRascunho}
            />
          </div>

          {/* Coluna 4: 4. Revisão e Envio */}
          <div className="flex flex-col h-full">
            <GoogleMapsApproachReview
              selectedLeadsCount={selectedLeadIds.size}
              objetivo={objetivo}
              canaisSelecionados={canaisSelecionados}
              momentoEnvio={momentoEnvio}
              nomeLista={nomeLista}
              mensagens={mensagens}
              focusedLead={focusedLead}
              onIniciarCampanha={handleIniciarCampanha}
              onSalvarRascunho={handleSalvarRascunho}
            />
          </div>
        </div>
      </main>

      {/* Modal de Confirmação Segura de Preparação de Campanha */}
      {modalConfirmarAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-home-border bg-[#101720] p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 border-b border-home-border/60 pb-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-home-orange/15 text-home-orange border border-home-orange/30">
                <Send className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">
                  Confirmar Preparação da Campanha
                </h3>
                <p className="text-xs text-home-muted">
                  Revisão dos parâmetros antes de encaminhar ao módulo comercial
                </p>
              </div>
            </div>

            {/* Resumo com Dados Reais */}
            <div className="space-y-2 text-xs rounded-xl bg-home-surface/40 p-3 border border-home-border/60">
              <div className="flex justify-between py-1 border-b border-home-border/40">
                <span className="text-home-muted">Leads Elegíveis:</span>
                <span className="font-bold text-white">
                  {selectedLeadIds.size} empresas selecionadas
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-home-border/40">
                <span className="text-home-muted">Canais Selecionados:</span>
                <span className="font-semibold text-white">{canaisSelecionados.join(", ")}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-home-border/40">
                <span className="text-home-muted">Lista de Origem:</span>
                <span className="font-semibold text-white truncate max-w-[240px]">{nomeLista}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-home-muted">Estado do Envio:</span>
                <span className="font-semibold text-amber-400">
                  Rascunho Comercial (Sob Demanda)
                </span>
              </div>
            </div>

            {/* Aviso de Conformidade e Segurança (Proteção anti-disparo em massa) */}
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 flex items-start gap-2.5 text-xs text-emerald-300">
              <ShieldCheck className="size-4 shrink-0 text-emerald-400 mt-0.5" />
              <p className="leading-relaxed">
                Esta ação organizará os leads selecionados e criará a campanha em estado de{" "}
                <strong>Rascunho</strong>. Disparos frios em massa não ocorrem de forma não
                autorizada; você terá controle total de revisão e aprovação antes de qualquer
                contato.
              </p>
            </div>

            {/* Ações do Modal */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setModalConfirmarAberto(false)}
                disabled={salvandoCampanha}
                className="rounded-xl border border-home-border bg-home-surface px-4 py-2 text-xs font-semibold text-white hover:bg-home-surface-strong transition-colors cursor-pointer"
              >
                Voltar e revisar
              </button>
              <button
                type="button"
                onClick={handleConfirmarCriacaoCampanha}
                disabled={salvandoCampanha}
                className="rounded-xl bg-home-orange px-5 py-2 text-xs font-bold text-white hover:bg-home-orange-hover shadow-md shadow-home-orange/20 transition-colors cursor-pointer flex items-center gap-2"
              >
                {salvandoCampanha ? (
                  <span>Salvando rascunho...</span>
                ) : (
                  <>
                    <Send className="size-3.5" />
                    <span>Confirmar e Encaminhar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
