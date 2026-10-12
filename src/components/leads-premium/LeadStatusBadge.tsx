import { cn } from "@/lib/utils";
import type { LeadStatus } from "./leads-premium-data";

interface LeadStatusBadgeProps {
  status: LeadStatus;
  className?: string;
}

const STATUS_CONFIG: Record<
  LeadStatus,
  {
    bg: string;
    text: string;
    border: string;
  }
> = {
  Novo: {
    bg: "bg-blue-500/15",
    text: "text-blue-400",
    border: "border-blue-500/30",
  },
  "Em contato": {
    bg: "bg-purple-500/15",
    text: "text-purple-300",
    border: "border-purple-500/30",
  },
  Oportunidade: {
    bg: "bg-emerald-500/15",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
  },
  Proposta: {
    bg: "bg-amber-500/15",
    text: "text-amber-400",
    border: "border-amber-500/30",
  },
  Negociação: {
    bg: "bg-orange-500/15",
    text: "text-orange-400",
    border: "border-orange-500/30",
  },
};

export function LeadStatusBadge({ status, className }: LeadStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.Novo;

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-lg border px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap leading-none transition-colors",
        config.bg,
        config.text,
        config.border,
        className,
      )}
    >
      {status}
    </span>
  );
}
