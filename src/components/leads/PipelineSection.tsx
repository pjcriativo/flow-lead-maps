// Fase 1 — Kanban/Pipeline: colunas por status; arrastar um card SALVA o novo
// status no banco (leads.status) via updateLeadStatus.
import { useEffect, useState } from "react";
import { Loader2, RefreshCw, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  fetchLeads, updateLeadStatus, LEAD_STATUSES, STATUS_LABELS,
  type Lead, type LeadStatus,
} from "@/lib/leads-api";
import { ScoreBadge, WhatsCell, EmailCell } from "./leads-shared";

export function PipelineSection() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setLeads(await fetchLeads());
    } catch (e: any) {
      setError(e?.message ?? "Falha ao carregar leads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDrop = async (status: LeadStatus) => {
    const id = dragId;
    setOverCol(null);
    setDragId(null);
    if (!id) return;
    const lead = leads.find((l) => l.id === id);
    if (!lead || lead.status === status) return;

    const prevStatus = lead.status;
    // otimista
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    try {
      await updateLeadStatus(id, status);
      toast.success(`"${lead.business_name}" → ${STATUS_LABELS[status]}`);
    } catch (e: any) {
      // reverte
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status: prevStatus } : l)));
      toast.error(`Não foi possível mover: ${e?.message ?? "erro"}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando pipeline...
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pipeline</h1>
          <p className="text-sm text-muted-foreground">Arraste um lead para mudar o status — salva no banco na hora.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4" /> Atualizar</Button>
      </div>

      {error && <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <div className="flex gap-3 overflow-x-auto pb-4">
        {LEAD_STATUSES.map((status) => {
          const items = leads.filter((l) => l.status === status);
          return (
            <div
              key={status}
              onDragOver={(e) => { e.preventDefault(); setOverCol(status); }}
              onDragLeave={() => setOverCol((c) => (c === status ? null : c))}
              onDrop={() => handleDrop(status)}
              className={cn(
                "flex w-72 shrink-0 flex-col rounded-xl border bg-secondary/20 transition-colors",
                overCol === status ? "border-primary bg-primary/5" : "border-border",
              )}
            >
              <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
                <span className="text-sm font-semibold">{STATUS_LABELS[status]}</span>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs tabular-nums text-muted-foreground">{items.length}</span>
              </div>
              <div className="flex min-h-[120px] flex-1 flex-col gap-2 p-2">
                {items.map((l) => (
                  <div
                    key={l.id}
                    draggable
                    onDragStart={() => setDragId(l.id)}
                    onDragEnd={() => { setDragId(null); setOverCol(null); }}
                    className={cn(
                      "group cursor-grab rounded-lg border border-border bg-card p-3 shadow-sm active:cursor-grabbing",
                      dragId === l.id && "opacity-50",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-semibold leading-tight text-foreground">{l.business_name}</span>
                      <ScoreBadge lead={l} />
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{l.city}{l.state ? `/${l.state}` : ""}</div>
                    <div className="mt-2 flex items-center gap-3 text-xs">
                      <WhatsCell lead={l} />
                      <EmailCell lead={l} />
                    </div>
                    <GripVertical className="mt-1 h-3.5 w-3.5 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                ))}
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
    </div>
  );
}
