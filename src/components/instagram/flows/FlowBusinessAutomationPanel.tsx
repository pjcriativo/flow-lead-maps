import { Activity, Clock3, MessageCircleReply, Radio, ShieldCheck } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { FlowBusinessFlowBuilder } from "@/components/instagram/flows/FlowBusinessFlowBuilder";
import { planFeatureAvailable, planLimitLabel } from "@/lib/flow-business-limits";
import type {
  FlowBusinessAutomationSnapshot,
  FlowBusinessFlowDraft,
  FlowBusinessWorkspace,
} from "@/services/flow-business";

type Props = {
  workspace: FlowBusinessWorkspace;
  automation: FlowBusinessAutomationSnapshot;
  togglingAccountId: string | null;
  onToggle: (instanceId: string, enabled: boolean) => Promise<void>;
  onSave: (draft: FlowBusinessFlowDraft) => Promise<string>;
  onPublish: (flowId: string) => Promise<void>;
};

export function FlowBusinessAutomationPanel({
  workspace,
  automation,
  togglingAccountId,
  onToggle,
  onSave,
  onPublish,
}: Props) {
  const sessionAccounts = workspace.accounts.filter(
    (account) => account.provider === "session_worker" && account.status === "conectado",
  );
  const planAllowsAutomation = planFeatureAvailable(automation.limits.monthly);

  return (
    <section className="space-y-5">
      <div className="rounded-3xl border border-border bg-gradient-to-br from-card via-card to-instagram-pink/5 p-5 shadow-[var(--shadow-card)] sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-instagram-pink">
              <Radio className="size-4" />
              <span className="text-xs font-semibold uppercase tracking-[0.18em]">
                Conversão ativa
              </span>
            </div>
            <h2 className="mt-2 text-xl font-semibold">Comentários que viram oportunidades</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Detecte uma palavra-chave, responda no Direct uma única vez e organize o contato no
              CRM.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-success/20 bg-success/10 px-3 py-1.5 text-xs font-medium text-success">
            <ShieldCheck className="size-4" /> Proteção contra duplicidade
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Metric
            icon={MessageCircleReply}
            label="Respostas neste mês"
            value={planLimitLabel(automation.usage.monthly, automation.limits.monthly)}
          />
          <Metric
            icon={Clock3}
            label="Frequência de leitura"
            value={`A cada ${automation.limits.monitorMinutes} min`}
          />
          <Metric
            icon={Activity}
            label="Aguardando processamento"
            value={String(automation.usage.queued)}
          />
        </div>

        <div className="mt-5 space-y-3">
          <div>
            <h3 className="text-sm font-semibold">Contas monitoradas</h3>
            <p className="text-xs text-muted-foreground">
              Publique um fluxo e ative somente as contas que devem observar novos comentários.
            </p>
          </div>
          {sessionAccounts.map((account) => {
            const state = automation.accounts.find((item) => item.instanceId === account.id);
            const enabled = state?.enabled === true;
            return (
              <div
                key={account.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-background/70 p-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {account.username ? `@${account.username}` : account.name}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {accountStatus(
                      enabled,
                      state?.pausedReason ?? null,
                      state?.lastSuccessAt ?? null,
                    )}
                  </p>
                </div>
                <Switch
                  aria-label={`Monitorar comentários de ${account.username ?? account.name}`}
                  checked={enabled}
                  disabled={togglingAccountId === account.id || !planAllowsAutomation}
                  onCheckedChange={(checked) => void onToggle(account.id, checked)}
                />
              </div>
            );
          })}
          {!sessionAccounts.length ? (
            <div className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
              Conecte uma conta do Instagram para criar e ativar seus fluxos.
            </div>
          ) : null}
          {!planAllowsAutomation ? (
            <div className="rounded-2xl border border-warning/25 bg-warning/10 p-4 text-sm">
              A automação de comentários está disponível a partir do plano Pro.
            </div>
          ) : null}
        </div>
      </div>

      <FlowBusinessFlowBuilder
        flows={workspace.flows}
        accounts={workspace.accounts}
        plan={workspace.plan}
        onSave={onSave}
        onPublish={onPublish}
      />

      <div className="rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
        <div>
          <h3 className="font-semibold">Atividade recente</h3>
          <p className="text-sm text-muted-foreground">
            Acompanhe quais comentários acionaram um fluxo e quais foram ignorados.
          </p>
        </div>
        <div className="mt-4 divide-y divide-border">
          {automation.recentEvents.map((event) => (
            <div key={event.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">@{event.username}</p>
                <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                  {event.commentText}
                </p>
              </div>
              <div className="text-right">
                <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium">
                  {eventStatus(event.status)}
                </span>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {formatDate(event.createdAt)}
                </p>
              </div>
            </div>
          ))}
          {!automation.recentEvents.length ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              A atividade aparecerá aqui depois que o monitoramento for ativado.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background/70 p-4">
      <Icon className="size-4 text-instagram-pink" />
      <p className="mt-3 text-lg font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function accountStatus(
  enabled: boolean,
  pausedReason: string | null,
  lastSuccessAt: string | null,
) {
  if (!enabled) return "Monitoramento desativado";
  if (pausedReason === "daily_limit") return "Pausado até a renovação do limite diário";
  if (pausedReason === "monthly_limit") return "Pausado até a renovação do limite mensal";
  if (pausedReason) return "Atenção necessária antes de continuar";
  if (lastSuccessAt) return `Ativo · última leitura ${formatDate(lastSuccessAt)}`;
  return "Ativo · aguardando primeira leitura";
}

function eventStatus(status: FlowBusinessAutomationSnapshot["recentEvents"][number]["status"]) {
  if (status === "processed") return "Respondido";
  if (status === "queued") return "Na fila";
  if (status === "unmatched") return "Sem palavra-chave";
  if (status === "failed") return "Requer atenção";
  if (status === "skipped") return "Ignorado";
  return "Recebido";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
