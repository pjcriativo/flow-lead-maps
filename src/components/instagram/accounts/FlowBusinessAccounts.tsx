import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Instagram,
  Loader2,
  LockKeyhole,
  LogOut,
  Phone,
  PlugZap,
  RotateCcw,
  ShieldCheck,
  Smartphone,
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
  deleteInstagramSession,
  disconnectInstagramSession,
  type FlowBusinessAccount,
  type FlowBusinessPlan,
} from "@/services/flow-business";

interface FlowBusinessAccountsProps {
  accounts: FlowBusinessAccount[];
  plan: FlowBusinessPlan;
  onConnected: () => Promise<void>;
}

type ConnectStep = "credentials" | "approval" | "code";

export function FlowBusinessAccounts({ accounts, plan, onConnected }: FlowBusinessAccountsProps) {
  const atLimit = planLimitReached(plan.used.accounts, plan.limits.accounts);
  const connectedAccounts = accounts.filter((account) => account.provider !== "evolution_legacy");
  const legacyAccounts = accounts.filter((account) => account.provider === "evolution_legacy");

  const [connectOpen, setConnectOpen] = useState(false);
  const [connectStep, setConnectStep] = useState<ConnectStep>("credentials");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [approvalTimeout, setApprovalTimeout] = useState(false);
  const approvalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [accountAction, setAccountAction] = useState<{
    account: FlowBusinessAccount;
    action: "disconnect" | "delete";
  } | null>(null);
  const [changingAccount, setChangingAccount] = useState(false);

  // Limpa o timer ao fechar o dialog
  const clearApprovalTimer = () => {
    if (approvalTimerRef.current) {
      clearTimeout(approvalTimerRef.current);
      approvalTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => clearApprovalTimer();
  }, []);

  const closeConnection = () => {
    clearApprovalTimer();
    setConnectOpen(false);
    setConnectStep("credentials");
    setUsername("");
    setPassword("");
    setVerificationCode("");
    setApprovalTimeout(false);
  };

  const startApprovalTimer = () => {
    clearApprovalTimer();
    setApprovalTimeout(false);
    approvalTimerRef.current = setTimeout(() => {
      setApprovalTimeout(true);
    }, 2 * 60 * 1000); // 2 minutos
  };

  const connect = async (event: React.FormEvent) => {
    event.preventDefault();
    setConnecting(true);
    try {
      const result = await connectInstagramSession({
        username,
        password,
        verificationCode: connectStep === "code" ? verificationCode : "",
      });

      if (result.needsTwoFactor) {
        setConnectStep("code");
        setApprovalTimeout(false);
        clearApprovalTimer();
        toast.info("Informe o código de verificação para concluir.");
        return;
      }
      if (result.needsApproval) {
        setConnectStep("approval");
        startApprovalTimer();
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

  /** Abre o dialog já no passo correto conforme o challenge pendente da conta */
  const reconnect = (account: FlowBusinessAccount) => {
    setUsername(account.username ?? "");
    setPassword("");
    setVerificationCode("");
    setApprovalTimeout(false);
    clearApprovalTimer();

    if (account.pendingChallengeMode === "app_approval") {
      setConnectStep("approval");
      startApprovalTimer();
    } else if (account.pendingChallengeMode === "verification_code") {
      setConnectStep("code");
    } else {
      setConnectStep("credentials");
    }
    setConnectOpen(true);
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
      toast.error(
        error instanceof Error ? error.message : "Não foi possível alterar esta conta.",
      );
    } finally {
      setChangingAccount(false);
      setAccountAction(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Progress do plano */}
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

      {/* Lista de contas session_worker / unipile / meta */}
      {connectedAccounts.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {connectedAccounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onReconnect={() => reconnect(account)}
              onDisconnect={() => setAccountAction({ account, action: "disconnect" })}
              onDelete={() => setAccountAction({ account, action: "delete" })}
            />
          ))}
        </div>
      )}

      {/* Contas legadas */}
      {legacyAccounts.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Conexões anteriores
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {legacyAccounts.map((account) => (
              <AccountCard key={account.id} account={account} />
            ))}
          </div>
        </div>
      )}

      {/* Botão adicionar conta */}
      {!atLimit && (
        <Button
          size="lg"
          className="gap-2"
          onClick={() => {
            setUsername("");
            setPassword("");
            setVerificationCode("");
            setConnectStep("credentials");
            setApprovalTimeout(false);
            clearApprovalTimer();
            setConnectOpen(true);
          }}
        >
          <PlugZap className="size-4" />
          Conectar conta do Instagram
        </Button>
      )}
      {atLimit && (
        <p className="text-sm text-muted-foreground">
          Limite de contas atingido no seu plano.
        </p>
      )}

      {/* Dialog de conexão / challenge */}
      <Dialog
        open={connectOpen}
        onOpenChange={(open) => {
          if (!open && !connecting) closeConnection();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Instagram className="size-5 text-instagram-pink" />
              {connectStep === "approval"
                ? "Aprovação no Instagram"
                : connectStep === "code"
                  ? "Código de verificação"
                  : "Conectar Instagram"}
            </DialogTitle>
            <DialogDescription>
              {connectStep === "credentials"
                ? "Use suas credenciais do Instagram para conectar a conta."
                : connectStep === "approval"
                  ? "O Instagram está esperando sua confirmação no aplicativo."
                  : "O Instagram enviou um código para confirmar sua identidade."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={(e) => void connect(e)} className="space-y-4 pt-1">
            {connectStep === "credentials" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="instagram-username">Usuário do Instagram</Label>
                  <Input
                    id="instagram-username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="seuperfil"
                    autoComplete="username"
                    disabled={connecting}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagram-password">Senha</Label>
                  <Input
                    id="instagram-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    disabled={connecting}
                    required
                  />
                </div>
                <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/50 p-3 text-xs leading-5 text-muted-foreground">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  Sua senha é enviada diretamente ao Instagram e nunca é armazenada.
                </div>
              </>
            )}

            {connectStep === "approval" && (
              <ApprovalStep timeout={approvalTimeout} onSwitchToCode={() => {
                clearApprovalTimer();
                setConnectStep("code");
                setApprovalTimeout(false);
              }} />
            )}

            {connectStep === "code" && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
                  <Phone className="mt-0.5 size-5 shrink-0 text-blue-500" />
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">Código enviado</p>
                    <p className="mt-1 leading-5">
                      O Instagram enviou um código por SMS ou e-mail. Insira abaixo para concluir a
                      conexão.
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagram-verification">Código de verificação</Label>
                  <Input
                    id="instagram-verification"
                    value={verificationCode}
                    onChange={(e) =>
                      setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 8))
                    }
                    placeholder="000000"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={8}
                    disabled={connecting}
                    required
                    className="text-center text-lg tracking-[0.4em] font-mono"
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeConnection}
                disabled={connecting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={
                  connecting ||
                  (connectStep === "credentials" && (!username.trim() || !password)) ||
                  (connectStep === "code" && verificationCode.length < 4)
                }
              >
                {connecting ? <Loader2 className="size-4 animate-spin" /> : null}
                {connectStep === "approval"
                  ? "Já aprovei continuar"
                  : connectStep === "code"
                    ? "Validar código"
                    : "Conectar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* AlertDialog de disconnect / delete */}
      <AlertDialog
        open={accountAction !== null}
        onOpenChange={(open) => {
          if (!open && !changingAccount) setAccountAction(null);
        }}
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
                ? "A sessão será encerrada no Flow Business e as automações desta conta serão pausadas. Seus leads e histórico serão preservados."
                : "O registro desta conexão será removido. As listas de leads continuarão preservadas."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={changingAccount}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={changingAccount}
              onClick={(e) => {
                e.preventDefault();
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

// ─── Approval Step ────────────────────────────────────────────────────────────

function ApprovalStep({
  timeout,
  onSwitchToCode,
}: {
  timeout: boolean;
  onSwitchToCode: () => void;
}) {
  return (
    <div className="space-y-4">
      {/* Steps visuais */}
      <ol className="space-y-3">
        {[
          {
            icon: <Smartphone className="size-4" />,
            label: "Abra o aplicativo do Instagram no seu celular",
            done: true,
          },
          {
            icon: <ShieldCheck className="size-4" />,
            label: 'Toque em "Aprovar" na notificação de nova tentativa de login',
            done: false,
          },
          {
            icon: <CheckCircle2 className="size-4" />,
            label: 'Volte aqui e clique em "Já aprovei continuar"',
            done: false,
          },
        ].map((step, i) => (
          <li key={i} className="flex items-start gap-3">
            <span
              className={`flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                step.done
                  ? "border-success/30 bg-success/10 text-success"
                  : "border-warning/30 bg-warning/10 text-warning"
              }`}
            >
              {step.icon}
            </span>
            <p className="pt-0.5 text-sm leading-5 text-muted-foreground">{step.label}</p>
          </li>
        ))}
      </ol>

      {/* Alerta principal */}
      <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/8 p-4">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" />
        <p className="text-sm leading-5 text-muted-foreground">
          Não feche esta janela. Após aprovar no Instagram, clique em{" "}
          <strong className="text-foreground">"Já aprovei continuar"</strong> para finalizar a
          conexão.
        </p>
      </div>

      {/* Timeout: o botão não apareceu no app */}
      {timeout && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm">
          <p className="font-medium text-destructive">A notificação não apareceu?</p>
          <p className="mt-1 text-muted-foreground">
            Às vezes o Instagram envia um código por SMS ou e-mail em vez da notificação.
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-3 border-destructive/30 text-destructive hover:bg-destructive/10"
            onClick={onSwitchToCode}
          >
            <Phone className="size-4" />
            Recebi um código por SMS / e-mail
          </Button>
        </div>
      )}

      {/* Indicador de espera animado */}
      {!timeout && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="size-3.5 animate-pulse" />
          Aguardando aprovação no app…
        </div>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function connectionLabel(account: FlowBusinessAccount): string {
  if (account.provider === "evolution_legacy") return "Conexão existente — migração recomendada";
  if (account.provider === "session_worker") {
    if (account.status === "conectado") return "Conta conectada";
    if (account.status === "aguardando" && account.pendingChallengeMode === "app_approval")
      return "Aprovação pendente no app";
    if (account.status === "aguardando" && account.pendingChallengeMode === "verification_code")
      return "Código de verificação necessário";
    if (account.status === "aguardando") return "Conexão pendente";
    if (account.status === "erro") return "Conexão incompleta";
    return "Conta desconectada";
  }
  return account.accountType ? `Perfil ${account.accountType}` : "Perfil profissional";
}

function statusLabel(status: string): string {
  if (status === "conectado") return "Conectada";
  if (status === "aguardando") return "Pendente";
  if (status === "erro") return "Precisa de atenção";
  if (status === "desconectado") return "Desconectada";
  return "Indisponível";
}

// ─── AccountCard ──────────────────────────────────────────────────────────────

interface AccountCardProps {
  account: FlowBusinessAccount;
  busy?: boolean;
  onReconnect?: () => void;
  onDisconnect?: () => void;
  onDelete?: () => void;
}

function AccountCard({ account, busy, onReconnect, onDisconnect, onDelete }: AccountCardProps) {
  const connected = account.status === "conectado";
  const sessionAccount = account.provider === "session_worker";
  const pendingAppApproval =
    account.pendingChallengeMode === "app_approval" && account.status === "aguardando";
  const pendingCode =
    account.pendingChallengeMode === "verification_code" && account.status === "aguardando";

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
          {statusLabel(account.status)}
        </span>
      </div>

      {/* Banner de challenge pendente — aprovação no app */}
      {pendingAppApproval && (
        <div className="mt-4 rounded-xl border border-warning/30 bg-warning/8 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-warning">
            <Smartphone className="size-3.5" />
            Aprovação pendente no Instagram
          </div>
          <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
            Abra o app do Instagram e aprove a tentativa de login para reconectar esta conta.
          </p>
        </div>
      )}

      {/* Banner de challenge pendente — código */}
      {pendingCode && (
        <div className="mt-4 rounded-xl border border-blue-500/20 bg-blue-500/5 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-500">
            <Phone className="size-3.5" />
            Código de verificação necessário
          </div>
          <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
            O Instagram enviou um código por SMS ou e-mail. Clique em "Inserir código" para
            continuar.
          </p>
        </div>
      )}

      {/* Erro genérico */}
      {account.errorMessage && !pendingAppApproval && !pendingCode ? (
        <p className="mt-3 rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
          Esta conta precisa de atenção. Reconecte o Instagram para continuar usando as conversas.
        </p>
      ) : null}

      {/* Botões de ação */}
      {sessionAccount ? (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
          {connected ? (
            <Button size="sm" variant="outline" disabled={busy} onClick={onDisconnect}>
              <LogOut className="size-4" /> Desconectar
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                variant={pendingAppApproval ? "default" : "outline"}
                disabled={busy}
                onClick={onReconnect}
              >
                {pendingAppApproval ? (
                  <>
                    <Smartphone className="size-4" /> Aprovar e continuar
                  </>
                ) : pendingCode ? (
                  <>
                    <Phone className="size-4" /> Inserir código
                  </>
                ) : (
                  <>
                    <RotateCcw className="size-4" /> Reconectar
                  </>
                )}
              </Button>
              <Button size="sm" variant="destructive" disabled={busy} onClick={onDelete}>
                <Trash2 className="size-4" /> Excluir
              </Button>
            </>
          )}
        </div>
      ) : null}
    </article>
  );
}
