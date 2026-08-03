// Telas USERS do painel admin.
//  • All Users   → todas as contas da plataforma (profiles). Add User cria conta+org real.
//                  Coluna SALDO existe mas mostra "—" (billing não existe → PROIBIDO saldo fake).
//  • Subscribers → CRUD manual (sem origem de captação automática); "Enviar e-mail" fica
//                  desabilitado com o motivo (não existe motor de disparo em massa ainda).
import { useEffect, useState } from "react";
import { Check, Clock3, Loader2, LockKeyhole, Mail, Plus, ShieldCheck, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { adminAcao, type UsuarioPlataforma } from "@/services/admin";
import { Button } from "@/components/ui/button";

const PLANOS = [
  { value: "basico", label: "Básico" },
  { value: "pro", label: "Pro" },
  { value: "agencia", label: "Agência" },
  { value: "enterprise", label: "Enterprise" },
];

export function AdminAllUsers({
  usuarios,
  onMudou,
}: {
  usuarios: UsuarioPlataforma[];
  onMudou: () => void;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [alterandoId, setAlterandoId] = useState<string | null>(null);
  // Modal "Liberar com plano"
  const [liberarModal, setLiberarModal] = useState<{ usuario: UsuarioPlataforma } | null>(null);
  const [planSelecionado, setPlanSelecionado] = useState("pro");
  // Modal confirmação de exclusão
  const [deleteModal, setDeleteModal] = useState<{ usuario: UsuarioPlataforma } | null>(null);

  const pendentes = usuarios.filter(
    (u) => !u.acesso_liberado && !u.is_super_admin,
  );

  const adicionar = async () => {
    if (!email.includes("@")) {
      toast.error("Informe um e-mail válido.");
      return;
    }
    setOcupado(true);
    try {
      const r = await adminAcao("user_add", { email: email.trim() });
      if (!r.ok) {
        toast.error(`Não criou: ${r.reason ?? "erro"}`);
        return;
      }
      toast.success(`Conta criada para ${email} (admin da própria org).`);
      setEmail("");
      setAddOpen(false);
      onMudou();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setOcupado(false);
    }
  };

  const alterarAcesso = async (usuario: UsuarioPlataforma, liberado: boolean, plan?: string) => {
    setAlterandoId(usuario.id);
    try {
      const payload: Record<string, unknown> = { user_id: usuario.id, liberado };
      if (liberado && plan) payload.plan = plan;
      const r = await adminAcao("user_access_set", payload);
      if (!r.ok) {
        toast.error(`Não foi possível alterar o acesso: ${r.reason ?? "erro"}`);
        return;
      }
      toast.success(
        liberado
          ? `Acesso liberado para ${usuario.email}${plan ? ` (plano ${plan})` : ""}.`
          : `Acesso bloqueado para ${usuario.email}.`,
      );
      onMudou();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao alterar acesso");
    } finally {
      setAlterandoId(null);
    }
  };

  const alterarPlano = async (usuario: UsuarioPlataforma, plan: string) => {
    setAlterandoId(usuario.id);
    try {
      const r = await adminAcao("user_plan_set", { user_id: usuario.id, plan });
      if (!r.ok) {
        toast.error(`Não foi possível alterar o plano: ${r.reason ?? "erro"}`);
        return;
      }
      toast.success(`Plano de ${usuario.email} → "${plan}".`);
      onMudou();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao alterar plano");
    } finally {
      setAlterandoId(null);
    }
  };

  const excluirConta = async (usuario: UsuarioPlataforma) => {
    setAlterandoId(usuario.id);
    try {
      const r = await adminAcao("user_delete", { user_id: usuario.id });
      if (!r.ok) {
        toast.error(
          r.reason === "nao_pode_deletar_super_admin"
            ? "Não é possível excluir um super admin."
            : `Erro ao excluir: ${r.reason ?? "erro"}`,
        );
        return;
      }
      toast.success(`Conta ${usuario.email} excluída permanentemente.`);
      setDeleteModal(null);
      onMudou();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao excluir conta");
    } finally {
      setAlterandoId(null);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="font-serif text-xl">Todos os usuários</h2>
          <p className="text-xs text-muted-foreground">
            {usuarios.length} contas na plataforma · {pendentes.length} aguardando liberação.
          </p>
        </div>
        <button
          onClick={() => setAddOpen((o) => !o)}
          className="inline-flex items-center gap-1.5 rounded-md bg-navy px-3 py-2 text-xs font-semibold text-navy-foreground hover:bg-navy/90"
        >
          <Plus className="h-3.5 w-3.5" /> Adicionar usuário
        </button>
      </div>

      {/* Form adicionar */}
      {addOpen && (
        <div className="flex flex-wrap items-end gap-2 border-b border-border bg-secondary/20 px-5 py-3">
          <div className="flex-1">
            <label className="mb-1 block text-[11px] uppercase text-muted-foreground">E-mail</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && adicionar()}
              placeholder="novo@empresa.com"
              className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
            />
          </div>
          <button
            onClick={adicionar}
            disabled={ocupado}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-gold px-4 text-xs font-semibold text-gold-foreground disabled:opacity-60"
          >
            {ocupado && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Criar conta
          </button>
        </div>
      )}

      {/* Tabela */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-5 py-2.5 font-medium">Usuário</th>
              <th className="px-5 py-2.5 font-medium">Plano</th>
              <th className="px-5 py-2.5 font-medium">Acesso</th>
              <th className="px-5 py-2.5 font-medium">Entrou em</th>
              <th className="w-px whitespace-nowrap px-5 py-2.5 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                {/* Usuário */}
                <td className="px-5 py-3 font-medium">{u.email}</td>

                {/* Plano — select inline p/ liberados, texto p/ demais */}
                <td className="px-5 py-3">
                  {u.is_super_admin ? (
                    <span className="text-xs uppercase text-muted-foreground">—</span>
                  ) : u.acesso_liberado ? (
                    <select
                      value={u.plan ?? "basico"}
                      disabled={alterandoId === u.id}
                      onChange={(e) => alterarPlano(u, e.target.value)}
                      className="rounded-md border border-input bg-card px-2 py-1 text-xs font-medium focus:outline-none cursor-pointer capitalize disabled:opacity-50"
                      title="Alterar plano"
                    >
                      {PLANOS.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-xs uppercase text-muted-foreground">{u.plan ?? "—"}</span>
                  )}
                </td>

                {/* Acesso */}
                <td className="px-5 py-3">
                  {u.is_super_admin ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                      <ShieldCheck className="size-3.5" /> Super admin
                    </span>
                  ) : u.acesso_liberado ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-600">
                      <Check className="size-3.5" /> Liberado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                      <Clock3 className="size-3.5" /> Pendente
                    </span>
                  )}
                </td>

                {/* Data */}
                <td className="px-5 py-3 text-muted-foreground text-xs">
                  {new Date(u.created_at).toLocaleDateString("pt-BR")}
                </td>

                {/* Ações — coluna compacta (w-px + nowrap) */}
                <td className="w-px whitespace-nowrap px-5 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    {!u.is_super_admin && (
                      <>
                        {/* Liberar / Bloquear */}
                        {u.acesso_liberado ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={alterandoId === u.id}
                            onClick={() => alterarAcesso(u, false)}
                            className="gap-1.5"
                          >
                            {alterandoId === u.id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <LockKeyhole className="size-3.5" />
                            )}
                            Bloquear
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            variant="default"
                            disabled={alterandoId === u.id}
                            onClick={() => { setPlanSelecionado("pro"); setLiberarModal({ usuario: u }); }}
                            className="gap-1.5"
                          >
                            {alterandoId === u.id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Check className="size-3.5" />
                            )}
                            Liberar acesso
                          </Button>
                        )}

                        {/* Excluir */}
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={alterandoId === u.id}
                          onClick={() => setDeleteModal({ usuario: u })}
                          className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          title="Excluir conta permanentemente"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
        Novos cadastros ficam pendentes até um administrador liberar o acesso manualmente.
      </p>

      {/* ── Modal: Liberar acesso + escolher plano ── */}
      {liberarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div>
              <h3 className="font-serif text-lg font-semibold">Liberar acesso</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Escolha o plano que <b>{liberarModal.usuario.email}</b> receberá ao ser liberado.
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Plano
              </label>
              <select
                value={planSelecionado}
                onChange={(e) => setPlanSelecionado(e.target.value)}
                className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus:outline-none"
              >
                {PLANOS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
              <p className="text-[11px] text-muted-foreground">
                {planSelecionado === "basico"
                  ? "Básico: acesso ao Google Maps e CRM. Recursos avançados bloqueados."
                  : planSelecionado === "pro"
                  ? "Pro: libera Instagram, LinkedIn, Propostas, Contratos, WhatsApp, Campanhas, Redesign e Publicar."
                  : planSelecionado === "agencia"
                  ? "Agência: mesmo que Pro, com maior capacidade e múltiplos usuários."
                  : "Enterprise: acesso completo sem restrições."}
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                className="flex-1 gap-1.5"
                disabled={alterandoId === liberarModal.usuario.id}
                onClick={async () => {
                  await alterarAcesso(liberarModal.usuario, true, planSelecionado);
                  setLiberarModal(null);
                }}
              >
                {alterandoId === liberarModal.usuario.id ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Check className="size-3.5" />
                )}
                Confirmar liberação
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setLiberarModal(null)}
                disabled={alterandoId === liberarModal.usuario.id}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Confirmar exclusão de conta ── */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl border border-destructive/30 bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="size-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-semibold text-destructive">Excluir conta</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Esta ação é <b>irreversível</b>. A conta de{" "}
                  <b>{deleteModal.usuario.email}</b> e todos os seus dados serão permanentemente removidos.
                </p>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="destructive"
                className="flex-1 gap-1.5"
                disabled={alterandoId === deleteModal.usuario.id}
                onClick={() => excluirConta(deleteModal.usuario)}
              >
                {alterandoId === deleteModal.usuario.id ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Trash2 className="size-3.5" />
                )}
                Sim, excluir conta
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteModal(null)}
                disabled={alterandoId === deleteModal.usuario.id}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type Assinante = { id: string; email: string; nome: string | null; criado_em: string };

export function AdminSubscribers() {
  const [assinantes, setAssinantes] = useState<Assinante[] | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const carregar = () =>
    adminAcao("assinantes_listar")
      .then((r) => setAssinantes(r.ok ? ((r.assinantes as Assinante[]) ?? []) : []))
      .catch(() => setAssinantes([]));
  useEffect(() => {
    carregar();
  }, []);

  const adicionar = async () => {
    if (!email.includes("@")) {
      toast.error("Informe um e-mail válido.");
      return;
    }
    setOcupado(true);
    try {
      const r = await adminAcao("assinante_add", { email: email.trim(), nome: nome.trim() });
      if (!r.ok) {
        toast.error(
          r.reason === "email_duplicado" ? "Esse e-mail já está cadastrado." : "Falha ao cadastrar",
        );
        return;
      }
      toast.success("Assinante cadastrado.");
      setEmail("");
      setNome("");
      setAddOpen(false);
      carregar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setOcupado(false);
    }
  };

  const remover = async (id: string) => {
    await adminAcao("assinante_remove", { id });
    carregar();
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-4">
        <div>
          <h2 className="font-serif text-xl">Assinantes</h2>
          <p className="text-xs text-muted-foreground">
            Cadastro manual — o produto ainda não tem uma origem de captação automática.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled
            title="Desabilitado: ainda não existe um motor de disparo em massa/newsletter. Cadastre e organize a lista aqui; o envio chega numa próxima etapa."
            className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-medium text-muted-foreground/60"
          >
            <Mail className="h-3.5 w-3.5" /> Enviar e-mail
          </button>
          <button
            onClick={() => setAddOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-md bg-navy px-3 py-2 text-xs font-semibold text-navy-foreground hover:bg-navy/90"
          >
            <Plus className="h-3.5 w-3.5" /> Adicionar
          </button>
        </div>
      </div>

      {addOpen && (
        <div className="flex flex-wrap items-end gap-2 border-b border-border bg-secondary/20 px-5 py-3">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@exemplo.com"
            className="h-9 flex-1 rounded-md border border-input bg-card px-2 text-sm"
          />
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome (opcional)"
            className="h-9 flex-1 rounded-md border border-input bg-card px-2 text-sm"
          />
          <button
            onClick={adicionar}
            disabled={ocupado}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-navy px-3 text-xs font-semibold text-navy-foreground hover:bg-navy/90 disabled:opacity-60"
          >
            {ocupado && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Salvar
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-secondary/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-5 py-3">E-mail</th>
              <th className="px-5 py-3">Nome</th>
              <th className="px-5 py-3">Cadastrado em</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {assinantes === null && (
              <tr>
                <td colSpan={4} className="px-5 py-6 text-center text-muted-foreground">
                  Carregando…
                </td>
              </tr>
            )}
            {assinantes?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-6 text-center text-muted-foreground">
                  Nenhum assinante cadastrado ainda.
                </td>
              </tr>
            )}
            {assinantes?.map((a) => (
              <tr key={a.id}>
                <td className="px-5 py-3 font-medium">{a.email}</td>
                <td className="px-5 py-3 text-muted-foreground">{a.nome || "—"}</td>
                <td className="px-5 py-3 text-muted-foreground">
                  {new Date(a.criado_em).toLocaleDateString("pt-BR")}
                </td>
                <td className="px-5 py-3 text-right">
                  <button
                    onClick={() => remover(a.id)}
                    className="text-xs text-destructive hover:underline"
                  >
                    Remover
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
