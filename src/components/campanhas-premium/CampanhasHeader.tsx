import { LayoutTemplate, Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CampanhasHeaderProps {
  onNewCampaign: () => void;
  onOpenTemplates?: () => void;
  className?: string;
}

export function CampanhasHeader({
  onNewCampaign,
  onOpenTemplates,
  className,
}: CampanhasHeaderProps) {
  const handleModelosClick = () => {
    if (onOpenTemplates) {
      onOpenTemplates();
    } else {
      toast.info("Modelos comerciais: Em breve você poderá escolher templates prontos para nichos específicos.");
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Campanhas
        </h1>
        <p className="mt-1 text-xs text-home-muted sm:text-sm">
          Crie, acompanhe e gerencie campanhas comerciais com IA, sites, propostas e envios em um só lugar.
        </p>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={handleModelosClick}
          className="flex h-9 items-center gap-2 rounded-xl border border-home-border bg-home-surface px-3.5 text-xs font-semibold text-home-foreground transition-all duration-200 hover:border-home-border/80 hover:bg-home-surface-strong hover:text-white"
        >
          <LayoutTemplate className="size-4 text-home-muted" />
          Modelos
        </button>

        <button
          type="button"
          onClick={onNewCampaign}
          className="flex h-9 items-center gap-1.5 rounded-xl bg-home-orange px-4 text-xs font-bold text-white shadow-[0_0_24px_rgba(255,98,0,0.35)] transition-all duration-200 hover:bg-home-orange/90 hover:shadow-[0_0_30px_rgba(255,98,0,0.5)] active:scale-[0.98]"
        >
          <Plus className="size-4 stroke-[2.5]" />
          Nova campanha
        </button>
      </div>
    </div>
  );
}
