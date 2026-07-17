// Detalhe do lead — clicar num card do Pipeline ou numa linha de Meus Leads abre isto.
// Mostra dados, o PORQUÊ do score (score_breakdown), o redesign (preview sem publicar),
// a PROPOSTA real que saiu (assunto/corpo/estado/destinatário/message_id), o follow-up e
// uma linha do tempo. Reusa as peças de leads-shared e o EditorRedesign (não recria nada).
import { useEffect, useState } from "react";
import {
  Loader2,
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  ExternalLink,
  Pencil,
  FileText,
  FilePlus,
  Wand2,
  Send,
  Clock,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatData, formatDataHora } from "@/lib/format";
import { CANAL_LABEL, STATUS_LABELS, type Lead, type LeadStatus } from "@/lib/leads-api";
import type { Redesign } from "@/types";
import { RegistrarContatoBotao } from "./ContatoDialog";
import {
  StatusBadge,
  ScoreBadge,
  ScoreBreakdownCard,
  RatingCell,
  MapsButton,
  siteHref,
  waLink,
  getBreakdown,
} from "./leads-shared";
import { EditorRedesign } from "@/components/redesign/RedesignSection";
import { toast } from "sonner";
import { gerarRedesign } from "@/services/redesign";
import { gerarProposta, SemMotivoClaroError } from "@/services/propostas";
import {
  carregarDetalheLead,
  type LeadDetalheData,
  type PropostaDetalhe,
} from "@/services/lead-detalhe";

const PROP_STATUS_LABEL: Record<string, string> = {
  rascunho: "Rascunho",
  aprovada: "Aprovada",
  enviada: "Enviada",
  respondida: "Respondida",
};

function Campo({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Mail;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="break-words">
          {children ?? <span className="text-muted-foreground">—</span>}
        </div>
      </div>
    </div>
  );
}

type EventoLT = { quando: string; texto: string; tipo?: "contato" | "perda" };

function montarTimeline(lead: Lead, d: LeadDetalheData): EventoLT[] {
  const ev: EventoLT[] = [];
  const push = (q: string | null | undefined, t: string, tipo?: EventoLT["tipo"]) => {
    if (q) ev.push({ quando: q, texto: t, tipo });
  };
  push(lead.created_at, "Lead capturado na busca");
  push(lead.enriched_at, "Enriquecido (dados de contato)");
  if (d.redesign) push(d.redesign.gerado_em ?? d.redesign.criado_em, "Redesign do site gerado");
  if (d.site) push(d.site.publicado_em, "Site publicado (prévia no ar)");
  for (const p of d.propostas) {
    push(p.criada_em, `Proposta criada — "${p.assunto}"`);
    push(p.aprovada_em, "Proposta aprovada");
    push(p.enviada_em, "Proposta enviada por e-mail");
    push(p.follow_up_enviado_em, "Follow-up enviado");
  }
  // Histórico de contatos MANUAIS (vários ao longo do tempo), não só o último.
  for (const c of d.contatos) {
    const canal = CANAL_LABEL[c.canal] ?? c.canal;
    push(c.contatado_em, `Contato por ${canal}${c.anotacao ? " — " + c.anotacao : ""}`, "contato");
  }
  // Marcação de perda/nutrição com o motivo estruturado.
  if (lead.perda_em && lead.motivo_perda) {
    const rot = STATUS_LABELS[lead.status] ?? "Perdido";
    push(
      lead.perda_em,
      `${rot}: ${lead.motivo_perda}${lead.motivo_perda_nota ? " — " + lead.motivo_perda_nota : ""}`,
      "perda",
    );
  }
  return ev.sort((a, b) => new Date(a.quando).getTime() - new Date(b.quando).getTime());
}

export function LeadDetalhe({
  lead,
  onClose,
  onLeadChange,
}: {
  lead: Lead;
  onClose: () => void;
  onLeadChange?: (leadId: string, patch: Partial<Lead>) => void;
}) {
  const [data, setData] = useState<LeadDetalheData | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [editorAberto, setEditorAberto] = useState<Redesign | null>(null);
  const [gerando, setGerando] = useState<null | "site" | "proposta">(null);
  // Reflete mudanças feitas no próprio modal (status/perda) sem refetch do lead prop.
  const [patchLocal, setPatchLocal] = useState<Partial<Lead>>({});
  const leadView = { ...lead, ...patchLocal };

  useEffect(() => {
    let vivo = true;
    setLoading(true);
    setPatchLocal({});
    carregarDetalheLead(lead.id)
      .then((d) => vivo && setData(d))
      .catch((e) => vivo && setErro(e instanceof Error ? e.message : "Falha ao carregar o detalhe"))
      .finally(() => vivo && setLoading(false));
    return () => {
      vivo = false;
    };
  }, [lead.id]);

  // Aplica uma mudança do lead vinda de uma ação do modal: reflete no modal e avisa o pai.
  const aplicarPatch = (patch: Partial<Lead>) => {
    setPatchLocal((p) => ({ ...p, ...patch }));
    onLeadChange?.(lead.id, patch);
  };

  const recarregar = async () => {
    setData(await carregarDetalheLead(lead.id));
  };

  // Gera o site do lead. Nasce RASCUNHO e NÃO publica (o portão segue na aprovação).
  // DOIS modos, escolhidos pelo dono quando o lead JÁ TEM site:
  //   redesign  → raspa o site atual e o refaz melhor (a edge lê o site — 10-40s).
  //   novoDoZero → ignora o site atual, cria um site novo só com os dados do Google.
  // Sem feedback persistente (toast.loading) o dono acha que travou; e se o site for
  // ilegível no modo redesign, AVISA que caiu no fallback em vez de fingir sucesso.
  const gerar = async (novoDoZero: boolean) => {
    setGerando("site");
    const tid = toast.loading(
      novoDoZero
        ? "Criando um site NOVO do zero... (pode levar até ~40s)."
        : "Refazendo a partir do site atual de vocês... leio o site antes (pode levar até ~40s).",
    );
    try {
      const { usage } = await gerarRedesign(lead.id, { novoDoZero });
      await recarregar();
      // No modo redesign, avisa se não conseguiu ler o site (caiu no fallback). No modo "novo"
      // o fallback pra dados do Google é o esperado — não é um aviso, é o próprio modo.
      const avisarFallback =
        !novoDoZero && (usage.conteudoLegivel === false || !usage.servicosReais || usage.fallback);
      if (avisarFallback) {
        toast.warning(
          usage.conteudoLegivel === false
            ? "Feito com os dados do Google — não consegui ler o site atual (ilegível/legado). Revise os serviços na prévia."
            : "Feito com serviços genéricos do nicho — não deu pra extrair as áreas reais do site. Revise a prévia.",
          { id: tid, duration: 8000 },
        );
      } else {
        toast.success(
          novoDoZero
            ? "Site novo gerado — revise a prévia abaixo."
            : "Redesign gerado — revise a prévia abaixo.",
          { id: tid },
        );
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao gerar o site", { id: tid });
    } finally {
      setGerando(null);
    }
  };

  // "Gerar proposta" só aparece quando há site PUBLICADO (gerarProposta usa a URL pública como
  // link). Nasce rascunho. Erros dos portões (sem motivo claro / sem nome do remetente) viram
  // mensagem clara, não genérica.
  const gerarPropostaLead = async () => {
    setGerando("proposta");
    try {
      await gerarProposta(lead.id);
      await recarregar();
      toast.success("Proposta gerada (rascunho) — revise antes de enviar.");
    } catch (e) {
      const msg =
        e instanceof SemMotivoClaroError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Falha ao gerar a proposta";
      toast.error(msg);
    } finally {
      setGerando(null);
    }
  };

  const bd = getBreakdown(lead);
  const previewHtml = data?.redesign?.html_editado ?? data?.redesign?.html_gerado ?? null;
  const timeline = data ? montarTimeline(leadView, data) : [];

  return (
    <>
      <Dialog open onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-h-[92vh] gap-0 overflow-hidden p-0 sm:max-w-3xl">
          <DialogHeader className="border-b border-border px-5 py-4">
            <DialogTitle className="flex flex-wrap items-center gap-2 pr-6">
              <Building2 className="h-4 w-4 text-primary" />
              <span className="mr-1">{lead.business_name}</span>
              <StatusBadge status={leadView.status} />
              <ScoreBadge lead={lead} />
            </DialogTitle>
          </DialogHeader>

          <div className="max-h-[calc(92vh-4.5rem)] space-y-5 overflow-y-auto px-5 py-4">
            {/* Ações do lead */}
            <div className="flex flex-wrap items-center gap-2">
              <RegistrarContatoBotao
                lead={leadView}
                onRegistrado={(novoStatus, quando) => {
                  aplicarPatch({ status: novoStatus, last_contacted_at: quando });
                  recarregar();
                }}
              />
            </div>
            {/* Dados de contato */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Campo icon={Building2} label="Categoria">
                {lead.category || <span className="text-muted-foreground">—</span>}
              </Campo>
              <Campo icon={MapPin} label="Endereço">
                {lead.address ? (
                  <>
                    {lead.address}
                    {lead.city ? `, ${lead.city}` : ""}
                    {lead.state ? `/${lead.state}` : ""} <MapsButton lead={lead} />
                  </>
                ) : (
                  <MapsButton lead={lead} />
                )}
              </Campo>
              <Campo icon={Phone} label="Telefone">
                {lead.phone || <span className="text-muted-foreground">—</span>}
              </Campo>
              <Campo icon={Phone} label="WhatsApp">
                {lead.whatsapp ? (
                  <a
                    className="text-[#16A34A] hover:underline"
                    href={waLink(lead.whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {lead.whatsapp}
                  </a>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </Campo>
              <Campo icon={Mail} label="E-mail">
                {lead.email ? (
                  <a className="text-[#16A34A] hover:underline" href={`mailto:${lead.email}`}>
                    {lead.email}
                  </a>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </Campo>
              <Campo icon={Globe} label="Site atual">
                {lead.website ? (
                  <a
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                    href={siteHref(lead.website)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {lead.website} <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-muted-foreground">sem site</span>
                )}
              </Campo>
              <Campo icon={Building2} label="Avaliação Google">
                <RatingCell lead={lead} />
              </Campo>
              {lead.instagram_url && (
                <Campo icon={ExternalLink} label="Instagram">
                  <a
                    className="text-primary hover:underline"
                    href={lead.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    abrir
                  </a>
                </Campo>
              )}
            </div>

            {/* Por que este score */}
            <section>
              <h3 className="mb-2 text-sm font-semibold">Por que este score</h3>
              <div className="rounded-lg border border-border bg-secondary/20 p-3">
                <ScoreBreakdownCard lead={lead} bd={bd} />
              </div>
            </section>

            {loading ? (
              <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando histórico do lead...
              </div>
            ) : erro ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                {erro}
              </div>
            ) : (
              <>
                {/* Redesign */}
                <section>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-sm font-semibold">
                      <Wand2 className="h-4 w-4 text-primary" /> Redesign do site
                    </h3>
                    {data?.redesign && previewHtml && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditorAberto(data.redesign)}
                      >
                        <Pencil className="h-3.5 w-3.5" /> Abrir editor
                      </Button>
                    )}
                  </div>
                  {data?.redesign && previewHtml ? (
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-full bg-secondary px-2 py-0.5 font-medium text-muted-foreground">
                          {data.redesign.status}
                        </span>
                        {data.site ? (
                          <a
                            href={data.site.url_publica}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 font-medium text-green-800 hover:underline"
                          >
                            <Globe className="h-3 w-3" /> Publicado — abrir site
                          </a>
                        ) : (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800">
                            rascunho (não publicado)
                          </span>
                        )}
                      </div>
                      <div className="h-56 overflow-hidden rounded-lg border border-border bg-white">
                        <iframe
                          title={`preview-${lead.id}`}
                          srcDoc={previewHtml}
                          className="pointer-events-none h-[700px] w-[1250px] origin-top-left scale-[0.38] border-0"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed border-border px-3 py-4">
                      <p className="text-sm text-muted-foreground">
                        Nenhum redesign ainda para este lead.
                      </p>
                      {lead.website ? (
                        // Lead JÁ TEM site → o dono escolhe: refazer a partir do atual (redesign)
                        // ou criar um site novo do zero (dados do Google).
                        <div className="flex flex-col gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => gerar(false)}
                              disabled={gerando !== null}
                            >
                              {gerando === "site" ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Wand2 className="h-4 w-4" />
                              )}
                              Redesign do site atual
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => gerar(true)}
                              disabled={gerando !== null}
                            >
                              <FilePlus className="h-4 w-4" /> Gerar site novo
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            <b className="text-foreground">Redesign</b>: parte do site atual e o
                            refaz melhor. <b className="text-foreground">Novo</b>: cria do zero com
                            os dados do Google, sem olhar o site atual.
                          </p>
                        </div>
                      ) : (
                        // Sem site → não há o que "refazer"; só criar do zero.
                        <Button size="sm" onClick={() => gerar(true)} disabled={gerando !== null}>
                          {gerando === "site" ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" /> Gerando site...
                            </>
                          ) : (
                            <>
                              <Wand2 className="h-4 w-4" /> Gerar site
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  )}
                </section>

                {/* Proposta */}
                <section>
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <FileText className="h-4 w-4 text-primary" /> Proposta
                  </h3>
                  {data && data.propostas.length > 0 ? (
                    <div className="space-y-3">
                      {data.propostas.map((p) => (
                        <PropostaBloco key={p.id} p={p} />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-start gap-2 rounded-lg border border-dashed border-border px-3 py-4">
                      <p className="text-sm text-muted-foreground">
                        Nenhuma proposta gerada para este lead ainda.
                      </p>
                      {data?.site ? (
                        <>
                          <Button size="sm" onClick={gerarPropostaLead} disabled={gerando !== null}>
                            {gerando === "proposta" ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" /> Gerando proposta...
                              </>
                            ) : (
                              <>
                                <FileText className="h-4 w-4" /> Gerar proposta
                              </>
                            )}
                          </Button>
                          {!lead.email && (
                            <p className="text-xs text-amber-700">
                              Este lead não tem e-mail — a proposta nasce como rascunho, mas o envio
                              por e-mail fica bloqueado até haver um endereço.
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Publique a prévia do site primeiro (aba Publicar) — a proposta usa o link
                          público.
                        </p>
                      )}
                    </div>
                  )}
                </section>

                {/* Linha do tempo */}
                <section>
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <Clock className="h-4 w-4 text-primary" /> Linha do tempo
                  </h3>
                  {timeline.length > 0 ? (
                    <ol className="space-y-2 border-l border-border pl-4">
                      {timeline.map((e, i) => (
                        <li key={i} className="relative text-sm">
                          <span
                            className={cn(
                              "absolute -left-[1.32rem] top-1 h-2 w-2 rounded-full",
                              e.tipo === "contato"
                                ? "bg-emerald-500"
                                : e.tipo === "perda"
                                  ? "bg-rose-500"
                                  : "bg-primary",
                            )}
                          />
                          <span className="text-foreground">{e.texto}</span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            {formatDataHora(e.quando)}
                          </span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-sm text-muted-foreground">Sem eventos registrados.</p>
                  )}
                </section>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {editorAberto && (
        <EditorRedesign
          redesign={editorAberto}
          onClose={() => setEditorAberto(null)}
          onSaved={() => {}}
        />
      )}
    </>
  );
}

function PropostaBloco({ p }: { p: PropostaDetalhe }) {
  const enviada = p.status === "enviada" || p.status === "respondida";
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium">{p.assunto}</span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-medium",
            enviada
              ? "bg-blue-50 text-blue-700"
              : p.status === "aprovada"
                ? "bg-amber-100 text-amber-800"
                : "bg-secondary text-muted-foreground",
          )}
        >
          {PROP_STATUS_LABEL[p.status] ?? p.status}
        </span>
      </div>
      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>Criada {formatData(p.criada_em)}</span>
        {p.enviada_em && (
          <span className="inline-flex items-center gap-1 text-blue-700">
            <Send className="h-3 w-3" /> Enviada {formatData(p.enviada_em)}
          </span>
        )}
        {enviada && p.email_para && <span>para {p.email_para}</span>}
        {p.email_message_id && (
          <span className="font-mono">id: {p.email_message_id.slice(0, 12)}…</span>
        )}
      </div>
      {p.follow_up_enviado_em && (
        <div className="mt-1 text-xs text-amber-800">
          Follow-up enviado {formatData(p.follow_up_enviado_em)}
          {p.follow_up_count > 1 ? ` (${p.follow_up_count}×)` : ""}
        </div>
      )}
      <pre className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-md bg-secondary/40 p-2 font-sans text-xs leading-relaxed text-foreground">
        {p.corpo}
      </pre>
    </div>
  );
}
