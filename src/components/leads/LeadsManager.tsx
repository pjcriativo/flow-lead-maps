// Fase 1 — Gestão de leads: tabela vinda do Supabase (ordenada por score),
// filtros (texto + status), enriquecer, editar (status/notas) e excluir.
import { useEffect, useMemo, useState } from "react";
import {
  Loader2, RefreshCw, Search, Trash2, Pencil, Sparkles, Download, Users,
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
import {
  fetchLeads, updateLead, deleteLead, enrichLead,
  LEAD_STATUSES, STATUS_LABELS, type Lead,
} from "@/lib/leads-api";
import {
  ScoreBadge, ScoreLegend, StatusBadge, RatingCell, SiteCell, EmailCell, WhatsCell, MapsButton,
  Paginacao, paginar, PAGE_SIZE,
} from "./leads-shared";

export function LeadsManager() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [enrichingId, setEnrichingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [pagina, setPagina] = useState(1);

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

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return leads.filter((l) => {
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (!term) return true;
      return (
        l.business_name.toLowerCase().includes(term) ||
        (l.city ?? "").toLowerCase().includes(term) ||
        (l.email ?? "").toLowerCase().includes(term) ||
        (l.category ?? "").toLowerCase().includes(term)
      );
    });
  }, [leads, q, statusFilter]);

  const ordenados = useMemo(() => [...filtered].sort((a, b) => b.score - a.score), [filtered]);
  const totalPaginas = Math.max(1, Math.ceil(ordenados.length / PAGE_SIZE));
  const paginaEfetiva = Math.min(pagina, totalPaginas);
  const paginados = paginar(ordenados, paginaEfetiva);

  const handleEnrich = async (lead: Lead) => {
    setEnrichingId(lead.id);
    try {
      const updated = await enrichLead(lead.id);
      setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      toast.success(updated.email ? `E-mail encontrado: ${updated.email}` : "Site visitado — sem e-mail público.");
    } catch (e: any) {
      toast.error(`Enriquecimento falhou: ${e?.message ?? "erro"}`);
    } finally {
      setEnrichingId(null);
    }
  };

  const handleDelete = async (lead: Lead) => {
    if (!confirm(`Excluir "${lead.business_name}"? Esta ação não pode ser desfeita.`)) return;
    const prev = leads;
    setLeads((p) => p.filter((l) => l.id !== lead.id));
    try {
      await deleteLead(lead.id);
      toast.success("Lead excluído.");
    } catch (e: any) {
      setLeads(prev);
      toast.error(`Falha ao excluir: ${e?.message ?? "erro"}`);
    }
  };

  const exportCsv = () => {
    if (!filtered.length) return;
    const headers = ["Score", "Empresa", "Categoria", "Cidade", "UF", "Telefone", "WhatsApp", "E-mail", "Site", "Nota", "Avaliações", "Status"];
    const rows = filtered.map((l) => [
      l.score, l.business_name, l.category, l.city, l.state, l.phone, l.whatsapp,
      l.email, l.website, l.rating, l.review_count, STATUS_LABELS[l.status] ?? l.status,
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `flow-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Meus Leads</h1>
          <p className="text-sm text-muted-foreground">{leads.length} leads salvos · ordenados por score.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={!filtered.length}><Download className="h-4 w-4" /> Exportar CSV</Button>
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4" /> Atualizar</Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-[var(--shadow-card)]">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Filtrar por nome, cidade, e-mail..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]" aria-label="Filtrar por status"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {LEAD_STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</div>
      ) : error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-16 text-center">
          <Users className="mx-auto h-8 w-8 text-muted-foreground" />
          <h3 className="mt-4 font-semibold">Nenhum lead encontrado</h3>
          <p className="mt-1 text-sm text-muted-foreground">Faça uma busca na aba Buscar ou ajuste os filtros.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
          <div className="overflow-x-auto">
            <table className="w-full text-[15px]">
              <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  {["Score", "Empresa", "Nota", "WhatsApp", "E-mail", "Site", "Status", "Ações"].map((h) => (
                    <th key={h} className="px-4 py-3 font-medium">
                      {h === "Score" ? <span className="inline-flex items-center">Score<ScoreLegend /></span> : h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginados.map((l) => (
                  <tr key={l.id} className="border-t border-border hover:bg-secondary/30">
                    <td className="px-4 py-3"><ScoreBadge lead={l} /></td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">{l.business_name}</div>
                      <div className="text-xs text-muted-foreground">{l.category} · {l.city}{l.state ? `/${l.state}` : ""}</div>
                    </td>
                    <td className="px-4 py-3"><RatingCell lead={l} /></td>
                    <td className="px-4 py-3"><WhatsCell lead={l} /></td>
                    <td className="px-4 py-3"><EmailCell lead={l} /></td>
                    <td className="px-4 py-3"><SiteCell lead={l} /></td>
                    <td className="px-4 py-3"><StatusBadge status={l.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {l.website && (
                          <Button size="sm" variant="ghost" title="Enriquecer (visitar site)"
                            onClick={() => handleEnrich(l)} disabled={enrichingId === l.id}>
                            {enrichingId === l.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" title="Editar" onClick={() => setEditing(l)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" title="Excluir" onClick={() => handleDelete(l)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        <MapsButton lead={l} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {ordenados.length > PAGE_SIZE && (
            <Paginacao total={ordenados.length} page={paginaEfetiva} onPage={setPagina} />
          )}
        </div>
      )}

      {editing && (
        <EditDialog
          lead={editing}
          onClose={() => setEditing(null)}
          onSaved={(u) => {
            setLeads((prev) => prev.map((l) => (l.id === u.id ? u : l)));
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function EditDialog({ lead, onClose, onSaved }: { lead: Lead; onClose: () => void; onSaved: (l: Lead) => void }) {
  const [status, setStatus] = useState(lead.status);
  const [notes, setNotes] = useState(lead.notes ?? "");
  const [email, setEmail] = useState(lead.email ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const updated = await updateLead(lead.id, { status, notes: notes || null, email: email || null });
      toast.success("Lead atualizado.");
      onSaved(updated);
    } catch (e: any) {
      toast.error(`Falha ao salvar: ${e?.message ?? "erro"}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{lead.business_name}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger aria-label="Status"><SelectValue /></SelectTrigger>
              <SelectContent>
                {LEAD_STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contato@empresa.com.br" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notas</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="Observações sobre o lead..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>{saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</> : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
