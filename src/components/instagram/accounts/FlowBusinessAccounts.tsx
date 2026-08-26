import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Instagram,
  Loader2,
  LockKeyhole,
  PlugZap,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { planLimitLabel, planLimitProgress, planLimitReached } from "@/lib/flow-business-limits";
import {
  connectInstagramSession,
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
  const connectedAccounts = accounts.filter((account) => account.provider !== "evolution_legacy");
  const legacyAccounts = accounts.filter((account) => account.provider === "evolution_legacy");
  const [connectOpen, setConnectOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [needsTwoFactor, setNeedsTwoFactor] = useState(false);
  const [needsApproval, setNeedsApproval] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const closeConnection = () => {
    setConnectOpen(false);
    setUsername("");
    setPassword("");
    setVerificationCode("");
    setNeedsTwoFactor(false);
    setNeedsApproval(false);
  };

  const connect = async () => {
    setConnecting(true);
    try {
      const result = await connectInstagramSession({ username, password, verificationCode });
      if (result.needsTwoFactor) {
        setNeedsTwoFactor(true);
        setNeedsApproval(false);
        toast.info("Informe o código de verificação para concluir.");
        return;
      }
      if (result.needsApproval) {
        setNeedsApproval(true);
        toast.info("Aprove esta tentativa no aplicativo do Instagram e depois continue aqui.");
        return;
      }
      if (!result.connected) throw new Error("Não foi possível confirmar a conexão.");
      toast.success("Instagram conectado com sucesso.");
      closeConnection();
      await onConnected();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível conectar o Instagram.",
      );
    } finally {
      setConnecting(false);
    }
  };

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
            Conecte uma conta de teste para centralizar o relacionamento e preparar suas próximas
            automações. Comece com baixo volume enquanto validamos a estabilidade da sessão.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button disabled={atLimit} onClick={() => setConnectOpen(true)}>
              <PlugZap className="size-4" /> Conectar conta de teste
            </Button>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-muted/35 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Contas do seu plano</span>
            <span className="text-sm font-semibold tabular-nums">
              {planLimitLabel(plan.used.accounts, plan.limits.accounts)}
            </span>
          </div>
          <Progress
            value={planLimitProgress(plan.used.accounts, plan.limits.accounts)}
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
                Use o botão acima para conectar a primeira conta de teste.
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

      <Dialog
        open={connectOpen}
        onOpenChange={(open) => {
          if (connecting) return;
          if (open) setConnectOpen(true);
          else closeConnection();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conectar conta de teste</DialogTitle>
            <DialogDescription>
              Sua senha é usada somente nesta tentativa de login e não é armazenada. O estado da
              sessão fica protegido no servidor.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void connect();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="instagram-username">Usuário do Instagram</Label>
              <Input
                id="instagram-username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="seuperfil"
                autoComplete="username"
                disabled={needsTwoFactor || needsApproval || connecting}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagram-password">Senha</Label>
              <Input
                id="instagram-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                disabled={needsApproval || connecting}
                required
              />
            </div>
            {needsTwoFactor ? (
              <div className="space-y-2">
                <Label htmlFor="instagram-verification">Código de verificação</Label>
                <Input
                  id="instagram-verification"
                  value={verificationCode}
                  onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, ""))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={8}
                  disabled={connecting}
                  required
                />
              </div>
            ) : null}
            <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs leading-5 text-muted-foreground">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
              {needsApproval
                ? "Abra o Instagram, aprove a tentativa de login e volte aqui sem fechar esta janela. Depois clique em Continuar conexão."
                : "Confirme a tentativa no aplicativo caso o Instagram solicite. Use apenas uma conta preparada para o piloto."}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeConnection}
                disabled={connecting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={connecting || !username.trim() || !password}>
                {connecting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ShieldCheck className="size-4" />
                )}
                {needsApproval
                  ? "Continuar conexão"
                  : needsTwoFactor
                    ? "Validar código"
                    : "Conectar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function connectionLabel(account: FlowBusinessAccount): string {
  if (account.provider === "evolution_legacy") return "Conexão existente · migração recomendada";
  if (account.provider === "session_worker") return "Conta conectada";
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
