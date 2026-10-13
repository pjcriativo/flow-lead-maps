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
  Enriquecido: {
    bg: "bg-cyan-500/15",
    text: "text-cyan-300",
    border: "border-cyan-500/30",
  },
  Contatado: {
    bg: "bg-purple-500/15",
    text: "text-purple-300",
    border: "border-purple-500/30",
  },
  "Proposta enviada": {
    bg: "bg-amber-500/15",
    text: "text-amber-400",
    border: "border-amber-500/30",
  },
  Respondeu: {
    bg: "bg-emerald-500/15",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
  },
  Reunião: {
    bg: "bg-orange-500/15",
    text: "text-orange-400",
    border: "border-orange-500/30",
  },
  Ganho: {
    bg: "bg-emerald-500/20",
    text: "text-emerald-300",
    border: "border-emerald-400/40",
  },
  Perdido: {
    bg: "bg-red-500/15",
    text: "text-red-400",
    border: "border-red-500/30",
  },
  Nutrição: {
    bg: "bg-slate-500/15",
    text: "text-slate-300",
    border: "border-slate-500/30",
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
