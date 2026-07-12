// Fase 3 — Tela "Redesign" LIGADA: gera o site novo do lead via IA (redesign-site),
// mostra preview, editor inline (texto/imagem) e comparador antes/depois.
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Loader2, RefreshCw, Wand2, Pencil, Eye, Columns2, ExternalLink, Save, Trash2,
  X, Download, Globe,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatDataHora } from "@/lib/format";
import { fetchLeads, type Lead } from "@/lib/leads-api";
import type { Redesign, RedesignStatus } from "@/types";
import { listarRedesigns, gerarRedesign, salvarEdicao, excluirRedesign } from "@/services/redesign";

const STATUS_STYLE: Record<RedesignStatus, string> = {
  pendente: "bg-secondary text-muted-foreground",
  gerando: "bg-amber-50 text-amber-700",
  pronto: "bg-green-100 text-green-800",
  erro: "bg-red-50 text-red-700",
};

// Script injetado no iframe para edição inline (texto contentEditable + trocar imagem).
const EDITOR_SNIPPET = `
<style id="__editorstyle">[contenteditable="true"]{outline:1px dashed #3b82f6;outline-offset:2px}[contenteditable="true"]:focus{outline:2px solid #3b82f6}.__img-edit{cursor:pointer !important;outline:2px dashed #16a34a !important}</style>
<script id="__editor">(function(){var sel="h1,h2,h3,h4,h5,h6,p,span,a,li,button,strong,em,blockquote,figcaption,label";document.querySelectorAll(sel).forEach(function(el){if(!el.querySelector("img")){el.setAttribute("contenteditable","true")}});document.querySelectorAll("img").forEach(function(img){img.classList.add("__img-edit");img.addEventListener("click",function(e){e.preventDefault();var u=prompt("URL da nova imagem:",img.getAttribute("src")||"");if(u){img.setAttribute("src",u)}})});})();</script>
`;

function injetarEditor(html: string): string {
  if (/<\/body>/i.test(html)) return html.replace(/<\/body>/i, EDITOR_SNIPPET + "</body>");
  return html + EDITOR_SNIPPET;
}

export function RedesignSection() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [redesigns, setRedesigns] = useState<Redesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leadSel, setLeadSel] = useState<string>("");
  const [gerando, setGerando] = useState(false);
  const [aberto, setAberto] = useState<Redesign | null>(null);

  const carregar = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ls, rs] = await Promise.all([fetchLeads(), listarRedesigns()]);
      setLeads(ls);
      setRedesigns(rs);
      if (!leadSel && ls.length) setLeadSel(ls.find((l) => l.website)?.id ?? ls[0].id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { carregar(); }, []);

  const nomeLead = (id: string) => leads.find((l) => l.id === id)?.business_name ?? "lead";

  const handleGerar = async (leadId: string) => {
    if (!leadId) return;
    setGerando(true);
    toast.info(`Gerando site de "${nomeLead(leadId)}"… pode levar 10–40s.`);
    try {
      const res = await gerarRedesign(leadId);
      const u = res.usage;
      toast.success(
        `Site gerado! ${u.modelo} · ${u.outputTokens} tokens · ~US$ ${u.custoUsd.toFixed(4)} · ${u.imagensUsadas} imagens${u.temLogo ? " + logo" : ""}`,
        { duration: 8000 },
      );
      await carregar();
      setAberto(res.redesign);
    } catch (e) {
      toast.error(`Falha ao gerar: ${e instanceof Error ? e.message : "erro"}`);
    } finally {
      setGerando(false);
    }
  };

  const handleExcluir = async (r: Redesign) => {
    if (!confirm(`Excluir o redesign de "${r.lead_nome ?? nomeLead(r.lead_id)}"?`)) return;
    const prev = redesigns;
    setRedesigns((p) => p.filter((x) => x.id !== r.id));
    try {
      await excluirRedesign(r.id);
      toast.success("Redesign excluído.");
    } catch (e) {
      setRedesigns(prev);
      toast.error(e instanceof Error ? e.message : "Falha ao excluir");
    }
  };

  const leadsComSite = useMemo(() => leads.filter((l) => l.website), [leads]);

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Redesign</h1>
          <p className="text-sm text-muted-foreground">Gere o site novo do lead com IA e ajuste no editor.</p>
        </div>
        <Button variant="outline" size="sm" onClick={carregar}><RefreshCw className="h-4 w-4" /> Atualizar</Button>
      </div>

      {/* Gerar novo redesign */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
        <h2 className="mb-2 text-sm font-semibold">Gerar novo redesign</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[280px] flex-1">
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Lead</label>
            <Select value={leadSel} onValueChange={setLeadSel} disabled={gerando || !leads.length}>
              <SelectTrigger aria-label="Escolher lead"><SelectValue placeholder="Escolha um lead" /></SelectTrigger>
              <SelectContent className="max-h-80">
                {leads.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.business_name}{l.website ? " · tem site" : " · sem site"}{l.rating ? ` · ★${l.rating}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => handleGerar(leadSel)} disabled={gerando || !leadSel} className="bg-primary font-semibold hover:bg-primary/90">
            {gerando ? <><Loader2 className="h-4 w-4 animate-spin" /> Gerando...</> : <><Wand2 className="h-4 w-4" /> Redesenhar</>}
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {leadsComSite.length} leads com site (matéria-prima melhor). Custo por geração ~US$ 0,01–0,05 (OpenAI).
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</div>
      ) : error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      ) : redesigns.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-16 text-center">
          <Wand2 className="mx-auto h-8 w-8 text-muted-foreground" />
          <h3 className="mt-4 font-semibold">Nenhum redesign ainda</h3>
          <p className="mt-1 text-sm text-muted-foreground">Escolha um lead acima e clique em Redesenhar.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {redesigns.map((r) => (
            <div key={r.id} className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
              <div className="h-40 overflow-hidden border-b border-border bg-white">
                {r.html_gerado ? (
                  <iframe title={`preview-${r.id}`} srcDoc={r.html_editado ?? r.html_gerado}
                    className="pointer-events-none h-[500px] w-[1250px] origin-top-left scale-[0.32] border-0" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                    {r.status === "gerando" ? "gerando…" : r.status === "erro" ? "erro na geração" : "sem preview"}
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold leading-tight text-foreground">{r.lead_nome ?? nomeLead(r.lead_id)}</span>
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STATUS_STYLE[r.status])}>{r.status}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {r.modelo ? `${r.modelo}` : ""}{r.custo_usd != null ? ` · ~US$ ${Number(r.custo_usd).toFixed(4)}` : ""}
                  {r.gerado_em ? ` · ${formatDataHora(r.gerado_em)}` : ""}
                </div>
                <div className="mt-auto flex items-center gap-2 pt-1">
                  <Button size="sm" className="flex-1" onClick={() => setAberto(r)} disabled={!r.html_gerado}>
                    <Pencil className="h-4 w-4" /> Abrir editor
                  </Button>
                  <Button size="sm" variant="ghost" title="Redesenhar de novo" onClick={() => handleGerar(r.lead_id)} disabled={gerando}>
                    <Wand2 className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" title="Excluir" onClick={() => handleExcluir(r)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {aberto && aberto.html_gerado && (
        <EditorRedesign
          redesign={aberto}
          onClose={() => setAberto(null)}
          onSaved={(html) => {
            setRedesigns((prev) => prev.map((r) => (r.id === aberto.id ? { ...r, html_editado: html } : r)));
          }}
        />
      )}
    </div>
  );
}

/* -------------------- Editor + comparador (modal cheio) -------------------- */
type Modo = "preview" | "editar" | "comparar";

function EditorRedesign({ redesign, onClose, onSaved }: { redesign: Redesign; onClose: () => void; onSaved: (html: string) => void }) {
  const [html, setHtml] = useState(redesign.html_editado ?? redesign.html_gerado ?? "");
  const [modo, setModo] = useState<Modo>("preview");
  const [salvando, setSalvando] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const salvar = async () => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) { toast.error("Não consegui ler o editor."); return; }
    setSalvando(true);
    try {
      const clone = doc.documentElement.cloneNode(true) as HTMLElement;
      clone.querySelectorAll("[contenteditable]").forEach((el) => el.removeAttribute("contenteditable"));
      clone.querySelectorAll(".__img-edit").forEach((el) => el.classList.remove("__img-edit"));
      clone.querySelector("#__editor")?.remove();
      clone.querySelector("#__editorstyle")?.remove();
      const out = "<!doctype html>\n" + clone.outerHTML;
      await salvarEdicao(redesign.id, out);
      setHtml(out);
      onSaved(out);
      setModo("preview");
      toast.success("Edições salvas.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao salvar");
    } finally {
      setSalvando(false);
    }
  };

  const abrirNovaAba = () => {
    const blob = new Blob([html], { type: "text/html" });
    window.open(URL.createObjectURL(blob), "_blank");
  };
  const baixar = () => {
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `site-${(redesign.lead_nome ?? "lead").toLowerCase().replace(/\s+/g, "-")}.html`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/50">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-card px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{redesign.lead_nome ?? "Redesign"}</span>
          <div className="ml-2 flex rounded-md border border-border p-0.5">
            {(["preview", "editar", "comparar"] as Modo[]).map((m) => (
              <button key={m} onClick={() => setModo(m)}
                className={cn("rounded px-3 py-1 text-xs font-medium capitalize", modo === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                {m === "preview" ? <><Eye className="mr-1 inline h-3.5 w-3.5" />Preview</> : m === "editar" ? <><Pencil className="mr-1 inline h-3.5 w-3.5" />Editar</> : <><Columns2 className="mr-1 inline h-3.5 w-3.5" />Antes/Depois</>}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {modo === "editar" && (
            <Button size="sm" onClick={salvar} disabled={salvando}>
              {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={abrirNovaAba}><ExternalLink className="h-4 w-4" /> Abrir</Button>
          <Button size="sm" variant="outline" onClick={baixar}><Download className="h-4 w-4" /> HTML</Button>
          <Button size="sm" variant="ghost" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden bg-secondary/30">
        {modo === "comparar" ? (
          <div className="grid h-full grid-cols-2 gap-px bg-border">
            <div className="flex flex-col bg-white">
              <div className="bg-black/70 px-2 py-1 text-xs text-white">Antes {redesign.site_original_url ? "" : "(sem site atual)"}</div>
              {redesign.site_original_url ? (
                <iframe title="antes" src={redesign.site_original_url} className="h-full w-full border-0" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Este lead não tinha site.</div>
              )}
            </div>
            <div className="flex flex-col bg-white">
              <div className="bg-primary px-2 py-1 text-xs text-primary-foreground">Depois (novo site)</div>
              <iframe title="depois" srcDoc={html} sandbox="allow-scripts allow-same-origin allow-popups" className="h-full w-full border-0" />
            </div>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            title="editor"
            key={modo}
            srcDoc={modo === "editar" ? injetarEditor(html) : html}
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals"
            className="h-full w-full border-0 bg-white"
          />
        )}
      </div>
      {modo === "comparar" && redesign.site_original_url && (
        <div className="bg-card px-4 py-1 text-center text-xs text-muted-foreground">
          Se o "Antes" ficar em branco, o site atual bloqueia incorporação —{" "}
          <a href={redesign.site_original_url} target="_blank" rel="noreferrer" className="text-primary underline"><Globe className="inline h-3 w-3" /> abrir em nova aba</a>.
        </div>
      )}
    </div>
  );
}
