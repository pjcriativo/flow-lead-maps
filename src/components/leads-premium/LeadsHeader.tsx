import { Download, Loader2, Plus, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeadsHeaderProps {
  onImport?: () => void;
  onExport?: () => void;
  onNewLead?: () => void;
  exporting?: boolean;
  className?: string;
}

export function LeadsHeader({
  onImport,
  onExport,
  onNewLead,
  exporting = false,
  className,
}: LeadsHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-[28px]">Leads</h1>
        <p className="mt-1 text-xs text-home-muted sm:text-[13px]">
          Gerencie todos os leads capturados em seus canais de aquisição.
        </p>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onImport}
          disabled={!onImport}
          title={!onImport ? "Importação indisponível: não há serviço validado" : undefined}
          className={cn(
            "inline-flex h-9.5 items-center gap-2 rounded-xl border border-home-border bg-home-surface px-3.5 text-xs font-semibold text-white transition-colors",
            "hover:bg-home-surface-strong hover:border-home-border/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-home-orange disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          <Download className="size-4 text-home-muted" />
          <span>Importar</span>
        </button>

        <button
          type="button"
          onClick={onExport}
          disabled={exporting}
          className={cn(
            "inline-flex h-9.5 items-center gap-2 rounded-xl border border-home-border bg-home-surface px-3.5 text-xs font-semibold text-white transition-colors",
            "hover:bg-home-surface-strong hover:border-home-border/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-home-orange",
          )}
        >
          {exporting ? (
            <Loader2 className="size-4 animate-spin text-home-muted" />
          ) : (
            <Upload className="size-4 text-home-muted" />
          )}
          <span>{exporting ? "Exportando..." : "Exportar"}</span>
        </button>

        <button
          type="button"
          onClick={onNewLead}
          className={cn(
            "inline-flex h-9.5 items-center gap-2 rounded-xl bg-home-orange px-4 text-xs font-bold text-white shadow-[0_0_24px_rgba(255,98,0,0.36)] transition-all",
            "hover:bg-home-orange/90 hover:shadow-[0_0_28px_rgba(255,98,0,0.48)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-home-orange",
          )}
        >
          <Plus className="size-4" />
          <span>Novo lead</span>
        </button>
      </div>
    </div>
  );
}
