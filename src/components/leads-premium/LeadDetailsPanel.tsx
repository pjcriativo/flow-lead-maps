import { useState } from "react";
import {
  ExternalLink,
  Facebook,
  Globe,
  Mail,
  MapPin,
  Phone,
  X,
} from "lucide-react";
import {
  SiInstagram,
  SiLinkedin,
  SiWhatsapp,
  SiYoutube,
} from "react-icons/si";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { LeadItem } from "./leads-premium-data";
import { CompanyLogo } from "./LeadRow";
import { LeadScoreBadge, LeadScoreDonut } from "./LeadScoreBadge";

interface LeadDetailsPanelProps {
  lead: LeadItem | null;
  onClose: () => void;
  className?: string;
}

export function LeadDetailsPanel({
  lead,
  onClose,
  className,
}: LeadDetailsPanelProps) {
  const [activeTab, setActiveTab] = useState<"geral" | "contatos" | "historico" | "anotacoes">("geral");
  const [showFullDesc, setShowFullDesc] = useState(false);

  if (!lead) return null;

  const handleCall = () => {
    toast.success(`Iniciando chamada para ${lead.phone}...`);
    window.open(`tel:${lead.phone.replace(/\D/g, "")}`, "_self");
  };

  const handleSendEmail = () => {
    toast.success(`Abrindo cliente de e-mail para ${lead.email}...`);
    window.open(`mailto:${lead.email}`, "_blank");
  };

  const handleVisitSite = () => {
    const url = lead.website.startsWith("http")
      ? lead.website
      : `https://${lead.website}`;
    toast.info(`Acessando ${url}...`);
    window.open(url, "_blank");
  };

  const handleOpenMaps = () => {
    const query = encodeURIComponent(`${lead.company} ${lead.address}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
  };

  return (
    <aside
      className={cn(
        "flex flex-col rounded-2xl border border-home-border bg-home-surface/90 shadow-2xl backdrop-blur-md",
        "h-fit w-full overflow-hidden transition-all duration-200",
        className,
      )}
    >
      {/* Top Header */}
      <div className="relative border-b border-home-border/70 p-5">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar painel do lead"
          className="absolute right-4 top-4 flex size-7 items-center justify-center rounded-lg border border-home-border/80 bg-home-surface text-home-muted transition-colors hover:bg-home-surface-strong hover:text-white"
        >
          <X className="size-4" />
        </button>

        <div className="flex items-start gap-3.5 pr-8">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-950/40 p-2 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.15)]">
            <CompanyLogo type={lead.avatarType} className="size-7" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-base font-bold text-white">
                {lead.company}
              </h3>
              <LeadScoreBadge score={lead.score} size="sm" />
            </div>
            <p className="text-xs text-home-muted">{lead.category}</p>
          </div>
        </div>

        {/* Tags / Pills */}
        <div className="mt-3.5 flex flex-wrap gap-1.5">
          <span className="rounded-full border border-blue-500/30 bg-blue-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-blue-400">
            {lead.channelLabel}
          </span>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400">
            {lead.classification}
          </span>
          <span className="rounded-full border border-purple-500/30 bg-purple-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-purple-300">
            Nova oportunidade
          </span>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-home-border/70 px-5 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab("geral")}
          className={cn(
            "pb-3 pt-3 transition-colors",
            activeTab === "geral"
              ? "border-b-2 border-home-orange text-home-orange"
              : "text-home-muted hover:text-white",
          )}
        >
          Visão geral
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("contatos")}
          className={cn(
            "ml-5 pb-3 pt-3 transition-colors",
            activeTab === "contatos"
              ? "border-b-2 border-home-orange text-home-orange"
              : "text-home-muted hover:text-white",
          )}
        >
          Contatos
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("historico")}
          className={cn(
            "ml-5 pb-3 pt-3 transition-colors",
            activeTab === "historico"
              ? "border-b-2 border-home-orange text-home-orange"
              : "text-home-muted hover:text-white",
          )}
        >
          Histórico
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("anotacoes")}
          className={cn(
            "ml-5 pb-3 pt-3 transition-colors",
            activeTab === "anotacoes"
              ? "border-b-2 border-home-orange text-home-orange"
              : "text-home-muted hover:text-white",
          )}
        >
          Anotações
        </button>
      </div>

      {/* Tab content */}
      <div className="space-y-5 p-5 text-xs">
        {/* Block 1: Informações da empresa */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white">
              Informações da empresa
            </h4>
            <button
              type="button"
              onClick={handleVisitSite}
              className="inline-flex items-center gap-1 rounded-lg border border-home-border/80 bg-home-surface px-2.5 py-1 text-[11px] font-semibold text-home-muted transition-colors hover:bg-home-surface-strong hover:text-white"
            >
              <ExternalLink className="size-3" /> Acessar site
            </button>
          </div>

          <div className="space-y-2 rounded-xl border border-home-border/60 bg-home-surface/40 p-3.5">
            <div className="grid grid-cols-[80px_1fr] gap-2">
              <span className="text-[11px] text-home-muted">Nome</span>
              <span className="font-semibold text-white">{lead.company}</span>
            </div>

            <div className="grid grid-cols-[80px_1fr] gap-2">
              <span className="text-[11px] text-home-muted">Categoria</span>
              <span className="text-home-foreground/90">{lead.category}</span>
            </div>

            <div className="grid grid-cols-[80px_1fr] gap-2">
              <span className="text-[11px] text-home-muted">Descrição</span>
              <div>
                <p
                  className={cn(
                    "text-[11px] leading-relaxed text-home-foreground/80",
                    !showFullDesc && "line-clamp-2",
                  )}
                >
                  {lead.description}
                </p>
                <button
                  type="button"
                  onClick={() => setShowFullDesc(!showFullDesc)}
                  className="mt-0.5 text-[10px] font-bold text-home-orange hover:underline"
                >
                  {showFullDesc ? "Ver menos" : "Ver mais"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-[80px_1fr] gap-2 pt-1 border-t border-home-border/40">
              <span className="text-[11px] text-home-muted">Localização</span>
              <div>
                <div className="flex items-start gap-1.5 text-[11px] text-home-foreground/90">
                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-red-500" />
                  <span className="whitespace-pre-line leading-relaxed">{lead.address}</span>
                </div>
                <button
                  type="button"
                  onClick={handleOpenMaps}
                  className="mt-1 block text-[10px] font-bold text-home-orange hover:underline"
                >
                  Ver no mapa
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Block 2: Contatos e canais */}
        <section className="space-y-3">
          <h4 className="text-xs font-bold text-white">Contatos e canais</h4>

          <div className="space-y-2">
            {/* Telefone */}
            <div className="flex items-center justify-between rounded-xl border border-home-border/60 bg-home-surface/40 px-3 py-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-home-surface-strong text-home-muted">
                  <Phone className="size-3.5" />
                </div>
                <span className="truncate text-xs font-medium text-white">{lead.phone}</span>
              </div>
              <button
                type="button"
                onClick={handleCall}
                className="rounded-lg border border-home-border bg-home-surface px-3 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-home-surface-strong"
              >
                Ligar
              </button>
            </div>

            {/* Email */}
            <div className="flex items-center justify-between rounded-xl border border-home-border/60 bg-home-surface/40 px-3 py-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-home-surface-strong text-home-muted">
                  <Mail className="size-3.5" />
                </div>
                <span className="truncate text-xs font-medium text-white">{lead.email}</span>
              </div>
              <button
                type="button"
                onClick={handleSendEmail}
                className="rounded-lg border border-home-border bg-home-surface px-3 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-home-surface-strong"
              >
                Enviar
              </button>
            </div>

            {/* Website */}
            <div className="flex items-center justify-between rounded-xl border border-home-border/60 bg-home-surface/40 px-3 py-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-home-surface-strong text-home-muted">
                  <Globe className="size-3.5" />
                </div>
                <span className="truncate text-xs font-medium text-white">{lead.website}</span>
              </div>
              <button
                type="button"
                onClick={handleVisitSite}
                className="rounded-lg border border-home-border bg-home-surface px-3 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-home-surface-strong"
              >
                Acessar
              </button>
            </div>
          </div>

          {/* Social icons row */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              title="Instagram"
              onClick={() => window.open("https://instagram.com", "_blank")}
              className="flex size-8.5 items-center justify-center rounded-xl border border-home-border bg-home-surface text-[#ec4899] transition-all hover:bg-home-surface-strong hover:scale-105"
            >
              <SiInstagram className="size-4" />
            </button>
            <button
              type="button"
              title="Facebook"
              onClick={() => window.open("https://facebook.com", "_blank")}
              className="flex size-8.5 items-center justify-center rounded-xl border border-home-border bg-home-surface text-[#1877f2] transition-all hover:bg-home-surface-strong hover:scale-105"
            >
              <Facebook className="size-4" />
            </button>
            <button
              type="button"
              title="LinkedIn"
              onClick={() => window.open("https://linkedin.com", "_blank")}
              className="flex size-8.5 items-center justify-center rounded-xl border border-home-border bg-home-surface text-[#0a66c2] transition-all hover:bg-home-surface-strong hover:scale-105"
            >
              <SiLinkedin className="size-4" />
            </button>
            <button
              type="button"
              title="YouTube"
              onClick={() => window.open("https://youtube.com", "_blank")}
              className="flex size-8.5 items-center justify-center rounded-xl border border-home-border bg-home-surface text-[#ef4444] transition-all hover:bg-home-surface-strong hover:scale-105"
            >
              <SiYoutube className="size-4" />
            </button>
            <button
              type="button"
              title="WhatsApp"
              onClick={() => window.open(`https://wa.me/55${lead.phone.replace(/\D/g, "")}`, "_blank")}
              className="flex size-8.5 items-center justify-center rounded-xl border border-home-border bg-home-surface text-[#22c55e] transition-all hover:bg-home-surface-strong hover:scale-105"
            >
              <SiWhatsapp className="size-4" />
            </button>
          </div>
        </section>

        {/* Block 3: Score e classificação */}
        <section className="space-y-2 pt-1">
          <h4 className="text-xs font-bold text-white">Score e classificação</h4>
          <LeadScoreDonut
            score={lead.score}
            label={lead.classification}
            description={
              lead.score >= 80
                ? "Empresa com alta relevância, boa presença digital e forte potencial de conversão."
                : lead.score >= 70
                  ? "Empresa em maturação com oportunidades claras de otimização de conversão."
                  : "Empresa em estágio inicial de qualificação comercial."
            }
          />
        </section>
      </div>
    </aside>
  );
}
