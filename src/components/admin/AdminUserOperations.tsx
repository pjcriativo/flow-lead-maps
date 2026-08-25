import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Loader2,
  MessageCircle,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import {
  adminAcao,
  type OperacaoUsuariosResumo,
  type Plano,
  type UsuarioPlataforma,
} from "@/services/admin";
import { validarEmailAutentico } from "@/lib/email-validation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

type StatusFilter = "todos" | "liberados" | "pendentes" | "com_custo";
const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

const SERVICE_LABELS: Record<string, string> = {
  apify_maps: "Apify · Maps",
  apify_instagram: "Apify · Instagram",
  openai_enrichment: "OpenAI · Enriquecimento",
  whatsapp_evolution: "WhatsApp · Evolution",
  geoapify_free: "Geoapify",
  osm_free: "OpenStreetMap",
};

function usd(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: value < 1 ? 4 : 2,
    maximumFractionDigits: value < 1 ? 4 : 2,
  });
}

function compact(value: number | null | undefined): string {
  if (value === null || value === undefined) return "Ilimitado";
  return Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 }).format(
    value,
  );
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "Sem atividade rastreada";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function serviceLabel(service: string): string {
  return SERVICE_LABELS[service] ?? service.replaceAll("_", " ");
}

function userPlan(user: UsuarioPlataforma, plans: Plano[]): Plano | undefined {
  return plans.find((plan) => plan.id === user.plano_id);
}

function usagePercent(used: number, limit: number | null | undefined): number {
  if (!limit || limit <= 0) return 0;
  return Math.min(100, (used / limit) * 100);
}

function KpiCard({
  icon: Icon,
  label,
  value,
  detail,
  alert = false,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  detail: string;
  alert?: boolean;
}) {
  return (
    <Card className={cn("shadow-sm", alert && "border-destructive/40")}>
      <CardContent className="flex items-start justify-between p-5">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p
            className={cn(
              "mt-2 text-2xl font-semibold tracking-tight",
              alert && "text-destructive",
            )}
          >
            {value}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
        </div>
        <div
          className={cn(
            "rounded-lg bg-primary/10 p-2.5 text-primary",
            alert && "bg-destructive/10 text-destructive",
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ user }: { user: UsuarioPlataforma }) {
  if (user.is_super_admin)
    return (
      <Badge variant="secondary">
        <ShieldCheck className="mr-1 h-3 w-3" />
        Super admin
      </Badge>
    );
  if (user.acesso_liberado)
    return (
      <Badge>
        <CheckCircle2 className="mr-1 h-3 w-3" />
        Liberado
      </Badge>
    );
  return (
    <Badge variant="outline">
      <Clock3 className="mr-1 h-3 w-3" />
      Pendente
    </Badge>
  );
}

function UsageCell({ user, plan }: { user: UsuarioPlataforma; plan?: Plano }) {
  const leadLimit = user.leads_override ?? plan?.limite_leads;
  const siteLimit = user.sites_override ?? plan?.limite_sites;
  return (
    <div className="min-w-44 space-y-2">
      <div>
        <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
          <span>Leads</span>
          <span>
            {compact(user.operacao.consumo_mes.leads)} / {compact(leadLimit)}
          </span>
        </div>
        <Progress
          value={usagePercent(user.operacao.consumo_mes.leads, leadLimit)}
          className="h-1.5"
        />
      </div>
      <div className="flex gap-3 text-[11px] text-muted-foreground">
        <span>
          {user.operacao.consumo_mes.sites}/{compact(siteLimit)} sites
        </span>
        <span>
          {user.operacao.consumo_mes.campanhas}/{compact(plan?.limite_campanhas)} campanhas
        </span>
      </div>
    </div>
  );
}

function PlanDetails({ user, plan }: { user: UsuarioPlataforma; plan?: Plano }) {
  const limits = [
    ["Leads", user.leads_override ?? plan?.limite_leads],
    ["Sites IA", user.sites_override ?? plan?.limite_sites],
    ["Campanhas", plan?.limite_campanhas],
    ["Mensagens", plan?.limite_mensagens],
    ["WhatsApp", plan?.limite_whatsapp],
    ["Templates", plan?.limite_templates],
  ] as const;
  const features = [
    ["Instagram", plan?.has_instagram_search],
    ["LinkedIn", plan?.has_linkedin_search],
    ["WhatsApp", plan?.has_whatsapp],
    ["Propostas", plan?.has_propostas],
    ["Contratos", plan?.has_contratos],
    ["Financeiro", plan?.has_financeiro],
    ["Redesign", plan?.has_redesign],
    ["Publicação", plan?.has_publicar],
  ] as const;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {limits.map(([label, value]) => (
          <div key={label} className="rounded-lg border bg-muted/30 p-3">
            <p className="text-[11px] text-muted-foreground">{label}</p>
            <p className="mt-1 text-sm font-semibold">{compact(value)}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {features.map(([label, enabled]) => (
          <Badge
            key={label}
            variant={enabled ? "default" : "outline"}
            className={cn(!enabled && "text-muted-foreground")}
          >
            {label}: {enabled ? "incluído" : "não incluído"}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function UserDetailsDialog({
  user,
  plan,
  open,
  onOpenChange,
}: {
  user: UsuarioPlataforma | null;
  plan?: Plano;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!user) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserRound className="h-5 w-5 text-primary" />
            {user.full_name || user.email}
          </DialogTitle>
          <DialogDescription>
            {user.email} · {user.org_nome || "Sem organização"} · cadastrado em{" "}
            {formatDate(user.created_at)}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Custo hoje</p>
            <p className="mt-1 font-semibold">{usd(user.operacao.custo_hoje_usd)}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Custo no mês</p>
            <p className="mt-1 font-semibold">{usd(user.operacao.custo_mes_usd)}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Requisições</p>
            <p className="mt-1 font-semibold">
              {user.operacao.requisicoes_mes.toLocaleString("pt-BR")}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">WhatsApp</p>
            <p className="mt-1 font-semibold">
              {user.operacao.whatsapp.conectados}/{user.operacao.whatsapp.total} conectados
            </p>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
          <Card className="shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Custo de API · últimos 14 dias</CardTitle>
            </CardHeader>
            <CardContent>
              {user.operacao.serie_14d.some((item) => item.custo_usd > 0) ? (
                <ChartContainer
                  config={{ custo: { label: "Custo", color: "var(--primary)" } }}
                  className="h-52 w-full"
                >
                  <LineChart data={user.operacao.serie_14d} margin={{ left: 4, right: 12 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="data"
                      tickFormatter={(value) => String(value).slice(5)}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tickFormatter={(value) => `$${Number(value).toFixed(2)}`}
                      width={48}
                      tickLine={false}
                      axisLine={false}
                    />
                    <ChartTooltip
                      content={<ChartTooltipContent formatter={(value) => usd(Number(value))} />}
                    />
                    <Line
                      type="monotone"
                      dataKey="custo_usd"
                      name="custo"
                      stroke="var(--color-custo)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ChartContainer>
              ) : (
                <p className="flex h-52 items-center justify-center text-sm text-muted-foreground">
                  Sem custo registrado no período.
                </p>
              )}
            </CardContent>
          </Card>
          <Card className="shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Serviços consumidos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {user.operacao.servicos.length ? (
                user.operacao.servicos.map((service) => (
                  <div
                    key={service.service}
                    className="flex items-center justify-between gap-3 border-b pb-2 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium capitalize">
                        {serviceLabel(service.service)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {service.requests_count} requisições · {service.quantity} itens
                      </p>
                    </div>
                    <p className="text-sm font-semibold">{usd(service.cost_usd)}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhum consumo de API atribuído neste mês.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">
              Plano {user.plano_nome || user.plan || "não definido"}
            </CardTitle>
            <CardDescription>
              {plan
                ? `${plan.periodo} · R$ ${plan.preco.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                : "Catálogo não vinculado à organização"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PlanDetails user={user} plan={plan} />
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Números WhatsApp</CardTitle>
            <CardDescription>Instâncias vinculadas diretamente a esta conta.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            {user.operacao.whatsapp.numeros.length ? (
              user.operacao.whatsapp.numeros.map((number) => (
                <div
                  key={number.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{number.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {number.numero || "Número ainda não pareado"}
                    </p>
                  </div>
                  <Badge variant={number.status === "conectado" ? "default" : "outline"}>
                    {number.status}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma instância vinculada.</p>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground">
          Última atividade rastreada: {formatDate(user.operacao.ultima_atividade?.em)}
          {user.operacao.ultima_atividade
            ? ` · ${serviceLabel(user.operacao.ultima_atividade.servico)} · ${user.operacao.ultima_atividade.acao}`
            : ""}
          . Esta visão mostra recursos instrumentados; cliques sem telemetria não são inventados.
        </p>
      </DialogContent>
    </Dialog>
  );
}

function UserAnalyticsPanel({
  resumo,
  topConsumers,
  onOpenUser,
}: {
  resumo?: OperacaoUsuariosResumo;
  topConsumers: UsuarioPlataforma[];
  onOpenUser: (user: UsuarioPlataforma) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex w-full items-center justify-between gap-4 p-5 text-left",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="rounded-lg bg-primary/10 p-2 text-primary">
                <BarChart3 className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block font-semibold">Análise de consumo</span>
                <span className="block truncate text-xs text-muted-foreground">
                  Tendência dos últimos 14 dias e maiores consumidores do mês
                </span>
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
              {open ? "Ocultar" : "Ver análise"}
              <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
            </span>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="grid gap-4 border-t pt-5 xl:grid-cols-[1.6fr_1fr]">
            <div className="rounded-xl border border-border p-4">
              <h3 className="text-sm font-semibold">Custo diário atribuído</h3>
              <p className="text-xs text-muted-foreground">
                Últimos 14 dias, apenas registros locais do livro-caixa.
              </p>
              <ChartContainer
                config={{ custo: { label: "Custo API", color: "var(--primary)" } }}
                className="mt-3 h-56 w-full"
              >
                <AreaChart data={resumo?.serie_14d ?? []} margin={{ left: 4, right: 12 }}>
                  <defs>
                    <linearGradient id="admin-user-cost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-custo)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-custo)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="data"
                    tickFormatter={(value) => String(value).slice(5)}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tickFormatter={(value) => `$${Number(value).toFixed(2)}`}
                    width={48}
                    tickLine={false}
                    axisLine={false}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent formatter={(value) => usd(Number(value))} />}
                  />
                  <Area
                    type="monotone"
                    dataKey="custo_usd"
                    name="custo"
                    stroke="var(--color-custo)"
                    fill="url(#admin-user-cost)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            </div>
            <div className="rounded-xl border border-border p-4">
              <h3 className="text-sm font-semibold">Maiores consumidores do mês</h3>
              <p className="text-xs text-muted-foreground">
                Clique em uma conta para ver os detalhes.
              </p>
              <div className="mt-3 space-y-1">
                {topConsumers.map((user, index) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => onOpenUser(user)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg p-2.5 text-left",
                      "hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    )}
                  >
                    <span className="flex size-7 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {user.full_name || user.email}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {user.operacao.requisicoes_mes} requisições
                      </span>
                    </span>
                    <span className="text-sm font-semibold">
                      {usd(user.operacao.custo_mes_usd)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export function AdminUserOperations({
  usuarios,
  planos,
  resumo,
  onMudou,
}: {
  usuarios: UsuarioPlataforma[];
  planos: Plano[];
  resumo?: OperacaoUsuariosResumo;
  onMudou: () => void;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("todos");
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detailUser, setDetailUser] = useState<UsuarioPlataforma | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTargets, setDeleteTargets] = useState<UsuarioPlataforma[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [accessUser, setAccessUser] = useState<UsuarioPlataforma | null>(null);
  const [accessPlanId, setAccessPlanId] = useState("");
  const [busy, setBusy] = useState(false);
  const [rowBusy, setRowBusy] = useState<string | null>(null);

  const activePlans = useMemo(() => planos.filter((plan) => plan.ativo), [planos]);
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-BR");
    return usuarios.filter((user) => {
      if (
        query &&
        !`${user.full_name ?? ""} ${user.email} ${user.org_nome ?? ""}`
          .toLocaleLowerCase("pt-BR")
          .includes(query)
      )
        return false;
      if (filter === "liberados") return user.acesso_liberado && !user.is_super_admin;
      if (filter === "pendentes") return !user.acesso_liberado && !user.is_super_admin;
      if (filter === "com_custo") return user.operacao.custo_mes_usd > 0;
      return true;
    });
  }, [filter, search, usuarios]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.min(currentPage, totalPages);
  const pageStart = (page - 1) * pageSize;
  const paginatedUsers = filtered.slice(pageStart, pageStart + pageSize);
  const selectable = paginatedUsers.filter((user) => !user.acesso_liberado && !user.is_super_admin);
  const selectedUsers = usuarios.filter((user) => selected.has(user.id));
  const allSelected = selectable.length > 0 && selectable.every((user) => selected.has(user.id));
  const topConsumers = [...usuarios]
    .sort((a, b) => b.operacao.custo_mes_usd - a.operacao.custo_mes_usd)
    .slice(0, 5);
  const visibleStart = filtered.length ? pageStart + 1 : 0;
  const visibleEnd = Math.min(pageStart + paginatedUsers.length, filtered.length);

  const toggle = (id: string, checked: boolean) =>
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  const toggleAll = (checked: boolean) =>
    setSelected((current) => {
      const next = new Set(current);
      for (const user of selectable) {
        if (checked) next.add(user.id);
        else next.delete(user.id);
      }
      return next;
    });

  const addUser = async () => {
    const validation = validarEmailAutentico(newEmail);
    if (!validation.valido) return toast.error(validation.motivo ?? "Informe um e-mail válido.");
    setBusy(true);
    try {
      const result = await adminAcao("user_add", { email: newEmail.trim() });
      if (!result.ok)
        return toast.error(result.detalhe ?? result.reason ?? "Não foi possível criar a conta.");
      toast.success("Conta criada e liberada.");
      setAddOpen(false);
      setNewEmail("");
      onMudou();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao criar conta.");
    } finally {
      setBusy(false);
    }
  };

  const changeAccess = async (user: UsuarioPlataforma, enabled: boolean, planId?: string) => {
    setRowBusy(user.id);
    try {
      const result = await adminAcao("user_access_set", {
        user_id: user.id,
        liberado: enabled,
        ...(planId ? { plano_id: planId } : {}),
      });
      if (!result.ok)
        return toast.error(result.detalhe ?? result.reason ?? "Não foi possível alterar o acesso.");
      toast.success(enabled ? "Acesso liberado." : "Acesso bloqueado.");
      setAccessUser(null);
      onMudou();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao alterar acesso.");
    } finally {
      setRowBusy(null);
    }
  };

  const openBulkDelete = () => {
    setDeleteTargets(selectedUsers);
    setDeleteConfirm("");
    setDeleteOpen(true);
  };

  const deleteSingleUser = (user: UsuarioPlataforma) => {
    setDeleteTargets([user]);
    setDeleteConfirm("");
    setDeleteOpen(true);
  };

  const deleteUsers = async () => {
    if (!deleteTargets.length) return;
    setBusy(true);
    try {
      const result =
        deleteTargets.length === 1
          ? await adminAcao("user_delete", { user_id: deleteTargets[0].id })
          : await adminAcao("users_delete_bulk", {
              user_ids: deleteTargets.map((user) => user.id),
            });
      const deleted = Number(result.deleted ?? 0);
      const blocked = Number(result.blocked ?? 0);
      const failed = Number(result.failed ?? 0);
      if (deleted)
        toast.success(
          `${deleted} conta${deleted === 1 ? "" : "s"} excluída${deleted === 1 ? "" : "s"}.`,
        );
      if (blocked)
        toast.warning(
          `${blocked} conta${blocked === 1 ? " está" : "s estão"} protegida${blocked === 1 ? "" : "s"}. Bloqueie o acesso e preserve o histórico quando houver dados.`,
        );
      if (failed) toast.error(`${failed} exclusão${failed === 1 ? " falhou" : "ões falharam"}.`);
      const targetIds = new Set(deleteTargets.map((user) => user.id));
      setSelected((current) => new Set([...current].filter((id) => !targetIds.has(id))));
      setDeleteOpen(false);
      setDeleteTargets([]);
      setDeleteConfirm("");
      onMudou();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro na exclusão em lote.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
            <Activity className="h-4 w-4" />
            Operação da plataforma
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Usuários, custos e uso de recursos
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Acompanhe plano, consumo real de APIs, cotas mensais e conexões WhatsApp por conta.
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar usuário
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={CircleDollarSign}
          label="Custo hoje"
          value={usd(resumo?.custo_hoje_usd ?? 0)}
          detail={`${resumo?.usuarios_com_custo_hoje ?? 0} usuários consumiram API`}
          alert={(resumo?.custo_hoje_usd ?? 0) >= 2}
        />
        <KpiCard
          icon={BarChart3}
          label="Custo no mês"
          value={usd(resumo?.custo_mes_usd ?? 0)}
          detail={`${usd(resumo?.custo_nao_atribuido_usd ?? 0)} ainda sem usuário`}
        />
        <KpiCard
          icon={MessageCircle}
          label="WhatsApp conectado"
          value={`${resumo?.whatsapp_conectados ?? 0} / ${resumo?.whatsapp_total ?? 0}`}
          detail="números pareados / instâncias"
        />
        <KpiCard
          icon={Users}
          label="Base cadastrada"
          value={usuarios.length.toLocaleString("pt-BR")}
          detail={`${usuarios.filter((user) => !user.acesso_liberado && !user.is_super_admin).length} contas pendentes`}
        />
      </div>

      <UserAnalyticsPanel resumo={resumo} topConsumers={topConsumers} onOpenUser={setDetailUser} />

      <Card>
        <CardHeader className="gap-4 border-b pb-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <div>
            <CardTitle className="text-base">Contas da plataforma</CardTitle>
            <CardDescription>
              Consulte cada conta, exclua individualmente ou selecione pendentes para exclusão em
              lote com validação de segurança.
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Buscar nome, e-mail ou organização"
                className="w-full pl-9 sm:w-72"
              />
            </div>
            <select
              value={filter}
              onChange={(event) => {
                setFilter(event.target.value as StatusFilter);
                setCurrentPage(1);
              }}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              aria-label="Filtrar usuários"
            >
              <option value="todos">Todos</option>
              <option value="liberados">Liberados</option>
              <option value="pendentes">Pendentes</option>
              <option value="com_custo">Com custo no mês</option>
            </select>
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value) as (typeof PAGE_SIZE_OPTIONS)[number]);
                setCurrentPage(1);
              }}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              aria-label="Usuários por página"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size} por página
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        {selected.size > 0 && (
          <div className="flex flex-col justify-between gap-3 border-b bg-muted/40 px-5 py-3 sm:flex-row sm:items-center">
            <p className="text-sm">
              <strong>{selected.size}</strong> conta
              {selected.size === 1 ? " pendente selecionada" : "s pendentes selecionadas"}
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
                Limpar
              </Button>
              <Button variant="destructive" size="sm" onClick={openBulkDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir selecionadas
              </Button>
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-sm">
            <thead className="border-b bg-muted/30 text-left text-xs text-muted-foreground">
              <tr>
                <th className="w-12 px-5 py-3">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={(checked) => toggleAll(checked === true)}
                    aria-label="Selecionar todas as contas pendentes desta página"
                  />
                </th>
                <th className="px-3 py-3">Usuário</th>
                <th className="px-3 py-3">Plano e status</th>
                <th className="px-3 py-3">Uso mensal</th>
                <th className="px-3 py-3">API</th>
                <th className="px-3 py-3">WhatsApp</th>
                <th className="px-3 py-3">Atividade rastreada</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginatedUsers.map((user) => {
                const plan = userPlan(user, planos);
                const canSelect = !user.acesso_liberado && !user.is_super_admin;
                return (
                  <tr key={user.id} className="hover:bg-muted/20">
                    <td className="px-5 py-4">
                      <Checkbox
                        disabled={!canSelect}
                        checked={selected.has(user.id)}
                        onCheckedChange={(checked) => toggle(user.id, checked === true)}
                        aria-label={`Selecionar ${user.email}`}
                      />
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                          {(user.full_name || user.email).slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="max-w-64 truncate font-medium">
                            {user.full_name || user.email.split("@")[0]}
                          </p>
                          <p className="max-w-64 truncate text-xs text-muted-foreground">
                            {user.email}
                          </p>
                          <p className="max-w-64 truncate text-[11px] text-muted-foreground">
                            {user.org_nome || "Sem organização"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <div className="space-y-2">
                        <p className="font-medium">{user.plano_nome || user.plan || "Sem plano"}</p>
                        <StatusBadge user={user} />
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <UsageCell user={user} plan={plan} />
                    </td>
                    <td className="px-3 py-4">
                      <p
                        className={cn(
                          "font-semibold",
                          user.operacao.custo_hoje_usd > 0 && "text-destructive",
                        )}
                      >
                        {usd(user.operacao.custo_hoje_usd)} hoje
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {usd(user.operacao.custo_mes_usd)} · {user.operacao.requisicoes_mes} req.
                      </p>
                    </td>
                    <td className="px-3 py-4">
                      <p className="font-medium">
                        {user.operacao.whatsapp.conectados}/{user.operacao.whatsapp.total}{" "}
                        conectados
                      </p>
                      <p className="mt-1 max-w-40 truncate text-xs text-muted-foreground">
                        {user.operacao.whatsapp.numeros
                          .map((item) => item.numero)
                          .filter(Boolean)
                          .join(", ") || "Nenhum número"}
                      </p>
                    </td>
                    <td className="px-3 py-4">
                      <p className="text-xs">{formatDate(user.operacao.ultima_atividade?.em)}</p>
                      {user.operacao.ultima_atividade && (
                        <p className="mt-1 max-w-44 truncate text-[11px] text-muted-foreground">
                          {serviceLabel(user.operacao.ultima_atividade.servico)}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => setDetailUser(user)}>
                          Detalhes
                          <ChevronRight className="ml-1 h-3.5 w-3.5" />
                        </Button>
                        {!user.is_super_admin &&
                          (user.acesso_liberado ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={rowBusy === user.id}
                              onClick={() => changeAccess(user, false)}
                            >
                              {rowBusy === user.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Bloquear"
                              )}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              disabled={rowBusy === user.id}
                              onClick={() => {
                                setAccessUser(user);
                                setAccessPlanId(activePlans[0]?.id ?? "");
                              }}
                            >
                              Liberar
                            </Button>
                          ))}
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={!canSelect || rowBusy === user.id}
                          onClick={() => deleteSingleUser(user)}
                          aria-label={`Excluir conta de ${user.email}`}
                          title={
                            canSelect
                              ? "Excluir conta pendente"
                              : "Exclusão protegida: bloqueie a conta ou preserve o histórico"
                          }
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!filtered.length && (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-muted-foreground">
                    Nenhum usuário encontrado com esses filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 border-t px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Exibindo {visibleStart}–{visibleEnd} de {filtered.length} filtrados · {usuarios.length}{" "}
            no total. Contas com histórico e super admins são protegidos contra exclusão.
          </p>
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setCurrentPage((value) => Math.max(1, value - 1))}
              aria-label="Página anterior"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Anterior
            </Button>
            <span className="min-w-24 text-center text-xs font-medium text-foreground">
              Página {page} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setCurrentPage((value) => Math.min(totalPages, value + 1))}
              aria-label="Próxima página"
            >
              Próxima
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar usuário</DialogTitle>
            <DialogDescription>
              A conta criada pelo administrador nasce com acesso liberado e organização própria.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="new-user-email">E-mail profissional</Label>
            <Input
              id="new-user-email"
              type="email"
              value={newEmail}
              onChange={(event) => setNewEmail(event.target.value)}
              placeholder="nome@empresa.com"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancelar
            </Button>
            <Button disabled={busy} onClick={addUser}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Criar conta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(accessUser)} onOpenChange={(open) => !open && setAccessUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Liberar acesso</DialogTitle>
            <DialogDescription>
              Escolha o plano de {accessUser?.email}. O acesso e o vínculo do plano são aplicados
              juntos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="access-plan">Plano</Label>
            <select
              id="access-plan"
              value={accessPlanId}
              onChange={(event) => setAccessPlanId(event.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {activePlans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.nome} · R${" "}
                  {plan.preco.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAccessUser(null)}>
              Cancelar
            </Button>
            <Button
              disabled={!accessUser || !accessPlanId || rowBusy === accessUser?.id}
              onClick={() => accessUser && changeAccess(accessUser, true, accessPlanId)}
            >
              Liberar acesso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) {
            setDeleteTargets([]);
            setDeleteConfirm("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Excluir {deleteTargets.length} conta{deleteTargets.length === 1 ? "" : "s"}
            </DialogTitle>
            <DialogDescription>
              Somente contas pendentes e sem dados serão excluídas. Contas que já consumiram API,
              criaram leads, campanhas, sites ou WhatsApp serão bloqueadas automaticamente para
              preservar o histórico.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-32 overflow-y-auto rounded-lg border bg-muted/30 p-3 text-xs">
            {deleteTargets.map((user) => (
              <p key={user.id} className="truncate">
                {user.email}
              </p>
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="delete-confirm">Digite EXCLUIR para confirmar</Label>
            <Input
              id="delete-confirm"
              value={deleteConfirm}
              onChange={(event) => setDeleteConfirm(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={busy || deleteConfirm !== "EXCLUIR"}
              onClick={deleteUsers}
            >
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {deleteTargets.length === 1 ? "Excluir conta elegível" : "Excluir contas elegíveis"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UserDetailsDialog
        user={detailUser}
        plan={detailUser ? userPlan(detailUser, planos) : undefined}
        open={Boolean(detailUser)}
        onOpenChange={(open) => !open && setDetailUser(null)}
      />
    </div>
  );
}
