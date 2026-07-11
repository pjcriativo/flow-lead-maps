// Fase 2 — Tela "Financeiro": contratos/cobranças, valores e status de
// pagamento em tabela, com KPIs no topo (só UI + mock por ora).
// Consome SOMENTE os tipos centrais (@/types) via a camada de serviço
// (@/services/financeiro) — nunca o mock direto.
import { useEffect, useMemo, useState } from "react";
import {
  Loader2, RefreshCw, Search, CheckCircle2, Wallet, TrendingUp, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatBRL, formatData } from "@/lib/format";
import type { RegistroFinanceiro, PagamentoStatus } from "@/types";
import { listarFinanceiro, marcarComoPago } from "@/services/financeiro";

const STATUS_LABEL: Record<PagamentoStatus, string> = {
  pendente: "Pendente",
  pago: "Pago",
  atrasado: "Atrasado",
  cancelado: "Cancelado",
};

const STATUS_STYLE: Record<PagamentoStatus, string> = {
  pendente: "bg-amber-50 text-amber-700",
  pago: "bg-green-100 text-green-800",
  atrasado: "bg-red-50 text-red-700",
  cancelado: "bg-secondary text-muted-foreground line-through",
};

function StatusPill({ status }: { status: PagamentoStatus }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", STATUS_STYLE[status])}>
      {STATUS_LABEL[status]}
    </span>
  );
}

export function FinanceiroSection() {
  const [registros, setRegistros] = useState<RegistroFinanceiro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagandoId, setPagandoId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<string>("all");

  const carregar = async () => {
    setLoading(true);
    setError(null);
    try {
      setRegistros(await listarFinanceiro());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar o financeiro");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { carregar(); }, []);

  const kpis = useMemo(() => {
    const soma = (f: (r: RegistroFinanceiro) => boolean) =>
      registros.filter(f).reduce((acc, r) => acc + r.valor, 0);
    return {
      aReceber: soma((r) => r.status === "pendente" || r.status === "atrasado"),
      recebido: soma((r) => r.status === "pago"),
      atrasado: soma((r) => r.status === "atrasado"),
    };
  }, [registros]);

  const filtrados = useMemo(() => {
    const termo = q.trim().toLowerCase();
    return registros.filter((r) => {
      if (statusFiltro !== "all" && r.status !== statusFiltro) return false;
      if (!termo) return true;
      return r.lead_nome.toLowerCase().includes(termo) || r.descricao.toLowerCase().includes(termo);
    });
  }, [registros, q, statusFiltro]);

  const handlePagar = async (r: RegistroFinanceiro) => {
    setPagandoId(r.id);
    try {
      const atualizado = await marcarComoPago(r.id);
      setRegistros((prev) => prev.map((x) => (x.id === atualizado.id ? atualizado : x)));
      toast.success(`"${r.descricao}" marcado como pago`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao marcar como pago");
    } finally {
      setPagandoId(null);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Financeiro</h1>
          <p className="text-sm text-muted-foreground">Contratos, valores e status de pagamento.</p>
        </div>
        <Button variant="outline" size="sm" onClick={carregar}><RefreshCw className="h-4 w-4" /> Atualizar</Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard titulo="A receber" valor={kpis.aReceber} Icon={Wallet} cor="text-amber-600" />
        <KpiCard titulo="Recebido" valor={kpis.recebido} Icon={TrendingUp} cor="text-[#16A34A]" />
        <KpiCard titulo="Em atraso" valor={kpis.atrasado} Icon={AlertTriangle} cor="text-red-600" />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-[var(--shadow-card)]">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Filtrar por lead ou descrição..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={statusFiltro} onValueChange={setStatusFiltro}>
          <SelectTrigger className="w-[180px]" aria-label="Filtrar por status"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="pago">Pago</SelectItem>
            <SelectItem value="atrasado">Atrasado</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</div>
      ) : error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      ) : filtrados.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-16 text-center">
          <Wallet className="mx-auto h-8 w-8 text-muted-foreground" />
          <h3 className="mt-4 font-semibold">Nenhum registro financeiro</h3>
          <p className="mt-1 text-sm text-muted-foreground">Os lançamentos aparecem aqui quando houver contratos/cobranças.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
          <div className="overflow-x-auto">
            <table className="w-full text-[15px]">
              <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  {["Lead", "Descrição", "Valor", "Vencimento", "Status", "Ações"].map((h) => (
                    <th key={h} className="px-4 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.map((r) => (
                  <tr key={r.id} className="border-t border-border hover:bg-secondary/30">
                    <td className="px-4 py-3 font-semibold text-foreground">{r.lead_nome}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.descricao}</td>
                    <td className="px-4 py-3 tabular-nums font-medium">{formatBRL(r.valor)}</td>
                    <td className={cn("px-4 py-3 tabular-nums", r.status === "atrasado" ? "text-red-600" : "text-muted-foreground")}>
                      {formatData(r.vencimento)}
                    </td>
                    <td className="px-4 py-3"><StatusPill status={r.status} /></td>
                    <td className="px-4 py-3">
                      {(r.status === "pendente" || r.status === "atrasado") ? (
                        <Button size="sm" variant="ghost" title="Marcar como pago" onClick={() => handlePagar(r)} disabled={pagandoId === r.id}>
                          {pagandoId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 text-[#16A34A]" />}
                        </Button>
                      ) : r.status === "pago" ? (
                        <span className="text-xs text-muted-foreground">Pago em {formatData(r.pago_em)}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({
  titulo, valor, Icon, cor,
}: {
  titulo: string;
  valor: number;
  Icon: typeof Wallet;
  cor: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{titulo}</span>
        <Icon className={cn("h-4 w-4", cor)} />
      </div>
      <div className={cn("mt-2 text-2xl font-semibold tabular-nums", cor)}>{formatBRL(valor)}</div>
    </div>
  );
}
