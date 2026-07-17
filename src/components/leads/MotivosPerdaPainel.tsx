// Painel de APRENDIZADO — contagem por motivo de perda (ETAPA 3). Simples e verdadeiro:
// lê leads.motivo_perda (1 por lead) e mostra "motivo: N", do mais frequente ao menos.
// Colapsável no topo do Pipeline para não roubar espaço do board.
import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, TrendingDown, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { contarMotivosPerda } from "@/lib/leads-api";

export function MotivosPerdaPainel({ recarregarSinal }: { recarregarSinal?: number }) {
  const [aberto, setAberto] = useState(false);
  const [dados, setDados] = useState<{ motivo: string; total: number }[]>([]);
  const [carregando, setCarregando] = useState(false);

  const carregar = async () => {
    setCarregando(true);
    try {
      setDados(await contarMotivosPerda());
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregar();
  }, [recarregarSinal]);

  const total = dados.reduce((s, d) => s + d.total, 0);
  const maior = dados.reduce((m, d) => Math.max(m, d.total), 0) || 1;

  return (
    <div className="rounded-xl border border-border bg-secondary/20">
      <button
        onClick={() => setAberto((a) => !a)}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left"
      >
        {aberto ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
        <TrendingDown className="h-4 w-4 text-rose-500" />
        <span className="text-sm font-semibold">Aprendizado — motivos de perda</span>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
          {total}
        </span>
        <RefreshCw
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            carregar();
          }}
          className={cn(
            "ml-auto h-3.5 w-3.5 text-muted-foreground hover:text-foreground",
            carregando && "animate-spin",
          )}
        />
      </button>

      {aberto && (
        <div className="border-t border-border px-4 py-3">
          {dados.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum lead marcado como perdido/nutrição com motivo ainda.
            </p>
          ) : (
            <ul className="space-y-2">
              {dados.map((d) => (
                <li key={d.motivo} className="flex items-center gap-3 text-sm">
                  <span className="w-52 shrink-0 truncate" title={d.motivo}>
                    {d.motivo}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-rose-400"
                      style={{ width: `${Math.round((d.total / maior) * 100)}%` }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right font-semibold tabular-nums">
                    {d.total}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
