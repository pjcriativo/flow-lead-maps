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
import { validarEmailAutentico } from "@/lib/email-validation";

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
  const [busca, setBusca] = useState("");
  const [filtroAcesso, setFiltroAcesso] = useState<
    "todos" | "liberado" | "pendente" | "super_admin"
  >("todos");
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

  const pendentes = useMemo(
    () => usuarios.filter((u) => !u.acesso_liberado && !u.is_super_admin),
    [usuarios],
  );
  const liberados = useMemo(
    () => usuarios.filter((u) => u.acesso_liberado && !u.is_super_admin),
    [usuarios],
  );
  const superAdmins = useMemo(() => usuarios.filter((u) => u.is_super_admin), [usuarios]);

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      // Filtro de busca
      if (busca.trim()) {
        const q = busca.toLowerCase();
        if (!u.email.toLowerCase().includes(q)) return false;
      }
      // Filtro de aba
      if (filtroAcesso === "liberado") return u.acesso_liberado && !u.is_super_admin;
      if (filtroAcesso === "pendente") return !u.acesso_liberado && !u.is_super_admin;
      if (filtroAcesso === "super_admin") return u.is_super_admin;
      return true;
    });
  }, [usuarios, busca, filtroAcesso]);

  const adicionar = async () => {
    const val = validarEmailAutentico(email);
    if (!val.valido) {
      toast.error(val.motivo ?? "Informe um e-mail válido.");
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

  // Formata limite de leads de forma compacta e legível
  const formatarLimiteCompacto = (n: number | null) => {
    if (n === null) return "∞";
    if (n >= 1000000)
      return `${(n / 1000000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}M`;
    if (n >= 1000) return `${(n / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}k`;
    return n.toLocaleString("pt-BR");
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Header com Titulo e Botão */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border px-5 py-4 bg-card">
        <div>
          <h2 className="font-serif text-xl font-semibold tracking-tight">Todos os usuários</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gerencie acessos, planos e permissões de todos os usuários cadastrados na plataforma.
          </p>
        </div>
        <button
          onClick={() => setAddOpen((o) => !o)}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all shrink-0 cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Adicionar usuário
        </button>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border bg-secondary/10 px-5 py-3">
        {/* Pills de status */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFiltroAcesso("todos")}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer",
              filtroAcesso === "todos"
                ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            Todos ({usuarios.length})
          </button>
          <button
            onClick={() => setFiltroAcesso("liberado")}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer",
              filtroAcesso === "liberado"
                ? "bg-emerald-600 text-white shadow-xs font-semibold"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            Liberados ({liberados.length})
          </button>
          <button
            onClick={() => setFiltroAcesso("pendente")}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer",
              filtroAcesso === "pendente"
                ? "bg-amber-600 text-white shadow-xs font-semibold"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            Pendentes ({pendentes.length})
          </button>
          <button
            onClick={() => setFiltroAcesso("super_admin")}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer",
              filtroAcesso === "super_admin"
                ? "bg-blue-600 text-white shadow-xs font-semibold"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            Super Admins ({superAdmins.length})
          </button>
        </div>

        {/* Input de Busca */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por e-mail..."
            className="h-8 w-full rounded-md border border-input bg-background pl-8 pr-7 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
          />
          {busca && (
            <button
              onClick={() => setBusca("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Form adicionar */}
      {addOpen && (
        <div className="flex flex-wrap items-end gap-3 border-b border-border bg-primary/5 px-5 py-3 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex-1 min-w-[220px]">
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              E-mail do novo usuário
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && adicionar()}
              placeholder="novo.usuario@empresa.com"
              className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button
            onClick={adicionar}
            disabled={ocupado}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-gold px-4 text-xs font-semibold text-gold-foreground hover:bg-gold/90 transition-all disabled:opacity-60 cursor-pointer shadow-xs"
          >
            {ocupado && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Criar conta
          </button>
          <button
            onClick={() => setAddOpen(false)}
            className="inline-flex h-9 items-center px-3 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Tabela Responsiva sem cortes */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="border-b border-border bg-secondary/30 text-xs font-semibold uppercase tracking-wider text-muted-foreground select-none">
            <tr>
              <th className="px-5 py-3 font-semibold text-left">Usuário</th>
              <th className="px-4 py-3 font-semibold text-left">Plano</th>
              <th className="px-4 py-3 font-semibold text-left">Leads / Mês</th>
              <th className="px-4 py-3 font-semibold text-left">Status</th>
              <th className="px-4 py-3 font-semibold text-left">Entrou em</th>
              <th className="px-5 py-3 font-semibold text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {usuariosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Users className="h-8 w-8 text-muted-foreground/40" />
                    <p className="text-sm font-medium">Nenhum usuário encontrado</p>
                    <p className="text-xs text-muted-foreground">
                      Tente alterar os termos da busca ou filtro selecionado.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              usuariosFiltrados.map((u) => {
                const initial = u.email.charAt(0).toUpperCase();
                return (
                  <tr key={u.id} className="hover:bg-secondary/20 transition-colors group">
                    {/* Usuário com Avatar */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs ring-1 ring-primary/20">
                          {initial}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className="font-medium text-sm text-foreground break-all"
                            title={u.email}
                          >
                            {u.email}
                          </p>
                          {u.full_name && (
                            <p className="text-[11px] text-muted-foreground truncate">
                              {u.full_name}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Plano — select inline estilizado p/ liberados, badge p/ demais */}
                    <td className="px-4 py-3.5">
                      {u.is_super_admin ? (
                        <span className="text-xs font-medium text-muted-foreground px-2 py-0.5 rounded bg-secondary/50">
                          Ilimitado (Admin)
                        </span>
                      ) : u.acesso_liberado ? (
                        <div className="relative max-w-[190px]">
                          <select
                            value={u.plano_id ?? ""}
                            disabled={alterandoId === u.id || planosAtivos.length === 0}
                            onChange={(e) => alterarPlano(u, e.target.value)}
                            className="w-full truncate rounded-lg border border-input bg-background pl-2.5 pr-6 py-1.5 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer disabled:opacity-50 shadow-xs appearance-none"
                            title="Alterar plano"
                          >
                            {!u.plano_id && <option value="">— Sem plano definido —</option>}
                            {planosAtivos.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.nome}{" "}
                                {p.limite_leads !== null
                                  ? `(${formatarLimiteCompacto(p.limite_leads)}/mês)`
                                  : "(∞)"}
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                            <Layers className="h-3 w-3 opacity-60" />
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-muted text-muted-foreground border border-border">
                          {u.plano_nome ?? u.plan ?? "Sem plano"}
                        </span>
                      )}
                    </td>

                    {/* Limite de leads — mostra override quando presente */}
                    <td className="px-4 py-3.5">
                      {u.is_super_admin ? (
                        <span className="text-xs font-semibold text-muted-foreground">∞</span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          {u.leads_override !== null ? (
                            <span
                              className="inline-flex items-center gap-1 rounded-md bg-gold/15 border border-gold/30 px-2 py-0.5 text-xs font-semibold text-gold-foreground"
                              title="Override individual ativo"
                            >
                              <Zap className="h-3 w-3 text-gold shrink-0" />
                              {u.leads_override.toLocaleString("pt-BR")}
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-foreground">
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
                          {u.acesso_liberado && !u.is_super_admin && (
                            <button
                              onClick={() => {
                                setOverrideValor(
                                  u.leads_override !== null ? String(u.leads_override) : "",
                                );
                                setOverrideModal({ usuario: u });
                              }}
                              title="Configurar override de limite de leads"
                              className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground/60 hover:text-gold hover:bg-gold/15 transition-colors cursor-pointer"
                            >
                              <Zap className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Status de Acesso */}
                    <td className="px-4 py-3.5">
                      {u.is_super_admin ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-400">
                          <ShieldCheck className="size-3.5" /> Super Admin
                        </span>
                      ) : u.acesso_liberado ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                          <Check className="size-3.5" /> Liberado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                          <Clock3 className="size-3.5" /> Pendente
                        </span>
                      )}
                    </td>

                    {/* Data */}
                    <td className="px-4 py-3.5 text-muted-foreground text-xs whitespace-nowrap">
                      {new Date(u.created_at).toLocaleDateString("pt-BR")}
                    </td>

                    {/* Ações — Botoes alinhados e sem cortes */}
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
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
                                className="h-8 gap-1.5 text-xs font-medium cursor-pointer shadow-2xs"
                              >
                                {alterandoId === u.id ? (
                                  <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                  <LockKeyhole className="size-3.5 text-muted-foreground" />
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
                                className="h-8 gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs"
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
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                              title="Excluir conta permanentemente"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-border px-5 py-3 text-xs text-muted-foreground bg-secondary/10">
        <span>
          Novos cadastros ficam pendentes até um administrador liberar o acesso manualmente.
        </span>
        <span className="font-medium">
          Exibindo {usuariosFiltrados.length} de {usuarios.length} usuários
        </span>
      </div>

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
