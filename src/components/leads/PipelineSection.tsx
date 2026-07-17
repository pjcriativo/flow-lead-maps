// Fase 1 — Kanban/Pipeline: colunas por status; arrastar um card SALVA o novo
// status no banco (leads.status) via updateLeadStatus. Board com scroll HORIZONTAL
// (todas as colunas alcançáveis) + scroll VERTICAL por coluna + paginação por coluna
// (não trava com centenas de cards) + auto-scroll ao arrastar perto da borda.
import { useEffect, useRef, useState } from "react";
import { Loader2, RefreshCw, GripVertical, Send, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  fetchLeads,
  updateLeadStatus,
  LEAD_STATUSES,
  STATUS_LABELS,
  type Lead,
  type LeadStatus,
} from "@/lib/leads-api";
import { listarLeadIdsComFollowUp } from "@/services/propostas";
import { ScoreBadge, WhatsCell, EmailCell } from "./leads-shared";
import { LeadDetalhe } from "./LeadDetalhe";
import { RegistrarContatoBotao } from "./ContatoDialog";
import { PerdaDialog } from "./PerdaDialog";

const LIMITE_INICIAL = 25; // cards renderizados por coluna antes do "ver mais"

export function PipelineSection() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);
  const [followupIds, setFollowupIds] = useState<Set<string>>(new Set());
  const [limites, setLimites] = useState<Record<string, number>>({});
  const [detalhe, setDetalhe] = useState<Lead | null>(null);
  const [perdaAlvo, setPerdaAlvo] = useState<{ lead: Lead; status: "lost" | "nurture" } | null>(
    null,
  );
  const boardRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ls, fu] = await Promise.all([fetchLeads(), listarLeadIdsComFollowUp()]);
      setLeads(ls);
      setFollowupIds(fu);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar leads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDrop = async (status: LeadStatus) => {
    const id = dragId;
    setOverCol(null);
    setDragId(null);
    if (!id) return;
    const lead = leads.find((l) => l.id === id);
    if (!lead || lead.status === status) return;

    // Perdido/Nutrição pedem MOTIVO estruturado — não commita o move direto: abre o diálogo,
    // que grava status + motivo juntos e depois move o card.
    if (status === "lost" || status === "nurture") {
      setPerdaAlvo({ lead, status });
      return;
    }

    const prevStatus = lead.status;
    // otimista
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    try {
      await updateLeadStatus(id, status);
      toast.success(`"${lead.business_name}" → ${STATUS_LABELS[status]}`);
    } catch (e) {
      // reverte
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status: prevStatus } : l)));
      toast.error(`Não foi possível mover: ${e instanceof Error ? e.message : "erro"}`);
    }
  };

  // Auto-scroll horizontal quando o card sendo arrastado chega perto da borda do board
  // (o drag nativo HTML5 não faz isso sozinho — sem ele, colunas fora da tela ficam inalcançáveis).
  const onBoardDragOver = (e: React.DragEvent) => {
    const el = boardRef.current;
    if (!el || !dragId) return;
    const r = el.getBoundingClientRect();
    const margem = 90;
    if (e.clientX < r.left + margem) el.scrollLeft -= 22;
    else if (e.clientX > r.right - margem) el.scrollLeft += 22;
  };

  const limiteDe = (status: string) => limites[status] ?? LIMITE_INICIAL;
  const verMais = (status: string, total: number) =>
    setLimites((m) => ({
      ...m,
      [status]: Math.min((m[status] ?? LIMITE_INICIAL) + LIMITE_INICIAL, total),
    }));

  // Clique no card abre o detalhe (ignora cliques em links/botões internos e durante o arraste).
  const abrirDetalhe = (e: React.MouseEvent, lead: Lead) => {
    if (dragId) return;
    if ((e.target as HTMLElement).closest("a,button")) return;
    setDetalhe(lead);
  };

  // Aplica uma mudança de lead na lista (usado por registrar contato / ações do modal).
  const patchLead = (id: string, patch: Partial<Lead>) =>
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando pipeline...
      </div>
    );
  }

  return (
    <div className="flex h-full w-full min-w-0 flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pipeline</h1>
          <p className="text-sm text-muted-foreground">
            Arraste um lead para mudar o status (salva na hora) · clique no card para ver o detalhe.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="h-4 w-4" /> Atualizar
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* min-w-0 nos ancestrais faz o overflow-x-auto funcionar de verdade; altura
          limitada faz cada coluna rolar por dentro (não a página inteira). */}
      <div
        ref={boardRef}
        onDragOver={onBoardDragOver}
        className="flex h-[calc(100dvh-12rem)] min-w-0 gap-3 overflow-x-auto overflow-y-hidden pb-3"
      >
        {LEAD_STATUSES.map((status) => {
          const items = leads.filter((l) => l.status === status);
          const limite = limiteDe(status);
          const visiveis = items.slice(0, limite);
          return (
            <div
              key={status}
              onDragOver={(e) => {
                e.preventDefault();
                setOverCol(status);
              }}
              onDragLeave={() => setOverCol((c) => (c === status ? null : c))}
              onDrop={() => handleDrop(status)}
              className={cn(
                "flex w-72 shrink-0 flex-col rounded-xl border bg-secondary/20 transition-colors",
                overCol === status ? "border-primary bg-primary/5" : "border-border",
              )}
            >
              <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
                <span className="text-sm font-semibold">{STATUS_LABELS[status]}</span>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
                  {items.length}
                </span>
              </div>
              <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2">
                {visiveis.map((l) => (
                  <div
                    key={l.id}
                    draggable
                    onDragStart={() => setDragId(l.id)}
                    onDragEnd={() => {
                      setDragId(null);
                      setOverCol(null);
                    }}
                    onClick={(e) => abrirDetalhe(e, l)}
                    className={cn(
                      "group cursor-pointer rounded-lg border border-border bg-card p-3 shadow-sm",
                      dragId === l.id && "opacity-50",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="line-clamp-2 text-sm font-semibold leading-tight text-foreground">
                        {l.business_name}
                      </span>
                      <ScoreBadge lead={l} />
                    </div>
                    <div className="mt-1 truncate text-xs text-muted-foreground">
                      {l.city}
                      {l.state ? `/${l.state}` : ""}
                    </div>
                    {followupIds.has(l.id) && (
                      <div className="mt-1.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                          <Send className="h-3 w-3" /> Follow-up enviado
                        </span>
                      </div>
                    )}
                    {/* min-w-0 na linha: sem isso o flex não deixa o e-mail encolher e ele
                        escapa do card (a coluna corta o texto no meio). */}
                    <div className="mt-2 flex min-w-0 items-center gap-3 overflow-hidden text-xs">
                      <WhatsCell lead={l} />
                      <EmailCell lead={l} />
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <RegistrarContatoBotao
                        lead={l}
                        variant="ghost"
                        size="sm"
                        onRegistrado={(s, q) =>
                          patchLead(l.id, { status: s, last_contacted_at: q })
                        }
                      />
                      <GripVertical className="h-3.5 w-3.5 cursor-grab text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing" />
                    </div>
                  </div>
                ))}
                {items.length > limite && (
                  <button
                    onClick={() => verMais(status, items.length)}
                    className="flex items-center justify-center gap-1 rounded-lg border border-dashed border-border py-2 text-xs font-medium text-muted-foreground hover:bg-secondary/40"
                  >
                    <ChevronDown className="h-3.5 w-3.5" /> Ver mais {items.length - limite}
                  </button>
                )}
                {items.length === 0 && (
                  <div className="rounded-lg border border-dashed border-border/60 py-6 text-center text-xs text-muted-foreground">
                    vazio
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {detalhe && (
        <LeadDetalhe lead={detalhe} onClose={() => setDetalhe(null)} onLeadChange={patchLead} />
      )}

      {perdaAlvo && (
        <PerdaDialog
          lead={perdaAlvo.lead}
          alvoStatus={perdaAlvo.status}
          open
          onOpenChange={(o) => !o && setPerdaAlvo(null)}
          onConfirmado={(patch) => {
            patchLead(perdaAlvo.lead.id, patch);
            setPerdaAlvo(null);
          }}
          onCancelar={() => setPerdaAlvo(null)}
        />
      )}
    </div>
  );
}
