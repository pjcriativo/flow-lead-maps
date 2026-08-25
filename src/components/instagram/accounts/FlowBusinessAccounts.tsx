import { AlertTriangle, CheckCircle2, Instagram, LockKeyhole, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { FlowBusinessAccount, FlowBusinessPlan } from "@/services/flow-business";

interface FlowBusinessAccountsProps {
  accounts: FlowBusinessAccount[];
  plan: FlowBusinessPlan;
}

export function FlowBusinessAccounts({ accounts, plan }: FlowBusinessAccountsProps) {
  const atLimit = plan.used.accounts >= plan.limits.accounts;
  const connectedAccounts = accounts.filter((account) => account.provider !== "evolution_legacy");
  const legacyAccounts = accounts.filter((account) => account.provider === "evolution_legacy");

  return (
    <div className="space-y-6">
      <section className="grid gap-6 rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)] lg:grid-cols-[minmax(0,1fr)_340px]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-instagram-pink">
            Contas do Instagram
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            Gerencie as contas do seu Instagram
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            A conexão de novos perfis está temporariamente indisponível enquanto preparamos uma
            experiência mais estável e segura. Os recursos de prospecção pública continuam ativos.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button disabled>
              <LockKeyhole className="size-4" /> Nova conexão em preparação
            </Button>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-muted/35 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Contas do seu plano</span>
            <span className="text-sm font-semibold tabular-nums">
              {plan.used.accounts}/{plan.limits.accounts}
            </span>
          </div>
          <Progress
            value={plan.limits.accounts ? (plan.used.accounts / plan.limits.accounts) * 100 : 100}
            className="mt-3"
          />
          <div className="mt-5 flex items-start gap-3 text-xs leading-5 text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" />A conexão fica protegida
            no backend. Cada organização enxerga apenas as próprias contas e o limite do plano é
            validado novamente no banco.
          </div>
        </div>
      </section>

      {atLimit ? (
        <div className="flex items-center gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm">
          <LockKeyhole className="size-4 text-warning" /> Você atingiu o limite de contas do plano.
        </div>
      ) : null}

      <section>
        <h3 className="mb-3 text-lg font-semibold">Contas conectadas</h3>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {connectedAccounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
          {!connectedAccounts.length ? (
            <div className="col-span-full rounded-2xl border border-dashed border-border p-10 text-center">
              <Instagram className="mx-auto size-9 text-muted-foreground/40" />
              <p className="mt-3 font-medium">Nenhuma conta conectada</p>
              <p className="mt-1 text-sm text-muted-foreground">
                As conexões existentes aparecerão aqui. Novos perfis serão liberados em breve.
              </p>
            </div>
          ) : null}
        </div>
      </section>

      {legacyAccounts.length ? (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <h3 className="text-lg font-semibold">Conexões legadas</h3>
            <span className="rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-semibold text-warning">
              MIGRAÇÃO RECOMENDADA
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {legacyAccounts.map((account) => (
              <AccountCard key={account.id} account={account} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function connectionLabel(account: FlowBusinessAccount): string {
  if (account.provider === "evolution_legacy") return "Conexão existente · migração recomendada";
  return account.accountType ? `Perfil ${account.accountType}` : "Perfil profissional";
}

function AccountCard({ account }: { account: FlowBusinessAccount }) {
  const connected = account.status === "conectado";
  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,var(--instagram-orange),var(--instagram-pink),var(--instagram-purple))] text-primary-foreground">
          <Instagram className="size-5" />
        </span>
        {connected ? (
          <CheckCircle2 className="size-5 text-success" />
        ) : (
          <AlertTriangle className="size-5 text-warning" />
        )}
      </div>
      <h4 className="mt-4 font-semibold">
        {account.username ? `@${account.username}` : account.name}
      </h4>
      <p className="mt-1 text-xs text-muted-foreground">{connectionLabel(account)}</p>
      <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs">
        <span className="text-muted-foreground">Status</span>
        <span className={connected ? "font-semibold text-success" : "font-semibold text-warning"}>
          {account.status}
        </span>
      </div>
      {account.errorMessage ? (
        <p className="mt-3 rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
          Esta conta precisa de atenção. Reconecte o Instagram para continuar usando as conversas.
        </p>
      ) : null}
    </article>
  );
}
