// Fase 3 — Tela "Redesign": a partir de um lead, gerar o novo site e comparar
// antes/depois (só layout + mock por ora). Consome SOMENTE os tipos centrais
// (@/types) via a camada de serviço (@/services/redesign) — nunca o mock direto.
import { useEffect, useState } from "react";
import {
  Loader2, RefreshCw, Plus, Wand2, Columns2, Globe, ExternalLink, MessageCircle, Star,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Redesign, RedesignStatus } from "@/types";
import { listarRedesigns, gerarRedesign } from "@/services/redesign";

const STATUS_LABEL: Record<RedesignStatus, string> = {
  pendente: "Pendente",
  gerando: "Gerando…",
  pronto: "Pronto",
  erro: "Erro",
};

const STATUS_STYLE: Record<RedesignStatus, string> = {
  pendente: "bg-secondary text-muted-foreground",
  gerando: "bg-amber-50 text-amber-700",
  pronto: "bg-green-100 text-green-800",
  erro: "bg-red-50 text-red-700",
};

function StatusPill({ status }: { status: RedesignStatus }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", STATUS_STYLE[status])}>
      {status === "gerando" && <Loader2 className="h-3 w-3 animate-spin" />}
      {STATUS_LABEL[status]}
    </span>
  );
}

export function RedesignSection() {
  const [redesigns, setRedesigns] = useState<Redesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gerandoId, setGerandoId] = useState<string | null>(null);
  const [novoGerando, setNovoGerando] = useState(false);
  const [comparando, setComparando] = useState<Redesign | null>(null);

  const carregar = async () => {
    setLoading(true);
    setError(null);
    try {
      setRedesigns(await listarRedesigns());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar redesigns");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { carregar(); }, []);

  const handleNovo = async () => {
    setNovoGerando(true);
    try {
      // TODO: LIGAR API — abrir seleção de lead real; hoje usa alvo mock.
      const novo = await gerarRedesign();
      setRedesigns((prev) => [novo, ...prev]);
      toast.success(`Redesign gerado para "${novo.lead_nome}"`);
      setComparando(novo);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível gerar o redesign");
    } finally {
      setNovoGerando(false);
    }
  };

  const handleRedesenhar = async (r: Redesign) => {
    setGerandoId(r.id);
    // otimista: mostra "gerando" no card
    setRedesigns((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: "gerando" } : x)));
    try {
      const atualizado = await gerarRedesign(r);
      setRedesigns((prev) => prev.map((x) => (x.id === atualizado.id ? atualizado : x)));
      toast.success(`Redesign atualizado para "${r.lead_nome}"`);
    } catch (e) {
      setRedesigns((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: "erro" } : x)));
      toast.error(e instanceof Error ? e.message : "Falha ao redesenhar");
    } finally {
      setGerandoId(null);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Redesign</h1>
          <p className="text-sm text-muted-foreground">Gere o novo site do lead e compare antes/depois.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={carregar}><RefreshCw className="h-4 w-4" /> Atualizar</Button>
          <Button size="sm" onClick={handleNovo} disabled={novoGerando} className="bg-primary font-semibold hover:bg-primary/90">
            {novoGerando ? <><Loader2 className="h-4 w-4 animate-spin" /> Gerando...</> : <><Plus className="h-4 w-4" /> Novo redesign</>}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</div>
      ) : error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      ) : redesigns.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-16 text-center">
          <Wand2 className="mx-auto h-8 w-8 text-muted-foreground" />
          <h3 className="mt-4 font-semibold">Nenhum redesign ainda</h3>
          <p className="mt-1 text-sm text-muted-foreground">Clique em "Novo redesign" para gerar o primeiro.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {redesigns.map((r) => (
            <div key={r.id} className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
              {/* mini-preview do "depois" */}
              <div className="relative h-36 overflow-hidden border-b border-border bg-slate-900">
                {r.status === "pronto" ? (
                  <SiteDepois nome={r.lead_nome} compact />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-400">
                    {r.status === "gerando" ? "gerando preview…" : "preview ainda não gerado"}
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold leading-tight text-foreground">{r.lead_nome}</span>
                  <StatusPill status={r.status} />
                </div>
                {r.site_original_url && (
                  <a href={r.site_original_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
                    <Globe className="h-3.5 w-3.5" /> Site atual <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {r.observacoes && <p className="text-xs text-muted-foreground">{r.observacoes}</p>}
                <div className="mt-auto flex items-center gap-2 pt-1">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => handleRedesenhar(r)} disabled={gerandoId === r.id || r.status === "gerando"}>
                    {gerandoId === r.id || r.status === "gerando" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                    Redesenhar
                  </Button>
                  <Button size="sm" className="flex-1" onClick={() => setComparando(r)} disabled={r.status !== "pronto"}>
                    <Columns2 className="h-4 w-4" /> Comparar
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {comparando && (
        <ComparadorDialog redesign={comparando} onClose={() => setComparando(null)} />
      )}
    </div>
  );
}

/* -------------------- Comparador antes/depois (wipe) -------------------- */
function ComparadorDialog({ redesign, onClose }: { redesign: Redesign; onClose: () => void }) {
  const [pos, setPos] = useState(50);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Columns2 className="h-4 w-4 text-primary" /> Antes / Depois — {redesign.lead_nome}
          </DialogTitle>
        </DialogHeader>

        <div className="relative aspect-[16/10] w-full select-none overflow-hidden rounded-lg border border-border">
          {/* Depois (fundo) */}
          <div className="absolute inset-0"><SiteDepois nome={redesign.lead_nome} /></div>
          {/* Antes (recortado pela posição do slider) */}
          <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
            <SiteAntes nome={redesign.lead_nome} />
          </div>
          {/* divisória */}
          <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow" style={{ left: `${pos}%` }} />
          <span className="absolute left-2 top-2 rounded bg-black/60 px-2 py-0.5 text-xs font-medium text-white">Antes</span>
          <span className="absolute right-2 top-2 rounded bg-primary/90 px-2 py-0.5 text-xs font-medium text-primary-foreground">Depois</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">Antes</span>
          <input
            type="range" min={0} max={100} value={pos}
            onChange={(e) => setPos(Number(e.target.value))}
            aria-label="Comparar antes e depois"
            className="h-2 flex-1 cursor-ew-resize appearance-none rounded-full bg-secondary accent-primary"
          />
          <span className="text-xs text-muted-foreground">Depois</span>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          {/* TODO: LIGAR API — aqui entra o preview real do site gerado (redesign-site). */}
          Prévia ilustrativa. O site real gerado aparece aqui quando a API for ligada.
        </p>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------- Previews mock (layout ilustrativo) -------------------- */
function SiteAntes({ nome }: { nome: string }) {
  return (
    <div className="flex h-full w-full flex-col bg-[#e9e9e9] font-serif text-[#222]">
      <div className="bg-[#3a4a5a] px-3 py-2 text-center text-sm font-bold text-white">{nome}</div>
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
        <div className="text-base font-bold underline">Bem-vindo ao nosso site</div>
        <div className="max-w-[80%] text-[11px] leading-tight">
          Somos uma empresa comprometida com a qualidade. Ligue para nós e agende um horário pelo telefone.
        </div>
        <div className="mt-1 h-16 w-24 border border-[#999] bg-[#cfcfcf] text-center text-[9px] leading-[64px] text-[#777]">imagem</div>
        <div className="text-[10px] text-[#555]">Tel: (00) 0000-0000 · seg a sex</div>
      </div>
      <div className="bg-[#d5d5d5] px-3 py-1 text-center text-[9px] text-[#666]">© 2013 — todos os direitos reservados</div>
    </div>
  );
}

function SiteDepois({ nome, compact }: { nome: string; compact?: boolean }) {
  return (
    <div className="flex h-full w-full flex-col bg-white text-slate-900">
      <div className="flex items-center justify-between bg-gradient-to-r from-primary to-indigo-600 px-3 py-2 text-white">
        <span className={cn("font-bold", compact ? "text-xs" : "text-sm")}>{nome}</span>
        <span className={cn("rounded-full bg-white/20 px-2 py-0.5 font-medium", compact ? "text-[9px]" : "text-[10px]")}>Menu</span>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-2 bg-gradient-to-b from-blue-50 to-white px-4 text-center">
        <div className={cn("font-bold tracking-tight", compact ? "text-sm" : "text-lg")}>Sua melhor escolha, agora online</div>
        {!compact && <div className="max-w-[70%] text-[11px] text-slate-500">Atendimento rápido, agendamento pelo WhatsApp e visual moderno que passa confiança.</div>}
        <div className="inline-flex items-center gap-1 rounded-full bg-[#16A34A] px-3 py-1 text-[11px] font-semibold text-white">
          <MessageCircle className="h-3 w-3" /> Falar no WhatsApp
        </div>
        {!compact && (
          <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-500">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span className="ml-1 text-slate-500">avaliação dos clientes</span>
          </div>
        )}
      </div>
    </div>
  );
}
