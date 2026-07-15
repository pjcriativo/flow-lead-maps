// Fase 2 — CAMPANHAS (portão do site). Modelo SOB DEMANDA: criar campanha de uma lista
// NÃO gera nada (todos os leads entram 'pendente', custo zero). O usuário SELECIONA
// quem preparar → só esses geram site (reusando redesign pronto) + proposta rascunho,
// revisada por PREVIEW (iframe, sem publicar). Publicar (URL) só na aprovação.
import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  RefreshCw,
  Plus,
  Megaphone,
  ArrowLeft,
  Pencil,
  Trash2,
  Wand2,
  Search,
  FolderOpen,
  Sparkles,
  CheckCircle2,
  Globe,
  Circle,
  Eye,
  Send,
  Mail,
  ShieldCheck,
  XCircle,
  ExternalLink,
  CheckCheck,
  Undo2,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatData } from "@/lib/format";
import type { Campanha, CampanhaLeadView, CampanhaLeadEstado, Proposta, Redesign } from "@/types";
import {
  statusRampa,
  gerarPropostaRascunhoSemSite,
  enviarProposta,
  type RampaStatus,
} from "@/services/propostas";
import { gerarRedesign, obterRedesign } from "@/services/redesign";
import { EditorRedesign } from "@/components/redesign/RedesignSection";
import { RevisarPropostaDialog } from "@/components/propostas/PropostasSection";
import {
  listarCampanhas,
  criarCampanhaDaLista,
  renomearCampanha,
  excluirCampanha,
  listarCampanhaLeadsView,
  leadTemMotivoClaro,
  redesignProntoDoLead,
  atualizarCampanhaLead,
  descartarCampanhaLead,
  aprovarCampanhaLead,
  aprovarTodosDaCampanha,
  enviarAprovadasDaCampanha,
  concluirCampanha,
  reabrirCampanha,
} from "@/services/campanhas";
import { listarListas, type LeadListComStats } from "@/lib/lists-api";

const ESTADO_STYLE: Record<CampanhaLeadEstado, string> = {
  pendente: "bg-secondary text-muted-foreground",
  gerando: "bg-amber-100 text-amber-800",
  rascunho: "bg-blue-50 text-blue-700",
  aprovado: "bg-green-100 text-green-800",
  descartado: "bg-secondary text-muted-foreground line-through",
  erro: "bg-red-50 text-red-700",
  sem_motivo: "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200",
};
const ESTADO_LABEL: Record<CampanhaLeadEstado, string> = {
  pendente: "Pendente",
  gerando: "Gerando…",
  rascunho: "Rascunho",
  aprovado: "Aprovado",
  descartado: "Descartado",
  erro: "Erro",
  sem_motivo: "Sem motivo claro",
};

function EstadoPill({ estado, enviada }: { estado: CampanhaLeadEstado; enviada?: boolean }) {
  if (estado === "aprovado" && enviada) {
    return (
      <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
        Enviada
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        ESTADO_STYLE[estado],
      )}
    >
      {ESTADO_LABEL[estado]}
    </span>
  );
}

export function CampanhasSection() {
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [abrindoCriar, setAbrindoCriar] = useState(false);
  const [aberta, setAberta] = useState<Campanha | null>(null);

  const carregar = async () => {
    setLoading(true);
    setError(null);
    try {
      setCampanhas(await listarCampanhas());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar campanhas");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    carregar();
  }, []);

  const handleRenomear = async (c: Campanha) => {
    const novo = prompt("Novo nome da campanha:", c.nome);
    if (novo == null || !novo.trim() || novo.trim() === c.nome) return;
    const prev = campanhas;
    setCampanhas((p) => p.map((x) => (x.id === c.id ? { ...x, nome: novo.trim() } : x)));
    try {
      await renomearCampanha(c.id, novo.trim());
      toast.success("Campanha renomeada.");
    } catch (e) {
      setCampanhas(prev);
      toast.error(e instanceof Error ? e.message : "Falha ao renomear");
    }
  };

  const handleExcluir = async (c: Campanha) => {
    if (!confirm(`Excluir a campanha "${c.nome}"? Esta ação não pode ser desfeita.`)) return;
    const prev = campanhas;
    setCampanhas((p) => p.filter((x) => x.id !== c.id));
    try {
      await excluirCampanha(c.id);
      toast.success("Campanha excluída.");
    } catch (e) {
      setCampanhas(prev);
      toast.error(e instanceof Error ? e.message : "Falha ao excluir");
    }
  };

  const abrirRecemCriada = async (campanhaId: string) => {
    const lista = await listarCampanhas();
    setCampanhas(lista);
    const nova = lista.find((c) => c.id === campanhaId);
    if (nova) setAberta(nova);
  };

  if (aberta) {
    return (
      <RevisaoEmLote
        campanha={aberta}
        onVoltar={() => {
          setAberta(null);
          carregar();
        }}
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Campanhas</h1>
          <p className="text-sm text-muted-foreground">
            Agrupe a abordagem de uma lista. Criar é de graça — você escolhe quem preparar. {""}
            {campanhas.length} campanhas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={carregar}>
            <RefreshCw className="h-4 w-4" /> Atualizar
          </Button>
          <Button
            size="sm"
            onClick={() => setAbrindoCriar(true)}
            className="bg-primary font-semibold hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Criar campanha
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando campanhas...
        </div>
      ) : error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : campanhas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-16 text-center">
          <Megaphone className="mx-auto h-8 w-8 text-muted-foreground" />
          <h3 className="mt-4 font-semibold">Nenhuma campanha ainda</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Clique em "Criar campanha" e escolha uma lista. Todos os leads entram como pendentes —
            você seleciona quais preparar (gerar site + proposta) para revisar.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campanhas.map((c) => (
            <CampanhaCard
              key={c.id}
              campanha={c}
              onAbrir={() => setAberta(c)}
              onRenomear={() => handleRenomear(c)}
              onExcluir={() => handleExcluir(c)}
            />
          ))}
        </div>
      )}

      {abrindoCriar && (
        <CriarCampanhaDialog
          onClose={() => setAbrindoCriar(false)}
          onCriada={async (campanhaId) => {
            setAbrindoCriar(false);
            await abrirRecemCriada(campanhaId);
          }}
        />
      )}
    </div>
  );
}

function CampanhaCard({
  campanha: c,
  onAbrir,
  onRenomear,
  onExcluir,
}: {
  campanha: Campanha;
  onAbrir: () => void;
  onRenomear: () => void;
  onExcluir: () => void;
}) {
  const preparados = c.rascunho + c.aprovado + c.enviado;
  const pct = c.total > 0 ? Math.round((preparados / c.total) * 100) : 0;
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <button className="flex-1 text-left" onClick={onAbrir}>
        <div className="flex items-start justify-between gap-2">
          <span className="font-semibold leading-tight text-foreground">{c.nome}</span>
          <Megaphone className="h-4 w-4 shrink-0 text-muted-foreground" />
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          {formatData(c.criada_em)}
          {c.status === "concluida" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 font-medium text-green-800">
              <CheckCheck className="h-3 w-3" /> Concluída
            </span>
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className="font-medium">
            <b className="text-base tabular-nums">{c.total}</b> leads
          </span>
          <span className="text-muted-foreground">{c.pendente} pendentes</span>
          <span className="text-blue-700">{c.rascunho} rascunho</span>
          <span className="text-green-700">{c.aprovado} aprovados</span>
          {c.enviado > 0 && <span className="text-blue-700">{c.enviado} enviados</span>}
          {c.erro > 0 && <span className="text-destructive">{c.erro} erro</span>}
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
      </button>
      <div className="flex items-center gap-1.5 border-t border-border pt-2">
        <Button size="sm" variant="ghost" className="flex-1" onClick={onAbrir}>
          <Megaphone className="h-4 w-4" /> Abrir revisão
        </Button>
        <Button size="sm" variant="ghost" title="Renomear" onClick={onRenomear}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" title="Excluir" onClick={onExcluir}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

/* -------------------- Criar campanha a partir de uma lista -------------------- */
function CriarCampanhaDialog({
  onClose,
  onCriada,
}: {
  onClose: () => void;
  onCriada: (campanhaId: string) => void;
}) {
  const [listas, setListas] = useState<LeadListComStats[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [criandoId, setCriandoId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setListas(await listarListas());
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Falha ao carregar listas");
      }
    })();
  }, []);

  const filtradas = useMemo(() => {
    const termo = q.trim().toLowerCase();
    return (listas ?? []).filter((l) => l.name.toLowerCase().includes(termo));
  }, [listas, q]);

  const criar = async (l: LeadListComStats) => {
    setCriandoId(l.id);
    try {
      const r = await criarCampanhaDaLista(l.id, l.name);
      toast.success(
        `Campanha criada com ${r.total} leads pendentes (custo zero). Selecione quem preparar.`,
      );
      onCriada(r.campanha_id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao criar a campanha");
      setCriandoId(null);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-primary" /> Escolha a lista da campanha
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Todos os leads da lista entram como <b>pendentes</b> — criar não gera nada e não custa
            nada. Depois você seleciona quem preparar (gerar site + proposta) para revisar.
          </p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar lista..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          {erro ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {erro}
            </div>
          ) : listas === null ? (
            <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando listas...
            </div>
          ) : filtradas.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Nenhuma lista encontrada. Faça uma busca na aba Buscar — ela vira uma lista.
            </div>
          ) : (
            <div className="max-h-[340px] space-y-1.5 overflow-y-auto pr-1">
              {filtradas.map((l) => (
                <div
                  key={l.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">{l.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {l.leads_atuais} leads · {l.niche}
                      {l.city ? ` · ${l.city}` : ""}
                      {l.uf ? `/${l.uf}` : ""}
                    </div>
                  </div>
                  <Button size="sm" onClick={() => criar(l)} disabled={criandoId !== null}>
                    {criandoId === l.id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Criando...
                      </>
                    ) : (
                      "Criar"
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------- Revisão em lote (ETAPA 1: preparar sob demanda) -------------------- */
type Progresso = {
  feito: number;
  total: number;
  reusados: number;
  gerados: number;
  erros: number;
  /** Barrados pelo portão: sem motivo classificável → sem proposta e sem gastar IA. */
  semMotivo: number;
};

function RevisaoEmLote({ campanha, onVoltar }: { campanha: Campanha; onVoltar: () => void }) {
  const [view, setView] = useState<CampanhaLeadView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [preparando, setPreparando] = useState(false);
  const [progresso, setProgresso] = useState<Progresso | null>(null);
  const [rampa, setRampa] = useState<RampaStatus | null>(null);
  const [previewRedesign, setPreviewRedesign] = useState<Redesign | null>(null);
  const [editando, setEditando] = useState<CampanhaLeadView | null>(null);
  const [descartando, setDescartando] = useState<CampanhaLeadView | null>(null);
  const [acaoId, setAcaoId] = useState<string | null>(null);
  const [aprovandoLote, setAprovandoLote] = useState(false);
  const [enviandoLote, setEnviandoLote] = useState(false);
  const [concluida, setConcluida] = useState(campanha.status === "concluida");
  const [concluindo, setConcluindo] = useState(false);

  const carregar = async () => {
    setLoading(true);
    setError(null);
    try {
      const [v, r] = await Promise.all([listarCampanhaLeadsView(campanha.id), statusRampa()]);
      setView(v);
      setRampa(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar a campanha");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campanha.id]);

  const totais = useMemo(() => {
    const t = { total: view.length, pendente: 0, rascunho: 0, aprovado: 0, enviado: 0, erro: 0 };
    for (const v of view) {
      if (v.estado === "pendente" || v.estado === "gerando") t.pendente += 1;
      else if (v.estado === "rascunho") t.rascunho += 1;
      else if (v.estado === "aprovado") {
        if (v.proposta?.status === "enviada") t.enviado += 1;
        else t.aprovado += 1;
      } else if (v.estado === "erro") t.erro += 1;
    }
    return t;
  }, [view]);

  // Selecionáveis para preparar: pendentes, os que deram erro (retry) e os 'gerando'
  // presos de uma sessão que caiu (as checkboxes ficam desabilitadas durante o preparo).
  const selecionaveis = useMemo(
    () =>
      view.filter((v) => v.estado === "pendente" || v.estado === "erro" || v.estado === "gerando"),
    [view],
  );
  const toggleSel = (id: string) =>
    setSel((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const selTodosPendentes = () => {
    if (sel.size === selecionaveis.length) setSel(new Set());
    else setSel(new Set(selecionaveis.map((v) => v.id)));
  };

  const patchRow = (id: string, patch: Partial<CampanhaLeadView>) =>
    setView((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  // GERAÇÃO SOB DEMANDA. Reusa redesign pronto; gera se faltar. Progresso ao vivo por
  // lead (não há stream NDJSON de redesign — o invoke é bloqueante 10–40s por lead).
  const prepararLeads = async (alvos: CampanhaLeadView[]) => {
    if (!alvos.length || preparando) return;
    setPreparando(true);
    const acc: Progresso = {
      feito: 0,
      total: alvos.length,
      reusados: 0,
      gerados: 0,
      erros: 0,
      semMotivo: 0,
    };
    setProgresso({ ...acc });
    for (const v of alvos) {
      patchRow(v.id, { estado: "gerando", erro: null });
      try {
        await atualizarCampanhaLead(v.id, { estado: "gerando", erro: null });

        // PORTÃO "SEM MOTIVO CLARO" — vem ANTES do redesign de propósito: o redesign custa IA,
        // e não faz sentido queimar IA num lead que não vai receber e-mail nenhum.
        if (!(await leadTemMotivoClaro(v.lead_id))) {
          await atualizarCampanhaLead(v.id, { estado: "sem_motivo", erro: null });
          patchRow(v.id, { estado: "sem_motivo", erro: null });
          acc.feito += 1;
          acc.semMotivo += 1;
          setProgresso({ ...acc });
          continue;
        }

        let redesignId: string | null = null;
        let reused = false;
        if (v.tem_redesign_pronto) {
          redesignId = await redesignProntoDoLead(v.lead_id);
          reused = !!redesignId;
        }
        if (!redesignId) {
          const r = await gerarRedesign(v.lead_id);
          redesignId = r.redesign.id;
        }
        const prop = await gerarPropostaRascunhoSemSite(v.lead_id, campanha.id);
        await atualizarCampanhaLead(v.id, {
          estado: "rascunho",
          redesign_id: redesignId,
          proposta_id: prop.id,
          erro: null,
        });
        patchRow(v.id, {
          estado: "rascunho",
          redesign_id: redesignId,
          proposta_id: prop.id,
          proposta: prop,
          tem_redesign_pronto: true,
        });
        acc.feito += 1;
        if (reused) acc.reusados += 1;
        else acc.gerados += 1;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Falha ao preparar";
        await atualizarCampanhaLead(v.id, { estado: "erro", erro: msg }).catch(() => {});
        patchRow(v.id, { estado: "erro", erro: msg });
        acc.feito += 1;
        acc.erros += 1;
      }
      setProgresso({ ...acc });
    }
    setPreparando(false);
    setSel(new Set());
    toast.success(
      `Preparados ${acc.gerados + acc.reusados}/${acc.total} (${acc.reusados} reusados` +
        (acc.semMotivo ? `, ${acc.semMotivo} sem motivo claro` : "") +
        (acc.erros ? `, ${acc.erros} erro` : "") +
        ").",
    );
    await carregar();
  };

  const prepararSelecionados = () => prepararLeads(selecionaveis.filter((v) => sel.has(v.id)));

  // Ver o site: abre o EditorRedesign (preview + editar HTML) — do HTML no banco, SEM publicar.
  const verSite = async (v: CampanhaLeadView) => {
    if (!v.redesign_id) return;
    setAcaoId(v.id);
    try {
      setPreviewRedesign(await obterRedesign(v.redesign_id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao abrir o site");
    } finally {
      setAcaoId(null);
    }
  };

  // Regenerar o site (custa IA): novo redesign + revincula ao lead da campanha.
  const regenerarSite = async (v: CampanhaLeadView) => {
    if (!confirm(`Regenerar o site de "${v.lead_nome}"? Gera um novo redesign (custa IA).`)) return;
    setAcaoId(v.id);
    try {
      const r = await gerarRedesign(v.lead_id);
      await atualizarCampanhaLead(v.id, { redesign_id: r.redesign.id });
      patchRow(v.id, { redesign_id: r.redesign.id });
      toast.success(`Site de "${v.lead_nome}" regenerado.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao regenerar");
    } finally {
      setAcaoId(null);
    }
  };

  const confirmarDescartar = async (motivo: string) => {
    const v = descartando;
    if (!v) return;
    try {
      await descartarCampanhaLead(v.id, motivo);
      patchRow(v.id, {
        estado: "descartado",
        proposta: null,
        proposta_id: null,
        motivo_descarte: motivo,
      });
      toast.success(`"${v.lead_nome}" descartado.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao descartar");
    } finally {
      setDescartando(null);
    }
  };

  const handleEnviar = async (p: Proposta): Promise<boolean> => {
    setAcaoId(p.id);
    try {
      const r = await enviarProposta(p.id);
      if (!r.ok) {
        const msg: Record<string, string> = {
          nao_aprovada: `"${p.lead_nome}" ainda não foi aprovada.`,
          opt_out: `"${p.lead_nome}" pediu descadastro (LGPD).`,
          teto_dia: "Teto do dia atingido — o resto sai amanhã.",
          sem_email: `"${p.lead_nome}" não tem e-mail.`,
        };
        toast.warning(msg[r.reason] ?? "Não foi possível enviar.");
        if (r.reason === "teto_dia") setRampa(await statusRampa());
        return false;
      }
      setView((prev) =>
        prev.map((x) => (x.proposta_id === r.proposta.id ? { ...x, proposta: r.proposta } : x)),
      );
      toast.success(`E-mail enviado para "${p.lead_nome}".`);
      setRampa(await statusRampa());
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao enviar");
      return false;
    } finally {
      setAcaoId(null);
    }
  };

  // Override do "Aprovar" no diálogo: publica o site + injeta o link (publish-on-approve).
  const aprovarComPublish =
    (campanhaLeadId: string) =>
    async (p: Proposta): Promise<Proposta> => {
      const atualizada = await aprovarCampanhaLead(campanhaLeadId, p);
      patchRow(campanhaLeadId, { estado: "aprovado", proposta: atualizada });
      return atualizada;
    };

  const aprovarLote = async () => {
    const n = view.filter((v) => v.estado === "rascunho").length;
    if (n === 0 || aprovandoLote) return;
    if (
      !confirm(`Aprovar e PUBLICAR os ${n} rascunhos? Cada um gera a URL pública e injeta o link.`)
    )
      return;
    setAprovandoLote(true);
    try {
      const r = await aprovarTodosDaCampanha(campanha.id);
      toast.success(`${r.aprovados} aprovados` + (r.erros ? `, ${r.erros} com erro` : "") + ".");
      await carregar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao aprovar em lote");
    } finally {
      setAprovandoLote(false);
    }
  };

  const enviarLote = async () => {
    const n = view.filter(
      (v) => v.estado === "aprovado" && v.proposta?.status === "aprovada",
    ).length;
    if (n === 0 || enviandoLote) return;
    if (!confirm(`Enviar as ${n} propostas aprovadas agora?`)) return;
    setEnviandoLote(true);
    try {
      const r = await enviarAprovadasDaCampanha(campanha.id);
      const partes = [
        `${r.enviadas} enviada(s)`,
        r.teto_dia ? `${r.teto_dia} barradas pelo teto (amanhã)` : "",
        r.sem_email ? `${r.sem_email} sem e-mail` : "",
        r.opt_out ? `${r.opt_out} opt-out` : "",
        r.erro ? `${r.erro} erro` : "",
      ].filter(Boolean);
      if (r.enviadas > 0) toast.success(partes.join(" · "));
      else toast.warning(partes.join(" · ") || "Nada enviado.");
      await carregar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao enviar em lote");
    } finally {
      setEnviandoLote(false);
    }
  };

  // Concluir/reabrir a campanha. Concluir NÃO apaga nada: os pendentes ficam intactos,
  // a UI só trava as ações (gerar/aprovar/enviar/descartar). Reabrir destrava.
  const alternarConclusao = async () => {
    const pend = view.filter((v) => v.estado === "pendente").length;
    if (
      !concluida &&
      pend > 0 &&
      !confirm(
        `Concluir a campanha? ${pend} lead(s) pendente(s) ficam intactos (sem gerar/apagar) — dá para reabrir depois.`,
      )
    )
      return;
    setConcluindo(true);
    try {
      if (concluida) {
        await reabrirCampanha(campanha.id);
        setConcluida(false);
        toast.success("Campanha reaberta.");
      } else {
        await concluirCampanha(campanha.id);
        setConcluida(true);
        toast.success("Campanha concluída.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao alterar a campanha");
    } finally {
      setConcluindo(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onVoltar}>
            <ArrowLeft className="h-4 w-4" /> Campanhas
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{campanha.nome}</h1>
            <p className="text-sm text-muted-foreground">
              {totais.total} leads · {totais.pendente} pendentes · {totais.rascunho} rascunho ·{" "}
              {totais.aprovado} aprovados · {totais.enviado} enviados
              {totais.erro > 0 ? ` · ${totais.erro} erro` : ""}
            </p>
            {rampa && (
              <p className="mt-1.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                  Aquecimento{rampa.ativa ? ` · dia ${rampa.dia}` : " (não iniciado)"} · teto{" "}
                  {rampa.teto}/dia · {rampa.enviados_hoje} enviados hoje · {rampa.restante} restante
                </span>
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!concluida && (
            <>
              <Button
                size="sm"
                onClick={prepararSelecionados}
                disabled={preparando || sel.size === 0}
                className="bg-primary font-semibold hover:bg-primary/90"
              >
                {preparando ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Gerar site + proposta ({sel.size})
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={aprovarLote}
                disabled={aprovandoLote || totais.rascunho === 0}
              >
                {aprovandoLote ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                Aprovar todos ({totais.rascunho})
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={enviarLote}
                disabled={enviandoLote || totais.aprovado === 0}
              >
                {enviandoLote ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Enviar aprovados ({totais.aprovado})
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant={concluida ? "default" : "outline"}
            onClick={alternarConclusao}
            disabled={concluindo}
          >
            {concluindo ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : concluida ? (
              <Undo2 className="h-4 w-4" />
            ) : (
              <CheckCheck className="h-4 w-4" />
            )}
            {concluida ? "Reabrir campanha" : "Concluir campanha"}
          </Button>
        </div>
      </div>

      {concluida && (
        <div className="flex items-center gap-2 rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-900">
          <Lock className="h-4 w-4 shrink-0" />
          <span>
            <b>Campanha concluída.</b> As ações estão travadas e os leads pendentes ficaram
            intactos. Clique em <b>Reabrir campanha</b> para voltar a preparar/aprovar/enviar.
          </span>
        </div>
      )}

      {preparando && progresso && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
          <div className="flex items-center gap-2 font-medium">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Preparando {progresso.feito}/{progresso.total}…
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {progresso.gerados} gerados · {progresso.reusados} reusados (redesign pronto) ·{" "}
            {progresso.erros} erro. Cada geração nova custa IA (~US$ 0,01–0,05); reuso é grátis.
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando leads...
        </div>
      ) : error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : view.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-16 text-center text-sm text-muted-foreground">
          Esta campanha não tem leads.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
          <div className="overflow-x-auto">
            <table className="w-full text-[15px]">
              <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">
                    <Checkbox
                      checked={selecionaveis.length > 0 && sel.size === selecionaveis.length}
                      onCheckedChange={selTodosPendentes}
                      aria-label="Selecionar todos os pendentes"
                      disabled={preparando || selecionaveis.length === 0 || concluida}
                    />
                  </th>
                  {["Lead", "Matéria-prima", "Estado", "Ações"].map((h) => (
                    <th key={h} className="px-4 py-3 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {view.map((v) => {
                  const selecionavel = v.estado === "pendente" || v.estado === "erro";
                  return (
                    <tr key={v.id} className="border-t border-border hover:bg-secondary/30">
                      <td className="px-4 py-3">
                        {selecionavel && (
                          <Checkbox
                            checked={sel.has(v.id)}
                            onCheckedChange={() => toggleSel(v.id)}
                            aria-label={`Selecionar ${v.lead_nome}`}
                            disabled={preparando || concluida}
                          />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground">{v.lead_nome}</div>
                        {v.estado === "erro" && v.erro && (
                          <div className="text-xs text-destructive">{v.erro}</div>
                        )}
                        {v.estado === "descartado" && v.motivo_descarte && (
                          <div className="text-xs text-muted-foreground">
                            descartado: {v.motivo_descarte}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {v.estado === "aprovado" ? (
                          v.url_publica ? (
                            <a
                              href={v.url_publica}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-medium text-green-700 hover:underline"
                            >
                              <Globe className="h-3.5 w-3.5" /> Abrir site publicado
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                              <Globe className="h-3.5 w-3.5" /> site publicado
                            </span>
                          )
                        ) : v.estado === "rascunho" || v.estado === "gerando" ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700">
                            <CheckCircle2 className="h-3.5 w-3.5" /> site gerado
                          </span>
                        ) : v.estado === "descartado" ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : v.tem_redesign_pronto ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                            <CheckCircle2 className="h-3.5 w-3.5" /> prévia pronta · reusa
                          </span>
                        ) : v.tem_website ? (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Globe className="h-3.5 w-3.5" /> tem site · vai gerar
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Circle className="h-3.5 w-3.5" /> sem site · gera do zero
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <EstadoPill estado={v.estado} enviada={v.proposta?.status === "enviada"} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {selecionavel && (
                            <Button
                              size="sm"
                              variant="ghost"
                              title="Preparar este (gerar site + proposta)"
                              onClick={() => prepararLeads([v])}
                              disabled={preparando || concluida}
                            >
                              <Wand2 className="h-4 w-4" />
                            </Button>
                          )}
                          {(v.estado === "rascunho" || v.estado === "aprovado") && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                title="Ver o site (preview, sem publicar)"
                                onClick={() => verSite(v)}
                                disabled={!v.redesign_id || acaoId === v.id}
                              >
                                {acaoId === v.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                title="Revisar / editar proposta"
                                onClick={() => setEditando(v)}
                                disabled={!v.proposta}
                              >
                                <Mail className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                title="Regenerar o site (custa IA)"
                                onClick={() => regenerarSite(v)}
                                disabled={acaoId === v.id || concluida}
                              >
                                <Wand2 className="h-4 w-4" />
                              </Button>
                              {v.estado === "aprovado" && v.proposta?.status === "aprovada" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  title="Enviar por e-mail"
                                  onClick={() => v.proposta && handleEnviar(v.proposta)}
                                  disabled={acaoId === v.proposta?.id || concluida}
                                >
                                  {acaoId === v.proposta?.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Send className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                title="Descartar"
                                onClick={() => setDescartando(v)}
                                disabled={concluida}
                              >
                                <XCircle className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Preview do site (iframe do HTML no banco — SEM publicar) + editor de HTML inline */}
      {previewRedesign && (
        <EditorRedesign
          redesign={previewRedesign}
          onClose={() => setPreviewRedesign(null)}
          onSaved={(html) => setPreviewRedesign((p) => (p ? { ...p, html_editado: html } : p))}
        />
      )}

      {/* Revisar / editar a proposta. Aprovar aqui PUBLICA o site e injeta o link (Etapa 3). */}
      {editando && editando.proposta && (
        <RevisarPropostaDialog
          proposta={editando.proposta}
          onClose={() => setEditando(null)}
          onChange={(atualizada) => patchRow(editando.id, { proposta: atualizada })}
          onEnviar={handleEnviar}
          onAprovar={aprovarComPublish(editando.id)}
        />
      )}

      {descartando && (
        <DescartarDialog
          nome={descartando.lead_nome}
          onClose={() => setDescartando(null)}
          onConfirmar={confirmarDescartar}
        />
      )}
    </div>
  );
}

/* -------------------- Descartar um lead da campanha (com motivo) -------------------- */
function DescartarDialog({
  nome,
  onClose,
  onConfirmar,
}: {
  nome: string;
  onClose: () => void;
  onConfirmar: (motivo: string) => Promise<void>;
}) {
  const [motivo, setMotivo] = useState("");
  const [salvando, setSalvando] = useState(false);
  const confirmar = async () => {
    setSalvando(true);
    await onConfirmar(motivo.trim());
    setSalvando(false);
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-destructive" /> Descartar "{nome}"
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            O lead sai da campanha. A proposta rascunho é removida; o site gerado (redesign) fica
            guardado para reuso.
          </p>
          <Label htmlFor="motivo-descarte">Motivo (opcional)</Label>
          <Textarea
            id="motivo-descarte"
            rows={3}
            placeholder="ex.: fora do perfil, já é cliente, pediu para não contatar…"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={salvando}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={confirmar} disabled={salvando}>
            {salvando ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            Descartar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
