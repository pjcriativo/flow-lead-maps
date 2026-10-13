import type { MouseEvent } from "react";
import {
  Building2,
  Car,
  Code,
  Compass,
  Dumbbell,
  HeartPulse,
  Mail,
  MoreVertical,
  Phone,
  Scale,
  Scissors,
  Sparkles,
  UtensilsCrossed,
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
import type { LeadChannel, LeadItem } from "./leads-premium-data";
import { LeadScoreBadge } from "./LeadScoreBadge";
import { LeadStatusBadge } from "./LeadStatusBadge";

interface LeadRowProps {
  lead: LeadItem;
  isSelected: boolean;
  isChecked: boolean;
  onToggleCheck: (id: string, e: MouseEvent) => void;
  onSelectLead: (lead: LeadItem) => void;
  onQuickAction?: (
    action: "phone" | "whatsapp" | "email" | "more",
    lead: LeadItem,
    e: MouseEvent,
  ) => void;
}

export function CompanyLogo({
  type,
  className,
}: {
  type: LeadItem["avatarType"];
  className?: string;
}) {
  const baseClasses =
    "flex size-7.5 shrink-0 items-center justify-center rounded-full border border-home-border/80 bg-home-surface-strong text-white";

  switch (type) {
    case "tooth":
      return (
        <div
          className={cn(baseClasses, "border-cyan-500/30 bg-cyan-950/40 text-cyan-400", className)}
        >
          <svg
            className="size-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 2C8 2 6 4 6 7c0 3 1.5 5 2 9 .5 3 2 6 4 6s3.5-3 4-6c.5-4 2-6 2-9 0-3-2-5-6-5z" />
            <path d="M9 12c1.5 1.5 4.5 1.5 6 0" />
          </svg>
        </div>
      );
    case "restaurant":
      return (
        <div
          className={cn(
            baseClasses,
            "border-amber-500/30 bg-amber-950/40 text-amber-400",
            className,
          )}
        >
          <UtensilsCrossed className="size-3.5" />
        </div>
      );
    case "fitness":
      return (
        <div
          className={cn(baseClasses, "border-blue-500/30 bg-blue-950/40 text-blue-400", className)}
        >
          <Dumbbell className="size-3.5" />
        </div>
      );
    case "leaf":
      return (
        <div
          className={cn(
            baseClasses,
            "border-emerald-500/30 bg-emerald-950/40 text-emerald-400",
            className,
          )}
        >
          <HeartPulse className="size-3.5" />
        </div>
      );
    case "legal":
      return (
        <div
          className={cn(baseClasses, "border-slate-400/30 bg-slate-800 text-slate-200", className)}
        >
          <Scale className="size-3.5" />
        </div>
      );
    case "architecture":
      return (
        <div
          className={cn(
            baseClasses,
            "border-orange-500/30 bg-orange-950/40 text-orange-400",
            className,
          )}
        >
          <Compass className="size-3.5" />
        </div>
      );
    case "tech":
      return (
        <div
          className={cn(baseClasses, "border-cyan-500/30 bg-cyan-950/40 text-cyan-400", className)}
        >
          <Code className="size-3.5" />
        </div>
      );
    case "beauty":
      return (
        <div
          className={cn(baseClasses, "border-pink-500/30 bg-pink-950/40 text-pink-400", className)}
        >
          <Sparkles className="size-3.5" />
        </div>
      );
    case "auto":
      return (
        <div
          className={cn(baseClasses, "border-blue-400/30 bg-slate-900 text-blue-400", className)}
        >
          <Car className="size-3.5" />
        </div>
      );
    case "hair":
      return (
        <div
          className={cn(baseClasses, "border-rose-500/30 bg-rose-950/40 text-rose-400", className)}
        >
          <Scissors className="size-3.5" />
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

export function ChannelBadgeIcon({
  channel,
  className,
}: {
  channel: LeadChannel;
  className?: string;
}) {
  switch (channel) {
    case "maps":
      return (
        <span
          title="Google Maps"
          className={cn("inline-flex items-center text-red-500", className)}
        >
          <SiGooglemaps className="size-4" />
        </span>
      );
    case "instagram":
      return (
        <span
          title="Instagram"
          className={cn("inline-flex items-center text-[#ec4899]", className)}
        >
          <SiInstagram className="size-4" />
        </span>
      );
    case "linkedin":
      return (
        <span title="LinkedIn" className={cn("inline-flex items-center text-[#0a66c2]", className)}>
          <SiLinkedin className="size-4" />
        </span>
      );
    case "youtube":
      return (
        <span title="YouTube" className={cn("inline-flex items-center text-[#ef4444]", className)}>
          <SiYoutube className="size-4" />
        </span>
      );
    case "tiktok":
      return (
        <span title="TikTok" className={cn("inline-flex items-center text-white", className)}>
          <SiTiktok className="size-4" />
        </span>
      );
    case "whatsapp":
      return (
        <span title="WhatsApp" className={cn("inline-flex items-center text-[#22c55e]", className)}>
          <SiWhatsapp className="size-4" />
        </span>
      );
    case "manual":
      return (
        <span
          title="Cadastro manual"
          className={cn("inline-flex items-center text-home-muted", className)}
        >
          <Building2 className="size-4" />
        </span>
      );
  }
}

export function LeadRow({
  lead,
  isSelected,
  isChecked,
  onToggleCheck,
  onSelectLead,
  onQuickAction,
}: LeadRowProps) {
  return (
    <tr
      onClick={() => onSelectLead(lead)}
      className={cn(
        "group cursor-pointer border-b border-home-border/60 transition-colors duration-150",
        isSelected
          ? "bg-home-surface-strong/90 shadow-[inset_2px_0_0_0_var(--home-orange)]"
          : "hover:bg-home-surface/60",
      )}
    >
      {/* Checkbox */}
      <td
        className="w-10 px-3 py-3 text-center"
        onClick={(e) => {
          e.stopPropagation();
          onToggleCheck(lead.id, e);
        }}
      >
        <input
          type="checkbox"
          checked={isChecked}
          onChange={() => {}}
          aria-label={`Selecionar ${lead.company}`}
          className="size-3.5 rounded border-home-border bg-home-surface text-home-orange focus:ring-1 focus:ring-home-orange"
        />
      </td>

      {/* Empresa / Contato */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-2.5">
          <CompanyLogo type={lead.avatarType} />
          <div className="min-w-0">
            <span className="block truncate text-xs font-semibold text-white group-hover:text-home-orange transition-colors">
              {lead.company}
            </span>
            <span className="block truncate text-[11px] text-home-muted">
              {lead.contactName || "Contato não informado"}
            </span>
          </div>
        </div>
      </td>

      {/* Contatos */}
      <td className="px-3 py-3">
        <div className="min-w-0 space-y-0.5">
          <div className="flex items-center gap-1.5 text-[11px] text-home-foreground/90">
            <Phone className="size-3 shrink-0 text-home-blue" />
            <span className="truncate">{lead.phone || lead.whatsapp || "—"}</span>
          </div>
          <div className="truncate text-[10px] text-home-muted">
            {lead.email || "E-mail não informado"}
          </div>
        </div>
      </td>

      {/* Canal */}
      <td className="px-3 py-3 text-center">
        <ChannelBadgeIcon channel={lead.channel} />
      </td>

      {/* Localização */}
      <td className="px-3 py-3 whitespace-nowrap text-xs text-home-foreground/80">
        {[lead.city, lead.state].filter(Boolean).join(", ") || "—"}
      </td>

      {/* Score */}
      <td className="px-3 py-3 text-center">
        <LeadScoreBadge score={lead.score} size="md" />
      </td>

      {/* Status */}
      <td className="px-3 py-3 text-center">
        <LeadStatusBadge status={lead.status} />
      </td>

      {/* Data e hora */}
      <td className="px-3 py-3 whitespace-nowrap text-[11px] text-home-muted leading-tight">
        <div>{lead.date}</div>
        <div className="text-[10px] text-home-muted/70">{lead.time}</div>
      </td>

      {/* Ações */}
      <td className="px-3 py-3 text-right" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            title="Ligar"
            onClick={(e) => onQuickAction?.("phone", lead, e)}
            disabled={!lead.phone}
            className="flex size-7 items-center justify-center rounded-lg text-home-muted transition-colors hover:bg-home-surface hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
          >
            <Phone className="size-3.5" />
          </button>
          <button
            type="button"
            title="WhatsApp"
            onClick={(e) => onQuickAction?.("whatsapp", lead, e)}
            disabled={!lead.whatsapp && !lead.phone}
            className="flex size-7 items-center justify-center rounded-lg text-home-muted transition-colors hover:bg-home-surface hover:text-[#22c55e] disabled:cursor-not-allowed disabled:opacity-35"
          >
            <SiWhatsapp className="size-3.5" />
          </button>
          <button
            type="button"
            title="E-mail"
            onClick={(e) => onQuickAction?.("email", lead, e)}
            disabled={!lead.email}
            className="flex size-7 items-center justify-center rounded-lg text-home-muted transition-colors hover:bg-home-surface hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
          >
            <Mail className="size-3.5" />
          </button>
          <button
            type="button"
            title="Mais opções"
            onClick={(e) => onQuickAction?.("more", lead, e)}
            className="flex size-7 items-center justify-center rounded-lg text-home-muted transition-colors hover:bg-home-surface hover:text-white"
          >
            <MoreVertical className="size-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}
