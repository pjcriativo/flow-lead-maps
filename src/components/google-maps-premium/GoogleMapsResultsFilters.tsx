import { Search, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { LEAD_STATUSES, STATUS_LABELS } from "@/lib/leads-api";

export type FilterTab =
  "todos" | "ineditos" | "duplicatas" | "telefone" | "email" | "site" | "instagram";

export interface GoogleMapsResultsFiltersProps {
  busca: string;
  onChangeBusca: (v: string) => void;
  categoria: string;
  onChangeCategoria: (v: string) => void;
  categoriasDisponiveis: string[];
  minAvaliacao: string;
  onChangeMinAvaliacao: (v: string) => void;
  filtroStatus: string;
  onChangeFiltroStatus: (v: string) => void;
  filtroContato: string;
  onChangeFiltroContato: (v: string) => void;
  filtroScore: string;
  onChangeFiltroScore: (v: string) => void;
  ordenacaoScore: string;
  onChangeOrdenacaoScore: (v: string) => void;
  activeTab: FilterTab;
  onChangeActiveTab: (tab: FilterTab) => void;
  onLimparFiltros: () => void;
  counts: {
    total: number;
    ineditos: number;
    duplicatas: number;
    telefone: number;
    email: number;
    site: number;
    instagram: number;
  };
}

export function GoogleMapsResultsFilters({
  busca,
  onChangeBusca,
  categoria,
  onChangeCategoria,
  categoriasDisponiveis,
  minAvaliacao,
  onChangeMinAvaliacao,
  filtroStatus,
  onChangeFiltroStatus,
  filtroContato,
  onChangeFiltroContato,
  filtroScore,
  onChangeFiltroScore,
  ordenacaoScore,
  onChangeOrdenacaoScore,
  activeTab,
  onChangeActiveTab,
  onLimparFiltros,
  counts,
}: GoogleMapsResultsFiltersProps) {
  const temFiltroAtivo =
    busca.trim() !== "" ||
    categoria !== "todas" ||
    minAvaliacao !== "qualquer" ||
    filtroStatus !== "todos" ||
    filtroContato !== "todos" ||
    filtroScore !== "todos" ||
    ordenacaoScore !== "nenhuma" ||
    activeTab !== "todos";

  const tabs: { id: FilterTab; label: string; count: number }[] = [
    { id: "todos", label: "Todos", count: counts.total },
    { id: "ineditos", label: "Inéditos", count: counts.ineditos },
    { id: "duplicatas", label: "Duplicatas", count: counts.duplicatas },
    { id: "telefone", label: "Com telefone", count: counts.telefone },
    { id: "email", label: "Com e-mail", count: counts.email },
    { id: "site", label: "Com site", count: counts.site },
    { id: "instagram", label: "Com Instagram", count: counts.instagram },
  ];

  return (
    <div className="rounded-2xl border border-home-border bg-[#101720]/90 p-4 shadow-sm space-y-3.5">
      {/* Topo do Card com Título e Limpar Filtros */}
      <div className="flex items-center justify-between border-b border-home-border/60 pb-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="size-4 text-home-orange" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-white">
            Filtros de resultados
          </h2>
        </div>
        {temFiltroAtivo && (
          <button
            type="button"
            onClick={onLimparFiltros}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-home-muted hover:text-home-orange transition-colors cursor-pointer"
          >
            <span>‹ Limpar filtros</span>
          </button>
        )}
      </div>

      {/* Campo de Busca Textual */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-home-muted" />
        <input
          type="text"
          value={busca}
          onChange={(e) => onChangeBusca(e.target.value)}
          placeholder="Buscar por nome, categoria, endereço ou palavra-chave..."
          className="w-full h-10 rounded-xl border border-home-border bg-home-surface/80 pl-10 pr-10 text-xs text-white placeholder:text-home-muted/70 focus:border-home-orange focus:outline-none focus:ring-1 focus:ring-home-orange transition-all"
        />
        {busca && (
          <button
            type="button"
            onClick={() => onChangeBusca("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-home-muted hover:text-white"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* Filtros e ordenação dos resultados reais */}
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-6">
        {/* Dropdown 1: Categoria */}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-home-muted">
            Categoria
          </label>
          <select
            value={categoria}
            onChange={(e) => onChangeCategoria(e.target.value)}
            className="w-full h-9 rounded-xl border border-home-border bg-home-surface/80 px-2.5 text-xs text-white focus:border-home-orange focus:outline-none cursor-pointer"
          >
            <option value="todas">Todas</option>
            {categoriasDisponiveis.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Dropdown 2: Avaliação Mínima */}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-home-muted">
            Avaliação mínima
          </label>
          <select
            value={minAvaliacao}
            onChange={(e) => onChangeMinAvaliacao(e.target.value)}
            className="w-full h-9 rounded-xl border border-home-border bg-home-surface/80 px-2.5 text-xs text-white focus:border-home-orange focus:outline-none cursor-pointer"
          >
            <option value="qualquer">Qualquer</option>
            <option value="3.0">3.0+ ★</option>
            <option value="3.5">3.5+ ★</option>
            <option value="4.0">4.0+ ★</option>
            <option value="4.5">4.5+ ★</option>
            <option value="5.0">5.0 ★</option>
          </select>
        </div>

        {/* Dropdown 3: Status */}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-home-muted">
            Status
          </label>
          <select
            value={filtroStatus}
            onChange={(e) => onChangeFiltroStatus(e.target.value)}
            className="w-full h-9 rounded-xl border border-home-border bg-home-surface/80 px-2.5 text-xs text-white focus:border-home-orange focus:outline-none cursor-pointer"
          >
            <option value="todos">Todos</option>
            {LEAD_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>

        {/* Dropdown 4: Com contato */}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-home-muted">
            Com contato
          </label>
          <select
            value={filtroContato}
            onChange={(e) => onChangeFiltroContato(e.target.value)}
            className="w-full h-9 rounded-xl border border-home-border bg-home-surface/80 px-2.5 text-xs text-white focus:border-home-orange focus:outline-none cursor-pointer"
          >
            <option value="todos">Todos</option>
            <option value="telefone">Com telefone</option>
            <option value="email">Com e-mail</option>
            <option value="site">Com site</option>
            <option value="instagram">Com Instagram</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-home-muted">
            Score mínimo
          </label>
          <select
            value={filtroScore}
            onChange={(e) => onChangeFiltroScore(e.target.value)}
            className="h-9 w-full cursor-pointer rounded-xl border border-home-border bg-home-surface/80 px-2.5 text-xs text-white focus:border-home-orange focus:outline-none"
          >
            <option value="todos">Qualquer</option>
            <option value="25">25+</option>
            <option value="50">50+</option>
            <option value="75">75+</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-home-muted">
            Ordenar por score
          </label>
          <select
            value={ordenacaoScore}
            onChange={(e) => onChangeOrdenacaoScore(e.target.value)}
            className="h-9 w-full cursor-pointer rounded-xl border border-home-border bg-home-surface/80 px-2.5 text-xs text-white focus:border-home-orange focus:outline-none"
          >
            <option value="nenhuma">Padrão</option>
            <option value="desc">Maior primeiro</option>
            <option value="asc">Menor primeiro</option>
          </select>
        </div>
      </div>

      {/* Abas de Resultados com Contadores */}
      <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 no-scrollbar">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChangeActiveTab(tab.id)}
              className={cn(
                "inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer border",
                isActive
                  ? "bg-home-orange/15 text-home-orange border-home-orange shadow-sm shadow-home-orange/10 font-bold"
                  : "bg-home-surface/50 text-home-muted border-home-border/80 hover:text-white hover:border-home-border hover:bg-home-surface",
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  "rounded-md px-1.5 py-0.2 text-[10px] font-bold",
                  isActive
                    ? "bg-home-orange text-white"
                    : "bg-home-border/80 text-home-muted group-hover:text-white",
                )}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
