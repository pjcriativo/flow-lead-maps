// PARTE 3 — "Minhas Listas": cada busca salva vira uma lista. Grid de cards; clicar
// abre os leads daquela lista (paginação + score). Ações: renomear, excluir, CSV.
import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  RefreshCw,
  FolderOpen,
  ArrowLeft,
  Pencil,
  Trash2,
  Download,
  Wand2,
  MailCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { formatData } from "@/lib/format";
import type { Lead } from "@/lib/leads-api";
import {
  listarListas,
  fetchLeadsDaLista,
  renomearLista,
  excluirLista,
  setFollowUpAtivo,
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

export function MinhasListasSection({
  onOpenRedesign,
}: { onOpenRedesign?: (leadId: string) => void } = {}) {
  const [listas, setListas] = useState<LeadListComStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aberta, setAberta] = useState<LeadListComStats | null>(null);

  const carregar = async () => {
    setLoading(true);
    setError(null);
    try {
      setListas(await listarListas());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar listas");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    carregar();
  }, []);

  const handleRenomear = async (l: LeadListComStats) => {
    const novo = prompt("Novo nome da lista:", l.name);
    if (novo == null || !novo.trim() || novo.trim() === l.name) return;
    const prev = listas;
    setListas((p) => p.map((x) => (x.id === l.id ? { ...x, name: novo.trim() } : x)));
    try {
      await renomearLista(l.id, novo.trim());
      toast.success("Lista renomeada.");
    } catch (e) {
      setListas(prev);
      toast.error(e instanceof Error ? e.message : "Falha ao renomear");
    }
  };

  // FIX 2 — liga/desliga o follow-up automático da lista (opt-in). Otimista.
  const handleToggleFollowUp = async (l: LeadListComStats, ativo: boolean) => {
    const prev = listas;
    setListas((p) => p.map((x) => (x.id === l.id ? { ...x, follow_up_ativo: ativo } : x)));
    try {
      await setFollowUpAtivo(l.id, ativo);
      toast.success(
        ativo
          ? `Follow-up automático LIGADO em "${l.name}".`
          : `Follow-up automático desligado em "${l.name}".`,
      );
    } catch (e) {
      setListas(prev);
      toast.error(e instanceof Error ? e.message : "Falha ao alterar o follow-up");
    }
  };

  const handleExcluir = async (l: LeadListComStats) => {
    if (
      !confirm(
        `Excluir a lista "${l.name}"? Os ${l.leads_atuais} leads dela também serão removidos. Esta ação não pode ser desfeita.`,
      )
    )
      return;
    const prev = listas;
    setListas((p) => p.filter((x) => x.id !== l.id));
    try {
      await excluirLista(l.id);
      toast.success("Lista excluída.");
    } catch (e) {
      setListas(prev);
      toast.error(e instanceof Error ? e.message : "Falha ao excluir");
    }
  };

  if (aberta) {
    return (
      <ListaAberta
        lista={aberta}
        onVoltar={() => {
          setAberta(null);
          carregar();
        }}
        onOpenRedesign={onOpenRedesign}
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Minhas Listas</h1>
          <p className="text-sm text-muted-foreground">
            Cada busca salva vira uma lista. {listas.length} listas.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={carregar}>
          <RefreshCw className="h-4 w-4" /> Atualizar
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
        </div>
      ) : error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : listas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-16 text-center">
          <FolderOpen className="mx-auto h-8 w-8 text-muted-foreground" />
          <h3 className="mt-4 font-semibold">Nenhuma lista ainda</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Faça uma busca na aba Buscar — ela vira uma lista salva automaticamente.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listas.map((l) => (
            <div
              key={l.id}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]"
            >
              <button className="flex-1 text-left" onClick={() => setAberta(l)}>
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold leading-tight text-foreground">{l.name}</span>
                  <FolderOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {l.niche}
                  {l.city ? ` · ${l.city}` : ""}
                  {l.uf ? `/${l.uf}` : ""}
                  {l.fonte ? ` · ${l.fonte}` : ""}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{formatData(l.created_at)}</div>
                <div className="mt-3 flex items-center gap-4">
                  <span className="flex items-baseline gap-1">
                    <b className="text-lg tabular-nums">{l.leads_atuais}</b>
                    <span className="text-xs text-muted-foreground">leads</span>
                  </span>
                  <span className="flex items-baseline gap-1">
                    <b className="text-lg tabular-nums text-amber-600">{l.gold_count}</b>
                    <span className="text-xs text-muted-foreground">cliente-ouro</span>
                  </span>
                </div>
              </button>
              {/* FIX 2 — opt-in do follow-up automático POR LISTA (default desligado) */}
              <div className="flex items-center justify-between gap-2 rounded-lg bg-secondary/50 px-2.5 py-2">
                <div className="flex min-w-0 items-center gap-2">
                  <MailCheck
                    className={cn(
                      "h-4 w-4 shrink-0",
                      l.follow_up_ativo ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                  <div className="min-w-0 leading-tight">
                    <div className="text-xs font-medium">Follow-up automático</div>
                    <div className="text-[11px] text-muted-foreground">
                      {l.follow_up_ativo ? "Ligado" : "Desligado"} · {l.proposta_enviada_atuais}{" "}
                      elegív{l.proposta_enviada_atuais === 1 ? "el" : "eis"}
                    </div>
                  </div>
                </div>
                <Switch
                  checked={l.follow_up_ativo}
                  onCheckedChange={(v) => handleToggleFollowUp(l, v)}
                  aria-label={`Ativar follow-up automático na lista ${l.name}`}
                />
              </div>
              <div className="flex items-center gap-1.5 border-t border-border pt-2">
                <Button size="sm" variant="ghost" className="flex-1" onClick={() => setAberta(l)}>
                  <FolderOpen className="h-4 w-4" /> Abrir
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  title="Renomear"
                  onClick={() => handleRenomear(l)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" title="Excluir" onClick={() => handleExcluir(l)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------- Visão de uma lista aberta (leads dela) -------------------- */
function ListaAberta({
  lista,
  onVoltar,
  onOpenRedesign,
}: {
  lista: LeadListComStats;
  onVoltar: () => void;
  onOpenRedesign?: (leadId: string) => void;
}) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagina, setPagina] = useState(1);

  useEffect(() => {
    let vivo = true;
    setLoading(true);
    fetchLeadsDaLista(lista.id)
      .then((ls) => {
        if (vivo) setLeads(ls);
      })
      .catch((e) => {
        if (vivo) setError(e instanceof Error ? e.message : "Falha ao carregar leads");
      })
      .finally(() => {
        if (vivo) setLoading(false);
      });
    return () => {
      vivo = false;
    };
  }, [lista.id]);

  const ordenados = useMemo(() => [...leads].sort((a, b) => b.score - a.score), [leads]);
  const paginados = paginar(
    ordenados,
    Math.min(pagina, Math.max(1, Math.ceil(ordenados.length / PAGE_SIZE))),
  );

  const exportCsv = () => {
    if (!leads.length) return;
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
    const rows = ordenados.map((l) => [
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
      l.status,
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${lista.name.toLowerCase().replace(/\s+/g, "-")}.csv`;
    a.click();
  };

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onVoltar}>
            <ArrowLeft className="h-4 w-4" /> Listas
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{lista.name}</h1>
            <p className="text-sm text-muted-foreground">
              {lista.niche}
              {lista.city ? ` · ${lista.city}` : ""}
              {lista.uf ? `/${lista.uf}` : ""} · {ordenados.length} leads
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={!leads.length}>
          <Download className="h-4 w-4" /> Exportar CSV
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
        </div>
      ) : error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : ordenados.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-16 text-center text-sm text-muted-foreground">
          Esta lista está vazia.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
          <div className="overflow-x-auto">
            <table className="w-full text-[15px]">
              <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
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
                  <tr key={l.id} className="border-t border-border hover:bg-secondary/30">
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
                        {onOpenRedesign && l.website && (
                          <Button
                            size="sm"
                            variant="ghost"
                            title="Redesenhar site"
                            className="text-primary"
                            onClick={() => onOpenRedesign(l.id)}
                          >
                            <Wand2 className="h-4 w-4" />
                          </Button>
                        )}
                        <MapsButton lead={l} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {ordenados.length > PAGE_SIZE && (
            <Paginacao
              total={ordenados.length}
              page={Math.min(pagina, Math.max(1, Math.ceil(ordenados.length / PAGE_SIZE)))}
              onPage={setPagina}
            />
          )}
        </div>
      )}
    </div>
  );
}
