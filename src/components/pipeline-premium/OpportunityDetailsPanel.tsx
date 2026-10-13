import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  CalendarClock,
  Edit2,
  ExternalLink,
  FileText,
  Globe,
  History,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Save,
  UserRound,
  X,
  XCircle,
} from "lucide-react";
import { SiInstagram, SiLinkedin } from "react-icons/si";
import { carregarDetalheLead } from "@/services/lead-detalhe";
import { listarPropostasPorLead } from "@/services/propostas";
import type { Membro } from "@/services/membros";
import { LEAD_STATUSES, STATUS_LABELS, type LeadStatus } from "@/lib/leads-api";
import { classifyLeadScore } from "@/components/leads-premium/leads-premium-data";
import { LeadScoreBadge, LeadScoreDonut } from "@/components/leads-premium/LeadScoreBadge";
import { cn } from "@/lib/utils";
import { formatCurrency, type OpportunityItem } from "./pipeline-premium-data";
import { pipelineKeys } from "./usePipelinePremium";
import { OpportunityAvatar } from "./OpportunityCard";

interface OpportunityDetailsPanelProps {
  opportunity: OpportunityItem | null;
  members: Membro[];
  supportingDataUnavailable: boolean;
  saving: boolean;
  onClose: () => void;
  onEdit: () => void;
  onStatusChange: (status: LeadStatus) => Promise<boolean>;
  onResponsibleChange: (userId: string) => Promise<boolean>;
  onRequestLoss: (status: "lost" | "nurture") => void;
  onOpenLead?: (leadId: string) => void;
  className?: string;
}

type DetailTab = "geral" | "atividades" | "propostas" | "historico";

export function OpportunityDetailsPanel({
  opportunity,
  members,
  supportingDataUnavailable,
  saving,
  onClose,
  onEdit,
  onStatusChange,
  onResponsibleChange,
  onRequestLoss,
  onOpenLead,
  className,
}: OpportunityDetailsPanelProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>("geral");
  const detailsQuery = useQuery({
    queryKey: pipelineKeys.detail(opportunity?.id),
    queryFn: async () => {
      if (!opportunity) throw new Error("Lead não selecionado.");
      const [details, proposals] = await Promise.all([
        carregarDetalheLead(opportunity.id),
        listarPropostasPorLead(opportunity.id),
      ]);
      return { details, proposals };
    },
    enabled: Boolean(opportunity?.id),
    staleTime: 30_000,
  });

  if (!opportunity) return null;

  const openWebsite = () => {
    if (!opportunity.website) return;
    const url = opportunity.website.startsWith("http")
      ? opportunity.website
      : `https://${opportunity.website}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };
  const openWhatsApp = () => {
    const digits = (opportunity.whatsapp || opportunity.phone).replace(/\D/g, "");
    if (!digits) return;
    const number = digits.startsWith("55") ? digits : `55${digits}`;
    window.open(`https://wa.me/${number}`, "_blank", "noopener,noreferrer");
  };
  const changeStatus = async (status: string) => {
    if (status === "lost" || status === "nurture") {
      onRequestLoss(status);
      return;
    }
    await onStatusChange(parseSelectableStatus(status));
  };

  const detailData = detailsQuery.data;
  const classification = classifyLeadScore(opportunity.score);

  return (
    <aside
      className={cn(
        "flex h-fit w-full flex-col overflow-hidden rounded-2xl border border-home-border bg-home-surface/90 shadow-2xl backdrop-blur-md",
        className,
      )}
    >
      <div className="relative border-b border-home-border/70 p-5">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar painel da oportunidade"
          className="absolute right-4 top-4 flex size-7 items-center justify-center rounded-lg border border-home-border/80 bg-home-surface text-home-muted hover:bg-home-surface-strong hover:text-white"
        >
          <X className="size-4" />
        </button>
        <div className="flex items-start gap-3.5 pr-8">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-950/40 p-2 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.15)]">
            <OpportunityAvatar type={opportunity.avatarType} className="size-7" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-base font-bold text-white">{opportunity.company}</h3>
              <LeadScoreBadge score={opportunity.score} size="sm" />
            </div>
            <p className="text-xs text-home-muted">{opportunity.category}</p>
          </div>
        </div>
        <div className="mt-3.5 flex flex-wrap gap-1.5">
          <Pill tone="blue">{opportunity.channelLabel}</Pill>
          <Pill tone="green">{classification}</Pill>
          <Pill tone="purple">{opportunity.statusTag}</Pill>
        </div>
      </div>

      <div className="flex overflow-x-auto border-b border-home-border/70 px-5 text-xs font-semibold">
        {(
          [
            ["geral", "Visão geral"],
            ["atividades", "Atividades"],
            ["propostas", "Propostas"],
            ["historico", "Histórico"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={cn(
              "whitespace-nowrap pb-3 pt-3",
              id !== "geral" && "ml-5",
              activeTab === id
                ? "border-b-2 border-home-orange text-home-orange"
                : "text-home-muted hover:text-white",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-4 p-5 text-xs">
        {activeTab === "geral" ? (
          <>
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-bold text-white">Informações da empresa</h4>
                <div className="flex gap-1.5">
                  {onOpenLead ? (
                    <button
                      type="button"
                      onClick={() => onOpenLead(opportunity.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-home-border px-2.5 py-1 text-[11px] font-semibold text-home-muted hover:bg-home-surface-strong hover:text-white"
                    >
                      <ExternalLink className="size-3" /> Central
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={onEdit}
                    className="inline-flex items-center gap-1 rounded-lg border border-home-border px-2.5 py-1 text-[11px] font-semibold text-home-muted hover:bg-home-surface-strong hover:text-white"
                  >
                    <Edit2 className="size-3" /> Editar
                  </button>
                </div>
              </div>
              <div className="space-y-2 rounded-xl border border-home-border/60 bg-home-surface/40 p-3.5">
                <InfoRow label="Empresa" value={opportunity.company} />
                <InfoRow label="Contato" value={opportunity.contactName || "Não informado"} />
                <InfoRow label="Categoria" value={opportunity.category} />
                <InfoRow label="Valor" value={opportunity.value} />
                <InfoRow label="Observações" value={opportunity.description || "Sem observações"} />
                <InfoRow
                  label="Localização"
                  value={opportunity.address || "Não informada"}
                  icon={<MapPin className="size-3.5 text-red-500" />}
                />
                <ActionRow
                  label="Site"
                  value={opportunity.website || "Não informado"}
                  disabled={!opportunity.website}
                  onClick={openWebsite}
                  icon={<Globe className="size-3.5" />}
                />
                <ActionRow
                  label="Telefone"
                  value={opportunity.phone || "Não informado"}
                  disabled={!opportunity.phone}
                  onClick={() => {
                    if (opportunity.phone)
                      window.location.href = `tel:${opportunity.phone.replace(/\D/g, "")}`;
                  }}
                  icon={<Phone className="size-3.5" />}
                />
                <ActionRow
                  label="E-mail"
                  value={opportunity.email || "Não informado"}
                  disabled={!opportunity.email}
                  onClick={() => {
                    if (opportunity.email) window.location.href = `mailto:${opportunity.email}`;
                  }}
                  icon={<Mail className="size-3.5" />}
                />
                <div className="flex items-center gap-2 border-t border-home-border/40 pt-2">
                  <SocialLink
                    label="Instagram"
                    href={opportunity.instagramUrl}
                    icon={<SiInstagram className="size-3.5" />}
                  />
                  <SocialLink
                    label="LinkedIn"
                    href={opportunity.linkedinUrl}
                    icon={<SiLinkedin className="size-3.5" />}
                  />
                  <button
                    type="button"
                    onClick={openWhatsApp}
                    disabled={!opportunity.whatsapp && !opportunity.phone}
                    className="flex size-7 items-center justify-center rounded-lg border border-home-border text-emerald-400 hover:bg-home-surface-strong disabled:cursor-not-allowed disabled:opacity-30"
                    title="Abrir WhatsApp"
                  >
                    <MessageCircle className="size-3.5" />
                  </button>
                </div>
              </div>
            </section>

            <section className="space-y-2">
              <h4 className="text-xs font-bold text-white">Gestão comercial</h4>
              <label className="space-y-1 text-[10px] text-home-muted">
                Etapa/status
                <select
                  value={opportunity.statusValue}
                  onChange={(event) => void changeStatus(event.target.value)}
                  disabled={saving}
                  className="h-9.5 w-full rounded-xl border border-home-border bg-home-surface px-3 text-xs text-white outline-none focus:border-home-orange disabled:opacity-50"
                >
                  {LEAD_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-[10px] text-home-muted">
                Responsável
                <select
                  value={opportunity.assignedTo ?? "none"}
                  onChange={(event) => void onResponsibleChange(event.target.value)}
                  disabled={saving || supportingDataUnavailable}
                  className="h-9.5 w-full rounded-xl border border-home-border bg-home-surface px-3 text-xs text-white outline-none focus:border-home-orange disabled:opacity-50"
                >
                  <option value="none">Sem responsável</option>
                  {members.map((member) => (
                    <option key={member.user_id} value={member.user_id}>
                      {member.nome || member.email}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => void onStatusChange("won")}
                  disabled={saving || opportunity.statusValue === "won"}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-emerald-600 px-3 text-[11px] font-bold text-white disabled:opacity-40"
                >
                  <Save className="size-3.5" /> Registrar conversão
                </button>
                <button
                  type="button"
                  onClick={() => onRequestLoss("lost")}
                  disabled={saving}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 text-[11px] font-bold text-red-300 disabled:opacity-40"
                >
                  <XCircle className="size-3.5" /> Registrar perda
                </button>
              </div>
            </section>

            <section className="space-y-2 pt-1">
              <h4 className="text-xs font-bold text-white">Score e classificação</h4>
              <LeadScoreDonut
                score={opportunity.score}
                label={classification}
                description={
                  opportunity.record.score_breakdown
                    ? "Score persistido com detalhamento disponível."
                    : "Score persistido sem detalhamento para este registro."
                }
              />
            </section>
          </>
        ) : null}

        {activeTab !== "geral" && detailsQuery.isLoading ? (
          <StateMessage
            icon={<Loader2 className="size-4 animate-spin" />}
            text="Carregando dados comerciais..."
          />
        ) : null}
        {activeTab !== "geral" && detailsQuery.error ? (
          <StateMessage
            icon={<XCircle className="size-4" />}
            text={
              detailsQuery.error instanceof Error
                ? detailsQuery.error.message
                : "Falha ao carregar detalhes."
            }
          />
        ) : null}

        {activeTab === "atividades" && detailData ? (
          detailData.details.contatos.length ? (
            detailData.details.contatos.map((contact) => (
              <EventRow
                key={contact.id}
                title={`Contato por ${contact.canal}`}
                detail={contact.anotacao}
                date={contact.contatado_em}
                icon={<MessageCircle className="size-3.5" />}
              />
            ))
          ) : (
            <StateMessage
              icon={<CalendarClock className="size-4" />}
              text="Nenhuma atividade compatível registrada para este lead."
            />
          )
        ) : null}

        {activeTab === "propostas" && detailData ? (
          detailData.proposals.length ? (
            detailData.proposals.map((proposal) => (
              <details
                key={proposal.id}
                className="rounded-xl border border-home-border/60 bg-home-surface/40 p-3"
              >
                <summary className="cursor-pointer list-none font-semibold text-white">
                  <span className="inline-flex items-center gap-2">
                    <FileText className="size-3.5 text-home-orange" />
                    {proposal.assunto}
                  </span>
                  <span className="ml-2 text-[10px] font-normal text-home-muted">
                    {proposal.status} · {formatCurrency(proposal.valor)}
                  </span>
                </summary>
                <p className="mt-3 whitespace-pre-wrap text-[11px] leading-relaxed text-home-foreground/80">
                  {proposal.corpo}
                </p>
              </details>
            ))
          ) : (
            <StateMessage
              icon={<FileText className="size-4" />}
              text="Nenhuma proposta associada a este lead."
            />
          )
        ) : null}

        {activeTab === "historico" && detailData ? (
          <div className="space-y-2">
            <EventRow
              title="Lead criado"
              detail={null}
              date={opportunity.createdAt}
              icon={<Building2 className="size-3.5" />}
            />
            <EventRow
              title="Última atualização"
              detail={null}
              date={opportunity.updatedAt}
              icon={<History className="size-3.5" />}
            />
            {opportunity.record.motivo_perda ? (
              <EventRow
                title={
                  opportunity.statusValue === "nurture"
                    ? "Enviado para nutrição"
                    : "Perda registrada"
                }
                detail={[opportunity.record.motivo_perda, opportunity.record.motivo_perda_nota]
                  .filter(Boolean)
                  .join(" · ")}
                date={opportunity.record.perda_em ?? opportunity.updatedAt}
                icon={<XCircle className="size-3.5" />}
              />
            ) : null}
            {detailData.proposals.map((proposal) => (
              <EventRow
                key={proposal.id}
                title={`Proposta ${proposal.status}`}
                detail={proposal.assunto}
                date={proposal.respondida_em ?? proposal.enviada_em ?? proposal.criada_em}
                icon={<FileText className="size-3.5" />}
              />
            ))}
          </div>
        ) : null}
      </div>
    </aside>
  );
}

function parseSelectableStatus(status: string): LeadStatus {
  switch (status) {
    case "new":
    case "enriched":
    case "contacted":
    case "proposta_enviada":
    case "responded":
    case "meeting":
    case "won":
      return status;
    default:
      throw new Error(`Transição comercial não suportada: ${status}`);
  }
}

function Pill({ children, tone }: { children: string; tone: "blue" | "green" | "purple" }) {
  const tones = {
    blue: "border-blue-500/30 bg-blue-500/15 text-blue-400",
    green: "border-emerald-500/30 bg-emerald-500/15 text-emerald-400",
    purple: "border-purple-500/30 bg-purple-500/15 text-purple-300",
  };
  return (
    <span
      className={cn("rounded-full border px-2.5 py-0.5 text-[10px] font-semibold", tones[tone])}
    >
      {children}
    </span>
  );
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div className="grid grid-cols-[80px_1fr] gap-2">
      <span className="text-[11px] text-home-muted">{label}</span>
      <span className="flex items-start gap-1.5 whitespace-pre-line text-[11px] text-home-foreground/90">
        {icon}
        {value}
      </span>
    </div>
  );
}

function ActionRow({
  label,
  value,
  icon,
  disabled,
  onClick,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <div className="grid grid-cols-[80px_1fr] gap-2">
      <span className="text-[11px] text-home-muted">{label}</span>
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className="flex min-w-0 items-center gap-1.5 text-left text-[11px] font-medium text-home-blue hover:underline disabled:cursor-default disabled:text-home-muted disabled:no-underline"
      >
        {icon}
        <span className="truncate">{value}</span>
      </button>
    </div>
  );
}

function SocialLink({ label, href, icon }: { label: string; href: string; icon: ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      disabled={!href}
      onClick={() => href && window.open(href, "_blank", "noopener,noreferrer")}
      className="flex size-7 items-center justify-center rounded-lg border border-home-border text-home-blue hover:bg-home-surface-strong disabled:cursor-not-allowed disabled:opacity-30"
    >
      {icon}
    </button>
  );
}

function StateMessage({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-dashed border-home-border p-4 text-home-muted">
      {icon}
      <span>{text}</span>
    </div>
  );
}

function EventRow({
  title,
  detail,
  date,
  icon,
}: {
  title: string;
  detail: string | null;
  date: string;
  icon: ReactNode;
}) {
  const parsed = new Date(date);
  return (
    <div className="flex gap-3 rounded-xl border border-home-border/60 bg-home-surface/40 p-3">
      <span className="mt-0.5 text-home-orange">{icon}</span>
      <div className="min-w-0">
        <p className="font-semibold text-white">{title}</p>
        {detail ? <p className="mt-0.5 text-[11px] text-home-muted">{detail}</p> : null}
        <time className="mt-1 block text-[10px] text-home-muted/70">
          {Number.isNaN(parsed.getTime()) ? "Data indisponível" : parsed.toLocaleString("pt-BR")}
        </time>
      </div>
    </div>
  );
}
