import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Instagram,
  Loader2,
  LogOut,
  PlugZap,
  Trash2,
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
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { planLimitLabel, planLimitProgress, planLimitReached } from "@/lib/flow-business-limits";
import {
  deleteInstagramSession,
  disconnectInstagramSession,
  startOfficialInstagramConnection,
  type FlowBusinessAccount,
  type FlowBusinessPlan,
} from "@/services/flow-business";

interface FlowBusinessAccountsProps {
  accounts: FlowBusinessAccount[];
  plan: FlowBusinessPlan;
  onConnected: () => Promise<void>;
}

export function FlowBusinessAccounts({ accounts, plan, onConnected }: FlowBusinessAccountsProps) {
  const atLimit = planLimitReached(plan.used.accounts, plan.limits.accounts);
  const currentAccounts = accounts.filter((account) => account.provider !== "evolution_legacy");
  const legacyAccounts = accounts.filter((account) => account.provider === "evolution_legacy");
  const [startingConnection, setStartingConnection] = useState(false);
  const [accountAction, setAccountAction] = useState<{
    account: FlowBusinessAccount;
    action: "disconnect" | "delete";
  } | null>(null);
  const [changingAccount, setChangingAccount] = useState(false);

  const startConnection = async () => {
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
    <div className="space-y-8">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Contas conectadas</span>
          <span className="text-muted-foreground">
            {planLimitLabel(plan.used.accounts, plan.limits.accounts)}
          </span>
        </div>
        <Progress
          className="mt-3 h-1.5"
          value={planLimitProgress(plan.used.accounts, plan.limits.accounts)}
        />
      </div>

      {currentAccounts.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-lg font-semibold">Suas contas</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {currentAccounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                busy={changingAccount}
                onDisconnect={() => setAccountAction({ account, action: "disconnect" })}
                onDelete={() => setAccountAction({ account, action: "delete" })}
              />
            ))}
          </div>
        </section>
      )}

      {legacyAccounts.length > 0 && (
        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Conexões anteriores
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {legacyAccounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                busy={changingAccount}
                onDisconnect={() => setAccountAction({ account, action: "disconnect" })}
                onDelete={() => setAccountAction({ account, action: "delete" })}
              />
            ))}
          </div>
        </section>
      )}

      {!atLimit ? (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold">Conectar uma conta</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Você autoriza a conexão na tela segura do Instagram. Sua senha não é solicitada pelo
                Flow Business.
              </p>
            </div>
            <Button
              size="lg"
              className="gap-2"
              disabled={startingConnection}
              onClick={() => void startConnection()}
            >
              {startingConnection ? <Loader2 className="size-4 animate-spin" /> : <PlugZap className="size-4" />}
              Conectar Instagram
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Limite de contas atingido no seu plano.</p>
      )}

      <AlertDialog
        open={accountAction !== null}
        onOpenChange={(open) => {
          if (!open && !changingAccount) setAccountAction(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {accountAction?.action === "disconnect" ? "Desconectar esta conta?" : "Excluir esta conta?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {accountAction?.action === "disconnect"
                ? "A conexão será encerrada aqui e as automações desta conta serão pausadas. Você poderá conectá-la novamente quando quiser."
                : "Esta conexão será removida do Flow Business. Seus leads e listas não serão apagados."}
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

interface AccountCardProps {
  account: FlowBusinessAccount;
  busy: boolean;
  onDisconnect: () => void;
  onDelete: () => void;
}

function AccountCard({ account, busy, onDisconnect, onDelete }: AccountCardProps) {
  const connected = account.status === "conectado";
  const isLegacyAttempt = account.provider === "session_worker" && !connected;

  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,var(--instagram-orange),var(--instagram-pink),var(--instagram-purple))] text-primary-foreground">
          <Instagram className="size-5" />
        </span>
        {connected ? <CheckCircle2 className="size-5 text-success" /> : <AlertTriangle className="size-5 text-warning" />}
      </div>

      <h4 className="mt-4 font-semibold">{account.username ? `@${account.username}` : account.name}</h4>
      <p className="mt-1 text-xs text-muted-foreground">
        {isLegacyAttempt
          ? "Tentativa anterior interrompida"
          : account.accountType
            ? `Perfil ${account.accountType}`
            : connected
              ? "Conta conectada"
              : "Conta desconectada"}
      </p>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs">
        <span className="text-muted-foreground">Status</span>
        <span className={connected ? "font-semibold text-success" : "font-semibold text-warning"}>
          {connected ? "Conectada" : isLegacyAttempt ? "Incompleta" : "Desconectada"}
        </span>
      </div>

      {!connected && (
        <p className="mt-4 rounded-xl border border-warning/30 bg-warning/8 p-3 text-xs leading-5 text-muted-foreground">
          Esta conta não está ativa. Exclua esta tentativa para manter sua área organizada.
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
        {connected ? (
          <Button size="sm" variant="outline" disabled={busy} onClick={onDisconnect}>
            <LogOut className="size-4" /> Desconectar
          </Button>
        ) : (
          <Button size="sm" variant="destructive" disabled={busy} onClick={onDelete}>
            <Trash2 className="size-4" /> Excluir
          </Button>
        )}
      </div>
    </article>
  );
}
