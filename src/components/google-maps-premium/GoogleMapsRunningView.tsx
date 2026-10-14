import { useEffect, useState } from "react";
import { Eye, MapPin, XCircle } from "lucide-react";
import { GoogleMapsTopbar } from "./GoogleMapsTopbar";
import { GoogleMapsRunningStepper } from "./GoogleMapsRunningStepper";
import { GoogleMapsRunningIndicators } from "./GoogleMapsRunningIndicators";
import { GoogleMapsRunningConfigCard } from "./GoogleMapsRunningConfigCard";
import { GoogleMapsRunningMapPanel } from "./GoogleMapsRunningMapPanel";
import { GoogleMapsRunningLiveStatus } from "./GoogleMapsRunningLiveStatus";
import { GoogleMapsRunningTable } from "./GoogleMapsRunningTable";
import type { Lead } from "@/lib/leads-api";
import type { CaptureFilter } from "@/lib/google-maps-capture";

export interface GoogleMapsRunningViewProps {
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
  // Parâmetros da busca passados pela Tela 01
  nicho: string;
  categoria?: string;
  cidade: string;
  uf: string;
  raioKm: number;
  limite: number;
  nomeLista: string;
  buscarEmails: boolean;
  filtrosCaptura: CaptureFilter[];
  pin: { lat: number; lng: number } | null;
  // Estados operacionais da execução
  running: boolean;
  leads: Lead[];
  logs: string[];
  status: string;
  progress: { found: number; target: number };
  elapsedSeconds: number;
  duplicatasCount: number;
  // Callbacks de controle
  onCancelarBusca: () => void;
  onVoltarConfiguracao: () => void;
  onVerResultados?: () => void;
}

export function GoogleMapsRunningView({
  user,
  unreadNotifications = 3,
  isSuperAdmin = false,
  onOpenProfile,
  nicho,
  categoria,
  cidade,
  uf,
  raioKm,
  limite,
  nomeLista,
  buscarEmails,
  filtrosCaptura,
  pin,
  running,
  leads,
  logs,
  status,
  progress,
  elapsedSeconds,
  duplicatasCount,
  onCancelarBusca,
  onVoltarConfiguracao,
  onVerResultados,
}: GoogleMapsRunningViewProps) {
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);
  const [modalCancelarAberto, setModalCancelarAberto] = useState(false);
  const [lastUpdate, setLastUpdate] = useState("");
  // Estados de Paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(10);

  // Atualiza timestamp da última atividade recebida
  useEffect(() => {
    setLastUpdate(new Date().toLocaleTimeString());
  }, [logs.length, leads.length, status]);

  // Determina a etapa atual do stepper de 1 a 5 com base em eventos reais
  const getCurrentStep = () => {
    if (
      !running &&
      (status.includes("Concluído") || status.includes("Finalizando") || status.includes("criada"))
    ) {
      return 5;
    }
    if (leads.length > 0 && status.includes("banco")) {
      return 4;
    }
    if (
      leads.length > 0 ||
      logs.some((l) => l.includes("Qualificando") || l.includes("enriquec"))
    ) {
      return 3;
    }
    if (running && (logs.length > 0 || status.includes("Buscando"))) {
      return 2;
    }
    return 1;
  };

  const currentStep = getCurrentStep();
  const totalEncontrados = leads.length + duplicatasCount;

  return (
    <div className="min-h-screen bg-home-background text-home-foreground pb-12 select-text">
      {/* 1. Topbar Oficial Flow Business */}
      <GoogleMapsTopbar
        user={user}
        unreadNotifications={unreadNotifications}
        isSuperAdmin={isSuperAdmin}
        onOpenProfile={onOpenProfile}
      />

      {/* Conteúdo Principal */}
      <main className="px-4 sm:px-6 lg:px-8 pt-5 space-y-5 max-w-[1680px] mx-auto">
        {/* 2. Cabeçalho da Tela 02: Prospecção em Andamento */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            {/* Breadcrumb oficial */}
            <div className="flex items-center gap-1.5 text-xs text-home-muted font-medium">
              <span>Google Maps</span>
              <span className="text-home-muted/50">›</span>
              <span className="text-home-muted font-semibold">Prospecção em Andamento</span>
            </div>

            {/* Título e Subtítulo com Ícone */}
            <div className="flex items-center gap-3 pt-0.5">
              <div className="flex size-10 items-center justify-center rounded-xl bg-home-orange/15 text-home-orange shrink-0 border border-home-orange/30 shadow-md shadow-home-orange/20">
                <MapPin className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-extrabold text-home-muted tracking-tight">Google Maps</h1>
                  <span className="rounded-full bg-home-orange/15 px-2 py-0.5 text-[10px] font-bold text-home-orange border border-home-orange/30">
                    Prospecção em andamento
                  </span>
                </div>
                <p className="text-xs text-home-muted">
                  Estamos localizando empresas e coletando dados em tempo real. Você pode acompanhar
                  todo o progresso desta busca.
                </p>
              </div>
            </div>
          </div>

          {/* Botão: Voltar à configuração (visível quando não está running) */}
          {!running && (
            <button
              type="button"
              onClick={onVoltarConfiguracao}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-home-border bg-[bg-home-surface/60] px-3.5 text-xs font-semibold text-home-muted hover:text-white hover:bg-home-surface transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="text-xs font-medium">←</span>
              <span>Voltar à configuração</span>
            </button>
          )}

          {/* Botões do Topo Direito (Ver detalhes e Cancelar busca) */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setModalDetalhesAberto(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-home-border bg-[bg-home-surface/60] px-3.5 text-xs font-semibold text-home-muted hover:text-white hover:bg-home-surface transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Eye className="size-3.5 text-home-muted" />
              <span>Ver detalhes da busca</span>
            </button>

            {running ? (
              <button
                type="button"
                onClick={() => setModalCancelarAberto(true)}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 hover:border-red-500/50 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <XCircle className="size-3.5 text-red-400" />
                <span>Cancelar busca</span>
              </button>
            ) : onVerResultados ? (
              <button
                type="button"
                onClick={onVerResultados}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-home-orange px-4 text-xs font-bold text-home-muted shadow-md shadow-home-orange/20 hover:bg-home-orange-hover transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Ver resultados da busca</span>
                <span className="text-home-muted/80">→</span>
              </button>
            ) : null}
          </div>
        </div>

        {/* 3. Barra Horizontal de 5 Etapas (Stepper) */}
        <GoogleMapsRunningStepper
          currentStep={currentStep}
          elapsedSeconds={elapsedSeconds}
          running={running}
        />

        {/* 4. Cinco Indicadores Operacionais */}
        <GoogleMapsRunningIndicators
          totalEmpresasEncontradas={totalEncontrados}
          leadsIneditos={leads.length}
          duplicatasDescartadas={duplicatasCount}
          progressFound={progress.found}
          progressTarget={progress.target}
          elapsedSeconds={elapsedSeconds}
          running={running}
        />

        {/* 5. Composição Central em 3 Colunas (lg:grid-cols-12) */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 items-start">
          {/* Coluna 1: Esquerda (3.5 cols) — Configuração da Busca */}
          <section className="lg:col-span-4">
            <GoogleMapsRunningConfigCard
              nicho={nicho}
              categoria={categoria}
              cidade={cidade}
              uf={uf}
              raioKm={raioKm}
              limite={limite}
              nomeLista={nomeLista}
              buscarEmails={buscarEmails}
              filtrosCaptura={filtrosCaptura}
              running={running}
              onEditarConfiguracao={onVoltarConfiguracao}
            />
          </section>

          {/* Coluna 2: Centro (5 cols) — Mapa Durante a Prospecção com Marcadores */}
          <section className="lg:col-span-5">
            <GoogleMapsRunningMapPanel
              pin={pin}
              raioKm={raioKm}
              cidade={cidade}
              uf={uf}
              leads={leads}
              totalEncontrados={totalEncontrados}
              duplicatasCount={duplicatasCount}
            />
          </section>

          {/* Coluna 3: Direita (3 cols) — Status em Tempo Real */}
          <section className="lg:col-span-3">
            <GoogleMapsRunningLiveStatus
              status={status}
              logs={logs}
              running={running}
              lastUpdate={lastUpdate}
            />
          </section>
        </div>

        {/* 6. Área Inferior: Tabela de Resultados ao Vivo */}
        <section className="pt-1">
          <GoogleMapsRunningTable
            leads={leads}
            running={running}
            duplicatasCount={duplicatasCount}
            paginaAtual={paginaAtual}
            itensPorPagina={itensPorPagina}
            totalLeads={leads.length + duplicatasCount}
          />

          {/* Controles de Paginação */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 space-y-3 sm:space-y-0">
            {/* Informações de Paginação */}
            <div className="text-xs text-home-muted">
              {/* Calculamos os totais filtrados para consistência com a tabela */}
              {(tabFiltro === "duplicatas" ? (
                duplicatasCount > 0 ? (
                  <>
                    {duplicatasCount} empresas já pertenciam à sua organização
                  </>
                ) : (
                  "Nenhuma duplicata descartada nesta execução."
                )
              ) : (
                leadsFiltrados.length === 0 ? (
                  running
                    ? "Buscando e qualificando empresas na região..."
                    : "Nenhum lead encontrado."
                ) : (
                  <>
                    Mostrando {(paginaAtual - 1) * itensPorPagina + 1}-{Math.min(paginaAtual * itensPorPagina, leadsFiltrados.length + duplicatasCount)} de {leadsFiltrados.length + duplicatasCount} leads
                  </>
              )}
            </div>

            {/* Controles de Navegação e Tamanho da Página */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-4">
              {/* Seletor de Itens por Página */}
              <div className="flex items-center gap-2">
                  <select
                    value={itensPorPagina}
                    onChange={(e) => {
                      setItensPorPagina(Number(e.target.value));
                      setPaginaAtual(1); // Reset para primeira página ao mudar o tamanho
                    }}
                    className="h-8 rounded-lg border border-home-border bg-home-surface/80 px-2 text-xs text-white focus:border-home-orange focus:outline-none cursor-pointer"
                  >
                    <option value={10}>10 por página</option>
                    <option value={25}>25 por página</option>
                    <option value={50}>50 por página</option>
                </select>
              </div>

              {/* Navegação de Páginas */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPaginaAtual(Math.max(1, paginaAtual - 1))]
                  disabled={paginaAtual <= 1 || (tabFiltro !== "duplicatas" && leadsFiltrados.length === 0 && duplicatasCount === 0)}
                  className="flex size-7 items-center justify-center rounded-lg border border-home-border bg-home-surface/60 text-home-muted hover:text-white hover:bg-home-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <span className="text-xs font-medium">←</span>
                  <span>Anterior</span>
                </button>

                <span className="text-xs text-home-muted">
                  Página {paginaAtual} de {Math.max(1, tabFiltro === "duplicatas" ? 1 : Math.ceil((leadsFiltrados.length + duplicatasCount) / itensPorPagina))}
                </span>

                <button
                  onClick={() => setPaginaAtual(Math.min(tabFiltro === "duplicatas" ? 1 : Math.ceil((leadsFiltrados.length + duplicatasCount) / itensPorPagina), paginaAtual + 1))}
                  disabled={paginaAtual >= Math.max(1, tabFiltro === "duplicatas" ? 1 : Math.ceil((leadsFiltrados.length + duplicatasCount) / itensPorPagina)) || (tabFiltro !== "duplicatas" && leadsFiltrados.length === 0 && duplicatasCount === 0)}
                  className="flex size-7 items-center justify-center rounded-lg border border-home-border bg-home-surface/60 text-home-muted hover:text-white hover:bg-home-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <span>Próximo</span>
                  <span className="text-xs font-medium">→</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Modal: Detalhes da Busca */}
      {modalDetalhesAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-home-border bg-[bg-home-surface/60] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-home-border/60 pb-3">
              <h3 className="text-sm font-bold text-home-muted">Detalhes da Execução</h3>
              <button
                type="button"
                onClick={() => setModalDetalhesAberto(false)}
                className="text-home-muted hover:text-home-muted transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-home-border/40">
                <span className="text-home-muted">Nicho:</span>
                <span className="font-semibold text-home-muted">{nicho}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-home-border/40">
                <span className="text-home-muted">Localização:</span>
                <span className="font-semibold text-home-muted">
                  {cidade} - {uf} ({raioKm} km)
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-home-border/40">
                <span className="text-home-muted">Quantidade Solicitada:</span>
                <span className="font-semibold text-home-muted">{limite} leads</span>
              </div>
              <div className="flex justify-between py-1 border-b border-home-border/40">
                <span className="text-home-muted">Lista de Destino:</span>
                <span className="font-semibold text-home-muted truncate max-w-[200px]">{nomeLista}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-home-muted">Enriquecimento de E-mails:</span>
                <span className="font-semibold text-home-muted">
                  {buscarEmails ? "Ativado" : "Desativado"}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setModalDetalhesAberto(false)}
              className="w-full rounded-xl bg-home-orange py-2 text-xs font-bold text-home-muted hover:bg-home-orange-hover transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Modal: Confirmação de Cancelamento Honesto */}
      {modalCancelarAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-[bg-home-surface/60] p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-red-400">
              <XCircle className="size-5 shrink-0" />
              <h3 className="text-sm font-bold text-home-muted">Interromper Prospecção</h3>
            </div>

            <p className="text-xs text-home-muted leading-relaxed">
              Deseja interromper o recebimento de resultados no navegador?
              <br />
              <span className="block mt-2 text-[11px] text-home-muted/80">
                Nota: A conexão de streaming com a Edge Function será encerrada imediatamente. Os
                leads já capturados até o momento ({leads.length}) serão preservados.
              </span>
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setModalCancelarAberto(false)}
                className="rounded-xl border border-home-border bg-home-surface px-4 py-2 text-xs font-semibold text-home-muted hover:bg-home-surface-strong transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continuar busca
              </button>
              <button
                type="button"
                onClick={() => {
                  setModalCancelarAberto(false);
                  onCancelarBusca();
                }}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-home-muted hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Confirmar interrupção
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
