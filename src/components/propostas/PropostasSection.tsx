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
  CheckCircle2,
  ShieldCheck,
  Lock,
  Unlock,
  AlertTriangle,
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
  aprovarProposta,
  reabrirProposta,
  enviarProposta,
  listarLeadsParaProposta,
  melhorarPropostaComIA,
  statusRampa,
  type LeadCandidato,
  type RampaStatus,
} from "@/services/propostas";

const STATUS_LABEL: Record<PropostaStatus, string> = {
  rascunho: "Rascunho",
  aprovada: "Aprovada",
  enviada: "Enviada",
  respondida: "Respondida",
};

const STATUS_STYLE: Record<PropostaStatus, string> = {
  rascunho: "bg-secondary text-muted-foreground",
  aprovada: "bg-amber-100 text-amber-800",
  enviada: "bg-blue-50 text-blue-700",
  respondida: "bg-green-100 text-green-800",
};

export function StatusPill({ status }: { status: PropostaStatus }) {
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
  const [rampa, setRampa] = useState<RampaStatus | null>(null);

  const carregar = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ps, r] = await Promise.all([listarPropostas(), statusRampa()]);
      setPropostas(ps);
      setRampa(r);
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
      aprovada: propostas.filter((p) => p.status === "aprovada").length,
      enviada: propostas.filter((p) => p.status === "enviada").length,
      respondida: propostas.filter((p) => p.status === "respondida").length,
    }),
    [propostas],
  );

  // ENVIO REAL por e-mail (Resend). Só envia proposta APROVADA (portão de revisão);
  // o servidor recusa rascunho. Lead sem e-mail → cai no "copiar" (fallback), sem
  // fingir que enviou. Falha do Resend → erro real. Devolve true só em sucesso.
  const handleEnviar = async (p: Proposta): Promise<boolean> => {
    setEnviandoId(p.id);
    try {
      const r = await enviarProposta(p.id);
      if (!r.ok) {
        if (r.reason === "nao_aprovada") {
          toast.warning(
            `"${p.lead_nome}" ainda não foi aprovada. Revise e clique em "Aprovar para envio" antes de enviar.`,
          );
          return false;
        }
        if (r.reason === "opt_out") {
          toast.warning(`"${p.lead_nome}" pediu descadastro (LGPD) — não é possível enviar.`);
          return false;
        }
        if (r.reason === "teto_dia") {
          toast.warning("Limite diário do aquecimento atingido — os próximos e-mails saem amanhã.");
          setRampa(await statusRampa());
          return false;
        }
        const copiou = await copiar(`${p.assunto}\n\n${p.corpo}`);
        toast.warning(
          copiou
            ? `"${p.lead_nome}" não tem e-mail cadastrado — texto copiado, envie manualmente.`
            : `"${p.lead_nome}" não tem e-mail cadastrado. Copie o texto na edição.`,
        );
        return false;
      }
      setPropostas((prev) => prev.map((x) => (x.id === r.proposta.id ? r.proposta : x)));
      toast.success(`E-mail enviado para "${p.lead_nome}".`);
      setRampa(await statusRampa());
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao enviar");
      return false;
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
            {propostas.length} propostas · {totais.rascunho} rascunho · {totais.aprovada} aprovadas
            · {totais.enviada} enviadas · {totais.respondida} respondidas
          </p>
          {rampa && (
            <p className="mt-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                Aquecimento{rampa.ativa ? ` · dia ${rampa.dia}` : " (não iniciado)"} · teto{" "}
                {rampa.teto}/dia · {rampa.enviados_hoje} enviados hoje · {rampa.restante} restante
              </span>
            </p>
          )}
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
            <SelectItem value="aprovada">Aprovada</SelectItem>
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
                          title="Revisar / editar"
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
                            p.status === "aprovada"
                              ? "Enviar por e-mail (Resend)"
                              : p.status === "rascunho"
                                ? "Aprove na revisão antes de enviar"
                                : "Já enviada"
                          }
                          onClick={() => handleEnviar(p)}
                          disabled={p.status !== "aprovada" || enviandoId === p.id}
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
        <RevisarPropostaDialog
          proposta={editando}
          onClose={() => setEditando(null)}
          onChange={(atualizada) =>
            setPropostas((prev) => prev.map((p) => (p.id === atualizada.id ? atualizada : p)))
          }
          onEnviar={handleEnviar}
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

/**
 * PORTÃO DE REVISÃO (FIX 1) — como um rascunho no Gmail: mostra PRA QUEM vai
 * (e-mail do lead), o assunto, o corpo final editável à mão e o link da prévia.
 * Só depois de "Aprovar para envio" (rascunho → aprovada) o botão "Enviar" aparece.
 * Enquanto aprovada, o texto fica TRAVADO (é exatamente o que sai); para mexer, o
 * usuário "Reabre para editar". O envio (send-proposal) recusa qualquer não-aprovada.
 */
export function RevisarPropostaDialog({
  proposta,
  onClose,
  onChange,
  onEnviar,
}: {
  proposta: Proposta;
  onClose: () => void;
  onChange: (p: Proposta) => void;
  onEnviar: (p: Proposta) => Promise<boolean>;
}) {
  const [prop, setProp] = useState<Proposta>(proposta);
  const [assunto, setAssunto] = useState(proposta.assunto);
  const [corpo, setCorpo] = useState(proposta.corpo);
  const [valor, setValor] = useState(proposta.valor?.toString() ?? "");
  const [busy, setBusy] = useState<null | "salvar" | "melhorar" | "aprovar" | "reabrir" | "enviar">(
    null,
  );

  const editavel = prop.status === "rascunho";
  const aprovada = prop.status === "aprovada";
  const jaSaiu = prop.status === "enviada" || prop.status === "respondida";
  const semEmail = !prop.lead_email;
  const linkPrevia = corpo.match(/https?:\/\/\S+/)?.[0] ?? "";
  const parseValor = () => (valor.trim() === "" ? null : Number(valor.replace(",", ".")));

  const salvar = async () => {
    setBusy("salvar");
    try {
      const atualizada = await salvarProposta({ ...prop, assunto, corpo, valor: parseValor() });
      setProp(atualizada);
      onChange(atualizada);
      toast.success("Rascunho salvo.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao salvar");
    } finally {
      setBusy(null);
    }
  };

  const melhorar = async () => {
    setBusy("melhorar");
    try {
      const r = await melhorarPropostaComIA({ ...prop, assunto, corpo });
      setAssunto(r.assunto);
      setCorpo(r.corpo);
      toast.success("Copy melhorada pela IA — revise e aprove.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao melhorar com IA");
    } finally {
      setBusy(null);
    }
  };

  // Salva o texto final E aprova numa tacada (o texto aprovado é o que sai).
  const aprovar = async () => {
    setBusy("aprovar");
    try {
      const atualizada = await aprovarProposta({ ...prop, assunto, corpo, valor: parseValor() });
      setProp(atualizada);
      onChange(atualizada);
      toast.success("Proposta aprovada — pronta para enviar.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao aprovar");
    } finally {
      setBusy(null);
    }
  };

  const reabrir = async () => {
    setBusy("reabrir");
    try {
      const atualizada = await reabrirProposta(prop);
      setProp(atualizada);
      onChange(atualizada);
      toast.message("Reaberta para edição — aprove de novo antes de enviar.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao reabrir");
    } finally {
      setBusy(null);
    }
  };

  const enviar = async () => {
    setBusy("enviar");
    const ok = await onEnviar(prop);
    setBusy(null);
    if (ok) onClose();
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
            <Mail className="h-4 w-4 text-primary" /> Revisar proposta — {prop.lead_nome}
            <StatusPill status={prop.status} />
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Destinatário — pra QUEM vai */}
          <div
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
              semEmail
                ? "border-destructive/40 bg-destructive/10 text-destructive"
                : "border-border bg-secondary/40 text-foreground",
            )}
          >
            {semEmail ? <AlertTriangle className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
            <span className="font-medium">Para:</span>
            {semEmail ? (
              <span>sem e-mail cadastrado — não será possível enviar por aqui (use "Copiar").</span>
            ) : (
              <span className="font-mono">{prop.lead_email}</span>
            )}
          </div>

          {/* Aviso de aprovação */}
          {aprovada && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              <Lock className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                <b>Aprovada e travada.</b> O texto abaixo é exatamente o que será enviado. Para
                alterar, clique em <b>Reabrir para editar</b>.
              </span>
            </div>
          )}
          {jaSaiu && (
            <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
              <CheckCircle2 className="h-4 w-4" /> Já enviada
              {prop.enviada_em ? ` em ${formatData(prop.enviada_em)}` : ""}.
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="assunto">Assunto</Label>
            <Input
              id="assunto"
              value={assunto}
              onChange={(e) => setAssunto(e.target.value)}
              disabled={!editavel}
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="corpo">Mensagem</Label>
              <div className="flex items-center gap-1.5">
                {editavel && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={melhorar}
                    disabled={busy !== null}
                  >
                    {busy === "melhorar" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Melhorando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" /> Melhorar com IA
                      </>
                    )}
                  </Button>
                )}
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
              disabled={!editavel}
              className="font-mono text-sm leading-relaxed disabled:opacity-100"
            />
            {linkPrevia && (
              <p className="truncate text-xs text-muted-foreground">
                Prévia no e-mail:{" "}
                <a
                  href={linkPrevia}
                  target="_blank"
                  rel="noopener"
                  className="text-primary hover:underline"
                >
                  {linkPrevia}
                </a>
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Sem preço na primeira abordagem — o valor entra depois da resposta. O texto que você
              aprovar é exatamente o que vai no e-mail.
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
              disabled={!editavel}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onClose} disabled={busy !== null}>
            {jaSaiu ? "Fechar" : "Cancelar"}
          </Button>

          {editavel && (
            <>
              <Button variant="secondary" onClick={salvar} disabled={busy !== null}>
                {busy === "salvar" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Salvando...
                  </>
                ) : (
                  "Salvar rascunho"
                )}
              </Button>
              <Button
                onClick={aprovar}
                disabled={busy !== null}
                className="bg-primary font-semibold hover:bg-primary/90"
              >
                {busy === "aprovar" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Aprovando...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" /> Aprovar para envio
                  </>
                )}
              </Button>
            </>
          )}

          {aprovada && (
            <>
              <Button variant="outline" onClick={reabrir} disabled={busy !== null}>
                {busy === "reabrir" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Reabrindo...
                  </>
                ) : (
                  <>
                    <Unlock className="h-4 w-4" /> Reabrir para editar
                  </>
                )}
              </Button>
              <Button
                onClick={enviar}
                disabled={busy !== null || semEmail}
                className="bg-primary font-semibold hover:bg-primary/90"
              >
                {busy === "enviar" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" /> Enviar agora
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
