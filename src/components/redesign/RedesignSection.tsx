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
  onIrParaCampanhas,
}: {
  focusLeadId?: string | null;
  onFocusConsumed?: () => void;
  onIrParaCampanhas?: () => void;
} = {}) {
  return (
    <div className="mx-auto max-w-4xl space-y-6 py-6 px-2">
      {/* Badge Superior de Manutenção */}
      <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-amber-600">
        <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
        Em Manutenção · Novo Motor em Breve
      </div>

      {/* Cartão Principal de Manutenção */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-b from-card via-card to-card/90 p-8 shadow-2xl md:p-12 text-center">
        {/* Glows Decorativos de Fundo */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />

        {/* Ícone de Construção/IA Animado */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 text-amber-500 shadow-inner border border-amber-500/20">
          <Wand2 className="h-10 w-10 animate-bounce" />
        </div>

        {/* Título e Mensagem Obrigatória Solicitada pelo Usuário */}
        <h1 className="mt-6 font-serif text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Este recurso está sendo melhorado!
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
          Em breve você terá uma <span className="font-semibold text-foreground">nova experiência incrível</span> para conseguir mais clientes. Estamos refazendo todo o nosso motor de criação de sites por Inteligência Artificial para entregar layouts ultra-modernos e de altíssima conversão!
        </p>

        {/* Detalhes do Novo Motor */}
        <div className="mt-10 grid gap-4 text-left sm:grid-cols-2">
          <div className="flex items-start gap-3.5 rounded-2xl border border-border/70 bg-muted/40 p-4.5 transition hover:border-amber-500/40">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 font-bold text-base">
              🚀
            </span>
            <div>
              <div className="font-semibold text-sm text-foreground">Novo Motor de IA de Vendas</div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Designs e copys hiper-persuasivos gerados sob medida para o segmento comercial de cada lead.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 rounded-2xl border border-border/70 bg-muted/40 p-4.5 transition hover:border-amber-500/40">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-600 font-bold text-base">
              🎨
            </span>
            <div>
              <div className="font-semibold text-sm text-foreground">Editor Visual Drag & Drop</div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Edição simplificada em tempo real de textos, fotos, botões e seções completas.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 rounded-2xl border border-border/70 bg-muted/40 p-4.5 transition hover:border-amber-500/40">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 font-bold text-base">
              ⚡
            </span>
            <div>
              <div className="font-semibold text-sm text-foreground">Carregamento Instantâneo</div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Páginas 100% otimizadas para celulares com performance máxima nos testes do Google.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 rounded-2xl border border-border/70 bg-muted/40 p-4.5 transition hover:border-amber-500/40">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-blue-600 font-bold text-base">
              📈
            </span>
            <div>
              <div className="font-semibold text-sm text-foreground">Maior Taxa de Conversão</div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Estruturas validadas para transformar visitantes em reuniões e contratos fechados.
              </p>
            </div>
          </div>
        </div>

        {/* Botão de Redirecionamento */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {onIrParaCampanhas && (
            <Button
              size="lg"
              className="bg-primary font-semibold hover:bg-primary/90"
              onClick={onIrParaCampanhas}
            >
              <Sparkles className="mr-2 h-4 w-4" /> Ir para Disparos & Campanhas no WhatsApp
            </Button>
          )}
        </div>
      </div>
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
