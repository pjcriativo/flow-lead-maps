// Peças de UI compartilhadas da Fase 1 (busca, pipeline, gestão de leads).
import { Crown, Star, Globe, MessageCircle, Mail, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Lead, ScoreBreakdown } from "@/lib/leads-api";
import { STATUS_LABELS } from "@/lib/leads-api";

export const UF_LIST = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

export const QTD_OPTIONS = ["20", "30", "50", "70", "100", "200", "300", "500"];

export const NICHE_TAGS = [
  "Clínica Odontológica", "Agência de Marketing", "Advocacia", "Restaurante",
  "Academia", "Salão de Beleza", "Oficina Mecânica", "Contador",
  "Corretor de Imóveis", "Pet Shop", "Clínica de Estética", "Fotógrafo",
];

export function getBreakdown(lead: Lead): ScoreBreakdown | null {
  const bd = lead.score_breakdown as unknown;
  if (bd && typeof bd === "object" && "score" in (bd as object)) {
    return bd as ScoreBreakdown;
  }
  return null;
}

export function scoreColor(score: number): string {
  if (score >= 85) return "bg-amber-100 text-amber-800 ring-amber-300";
  if (score >= 65) return "bg-green-100 text-green-800 ring-green-300";
  if (score >= 40) return "bg-blue-50 text-blue-700 ring-blue-200";
  return "bg-secondary text-muted-foreground ring-border";
}

export function ScoreBadge({ lead }: { lead: Lead }) {
  const bd = getBreakdown(lead);
  const gold = bd?.is_gold;
  const reasons = bd?.bad_site_reasons ?? [];
  const title = [
    `Score ${lead.score}/100`,
    gold ? "★ Cliente-ouro" : "",
    reasons.length ? "Site ruim: " + reasons.join("; ") : "",
    ...(bd?.notes ?? []),
  ]
    .filter(Boolean)
    .join("\n");
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums ring-1 ring-inset",
        scoreColor(lead.score),
      )}
    >
      {gold && <Crown className="h-3.5 w-3.5 fill-amber-500 text-amber-600" />}
      {lead.score}
    </span>
  );
}

const STATUS_STYLE: Record<string, string> = {
  new: "bg-secondary text-muted-foreground",
  enriched: "bg-blue-50 text-blue-700",
  contacted: "bg-indigo-50 text-indigo-700",
  responded: "bg-violet-50 text-violet-700",
  meeting: "bg-amber-50 text-amber-700",
  won: "bg-green-100 text-green-800",
  lost: "bg-red-50 text-red-700",
  nurture: "bg-slate-100 text-slate-600",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        STATUS_STYLE[status] ?? "bg-secondary text-muted-foreground",
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function RatingCell({ lead }: { lead: Lead }) {
  if (!lead.rating) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="inline-flex items-center gap-1 tabular-nums">
      <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
      {lead.rating}
      {lead.review_count ? (
        <span className="text-xs text-muted-foreground">({lead.review_count})</span>
      ) : null}
    </span>
  );
}

export function siteHref(website?: string | null) {
  if (!website) return "#";
  return /^https?:\/\//i.test(website) ? website : `https://${website}`;
}

export function SiteCell({ lead }: { lead: Lead }) {
  if (!lead.website) return <span className="text-muted-foreground">—</span>;
  const bd = getBreakdown(lead);
  const bad = bd?.bad_site;
  return (
    <a
      href={siteHref(lead.website)}
      target="_blank"
      rel="noopener noreferrer"
      title={bad ? "Site ruim: " + (bd?.bad_site_reasons ?? []).join("; ") : "Visitar site"}
      className={cn(
        "inline-flex items-center gap-1 hover:underline",
        bad ? "text-amber-700" : "text-primary",
      )}
    >
      <Globe className="h-3.5 w-3.5" />
      {bad ? "Site ruim" : "Visitar"}
    </a>
  );
}

export function EmailCell({ lead }: { lead: Lead }) {
  if (!lead.email) return <span className="text-muted-foreground">—</span>;
  return (
    <a
      href={`mailto:${lead.email}`}
      className="inline-flex items-center gap-1 text-[#16A34A] hover:underline"
    >
      <Mail className="h-3.5 w-3.5" />
      {lead.email}
    </a>
  );
}

export function waLink(whatsapp?: string | null) {
  return whatsapp ? `https://wa.me/${whatsapp}` : "#";
}

export function WhatsCell({ lead }: { lead: Lead }) {
  if (!lead.whatsapp) return <span className="text-muted-foreground">—</span>;
  return (
    <a
      href={waLink(lead.whatsapp)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-[#16A34A] hover:underline"
    >
      <MessageCircle className="h-3.5 w-3.5" />
      WhatsApp
    </a>
  );
}

export function MapsButton({ lead }: { lead: Lead }) {
  const href =
    lead.place_id
      ? `https://www.google.com/maps/place/?q=place_id:${lead.place_id}`
      : `https://www.google.com/maps/search/${encodeURIComponent(
          `${lead.business_name} ${lead.city ?? ""}`,
        )}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
    >
      <ExternalLink className="h-3.5 w-3.5" /> Maps
    </a>
  );
}
