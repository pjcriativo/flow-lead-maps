import { useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ExternalLink,
  Facebook,
  FileText,
  Globe,
  History,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Save,
  Trash2,
  Wand2,
  X,
} from "lucide-react";
import { SiInstagram, SiLinkedin, SiWhatsapp } from "react-icons/si";
import { AtribuirLead } from "@/components/leads/AtribuirLead";
import { carregarDetalheLead } from "@/services/lead-detalhe";
import { cn } from "@/lib/utils";
import type { LeadItem } from "./leads-premium-data";
import { CompanyLogo } from "./LeadRow";
import { LeadScoreBadge, LeadScoreDonut } from "./LeadScoreBadge";

interface LeadDetailsPanelProps {
  lead: LeadItem | null;
  lists: Array<{ id: string; name: string }>;
  campaigns: Array<{ id: string; label: string }>;
  campaignsUnavailable: boolean;
  canDelete: boolean;
  saving: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onLeadChanged: () => void;
  onListChange: (listId: string | null) => Promise<void>;
  onNotesSave: (notes: string) => Promise<void>;
  onCampaignAdd: (campaignId: string) => Promise<boolean>;
  onOpenRedesign?: (leadId: string) => void;
  className?: string;
}

type DetailTab = "geral" | "contatos" | "historico" | "anotacoes";

export function LeadDetailsPanel({
  lead,
  lists,
  campaigns,
  campaignsUnavailable,
  canDelete,
  saving,
  onClose,
  onEdit,
  onDelete,
  onLeadChanged,
  onListChange,
  onNotesSave,
  onCampaignAdd,
  onOpenRedesign,
  className,
}: LeadDetailsPanelProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>("geral");
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [notes, setNotes] = useState(lead?.record.notes ?? "");
  const [listSaving, setListSaving] = useState(false);
  const [campaignId, setCampaignId] = useState("");
  const [campaignSaving, setCampaignSaving] = useState(false);
  const detailsQuery = useQuery({
    queryKey: ["premium-lead-details", lead?.id],
    queryFn: () => {
      if (!lead) throw new Error("Lead não selecionado.");
      return carregarDetalheLead(lead.id);
    },
    enabled: Boolean(lead?.id),
  });

  useEffect(() => {
    setNotes(lead?.record.notes ?? "");
    setActiveTab("geral");
    setShowFullDesc(false);
    setCampaignId("");
  }, [lead?.id, lead?.record.notes]);

  if (!lead) return null;

  const call = () => {
    if (lead.phone) window.location.href = `tel:${lead.phone.replace(/\D/g, "")}`;
  };
  const sendEmail = () => {
    if (lead.email) window.location.href = `mailto:${lead.email}`;
  };
  const visitSite = () => {
    if (!lead.website) return;
    const url = lead.website.startsWith("http") ? lead.website : `https://${lead.website}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };
  const openMaps = () => {
    if (!lead.address) return;
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lead.company} ${lead.address}`)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };
  const changeList = async (value: string) => {
    setListSaving(true);
    try {
      await onListChange(value === "none" ? null : value);
    } finally {
      setListSaving(false);
    }
  };
  const addToCampaign = async () => {
    if (!campaignId) return;
    setCampaignSaving(true);
    try {
      if (await onCampaignAdd(campaignId)) setCampaignId("");
    } finally {
      setCampaignSaving(false);
    }
  };

  const selectedList = lists.find((list) => list.id === lead.listId);
  const scoreDescription = lead.record.score_breakdown
    ? "Score persistido com detalhamento disponível para este lead."
    : "Score persistido; o detalhamento do cálculo não está disponível para este registro.";

  return (
    <aside
      className={cn(
        "flex h-fit w-full flex-col overflow-hidden rounded-2xl border border-home-border bg-home-surface/90 shadow-2xl backdrop-blur-md",
        className,
      )}
    >
      <div className="relative border-b border-home-border/70 p-5">
        <div className="absolute right-4 top-4 flex items-center gap-1">
          <button
            type="button"
            onClick={onEdit}
            aria-label="Editar lead"
            className="flex size-7 items-center justify-center rounded-lg border border-home-border/80 bg-home-surface text-home-muted hover:bg-home-surface-strong hover:text-white"
          >
            <Pencil className="size-3.5" />
          </button>
          {canDelete ? (
            <button
              type="button"
              onClick={onDelete}
              aria-label="Excluir lead"
              className="flex size-7 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
            >
              <Trash2 className="size-3.5" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar painel do lead"
            className="flex size-7 items-center justify-center rounded-lg border border-home-border/80 bg-home-surface text-home-muted hover:bg-home-surface-strong hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex items-start gap-3.5 pr-24">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-950/40 p-2 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.15)]">
            <CompanyLogo type={lead.avatarType} className="size-7" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-base font-bold text-white">{lead.company}</h3>
              <LeadScoreBadge score={lead.score} size="sm" />
            </div>
            <p className="text-xs text-home-muted">{lead.category || "Categoria não informada"}</p>
          </div>
        </div>
        <div className="mt-3.5 flex flex-wrap gap-1.5">
          <Pill tone="blue">{lead.channelLabel}</Pill>
          <Pill tone="green">{lead.classification}</Pill>
          {selectedList ? <Pill tone="purple">{selectedList.name}</Pill> : null}
        </div>
      </div>

      <div className="flex border-b border-home-border/70 px-5 text-xs font-semibold">
        {(
          [
            ["geral", "Visão geral"],
            ["contatos", "Contatos"],
            ["historico", "Histórico"],
            ["anotacoes", "Anotações"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={cn(
              "pb-3 pt-3 transition-colors",
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

      <div className="space-y-5 p-5 text-xs">
        {activeTab === "geral" ? (
          <>
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white">Informações da empresa</h4>
                <button
                  type="button"
                  onClick={visitSite}
                  disabled={!lead.website}
                  className="inline-flex items-center gap-1 rounded-lg border border-home-border/80 bg-home-surface px-2.5 py-1 text-[11px] font-semibold text-home-muted hover:bg-home-surface-strong hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ExternalLink className="size-3" /> Acessar site
                </button>
              </div>
              <div className="space-y-2 rounded-xl border border-home-border/60 bg-home-surface/40 p-3.5">
                <InfoRow label="Nome" value={lead.company} strong />
                <InfoRow label="Contato" value={lead.contactName || "Não informado"} />
                <InfoRow label="Categoria" value={lead.category || "Não informada"} />
                <InfoRow label="Status" value={lead.status} />
                <div className="grid grid-cols-[80px_1fr] gap-2">
                  <span className="text-[11px] text-home-muted">Descrição</span>
                  <div>
                    <p
                      className={cn(
                        "text-[11px] leading-relaxed text-home-foreground/80",
                        !showFullDesc && "line-clamp-2",
                      )}
                    >
                      {lead.description || "Sem observações."}
                    </p>
                    {lead.description ? (
                      <button
                        type="button"
                        onClick={() => setShowFullDesc((current) => !current)}
                        className="mt-0.5 text-[10px] font-bold text-home-orange hover:underline"
                      >
                        {showFullDesc ? "Ver menos" : "Ver mais"}
                      </button>
                    ) : null}
                  </div>
                </div>
                <div className="grid grid-cols-[80px_1fr] gap-2 border-t border-home-border/40 pt-1">
                  <span className="text-[11px] text-home-muted">Localização</span>
                  <div>
                    <div className="flex items-start gap-1.5 text-[11px] text-home-foreground/90">
                      <MapPin className="mt-0.5 size-3.5 shrink-0 text-red-500" />
                      <span>{lead.address || "Não informada"}</span>
                    </div>
                    {lead.address ? (
                      <button
                        type="button"
                        onClick={openMaps}
                        className="mt-1 text-[10px] font-bold text-home-orange hover:underline"
                      >
                        Ver no mapa
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white">Responsável e lista</h4>
                {listSaving ? <Loader2 className="size-3.5 animate-spin text-home-muted" /> : null}
              </div>
              <AtribuirLead lead={lead.record} onAtribuido={onLeadChanged} />
              <select
                value={lead.listId ?? "none"}
                onChange={(event) => void changeList(event.target.value)}
                disabled={listSaving}
                className="h-9.5 w-full rounded-xl border border-home-border bg-home-surface px-3 text-xs text-white outline-none focus:border-home-orange"
              >
                <option value="none">Sem lista</option>
                {lists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.name}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <select
                  value={campaignId}
                  onChange={(event) => setCampaignId(event.target.value)}
                  disabled={campaignSaving || campaignsUnavailable}
                  title={campaignsUnavailable ? "Campanhas indisponíveis no momento" : undefined}
                  className="h-9.5 min-w-0 flex-1 rounded-xl border border-home-border bg-home-surface px-3 text-xs text-white outline-none focus:border-home-orange disabled:opacity-50"
                >
                  <option value="">
                    {campaignsUnavailable ? "Campanhas indisponíveis" : "Vincular a campanha"}
                  </option>
                  {campaigns.map((campaign) => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => void addToCampaign()}
                  disabled={!campaignId || campaignSaving}
                  className="inline-flex h-9.5 items-center gap-1 rounded-xl border border-home-border bg-home-surface px-3 text-[11px] font-semibold text-white hover:bg-home-surface-strong disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {campaignSaving ? <Loader2 className="size-3.5 animate-spin" /> : null}
                  Vincular
                </button>
              </div>
            </section>
            <section className="space-y-2 pt-1">
              <h4 className="text-xs font-bold text-white">Score e classificação</h4>
              <LeadScoreDonut
                score={lead.score}
                label={lead.classification}
                description={scoreDescription}
              />
            </section>
          </>
        ) : null}

        {activeTab === "contatos" ? (
          <section className="space-y-3">
            <h4 className="text-xs font-bold text-white">Contatos e canais</h4>
            <ContactRow
              icon={<Phone className="size-3.5" />}
              value={lead.phone || "Não informado"}
              action="Ligar"
              disabled={!lead.phone}
              onClick={call}
            />
            <ContactRow
              icon={<Mail className="size-3.5" />}
              value={lead.email || "Não informado"}
              action="Enviar"
              disabled={!lead.email}
              onClick={sendEmail}
            />
            <ContactRow
              icon={<Globe className="size-3.5" />}
              value={lead.website || "Não informado"}
              action="Acessar"
              disabled={!lead.website}
              onClick={visitSite}
            />
            <div className="flex items-center gap-2 pt-1">
              <SocialButton
                label="Instagram"
                href={lead.instagramUrl}
                icon={<SiInstagram className="size-4" />}
                className="text-[#ec4899]"
              />
              <SocialButton
                label="Facebook"
                href={lead.facebookUrl}
                icon={<Facebook className="size-4" />}
                className="text-[#1877f2]"
              />
              <SocialButton
                label="LinkedIn"
                href={lead.linkedinUrl}
                icon={<SiLinkedin className="size-4" />}
                className="text-[#0a66c2]"
              />
              <SocialButton
                label="WhatsApp"
                href={
                  lead.whatsapp || lead.phone
                    ? `https://wa.me/${(lead.whatsapp || lead.phone).replace(/\D/g, "")}`
                    : ""
                }
                icon={<SiWhatsapp className="size-4" />}
                className="text-[#22c55e]"
              />
            </div>
            {onOpenRedesign ? (
              <button
                type="button"
                onClick={() => onOpenRedesign(lead.id)}
                className="inline-flex items-center gap-2 rounded-lg border border-home-border bg-home-surface px-3 py-2 text-[11px] font-semibold text-white hover:bg-home-surface-strong"
              >
                <Wand2 className="size-3.5 text-home-orange" /> Abrir produção do site
              </button>
            ) : null}
          </section>
        ) : null}

        {activeTab === "historico" ? (
          <section className="space-y-3">
            <h4 className="flex items-center gap-2 text-xs font-bold text-white">
              <History className="size-3.5" /> Histórico comercial
            </h4>
            {detailsQuery.isLoading ? (
              <p className="inline-flex items-center gap-2 text-home-muted">
                <Loader2 className="size-3.5 animate-spin" /> Carregando histórico...
              </p>
            ) : null}
            {detailsQuery.error ? (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-red-300">
                {detailsQuery.error instanceof Error
                  ? detailsQuery.error.message
                  : "Falha ao carregar o histórico."}
              </p>
            ) : null}
            {detailsQuery.data ? (
              <div className="space-y-2">
                {detailsQuery.data.contatos.map((contact) => (
                  <HistoryRow
                    key={`contact-${contact.id}`}
                    title={`Contato por ${contact.canal}`}
                    detail={contact.anotacao}
                    date={contact.contatado_em}
                  />
                ))}
                {detailsQuery.data.propostas.map((proposal) => (
                  <HistoryRow
                    key={`proposal-${proposal.id}`}
                    title={`Proposta: ${proposal.assunto}`}
                    detail={`Status: ${proposal.status}`}
                    date={proposal.criada_em}
                    icon={<FileText className="size-3.5" />}
                  />
                ))}
                {!detailsQuery.data.contatos.length && !detailsQuery.data.propostas.length ? (
                  <p className="rounded-xl border border-dashed border-home-border p-4 text-center text-home-muted">
                    Sem atividades registradas para este lead.
                  </p>
                ) : null}
              </div>
            ) : null}
          </section>
        ) : null}

        {activeTab === "anotacoes" ? (
          <section className="space-y-3">
            <h4 className="text-xs font-bold text-white">Anotações</h4>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Registre informações comerciais relevantes..."
              className="min-h-36 w-full resize-y rounded-xl border border-home-border bg-home-surface p-3 text-xs text-white outline-none placeholder:text-home-muted focus:border-home-orange focus:ring-1 focus:ring-home-orange"
            />
            <button
              type="button"
              onClick={() => void onNotesSave(notes)}
              disabled={saving || notes === (lead.record.notes ?? "")}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-home-orange px-3 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Save className="size-3.5" />
              )}{" "}
              Salvar anotações
            </button>
          </section>
        ) : null}
      </div>
    </aside>
  );
}

function Pill({ children, tone }: { children: ReactNode; tone: "blue" | "green" | "purple" }) {
  const styles = {
    blue: "border-blue-500/30 bg-blue-500/15 text-blue-400",
    green: "border-emerald-500/30 bg-emerald-500/15 text-emerald-400",
    purple: "border-purple-500/30 bg-purple-500/15 text-purple-300",
  };
  return (
    <span
      className={cn("rounded-full border px-2.5 py-0.5 text-[10px] font-semibold", styles[tone])}
    >
      {children}
    </span>
  );
}

function InfoRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="grid grid-cols-[80px_1fr] gap-2">
      <span className="text-[11px] text-home-muted">{label}</span>
      <span className={cn("text-home-foreground/90", strong && "font-semibold text-white")}>
        {value}
      </span>
    </div>
  );
}

function ContactRow({
  icon,
  value,
  action,
  disabled,
  onClick,
}: {
  icon: ReactNode;
  value: string;
  action: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-home-border/60 bg-home-surface/40 px-3 py-2">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-home-surface-strong text-home-muted">
          {icon}
        </div>
        <span className="truncate text-xs font-medium text-white">{value}</span>
      </div>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="rounded-lg border border-home-border bg-home-surface px-3 py-1 text-[11px] font-semibold text-white hover:bg-home-surface-strong disabled:cursor-not-allowed disabled:opacity-40"
      >
        {action}
      </button>
    </div>
  );
}

function SocialButton({
  label,
  href,
  icon,
  className,
}: {
  label: string;
  href: string;
  icon: ReactNode;
  className: string;
}) {
  return (
    <button
      type="button"
      title={href ? label : `${label} não informado`}
      disabled={!href}
      onClick={() => href && window.open(href, "_blank", "noopener,noreferrer")}
      className={cn(
        "flex size-8.5 items-center justify-center rounded-xl border border-home-border bg-home-surface transition-all hover:scale-105 hover:bg-home-surface-strong disabled:cursor-not-allowed disabled:opacity-30",
        className,
      )}
    >
      {icon}
    </button>
  );
}

function HistoryRow({
  title,
  detail,
  date,
  icon,
}: {
  title: string;
  detail: string | null;
  date: string;
  icon?: ReactNode;
}) {
  const parsed = new Date(date);
  return (
    <div className="rounded-xl border border-home-border/60 bg-home-surface/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 font-semibold text-white">
          {icon}
          {title}
        </span>
        <time className="text-[10px] text-home-muted">
          {Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleString("pt-BR")}
        </time>
      </div>
      {detail ? <p className="mt-1 text-[11px] text-home-muted">{detail}</p> : null}
    </div>
  );
}
