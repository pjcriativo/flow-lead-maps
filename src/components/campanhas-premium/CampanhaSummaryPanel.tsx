import {
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  FileText,
  Globe,
  Handshake,
  Layers,
  Mail,
  MapPin,
  MessageSquare,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import {
  SiOpenai,
  SiSupabase,
  SiMeta,
  SiWhatsapp,
} from "react-icons/si";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type {
  CampanhaPremiumItem,
} from "./campanhas-premium-data";
import {
  OPERATIONAL_HEALTH,
  STAGE_DISTRIBUTION,
  UPCOMING_ACTIONS,
} from "./campanhas-premium-data";

interface CampanhaSummaryPanelProps {
  campanha: CampanhaPremiumItem;
  className?: string;
}

export function CampanhaSummaryPanel({
  campanha,
  className,
}: CampanhaSummaryPanelProps) {
  const currentStep = campanha.stepperStep || 3;

  const renderHealthIcon = (type: string) => {
    switch (type) {
      case "openai":
        return <SiOpenai className="size-4 text-emerald-400" />;
      case "supabase":
        return <SiSupabase className="size-4 text-emerald-400" />;
      case "resend":
        return (
          <div className="flex size-4 items-center justify-center rounded-sm bg-black text-[10px] font-bold text-white">
            R
          </div>
        );
      case "meta":
        return <SiMeta className="size-4 text-blue-400" />;
      case "whatsapp":
        return <SiWhatsapp className="size-4 text-green-400" />;
      default:
        return <Zap className="size-4 text-home-muted" />;
    }
  };

  const getStepIcon = (step: number) => {
    if (step < currentStep) {
      return (
        <div className="flex size-6 items-center justify-center rounded-full bg-blue-500 text-white shadow-sm">
          <Check className="size-3.5 stroke-[3]" />
        </div>
      );
    }
    if (step === currentStep) {
      return (
        <div className="flex size-6 items-center justify-center rounded-full bg-home-orange text-white font-bold text-[11px] shadow-[0_0_12px_rgba(255,98,0,0.5)]">
          {step}
        </div>
      );
    }
    return (
      <div className="flex size-6 items-center justify-center rounded-full border border-home-border bg-home-surface text-[11px] font-medium text-home-muted">
        {step}
      </div>
    );
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* CARD 1: Resumo da Campanha Selecionada */}
      <div className="rounded-2xl border border-home-border bg-home-surface/80 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.15)] space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-home-muted">
          Resumo da campanha selecionada
        </h3>

        {/* Cabeçalho do Card */}
        <div className="flex items-start gap-3">
          {/* Logo da Empresa */}
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-md">
            <span className="text-xl">🦷</span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-1">
              <div>
                <h4 className="text-sm font-bold text-white tracking-tight leading-snug">
                  {campanha.name}
                </h4>
                <p className="text-[11px] text-home-muted leading-tight mt-0.5">
                  Campanha de reativação de pacientes
                </p>
              </div>

              <div className="flex flex-col items-end gap-1">
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                  <span className="size-1.5 rounded-full bg-emerald-400" />
                  Ativa
                </span>
                <span className="rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[9px] font-semibold text-amber-400">
                  Alta prioridade
                </span>
              </div>
            </div>

            {/* Tags de Categoria */}
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-md border border-home-border bg-home-background px-2 py-0.5 text-[10px] font-medium text-home-foreground">
                <MapPin className="size-2.5 text-blue-400" />
                Google Maps
              </span>
              <span className="inline-flex items-center rounded-md border border-home-border bg-home-background px-2 py-0.5 text-[10px] font-medium text-home-foreground">
                Clínica odontológica
              </span>
            </div>
          </div>
        </div>

        {/* Stepper Horizontal de 5 Etapas */}
        <div className="border-t border-home-border/60 pt-3">
          <div className="relative flex items-center justify-between">
            {/* Linha de conexão */}
            <div className="absolute left-3 right-3 top-3 h-0.5 -translate-y-1/2 bg-home-border" />
            <div
              className="absolute left-3 top-3 h-0.5 -translate-y-1/2 bg-blue-500 transition-all duration-300"
              style={{
                width: `${Math.min(100, Math.max(0, ((currentStep - 1) / 4) * 100))}%`,
              }}
            />

            {/* Etapa 1: Leads */}
            <div className="relative z-10 flex flex-col items-center gap-1">
              {getStepIcon(1)}
              <span className="text-[10px] font-medium text-white">Leads</span>
            </div>

            {/* Etapa 2: Site */}
            <div className="relative z-10 flex flex-col items-center gap-1">
              {getStepIcon(2)}
              <span className="text-[10px] font-medium text-white">Site</span>
            </div>

            {/* Etapa 3: Proposta */}
            <div className="relative z-10 flex flex-col items-center gap-1">
              {getStepIcon(3)}
              <span className="text-[10px] font-bold text-home-orange">Proposta</span>
            </div>

            {/* Etapa 4: Aprovação */}
            <div className="relative z-10 flex flex-col items-center gap-1">
              {getStepIcon(4)}
              <span className="text-[10px] font-medium text-home-muted">Aprovação</span>
            </div>

            {/* Etapa 5: Envio */}
            <div className="relative z-10 flex flex-col items-center gap-1">
              {getStepIcon(5)}
              <span className="text-[10px] font-medium text-home-muted">Envio</span>
            </div>
          </div>
        </div>

        {/* Mini Grid 2x2 de Métricas */}
        <div className="grid grid-cols-2 gap-2 border-t border-home-border/60 pt-3">
          <div className="rounded-xl border border-home-border/70 bg-home-background/60 p-2.5">
            <div className="flex items-center gap-1.5 text-home-muted">
              <Users className="size-3.5 text-amber-400" />
              <span className="text-base font-bold text-white tabular-nums">
                {campanha.metrics?.leads || 84}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[10px]">
              <span className="text-home-muted">Leads</span>
              <span className="font-semibold text-emerald-400">
                ↑ {campanha.metrics?.leadsGrowth || "12%"}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-home-border/70 bg-home-background/60 p-2.5">
            <div className="flex items-center gap-1.5 text-home-muted">
              <MessageSquare className="size-3.5 text-purple-400" />
              <span className="text-base font-bold text-white tabular-nums">
                {campanha.metrics?.responses || 12}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[10px]">
              <span className="text-home-muted">Respostas</span>
              <span className="font-semibold text-emerald-400">
                ↑ {campanha.metrics?.responsesGrowth || "33%"}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-home-border/70 bg-home-background/60 p-2.5">
            <div className="flex items-center gap-1.5 text-home-muted">
              <Calendar className="size-3.5 text-blue-400" />
              <span className="text-base font-bold text-white tabular-nums">
                {campanha.metrics?.meetings || 4}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[10px]">
              <span className="text-home-muted">Reuniões</span>
              <span className="font-semibold text-emerald-400">
                ↑ {campanha.metrics?.meetingsGrowth || "100%"}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-home-border/70 bg-home-background/60 p-2.5">
            <div className="flex items-center gap-1.5 text-home-muted">
              <Handshake className="size-3.5 text-emerald-400" />
              <span className="text-base font-bold text-white tabular-nums">
                {campanha.metrics?.acceptedProposals || 2}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[10px]">
              <span className="text-home-muted">Propostas aceitas</span>
              <span className="font-semibold text-emerald-400">
                ↑ {campanha.metrics?.acceptedGrowth || "100%"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CARD 2: Próximas Ações */}
      <div className="rounded-2xl border border-home-border bg-home-surface/80 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.15)] space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white tracking-tight">
            Próximas ações
          </h3>
          <button
            type="button"
            onClick={() => toast.info("Lista completa de próximas ações comerciais")}
            className="flex items-center gap-1 text-[11px] font-medium text-home-muted hover:text-white transition-colors"
          >
            Ver todas <ChevronRight className="size-3" />
          </button>
        </div>

        <div className="space-y-2">
          {UPCOMING_ACTIONS.map((action) => (
            <div
              key={action.id}
              className="flex items-center justify-between gap-2 rounded-xl border border-home-border/50 bg-home-background/40 p-2.5 transition-colors hover:bg-home-surface-strong/60"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-lg text-xs",
                    action.accent === "orange" && "bg-amber-500/15 text-amber-400",
                    action.accent === "red" && "bg-rose-500/15 text-rose-400",
                    action.accent === "blue" && "bg-blue-500/15 text-blue-400",
                    action.accent === "cyan" && "bg-cyan-500/15 text-cyan-400",
                    action.accent === "green" && "bg-emerald-500/15 text-emerald-400",
                  )}
                >
                  {action.accent === "orange" && <Globe className="size-3.5" />}
                  {action.accent === "red" && <Mail className="size-3.5" />}
                  {action.accent === "blue" && <FileText className="size-3.5" />}
                  {action.accent === "cyan" && <Users className="size-3.5" />}
                  {action.accent === "green" && <Zap className="size-3.5" />}
                </div>

                <div className="min-w-0">
                  <div className="text-xs font-medium text-white truncate">
                    {action.title}
                  </div>
                  <div className="text-[10px] text-home-muted">
                    {action.time}
                  </div>
                </div>
              </div>

              <span className="shrink-0 rounded-md border border-home-border bg-home-surface px-2 py-0.5 text-[9px] font-semibold text-home-muted">
                {action.tag}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CARD 3: Saúde Operacional */}
      <div className="rounded-2xl border border-home-border bg-home-surface/80 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.15)] space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white tracking-tight">
            Saúde operacional
          </h3>
          <button
            type="button"
            onClick={() => toast.info("Painel de Integrações e Provedores")}
            className="flex items-center gap-1 text-[11px] font-medium text-home-muted hover:text-white transition-colors"
          >
            Ver integrações <ChevronRight className="size-3" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {OPERATIONAL_HEALTH.map((item) => (
            <div
              key={item.id}
              className="flex flex-col justify-between rounded-xl border border-home-border/50 bg-home-background/40 p-2.5 transition-colors hover:bg-home-surface-strong/60"
            >
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5">
                  {renderHealthIcon(item.iconType)}
                  <span className="text-xs font-semibold text-white">
                    {item.name}
                  </span>
                </div>
                <span
                  className={cn(
                    "flex items-center gap-1 text-[9px] font-semibold",
                    item.status === "Ativo" ? "text-emerald-400" : "text-amber-400",
                  )}
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      item.status === "Ativo" ? "bg-emerald-400" : "bg-amber-400",
                    )}
                  />
                  {item.status}
                </span>
              </div>
              <div className="mt-1 text-[10px] text-home-muted">
                {item.description}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CARD 4: Distribuição por Etapa */}
      <div className="rounded-2xl border border-home-border bg-home-surface/80 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.15)] space-y-3">
        <div>
          <h3 className="text-xs font-bold text-white tracking-tight">
            Distribuição por etapa
          </h3>
          <p className="text-[11px] text-home-muted">
            Total de 1.248 leads nas campanhas
          </p>
        </div>

        {/* SVG Donut Chart */}
        <div className="flex items-center gap-4 pt-1">
          <div className="relative size-20 shrink-0">
            <svg viewBox="0 0 36 36" className="size-20 -rotate-90">
              {/* Background circle */}
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className="text-home-surface-strong"
              />
              {/* Segment 1: Preparação 28% */}
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="#6366F1"
                strokeWidth="4"
                strokeDasharray="28 72"
                strokeDashoffset="0"
              />
              {/* Segment 2: Site gerado 24% */}
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="#A855F7"
                strokeWidth="4"
                strokeDasharray="24 76"
                strokeDashoffset="-28"
              />
              {/* Segment 3: Aprovado 16% */}
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="#F59E0B"
                strokeWidth="4"
                strokeDasharray="16 84"
                strokeDashoffset="-52"
              />
              {/* Segment 4: Aprovação 16% */}
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="#10B981"
                strokeWidth="4"
                strokeDasharray="16 84"
                strokeDashoffset="-68"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[11px] font-bold text-white">1.248</span>
              <span className="text-[8px] text-home-muted uppercase">leads</span>
            </div>
          </div>

          {/* Legenda com percentuais */}
          <div className="flex-1 space-y-1.5">
            {STAGE_DISTRIBUTION.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-[11px]"
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-home-muted">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">{item.percentage}%</span>
                  <span className="text-[10px] text-home-muted tabular-nums">
                    {item.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
