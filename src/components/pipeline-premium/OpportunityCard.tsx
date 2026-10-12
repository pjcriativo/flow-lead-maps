import type { MouseEvent } from "react";
import {
  Building2,
  Car,
  Code,
  Compass,
  Dumbbell,
  GraduationCap,
  HeartPulse,
  MoreVertical,
  Scale,
  ShoppingCart,
  Sparkles,
  Truck,
  UtensilsCrossed,
  Wrench,
} from "lucide-react";
import {
  SiGooglemaps,
  SiInstagram,
  SiLinkedin,
  SiTiktok,
  SiWhatsapp,
  SiYoutube,
} from "react-icons/si";
import { cn } from "@/lib/utils";
import type { OpportunityChannel, OpportunityItem } from "./pipeline-premium-data";

interface OpportunityCardProps {
  opportunity: OpportunityItem;
  isSelected?: boolean;
  onSelect: (opp: OpportunityItem) => void;
  onMoreActions?: (opp: OpportunityItem, e: MouseEvent) => void;
  className?: string;
}

export function OpportunityAvatar({
  type,
  className,
}: {
  type: OpportunityItem["avatarType"];
  className?: string;
}) {
  const baseClasses =
    "flex size-7 shrink-0 items-center justify-center rounded-full border border-home-border/80 bg-home-surface-strong text-white";

  switch (type) {
    case "tooth":
      return (
        <div className={cn(baseClasses, "border-cyan-500/30 bg-cyan-950/40 text-cyan-400", className)}>
          <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2C8 2 6 4 6 7c0 3 1.5 5 2 9 .5 3 2 6 4 6s3.5-3 4-6c.5-4 2-6 2-9 0-3-2-5-6-5z" />
            <path d="M9 12c1.5 1.5 4.5 1.5 6 0" />
          </svg>
        </div>
      );
    case "auto":
      return (
        <div className={cn(baseClasses, "border-blue-400/30 bg-slate-900 text-blue-400", className)}>
          <Car className="size-3.5" />
        </div>
      );
    case "fitness":
      return (
        <div className={cn(baseClasses, "border-blue-500/30 bg-blue-950/40 text-blue-400", className)}>
          <Dumbbell className="size-3.5" />
        </div>
      );
    case "restaurant":
      return (
        <div className={cn(baseClasses, "border-amber-500/30 bg-amber-950/40 text-amber-400", className)}>
          <UtensilsCrossed className="size-3.5" />
        </div>
      );
    case "beauty":
      return (
        <div className={cn(baseClasses, "border-pink-500/30 bg-pink-950/40 text-pink-400", className)}>
          <Sparkles className="size-3.5" />
        </div>
      );
    case "leaf":
      return (
        <div className={cn(baseClasses, "border-emerald-500/30 bg-emerald-950/40 text-emerald-400", className)}>
          <HeartPulse className="size-3.5" />
        </div>
      );
    case "tech":
      return (
        <div className={cn(baseClasses, "border-cyan-500/30 bg-cyan-950/40 text-cyan-400", className)}>
          <Code className="size-3.5" />
        </div>
      );
    case "legal":
      return (
        <div className={cn(baseClasses, "border-slate-400/30 bg-slate-800 text-slate-200", className)}>
          <Scale className="size-3.5" />
        </div>
      );
    case "architecture":
    case "construction":
      return (
        <div className={cn(baseClasses, "border-orange-500/30 bg-orange-950/40 text-orange-400", className)}>
          <Compass className="size-3.5" />
        </div>
      );
    case "education":
      return (
        <div className={cn(baseClasses, "border-indigo-500/30 bg-indigo-950/40 text-indigo-400", className)}>
          <GraduationCap className="size-3.5" />
        </div>
      );
    case "supermarket":
      return (
        <div className={cn(baseClasses, "border-red-500/30 bg-red-950/40 text-red-400", className)}>
          <ShoppingCart className="size-3.5" />
        </div>
      );
    case "transport":
      return (
        <div className={cn(baseClasses, "border-sky-500/30 bg-sky-950/40 text-sky-400", className)}>
          <Truck className="size-3.5" />
        </div>
      );
    case "consulting":
    case "holding":
    case "agency":
    case "industry":
      return (
        <div className={cn(baseClasses, "border-slate-500/30 bg-slate-900 text-slate-300", className)}>
          <Building2 className="size-3.5" />
        </div>
      );
    case "mechanic":
      return (
        <div className={cn(baseClasses, "border-amber-600/30 bg-amber-950/40 text-amber-500", className)}>
          <Wrench className="size-3.5" />
        </div>
      );
    default:
      return (
        <div className={cn(baseClasses, className)}>
          <Building2 className="size-3.5" />
        </div>
      );
  }
}

export function ChannelSmallIcon({ channel }: { channel: OpportunityChannel }) {
  switch (channel) {
    case "maps":
      return <SiGooglemaps className="size-3 text-red-500" />;
    case "instagram":
      return <SiInstagram className="size-3 text-[#ec4899]" />;
    case "linkedin":
      return <SiLinkedin className="size-3 text-[#0a66c2]" />;
    case "youtube":
      return <SiYoutube className="size-3 text-[#ef4444]" />;
    case "tiktok":
      return <SiTiktok className="size-3 text-white" />;
    case "whatsapp":
      return <SiWhatsapp className="size-3 text-[#22c55e]" />;
  }
}

export function OpportunityCard({
  opportunity,
  isSelected,
  onSelect,
  onMoreActions,
  className,
}: OpportunityCardProps) {
  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "Novo":
        return "bg-blue-500/15 text-blue-400 border-blue-500/30";
      case "Em contato":
        return "bg-purple-500/15 text-purple-300 border-purple-500/30";
      case "Qualificação":
        return "bg-blue-600/15 text-blue-400 border-blue-600/30";
      case "Proposta":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      case "Negociação":
        return "bg-orange-500/15 text-orange-400 border-orange-500/30";
      case "Vendido":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
      default:
        return "bg-slate-500/15 text-slate-400 border-slate-500/30";
    }
  };

  return (
    <div
      onClick={() => onSelect(opportunity)}
      className={cn(
        "group relative flex cursor-pointer flex-col gap-2.5 rounded-xl border p-3 transition-all duration-150",
        isSelected
          ? "border-cyan-500/90 bg-home-surface shadow-[0_0_18px_rgba(6,182,212,0.22)] ring-1 ring-cyan-500/40"
          : "border-home-border/70 bg-home-surface/70 hover:border-home-border hover:bg-home-surface",
        className,
      )}
    >
      {/* Top row: Avatar + Name + Subtitle + Dots */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <OpportunityAvatar type={opportunity.avatarType} />
          <div className="min-w-0 flex-1">
            <h4 className="truncate text-xs font-semibold text-white group-hover:text-home-orange transition-colors">
              {opportunity.company}
            </h4>
            <p className="truncate text-[10px] text-home-muted">
              {opportunity.category}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onMoreActions?.(opportunity, e);
          }}
          className="flex size-5 shrink-0 items-center justify-center rounded text-home-muted/60 transition-colors hover:text-white"
        >
          <MoreVertical className="size-3" />
        </button>
      </div>

      {/* Middle row: Value */}
      <div>
        <span className="text-xs font-bold text-white">
          {opportunity.value}
        </span>
      </div>

      {/* Bottom row: Channel pill + Status Tag */}
      <div className="flex items-center justify-between gap-1.5 pt-0.5 border-t border-home-border/30">
        <div className="flex items-center gap-1 text-[10px] text-home-muted">
          <ChannelSmallIcon channel={opportunity.channel} />
          {opportunity.channel === "maps" ? (
            <span className="text-[10px] text-home-muted">Google Maps</span>
          ) : null}
        </div>

        <span
          className={cn(
            "rounded-md border px-2 py-0.5 text-[9px] font-semibold leading-none",
            getStatusBadgeStyle(opportunity.statusTag),
          )}
        >
          {opportunity.statusTag}
        </span>
      </div>
    </div>
  );
}
