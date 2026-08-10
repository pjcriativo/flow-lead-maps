// Telas USERS do painel admin.
//  • All Users   → todas as contas da plataforma (profiles). Add User cria conta+org real.
//                  Planos carregados do catálogo real (sem lista hardcoded). Override de leads
//                  por conta disponível para ajustes finos sem criar novo plano.
//  • Subscribers → CRUD manual (sem origem de captação automática); "Enviar e-mail" fica
//                  desabilitado com o motivo (não existe motor de disparo em massa ainda).
import { useEffect, useState, useMemo } from "react";
import {
  Check,
  Clock3,
  Loader2,
  LockKeyhole,
  Mail,
  Plus,
  ShieldCheck,
  Trash2,
  AlertTriangle,
  Zap,
  X,
  Users,
  Layers,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { adminAcao, type Plano, type UsuarioPlataforma } from "@/services/admin";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AdminAllUsers({
  usuarios,
  planos,
  onMudou,
}: {
  usuarios: UsuarioPlataforma[];
  planos: Plano[];
  onMudou: () => void;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [alterandoId, setAlterandoId] = useState<string | null>(null);
  // Modal "Liberar com plano"
  const [liberarModal, setLiberarModal] = useState<{ usuario: UsuarioPlataforma } | null>(null);
  const [planoSelecionadoId, setPlanoSelecionadoId] = useState<string>("");
  // Modal confirmação de exclusão
  const [deleteModal, setDeleteModal] = useState<{ usuario: UsuarioPlataforma } | null>(null);
  // Modal override de leads
  const [overrideModal, setOverrideModal] = useState<{ usuario: UsuarioPlataforma } | null>(null);
  const [overrideValor, setOverrideValor] = useState<string>("");

  // Planos ativos do catálogo (ordenados)
  const planosAtivos = planos.filter((p) => p.ativo);

  // Inicializar plano padrão quando abrir modal
  useEffect(() => {
    if (liberarModal && planosAtivos.length > 0 && !planoSelecionadoId) {
      setPlanoSelecionadoId(planosAtivos[0].id);
    }
  }, [liberarModal, planosAtivos, planoSelecionadoId]);

  const pendentes = usuarios.filter((u) => !u.acesso_liberado && !u.is_super_admin);

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

  const alterarAcesso = async (usuario: UsuarioPlataforma, liberado: boolean, planoId?: string) => {
    setAlterandoId(usuario.id);
    try {
      const payload: Record<string, unknown> = { user_id: usuario.id, liberado };
      // Passa UUID do plano do catálogo (preferido) ao liberar
      if (liberado && planoId) payload.plano_id = planoId;
      const r = await adminAcao("user_access_set", payload);
      if (!r.ok) {
        toast.error(`Não foi possível alterar o acesso: ${r.reason ?? "erro"}`);
        return;
      }
      const planoNome = planosAtivos.find((p) => p.id === planoId)?.nome;
      toast.success(
        liberado
          ? `Acesso liberado para ${usuario.email}${planoNome ? ` (${planoNome})` : ""}.`
          : `Acesso bloqueado para ${usuario.email}.`,
      );
      onMudou();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao alterar acesso");
    } finally {
      setAlterandoId(null);
    }
  };

  const alterarPlano = async (usuario: UsuarioPlataforma, planoId: string) => {
    setAlterandoId(usuario.id);
    try {
      const r = await adminAcao("user_plan_set", { user_id: usuario.id, plano_id: planoId });
      if (!r.ok) {
        toast.error(`Não foi possível alterar o plano: ${r.reason ?? "erro"}`);
        return;
      }
      const planoNome = planosAtivos.find((p) => p.id === planoId)?.nome ?? planoId;
      toast.success(`Plano de ${usuario.email} → "${planoNome}".`);
      onMudou();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao alterar plano");
    } finally {
      setAlterandoId(null);
    }
  };

  const salvarOverride = async () => {
    if (!overrideModal) return;
    const limite = overrideValor.trim() === "" ? null : Number(overrideValor);
    if (limite !== null && (isNaN(limite) || limite < 0)) {
      toast.error("Informe um número válido ou deixe em branco para remover o override.");
      return;
    }
    setAlterandoId(overrideModal.usuario.id);
    try {
      const r = await adminAcao("user_leads_override", {
        user_id: overrideModal.usuario.id,
        limite,
      });
      if (!r.ok) {
        toast.error(`Não foi possível salvar: ${r.reason ?? "erro"}`);
        return;
      }
      toast.success(
        limite === null
          ? `Override removido para ${overrideModal.usuario.email} — voltará a usar o limite do plano.`
          : `Limite de leads para ${overrideModal.usuario.email} → ${limite.toLocaleString("pt-BR")}.`,
      );
      setOverrideModal(null);
      onMudou();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
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

  // Plano selecionado no modal de liberação
  const planoSelecionado = planosAtivos.find((p) => p.id === planoSelecionadoId);

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
              <th className="px-5 py-2.5 font-medium">Leads</th>
              <th className="px-5 py-2.5 font-medium">Acesso</th>
              <th className="px-5 py-2.5 font-medium">Entrou em</th>
              <th className="w-px whitespace-nowrap px-5 py-2.5 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr
                key={u.id}
                className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors"
              >
                {/* Usuário */}
                <td className="px-5 py-3 font-medium">{u.email}</td>

                {/* Plano — select inline p/ liberados, texto p/ demais */}
                <td className="px-5 py-3">
                  {u.is_super_admin ? (
                    <span className="text-xs uppercase text-muted-foreground">—</span>
                  ) : u.acesso_liberado ? (
                    <select
                      value={u.plano_id ?? ""}
                      disabled={alterandoId === u.id || planosAtivos.length === 0}
                      onChange={(e) => alterarPlano(u, e.target.value)}
                      className="rounded-md border border-input bg-card px-2 py-1 text-xs font-medium focus:outline-none cursor-pointer capitalize disabled:opacity-50"
                      title="Alterar plano"
                    >
                      {/* Opção vazia se org ainda não tem plano_id */}
                      {!u.plano_id && <option value="">— sem plano —</option>}
                      {planosAtivos.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nome}
                          {p.limite_leads !== null
                            ? ` (${p.limite_leads.toLocaleString("pt-BR")}/mês)`
                            : " (∞)"}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-xs uppercase text-muted-foreground">
                      {u.plano_nome ?? u.plan ?? "—"}
                    </span>
                  )}
                </td>

                {/* Limite de leads — mostra override quando presente */}
                <td className="px-5 py-3">
                  {u.is_super_admin ? (
                    <span className="text-xs text-muted-foreground">∞</span>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">
                        {u.leads_override !== null ? (
                          <span className="font-semibold text-gold">
                            {u.leads_override.toLocaleString("pt-BR")}
                            <span className="ml-1 text-[10px] font-normal text-muted-foreground">
                              override
                            </span>
                          </span>
                        ) : (
                          <span>
                            {(() => {
                              const plano = planosAtivos.find((p) => p.id === u.plano_id);
                              return plano
                                ? plano.limite_leads !== null
                                  ? plano.limite_leads.toLocaleString("pt-BR")
                                  : "∞"
                                : "—";
                            })()}
                          </span>
                        )}
                      </span>
                      {u.acesso_liberado && !u.is_super_admin && (
                        <button
                          onClick={() => {
                            setOverrideValor(
                              u.leads_override !== null ? String(u.leads_override) : "",
                            );
                            setOverrideModal({ usuario: u });
                          }}
                          title="Definir override de leads"
                          className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground/50 hover:text-gold hover:bg-gold/10 transition-colors"
                        >
                          <Zap className="h-3 w-3" />
                        </button>
                      )}
                    </div>
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
                            onClick={() => {
                              setPlanoSelecionadoId(planosAtivos[0]?.id ?? "");
                              setLiberarModal({ usuario: u });
                            }}
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
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div>
              <h3 className="font-serif text-lg font-semibold">Liberar acesso</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Escolha o plano que <b>{liberarModal.usuario.email}</b> receberá ao ser liberado.
              </p>
            </div>

            {planosAtivos.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum plano ativo no catálogo. Crie um plano antes de liberar usuários.
              </p>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Plano
                  </label>
                  <select
                    value={planoSelecionadoId}
                    onChange={(e) => setPlanoSelecionadoId(e.target.value)}
                    className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus:outline-none"
                  >
                    {planosAtivos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome} — R${" "}
                        {Number(p.preco).toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                        /{p.periodo === "anual" ? "ano" : "mês"}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Preview dos limites do plano selecionado */}
                {planoSelecionado && (
                  <div className="rounded-lg border border-border bg-secondary/30 px-4 py-3 space-y-1">
                    {planoSelecionado.descricao && (
                      <p className="text-[12px] text-muted-foreground italic mb-2">
                        {planoSelecionado.descricao}
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[12px]">
                      <span className="text-muted-foreground">Leads/mês:</span>
                      <span className="font-semibold">
                        {planoSelecionado.limite_leads !== null
                          ? planoSelecionado.limite_leads.toLocaleString("pt-BR")
                          : "∞"}
                      </span>
                      <span className="text-muted-foreground">Sites IA/mês:</span>
                      <span className="font-semibold">
                        {planoSelecionado.limite_sites !== null
                          ? planoSelecionado.limite_sites.toLocaleString("pt-BR")
                          : "∞"}
                      </span>
                      <span className="text-muted-foreground">Campanhas/mês:</span>
                      <span className="font-semibold">
                        {planoSelecionado.limite_campanhas !== null
                          ? planoSelecionado.limite_campanhas.toLocaleString("pt-BR")
                          : "∞"}
                      </span>
                      <span className="text-muted-foreground">WhatsApp chips:</span>
                      <span className="font-semibold">
                        {planoSelecionado.limite_whatsapp !== null
                          ? planoSelecionado.limite_whatsapp.toLocaleString("pt-BR")
                          : "∞"}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                className="flex-1 gap-1.5"
                disabled={alterandoId === liberarModal.usuario.id || planosAtivos.length === 0}
                onClick={async () => {
                  await alterarAcesso(liberarModal.usuario, true, planoSelecionadoId || undefined);
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

      {/* ── Modal: Override de limite de leads por conta ── */}
      {overrideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl border border-gold/30 bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/10">
                <Zap className="size-5 text-gold" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-semibold">Override de leads</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Define um limite personalizado de leads para <b>{overrideModal.usuario.email}</b>{" "}
                  sem mudar o plano. Deixe em branco para remover o override.
                </p>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Limite de leads/mês
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  value={overrideValor}
                  onChange={(e) => setOverrideValor(e.target.value)}
                  placeholder="Deixe vazio para usar o plano"
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm transition-all hover:border-gold/40 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25 pr-8"
                />
                {overrideValor && (
                  <button
                    onClick={() => setOverrideValor("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {overrideModal.usuario.plano_id &&
                (() => {
                  const plano = planosAtivos.find((p) => p.id === overrideModal.usuario.plano_id);
                  return plano ? (
                    <p className="text-[11px] text-muted-foreground">
                      Limite do plano {plano.nome}:{" "}
                      <b>
                        {plano.limite_leads !== null
                          ? plano.limite_leads.toLocaleString("pt-BR")
                          : "∞"}
                      </b>{" "}
                      leads/mês
                    </p>
                  ) : null;
                })()}
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                className="flex-1 gap-1.5 bg-gold text-navy hover:bg-gold/90"
                disabled={alterandoId === overrideModal.usuario.id}
                onClick={salvarOverride}
              >
                {alterandoId === overrideModal.usuario.id ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Zap className="size-3.5" />
                )}
                Salvar override
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOverrideModal(null)}
                disabled={alterandoId === overrideModal.usuario.id}
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
                  Esta ação é <b>irreversível</b>. A conta de <b>{deleteModal.usuario.email}</b> e
                  todos os seus dados serão permanentemente removidos.
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

export function AdminSubscribers({
  usuarios,
  planos,
  onMudou,
}: {
  usuarios: UsuarioPlataforma[];
  planos: Plano[];
  onMudou?: () => void;
}) {
  const [busca, setBusca] = useState("");
  const [filtroPlano, setFiltroPlano] = useState<string>("todos");

  // Apenas clientes com acesso liberado (exclui super admin da lista de assinantes)
  const assinantesAtivos = useMemo(() => {
    return usuarios.filter((u) => u.acesso_liberado && !u.is_super_admin);
  }, [usuarios]);

  // Estatísticas calculadas
  const stats = useMemo(() => {
    let totalLeadsAlocados = 0;
    let semLimiteCount = 0;
    const porPlano: Record<string, number> = {};

    for (const a of assinantesAtivos) {
      const p = planos.find((pl) => pl.id === a.plano_id);
      const limit = a.leads_override !== null ? a.leads_override : (p?.limite_leads ?? null);
      if (limit === null) {
        semLimiteCount++;
      } else {
        totalLeadsAlocados += limit;
      }

      const planoNome = a.plano_nome || a.plan || "Sem Plano";
      porPlano[planoNome] = (porPlano[planoNome] || 0) + 1;
    }

    return { totalLeadsAlocados, semLimiteCount, porPlano };
  }, [assinantesAtivos, planos]);

  // Filtragem na busca e por plano
  const assinantesFiltrados = useMemo(() => {
    return assinantesAtivos.filter((a) => {
      // Filtro de busca (nome ou email)
      if (busca.trim()) {
        const query = busca.toLowerCase();
        const nome = (a.full_name || a.email.split("@")[0]).toLowerCase();
        const email = a.email.toLowerCase();
        if (!nome.includes(query) && !email.includes(query)) return false;
      }
      // Filtro de plano
      if (filtroPlano !== "todos") {
        const planoAtual = (a.plano_nome || a.plan || "sem_plano").toLowerCase();
        if (planoAtual !== filtroPlano.toLowerCase()) return false;
      }
      return true;
    });
  }, [assinantesAtivos, busca, filtroPlano]);

  const PLAN_BADGES: Record<string, string> = {
    starter: "bg-slate-100 text-slate-700 border-slate-200",
    básico: "bg-blue-50 text-blue-700 border-blue-200 font-semibold",
    basico: "bg-blue-50 text-blue-700 border-blue-200 font-semibold",
    pro: "bg-indigo-50 text-indigo-700 border-indigo-200 font-bold",
    agência: "bg-amber-50 text-amber-800 border-amber-300 font-bold shadow-xs",
    agencia: "bg-amber-50 text-amber-800 border-amber-300 font-bold shadow-xs",
    enterprise: "bg-amber-50 text-amber-800 border-amber-300 font-bold shadow-xs",
  };

  return (
    <div className="space-y-6">
      {/* Cards de Métricas no Topo */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-2.5 text-emerald-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Assinantes Ativos
              </p>
              <p className="text-2xl font-black text-foreground">{assinantesAtivos.length}</p>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">Clientes com acesso liberado</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2.5 text-blue-600">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Capacidade de Leads
              </p>
              <p className="text-2xl font-black text-foreground">
                {stats.totalLeadsAlocados.toLocaleString("pt-BR")}
                {stats.semLimiteCount > 0 && (
                  <span className="text-xs font-normal text-muted-foreground ml-1">(+∞)</span>
                )}
              </p>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">Soma das cotas mensais ativas</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-500/10 p-2.5 text-amber-600">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Mix de Planos
              </p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {Object.entries(stats.porPlano).map(([plano, qtd]) => (
                  <span
                    key={plano}
                    className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs font-medium"
                  >
                    <span className="font-bold">{plano}:</span> {qtd}
                  </span>
                ))}
                {Object.keys(stats.porPlano).length === 0 && (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </div>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">Distribuição atual da base</p>
        </div>
      </div>

      {/* Container Principal */}
      <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
        {/* Header com Filtros e Busca */}
        <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-serif text-xl font-bold">Assinantes Ativos</h2>
            <p className="text-xs text-muted-foreground">
              Visão consolidada de clientes, cotas de leads e serviços inclusos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Campo de Busca */}
            <div className="relative min-w-[240px] flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por cliente ou e-mail..."
                className="h-9 w-full rounded-md border border-input bg-card pl-9 pr-3 text-xs focus:border-primary focus:outline-none"
              />
            </div>

            {/* Filtro por Plano */}
            <select
              value={filtroPlano}
              onChange={(e) => setFiltroPlano(e.target.value)}
              className="h-9 rounded-md border border-input bg-card px-3 text-xs font-medium focus:border-primary focus:outline-none"
            >
              <option value="todos">Todos os Planos</option>
              {planos.map((p) => (
                <option key={p.id} value={p.nome}>
                  {p.nome}
                </option>
              ))}
            </select>

            <button
              disabled
              title="Em breve: envio de e-mail em massa/newsletter."
              className="inline-flex h-9 cursor-not-allowed items-center gap-1.5 rounded-md border border-border px-3 text-xs font-medium text-muted-foreground/60"
            >
              <Mail className="h-3.5 w-3.5" /> E-mail em massa
            </button>
          </div>
        </div>

        {/* Tabela de Assinantes */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-secondary/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3">Cliente / Conta</th>
                <th className="px-5 py-3">Plano Atual</th>
                <th className="px-5 py-3">Limite Leads</th>
                <th className="px-5 py-3">Sites IA</th>
                <th className="px-5 py-3">Campanhas</th>
                <th className="px-5 py-3">WhatsApp Chips</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {assinantesFiltrados.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="h-6 w-6 text-muted-foreground/40" />
                      <p>Nenhum assinante encontrado com os filtros atuais.</p>
                    </div>
                  </td>
                </tr>
              )}
              {assinantesFiltrados.map((a) => {
                const plano = planos.find((p) => p.id === a.plano_id);
                const nomeCliente = a.full_name || a.email.split("@")[0];
                const planoNome = a.plano_nome ?? a.plan ?? "Sem Plano";

                // Limite de leads (override toma precedência)
                const limitLeads =
                  a.leads_override !== null ? a.leads_override : (plano?.limite_leads ?? null);

                return (
                  <tr key={a.id} className="hover:bg-secondary/20 transition-colors">
                    {/* Cliente / Conta (Nome em negrito + email) */}
                    <td className="px-5 py-3.5 font-medium">
                      <p className="font-bold text-foreground text-sm">{nomeCliente}</p>
                      <p className="text-xs text-muted-foreground">{a.email}</p>
                    </td>

                    {/* Plano Atual (Badge colorida) */}
                    <td className="px-5 py-3.5">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] uppercase font-bold shadow-2xs",
                          PLAN_BADGES[planoNome.toLowerCase()] ||
                            "bg-slate-100 text-slate-700 border-slate-200",
                        )}
                      >
                        {planoNome}
                      </span>
                    </td>

                    {/* Limite de Leads */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-foreground text-sm">
                          {limitLeads !== null ? limitLeads.toLocaleString("pt-BR") : "Ilimitado"}
                        </span>
                        {a.leads_override !== null && (
                          <span className="inline-flex items-center rounded bg-gold/15 px-1.5 py-0.5 text-[10px] font-bold text-gold uppercase tracking-wider">
                            Override
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Sites IA */}
                    <td className="px-5 py-3.5 text-muted-foreground">
                      {plano?.limite_sites !== null && plano?.limite_sites !== undefined
                        ? plano.limite_sites.toLocaleString("pt-BR")
                        : "Ilimitado"}
                    </td>

                    {/* Campanhas */}
                    <td className="px-5 py-3.5 text-muted-foreground">
                      {plano?.limite_campanhas !== null && plano?.limite_campanhas !== undefined
                        ? plano.limite_campanhas.toLocaleString("pt-BR")
                        : "Ilimitado"}
                    </td>

                    {/* WhatsApp */}
                    <td className="px-5 py-3.5 text-muted-foreground">
                      {plano?.limite_whatsapp !== null && plano?.limite_whatsapp !== undefined
                        ? plano.limite_whatsapp.toLocaleString("pt-BR")
                        : "Ilimitado"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
