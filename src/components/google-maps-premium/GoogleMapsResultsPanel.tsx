import { useState, useRef } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  Filter,
  Layers,
  List,
  Loader2,
  Radar,
  RotateCcw,
  Sparkles,
  Terminal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Lead, ScoreBreakdown } from "@/lib/leads-api";
import {
  ScoreBadge,
  RatingCell,
  SiteCell,
  EmailCell,
  InstagramCell,
  WhatsCell,
  MapsButton,
  StatusBadge,
  Paginacao,
  paginar,
  PAGE_SIZE,
} from "@/components/leads/leads-shared";
import { Button } from "@/components/ui/button";

interface GoogleMapsResultsPanelProps {
  leads: Lead[];
  running: boolean;
  status: string;
  logs: string[];
  progress: { found: number; target: number };
  filtrosCaptura: string[];
  onLimparFiltrosCaptura?: () => void;
  listaCriadaId?: string;
  onVerMinhasListas?: () => void;
}

export function GoogleMapsResultsPanel({
  leads,
  running,
  status,
  logs,
  progress,
  filtrosCaptura,
  onLimparFiltrosCaptura,
  listaCriadaId,
  onVerMinhasListas,
}: GoogleMapsResultsPanelProps) {
  const [pagina, setPagina] = useState(1);
  const [logsExpandidos, setLogsExpandidos] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  // Filtro de captura client-side
  const capturaOk = (l: Lead) => {
    if (filtrosCaptura.length === 0) return true;
    return filtrosCaptura.some((f) =>
      f === "telefone"
        ? Boolean(l.phone)
        : f === "site"
          ? Boolean(l.website)
          : f === "instagram"
            ? Boolean(l.instagram_url)
            : false,
    );
  };

  const sorted = [...leads].filter(capturaOk).sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const goldCount = sorted.filter(
    (l) => (l.score_breakdown as ScoreBreakdown | null)?.is_gold,
  ).length;
  const emailCount = sorted.filter((l) => Boolean(l.email)).length;
  const igCount = sorted.filter((l) => Boolean(l.instagram_url)).length;

  const totalPaginas = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginaEfetiva = Math.min(pagina, totalPaginas);
  const paginados = paginar(sorted, paginaEfetiva);

  // Status visual
  let statusBadge = {
    label: "Pronto para prospecção",
    color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    ping: false,
  };

  if (running) {
    statusBadge = {
      label: status.includes("Qualificando") ? status : "Prospectando ao vivo...",
      color: "bg-home-orange/15 text-home-orange border-home-orange/30",
      ping: true,
    };
  } else if (leads.length > 0) {
    statusBadge = {
      label: status || "Busca concluída",
      color: "bg-blue-500/15 text-blue-400 border-blue-500/30",
      ping: false,
    };
  } else if (status.startsWith("Erro")) {
    statusBadge = {
      label: status,
      color: "bg-rose-500/15 text-rose-400 border-rose-500/30",
      ping: false,
    };
  }

  // Exportar CSV
  const handleExportCsv = () => {
    if (sorted.length === 0) return;
    const header = [
      "Nome",
      "Score",
      "Telefone",
      "WhatsApp",
      "E-mail",
      "Site",
      "Instagram",
      "Cidade",
      "Categoria",
    ];
    const rows = sorted.map((l) => [
      `"${(l.business_name || "").replace(/"/g, '""')}"`,
      l.score || 0,
      `"${l.phone || ""}"`,
      `"${l.whatsapp || ""}"`,
      `"${l.email || ""}"`,
      `"${l.website || ""}"`,
      `"${l.instagram_url || ""}"`,
      `"${l.city || ""}"`,
      `"${l.category || ""}"`,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `leads_google_maps_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="rounded-2xl border border-home-border bg-home-surface/90 overflow-hidden shadow-xl">
      {/* Cabeçalho dos Resultados */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-home-border bg-[#101720]/80 px-4 py-3">
        {/* Lado Esquerdo: Ícone + Título + Status Badge */}
        <div className="flex items-center gap-3">
          <div className="flex size-7 items-center justify-center rounded-lg bg-home-surface border border-home-border text-home-muted">
            <List className="size-4 text-home-orange" />
          </div>

          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Resultados da busca
          </h3>

          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold border select-none transition-colors",
              statusBadge.color,
            )}
          >
            {statusBadge.ping ? (
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-home-orange opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-home-orange" />
              </span>
            ) : (
              <span className="size-1.5 rounded-full bg-current" />
            )}
            <span className="truncate max-w-72">{statusBadge.label}</span>
          </span>
        </div>

        {/* Lado Direito: Contadores (Leads, Cliente-Ouro, E-mails, Instagram) */}
        <div className="flex items-center gap-4 text-xs font-bold select-none">
          <div className="flex items-center gap-1.5">
            <span className="text-[#38bdf8] text-sm tabular-nums">{leads.length}</span>
            <span className="text-[10px] uppercase text-home-muted font-medium">Leads</span>
          </div>

          <div className="flex items-center gap-1.5 border-l border-home-border/60 pl-4">
            <span className="text-[#facc15] text-sm tabular-nums">{goldCount}</span>
            <span className="text-[10px] uppercase text-home-muted font-medium">Cliente-Ouro</span>
          </div>

          <div className="flex items-center gap-1.5 border-l border-home-border/60 pl-4">
            <span className="text-[#4ade80] text-sm tabular-nums">{emailCount}</span>
            <span className="text-[10px] uppercase text-home-muted font-medium">E-mails</span>
          </div>

          <div className="flex items-center gap-1.5 border-l border-home-border/60 pl-4">
            <span className="text-[#f472b6] text-sm tabular-nums">{igCount}</span>
            <span className="text-[10px] uppercase text-home-muted font-medium">Instagram</span>
          </div>
        </div>
      </div>

      {/* Barra de Progresso durante streaming */}
      {running && (
        <div className="h-1 w-full overflow-hidden bg-home-surface">
          <div
            className="h-full bg-home-orange transition-all duration-300 shadow-[0_0_10px_#ff6200]"
            style={{
              width: `${Math.min(100, (progress.found / Math.max(1, progress.target)) * 100)}%`,
            }}
          />
        </div>
      )}

      {/* Aviso de Filtro de Captura Ativo */}
      {filtrosCaptura.length > 0 && leads.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-home-border bg-amber-500/10 px-4 py-2 text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <Filter className="size-3.5 text-amber-400" />
            <span>
              Filtrando: mostrando <strong>{sorted.length}</strong> de{" "}
              <strong>{leads.length}</strong> leads com{" "}
              <strong>
                {filtrosCaptura
                  .map((f) => (f === "telefone" ? "Telefone" : f === "site" ? "Site" : "Instagram"))
                  .join(" ou ")}
              </strong>
            </span>
          </div>
          {onLimparFiltrosCaptura && (
            <button
              type="button"
              onClick={onLimparFiltrosCaptura}
              className="underline text-[11px] text-amber-400 hover:text-white transition-colors"
            >
              Limpar filtro
            </button>
          )}
        </div>
      )}

      {/* Corpo: Tabela ou Estado Vazio */}
      {sorted.length > 0 ? (
        <div className="space-y-2">
          {/* Ações da Tabela (Exportar / Link da lista) */}
          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            <div className="text-xs text-home-muted">
              {sorted.length} {sorted.length === 1 ? "lead encontrado" : "leads encontrados"}
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleExportCsv}
                className="h-7.5 rounded-lg border-home-border bg-[#101720] text-xs font-semibold text-white hover:bg-home-surface-strong"
              >
                <Download className="size-3.5 mr-1.5 text-home-orange" />
                Exportar CSV
              </Button>
              {onVerMinhasListas && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onVerMinhasListas}
                  className="h-7.5 rounded-lg border-home-border bg-[#101720] text-xs font-semibold text-white hover:bg-home-surface-strong"
                >
                  <Layers className="size-3.5 mr-1.5 text-blue-400" />
                  Ver em Minhas Listas
                </Button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-y border-home-border bg-[#101720]/60 text-[10px] font-bold uppercase tracking-wider text-home-muted">
                <tr>
                  <th className="px-4 py-2.5">Score</th>
                  <th className="px-4 py-2.5">Empresa</th>
                  <th className="px-4 py-2.5">Avaliação</th>
                  <th className="px-4 py-2.5">Telefone</th>
                  <th className="px-4 py-2.5">WhatsApp</th>
                  <th className="px-4 py-2.5">E-mail</th>
                  <th className="px-4 py-2.5">Site</th>
                  <th className="px-4 py-2.5">Instagram</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-home-border/40 text-home-foreground">
                {paginados.map((lead) => (
                  <tr
                    key={lead.id || lead.business_name}
                    className="hover:bg-home-surface-strong/60 transition-colors"
                  >
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <ScoreBadge lead={lead} />
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="font-semibold text-white max-w-56 truncate">
                        {lead.business_name}
                      </div>
                      <div className="text-[10px] text-home-muted truncate">
                        {[lead.category, lead.city].filter(Boolean).join(" · ")}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <RatingCell rating={lead.rating} reviews={lead.reviews_count} />
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap font-mono text-[11px]">
                      {lead.phone || <span className="text-home-muted/50">—</span>}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <WhatsCell whatsapp={lead.whatsapp} phone={lead.phone} />
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <EmailCell email={lead.email} />
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <SiteCell website={lead.website} />
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <InstagramCell instagram={lead.instagram_url} />
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-right">
                      <MapsButton
                        nome={lead.business_name}
                        cidade={lead.city}
                        endereco={lead.address}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {sorted.length > PAGE_SIZE && (
            <div className="px-4 py-2 border-t border-home-border">
              <Paginacao
                total={sorted.length}
                page={paginaEfetiva}
                onPage={setPagina}
                pageSize={PAGE_SIZE}
              />
            </div>
          )}
        </div>
      ) : leads.length > 0 ? (
        <div className="py-16 text-center text-xs text-home-muted space-y-2">
          <p>
            Nenhum dos <strong>{leads.length}</strong> leads coletados atende aos filtros de captura
            selecionados.
          </p>
          {onLimparFiltrosCaptura && (
            <Button
              size="sm"
              variant="outline"
              onClick={onLimparFiltrosCaptura}
              className="text-xs text-home-orange border-home-orange/40 hover:bg-home-orange/15"
            >
              Limpar filtros de captura
            </Button>
          )}
        </div>
      ) : (
        /* Estado Vazio Neutro idêntico ao layout de referência */
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center select-none">
          <div className="flex size-14 items-center justify-center rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-3 shadow-[0_0_25px_rgba(59,130,246,0.15)]">
            <Radar className="size-7 text-blue-400" />
          </div>
          <p className="text-xs font-medium text-home-muted max-w-sm leading-relaxed">
            Informe nicho, cidade e UF, e clique em{" "}
            <strong className="text-white font-semibold">Iniciar prospecção</strong>.
          </p>
        </div>
      )}

      {/* Terminal de Logs Opcional */}
      {logs.length > 0 && (
        <div className="border-t border-home-border bg-[#0a0f16]">
          <button
            type="button"
            onClick={() => setLogsExpandidos((prev) => !prev)}
            className="flex w-full items-center justify-between px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-home-muted hover:text-white transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <Terminal className="size-3.5 text-home-orange" />
              <span>Console de Execução ({logs.length} eventos)</span>
            </div>
            {logsExpandidos ? (
              <ChevronUp className="size-3.5" />
            ) : (
              <ChevronDown className="size-3.5" />
            )}
          </button>

          {logsExpandidos && (
            <div
              ref={logRef}
              className="max-h-40 overflow-y-auto p-3 text-[11px] font-mono text-home-muted/90 space-y-1 border-t border-home-border/50 scrollbar-thin scrollbar-thumb-home-border"
            >
              {logs.map((l, i) => (
                <div key={i} className="leading-relaxed">
                  {l}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
