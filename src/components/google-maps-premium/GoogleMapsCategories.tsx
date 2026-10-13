import { useMemo, useState } from "react";
import { Check, ChevronDown, ChevronUp, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { NICHOS_POR_CATEGORIA, TOTAL_NICHOS } from "@/lib/niches";

interface GoogleMapsCategoriesProps {
  nichoSelecionado: string;
  onSelectCategoria: (nicho: string, categoria: string) => void;
  disabled?: boolean;
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();

export function GoogleMapsCategories({
  nichoSelecionado,
  onSelectCategoria,
  disabled,
}: GoogleMapsCategoriesProps) {
  const [buscaCategoria, setBuscaCategoria] = useState("");
  // Inicia com o primeiro segmento expandido (ex: Saúde & Bem-estar)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    "Saúde & Bem-estar": true,
  });

  const termo = norm(buscaCategoria);
  const selNorm = norm(nichoSelecionado);

  const toggleCategory = (categoria: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoria]: !prev[categoria],
    }));
  };

  // Se houver busca de categoria, filtra os segmentos e nichos correspondentes
  const gruposFiltrados = useMemo(() => {
    if (!termo) return NICHOS_POR_CATEGORIA;

    return NICHOS_POR_CATEGORIA.map((grupo) => {
      const matchCategoria = norm(grupo.categoria).includes(termo);
      const nichosFiltrados = matchCategoria
        ? grupo.nichos
        : grupo.nichos.filter((n) => norm(n).includes(termo));

      return {
        ...grupo,
        nichos: nichosFiltrados,
      };
    }).filter((grupo) => grupo.nichos.length > 0);
  }, [termo]);

  return (
    <div className="space-y-3 pt-2">
      {/* Cabeçalho do Bloco */}
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold uppercase tracking-wider text-home-muted select-none">
          Categorias / Segmentos
        </label>
        <span className="text-[10px] font-medium text-home-muted">({TOTAL_NICHOS} nichos)</span>
      </div>

      {/* Input de Busca Dentro do Catálogo */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-home-muted" />
        <input
          type="search"
          value={buscaCategoria}
          onChange={(e) => setBuscaCategoria(e.target.value)}
          placeholder="Buscar categoria..."
          className="h-8.5 w-full rounded-xl border border-home-border bg-home-surface/80 pl-8.5 pr-3 text-[11px] text-white placeholder:text-home-muted/70 focus:border-home-orange focus:ring-1 focus:ring-home-orange/30 outline-none transition-colors"
        />
      </div>

      {/* Container Compacto com Rolagem Interna */}
      <div className="max-h-75 space-y-2 overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-home-border scrollbar-track-transparent">
        {gruposFiltrados.map((grupo) => {
          // Quando houver termo de busca, expande automaticamente
          const isExpanded = termo ? true : !!expandedCategories[grupo.categoria];
          const hasSelectedChild = grupo.nichos.some((n) => norm(n) === selNorm);

          return (
            <div
              key={grupo.categoria}
              className="rounded-xl border border-home-border/70 bg-home-surface/60 overflow-hidden transition-colors"
            >
              {/* Botão de Expansão do Segmento */}
              <button
                type="button"
                onClick={() => toggleCategory(grupo.categoria)}
                className="flex w-full items-center justify-between px-3 py-2 text-left transition-colors hover:bg-home-surface-strong/70"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs select-none" aria-hidden="true">
                    {grupo.icone}
                  </span>
                  <span
                    className={cn(
                      "text-xs font-semibold truncate",
                      hasSelectedChild ? "text-blue-400" : "text-home-foreground/90",
                    )}
                  >
                    {grupo.categoria}
                  </span>
                  <span className="text-[10px] text-home-muted/80">({grupo.nichos.length})</span>
                </div>

                {isExpanded ? (
                  <ChevronUp className="size-3.5 text-home-muted shrink-0" />
                ) : (
                  <ChevronDown className="size-3.5 text-home-muted shrink-0" />
                )}
              </button>

              {/* Chips do Segmento */}
              {isExpanded && (
                <div className="border-t border-home-border/40 p-2.5">
                  <div className="flex flex-wrap gap-1.5">
                    {grupo.nichos.map((n) => {
                      const isSelected = norm(n) === selNorm;

                      return (
                        <button
                          key={n}
                          type="button"
                          disabled={disabled}
                          onClick={() => onSelectCategoria(n, grupo.categoria)}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer disabled:opacity-50",
                            isSelected
                              ? "bg-blue-600 text-white shadow-sm ring-1 ring-blue-400"
                              : "bg-[#14202d] text-home-foreground/90 hover:bg-home-surface-strong hover:text-white border border-home-border/60",
                          )}
                        >
                          {isSelected && <Check className="size-3 text-white" />}
                          <span>{n}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {gruposFiltrados.length === 0 && (
          <div className="py-6 text-center text-xs text-home-muted">
            Nenhuma categoria encontrada para “{buscaCategoria}”.
          </div>
        )}
      </div>
    </div>
  );
}
