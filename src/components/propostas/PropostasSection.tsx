// Fase 2 — Tela "Propostas" LIGADA ao Supabase. Gera proposta a partir de um lead
// COM site publicado (a prévia vira o link único, sem preço), edita, opcionalmente
// "melhora com IA", e "envia" = copia o texto + marca como enviada (SMTP fica p/
// depois). Consome só os tipos centrais via a camada de serviço (@/services/propostas).
import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  RefreshCw,
  Plus,
  Pencil,
  Send,
  Mail,
  FileText,
  Search,
  Copy,
  Sparkles,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatBRL, formatData } from "@/lib/format";
import type { Proposta, PropostaStatus } from "@/types";
import {
  listarPropostas,
  gerarProposta,
  salvarProposta,
  enviarProposta,
  listarLeadsParaProposta,
  melhorarPropostaComIA,
  type LeadCandidato,
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
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        STATUS_STYLE[status],
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

/** Copia texto para a área de transferência (best-effort). */
async function copiar(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    return false;
  }
}

export function PropostasSection() {
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enviandoId, setEnviandoId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<string>("all");
  const [editando, setEditando] = useState<Proposta | null>(null);
  const [abrindoGerar, setAbrindoGerar] = useState(false);

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
  useEffect(() => {
    carregar();
  }, []);

  const filtradas = useMemo(() => {
    const termo = q.trim().toLowerCase();
    return propostas.filter((p) => {
      if (statusFiltro !== "all" && p.status !== statusFiltro) return false;
      if (!termo) return true;
      return p.lead_nome.toLowerCase().includes(termo) || p.assunto.toLowerCase().includes(termo);
    });
  }, [propostas, q, statusFiltro]);

  const totais = useMemo(
    () => ({
      rascunho: propostas.filter((p) => p.status === "rascunho").length,
      enviada: propostas.filter((p) => p.status === "enviada").length,
      respondida: propostas.filter((p) => p.status === "respondida").length,
    }),
    [propostas],
  );

  // ENVIO REAL por e-mail (Resend). Lead sem e-mail → cai no "copiar" (fallback),
  // sem fingir que enviou. Falha do Resend → erro real (não vira sucesso).
  const handleEnviar = async (p: Proposta) => {
    setEnviandoId(p.id);
    try {
      const r = await enviarProposta(p.id);
      if (!r.ok) {
        if (r.reason === "opt_out") {
          toast.warning(`"${p.lead_nome}" pediu descadastro (LGPD) — não é possível enviar.`);
          return;
        }
        const copiou = await copiar(`${p.assunto}\n\n${p.corpo}`);
        toast.warning(
          copiou
            ? `"${p.lead_nome}" não tem e-mail cadastrado — texto copiado, envie manualmente.`
            : `"${p.lead_nome}" não tem e-mail cadastrado. Copie o texto na edição.`,
        );
        return;
      }
      setPropostas((prev) => prev.map((x) => (x.id === r.proposta.id ? r.proposta : x)));
      toast.success(`E-mail enviado para "${p.lead_nome}".`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao enviar");
    } finally {
      setEnviandoId(null);
    }
  };

  // Copiar assunto + mensagem (fallback separado do envio).
  const handleCopiar = async (p: Proposta) => {
    const ok = await copiar(`${p.assunto}\n\n${p.corpo}`);
    if (ok) toast.success(`Texto de "${p.lead_nome}" copiado.`);
    else toast.error("Não foi possível copiar — abra a edição e copie manualmente.");
  };

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Propostas</h1>
          <p className="text-sm text-muted-foreground">
            {propostas.length} propostas · {totais.rascunho} rascunho · {totais.enviada} enviadas ·{" "}
            {totais.respondida} respondidas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={carregar}>
            <RefreshCw className="h-4 w-4" /> Atualizar
          </Button>
          <Button
            size="sm"
            onClick={() => setAbrindoGerar(true)}
            className="bg-primary font-semibold hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Gerar proposta
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-[var(--shadow-card)]">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Filtrar por lead ou assunto..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Select value={statusFiltro} onValueChange={setStatusFiltro}>
          <SelectTrigger className="w-[180px]" aria-label="Filtrar por status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="rascunho">Rascunho</SelectItem>
            <SelectItem value="enviada">Enviada</SelectItem>
            <SelectItem value="respondida">Respondida</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando propostas...
        </div>
      ) : error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : filtradas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-16 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
          <h3 className="mt-4 font-semibold">Nenhuma proposta ainda</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Clique em "Gerar proposta" e escolha um lead com site publicado.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
          <div className="overflow-x-auto">
            <table className="w-full text-[15px]">
              <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  {["Lead", "Assunto", "Valor", "Status", "Criada em", "Ações"].map((h) => (
                    <th key={h} className="px-4 py-3 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtradas.map((p) => (
                  <tr key={p.id} className="border-t border-border hover:bg-secondary/30">
                    <td className="px-4 py-3 font-semibold text-foreground">{p.lead_nome}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.assunto}</td>
                    <td className="px-4 py-3 tabular-nums">{formatBRL(p.valor)}</td>
                    <td className="px-4 py-3">
                      <StatusPill status={p.status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatData(p.criada_em)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Editar"
                          onClick={() => setEditando(p)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Copiar assunto + mensagem"
                          onClick={() => handleCopiar(p)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          title={
                            p.status === "rascunho" ? "Enviar por e-mail (Resend)" : "Já enviada"
                          }
                          onClick={() => handleEnviar(p)}
                          disabled={p.status !== "rascunho" || enviandoId === p.id}
                        >
                          {enviandoId === p.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
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

      {abrindoGerar && (
        <GerarPropostaDialog
          onClose={() => setAbrindoGerar(false)}
          onGerado={(nova) => {
            setPropostas((prev) => [nova, ...prev]);
            setAbrindoGerar(false);
            toast.success(`Rascunho gerado para "${nova.lead_nome}"`);
            setEditando(nova);
          }}
        />
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

function GerarPropostaDialog({
  onClose,
  onGerado,
}: {
  onClose: () => void;
  onGerado: (p: Proposta) => void;
}) {
  const [cands, setCands] = useState<LeadCandidato[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [gerandoId, setGerandoId] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setCands(await listarLeadsParaProposta());
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Falha ao carregar leads");
      }
    })();
  }, []);

  const filtrados = useMemo(() => {
    const termo = q.trim().toLowerCase();
    return (cands ?? []).filter((c) => c.lead_nome.toLowerCase().includes(termo));
  }, [cands, q]);

  const gerar = async (c: LeadCandidato) => {
    setGerandoId(c.lead_id);
    try {
      onGerado(await gerarProposta(c.lead_id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao gerar a proposta");
      setGerandoId(null);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" /> Escolha o lead (com site publicado)
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar lead..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          {erro ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {erro}
            </div>
          ) : cands === null ? (
            <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando leads...
            </div>
          ) : filtrados.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Nenhum lead com site publicado e sem proposta. Publique uma prévia na aba{" "}
              <b>Publicar</b> primeiro.
            </div>
          ) : (
            <div className="max-h-[340px] space-y-1.5 overflow-y-auto pr-1">
              {filtrados.map((c) => (
                <div
                  key={c.lead_id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">{c.lead_nome}</div>
                    <a
                      href={c.site_url}
                      target="_blank"
                      rel="noopener"
                      className="truncate text-xs text-primary hover:underline"
                    >
                      {c.site_url}
                    </a>
                  </div>
                  <Button size="sm" onClick={() => gerar(c)} disabled={gerandoId !== null}>
                    {gerandoId === c.lead_id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Gerando...
                      </>
                    ) : (
                      "Gerar"
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditarPropostaDialog({
  proposta,
  onClose,
  onSalvo,
}: {
  proposta: Proposta;
  onClose: () => void;
  onSalvo: (p: Proposta) => void;
}) {
  const [assunto, setAssunto] = useState(proposta.assunto);
  const [corpo, setCorpo] = useState(proposta.corpo);
  const [valor, setValor] = useState(proposta.valor?.toString() ?? "");
  const [salvando, setSalvando] = useState(false);
  const [melhorando, setMelhorando] = useState(false);

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

  const melhorar = async () => {
    setMelhorando(true);
    try {
      const r = await melhorarPropostaComIA({ ...proposta, assunto, corpo });
      setAssunto(r.assunto);
      setCorpo(r.corpo);
      toast.success("Copy melhorada pela IA — revise e salve.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao melhorar com IA");
    } finally {
      setMelhorando(false);
    }
  };

  const copiar2 = async () => {
    const ok = await copiar(`${assunto}\n\n${corpo}`);
    if (ok) toast.success("Texto copiado.");
    else toast.error("Não foi possível copiar — selecione e copie manualmente.");
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
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="corpo">Mensagem</Label>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={melhorar}
                  disabled={melhorando || salvando}
                >
                  {melhorando ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Melhorando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" /> Melhorar com IA
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={copiar2}
                  title="Copiar assunto + mensagem"
                >
                  <Copy className="h-4 w-4" /> Copiar
                </Button>
              </div>
            </div>
            <Textarea
              id="corpo"
              value={corpo}
              onChange={(e) => setCorpo(e.target.value)}
              rows={12}
              className="font-mono text-sm leading-relaxed"
            />
            <p className="text-xs text-muted-foreground">
              Sem preço na primeira abordagem — o valor entra depois da resposta. O link é a prévia
              já publicada.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="valor">Valor (R$) — opcional</Label>
            <Input
              id="valor"
              inputMode="decimal"
              placeholder="ex.: 1800"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={salvando}>
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={salvando || melhorando}>
            {salvando ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Salvando...
              </>
            ) : (
              "Salvar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
