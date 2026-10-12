import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  ChartNoAxesColumnIncreasing,
  ChevronRight,
  CirclePlus,
  ClipboardList,
  Clock3,
  EllipsisVertical,
  Flame,
  Instagram,
  Layers3,
  MessageSquareMore,
  Rocket,
  Search,
  Send,
  Sparkles,
  Trophy,
  UsersRound,
  Workflow,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { InstagramCampaign, InstagramLead } from "@/services/instagram";
import type {
  FlowBusinessAutomationSnapshot,
  FlowBusinessCadence,
  FlowBusinessCard,
  FlowBusinessWorkspace,
} from "@/services/flow-business";

type CampaignType = "assisted" | "comment_flow" | "relationship";
type AdvancedView = "none" | "cadences" | "flows";

interface CreateCampaignInput {
  name: string;
  type: CampaignType;
  accountId: string;
  cadenceId: string;
  leads: InstagramLead[];
}

interface FlowBusinessAutomationsProps {
  campaigns: InstagramCampaign[];
  leads: InstagramLead[];
  workspace: FlowBusinessWorkspace;
  automation: FlowBusinessAutomationSnapshot;
  creatingCampaign: boolean;
  updatingCampaignId: string | null;
  onCreateCampaign: (input: CreateCampaignInput) => Promise<void>;
  onToggleCampaign: (campaignId: string, active: boolean) => Promise<void>;
  onOpenCampaign: (campaignId: string) => void;
  renderCadenceManager: () => ReactNode;
  renderFlowManager: () => ReactNode;
}

const TEMPLATE_SUGGESTIONS = [
  { name: "Prospecção para negócios locais", icon: Flame, tone: "orange" },
  { name: "Engajamento com conteúdo", icon: MessageSquareMore, tone: "blue" },
  { name: "Seguimento e conversão", icon: TargetIcon, tone: "pink" },
] as const;

export function FlowBusinessAutomations({
  campaigns,
  leads,
  workspace,
  automation,
  creatingCampaign,
  updatingCampaignId,
  onCreateCampaign,
  onToggleCampaign,
  onOpenCampaign,
  renderCadenceManager,
  renderFlowManager,
}: FlowBusinessAutomationsProps) {
  const [advancedView, setAdvancedView] = useState<AdvancedView>("none");

  useEffect(() => {
    const openCampaignForm = () => {
      document.getElementById("automation-create-campaign")?.scrollIntoView({ behavior: "smooth" });
      window.setTimeout(() => document.getElementById("automation-campaign-name")?.focus(), 350);
    };
    window.addEventListener("instagram-new-campaign", openCampaignForm);
    return () => window.removeEventListener("instagram-new-campaign", openCampaignForm);
  }, []);

  const metrics = useMemo(() => campaignMetrics(campaigns), [campaigns]);

  return (
    <div className="space-y-4">
      <AutomationHero
        cards={workspace.cards}
        metrics={metrics}
        onCreate={() => {
          document
            .getElementById("automation-create-campaign")
            ?.scrollIntoView({ behavior: "smooth" });
          document.getElementById("automation-campaign-name")?.focus({ preventScroll: true });
        }}
        onTemplates={() =>
          document.getElementById("automation-templates")?.scrollIntoView({ behavior: "smooth" })
        }
      />

      <AutomationKpis metrics={metrics} />

      <div className="grid items-start gap-4 xl:grid-cols-[255px_minmax(0,1fr)_280px]">
        <CreateCampaignCard
          leads={leads}
          accounts={workspace.accounts}
          cadences={workspace.cadences}
          creating={creatingCampaign}
          onCreate={onCreateCampaign}
          onOpenBuilder={() => setAdvancedView("flows")}
        />
        <CampaignTable
          campaigns={campaigns}
          updatingCampaignId={updatingCampaignId}
          onToggle={onToggleCampaign}
          onOpenCampaign={onOpenCampaign}
          onOpenCadences={() => setAdvancedView("cadences")}
          onOpenFlows={() => setAdvancedView("flows")}
        />
        <div className="space-y-3">
          <TemplatesCard
            cadences={workspace.cadences}
            onOpenManager={() => setAdvancedView("cadences")}
          />
          <AutomationInsights
            campaigns={campaigns}
            cards={workspace.cards}
            automation={automation}
          />
          <RecentAutomationActivity workspace={workspace} automation={automation} />
        </div>
      </div>

      {advancedView !== "none" ? (
        <section className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#101828]">
                {advancedView === "cadences" ? "Gerenciar cadências" : "Construtor de fluxos"}
              </h2>
              <p className="text-xs text-muted-foreground">
                Recursos avançados preservados da operação existente.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setAdvancedView("none")}>
              Fechar painel
            </Button>
          </div>
          {advancedView === "cadences" ? renderCadenceManager() : renderFlowManager()}
        </section>
      ) : null}
    </div>
  );
}

function AutomationHero({
  cards,
  metrics,
  onCreate,
  onTemplates,
}: {
  cards: FlowBusinessCard[];
  metrics: AutomationMetrics;
  onCreate: () => void;
  onTemplates: () => void;
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-[#F0B6D0] bg-card px-6 py-5 shadow-xs sm:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_58%_45%,rgba(247,37,133,0.12),transparent_31%),linear-gradient(115deg,rgba(247,119,55,0.07),transparent_36%,rgba(131,58,180,0.08))]" />
      <div className="relative grid items-center gap-5 lg:grid-cols-[minmax(0,1.1fr)_330px_320px]">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#F72585]">
            Automações que geram resultados
          </p>
          <h2 className="mt-2 max-w-xl text-2xl font-extrabold leading-[1.08] tracking-tight text-[#101828] sm:text-[30px]">
            Transforme oportunidades em clientes com{" "}
            <span className="bg-gradient-to-r from-[#F77737] via-[#E1306C] to-[#833AB4] bg-clip-text text-transparent">
              automações.
            </span>
          </h2>
          <p className="mt-3 max-w-xl text-xs leading-relaxed text-[#475467]">
            Crie cadências inteligentes, automatize abordagens no Instagram e acompanhe cada etapa
            com dados em tempo real.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              className="rounded-lg bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
              onClick={onCreate}
            >
              <CirclePlus className="size-4" /> Criar nova campanha
            </Button>
            <Button variant="outline" className="rounded-lg bg-card" onClick={onTemplates}>
              Ver templates <ArrowUpRight className="size-4" />
            </Button>
          </div>
        </div>
        <AutomationArtwork cards={cards} />
        <PerformanceCard metrics={metrics} />
      </div>
    </section>
  );
}

function AutomationArtwork({ cards }: { cards: FlowBusinessCard[] }) {
  const avatars = cards.filter((card) => card.profilePictureUrl).slice(0, 4);
  return (
    <div className="relative hidden h-44 items-center justify-center lg:flex" aria-hidden="true">
      <div className="absolute size-44 rounded-full border border-[#FBCFE8]/70" />
      <div className="absolute size-32 rounded-full border border-[#E9D5FF]" />
      <div className="absolute size-24 rounded-full bg-[#F72585]/8 blur-xl" />
      <div className="relative z-10 flex size-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-[#F77737] via-[#E1306C] to-[#833AB4] text-white shadow-[0_14px_30px_rgba(225,48,108,0.30)] ring-4 ring-card/80">
        <Instagram className="size-11" />
      </div>
      {avatars.map((card, index) => {
        const positions = [
          "left-12 top-0",
          "right-10 top-1",
          "left-9 bottom-0",
          "right-12 bottom-0",
        ];
        return (
          <Avatar
            key={card.id}
            className={cn("absolute z-20 size-10 border-4 border-card shadow-md", positions[index])}
          >
            <AvatarImage src={card.profilePictureUrl ?? undefined} alt="" />
            <AvatarFallback className="bg-muted" />
          </Avatar>
        );
      })}
      <FloatingAutomationCard
        className="left-0 top-5 rotate-[-4deg]"
        icon={Clock3}
        text="Seguir perfil após 2h"
        tone="orange"
      />
      <FloatingAutomationCard
        className="left-2 bottom-2 rotate-[-5deg]"
        icon={MessageSquareMore}
        text="Comentar com contexto"
        tone="purple"
      />
      <FloatingAutomationCard
        className="right-0 bottom-3 rotate-[4deg]"
        icon={Bot}
        text="Enviar mensagem personalizada"
        tone="pink"
      />
      <span className="absolute right-2 top-10 flex size-9 items-center justify-center rounded-full bg-card text-[#833AB4] shadow-md">
        <Send className="size-4" />
      </span>
    </div>
  );
}

function FloatingAutomationCard({
  className,
  icon: Icon,
  text,
  tone,
}: {
  className: string;
  icon: typeof Clock3;
  text: string;
  tone: "orange" | "purple" | "pink";
}) {
  const tones = {
    orange: "bg-[#FFF7ED] text-[#F77737]",
    purple: "bg-[#F5F0FF] text-[#833AB4]",
    pink: "bg-[#FFF1F6] text-[#F72585]",
  };
  return (
    <div
      className={cn(
        "absolute z-30 flex max-w-36 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 shadow-md",
        className,
      )}
    >
      <span
        className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg", tones[tone])}
      >
        <Icon className="size-3.5" />
      </span>
      <span className="text-[9px] font-semibold leading-tight text-[#344054]">{text}</span>
    </div>
  );
}

function PerformanceCard({ metrics }: { metrics: AutomationMetrics }) {
  return (
    <Card className="border-[#E4E7EC] bg-card/90 p-4 shadow-sm backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wide text-[#F72585]">
          <ChartNoAxesColumnIncreasing className="size-4 text-[#F77737]" /> Desempenho das
          automações
        </h3>
        <Badge variant="outline" className="h-7 text-[9px]">
          Últimos 7 dias
        </Badge>
      </div>
      <div className="mt-4 grid grid-cols-4 divide-x divide-border">
        {[
          [metrics.actionsLast7Days, "Ações executadas"],
          [metrics.repliesLast7Days, "Respostas recebidas"],
          [metrics.leadsLast7Days, "Leads gerados"],
          [metrics.convertedLast7Days, "Clientes convertidos"],
        ].map(([value, label]) => (
          <div key={label} className="px-2 first:pl-0 last:pr-0">
            <p className="text-xl font-extrabold text-[#101828] tabular-nums">{value}</p>
            <p className="mt-0.5 text-[9px] leading-tight text-[#667085]">{label}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 flex items-center justify-between text-[10px] font-semibold text-[#344054]">
        <span>Taxa de resposta</span>
        <span>{metrics.responseRate}%</span>
      </div>
      <Progress
        value={metrics.responseRate}
        className="mt-2 h-2 bg-[#E4E7EC] [&>div]:bg-[#10B981]"
      />
    </Card>
  );
}

function AutomationKpis({ metrics }: { metrics: AutomationMetrics }) {
  const items = [
    {
      label: "Campanhas ativas",
      value: metrics.activeCampaigns,
      Icon: Workflow,
      tone: "pink",
      detail: "campanhas em execução",
    },
    {
      label: "Ações executadas hoje",
      value: metrics.actionsToday,
      Icon: Send,
      tone: "blue",
      detail: "envios registrados",
    },
    {
      label: "Respostas hoje",
      value: metrics.repliesToday,
      Icon: MessageSquareMore,
      tone: "pink",
      detail: "respostas registradas",
    },
    {
      label: "Leads gerados hoje",
      value: metrics.leadsToday,
      Icon: UsersRound,
      tone: "blue",
      detail: "entradas nas campanhas",
    },
    {
      label: "Clientes hoje",
      value: metrics.convertedToday,
      Icon: Trophy,
      tone: "green",
      detail: "conversões registradas",
    },
  ] as const;
  const tones = {
    pink: "bg-[#FFF1F6] text-[#F72585]",
    blue: "bg-[#EFF6FF] text-[#2563EB]",
    green: "bg-[#ECFDF5] text-[#10B981]",
  };
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {items.map(({ label, value, Icon, tone, detail }) => (
        <Card
          key={label}
          className="flex min-h-20 items-center gap-3 border-[#E4E7EC] p-3 shadow-xs"
        >
          <span
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-xl",
              tones[tone],
            )}
          >
            <Icon className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[10px] font-semibold text-[#344054]">{label}</p>
            <p className="text-2xl font-extrabold text-[#101828] tabular-nums">{value}</p>
            <p className="truncate text-[9px] text-[#10B981]">{detail}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}

function CreateCampaignCard({
  leads,
  accounts,
  cadences,
  creating,
  onCreate,
  onOpenBuilder,
}: {
  leads: InstagramLead[];
  accounts: FlowBusinessWorkspace["accounts"];
  cadences: FlowBusinessCadence[];
  creating: boolean;
  onCreate: (input: CreateCampaignInput) => Promise<void>;
  onOpenBuilder: () => void;
}) {
  const [type, setType] = useState<CampaignType>("assisted");
  const [name, setName] = useState("");
  const [audience, setAudience] = useState("all");
  const [accountId, setAccountId] = useState("none");
  const [cadenceId, setCadenceId] = useState("none");
  const [error, setError] = useState("");
  const connectedAccounts = accounts.filter((account) => account.status === "conectado");

  const submit = async () => {
    setError("");
    if (type !== "assisted") {
      setError("Esta modalidade é configurada e publicada pelo construtor de fluxos existente.");
      onOpenBuilder();
      return;
    }
    const selectedLeads = filterAudience(leads, audience);
    if (!name.trim()) return setError("Informe o nome da campanha.");
    if (accountId === "none") return setError("Selecione uma conta do Instagram conectada.");
    if (cadenceId === "none") return setError("Selecione uma cadência.");
    if (!selectedLeads.length)
      return setError("O público selecionado não possui leads disponíveis.");
    await onCreate({ name: name.trim(), type, accountId, cadenceId, leads: selectedLeads });
    setName("");
  };

  return (
    <Card id="automation-create-campaign" className="border-[#E4E7EC] p-3 shadow-xs">
      <h3 className="flex items-center gap-2 text-sm font-bold text-[#101828]">
        <span className="flex size-8 items-center justify-center rounded-xl bg-[#F5F0FF] text-[#833AB4]">
          <Rocket className="size-4" />
        </span>
        Criar nova campanha
      </h3>
      <CampaignField label="Tipo de campanha">
        <Select value={type} onValueChange={(value) => setType(value as CampaignType)}>
          <SelectTrigger className="h-8 text-[10px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="assisted">Cadência de prospecção</SelectItem>
            <SelectItem value="comment_flow">Campanha de comentários</SelectItem>
            <SelectItem value="relationship">Fluxo de relacionamento</SelectItem>
          </SelectContent>
        </Select>
      </CampaignField>
      <CampaignField label="Nome da campanha">
        <Input
          id="automation-campaign-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ex: Restaurantes São Paulo"
          className="h-8 text-[10px]"
        />
      </CampaignField>
      <CampaignField label="Público-alvo">
        <Select value={audience} onValueChange={setAudience}>
          <SelectTrigger className="h-8 text-[10px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Leads da prospecção ({leads.length})</SelectItem>
            <SelectItem value="qualified">
              Leads qualificados ({filterAudience(leads, "qualified").length})
            </SelectItem>
            <SelectItem value="hot">Score 80+ ({filterAudience(leads, "hot").length})</SelectItem>
          </SelectContent>
        </Select>
      </CampaignField>
      <CampaignField label="Conta do Instagram">
        <Select value={accountId} onValueChange={setAccountId}>
          <SelectTrigger className="h-8 text-[10px]">
            <Instagram className="size-3.5 text-[#E1306C]" />
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Selecione uma conta</SelectItem>
            {connectedAccounts.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                {account.username ? `@${account.username}` : (account.displayName ?? "Instagram")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CampaignField>
      <CampaignField label="Cadência">
        <Select value={cadenceId} onValueChange={setCadenceId}>
          <SelectTrigger className="h-8 text-[10px]">
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Selecione uma cadência</SelectItem>
            {cadences
              .filter((cadence) => cadence.isActive)
              .map((cadence) => (
                <SelectItem key={cadence.id} value={cadence.id}>
                  {cadence.name} ({cadence.steps.length} etapas)
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </CampaignField>
      {error ? (
        <p role="alert" className="mt-2 text-[10px] leading-relaxed text-destructive">
          {error}
        </p>
      ) : null}
      <Button
        className="mt-3 w-full rounded-lg bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
        disabled={creating}
        onClick={() => void submit()}
      >
        {type === "assisted" ? <CirclePlus className="size-4" /> : <Workflow className="size-4" />}
        {creating ? "Criando..." : type === "assisted" ? "Criar campanha" : "Abrir construtor"}
      </Button>
    </Card>
  );
}

function CampaignField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mt-3">
      <p className="mb-1 text-[10px] font-semibold text-[#344054]">{label}</p>
      {children}
    </div>
  );
}

function CampaignTable({
  campaigns,
  updatingCampaignId,
  onToggle,
  onOpenCampaign,
  onOpenCadences,
  onOpenFlows,
}: {
  campaigns: InstagramCampaign[];
  updatingCampaignId: string | null;
  onToggle: (id: string, active: boolean) => Promise<void>;
  onOpenCampaign: (id: string) => void;
  onOpenCadences: () => void;
  onOpenFlows: () => void;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const filtered = campaigns.filter((campaign) => {
    const matchesQuery = campaign.nome
      .toLocaleLowerCase("pt-BR")
      .includes(query.trim().toLocaleLowerCase("pt-BR"));
    return matchesQuery && (status === "all" || campaign.status === status);
  });
  return (
    <Card className="overflow-hidden border-[#E4E7EC] shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-3">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-xl bg-[#FFF1F6] text-[#F72585]">
            <ClipboardList className="size-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-[#101828]">Minhas campanhas</h3>
            <p className="text-[9px] text-[#667085]">
              Gerencie suas campanhas e acompanhe o desempenho em tempo real.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar campanhas..."
              className="h-8 w-40 pl-8 text-[10px]"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-8 w-32 text-[10px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as campanhas</SelectItem>
              <SelectItem value="ativa">Ativas</SelectItem>
              <SelectItem value="concluida">Concluídas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead className="bg-muted/40 text-[9px] text-[#475467]">
            <tr>
              <th className="w-12 px-3 py-2" />
              <th className="px-3 py-2">Campanha</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Progresso</th>
              <th className="px-3 py-2 text-center">Ações</th>
              <th className="px-3 py-2 text-center">Respostas</th>
              <th className="px-3 py-2 text-center">Leads</th>
              <th className="px-3 py-2 text-center">Clientes</th>
              <th className="w-10 px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((campaign) => {
              const active = campaign.status === "ativa";
              const progress = campaign.total
                ? Math.round((campaign.sent / campaign.total) * 100)
                : 0;
              return (
                <tr key={campaign.id} className="text-[10px] hover:bg-muted/25">
                  <td className="px-3 py-2">
                    <Switch
                      aria-label={`${active ? "Concluir" : "Reabrir"} ${campaign.nome}`}
                      checked={active}
                      disabled={updatingCampaignId === campaign.id}
                      onCheckedChange={(checked) => void onToggle(campaign.id, checked)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#F77737] via-[#E1306C] to-[#833AB4] text-white">
                        <Workflow className="size-3.5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block max-w-36 truncate font-semibold text-[#101828]">
                          {campaign.nome}
                        </span>
                        <span className="block text-[9px] text-[#667085]">
                          Cadência de prospecção
                        </span>
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <CampaignStatus status={campaign.status} />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex min-w-28 items-center gap-2">
                      <Progress
                        value={progress}
                        className="h-1.5 bg-[#E4E7EC] [&>div]:bg-[#2563EB]"
                      />
                      <span className="w-7 text-right text-[9px] text-[#667085]">{progress}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center tabular-nums">{campaign.sent}</td>
                  <td className="px-3 py-2 text-center tabular-nums">{campaign.replied}</td>
                  <td className="px-3 py-2 text-center tabular-nums">{campaign.total}</td>
                  <td className="px-3 py-2 text-center tabular-nums">{campaign.converted}</td>
                  <td className="px-3 py-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-8"
                          aria-label={`Ações de ${campaign.nome}`}
                        >
                          <EllipsisVertical className="size-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onOpenCampaign(campaign.id)}>
                          Abrir fila de abordagem
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={onOpenCadences}>
                          Gerenciar cadências
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={onOpenFlows}>
                          Abrir construtor de fluxos
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!filtered.length ? (
          <div className="p-10 text-center text-xs text-muted-foreground">
            Nenhuma campanha encontrada.
          </div>
        ) : null}
      </div>
    </Card>
  );
}

function CampaignStatus({ status }: { status: string }) {
  if (status === "ativa")
    return <Badge className="border-0 bg-[#D1FAE5] text-[#047857] hover:bg-[#D1FAE5]">Ativa</Badge>;
  if (status === "concluida") return <Badge variant="secondary">Concluída</Badge>;
  return <Badge variant="destructive">Erro</Badge>;
}

function TemplatesCard({
  cadences,
  onOpenManager,
}: {
  cadences: FlowBusinessCadence[];
  onOpenManager: () => void;
}) {
  const templates = TEMPLATE_SUGGESTIONS.map((suggestion, index) => ({
    ...suggestion,
    cadence: cadences[index] ?? null,
  }));
  const tones = {
    orange: "bg-[#FFF7ED] text-[#F77737]",
    blue: "bg-[#EFF6FF] text-[#2563EB]",
    pink: "bg-[#FFF1F6] text-[#F72585]",
  };
  return (
    <Card id="automation-templates" className="border-[#E4E7EC] p-3 shadow-xs">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-xs font-bold text-[#101828]">
          <Layers3 className="size-4 text-[#833AB4]" /> Templates de cadência
        </h3>
        <button
          type="button"
          onClick={onOpenManager}
          className="text-[9px] font-semibold text-[#475467]"
        >
          Ver todos
        </button>
      </div>
      <div className="mt-2 divide-y divide-border">
        {templates.map(({ name, icon: Icon, tone, cadence }) => (
          <button
            key={name}
            type="button"
            onClick={onOpenManager}
            className="flex w-full items-center gap-2 py-2 text-left"
          >
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-xl",
                tones[tone],
              )}
            >
              <Icon className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[10px] font-semibold text-[#344054]">
                {cadence?.name ?? name}
              </span>
              <span className="block truncate text-[9px] text-[#667085]">
                {cadence
                  ? `${cadence.steps.length} etapas`
                  : "Modelo sugerido · ainda indisponível"}
              </span>
            </span>
            <ChevronRight className="size-3.5 text-[#475467]" />
          </button>
        ))}
      </div>
    </Card>
  );
}

function AutomationInsights({
  campaigns,
  cards,
  automation,
}: {
  campaigns: InstagramCampaign[];
  cards: FlowBusinessCard[];
  automation: FlowBusinessAutomationSnapshot;
}) {
  const best = [...campaigns]
    .filter((campaign) => campaign.sent > 0)
    .sort((a, b) => b.replied / b.sent - a.replied / a.sent)[0];
  const processedEvents = automation.recentEvents.filter((event) => event.status === "processed");
  const bestHour = modeHour(processedEvents.map((event) => new Date(event.createdAt).getHours()));
  const highIntent = cards.filter(
    (card) => (card.score ?? 0) >= 70 && !["cliente", "perdido"].includes(card.stage),
  ).length;
  const items = [
    {
      title: best ? `${best.nome} lidera as respostas` : "Desempenho ainda indisponível",
      detail: best
        ? `${Math.round((best.replied / best.sent) * 100)}% de respostas registradas`
        : "Aguardando campanhas com envios",
      icon: Workflow,
      tone: "pink",
    },
    {
      title:
        bestHour == null ? "Melhor horário indisponível" : `Melhor horário observado: ${bestHour}h`,
      detail:
        bestHour == null ? "Aguardando respostas processadas" : "Calculado pelos eventos locais",
      icon: Clock3,
      tone: "blue",
    },
    {
      title: `${highIntent} oportunidades com maior potencial`,
      detail: "Score 70+ fora das etapas finais",
      icon: UsersRound,
      tone: "orange",
    },
  ] as const;
  const tones = {
    pink: "bg-[#FFF1F6] text-[#F72585]",
    blue: "bg-[#EFF6FF] text-[#2563EB]",
    orange: "bg-[#FFF7ED] text-[#F77737]",
  };
  return (
    <Card className="border-[#E4E7EC] p-3 shadow-xs">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-xs font-bold text-[#101828]">
          <Sparkles className="size-4 text-[#833AB4]" /> Insights da AISA
        </h3>
        <span className="text-[9px] text-muted-foreground">Dados locais</span>
      </div>
      <div className="mt-2 divide-y divide-border">
        {items.map(({ title, detail, icon: Icon, tone }) => (
          <div key={title} className="flex items-center gap-2 py-2">
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-xl",
                tones[tone],
              )}
            >
              <Icon className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[10px] font-semibold text-[#344054]">
                {title}
              </span>
              <span className="block truncate text-[9px] text-[#667085]">{detail}</span>
            </span>
            <ChevronRight className="size-3.5 text-[#475467]" />
          </div>
        ))}
      </div>
    </Card>
  );
}

function RecentAutomationActivity({
  workspace,
  automation,
}: {
  workspace: FlowBusinessWorkspace;
  automation: FlowBusinessAutomationSnapshot;
}) {
  const cardsById = new Map(workspace.cards.map((card) => [card.id, card]));
  const crmItems = (workspace.activities ?? []).map((activity) => ({
    id: activity.id,
    title: crmActivityTitle(activity.activityType, activity.metadata),
    name: cardsById.get(activity.cardId)?.businessName ?? activity.detail ?? "CRM",
    date: activity.occurredAt,
    avatar: cardsById.get(activity.cardId)?.profilePictureUrl ?? null,
    tone: activity.activityType === "won" ? "green" : "pink",
  }));
  const automationItems = automation.recentEvents
    .filter((event) => event.status === "processed")
    .map((event) => ({
      id: event.id,
      title: "Resposta recebida",
      name: `@${event.username}`,
      date: event.createdAt,
      avatar: null,
      tone: "purple",
    }));
  const items = [...crmItems, ...automationItems]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);
  const tones = { pink: "bg-[#F72585]", green: "bg-[#10B981]", purple: "bg-[#833AB4]" };
  return (
    <Card className="border-[#E4E7EC] p-3 shadow-xs">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-xs font-bold text-[#101828]">
          <Clock3 className="size-4 text-[#F79009]" /> Atividade recente
        </h3>
        <span className="text-[9px] font-semibold text-[#475467]">Ver tudo</span>
      </div>
      <div className="mt-2 space-y-2.5">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-2">
            <Avatar className="size-7 border border-border">
              <AvatarImage src={item.avatar ?? undefined} alt="" />
              <AvatarFallback className="bg-muted" />
            </Avatar>
            <span
              className={cn(
                "size-1.5 shrink-0 rounded-full",
                tones[item.tone as keyof typeof tones],
              )}
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[10px] font-semibold text-[#344054]">
                {item.title}
              </span>
              <span className="block truncate text-[9px] text-[#667085]">{item.name}</span>
            </span>
            <span className="shrink-0 text-[8px] text-[#98A2B3]">{relativeTime(item.date)}</span>
          </div>
        ))}
        {!items.length ? (
          <p className="py-4 text-center text-[10px] text-muted-foreground">
            Nenhuma atividade registrada.
          </p>
        ) : null}
      </div>
    </Card>
  );
}

type AutomationMetrics = ReturnType<typeof campaignMetrics>;

function campaignMetrics(campaigns: InstagramCampaign[]) {
  const sum = (key: keyof InstagramCampaign) =>
    campaigns.reduce((total, campaign) => total + Number(campaign[key] ?? 0), 0);
  const actionsLast7Days = sum("actionsLast7Days");
  const repliesLast7Days = sum("repliesLast7Days");
  return {
    activeCampaigns: campaigns.filter((campaign) => campaign.status === "ativa").length,
    actionsToday: sum("actionsToday"),
    repliesToday: sum("repliesToday"),
    leadsToday: sum("leadsToday"),
    convertedToday: sum("convertedToday"),
    actionsLast7Days,
    repliesLast7Days,
    leadsLast7Days: sum("leadsLast7Days"),
    convertedLast7Days: sum("convertedLast7Days"),
    responseRate: actionsLast7Days
      ? Math.round((repliesLast7Days / actionsLast7Days) * 1000) / 10
      : 0,
  };
}

function filterAudience(leads: InstagramLead[], audience: string) {
  if (audience === "hot") return leads.filter((lead) => (lead.lead.score ?? 0) >= 80);
  if (audience === "qualified")
    return leads.filter((lead) => (lead.lead.score ?? 0) >= 60 || lead.lead.status === "qualified");
  return leads;
}

function modeHour(hours: number[]): number | null {
  if (!hours.length) return null;
  const counts = new Map<number, number>();
  for (const hour of hours) counts.set(hour, (counts.get(hour) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

function crmActivityTitle(type: string, metadata: unknown) {
  const detail =
    typeof metadata === "object" && metadata !== null && !Array.isArray(metadata)
      ? (metadata as Record<string, unknown>)
      : {};
  if (type === "created") return "Novo lead gerado";
  if (type === "won" || detail.to === "cliente") return "Cliente convertido";
  if (type === "reply_received") return "Resposta recebida";
  return "Oportunidade atualizada";
}

function relativeTime(value: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60_000));
  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  return `há ${Math.floor(hours / 24)}d`;
}

function TargetIcon({ className }: { className?: string }) {
  return <Workflow className={className} />;
}
