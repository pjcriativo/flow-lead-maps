// Fase 3 — Tela "Redesign" LIGADA: gera o site novo do lead via IA (redesign-site),
// mostra preview, editor inline (texto/imagem) e comparador antes/depois.
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Loader2,
  RefreshCw,
  Wand2,
  Pencil,
  Eye,
  Columns2,
  ExternalLink,
  Save,
  Trash2,
  X,
  Download,
  Globe,
  Sparkles,
  Rocket,
  Zap,
  ShieldCheck,
  ArrowRight,
  Construction,
  Bot,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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

/** "expira em 15 dias" / "expira hoje" / "expirado há 3 dias" a partir de expira_em (ISO). */
function expiraLabel(expira_em: string | null): { texto: string; vencido: boolean } | null {
  if (!expira_em) return null;
  const ms = new Date(expira_em).getTime() - Date.now();
  const dias = Math.ceil(ms / 86_400_000);
  if (dias > 1) return { texto: `expira em ${dias} dias`, vencido: false };
  if (dias === 1) return { texto: "expira amanhã", vencido: false };
  if (dias === 0) return { texto: "expira hoje", vencido: false };
  return {
    texto: `expirado há ${Math.abs(dias)} dia${Math.abs(dias) > 1 ? "s" : ""}`,
    vencido: true,
  };
}

export function RedesignSection({
  focusLeadId,
  onFocusConsumed,
  onIrParaCampanhas,
}: {
  focusLeadId?: string | null;
  onFocusConsumed?: () => void;
  onIrParaCampanhas?: () => void;
} = {}) {
  const [redesigns, setRedesigns] = useState<Redesign[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [consumo, setConsumo] = useState<EstadoConsumoSites>({
    usado: 0,
    limite: null,
    restante: null,
    perto: false,
  });
  const [carregando, setCarregando] = useState(true);
  const [gerando, setGerando] = useState(false);
  const [leadIdSelecionado, setLeadIdSelecionado] = useState<string>("");
  const [novoDoZero, setNovoDoZero] = useState(false);
  const [editando, setEditando] = useState<Redesign | null>(null);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);

  const carregarDados = async () => {
    setCarregando(true);
    try {
      const [listRd, listLeads, cota] = await Promise.all([
        listarRedesigns(),
        fetchLeads(),
        obterConsumoSites(),
      ]);
      setRedesigns(listRd);
      setLeads(listLeads);
      setConsumo(cota);

      if (focusLeadId) {
        setLeadIdSelecionado(focusLeadId);
        onFocusConsumed?.();
      } else if (listLeads.length > 0 && !leadIdSelecionado) {
        setLeadIdSelecionado(listLeads[0].id);
      }
    } catch (e) {
      toast.error("Erro ao carregar dados de redesign: " + (e instanceof Error ? e.message : ""));
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const atingiuLimite = consumo.limite !== null && consumo.usado >= consumo.limite;

  const handleGerar = async () => {
    if (!leadIdSelecionado) {
      toast.error("Selecione um lead para gerar o redesign.");
      return;
    }
    if (atingiuLimite) {
      toast.error(
        `Limite do plano atingido (${consumo.usado}/${consumo.limite} redesigns). Solicite mais ao suporte/admin.`,
      );
      return;
    }

    setGerando(true);
    try {
      const resp = await gerarRedesign(leadIdSelecionado, { novoDoZero });
      toast.success(`Redesign gerado com sucesso para ${resp.lead_nome}!`);
      await carregarDados();
      if (resp.redesign) {
        setEditando(resp.redesign);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error("Falha ao gerar redesign: " + msg);
    } finally {
      setGerando(false);
    }
  };

  const handleExcluir = async (id: string) => {
    setExcluindoId(id);
    try {
      await excluirRedesign(id);
      toast.success("Redesign excluído.");
      setRedesigns((list) => list.filter((r) => r.id !== id));
    } catch (e) {
      toast.error("Falha ao excluir redesign.");
    } finally {
      setExcluindoId(null);
    }
  };

  const leadSelecionadoObj = useMemo(
    () => leads.find((l) => l.id === leadIdSelecionado),
    [leads, leadIdSelecionado],
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 py-6 px-4">
      {/* Header da Seção */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Redesign de Site por IA
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 text-xs font-semibold text-purple-600 dark:text-purple-400">
              <Sparkles className="h-3 w-3" /> IA de Vendas
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Gere landing pages hiper-persuasivas com matérias-primas e depoimentos reais do seu lead.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={carregarDados}
          disabled={carregando}
          className="gap-1.5 shrink-0"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", carregando && "animate-spin")} />
          Atualizar dados
        </Button>
      </div>

      {/* Widget de Gestão de Cota por Plano */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/15 text-purple-600 font-bold">
              <Wand2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-foreground">
                  Consumo do Plano: Redesigns de Site
                </span>
                {consumo.limite === null ? (
                  <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-xs font-bold text-emerald-600">
                    Ilimitado (Admin)
                  </span>
                ) : atingiuLimite ? (
                  <span className="rounded bg-red-500/15 px-2 py-0.5 text-xs font-bold text-red-600">
                    Limite Atingido
                  </span>
                ) : (
                  <span className="rounded bg-purple-500/15 px-2 py-0.5 text-xs font-bold text-purple-600">
                    {consumo.restante} restante{consumo.restante !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {consumo.limite === null
                  ? "Sua conta tem permissão ilimitada para gerar sites por IA."
                  : `Você utilizou ${consumo.usado} de ${consumo.limite} redesigns disponíveis no ciclo atual.`}
              </p>
            </div>
          </div>

          {consumo.limite !== null && (
            <div className="text-right sm:shrink-0">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Uso Mensal
              </span>
              <p className="text-lg font-bold tracking-tight text-foreground">
                {consumo.usado} <span className="text-xs font-normal text-muted-foreground">/ {consumo.limite}</span>
              </p>
            </div>
          )}
        </div>

        {/* Barra de Progresso */}
        {consumo.limite !== null && (
          <div className="space-y-1">
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className={cn(
                  "h-full transition-all duration-500 rounded-full",
                  atingiuLimite
                    ? "bg-red-500"
                    : consumo.perto
                    ? "bg-amber-500"
                    : "bg-purple-600",
                )}
                style={{
                  width: `${Math.min(100, (consumo.usado / consumo.limite) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Alerta quando o limite é atingido */}
        {atingiuLimite && (
          <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-700 dark:text-red-300">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
            <div>
              <p className="font-semibold">Limite de redesigns atingido para o seu plano!</p>
              <p className="mt-0.5">
                Você consumiu todos os {consumo.limite} redesigns de site do seu plano neste mês. Entre em contato com o suporte/administrador para adicionar redesigns bônus ou faça upgrade do seu plano.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Painel de Gerador de Redesign */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg font-semibold tracking-tight">Gerar Novo Redesign</h2>
          <span className="text-xs text-muted-foreground">
            Duração estimada: 10 a 40 segundos
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-3 items-end">
          {/* Seletor de Lead */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Selecione o Lead
            </label>
            <select
              value={leadIdSelecionado}
              onChange={(e) => setLeadIdSelecionado(e.target.value)}
              disabled={gerando || leads.length === 0}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 disabled:opacity-50"
            >
              {leads.length === 0 ? (
                <option value="">Nenhum lead encontrado nas suas listas</option>
              ) : (
                leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.business_name} {l.website ? `(${l.website})` : "— (Sem site)"}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Botão de Ação */}
          <div>
            <Button
              onClick={handleGerar}
              disabled={gerando || !leadIdSelecionado || atingiuLimite}
              className="h-10 w-full gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-xs cursor-pointer disabled:opacity-50"
            >
              {gerando ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Gerando site...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" /> Gerar Redesign
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Opção Novo do Zero */}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="novoDoZero"
            checked={novoDoZero}
            onChange={(e) => setNovoDoZero(e.target.checked)}
            disabled={gerando}
            className="rounded border-input text-purple-600 focus:ring-purple-500 cursor-pointer"
          />
          <label
            htmlFor="novoDoZero"
            className="text-xs text-muted-foreground cursor-pointer select-none"
          >
            Gerar site NOVO do zero (ignorar o conteúdo do site atual se houver e usar dados do Google)
          </label>
        </div>

        {/* Info do lead selecionado */}
        {leadSelecionadoObj && (
          <div className="rounded-xl border border-border/70 bg-secondary/30 p-3 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">{leadSelecionadoObj.business_name}</span>
              <span className="text-muted-foreground">{leadSelecionadoObj.category ?? "Geral"}</span>
            </div>
            <p className="text-muted-foreground truncate">
              {leadSelecionadoObj.website
                ? `Site atual: ${leadSelecionadoObj.website}`
                : "Sem site cadastrado (será gerado do zero a partir do Google Maps)"}
            </p>
          </div>
        )}
      </div>

      {/* Lista de Redesigns Gerados */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden space-y-0">
        <div className="border-b border-border px-6 py-4 flex items-center justify-between bg-card">
          <div>
            <h2 className="font-serif text-lg font-semibold">Redesigns Criados</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Histórico de sites gerados por IA para os seus leads.
            </p>
          </div>
          <span className="text-xs font-semibold text-muted-foreground">
            Total: {redesigns.length}
          </span>
        </div>

        {carregando ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
            <p className="text-xs">Carregando sites gerados...</p>
          </div>
        ) : redesigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center text-muted-foreground gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600">
              <Wand2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Nenhum redesign criado ainda</p>
              <p className="text-xs text-muted-foreground max-w-sm mt-1">
                Selecione um lead acima e clique em "Gerar Redesign com IA" para criar a primeira landing page.
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {redesigns.map((rd) => {
              const exp = expiraLabel(rd.expira_em);
              return (
                <div
                  key={rd.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 hover:bg-secondary/20 transition-colors"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-semibold text-sm text-foreground">
                        {rd.lead_nome ?? "Lead sem nome"}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider",
                          STATUS_STYLE[rd.status],
                        )}
                      >
                        {rd.status}
                      </span>
                      {exp && (
                        <span
                          className={cn(
                            "text-[11px] font-medium px-2 py-0.5 rounded",
                            exp.vencido
                              ? "bg-red-500/10 text-red-600"
                              : "bg-amber-500/10 text-amber-600",
                          )}
                        >
                          {exp.texto}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span>Gerado em: {formatDataHora(rd.criado_em)}</span>
                      {rd.site_original_url && (
                        <a
                          href={rd.site_original_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          <Globe className="h-3 w-3" /> Site original
                        </a>
                      )}
                      {rd.modelo && <span>Modelo: {rd.modelo}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => setEditando(rd)}
                      disabled={rd.status !== "pronto" && !rd.html_gerado}
                      className="gap-1.5 text-xs bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <Eye className="h-3.5 w-3.5" /> Visualizar & Editar
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleExcluir(rd.id)}
                      disabled={excluindoId === rd.id}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      title="Excluir redesign"
                    >
                      {excluindoId === rd.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Editor Redesign Modal */}
      {editando && (
        <EditorRedesign
          redesign={editando}
          onClose={() => setEditando(null)}
          onSaved={() => carregarDados()}
        />
      )}
    </div>
  );
}

/* -------------------- Editor + comparador (modal cheio) -------------------- */
type Modo = "preview" | "editar" | "comparar";

// Exportado para REUSO na revisão em lote das Campanhas (preview + editor inline +
// regenerar), sem recriar o modal. Preview é iframe srcDoc (HTML do banco), nunca
// URL pública — o rascunho é revisado sem publicar.
export function EditorRedesign({
  redesign,
  onClose,
  onSaved,
}: {
  redesign: Redesign;
  onClose: () => void;
  onSaved: (html: string) => void;
}) {
  const [html, setHtml] = useState(redesign.html_editado ?? redesign.html_gerado ?? "");
  const [modo, setModo] = useState<Modo>("preview");
  const [salvando, setSalvando] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const salvar = async () => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) {
      toast.error("Não consegui ler o editor.");
      return;
    }
    setSalvando(true);
    try {
      const clone = doc.documentElement.cloneNode(true) as HTMLElement;
      clone
        .querySelectorAll("[contenteditable]")
        .forEach((el) => el.removeAttribute("contenteditable"));
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
              <button
                key={m}
                onClick={() => setModo(m)}
                className={cn(
                  "rounded px-3 py-1 text-xs font-medium capitalize",
                  modo === m
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {m === "preview" ? (
                  <>
                    <Eye className="mr-1 inline h-3.5 w-3.5" />
                    Preview
                  </>
                ) : m === "editar" ? (
                  <>
                    <Pencil className="mr-1 inline h-3.5 w-3.5" />
                    Editar
                  </>
                ) : (
                  <>
                    <Columns2 className="mr-1 inline h-3.5 w-3.5" />
                    Antes/Depois
                  </>
                )}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {modo === "editar" && (
            <Button size="sm" onClick={salvar} disabled={salvando}>
              {salvando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}{" "}
              Salvar
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={abrirNovaAba}>
            <ExternalLink className="h-4 w-4" /> Abrir
          </Button>
          <Button size="sm" variant="outline" onClick={baixar}>
            <Download className="h-4 w-4" /> HTML
          </Button>
          <Button size="sm" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden bg-secondary/30">
        {modo === "comparar" ? (
          <div className="grid h-full grid-cols-2 gap-px bg-border">
            <div className="flex flex-col bg-white">
              <div className="bg-black/70 px-2 py-1 text-xs text-white">
                Antes {redesign.site_original_url ? "" : "(sem site atual)"}
              </div>
              {redesign.site_original_url ? (
                <iframe
                  title="antes"
                  src={redesign.site_original_url}
                  className="h-full w-full border-0"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Este lead não tinha site.
                </div>
              )}
            </div>
            <div className="flex flex-col bg-white">
              <div className="bg-primary px-2 py-1 text-xs text-primary-foreground">
                Depois (novo site)
              </div>
              <iframe
                title="depois"
                srcDoc={html}
                sandbox="allow-scripts allow-same-origin allow-popups"
                className="h-full w-full border-0"
              />
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
          <a
            href={redesign.site_original_url}
            target="_blank"
            rel="noreferrer"
            className="text-primary underline"
          >
            <Globe className="inline h-3 w-3" /> abrir em nova aba
          </a>
          .
        </div>
      )}
    </div>
  );
}
