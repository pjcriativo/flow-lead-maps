import { ArrowUpRight, CheckCircle2, Clock3, ExternalLink, ListChecks, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { FlowBusinessPlan, FlowBusinessTask } from "@/services/flow-business";
import type { InstagramView } from "@/components/instagram/navigation/instagram-navigation";

export function FlowBusinessToday({
  tasks,
  plan,
  onComplete,
  onNavigate,
}: {
  tasks: FlowBusinessTask[];
  plan: FlowBusinessPlan;
  onComplete: (task: FlowBusinessTask) => Promise<void>;
  onNavigate: (view: InstagramView) => void;
}) {
  const now = new Date();
  const due = tasks.filter((task) => new Date(task.dueAt) <= now);
  const next = tasks.filter((task) => new Date(task.dueAt) > now).slice(0, 5);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="grid gap-6 p-6 sm:p-8 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-instagram-pink">
              Instagram · Central de execução
            </p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
              Hoje você trabalha oportunidades, não listas soltas.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Cada ação pública é guiada e registrada. Mensagens automáticas só entram em cena
              depois que o contato inicia uma interação com o perfil.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={() => onNavigate("hunter")}>Encontrar oportunidades</Button>
              <Button variant="outline" onClick={() => onNavigate("crm")}>
                Abrir CRM <ArrowUpRight className="size-4" />
              </Button>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-muted/35 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Prioridade</p>
                <p className="mt-1 text-3xl font-semibold tabular-nums">{due.length}</p>
              </div>
              <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ListChecks className="size-5" />
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              ações vencidas ou previstas para hoje
            </p>
            <Button
              className="mt-5 w-full"
              variant="secondary"
              onClick={() => onNavigate("cadences")}
            >
              Gerenciar cadências
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Metric
          icon={Users}
          label="Contatos no CRM"
          value={plan.used.crmContacts}
          limit={plan.limits.crmContacts}
          detail={`${plan.limits.crmContacts} no plano`}
        />
        <Metric
          icon={Clock3}
          label="Cadências ativas"
          value={plan.used.cadences}
          limit={plan.limits.cadences}
          detail={`${plan.limits.cadences} no plano`}
        />
        <Metric
          icon={CheckCircle2}
          label="Contas conectadas"
          value={plan.used.accounts}
          limit={plan.limits.accounts}
          detail={`${plan.limits.accounts} no plano`}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <div className="rounded-3xl border border-border bg-card shadow-[var(--shadow-card)]">
          <div className="border-b border-border p-5 sm:p-6">
            <h3 className="text-lg font-semibold">Fila de hoje</h3>
            <p className="text-sm text-muted-foreground">
              Execute no Instagram e confirme aqui para avançar o CRM.
            </p>
          </div>
          <div className="divide-y divide-border">
            {due.length ? (
              due.slice(0, 12).map((task) => (
                <div key={task.id} className="flex flex-wrap items-center gap-4 p-4 sm:px-6">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{task.title}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {task.businessName}
                      {task.username ? ` · @${task.username}` : ""}
                    </p>
                  </div>
                  {task.instagramUrl ? (
                    <Button variant="outline" size="sm" asChild>
                      <a href={task.instagramUrl} target="_blank" rel="noreferrer">
                        Abrir perfil <ExternalLink className="size-3.5" />
                      </a>
                    </Button>
                  ) : null}
                  <Button size="sm" onClick={() => void onComplete(task)}>
                    <CheckCircle2 className="size-4" /> Concluir
                  </Button>
                </div>
              ))
            ) : (
              <div className="p-10 text-center text-sm text-muted-foreground">
                Nenhuma ação pendente para hoje.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
          <h3 className="text-lg font-semibold">Próximas ações</h3>
          <div className="mt-5 space-y-4">
            {next.map((task) => (
              <div key={task.id} className="rounded-xl border border-border p-3">
                <p className="text-sm font-medium">{task.businessName}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {task.title} · {new Date(task.dueAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
            ))}
            {!next.length ? (
              <p className="text-sm text-muted-foreground">
                Inicie uma cadência no CRM para montar sua agenda.
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  limit,
  detail,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  limit: number;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between">
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <p className="mt-1 text-sm font-medium">{label}</p>
      <Progress
        value={limit > 0 ? Math.min(100, (value / limit) * 100) : 0}
        className="mt-4 h-1.5"
      />
      <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}
