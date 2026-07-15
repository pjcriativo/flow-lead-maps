// Peças de UI compartilhadas da Fase 1 (busca, pipeline, gestão de leads).
import {
  Star,
  Globe,
  MessageCircle,
  Mail,
  ExternalLink,
  Info,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Paginação clássica (Anterior/Próxima + "N leads · pág X de Y"). */
export const PAGE_SIZE = 20;

export function Paginacao({
  total,
  page,
  onPage,
  pageSize = PAGE_SIZE,
  unidade = "leads",
}: {
  total: number;
  page: number;
  onPage: (p: number) => void;
  pageSize?: number;
  unidade?: string;
}) {
  const paginas = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm">
      <span className="text-muted-foreground">
        {total} {unidade} · pág {Math.min(page, paginas)} de {paginas}
      </span>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          <ChevronLeft className="h-4 w-4" /> Anterior
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={page >= paginas}
          onClick={() => onPage(page + 1)}
        >
          Próxima <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/** Fatia um array já ordenado para a página atual. */
export function paginar<T>(itens: T[], page: number, pageSize = PAGE_SIZE): T[] {
  const start = (page - 1) * pageSize;
  return itens.slice(start, start + pageSize);
}
import type { Lead, ScoreBreakdown } from "@/lib/leads-api";
import { STATUS_LABELS } from "@/lib/leads-api";

export const UF_LIST = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];

export const QTD_OPTIONS = ["20", "30", "50", "70", "100", "200", "300", "500"];

export const NICHE_TAGS = [
  "Clínica Odontológica",
  "Agência de Marketing",
  "Advocacia",
  "Restaurante",
  "Academia",
  "Salão de Beleza",
  "Oficina Mecânica",
  "Contador",
  "Corretor de Imóveis",
  "Pet Shop",
  "Clínica de Estética",
  "Fotógrafo",
];

export function getBreakdown(lead: Lead): ScoreBreakdown | null {
  const bd = lead.score_breakdown as unknown;
  if (bd && typeof bd === "object" && "score" in (bd as object)) {
    return bd as ScoreBreakdown;
  }
  return null;
}

// Faixas de OPORTUNIDADE: alta=verde, média=amber, baixa=cinza.
export function scoreColor(score: number): string {
  if (score >= 80) return "bg-green-100 text-green-800 ring-green-300";
  if (score >= 50) return "bg-amber-100 text-amber-800 ring-amber-300";
  return "bg-secondary text-muted-foreground ring-border";
}

export function faixaLabel(score: number): string {
  if (score >= 80) return "Alta oportunidade";
  if (score >= 50) return "Média oportunidade";
  return "Baixa oportunidade";
}

function Sinal({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      {ok ? (
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#16A34A]" />
      ) : (
        <XCircle className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
      )}
      <span className={ok ? "text-foreground" : "text-muted-foreground"}>{label}</span>
    </div>
  );
}

export function ScoreBreakdownCard({ lead, bd }: { lead: Lead; bd: ScoreBreakdown | null }) {
  // Shape MODERNO (score.ts) tem as flags booleanas; o legado (leads antigos) não —
  // sem esta guarda, os Sinais renderizariam undefined como "false" e mentiriam.
  const moderno = !!bd && typeof bd.has_website === "boolean";
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="text-lg font-bold tabular-nums">
          {lead.score}
          <span className="text-xs font-normal text-muted-foreground">/100</span>
        </span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset",
            scoreColor(lead.score),
          )}
        >
          {faixaLabel(lead.score)}
        </span>
      </div>
      {bd?.motivo && <p className="text-xs text-muted-foreground">{bd.motivo}</p>}
      {moderno && (
        <div className="space-y-1 border-t border-border pt-2 text-xs">
          <Sinal ok={!bd!.has_website} label="Sem site próprio" />
          {bd!.has_website && <Sinal ok={bd!.bad_site} label="Site fraco/datado" />}
          <Sinal ok={bd!.has_whatsapp} label="WhatsApp p/ abordagem" />
          <Sinal ok={bd!.has_instagram} label="Tem Instagram" />
          <Sinal ok={bd!.has_email} label="E-mail público" />
        </div>
      )}
      <p className="border-t border-border pt-2 text-[11px] leading-snug text-muted-foreground">
        Quanto <b className="text-foreground">maior</b>, mais fácil de vender — presença digital
        fraca.
      </p>
    </div>
  );
}

export function ScoreBadge({ lead }: { lead: Lead }) {
  const bd = getBreakdown(lead);
  return (
    <HoverCard openDelay={120} closeDelay={60}>
      <HoverCardTrigger asChild>
        <span
          className={cn(
            "inline-flex cursor-help items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums ring-1 ring-inset",
            scoreColor(lead.score),
          )}
        >
          {lead.score}
        </span>
      </HoverCardTrigger>
      <HoverCardContent align="start" className="w-72">
        <ScoreBreakdownCard lead={lead} bd={bd} />
      </HoverCardContent>
    </HoverCard>
  );
}

// Legenda fixa (ícone de info) explicando a régua do score.
export function ScoreLegend() {
  return (
    <HoverCard openDelay={100} closeDelay={60}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          className="ml-1 inline-flex items-center align-middle text-muted-foreground hover:text-foreground"
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </HoverCardTrigger>
      <HoverCardContent align="start" className="w-80">
        <p className="text-sm font-semibold">Score de Oportunidade</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Quanto <b className="text-foreground">MAIOR</b>, mais fácil de vender — o negócio tem
          presença digital fraca (sem site ou site ruim). Score{" "}
          <b className="text-foreground">BAIXO</b> = já tem site bom, menos oportunidade.
        </p>
        <div className="mt-2 space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-green-500" /> 80–100 · Alta oportunidade
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> 50–79 · Média
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-gray-400" /> 0–49 · Baixa (já tem presença)
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
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
    // min-w-0 + truncate: sem isso o <a> é um item de flex que se recusa a encolher abaixo
    // do conteúdo (min-width:auto) e o e-mail longo VAZA pra fora do card no Kanban.
    // O ícone leva shrink-0 pra não ser espremido no lugar do texto.
    <a
      href={`mailto:${lead.email}`}
      title={lead.email}
      className="inline-flex min-w-0 items-center gap-1 text-[#16A34A] hover:underline"
    >
      <Mail className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{lead.email}</span>
    </a>
  );
}

export function waLink(whatsapp?: string | null) {
  return whatsapp ? `https://wa.me/${whatsapp}` : "#";
}

export function WhatsCell({ lead }: { lead: Lead }) {
  if (!lead.whatsapp) return <span className="text-muted-foreground">—</span>;
  return (
    // shrink-0: rótulo fixo e curto — quem cede espaço é o e-mail, não este.
    <a
      href={waLink(lead.whatsapp)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex shrink-0 items-center gap-1 text-[#16A34A] hover:underline"
    >
      <MessageCircle className="h-3.5 w-3.5 shrink-0" />
      WhatsApp
    </a>
  );
}

export function MapsButton({ lead }: { lead: Lead }) {
  const href = lead.place_id
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
