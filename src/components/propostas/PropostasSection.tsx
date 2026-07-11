// Fase 2 — Tela "Propostas": lista de propostas por lead, status
// (rascunho/enviada/respondida) e ações gerar/editar/enviar (só UI por ora).
// Consome SOMENTE os tipos centrais (@/types) via a camada de serviço
// (@/services/propostas) — nunca o mock direto.
import { useEffect, useMemo, useState } from "react";
import {
  Loader2, RefreshCw, Plus, Pencil, Send, Mail, FileText, Search,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatBRL, formatData } from "@/lib/format";
import type { Proposta, PropostaStatus } from "@/types";
import {
  listarPropostas, gerarProposta, salvarProposta, enviarProposta,
} from "@/services/propostas";

const STATUS_LABEL: Record<PropostaStatus, string> = {
  rascunho: "Rascunho",
  enviada: "Enviada",
  respondida: "Respondida",
};

const STATUS_STYLE: Record<PropostaStatus, string> = {
  rascunho: "bg-secondary text-muted-foreground",
  enviada: "bg-blue-50 text-blue-700",
  respondida: "bg-green-100 text-green-800",
};

function StatusPill({ status }: { status: PropostaStatus }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", STATUS_STYLE[status])}>
      {STATUS_LABEL[status]}
    </span>
  );
}

export function PropostasSection() {
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gerando, setGerando] = useState(false);
  const [enviandoId, setEnviandoId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<string>("all");
  const [editando, setEditando] = useState<Proposta | null>(null);

  const carregar = async () => {
    setLoading(true);
    setError(null);
    try {
      setPropostas(await listarPropostas());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar propostas");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { carregar(); }, []);

  const filtradas = useMemo(() => {
    const termo = q.trim().toLowerCase();
    return propostas.filter((p) => {
      if (statusFiltro !== "all" && p.status !== statusFiltro) return false;
      if (!termo) return true;
      return p.lead_nome.toLowerCase().includes(termo) || p.assunto.toLowerCase().includes(termo);
    });
  }, [propostas, q, statusFiltro]);

  const totais = useMemo(() => ({
    rascunho: propostas.filter((p) => p.status === "rascunho").length,
    enviada: propostas.filter((p) => p.status === "enviada").length,
    respondida: propostas.filter((p) => p.status === "respondida").length,
  }), [propostas]);

  const handleGerar = async () => {
    setGerando(true);
    try {
      // TODO: LIGAR API — abrir seleção de lead real; hoje gera a partir de mock.
      const nova = await gerarProposta();
      setPropostas((prev) => [nova, ...prev]);
      toast.success(`Rascunho gerado para "${nova.lead_nome}"`);
      setEditando(nova);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível gerar a proposta");
    } finally {
      setGerando(false);
    }
  };

  const handleEnviar = async (p: Proposta) => {
    setEnviandoId(p.id);
    try {
      const atualizada = await enviarProposta(p.id);
      setPropostas((prev) => prev.map((x) => (x.id === atualizada.id ? atualizada : x)));
      toast.success(`Proposta enviada para "${p.lead_nome}"`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao enviar");
    } finally {
      setEnviandoId(null);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Propostas</h1>
          <p className="text-sm text-muted-foreground">
            {propostas.length} propostas · {totais.rascunho} rascunho · {totais.enviada} enviadas · {totais.respondida} respondidas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={carregar}><RefreshCw className="h-4 w-4" /> Atualizar</Button>
          <Button size="sm" onClick={handleGerar} disabled={gerando} className="bg-primary font-semibold hover:bg-primary/90">
            {gerando ? <><Loader2 className="h-4 w-4 animate-spin" /> Gerando...</> : <><Plus className="h-4 w-4" /> Gerar proposta</>}
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-[var(--shadow-card)]">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Filtrar por lead ou assunto..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={statusFiltro} onValueChange={setStatusFiltro}>
          <SelectTrigger className="w-[180px]" aria-label="Filtrar por status"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="rascunho">Rascunho</SelectItem>
            <SelectItem value="enviada">Enviada</SelectItem>
            <SelectItem value="respondida">Respondida</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando propostas...</div>
      ) : error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      ) : filtradas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-16 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
          <h3 className="mt-4 font-semibold">Nenhuma proposta ainda</h3>
          <p className="mt-1 text-sm text-muted-foreground">Clique em "Gerar proposta" para criar o primeiro rascunho.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
          <div className="overflow-x-auto">
            <table className="w-full text-[15px]">
              <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  {["Lead", "Assunto", "Valor", "Status", "Criada em", "Ações"].map((h) => (
                    <th key={h} className="px-4 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtradas.map((p) => (
                  <tr key={p.id} className="border-t border-border hover:bg-secondary/30">
                    <td className="px-4 py-3 font-semibold text-foreground">{p.lead_nome}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.assunto}</td>
                    <td className="px-4 py-3 tabular-nums">{formatBRL(p.valor)}</td>
                    <td className="px-4 py-3"><StatusPill status={p.status} /></td>
                    <td className="px-4 py-3 text-muted-foreground">{formatData(p.criada_em)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Button size="sm" variant="ghost" title="Editar" onClick={() => setEditando(p)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm" variant="ghost"
                          title={p.status === "rascunho" ? "Enviar" : "Já enviada"}
                          onClick={() => handleEnviar(p)}
                          disabled={p.status !== "rascunho" || enviandoId === p.id}
                        >
                          {enviandoId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editando && (
        <EditarPropostaDialog
          proposta={editando}
          onClose={() => setEditando(null)}
          onSalvo={(atualizada) => {
            setPropostas((prev) => prev.map((p) => (p.id === atualizada.id ? atualizada : p)));
            setEditando(null);
          }}
        />
      )}
    </div>
  );
}

function EditarPropostaDialog({
  proposta, onClose, onSalvo,
}: {
  proposta: Proposta;
  onClose: () => void;
  onSalvo: (p: Proposta) => void;
}) {
  const [assunto, setAssunto] = useState(proposta.assunto);
  const [corpo, setCorpo] = useState(proposta.corpo);
  const [valor, setValor] = useState(proposta.valor?.toString() ?? "");
  const [salvando, setSalvando] = useState(false);

  const salvar = async () => {
    setSalvando(true);
    try {
      const atualizada = await salvarProposta({
        ...proposta,
        assunto,
        corpo,
        valor: valor.trim() === "" ? null : Number(valor.replace(",", ".")),
      });
      toast.success("Proposta salva.");
      onSalvo(atualizada);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao salvar");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" /> {proposta.lead_nome}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="assunto">Assunto</Label>
            <Input id="assunto" value={assunto} onChange={(e) => setAssunto(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="corpo">Mensagem</Label>
            <Textarea id="corpo" value={corpo} onChange={(e) => setCorpo(e.target.value)} rows={12} className="font-mono text-sm leading-relaxed" />
            <p className="text-xs text-muted-foreground">
              Sem preço na primeira abordagem — o valor entra depois da resposta.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="valor">Valor (R$) — opcional</Label>
            <Input id="valor" inputMode="decimal" placeholder="ex.: 1800" value={valor} onChange={(e) => setValor(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={salvando}>Cancelar</Button>
          <Button onClick={salvar} disabled={salvando}>
            {salvando ? <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</> : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
