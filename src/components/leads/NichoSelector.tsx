// Seletor de nichos agrupado por categoria, com busca por texto.
// Clicar num chip preenche o campo de nicho da busca. Consome só de @/lib/niches.
import { useMemo, useState } from "react";
import { Search, ChevronDown, ChevronUp, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { NICHOS_POR_CATEGORIA, TOTAL_NICHOS } from "@/lib/niches";

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");

export function NichoSelector({
  value,
  onSelect,
  disabled,
}: {
  value: string;
  onSelect: (nicho: string) => void;
  disabled?: boolean;
}) {
  const [aberto, setAberto] = useState(false);
  const [q, setQ] = useState("");
  const termo = norm(q.trim());

  const grupos = useMemo(
    () =>
      NICHOS_POR_CATEGORIA.map((g) => ({
        ...g,
        nichos: termo ? g.nichos.filter((n) => norm(n).includes(termo)) : g.nichos,
      })).filter((g) => g.nichos.length),
    [termo],
  );
  const selNorm = norm(value.trim());

  return (
    <div className="rounded-xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setAberto((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-2.5"
      >
        <span className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Categorias / segmentos
          </span>
          <span className="text-xs text-muted-foreground">({TOTAL_NICHOS} nichos)</span>
        </span>
        {aberto ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {aberto && (
        <div className="border-t border-border p-3">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar nicho..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="max-h-80 space-y-4 overflow-y-auto pr-1">
            {grupos.map((g) => (
              <div key={g.categoria}>
                <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <span aria-hidden>{g.icone}</span> {g.categoria}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {g.nichos.map((n) => {
                    const sel = norm(n) === selNorm;
                    return (
                      <button
                        key={n}
                        type="button"
                        disabled={disabled}
                        onClick={() => onSelect(n)}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50",
                          sel
                            ? "bg-primary text-primary-foreground"
                            : "bg-blue-50 text-blue-700 hover:bg-blue-100",
                        )}
                      >
                        {sel && <Check className="h-3 w-3" />}
                        {n}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {grupos.length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Nenhum nicho encontrado para “{q}”.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
