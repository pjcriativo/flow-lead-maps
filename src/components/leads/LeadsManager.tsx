// Fase 1 — Gestão de leads: tabela vinda do Supabase (ordenada por score),
// filtros (texto + status), enriquecer, editar (status/notas) e excluir.
import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  RefreshCw,
  Search,
  Trash2,
  Pencil,
  Sparkles,
  Download,
  Users,
  Wand2,
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
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  fetchLeads,
  updateLead,
  deleteLead,
  deleteLeads,
  updateLeadsStatus,
  enrichLead,
  LEAD_STATUSES,
  STATUS_LABELS,
  type Lead,
} from "@/lib/leads-api";
import { gerarRedesign } from "@/services/redesign";
import { listarLeadIdsComRedesign } from "@/services/redesign";
import {
  listarListas,
  adicionarLeadsALista,
  criarListaDeLeads,
  type LeadListComStats,
} from "@/lib/lists-api";
import {
  ScoreBadge,
  ScoreLegend,
  StatusBadge,
  RatingCell,
  SiteCell,
  EmailCell,
  WhatsCell,
  MapsButton,
  Paginacao,
  paginar,
  PAGE_SIZE,
} from "./leads-shared";
import { LeadDetalhe } from "./LeadDetalhe";

export function LeadsManager({
  onOpenRedesign,
}: { onOpenRedesign?: (leadId: string) => void } = {}) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [redesignLeadIds, setRedesignLeadIds] = useState<Set<string>>(new Set());
  const [listas, setListas] = useState<LeadListComStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [listFilter, setListFilter] = useState<string>("all");
  const [mostrarSemContato, setMostrarSemContato] = useState(false);
  const [enrichingId, setEnrichingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [detalhe, setDetalhe] = useState<Lead | null>(null);
  const [pagina, setPagina] = useState(1);
  // Seleção em massa: ids marcados + a ação em andamento (trava a barra e mostra spinner).
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [acaoMassa, setAcaoMassa] = useState<null | "lista" | "status" | "excluir" | "site">(null);

  // Clique na linha abre o detalhe (ignora cliques nos botões/links de ação da linha).
  const abrirDetalhe = (e: React.MouseEvent, lead: Lead) => {
    if ((e.target as HTMLElement).closest("a,button")) return;
    setDetalhe(lead);
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ls, rs, lists] = await Promise.all([
        fetchLeads(),
        listarLeadIdsComRedesign(),
        listarListas(),
      ]);
      setLeads(ls);
      setRedesignLeadIds(rs);
      setListas(lists);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar leads");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return leads.filter((l) => {
      // Higiene: esconde "sem contato" (nem e-mail, nem WhatsApp, nem telefone) por padrão.
      if (!mostrarSemContato && l.sem_contato) return false;
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (listFilter === "none" && l.list_id) return false;
      if (listFilter !== "all" && listFilter !== "none" && l.list_id !== listFilter) return false;
      if (!term) return true;
      return (
        l.business_name.toLowerCase().includes(term) ||
        (l.city ?? "").toLowerCase().includes(term) ||
        (l.email ?? "").toLowerCase().includes(term) ||
        (l.category ?? "").toLowerCase().includes(term)
      );
    });
    // listFilter estava fora das deps — o filtro de lista não recalculava. Corrigido.
  }, [leads, q, statusFilter, listFilter, mostrarSemContato]);

  const semContatoCount = useMemo(() => leads.filter((l) => l.sem_contato).length, [leads]);

  const ordenados = useMemo(() => [...filtered].sort((a, b) => b.score - a.score), [filtered]);
  useEffect(() => {
    setPagina(1);
  }, [q, statusFilter, listFilter, mostrarSemContato]);
  const totalPaginas = Math.max(1, Math.ceil(ordenados.length / PAGE_SIZE));
  const paginaEfetiva = Math.min(pagina, totalPaginas);
  const paginados = paginar(ordenados, paginaEfetiva);

  // Seleção opera sobre o conjunto FILTRADO (o que o dono vê), não só a página atual —
  // "selecionar todos" com um filtro de lista aplicado seleciona a lista inteira.
  const idsFiltrados = useMemo(() => ordenados.map((l) => l.id), [ordenados]);
  const selNaVista = idsFiltrados.filter((id) => sel.has(id)).length;
  const todosSelecionados = idsFiltrados.length > 0 && selNaVista === idsFiltrados.length;
  const algunsSelecionados = selNaVista > 0 && !todosSelecionados;

  const toggleUm = (id: string) =>
    setSel((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const toggleTodos = () =>
    setSel((prev) => {
      const n = new Set(prev);
      if (todosSelecionados) idsFiltrados.forEach((id) => n.delete(id));
      else idsFiltrados.forEach((id) => n.add(id));
      return n;
    });
  const limparSel = () => setSel(new Set());
  // Filtro mudou → limpa a seleção (evita agir sobre leads que saíram da vista).
  useEffect(() => {
    setSel(new Set());
  }, [q, statusFilter, listFilter]);

  const leadsSelecionados = () => leads.filter((l) => sel.has(l.id));

  const handleEnrich = async (lead: Lead) => {
    setEnrichingId(lead.id);
    try {
      const updated = await enrichLead(lead.id);
      setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      toast.success(
        updated.email
          ? `E-mail encontrado: ${updated.email}`
          : "Site visitado — sem e-mail público.",
      );
    } catch (e) {
      toast.error(`Enriquecimento falhou: ${e instanceof Error ? e.message : "erro"}`);
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
    } catch (e) {
      setLeads(prev);
      toast.error(`Falha ao excluir: ${e instanceof Error ? e.message : "erro"}`);
    }
  };

  // ---- Ações em MASSA ----
  const excluirEmMassa = async () => {
    const ids = [...sel];
    if (!ids.length) return;
    if (!confirm(`Excluir ${ids.length} lead(s)? Esta ação não pode ser desfeita.`)) return;
    setAcaoMassa("excluir");
    const prev = leads;
    setLeads((p) => p.filter((l) => !sel.has(l.id)));
    limparSel();
    try {
      await deleteLeads(ids);
      toast.success(`${ids.length} lead(s) excluído(s).`);
    } catch (e) {
      setLeads(prev);
      toast.error(`Falha ao excluir: ${e instanceof Error ? e.message : "erro"}`);
    } finally {
      setAcaoMassa(null);
    }
  };

  const mudarStatusEmMassa = async (status: string) => {
    const ids = [...sel];
    if (!ids.length) return;
    setAcaoMassa("status");
    try {
      await updateLeadsStatus(ids, status);
      setLeads((prev) => prev.map((l) => (sel.has(l.id) ? { ...l, status } : l)));
      toast.success(`${ids.length} lead(s) → "${STATUS_LABELS[status] ?? status}".`);
      limparSel();
    } catch (e) {
      toast.error(`Falha ao mudar status: ${e instanceof Error ? e.message : "erro"}`);
    } finally {
      setAcaoMassa(null);
    }
  };

  const adicionarAListaEmMassa = async (listId: string) => {
    const ids = [...sel];
    if (!ids.length) return;
    setAcaoMassa("lista");
    try {
      await adicionarLeadsALista(listId, ids);
      setLeads((prev) => prev.map((l) => (sel.has(l.id) ? { ...l, list_id: listId } : l)));
      const nome = listas.find((x) => x.id === listId)?.name ?? "a lista";
      toast.success(`${ids.length} lead(s) adicionado(s) a "${nome}".`);
      limparSel();
      listarListas()
        .then(setListas)
        .catch(() => {});
    } catch (e) {
      toast.error(`Falha ao adicionar à lista: ${e instanceof Error ? e.message : "erro"}`);
    } finally {
      setAcaoMassa(null);
    }
  };

  const criarListaEmMassa = async () => {
    const selecionados = leadsSelecionados();
    if (!selecionados.length) return;
    const nome = prompt(`Nome da nova lista (${selecionados.length} leads):`, "");
    if (nome == null) return; // cancelou
    setAcaoMassa("lista");
    try {
      const lista = await criarListaDeLeads(nome, selecionados);
      setLeads((prev) => prev.map((l) => (sel.has(l.id) ? { ...l, list_id: lista.id } : l)));
      toast.success(`Lista "${lista.name}" criada com ${selecionados.length} lead(s).`);
      limparSel();
      listarListas()
        .then(setListas)
        .catch(() => {});
    } catch (e) {
      toast.error(`Falha ao criar a lista: ${e instanceof Error ? e.message : "erro"}`);
    } finally {
      setAcaoMassa(null);
    }
  };

  // Gerar site em massa: cada geração é uma chamada de IA BLOQUEANTE (10–40s). Roda em série,
  // com progresso, e não deixa a UI achar que travou. Custa IA — confirma antes.
  const gerarSiteEmMassa = async () => {
    const ids = [...sel];
    if (!ids.length) return;
    if (
      !confirm(
        `Gerar site para ${ids.length} lead(s)? Cada geração usa IA (custo real) e leva alguns segundos. Os sites nascem como rascunho, sem publicar.`,
      )
    )
      return;
    setAcaoMassa("site");
    let ok = 0;
    let falhou = 0;
    let fallback = 0; // gerados, mas com dados do Google (site ilegível/genérico)
    try {
      for (const id of ids) {
        try {
          const { usage } = await gerarRedesign(id);
          ok += 1;
          if (!usage.servicosReais || usage.conteudoLegivel === false || usage.fallback)
            fallback += 1;
        } catch {
          falhou += 1;
        }
        toast.message(`Gerando sites... ${ok + falhou}/${ids.length}`, { id: "gerar-massa" });
      }
      setRedesignLeadIds(await listarLeadIdsComRedesign().catch(() => redesignLeadIds));
      // Avisa quando algum caiu no fallback — não finge que todos saíram do site real.
      const detalhe =
        (falhou ? ` (${falhou} falharam)` : "") +
        (fallback ? ` · ${fallback} com dados do Google (site ilegível)` : "");
      const msg = `Sites gerados: ${ok}/${ids.length}${detalhe}.`;
      if (falhou || fallback) toast.warning(msg, { id: "gerar-massa", duration: 8000 });
      else toast.success(msg, { id: "gerar-massa" });
      limparSel();
    } finally {
      // finally: sem isto, uma exceção inesperada deixaria a barra travada (acaoMassa preso).
      setAcaoMassa(null);
    }
  };

  const exportCsv = () => {
    if (!filtered.length) return;
    const headers = [
      "Score",
      "Empresa",
      "Categoria",
      "Cidade",
      "UF",
      "Telefone",
      "WhatsApp",
      "E-mail",
      "Site",
      "Nota",
      "Avaliações",
      "Status",
    ];
    const rows = filtered.map((l) => [
      l.score,
      l.business_name,
      l.category,
      l.city,
      l.state,
      l.phone,
      l.whatsapp,
      l.email,
      l.website,
      l.rating,
      l.review_count,
      STATUS_LABELS[l.status] ?? l.status,
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
          <p className="text-sm text-muted-foreground">
            {leads.length} leads salvos · ordenados por score.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={!filtered.length}>
            <Download className="h-4 w-4" /> Exportar CSV
          </Button>
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="h-4 w-4" /> Atualizar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-[var(--shadow-card)]">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Filtrar por nome, cidade, e-mail..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]" aria-label="Filtrar por status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {LEAD_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={listFilter} onValueChange={setListFilter}>
          <SelectTrigger className="w-[220px]" aria-label="Filtrar por lista">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-80">
            <SelectItem value="all">Todas as listas</SelectItem>
            <SelectItem value="none">Sem lista</SelectItem>
            {listas.map((l) => (
              <SelectItem key={l.id} value={l.id}>
                {l.name} ({l.leads_atuais})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {semContatoCount > 0 && (
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={mostrarSemContato}
              onChange={(e) => setMostrarSemContato(e.target.checked)}
            />
            Mostrar sem contato ({semContatoCount})
          </label>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
        </div>
      ) : error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-16 text-center">
          <Users className="mx-auto h-8 w-8 text-muted-foreground" />
          <h3 className="mt-4 font-semibold">Nenhum lead encontrado</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Faça uma busca na aba Buscar ou ajuste os filtros.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
          {/* Barra de AÇÕES EM MASSA — aparece quando há seleção. */}
          {sel.size > 0 && (
            <div className="flex flex-wrap items-center gap-2 border-b border-border bg-primary/5 px-4 py-2.5">
              <span className="text-sm font-medium">{sel.size} selecionado(s)</span>
              <div className="mx-1 h-4 w-px bg-border" />

              {/* Adicionar à lista (existentes + nova) */}
              <Select
                value=""
                onValueChange={(v) =>
                  v === "__nova__" ? criarListaEmMassa() : adicionarAListaEmMassa(v)
                }
                disabled={acaoMassa !== null}
              >
                <SelectTrigger className="h-8 w-[190px]" aria-label="Adicionar à lista">
                  <SelectValue
                    placeholder={acaoMassa === "lista" ? "Adicionando..." : "Adicionar à lista"}
                  />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="__nova__">+ Nova lista...</SelectItem>
                  {listas.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name} ({l.leads_atuais})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Mudar status */}
              <Select value="" onValueChange={mudarStatusEmMassa} disabled={acaoMassa !== null}>
                <SelectTrigger className="h-8 w-[160px]" aria-label="Mudar status">
                  <SelectValue
                    placeholder={acaoMassa === "status" ? "Alterando..." : "Mudar status"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Gerar site (custa IA) */}
              <Button
                size="sm"
                variant="outline"
                onClick={gerarSiteEmMassa}
                disabled={acaoMassa !== null}
                title="Gerar redesign para os selecionados (cada um custa IA; nasce rascunho)"
              >
                {acaoMassa === "site" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4" />
                )}
                Gerar site ({sel.size})
              </Button>

              {/* Excluir */}
              <Button
                size="sm"
                variant="outline"
                onClick={excluirEmMassa}
                disabled={acaoMassa !== null}
                className="text-destructive hover:text-destructive"
              >
                {acaoMassa === "excluir" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Excluir ({sel.size})
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={limparSel}
                disabled={acaoMassa !== null}
                className="ml-auto"
              >
                Limpar seleção
              </Button>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-[15px]">
              <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">
                    <Checkbox
                      checked={todosSelecionados || (algunsSelecionados && "indeterminate")}
                      onCheckedChange={toggleTodos}
                      aria-label="Selecionar todos os leads filtrados"
                    />
                  </th>
                  {[
                    "Score",
                    "Empresa",
                    "Nota",
                    "WhatsApp",
                    "E-mail",
                    "Site",
                    "Status",
                    "Ações",
                  ].map((h) => (
                    <th key={h} className="px-4 py-3 font-medium">
                      {h === "Score" ? (
                        <span className="inline-flex items-center">
                          Score
                          <ScoreLegend />
                        </span>
                      ) : (
                        h
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginados.map((l) => (
                  <tr
                    key={l.id}
                    onClick={(e) => abrirDetalhe(e, l)}
                    className={cn(
                      "cursor-pointer border-t border-border hover:bg-secondary/30",
                      sel.has(l.id) && "bg-primary/5",
                    )}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={sel.has(l.id)}
                        onCheckedChange={() => toggleUm(l.id)}
                        aria-label={`Selecionar ${l.business_name}`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <ScoreBadge lead={l} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">{l.business_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {l.category} · {l.city}
                        {l.state ? `/${l.state}` : ""}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <RatingCell lead={l} />
                    </td>
                    <td className="px-4 py-3">
                      <WhatsCell lead={l} />
                    </td>
                    <td className="px-4 py-3">
                      <EmailCell lead={l} />
                    </td>
                    <td className="px-4 py-3">
                      <SiteCell lead={l} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={l.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {redesignLeadIds.has(l.id) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            title="Ver redesign deste lead"
                            className="text-primary"
                            onClick={() => onOpenRedesign?.(l.id)}
                          >
                            <Wand2 className="h-4 w-4" />
                          </Button>
                        )}
                        {l.website && (
                          <Button
                            size="sm"
                            variant="ghost"
                            title="Enriquecer (visitar site)"
                            onClick={() => handleEnrich(l)}
                            disabled={enrichingId === l.id}
                          >
                            {enrichingId === l.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Sparkles className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Editar"
                          onClick={() => setEditing(l)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Excluir"
                          onClick={() => handleDelete(l)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
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

      {detalhe && (
        <LeadDetalhe
          lead={detalhe}
          onClose={() => setDetalhe(null)}
          onLeadChange={(id, patch) =>
            setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)))
          }
        />
      )}
    </div>
  );
}

function EditDialog({
  lead,
  onClose,
  onSaved,
}: {
  lead: Lead;
  onClose: () => void;
  onSaved: (l: Lead) => void;
}) {
  const [status, setStatus] = useState(lead.status);
  const [notes, setNotes] = useState(lead.notes ?? "");
  const [email, setEmail] = useState(lead.email ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const updated = await updateLead(lead.id, {
        status,
        notes: notes || null,
        email: email || null,
      });
      toast.success("Lead atualizado.");
      onSaved(updated);
    } catch (e) {
      toast.error(`Falha ao salvar: ${e instanceof Error ? e.message : "erro"}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{lead.business_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger aria-label="Status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEAD_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contato@empresa.com.br"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Observações sobre o lead..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? (
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
