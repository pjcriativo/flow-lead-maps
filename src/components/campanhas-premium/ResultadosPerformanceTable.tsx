import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Search,
  Utensils,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  CAMPANHAS_PERFORMANCE_TABLE,
  type CampanhaPerformanceRow,
} from "./resultados-campanha-data";

interface ResultadosPerformanceTableProps {
  campanhas?: CampanhaPerformanceRow[];
  onSelectCampanha?: (campanha: CampanhaPerformanceRow) => void;
  className?: string;
}

export function ResultadosPerformanceTable({
  campanhas = CAMPANHAS_PERFORMANCE_TABLE,
  onSelectCampanha,
  className,
}: ResultadosPerformanceTableProps) {
  const [activeTab, setActiveTab] = useState<
    "campanhas" | "canais" | "cidades" | "categorias" | "leads"
  >("campanhas");
  const [search, setSearch] = useState("");
  const [canalFilter, setCanalFilter] = useState("all");
  const [periodoFilter, setPeriodoFilter] = useState("30d");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(() => {
    return campanhas.filter((c) => {
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        if (!c.name.toLowerCase().includes(q)) return false;
      }
      if (canalFilter !== "all" && c.channel !== canalFilter) {
        return false;
      }
      return true;
    });
  }, [campanhas, search, canalFilter]);

  const toggleSelect = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((c) => c.id)));
    }
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-home-border bg-home-surface/80 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.15)] flex flex-col justify-between",
        className,
      )}
    >
      {/* Abas Superiores */}
      <div className="flex items-center gap-6 border-b border-home-border/60 pb-3 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab("campanhas")}
          className={cn(
            "relative pb-2 transition-colors cursor-pointer",
            activeTab === "campanhas"
              ? "text-white after:absolute after:bottom-[-13px] after:left-0 after:right-0 after:h-0.5 after:bg-home-orange"
              : "text-home-muted hover:text-white",
          )}
        >
          Campanhas
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("canais")}
          className={cn(
            "relative pb-2 transition-colors cursor-pointer",
            activeTab === "canais"
              ? "text-white after:absolute after:bottom-[-13px] after:left-0 after:right-0 after:h-0.5 after:bg-home-orange"
              : "text-home-muted hover:text-white",
          )}
        >
          Canais
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("cidades")}
          className={cn(
            "relative pb-2 transition-colors cursor-pointer",
            activeTab === "cidades"
              ? "text-white after:absolute after:bottom-[-13px] after:left-0 after:right-0 after:h-0.5 after:bg-home-orange"
              : "text-home-muted hover:text-white",
          )}
        >
          Cidades
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("categorias")}
          className={cn(
            "relative pb-2 transition-colors cursor-pointer",
            activeTab === "categorias"
              ? "text-white after:absolute after:bottom-[-13px] after:left-0 after:right-0 after:h-0.5 after:bg-home-orange"
              : "text-home-muted hover:text-white",
          )}
        >
          Categorias
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("leads")}
          className={cn(
            "relative pb-2 transition-colors cursor-pointer",
            activeTab === "leads"
              ? "text-white after:absolute after:bottom-[-13px] after:left-0 after:right-0 after:h-0.5 after:bg-home-orange"
              : "text-home-muted hover:text-white",
          )}
        >
          Desempenho por lead
        </button>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[220px] flex-1 sm:min-w-[260px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-home-muted" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar campanha por nome..."
            className="h-9 w-full rounded-xl border border-home-border bg-home-background pl-9 pr-3 text-xs text-home-foreground outline-none placeholder:text-home-muted transition-colors focus:border-home-blue focus:ring-1 focus:ring-home-blue"
          />
        </div>

        <select
          value={canalFilter}
          onChange={(e) => setCanalFilter(e.target.value)}
          className="h-9 rounded-xl border border-home-border bg-home-background px-3 text-xs font-medium text-home-foreground outline-none transition-colors hover:border-home-border/80 focus:border-home-blue"
        >
          <option value="all">Todos os canais</option>
          <option value="email">E-mail</option>
          <option value="whatsapp">WhatsApp</option>
        </select>

        <select
          value={periodoFilter}
          onChange={(e) => setPeriodoFilter(e.target.value)}
          className="h-9 rounded-xl border border-home-border bg-home-background px-3 text-xs font-medium text-home-foreground outline-none transition-colors hover:border-home-border/80 focus:border-home-blue"
        >
          <option value="30d">Últimos 30 dias</option>
          <option value="7d">Últimos 7 dias</option>
          <option value="90d">Últimos 90 dias</option>
          <option value="all">Todo o período</option>
        </select>
      </div>

      {/* Tabela de Campanhas */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-home-border/60 text-[10px] font-semibold uppercase tracking-wider text-home-muted">
              <th className="w-8 pb-2.5 pl-2">
                <Checkbox
                  checked={
                    selectedIds.size > 0 && selectedIds.size === filtered.length
                  }
                  onCheckedChange={toggleSelectAll}
                  aria-label="Selecionar todas as campanhas"
                />
              </th>
              <th className="pb-2.5 pr-4 font-semibold">Campanha</th>
              <th className="pb-2.5 pr-4 font-semibold">Canal</th>
              <th className="pb-2.5 pr-4 font-semibold text-center">Leads</th>
              <th className="pb-2.5 pr-4 font-semibold text-center">Sites</th>
              <th className="pb-2.5 pr-4 font-semibold text-center">Enviados</th>
              <th className="pb-2.5 pr-4 font-semibold text-center">Aberturas</th>
              <th className="pb-2.5 pr-4 font-semibold text-center">Cliques</th>
              <th className="pb-2.5 pr-4 font-semibold text-center">Interessados</th>
              <th className="pb-2.5 pr-4 font-semibold">Status</th>
              <th className="pb-2.5 pr-2 text-right font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-home-border/40">
            {filtered.map((c) => {
              const isChecked = selectedIds.has(c.id);

              return (
                <tr
                  key={c.id}
                  onClick={() => onSelectCampanha?.(c)}
                  className="group cursor-pointer transition-colors duration-150 hover:bg-home-surface-strong/60"
                >
                  {/* Checkbox */}
                  <td className="py-3 pl-2" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => toggleSelect(c.id)}
                      aria-label={`Selecionar ${c.name}`}
                    />
                  </td>

                  {/* Nome da Campanha + Período */}
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-home-border bg-home-surface-strong text-white text-xs shadow-sm">
                        <Utensils className="size-3.5 text-amber-500" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-white transition-colors group-hover:text-home-orange">
                          {c.name}
                        </div>
                        <div className="text-[10px] text-home-muted truncate">
                          {c.period}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Canal Badge */}
                  <td className="py-3 pr-4 whitespace-nowrap">
                    {c.channel === "email" ? (
                      <span className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                        <Mail className="size-3" />
                        E-mail
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                        <MessageSquare className="size-3" />
                        WhatsApp
                      </span>
                    )}
                  </td>

                  {/* Leads */}
                  <td className="py-3 pr-4 text-center font-semibold text-white tabular-nums">
                    {c.leads}
                  </td>

                  {/* Sites */}
                  <td className="py-3 pr-4 text-center text-home-foreground tabular-nums">
                    {c.sites}
                  </td>

                  {/* Enviados */}
                  <td className="py-3 pr-4 text-center text-home-foreground tabular-nums">
                    {c.enviados}
                  </td>

                  {/* Aberturas */}
                  <td className="py-3 pr-4 text-center whitespace-nowrap tabular-nums">
                    {c.aberturas ? (
                      <div>
                        <span className="font-semibold text-white">
                          {c.aberturas.count}
                        </span>
                        <div className="text-[10px] text-home-muted">
                          {c.aberturas.percentage}
                        </div>
                      </div>
                    ) : (
                      <span className="text-home-muted">—</span>
                    )}
                  </td>

                  {/* Cliques */}
                  <td className="py-3 pr-4 text-center whitespace-nowrap tabular-nums">
                    {c.cliques ? (
                      <div>
                        <span className="font-semibold text-white">
                          {c.cliques.count}
                        </span>
                        <div className="text-[10px] text-home-muted">
                          {c.cliques.percentage}
                        </div>
                      </div>
                    ) : (
                      <span className="text-home-muted">—</span>
                    )}
                  </td>

                  {/* Interessados */}
                  <td className="py-3 pr-4 text-center whitespace-nowrap tabular-nums">
                    <div>
                      <span className="font-semibold text-white">
                        {c.interessados.count}
                      </span>
                      <div className="text-[10px] text-emerald-400 font-medium">
                        {c.interessados.percentage}
                      </div>
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 pr-4 whitespace-nowrap">
                    {c.status === "em_producao" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400">
                        <span className="size-1.5 rounded-full bg-emerald-400" />
                        Em produção
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/15 px-2.5 py-0.5 text-[10px] font-medium text-blue-400">
                        <span className="size-1.5 rounded-full bg-blue-400" />
                        Concluída
                      </span>
                    )}
                  </td>

                  {/* Ações */}
                  <td
                    className="py-3 pr-2 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      className="inline-flex size-7 items-center justify-center rounded-lg text-home-muted transition-colors hover:bg-home-surface-strong hover:text-white"
                      title="Opções"
                    >
                      <MoreHorizontal className="size-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Paginação Inferior */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-home-border/60 pt-3 text-xs">
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="flex size-7 items-center justify-center rounded-lg border border-home-border bg-home-background text-home-muted transition-colors hover:bg-home-surface-strong hover:text-white disabled:opacity-40"
          >
            <ChevronLeft className="size-3.5" />
          </button>

          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setPage(n)}
              className={cn(
                "flex size-7 items-center justify-center rounded-lg text-xs font-semibold transition-colors",
                page === n
                  ? "bg-home-orange text-white shadow-sm"
                  : "border border-home-border bg-home-background text-home-foreground hover:bg-home-surface-strong",
              )}
            >
              {n}
            </button>
          ))}

          <span className="px-1 text-home-muted">...</span>

          <button
            type="button"
            onClick={() => setPage(10)}
            className="flex size-7 items-center justify-center rounded-lg border border-home-border bg-home-background text-xs font-semibold text-home-foreground transition-colors hover:bg-home-surface-strong"
          >
            10
          </button>

          <button
            type="button"
            disabled={page === 10}
            onClick={() => setPage((p) => Math.min(10, p + 1))}
            className="flex size-7 items-center justify-center rounded-lg border border-home-border bg-home-background text-home-muted transition-colors hover:bg-home-surface-strong hover:text-white disabled:opacity-40"
          >
            <ChevronRight className="size-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="h-7 rounded-lg border border-home-border bg-home-background px-2 text-xs font-medium text-home-foreground outline-none"
          >
            <option value={10}>10 por página</option>
            <option value={20}>20 por página</option>
            <option value={50}>50 por página</option>
          </select>
        </div>
      </div>
    </div>
  );
}
