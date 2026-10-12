import { useState } from "react";
import {
  ChevronDown,
  Edit2,
  Facebook,
  Globe,
  Mail,
  MapPin,
  Phone,
  Plus,
  X,
} from "lucide-react";
import {
  SiInstagram,
  SiLinkedin,
  SiYoutube,
} from "react-icons/si";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { LeadScoreBadge, LeadScoreDonut } from "@/components/leads-premium/LeadScoreBadge";
import type { OpportunityItem } from "./pipeline-premium-data";
import { OpportunityAvatar } from "./OpportunityCard";

interface OpportunityDetailsPanelProps {
  opportunity: OpportunityItem | null;
  onClose: () => void;
  className?: string;
}

export function OpportunityDetailsPanel({
  opportunity,
  onClose,
  className,
}: OpportunityDetailsPanelProps) {
  const [activeTab, setActiveTab] = useState<"geral" | "atividades" | "propostas" | "historico">("geral");

  if (!opportunity) return null;

  const handleEdit = () => {
    toast.info(`Editar informações de ${opportunity.company}`);
  };

  const handleVisitSite = () => {
    const url = opportunity.website
      ? opportunity.website.startsWith("http")
        ? opportunity.website
        : `https://${opportunity.website}`
      : "https://odontoprime.com.br";
    window.open(url, "_blank");
  };

  const handleCall = () => {
    const phone = opportunity.phone || "(41) 3222-1234";
    toast.success(`Ligando para ${phone}...`);
    window.open(`tel:${phone.replace(/\D/g, "")}`, "_self");
  };

  const handleSendEmail = () => {
    const email = opportunity.email || "contato@odontoprime.com.br";
    toast.success(`Abrindo cliente de e-mail para ${email}...`);
    window.open(`mailto:${email}`, "_blank");
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
          aria-label="Fechar painel da oportunidade"
          className="absolute right-4 top-4 flex size-7 items-center justify-center rounded-lg border border-home-border/80 bg-home-surface text-home-muted transition-colors hover:bg-home-surface-strong hover:text-white"
        >
          <X className="size-4" />
        </button>

        <div className="flex items-start gap-3.5 pr-8">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-950/40 p-2 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.15)]">
            <OpportunityAvatar type={opportunity.avatarType} className="size-7" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-base font-bold text-white">
                {opportunity.company}
              </h3>
              <LeadScoreBadge score={opportunity.score || 92} size="sm" />
            </div>
            <p className="text-xs text-home-muted">{opportunity.category}</p>
          </div>
        </div>

        {/* Tags / Pills */}
        <div className="mt-3.5 flex flex-wrap gap-1.5">
          <span className="rounded-full border border-blue-500/30 bg-blue-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-blue-400">
            {opportunity.channelLabel}
          </span>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400">
            Alto potencial
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
          onClick={() => setActiveTab("atividades")}
          className={cn(
            "ml-5 pb-3 pt-3 transition-colors",
            activeTab === "atividades"
              ? "border-b-2 border-home-orange text-home-orange"
              : "text-home-muted hover:text-white",
          )}
        >
          Atividades
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("propostas")}
          className={cn(
            "ml-5 pb-3 pt-3 transition-colors",
            activeTab === "propostas"
              ? "border-b-2 border-home-orange text-home-orange"
              : "text-home-muted hover:text-white",
          )}
        >
          Propostas
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
      </div>

      {/* Tab content */}
      <div className="space-y-4 p-5 text-xs">
        {/* Block 1: Informações da empresa */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white">
              Informações da empresa
            </h4>
            <button
              type="button"
              onClick={handleEdit}
              className="inline-flex items-center gap-1 rounded-lg border border-home-border/80 bg-home-surface px-2.5 py-1 text-[11px] font-semibold text-home-muted transition-colors hover:bg-home-surface-strong hover:text-white"
            >
              <Edit2 className="size-3" /> Editar
            </button>
          </div>

          <div className="space-y-2 rounded-xl border border-home-border/60 bg-home-surface/40 p-3.5">
            <div className="grid grid-cols-[80px_1fr] gap-2">
              <span className="text-[11px] text-home-muted">Nome</span>
              <span className="font-semibold text-white">{opportunity.company}</span>
            </div>

            <div className="grid grid-cols-[80px_1fr] gap-2">
              <span className="text-[11px] text-home-muted">Categoria</span>
              <span className="text-home-foreground/90">{opportunity.category}</span>
            </div>

            <div className="grid grid-cols-[80px_1fr] gap-2">
              <span className="text-[11px] text-home-muted">Descrição</span>
              <p className="text-[11px] leading-relaxed text-home-foreground/80 line-clamp-3">
                {opportunity.description ||
                  "Clínica moderna com foco em odontologia estética, implantes e tratamentos especializados."}
              </p>
            </div>

            <div className="grid grid-cols-[80px_1fr] gap-2 items-center">
              <span className="text-[11px] text-home-muted">Site</span>
              <button
                type="button"
                onClick={handleVisitSite}
                className="flex items-center gap-1.5 text-[11px] font-medium text-home-blue hover:underline text-left"
              >
                <Globe className="size-3 shrink-0" />
                <span className="truncate">{opportunity.website || "www.odontoprime.com.br"}</span>
              </button>
            </div>

            <div className="grid grid-cols-[80px_1fr] gap-2 items-center">
              <span className="text-[11px] text-home-muted">Telefone</span>
              <button
                type="button"
                onClick={handleCall}
                className="flex items-center gap-1.5 text-[11px] font-medium text-white hover:text-home-orange text-left"
              >
                <Phone className="size-3 shrink-0 text-home-blue" />
                <span>{opportunity.phone || "(41) 3222-1234"}</span>
              </button>
            </div>

            <div className="grid grid-cols-[80px_1fr] gap-2 items-center">
              <span className="text-[11px] text-home-muted">E-mail</span>
              <button
                type="button"
                onClick={handleSendEmail}
                className="flex items-center gap-1.5 text-[11px] font-medium text-white hover:text-home-orange text-left"
              >
                <Mail className="size-3 shrink-0 text-home-blue" />
                <span className="truncate">{opportunity.email || "contato@odontoprime.com.br"}</span>
              </button>
            </div>

            <div className="grid grid-cols-[80px_1fr] gap-2 pt-1 border-t border-home-border/40">
              <span className="text-[11px] text-home-muted">Localização</span>
              <div className="flex items-start gap-1.5 text-[11px] text-home-foreground/90">
                <MapPin className="mt-0.5 size-3.5 shrink-0 text-red-500" />
                <span className="whitespace-pre-line leading-relaxed">
                  {opportunity.address || "Av. Getúlio Vargas, 1234\nCentro, Curitiba - PR"}
                </span>
              </div>
            </div>

            {/* Redes sociais */}
            <div className="grid grid-cols-[80px_1fr] gap-2 items-center pt-1 border-t border-home-border/40">
              <span className="text-[11px] text-home-muted">Redes sociais</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  title="Instagram"
                  onClick={() => window.open("https://instagram.com", "_blank")}
                  className="flex size-7 items-center justify-center rounded-lg border border-home-border bg-home-surface text-[#ec4899] transition-all hover:bg-home-surface-strong hover:scale-105"
                >
                  <SiInstagram className="size-3.5" />
                </button>
                <button
                  type="button"
                  title="Facebook"
                  onClick={() => window.open("https://facebook.com", "_blank")}
                  className="flex size-7 items-center justify-center rounded-lg border border-home-border bg-home-surface text-[#1877f2] transition-all hover:bg-home-surface-strong hover:scale-105"
                >
                  <Facebook className="size-3.5" />
                </button>
                <button
                  type="button"
                  title="LinkedIn"
                  onClick={() => window.open("https://linkedin.com", "_blank")}
                  className="flex size-7 items-center justify-center rounded-lg border border-home-border bg-home-surface text-[#0a66c2] transition-all hover:bg-home-surface-strong hover:scale-105"
                >
                  <SiLinkedin className="size-3.5" />
                </button>
                <button
                  type="button"
                  title="YouTube"
                  onClick={() => window.open("https://youtube.com", "_blank")}
                  className="flex size-7 items-center justify-center rounded-lg border border-home-border bg-home-surface text-[#ef4444] transition-all hover:bg-home-surface-strong hover:scale-105"
                >
                  <SiYoutube className="size-3.5" />
                </button>
                <button
                  type="button"
                  title="Adicionar rede"
                  onClick={() => toast.info("Adicionar nova rede social")}
                  className="flex size-7 items-center justify-center rounded-lg border border-dashed border-home-border bg-home-surface text-home-muted transition-colors hover:text-white"
                >
                  <Plus className="size-3.5" />
                </button>
              </div>
            </div>

            {/* Responsável */}
            <div className="grid grid-cols-[80px_1fr] gap-2 items-center pt-1 border-t border-home-border/40">
              <span className="text-[11px] text-home-muted">Responsável</span>
              <div className="flex items-center justify-between rounded-lg border border-home-border bg-home-surface px-2.5 py-1">
                <div className="flex items-center gap-2">
                  <Avatar className="size-5 border border-home-amber/40">
                    <AvatarImage src="" alt="Marcos Gonçalves" />
                    <AvatarFallback className="bg-amber-950 text-[9px] font-bold text-home-amber">
                      MG
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium text-white">Marcos Gonçalves</span>
                </div>
                <ChevronDown className="size-3.5 text-home-muted" />
              </div>
            </div>

            {/* Tags */}
            <div className="grid grid-cols-[80px_1fr] gap-2 items-center pt-1 border-t border-home-border/40">
              <span className="text-[11px] text-home-muted">Tags</span>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded-md border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                  Alto potencial
                </span>
                <span className="rounded-md border border-blue-500/30 bg-blue-500/15 px-2 py-0.5 text-[10px] font-semibold text-blue-400">
                  Odontologia
                </span>
                <button
                  type="button"
                  onClick={() => toast.info("Adicionar tag")}
                  className="flex size-5 items-center justify-center rounded-md border border-dashed border-home-border bg-home-surface text-home-muted hover:text-white"
                >
                  <Plus className="size-3" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Block 2: Score e classificação */}
        <section className="space-y-2 pt-1">
          <h4 className="text-xs font-bold text-white">Score e classificação</h4>
          <LeadScoreDonut
            score={opportunity.score || 92}
            label="Alto potencial"
            description="Empresa com alta relevância, boa presença digital e forte potencial de conversão."
          />
        </section>
      </div>
    </aside>
  );
}
