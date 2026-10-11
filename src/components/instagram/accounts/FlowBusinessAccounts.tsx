import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BadgeCheck,
  Bell,
  CheckCircle2,
  ChevronRight,
  CircleGauge,
  Database,
  EllipsisVertical,
  Instagram,
  KeyRound,
  Loader2,
  LockKeyhole,
  LogOut,
  Plug,
  Plus,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { planLimitLabel, planLimitProgress, planLimitReached } from "@/lib/flow-business-limits";
import {
  deleteInstagramSession,
  disconnectInstagramSession,
  startOfficialInstagramConnection,
  type FlowBusinessAccount,
  type FlowBusinessAutomationSnapshot,
  type FlowBusinessPlan,
  type FlowBusinessWorkspace,
} from "@/services/flow-business";

type SettingsTab = "accounts" | "integrations" | "limits" | "team" | "preferences" | "security";

interface FlowBusinessAccountsProps {
  workspace: FlowBusinessWorkspace;
  automation: FlowBusinessAutomationSnapshot | null;
  onConnected: () => Promise<void>;
}

const settingsTabs: Array<{
  id: SettingsTab;
  label: string;
  description: string;
  Icon: typeof Instagram;
}> = [
  {
    id: "accounts",
    label: "Contas do Instagram",
    description: "Gerencie suas contas",
    Icon: Instagram,
  },
  { id: "integrations", label: "Integrações", description: "Meta, Supabase e APIs", Icon: Plug },
  { id: "limits", label: "Limites e quotas", description: "Controle de uso", Icon: CircleGauge },
  { id: "team", label: "Equipe e permissões", description: "Gerencie sua equipe", Icon: Users },
  {
    id: "preferences",
    label: "Preferências",
    description: "Notificações e aparência",
    Icon: SlidersHorizontal,
  },
  { id: "security", label: "Segurança", description: "Acesso e privacidade", Icon: ShieldCheck },
];

export function FlowBusinessAccounts({
  workspace,
  automation,
  onConnected,
}: FlowBusinessAccountsProps) {
  const { accounts, plan } = workspace;
  const currentAccounts = accounts.filter((account) => account.provider !== "evolution_legacy");
  const connectedAccounts = currentAccounts.filter((account) => account.status === "conectado");
  const atLimit = planLimitReached(plan.used.accounts, plan.limits.accounts);
  const [activeTab, setActiveTab] = useState<SettingsTab>("accounts");
  const [startingConnection, setStartingConnection] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<FlowBusinessAccount | null>(null);
  const [accountAction, setAccountAction] = useState<{
    account: FlowBusinessAccount;
    action: "disconnect" | "delete";
  } | null>(null);
  const [changingAccount, setChangingAccount] = useState(false);

  useEffect(() => {
    const onSave = () => toast.info("Não há alterações pendentes nesta tela.");
    window.addEventListener("instagram-save-settings", onSave);
    return () => window.removeEventListener("instagram-save-settings", onSave);
  }, []);

  const metrics = useMemo(() => {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentCards = workspace.cards.filter(
      (card) => Date.parse(card.createdAt ?? card.updatedAt) >= cutoff,
    );
    const recentActivities = (workspace.activities ?? []).filter(
      (activity) => Date.parse(activity.occurredAt) >= cutoff,
    );
    const converted = workspace.cards.filter(
      (card) => card.stage === "cliente" && Date.parse(card.wonAt ?? card.updatedAt) >= cutoff,
    );
    return {
      actions: recentActivities.length + (automation?.usage.monthly ?? 0),
      leads: recentCards.length,
      conversations: recentActivities.filter((activity) =>
        /mensagem|contato|abord/i.test(`${activity.activityType} ${activity.title}`),
      ).length,
      clients: converted.length,
    };
  }, [automation?.usage.monthly, workspace.activities, workspace.cards]);

  const startConnection = async () => {
    if (atLimit) {
      toast.error("Limite de contas atingido no seu plano.");
      return;
    }
    setStartingConnection(true);
    try {
      const authorizationUrl = await startOfficialInstagramConnection();
      window.location.assign(authorizationUrl);
    } catch (error) {
      setStartingConnection(false);
      toast.error(
        error instanceof Error ? error.message : "Não foi possível iniciar a conexão do Instagram.",
      );
    }
  };

  const confirmAccountAction = async () => {
    if (!accountAction) return;
    setChangingAccount(true);
    try {
      if (accountAction.action === "disconnect") {
        await disconnectInstagramSession(accountAction.account.id);
        toast.success("Conta desconectada.");
      } else {
        await deleteInstagramSession(accountAction.account.id);
        toast.success("Conta removida.");
      }
      await onConnected();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível alterar esta conta.");
    } finally {
      setChangingAccount(false);
      setAccountAction(null);
    }
  };

  return (
    <div className="space-y-4 text-[#101828]">
      <SettingsHero metrics={metrics} connectedAccounts={connectedAccounts.length} />

      <nav
        className="grid gap-2 sm:grid-cols-2 xl:grid-cols-6"
        aria-label="Seções das configurações"
      >
        {settingsTabs.map(({ id, label, description, Icon }) => {
          const selected = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              aria-current={selected ? "page" : undefined}
              className={cn(
                "flex min-h-[62px] items-center gap-3 rounded-xl border bg-white px-3 text-left shadow-sm transition",
                selected
                  ? "border-[#F63384] bg-[#FFF5FA] ring-1 ring-[#F63384]/15"
                  : "border-slate-200 hover:border-slate-300",
              )}
            >
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-xl",
                  selected ? "bg-pink-100 text-[#F63384]" : "bg-blue-50 text-[#2563EB]",
                )}
              >
                <Icon className="size-5" />
              </span>
              <span className="min-w-0">
                <span
                  className={cn("block truncate text-xs font-bold", selected && "text-[#F21C73]")}
                >
                  {label}
                </span>
                <span
                  className={cn(
                    "mt-0.5 block truncate text-[10px]",
                    selected ? "text-[#F63384]" : "text-slate-500",
                  )}
                >
                  {description}
                </span>
              </span>
            </button>
          );
        })}
      </nav>

      {activeTab === "accounts" ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
          <AccountsPanel
            accounts={currentAccounts}
            atLimit={atLimit}
            startingConnection={startingConnection}
            busy={changingAccount}
            onConnect={() => void startConnection()}
            onConfigure={setSelectedAccount}
            onDisconnect={(account) => setAccountAction({ account, action: "disconnect" })}
            onDelete={(account) => setAccountAction({ account, action: "delete" })}
          />
          <div className="space-y-4">
            <IntegrationsCard
              accounts={currentAccounts}
              onOpen={() => setActiveTab("integrations")}
            />
            <LimitsCard plan={plan} onOpen={() => setActiveTab("limits")} />
          </div>
        </div>
      ) : null}

      {activeTab === "integrations" ? <IntegrationsView accounts={currentAccounts} /> : null}
      {activeTab === "limits" ? <LimitsView plan={plan} automation={automation} /> : null}
      {activeTab === "team" ? (
        <UnavailablePanel
          Icon={Users}
          title="Equipe e permissões"
          description="A gestão de membros ainda não possui persistência própria nesta área. Nenhuma permissão fictícia foi criada."
        />
      ) : null}
      {activeTab === "preferences" ? <PreferencesView automation={automation} /> : null}
      {activeTab === "security" ? <SecurityView accounts={currentAccounts} /> : null}

      <Dialog
        open={selectedAccount !== null}
        onOpenChange={(open) => !open && setSelectedAccount(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes da conexão</DialogTitle>
            <DialogDescription>Informações retornadas pelo provedor desta conta.</DialogDescription>
          </DialogHeader>
          {selectedAccount ? <AccountDetails account={selectedAccount} /> : null}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={accountAction !== null}
        onOpenChange={(open) => !open && !changingAccount && setAccountAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {accountAction?.action === "disconnect"
                ? "Desconectar esta conta?"
                : "Excluir esta conta?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {accountAction?.action === "disconnect"
                ? "A conexão será encerrada e as automações desta conta serão pausadas. Você poderá conectá-la novamente."
                : "A conexão será removida do Flow Business. Seus leads e listas não serão apagados."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={changingAccount}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={changingAccount}
              onClick={(event) => {
                event.preventDefault();
                void confirmAccountAction();
              }}
              className={
                accountAction?.action === "delete"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : undefined
              }
            >
              {changingAccount ? <Loader2 className="size-4 animate-spin" /> : null}
              {accountAction?.action === "disconnect" ? "Desconectar" : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SettingsHero({
  metrics,
  connectedAccounts,
}: {
  metrics: { actions: number; leads: number; conversations: number; clients: number };
  connectedAccounts: number;
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-[#D977F3]/70 bg-[linear-gradient(110deg,#fffdf8_0%,#fff4f5_35%,#faedff_72%,#f4f0ff_100%)] px-6 py-5 shadow-sm sm:px-8">
      <div className="pointer-events-none absolute left-[47%] top-1/2 hidden size-56 -translate-y-1/2 rounded-full border border-fuchsia-300/30 xl:block" />
      <div className="pointer-events-none absolute left-[50%] top-1/2 hidden size-40 -translate-y-1/2 rounded-full border border-fuchsia-300/30 xl:block" />
      <div className="grid items-center gap-5 lg:grid-cols-[1.2fr_.78fr_1fr]">
        <div className="relative z-10 py-1">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#F21C73]">
            Tudo sob controle
          </p>
          <h2 className="mt-3 max-w-[560px] text-3xl font-extrabold leading-[1.05] tracking-[-0.04em] text-[#101828] sm:text-[38px]">
            Conecte, configure
            <br />e potencialize{" "}
            <span className="bg-gradient-to-r from-[#FF7048] via-[#F63384] to-[#C22EF1] bg-clip-text text-transparent">
              sua operação.
            </span>
          </h2>
          <p className="mt-2 max-w-[520px] text-sm leading-5 text-[#52698F]">
            Gerencie suas contas do Instagram, integrações, limites e preferências para uma
            prospecção mais segura e eficiente.
          </p>
        </div>

        <div
          className="relative hidden min-h-[180px] items-center justify-center lg:flex"
          aria-hidden="true"
        >
          <div className="absolute left-0 top-2 -rotate-6 rounded-xl border border-white/80 bg-white/90 px-4 py-2.5 shadow-lg">
            <p className="text-[9px] text-slate-500">Contas conectadas</p>
            <p className="text-sm font-bold">
              {connectedAccounts} {connectedAccounts === 1 ? "ativa" : "ativas"}
            </p>
          </div>
          <div className="relative z-10 flex size-[92px] items-center justify-center rounded-[26px] bg-gradient-to-tr from-[#FF8A3D] via-[#FF176B] to-[#A62CFF] text-white shadow-[0_18px_40px_rgba(233,30,151,.35)]">
            <Instagram className="size-12" strokeWidth={2.1} />
          </div>
          <div className="absolute right-0 top-5 rotate-6 rounded-xl border border-white/80 bg-white/90 px-4 py-2.5 shadow-lg">
            <p className="text-[9px] text-slate-500">Integrações</p>
            <p className="text-xs font-bold">Meta + Supabase</p>
          </div>
          <div className="absolute bottom-0 left-5 -rotate-3 rounded-xl border border-white/80 bg-white/90 px-4 py-2.5 shadow-lg">
            <p className="text-[9px] text-slate-500">Segurança</p>
            <p className="text-xs font-bold">Conexão protegida</p>
          </div>
        </div>

        <div className="relative z-10 rounded-xl border border-white/80 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#F21C73]">
              Uso da operação
            </p>
            <span className="rounded-md border border-slate-200 px-2 py-1 text-[9px] text-slate-600">
              Últimos 30 dias
            </span>
          </div>
          <div className="mt-4 grid grid-cols-4 divide-x divide-slate-200">
            {[
              [metrics.actions, "Ações registradas"],
              [metrics.leads, "Leads encontrados"],
              [metrics.conversations, "Conversas iniciadas"],
              [metrics.clients, "Clientes convertidos"],
            ].map(([value, label]) => (
              <div key={String(label)} className="px-2 first:pl-0">
                <strong className="block text-xl font-extrabold">{value}</strong>
                <span className="mt-1 block text-[9px] leading-3 text-[#667085]">{label}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center justify-between text-[10px]">
            <span className="font-semibold text-slate-700">Limite oficial da Meta</span>
            <span className="font-semibold text-slate-500">Não disponível</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-slate-200">
            <div className="h-full w-0 rounded-full bg-emerald-500" />
          </div>
          <p className="mt-3 text-right text-[9px] text-slate-500">
            A API conectada não informa essa cota.
          </p>
        </div>
      </div>
    </section>
  );
}

function AccountsPanel({
  accounts,
  atLimit,
  startingConnection,
  busy,
  onConnect,
  onConfigure,
  onDisconnect,
  onDelete,
}: {
  accounts: FlowBusinessAccount[];
  atLimit: boolean;
  startingConnection: boolean;
  busy: boolean;
  onConnect: () => void;
  onConfigure: (account: FlowBusinessAccount) => void;
  onDisconnect: (account: FlowBusinessAccount) => void;
  onDelete: (account: FlowBusinessAccount) => void;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            <Settings2 className="size-5" />
          </span>
          <div>
            <h3 className="font-bold">Suas contas do Instagram</h3>
            <p className="text-xs text-slate-500">
              Conecte e gerencie as contas usadas na prospecção. Sua senha não é solicitada pelo
              Flow Business.
            </p>
          </div>
        </div>
        <Button
          className="gap-2 bg-[#1464F6] hover:bg-[#0E54D8]"
          disabled={startingConnection || atLimit}
          onClick={onConnect}
        >
          {startingConnection ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          Conectar nova conta
        </Button>
      </header>
      {accounts.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
          <Instagram className="size-9 text-slate-300" />
          <h4 className="mt-3 font-semibold">Nenhuma conta conectada</h4>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            Conecte uma conta profissional pela autenticação oficial da Meta para começar.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {accounts.map((account) => (
            <AccountRow
              key={account.id}
              account={account}
              busy={busy}
              onConfigure={() => onConfigure(account)}
              onReconnect={onConnect}
              onDisconnect={() => onDisconnect(account)}
              onDelete={() => onDelete(account)}
            />
          ))}
        </div>
      )}
      {atLimit ? (
        <p className="border-t border-slate-100 px-5 py-3 text-xs text-amber-700">
          Limite de contas atingido no plano atual.
        </p>
      ) : null}
    </section>
  );
}

function AccountRow({
  account,
  busy,
  onConfigure,
  onReconnect,
  onDisconnect,
  onDelete,
}: {
  account: FlowBusinessAccount;
  busy: boolean;
  onConfigure: () => void;
  onReconnect: () => void;
  onDisconnect: () => void;
  onDelete: () => void;
}) {
  const connected = account.status === "conectado";
  const suspended = /suspens/i.test(account.status);
  const initials = (account.name || account.username || "IG").slice(0, 2).toUpperCase();
  return (
    <article className="grid gap-4 px-5 py-4 sm:grid-cols-[minmax(230px,1.6fr)_1fr_auto] sm:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <div className="rounded-full bg-gradient-to-tr from-[#FF8A3D] via-[#FF176B] to-[#A62CFF] p-[3px]">
          <Avatar className="size-12 border-2 border-white">
            <AvatarImage src={account.profilePictureUrl ?? undefined} alt={account.name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className="truncate text-sm font-bold">{account.name}</h4>
            {account.provider === "meta_official" ? (
              <BadgeCheck className="size-4 shrink-0 fill-[#1677FF] text-white" />
            ) : null}
          </div>
          <p className="truncate text-xs text-[#52698F]">
            {account.username ? `@${account.username}` : "Usuário não informado"}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4 sm:justify-between">
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[10px] font-semibold",
            connected
              ? "bg-emerald-50 text-emerald-600"
              : suspended
                ? "bg-orange-50 text-orange-600"
                : "bg-rose-50 text-rose-600",
          )}
        >
          <span className="mr-1">●</span>
          {connected ? "Conectada" : suspended ? "Suspensa" : "Desconectada"}
        </span>
        <div className="hidden grid-cols-3 gap-8 text-xs lg:grid">
          <Stat value="—" label="seguidores" />
          <Stat value="—" label="seguindo" />
          <Stat value="—" label="postagens" />
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Switch
          checked={connected}
          disabled
          aria-label={`Estado da conta ${account.name}`}
          title="O estado é controlado pela conexão do provedor"
        />
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={connected ? onConfigure : onReconnect}
        >
          {connected ? "Configurar" : "Reconectar"}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="outline" aria-label={`Ações de ${account.name}`}>
              <EllipsisVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onConfigure}>
              <Settings2 className="size-4" />
              Ver detalhes
            </DropdownMenuItem>
            {connected ? (
              <DropdownMenuItem onClick={onDisconnect}>
                <LogOut className="size-4" />
                Desconectar
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="size-4" />
              Excluir conexão
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </article>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <strong className="block text-sm">{value}</strong>
      <span className="text-[10px] text-[#52698F]" title="Dado não retornado pela conexão atual">
        {label}
      </span>
    </div>
  );
}

function IntegrationsCard({
  accounts,
  onOpen,
}: {
  accounts: FlowBusinessAccount[];
  onOpen: () => void;
}) {
  const metaConnected = accounts.some(
    (account) => account.provider === "meta_official" && account.status === "conectado",
  );
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <header className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Plug className="size-4" />
          </span>
          <h3 className="text-sm font-bold">Status das integrações</h3>
        </div>
        <span className="rounded-full bg-amber-50 px-2 py-1 text-[9px] font-semibold text-amber-700">
          Verificação parcial
        </span>
      </header>
      <IntegrationRow
        mark="∞"
        name="Meta (Instagram)"
        detail={metaConnected ? "Conexão autenticada · conta ativa" : "Nenhuma conta ativa"}
        connected={metaConnected}
      />
      <IntegrationRow
        mark="◆"
        name="Supabase"
        detail="Banco de dados · sincronização ativa"
        connected
      />
      <IntegrationRow mark="AI" name="OpenAI" detail="Status não exposto ao cliente" />
      <IntegrationRow mark="A" name="Apify" detail="Saúde não consultada nesta tela" />
      <Button variant="ghost" size="sm" className="mt-2 w-full text-blue-600" onClick={onOpen}>
        Ver integrações <ChevronRight className="size-4" />
      </Button>
    </section>
  );
}

function IntegrationRow({
  mark,
  name,
  detail,
  connected,
}: {
  mark: string;
  name: string;
  detail: string;
  connected?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-100 py-3 last:border-0">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-sm font-black text-blue-600">
        {mark}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-xs font-bold">{name}</p>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[9px] font-medium",
              connected === true
                ? "bg-emerald-50 text-emerald-600"
                : connected === false
                  ? "bg-rose-50 text-rose-600"
                  : "bg-slate-100 text-slate-500",
            )}
          >
            {connected === true
              ? "✓ Conectado"
              : connected === false
                ? "Desconectado"
                : "Não verificado"}
          </span>
        </div>
        <p className="truncate text-[10px] text-slate-500">{detail}</p>
      </div>
      <ChevronRight className="size-4 text-slate-400" />
    </div>
  );
}

function LimitsCard({ plan, onOpen }: { plan: FlowBusinessPlan; onOpen: () => void }) {
  const rows = [
    ["Contatos no CRM", plan.used.crmContacts, plan.limits.crmContacts],
    ["Contas conectadas", plan.used.accounts, plan.limits.accounts],
    ["Cadências", plan.used.cadences, plan.limits.cadences],
    ["Fluxos", plan.used.flows, plan.limits.flows],
  ] as const;
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <header className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CircleGauge className="size-4 text-blue-600" />
          <h3 className="text-sm font-bold">Limites e uso da operação</h3>
        </div>
        <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={onOpen}>
          Ver detalhes
        </Button>
      </header>
      {rows.map(([label, used, limit]) => (
        <LimitRow key={label} label={label} used={used} limit={limit} />
      ))}
      <p className="mt-2 text-[9px] text-slate-500">Cotas internas do plano Flow Business.</p>
    </section>
  );
}

function LimitRow({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  return (
    <div className="grid grid-cols-[120px_1fr_auto] items-center gap-2 py-2 text-[10px]">
      <span className="truncate text-slate-700">{label}</span>
      <Progress value={planLimitProgress(used, limit)} className="h-2" />
      <span className="min-w-14 text-right font-semibold text-blue-600">
        {planLimitLabel(used, limit)}
      </span>
    </div>
  );
}

function IntegrationsView({ accounts }: { accounts: FlowBusinessAccount[] }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <Plug className="size-5 text-blue-600" />
        <div>
          <h3 className="font-bold">Integrações da operação</h3>
          <p className="text-xs text-slate-500">
            Estados confirmados pelo cliente e pelas conexões registradas.
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <IntegrationsCard accounts={accounts} onOpen={() => undefined} />
        <div className="rounded-xl border border-slate-200 p-5">
          <h4 className="text-sm font-bold">Critério de saúde</h4>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Meta é confirmada pelas contas oficiais ativas. Supabase está operacional porque estes
            dados foram carregados nesta sessão. Chaves privadas de OpenAI e Apify não são expostas
            ao navegador e, por segurança, aparecem como não verificadas.
          </p>
        </div>
      </div>
    </section>
  );
}

function LimitsView({
  plan,
  automation,
}: {
  plan: FlowBusinessPlan;
  automation: FlowBusinessAutomationSnapshot | null;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <CircleGauge className="size-5 text-blue-600" />
        <div>
          <h3 className="font-bold">Limites e quotas reais</h3>
          <p className="text-xs text-slate-500">Uso interno do plano e automações registradas.</p>
        </div>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <LimitsCard plan={plan} onOpen={() => undefined} />
        <div className="rounded-xl border border-slate-200 p-5">
          <h4 className="text-sm font-bold">Automações</h4>
          <div className="mt-4 space-y-4">
            <LimitRow
              label="Uso mensal"
              used={automation?.usage.monthly ?? 0}
              limit={automation?.limits.monthly ?? null}
            />
            <LimitRow
              label="Uso diário"
              used={automation?.usage.daily ?? 0}
              limit={automation?.limits.daily ?? null}
            />
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Intervalo do monitor: {automation?.limits.monitorMinutes ?? "—"} min. Cotas oficiais da
            Meta não estão disponíveis neste retorno.
          </p>
        </div>
      </div>
    </section>
  );
}

function PreferencesView({ automation }: { automation: FlowBusinessAutomationSnapshot | null }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <Bell className="size-5 text-purple-600" />
        <div>
          <h3 className="font-bold">Preferências operacionais</h3>
          <p className="text-xs text-slate-500">
            Configurações efetivamente disponíveis nesta operação.
          </p>
        </div>
      </div>
      <div className="mt-5 rounded-xl border border-slate-200 p-5">
        <p className="text-sm font-semibold">Monitoramento de automações</p>
        <p className="mt-1 text-xs text-slate-500">
          Verificação a cada {automation?.limits.monitorMinutes ?? "—"} minutos, definida pelo
          backend. Preferências de aparência e notificações ainda não possuem persistência própria.
        </p>
      </div>
    </section>
  );
}

function SecurityView({ accounts }: { accounts: FlowBusinessAccount[] }) {
  const connected = accounts.filter((account) => account.status === "conectado");
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <LockKeyhole className="size-5 text-blue-600" />
        <div>
          <h3 className="font-bold">Segurança e acesso</h3>
          <p className="text-xs text-slate-500">
            Conexões protegidas e permissões concedidas por provedor.
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <SecurityItem
          Icon={Database}
          title="Dados isolados"
          text="Acesso protegido pelas políticas da sua organização."
        />
        <SecurityItem
          Icon={KeyRound}
          title="OAuth Meta"
          text={`${connected.filter((account) => account.provider === "meta_official").length} conexão(ões) oficial(is) ativa(s).`}
        />
        <SecurityItem
          Icon={ShieldCheck}
          title="Permissões"
          text={`${new Set(connected.flatMap((account) => account.permissions)).size} permissão(ões) registradas.`}
        />
      </div>
    </section>
  );
}

function SecurityItem({
  Icon,
  title,
  text,
}: {
  Icon: typeof ShieldCheck;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <Icon className="size-5 text-emerald-600" />
      <h4 className="mt-3 text-sm font-bold">{title}</h4>
      <p className="mt-1 text-xs leading-5 text-slate-500">{text}</p>
    </div>
  );
}

function UnavailablePanel({
  Icon,
  title,
  description,
}: {
  Icon: typeof Users;
  title: string;
  description: string;
}) {
  return (
    <section className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <Icon className="size-6" />
      </span>
      <h3 className="mt-4 font-bold">{title}</h3>
      <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">{description}</p>
    </section>
  );
}

function AccountDetails({ account }: { account: FlowBusinessAccount }) {
  const rows = [
    ["Conexão", "Instagram"],
    ["Tipo de conta", account.accountType ?? "Não informado"],
    ["Conectada em", formatDate(account.connectedAt)],
    ["Último webhook", formatDate(account.lastWebhookAt)],
    [
      "Permissões",
      account.permissions.length ? account.permissions.join(", ") : "Nenhuma informada",
    ],
  ];
  return (
    <div className="space-y-2">
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="grid grid-cols-[120px_1fr] gap-3 rounded-lg bg-slate-50 p-3 text-sm"
        >
          <span className="text-slate-500">{label}</span>
          <span className="break-words font-medium">{value}</span>
        </div>
      ))}
      {account.errorMessage ? (
        <div className="flex gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {account.errorMessage}
        </div>
      ) : (
        <div className="flex gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          Nenhum erro registrado.
        </div>
      )}
    </div>
  );
}

function formatDate(value: string | null) {
  if (!value) return "Não registrado";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Não registrado"
    : new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);
}
