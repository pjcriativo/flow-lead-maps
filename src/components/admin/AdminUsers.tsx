// Telas USERS do painel admin.
//  • All Users   → todas as contas da plataforma (profiles). Add User cria conta+org real.
//                  Coluna SALDO existe mas mostra "—" (billing não existe → PROIBIDO saldo fake).
//  • Subscribers → CRUD manual (sem origem de captação automática); "Enviar e-mail" fica
//                  desabilitado com o motivo (não existe motor de disparo em massa ainda).
import { useEffect, useState } from "react";
import { Plus, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { adminAcao, type UsuarioPlataforma } from "@/services/admin";

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

  return (
    <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="font-serif text-xl">Todos os usuários</h2>
          <p className="text-xs text-muted-foreground">
            Todas as contas da plataforma ({usuarios.length}).
          </p>
        </div>
        <button
          onClick={() => setAddOpen((o) => !o)}
          className="inline-flex items-center gap-1.5 rounded-md bg-navy px-3 py-2 text-xs font-semibold text-navy-foreground hover:bg-navy/90"
        >
          <Plus className="h-3.5 w-3.5" /> Adicionar usuário
        </button>
      </div>
      {addOpen && (
        <div className="flex flex-wrap items-end gap-2 border-b border-border bg-secondary/20 px-5 py-3">
          <div className="flex-1">
            <label className="mb-1 block text-[11px] uppercase text-muted-foreground">E-mail</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-5 py-2.5 font-medium">Usuário</th>
              <th className="px-5 py-2.5 font-medium">Plano</th>
              <th className="px-5 py-2.5 font-medium">Entrou em</th>
              <th className="px-5 py-2.5 text-right font-medium">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.email} className="border-b border-border last:border-0">
                <td className="px-5 py-3 font-medium">{u.email}</td>
                <td className="px-5 py-3 text-xs uppercase text-muted-foreground">
                  {u.plan ?? "—"}
                </td>
                <td className="px-5 py-3 text-muted-foreground">
                  {new Date(u.created_at).toLocaleDateString("pt-BR")}
                </td>
                {/* billing não existe → saldo NÃO é inventado */}
                <td
                  className="px-5 py-3 text-right text-muted-foreground"
                  title="Cobrança/saldo ainda não existe no produto — em breve."
                >
                  —
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="border-t border-border px-5 py-2 text-[11px] text-muted-foreground">
        A coluna <b>Saldo</b> fica “—” de propósito: não há cobrança/carteira no produto ainda.
        Nenhum valor é inventado.
      </p>
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
