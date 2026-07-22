// Telas STAFF & ROLES do painel admin (dado REAL da org do super admin).
//  • Roles  → papéis da org com toggle Enable/Disable REAL (org_papeis via admin-acoes)
//  • Staffs → colaboradores (memberships); Add Staff cria/vincula de verdade; remover tira o vínculo
import { useState } from "react";
import { Plus, Trash2, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { adminAcao, type Role, type Staff } from "@/services/admin";
import { cn } from "@/lib/utils";

const PAPEL_LABEL: Record<string, string> = {
  admin: "Admin",
  gerente: "Gerente",
  vendedor: "Vendedor",
  sdr: "SDR",
  suporte: "Suporte",
};
const PAPEIS = ["admin", "gerente", "vendedor", "sdr", "suporte"];

export function AdminRoles({ roles, onMudou }: { roles: Role[]; onMudou: () => void }) {
  const [ocupado, setOcupado] = useState<string | null>(null);
  const toggle = async (papel: string, ativo: boolean) => {
    setOcupado(papel);
    try {
      const r = await adminAcao("role_toggle", { papel, ativo });
      if (!r.ok) toast.error(`Falha: ${r.reason}`);
      else onMudou();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setOcupado(null);
    }
  };
  const ordenados = [...roles].sort((a, b) => PAPEIS.indexOf(a.papel) - PAPEIS.indexOf(b.papel));
  return (
    <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="font-serif text-xl">Papéis (Roles)</h2>
          <p className="text-xs text-muted-foreground">
            Ligue/desligue papéis na sua organização — desligado não pode receber novos membros.
          </p>
        </div>
      </div>
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-5 py-2.5 font-medium">Nome</th>
            <th className="px-5 py-2.5 font-medium">Status</th>
            <th className="px-5 py-2.5 text-right font-medium">Ação</th>
          </tr>
        </thead>
        <tbody>
          {ordenados.map((r) => (
            <tr key={r.papel} className="border-b border-border last:border-0">
              <td className="px-5 py-3">
                <span className="inline-flex items-center gap-2 font-medium">
                  <ShieldCheck className="h-4 w-4 text-gold" />
                  {PAPEL_LABEL[r.papel] ?? r.papel}
                </span>
              </td>
              <td className="px-5 py-3">
                <span
                  className={cn(
                    "rounded-md px-2 py-0.5 text-xs font-medium",
                    r.ativo
                      ? "bg-[#16A34A]/10 text-[#15803D]"
                      : "bg-secondary text-muted-foreground",
                  )}
                >
                  {r.ativo ? "Ativado" : "Desativado"}
                </span>
              </td>
              <td className="px-5 py-3 text-right">
                <button
                  onClick={() => toggle(r.papel, !r.ativo)}
                  disabled={ocupado === r.papel}
                  role="switch"
                  aria-checked={r.ativo}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    r.ativo ? "bg-gold" : "bg-secondary",
                  )}
                >
                  {ocupado === r.papel ? (
                    <Loader2 className="mx-auto h-3.5 w-3.5 animate-spin text-white" />
                  ) : (
                    <span
                      className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                        r.ativo ? "translate-x-6" : "translate-x-1",
                      )}
                    />
                  )}
                </button>
              </td>
            </tr>
          ))}
          {roles.length === 0 && (
            <tr>
              <td colSpan={3} className="px-5 py-8 text-center text-sm text-muted-foreground">
                Carregando…
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function AdminStaffs({ staffs, onMudou }: { staffs: Staff[]; onMudou: () => void }) {
  const [addOpen, setAddOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [papel, setPapel] = useState("vendedor");
  const [ocupado, setOcupado] = useState(false);

  const adicionar = async () => {
    if (!email.includes("@")) {
      toast.error("Informe um e-mail válido.");
      return;
    }
    setOcupado(true);
    try {
      const r = await adminAcao("staff_add", { email: email.trim(), papel });
      if (!r.ok) {
        toast.error(`Não adicionou: ${r.reason ?? "erro"}`);
        return;
      }
      toast.success(`${email} adicionado como ${PAPEL_LABEL[papel]}.`);
      setEmail("");
      setAddOpen(false);
      onMudou();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setOcupado(false);
    }
  };
  const remover = async (s: Staff) => {
    if (!confirm(`Remover ${s.email} da organização? A conta não é apagada.`)) return;
    try {
      const r = await adminAcao("staff_remove", { user_id: s.user_id });
      if (!r.ok) toast.error(`Falha: ${r.reason}`);
      else {
        toast.success("Colaborador removido.");
        onMudou();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="font-serif text-xl">Colaboradores (Staffs)</h2>
          <p className="text-xs text-muted-foreground">
            Quem tem acesso à sua organização e com qual papel.
          </p>
        </div>
        <button
          onClick={() => setAddOpen((o) => !o)}
          className="inline-flex items-center gap-1.5 rounded-md bg-navy px-3 py-2 text-xs font-semibold text-navy-foreground hover:bg-navy/90"
        >
          <Plus className="h-3.5 w-3.5" /> Adicionar
        </button>
      </div>
      {addOpen && (
        <div className="flex flex-wrap items-end gap-2 border-b border-border bg-secondary/20 px-5 py-3">
          <div className="flex-1">
            <label className="mb-1 block text-[11px] uppercase text-muted-foreground">E-mail</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colaborador@empresa.com"
              className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] uppercase text-muted-foreground">Papel</label>
            <select
              value={papel}
              onChange={(e) => setPapel(e.target.value)}
              className="h-9 rounded-md border border-input bg-card px-3 text-sm"
            >
              {PAPEIS.filter((p) => p !== "admin").map((p) => (
                <option key={p} value={p}>
                  {PAPEL_LABEL[p]}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={adicionar}
            disabled={ocupado}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-gold px-4 text-xs font-semibold text-gold-foreground disabled:opacity-60"
          >
            {ocupado && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Criar acesso
          </button>
        </div>
      )}
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-5 py-2.5 font-medium">Nome</th>
            <th className="px-5 py-2.5 font-medium">E-mail</th>
            <th className="px-5 py-2.5 font-medium">Papel</th>
            <th className="px-5 py-2.5 text-right font-medium">Ação</th>
          </tr>
        </thead>
        <tbody>
          {staffs.map((s) => (
            <tr key={s.user_id} className="border-b border-border last:border-0">
              <td className="px-5 py-3 font-medium">{s.nome || s.email.split("@")[0]}</td>
              <td className="px-5 py-3 text-muted-foreground">{s.email}</td>
              <td className="px-5 py-3">
                <span className="rounded-md bg-accent px-2 py-0.5 text-xs font-medium text-primary">
                  {PAPEL_LABEL[s.papel] ?? s.papel}
                </span>
              </td>
              <td className="px-5 py-3 text-right">
                {s.papel === "admin" ? (
                  <span className="text-xs text-muted-foreground">dono</span>
                ) : (
                  <button
                    onClick={() => remover(s)}
                    className="inline-flex items-center gap-1 text-xs text-destructive hover:underline"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remover
                  </button>
                )}
              </td>
            </tr>
          ))}
          {staffs.length === 0 && (
            <tr>
              <td colSpan={4} className="px-5 py-8 text-center text-sm text-muted-foreground">
                Só você por enquanto — adicione um colaborador.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
