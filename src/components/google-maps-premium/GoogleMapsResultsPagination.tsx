import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GoogleMapsResultsPaginationProps {
  totalItens: number;
  paginaAtual: number;
  itensPorPagina: number;
  onMudarPagina: (p: number) => void;
  onMudarItensPorPagina: (tam: number) => void;
}

export function GoogleMapsResultsPagination({
  totalItens,
  paginaAtual,
  itensPorPagina,
  onMudarPagina,
  onMudarItensPorPagina,
}: GoogleMapsResultsPaginationProps) {
  const totalPaginas = Math.max(1, Math.ceil(totalItens / itensPorPagina));
  const inicio = totalItens === 0 ? 0 : (paginaAtual - 1) * itensPorPagina + 1;
  const fim = Math.min(paginaAtual * itensPorPagina, totalItens);

  // Gera lista de páginas para navegação com elipses se necessário
  const gerarBotoesPagina = () => {
    const paginas: (number | "...")[] = [];
    if (totalPaginas <= 7) {
      for (let i = 1; i <= totalPaginas; i++) paginas.push(i);
    } else {
      paginas.push(1);
      if (paginaAtual > 3) paginas.push("...");

      const start = Math.max(2, paginaAtual - 1);
      const end = Math.min(totalPaginas - 1, paginaAtual + 1);
      for (let i = start; i <= end; i++) {
        paginas.push(i);
      }

      if (paginaAtual < totalPaginas - 2) paginas.push("...");
      paginas.push(totalPaginas);
    }
    return paginas;
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 py-3 text-xs text-home-muted border-t border-home-border/60">
      {/* Texto de visualização de registros */}
      <div>
        <span>
          Mostrando <strong className="text-white font-semibold">{inicio}</strong> a{" "}
          <strong className="text-white font-semibold">{fim}</strong> de{" "}
          <strong className="text-white font-semibold">{totalItens}</strong> empresas
        </span>
      </div>

      {/* Navegação de Páginas Central */}
      <div className="flex items-center gap-1 self-center">
        {/* Anterior */}
        <button
          type="button"
          onClick={() => onMudarPagina(paginaAtual - 1)}
          disabled={paginaAtual <= 1}
          className="flex size-7 items-center justify-center rounded-lg border border-home-border bg-home-surface/60 text-home-muted hover:text-white hover:bg-home-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          title="Página anterior"
        >
          <ChevronLeft className="size-3.5" />
        </button>

        {/* Números das Páginas */}
        {gerarBotoesPagina().map((item, idx) => {
          if (item === "...") {
            return (
              <span key={`dots-${idx}`} className="px-1 text-home-muted">
                ...
              </span>
            );
          }
          const isAtivo = item === paginaAtual;
          return (
            <button
              key={item}
              type="button"
              onClick={() => onMudarPagina(item)}
              className={cn(
                "flex size-7 items-center justify-center rounded-lg text-xs font-semibold transition-all cursor-pointer",
                isAtivo
                  ? "bg-home-orange text-white font-bold shadow-sm shadow-home-orange/20"
                  : "border border-home-border bg-home-surface/60 text-home-muted hover:text-white hover:bg-home-surface",
              )}
            >
              {item}
            </button>
          );
        })}

        {/* Próxima */}
        <button
          type="button"
          onClick={() => onMudarPagina(paginaAtual + 1)}
          disabled={paginaAtual >= totalPaginas}
          className="flex size-7 items-center justify-center rounded-lg border border-home-border bg-home-surface/60 text-home-muted hover:text-white hover:bg-home-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          title="Próxima página"
        >
          <ChevronRight className="size-3.5" />
        </button>
      </div>

      {/* Seletor de Itens por Página */}
      <div className="flex items-center gap-2 self-end sm:self-auto">
        <select
          value={itensPorPagina}
          onChange={(e) => {
            onMudarItensPorPagina(Number(e.target.value));
            onMudarPagina(1);
          }}
          className="h-8 rounded-lg border border-home-border bg-home-surface/80 px-2 text-xs text-white focus:border-home-orange focus:outline-none cursor-pointer"
        >
          <option value={10}>10 por página</option>
          <option value={25}>25 por página</option>
          <option value={50}>50 por página</option>
        </select>
      </div>
    </div>
  );
}
