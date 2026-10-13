import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Search, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NICHOS_POR_CATEGORIA } from "@/lib/niches";

interface GoogleMapsNicheInputProps {
  nicho: string;
  onChangeNicho: (valor: string) => void;
  nomeLista: string;
  onChangeNomeLista: (valor: string) => void;
  onSelectNicho: (nicho: string, categoria?: string) => void;
  categoriaAtiva?: string;
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();

export function GoogleMapsNicheInput({
  nicho,
  onChangeNicho,
  nomeLista,
  onChangeNomeLista,
  onSelectNicho,
  categoriaAtiva,
}: GoogleMapsNicheInputProps) {
  const [dropdownAberto, setDropdownAberto] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const termo = norm(nicho);

  // Lista plana de sugestões a partir do catálogo real
  const sugestoes = useMemo(() => {
    if (!termo) {
      // Sugestões populares iniciais
      return [
        { nicho: "Clínica odontológica", categoria: "Saúde & Bem-estar", icone: "🩺" },
        { nicho: "Dentista", categoria: "Saúde & Bem-estar", icone: "🩺" },
        { nicho: "Ortodontista", categoria: "Saúde & Bem-estar", icone: "🩺" },
        { nicho: "Implantodontista", categoria: "Saúde & Bem-estar", icone: "🩺" },
        { nicho: "Advogado", categoria: "Serviços Profissionais", icone: "⚖️" },
        { nicho: "Oficina mecânica", categoria: "Automotivo", icone: "🚗" },
      ];
    }

    const matches: Array<{ nicho: string; categoria: string; icone: string }> = [];
    for (const cat of NICHOS_POR_CATEGORIA) {
      for (const n of cat.nichos) {
        if (norm(n).includes(termo)) {
          matches.push({ nicho: n, categoria: cat.categoria, icone: cat.icone });
          if (matches.length >= 8) break;
        }
      }
      if (matches.length >= 8) break;
    }
    return matches;
  }, [termo]);

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setDropdownAberto(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!dropdownAberto) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setDropdownAberto(true);
      }
      return;
    }

    const totalOpcoes = sugestoes.length + (termo ? 1 : 0);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev + 1) % totalOpcoes);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev - 1 + totalOpcoes) % totalOpcoes);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightIndex >= 0 && highlightIndex < sugestoes.length) {
        const item = sugestoes[highlightIndex];
        onSelectNicho(item.nicho, item.categoria);
        setDropdownAberto(false);
      } else if (highlightIndex === sugestoes.length && termo) {
        // "Usar exatamente"
        onSelectNicho(nicho.trim());
        setDropdownAberto(false);
      }
    } else if (e.key === "Escape") {
      setDropdownAberto(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Campo: NOME DA LISTA (OPCIONAL) */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold uppercase tracking-wider text-home-muted select-none">
          Nome da lista (opcional)
        </label>
        <div className="relative">
          <input
            type="text"
            value={nomeLista}
            onChange={(e) => onChangeNomeLista(e.target.value)}
            placeholder="ex.: Clínicas Odontológicas — São Paulo"
            className="h-10 w-full rounded-xl border border-home-border bg-home-surface/80 px-3.5 text-xs text-white placeholder:text-home-muted/70 focus:border-home-orange focus:ring-1 focus:ring-home-orange/30 outline-none transition-colors"
          />
        </div>
      </div>

      {/* Campo Principal: NICHO (DIGITE OU ESCOLHA) */}
      <div ref={containerRef} className="relative space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold uppercase tracking-wider text-home-muted select-none">
            Nicho (digite ou escolha)
          </label>
          {categoriaAtiva && (
            <span className="text-[10px] font-medium text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
              {categoriaAtiva}
            </span>
          )}
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-home-orange" />
          <input
            ref={inputRef}
            type="text"
            value={nicho}
            onFocus={() => setDropdownAberto(true)}
            onChange={(e) => {
              onChangeNicho(e.target.value);
              setDropdownAberto(true);
              setHighlightIndex(-1);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Digite qualquer nicho, profissão ou serviço..."
            className="h-10.5 w-full rounded-xl border border-home-border bg-home-surface/90 pl-10 pr-10 text-xs font-medium text-white placeholder:text-home-muted/70 focus:border-home-orange focus:ring-2 focus:ring-home-orange/20 outline-none transition-colors"
          />

          {nicho && (
            <button
              type="button"
              onClick={() => {
                onChangeNicho("");
                onSelectNicho("");
                inputRef.current?.focus();
              }}
              aria-label="Limpar nicho"
              className="absolute right-3 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-full text-home-muted hover:bg-home-surface-strong hover:text-white transition-colors"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown de Autocomplete / Sugestões com suporte a termo livre */}
        {dropdownAberto && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-72 overflow-y-auto rounded-xl border border-home-border bg-[#101720] p-1.5 shadow-2xl backdrop-blur-xl">
            <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-home-muted select-none">
              Sugestões de Nicho
            </div>

            <div className="space-y-0.5">
              {sugestoes.map((item, idx) => {
                const isSelected = norm(item.nicho) === termo;
                const isHighlighted = highlightIndex === idx;

                return (
                  <button
                    key={`${item.categoria}-${item.nicho}`}
                    type="button"
                    onClick={() => {
                      onSelectNicho(item.nicho, item.categoria);
                      setDropdownAberto(false);
                    }}
                    onMouseEnter={() => setHighlightIndex(idx)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-colors",
                      isHighlighted
                        ? "bg-home-surface-strong text-white"
                        : isSelected
                          ? "bg-blue-600/20 text-blue-300 font-semibold"
                          : "text-home-foreground/90 hover:bg-home-surface-strong hover:text-white",
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm select-none" aria-hidden="true">
                        {item.icone}
                      </span>
                      <span className="truncate">{item.nicho}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-home-muted/80">{item.categoria}</span>
                      {isSelected && <Check className="size-3.5 text-blue-400" />}
                    </div>
                  </button>
                );
              })}

              {/* Opção para usar termo livre exato */}
              {nicho.trim().length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectNicho(nicho.trim());
                    setDropdownAberto(false);
                  }}
                  onMouseEnter={() => setHighlightIndex(sugestoes.length)}
                  className={cn(
                    "flex w-full items-center gap-2 border-t border-home-border/60 mt-1 pt-1.5 px-2.5 py-2 text-left text-xs rounded-lg transition-colors",
                    highlightIndex === sugestoes.length
                      ? "bg-home-orange/20 text-home-orange font-semibold"
                      : "text-home-orange/90 hover:bg-home-orange/15 hover:text-home-orange",
                  )}
                >
                  <Sparkles className="size-3.5 shrink-0 text-home-orange" />
                  <span className="truncate">
                    Usar exatamente: <strong className="text-white">"{nicho.trim()}"</strong>
                  </span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
