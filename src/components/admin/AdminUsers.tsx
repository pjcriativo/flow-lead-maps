// Telas USERS do painel admin.
//  • All Users   → todas as contas da plataforma (profiles). Add User cria conta+org real.
//                  Coluna SALDO existe mas mostra "—" (billing não existe → PROIBIDO saldo fake).
//  • Subscribers → sem base de newsletter no produto → "Em breve" honesto; Send Email desabilitado.
import { useState } from "react";
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

export function AdminSubscribers() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-secondary/20 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <h2 className="font-serif text-xl text-muted-foreground">Assinantes (Newsletter)</h2>
          <span className="rounded-full border border-gold/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gold">
            Em breve
          </span>
        </div>
        <button
          disabled
          title="Sem base de assinantes — em breve."
          className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-medium text-muted-foreground/60"
        >
          <Mail className="h-3.5 w-3.5" /> Enviar e-mail
        </button>
      </div>
      <div className="px-5 py-10 text-center text-sm text-muted-foreground">
        O produto ainda não tem captura de newsletter — este espaço já está reservado. Nenhum
        assinante é exibido porque nenhum existe (não inventamos a lista).
      </div>
    </div>
  );
}
