import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

interface GoogleMapsHistoryPaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function GoogleMapsHistoryPagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: GoogleMapsHistoryPaginationProps) {
  if (totalItems === 0) return null;

  const start = Math.min((currentPage - 1) * pageSize + 1, totalItems);
  const end = Math.min(currentPage * pageSize, totalItems);

  // Gerar botões de página (máximo 5 páginas visíveis)
  const pages: number[] = [];
  const maxButtons = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
  const endPage = Math.min(totalPages, startPage + maxButtons - 1);

  if (endPage - startPage + 1 < maxButtons) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-home-muted select-none pt-2">
      {/* 1. Contador de Itens */}
      <div>
        <span>
          Mostrando <strong className="text-white">{start}</strong> a{" "}
          <strong className="text-white">{end}</strong> de{" "}
          <strong className="text-white">{totalItems}</strong> buscas
        </span>
      </div>

      {/* 2. Controles de Navegação de Página */}
      <div className="flex items-center gap-1">
        {/* Página Anterior */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Página anterior"
          className="flex size-7 items-center justify-center rounded-lg border border-home-border bg-home-surface text-home-muted hover:text-white hover:bg-home-surface-strong disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="size-3.5" />
        </button>

        {/* Botões Numéricos */}
        {pages.map((p) => {
          const isActive = p === currentPage;
          return (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={`flex size-7 items-center justify-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? "bg-home-orange text-white shadow-[0_0_12px_rgba(255,98,0,0.4)]"
                  : "border border-home-border bg-home-surface text-home-muted hover:text-white hover:bg-home-surface-strong"
              }`}
            >
              {p}
            </button>
          );
        })}

        {/* Próxima Página */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Próxima página"
          className="flex size-7 items-center justify-center rounded-lg border border-home-border bg-home-surface text-home-muted hover:text-white hover:bg-home-surface-strong disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="size-3.5" />
        </button>
      </div>

      {/* 3. Seletor de Quantidade por Página */}
      <div className="relative">
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          aria-label="Registros por página"
          className="h-8 appearance-none rounded-xl border border-home-border bg-home-surface pl-3 pr-7 text-xs text-home-foreground outline-none transition-colors hover:border-home-border-strong cursor-pointer"
        >
          <option value={10} className="bg-[#121214] text-white">10 por página</option>
          <option value={25} className="bg-[#121214] text-white">25 por página</option>
          <option value={50} className="bg-[#121214] text-white">50 por página</option>
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3 -translate-y-1/2 text-home-muted" />
      </div>
    </div>
  );
}
