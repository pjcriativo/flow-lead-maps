// Campanha de WhatsApp — VIVE na aba interna "Campanhas" da tela WhatsApp (sem item novo na
// sidebar). REUSA o motor: campanhas/campanha_leads/propostas, preparar-sob-demanda e
// publish-on-approve (o link {{link}} = a prévia publicada). O que é próprio do canal: a lista de
// leads com tabs do pipeline + filtros, o painel de mensagem com variações que revezam, e o envio
// em lote com intervalo (jitter). Nada sai sem aprovar (portão intacto).
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Loader2,
  RefreshCw,
  Plus,
  Send,
  Trash2,
  Eye,
  ChevronLeft,
  MessageSquare,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatData } from "@/lib/format";
import type { Campanha } from "@/types";
import {
  listarCampanhas,
  criarCampanhaWaDaLista,
  listarCampanhaLeadsWaView,
  prepararCampanhaLead,
  aprovarCampanhaLead,
  obterWaConfig,
  salvarWaConfig,
  concluirCampanha,
  reabrirCampanha,
  type WaCampanhaLead,
} from "@/services/campanhas";
import {
  listarChips,
  enviarCampanhaLeadWa,
  WA_MOTIVO_LABEL,
  historicoCampanhaWa,
  enviadosPorCampanhaWa,
  type WaHistorico,
} from "@/services/whatsapp";
import {
  resolverVariaveis,
  escolherVariacao,
  variacoesElegiveis,
  WA_TOKENS,
  WA_INTERVALO_MIN_ABS,
  WA_INTERVALO_MAX_ABS,
  type WaVariacao,
  type WaCampanhaConfig,
} from "@/lib/wa-copy";
import { listarListas, type LeadListComStats } from "@/lib/lists-api";

/** Tabs mapeadas ao NOSSO pipeline (não rótulo vazio). */
type TabKey = "todos" | "qualificados" | "em_contato" | "ativos";
const TABS: { key: TabKey; label: string; dica: string }[] = [
  { key: "todos", label: "Todos", dica: "todos com WhatsApp" },
  { key: "qualificados", label: "Qualificados", dica: "score alto e ainda não contatado" },
  { key: "em_contato", label: "Em contato", dica: "contatado / proposta enviada" },
  { key: "ativos", label: "Ativos", dica: "respondeu / reunião" },
];
const SCORE_QUALIFICADO = 70; // "score alto" — limiar reportado; ajustável

function passaTab(l: WaCampanhaLead, tab: TabKey): boolean {
  if (!l.whatsapp) return false; // sem WhatsApp nunca entra numa campanha de WhatsApp
  switch (tab) {
    case "qualificados":
      return (l.score ?? 0) >= SCORE_QUALIFICADO && ["new", "enriched"].includes(l.lead_status);
    case "em_contato":
      return ["contacted", "proposta_enviada"].includes(l.lead_status);
    case "ativos":
      return ["responded", "meeting"].includes(l.lead_status);
    default:
      return true;
  }
}

const PRONTOS_PARA_ENVIO = (l: WaCampanhaLead) =>
  l.estado === "aprovado" && !!l.whatsapp && !l.enviado;

export function WaCampanhas() {
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [enviadosMap, setEnviadosMap] = useState<Record<string, number>>({});
  const [carregando, setCarregando] = useState(true);
  const [abertaId, setAbertaId] = useState<string | null>(null);
  const [dialogNova, setDialogNova] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const cs = await listarCampanhas("whatsapp");
      setCampanhas(cs);
      setEnviadosMap(await enviadosPorCampanhaWa(cs.map((c) => c.id)).catch(() => ({})));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao listar campanhas");
    } finally {
      setCarregando(false);
    }
  }, []);
  useEffect(() => {
    carregar();
  }, [carregar]);

  if (abertaId) {
    return (
      <WaCampanhaTrabalho
        campanha={campanhas.find((c) => c.id === abertaId)!}
        onVoltar={() => {
          setAbertaId(null);
          carregar();
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium">Campanhas de WhatsApp</div>
          <p className="text-sm text-muted-foreground">
            Mesmo motor da campanha de e-mail (preparar → aprovar publica o link → enviar), só que
            pelo WhatsApp, com variações que revezam.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={carregar}>
            <RefreshCw className="h-4 w-4" /> Atualizar
          </Button>
          <Button size="sm" onClick={() => setDialogNova(true)}>
            <Plus className="h-4 w-4" /> Nova campanha
          </Button>
        </div>
      </div>

      {carregando ? (
        <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
        </div>
      ) : campanhas.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nenhuma campanha de WhatsApp ainda. Crie uma a partir de uma lista de leads.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {campanhas.map((c) => (
            <button
              key={c.id}
              onClick={() => setAbertaId(c.id)}
              className="rounded-lg border p-4 text-left transition hover:border-primary/50 hover:bg-accent/40"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="truncate font-medium">{c.nome}</div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-xs",
                    c.status === "ativa"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-gray-100 text-gray-600",
                  )}
                >
                  {c.status === "ativa" ? "Ativa" : "Concluída"}
                </span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{formatData(c.criada_em)}</div>
              <div className="mt-3 flex flex-wrap gap-1 text-xs">
                <Chip>{c.total} leads</Chip>
                {c.pendente > 0 && <Chip>{c.pendente} pendentes</Chip>}
                {c.aprovado > 0 && <Chip tone="emerald">{c.aprovado} prontos</Chip>}
                {(enviadosMap[c.id] ?? 0) > 0 && (
                  <Chip tone="violet">{enviadosMap[c.id]} enviados</Chip>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      <NovaCampanhaWaDialog
        open={dialogNova}
        onClose={() => setDialogNova(false)}
        onCriada={(id) => {
          setDialogNova(false);
          carregar().then(() => setAbertaId(id));
        }}
      />
    </div>
  );
}

function Chip({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone?: "emerald" | "violet" | "rose";
}) {
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5",
        tone === "emerald"
          ? "border-emerald-500/30 bg-emerald-50 text-emerald-800"
          : tone === "violet"
            ? "border-violet-500/30 bg-violet-50 text-violet-800"
            : tone === "rose"
              ? "border-rose-500/30 bg-rose-50 text-rose-800"
              : "border-border bg-muted/40 text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}

function NovaCampanhaWaDialog({
  open,
  onClose,
  onCriada,
}: {
  open: boolean;
  onClose: () => void;
  onCriada: (id: string) => void;
}) {
  const [listas, setListas] = useState<LeadListComStats[]>([]);
  const [listId, setListId] = useState("");
  const [nome, setNome] = useState("");
  const [criando, setCriando] = useState(false);

  useEffect(() => {
    if (!open) return;
    listarListas()
      .then(setListas)
      .catch(() => {});
    setListId("");
    setNome("");
  }, [open]);

  const criar = async () => {
    if (!listId) {
      toast.error("Escolha uma lista.");
      return;
    }
    setCriando(true);
    try {
      const { campanha_id, total } = await criarCampanhaWaDaLista(listId, nome);
      toast.success(`Campanha criada com ${total} leads.`);
      onCriada(campanha_id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao criar");
    } finally {
      setCriando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova campanha de WhatsApp</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Lista de leads</label>
            <Select value={listId} onValueChange={setListId}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha uma lista…" />
              </SelectTrigger>
              <SelectContent>
                {listas.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name} ({l.leads_atuais})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Nome da campanha</label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Restaurantes Curitiba — julho"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Custo zero: criar só adiciona os leads como pendentes. Você seleciona quem preparar
            depois.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={criar} disabled={criando}>
            {criando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Criar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================ TELA DE TRABALHO ============================

function WaCampanhaTrabalho({ campanha, onVoltar }: { campanha: Campanha; onVoltar: () => void }) {
  const [leads, setLeads] = useState<WaCampanhaLead[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [tab, setTab] = useState<TabKey>("todos");
  const [fCategoria, setFCategoria] = useState("__todas");
  const [fCidade, setFCidade] = useState("__todas");
  const [limite, setLimite] = useState(0); // 0 = sem limite
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [cfg, setCfg] = useState<WaCampanhaConfig | null>(null);
  const [temChipDisparo, setTemChipDisparo] = useState<boolean | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [progresso, setProgresso] = useState<{ feito: number; total: number } | null>(null);
  const [hist, setHist] = useState<WaHistorico | null>(null);
  const cancelar = useRef(false);
  const concluida = campanha.status !== "ativa";

  const carregar = useCallback(async () => {
    try {
      const [ls, config, chips, h] = await Promise.all([
        listarCampanhaLeadsWaView(campanha.id),
        obterWaConfig(campanha.id),
        listarChips(),
        historicoCampanhaWa(campanha.id).catch(() => null),
      ]);
      setLeads(ls);
      setCfg(config);
      setHist(h);
      setTemChipDisparo(chips.some((c) => c.funcao === "disparo" && c.status === "conectado"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao carregar");
    } finally {
      setCarregando(false);
    }
  }, [campanha.id]);
  useEffect(() => {
    carregar();
  }, [carregar]);

  const categorias = useMemo(
    () => [...new Set(leads.map((l) => l.category).filter((c): c is string => !!c))].sort(),
    [leads],
  );
  const cidades = useMemo(
    () => [...new Set(leads.map((l) => l.city).filter((c): c is string => !!c))].sort(),
    [leads],
  );

  const filtrados = useMemo(() => {
    let r = leads.filter((l) => passaTab(l, tab));
    if (fCategoria !== "__todas") r = r.filter((l) => l.category === fCategoria);
    if (fCidade !== "__todas") r = r.filter((l) => l.city === fCidade);
    if (limite > 0) r = r.slice(0, limite);
    return r;
  }, [leads, tab, fCategoria, fCidade, limite]);

  const aEnviar = filtrados.filter(PRONTOS_PARA_ENVIO);
  const jaEnviados = leads.filter((l) => l.enviado).length;
  const semWhats = leads.filter((l) => !l.whatsapp).length; // omitidos (avisa, não some calado)
  const selArr = filtrados.filter((l) => sel.has(l.id));

  const toggle = (id: string) =>
    setSel((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const toggleTodos = () =>
    setSel((s) =>
      filtrados.every((l) => s.has(l.id)) ? new Set() : new Set(filtrados.map((l) => l.id)),
    );

  // ---- Preparar (selecionados pendentes/erro) — reusa a regra do serviço ----
  const preparar = async () => {
    const alvos = selArr.filter((l) => ["pendente", "erro", "gerando"].includes(l.estado));
    if (!alvos.length) {
      toast.error("Selecione leads pendentes para preparar.");
      return;
    }
    setOcupado("preparar");
    setProgresso({ feito: 0, total: alvos.length });
    let ok = 0;
    for (let i = 0; i < alvos.length; i++) {
      try {
        const r = await prepararCampanhaLead(alvos[i], campanha.id);
        if (r.estado === "rascunho") ok++;
      } catch {
        /* erro já persiste no estado do lead */
      }
      setProgresso({ feito: i + 1, total: alvos.length });
    }
    setOcupado(null);
    setProgresso(null);
    setSel(new Set());
    toast.success(`Preparados ${ok}/${alvos.length}.`);
    carregar();
  };

  // ---- Aprovar (selecionados rascunho) — publish-on-approve (gera o link) ----
  const aprovar = async () => {
    const alvos = selArr.filter((l) => l.estado === "rascunho" && l.proposta);
    if (!alvos.length) {
      toast.error("Selecione leads em rascunho para aprovar (isso publica o link).");
      return;
    }
    setOcupado("aprovar");
    setProgresso({ feito: 0, total: alvos.length });
    let ok = 0;
    for (let i = 0; i < alvos.length; i++) {
      try {
        await aprovarCampanhaLead(alvos[i].id, alvos[i].proposta!);
        ok++;
      } catch (e) {
        toast.error(
          `Falha ao aprovar ${alvos[i].lead_nome}: ${e instanceof Error ? e.message : ""}`,
        );
      }
      setProgresso({ feito: i + 1, total: alvos.length });
    }
    setOcupado(null);
    setProgresso(null);
    setSel(new Set());
    toast.success(`Aprovados/publicados ${ok}/${alvos.length}.`);
    carregar();
  };

  // ---- Enviar (lote com intervalo/jitter) — o cliente orquestra p/ dar vazão e progresso ----
  const intervaloMs = () => {
    const min = cfg?.intervalo_min ?? 35;
    const max = cfg?.intervalo_max ?? 60;
    return (min + Math.random() * Math.max(0, max - min)) * 1000;
  };
  const enviar = async () => {
    if (!temChipDisparo) return;
    const alvos = (selArr.length ? selArr : aEnviar).filter(PRONTOS_PARA_ENVIO);
    if (!alvos.length) {
      toast.error("Nada pronto para enviar (aprove leads com WhatsApp primeiro).");
      return;
    }
    setOcupado("enviar");
    cancelar.current = false;
    setProgresso({ feito: 0, total: alvos.length });
    let ok = 0;
    const motivos: Record<string, number> = {};
    for (let i = 0; i < alvos.length; i++) {
      if (cancelar.current) break;
      try {
        const r = await enviarCampanhaLeadWa(alvos[i].id);
        if (r.ok) ok++;
        else motivos[r.reason ?? "erro"] = (motivos[r.reason ?? "erro"] ?? 0) + 1;
        if (r.reason === "sem_chip") {
          toast.error("Sem chip de disparo conectado — envio pausado.");
          break;
        }
      } catch (e) {
        toast.error(`Falha: ${e instanceof Error ? e.message : ""}`);
      }
      setProgresso({ feito: i + 1, total: alvos.length });
      if (i < alvos.length - 1 && !cancelar.current) await sleep(intervaloMs());
    }
    setOcupado(null);
    setProgresso(null);
    setSel(new Set());
    const resumo = Object.entries(motivos)
      .map(([k, n]) => `${n} ${WA_MOTIVO_LABEL[k] ?? k}`)
      .join(" · ");
    toast.success(`Enviados ${ok}/${alvos.length}.` + (resumo ? ` Fora: ${resumo}.` : ""));
    carregar();
  };

  const salvarConfig = async (novo: WaCampanhaConfig) => {
    setCfg(novo);
    try {
      await salvarWaConfig(campanha.id, novo);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao salvar variações");
    }
  };

  const tempoEstimado = () => {
    const n = (selArr.length ? selArr : aEnviar).filter(PRONTOS_PARA_ENVIO).length;
    if (n <= 1) return n === 1 ? "~poucos segundos" : "—";
    const medio = ((cfg?.intervalo_min ?? 35) + (cfg?.intervalo_max ?? 60)) / 2;
    const seg = (n - 1) * medio;
    const min = Math.round(seg / 60);
    return min < 1 ? `~${Math.round(seg)}s` : `~${min} min`;
  };

  const leadPreview = selArr[0] ?? aEnviar[0] ?? filtrados[0] ?? null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onVoltar}>
            <ChevronLeft className="h-4 w-4" /> Campanhas
          </Button>
          <div>
            <div className="font-medium">{campanha.nome}</div>
            <div className="text-xs text-muted-foreground">
              {formatData(campanha.criada_em)} · {leads.length} leads
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={carregar}>
            <RefreshCw className="h-4 w-4" /> Atualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                if (concluida) await reabrirCampanha(campanha.id);
                else await concluirCampanha(campanha.id);
                onVoltar();
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Falha");
              }
            }}
          >
            {concluida ? "Reabrir" : "Concluir campanha"}
          </Button>
        </div>
      </div>

      {concluida && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-50 p-2 text-sm text-amber-900">
          Campanha concluída — as ações estão travadas. Reabra para continuar.
        </div>
      )}

      {temChipDisparo === false && (
        <div className="flex items-start gap-2 rounded-lg border border-rose-500/40 bg-rose-50 p-3 text-sm text-rose-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Nenhum <b>chip de disparo</b> conectado — o envio está bloqueado. Conecte um chip na aba{" "}
            <b>Conexão</b>. (O flowleads é de <b>conversa</b> e nunca dispara a frio.)
          </span>
        </div>
      )}

      {/* HISTÓRICO (ETAPA 4.3) — data, enviados, qual chip usou, quantos responderam */}
      {hist && hist.enviados > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/20 p-3 text-sm">
          <span className="font-medium">Realizado:</span>
          <Chip tone="violet">{hist.enviados} enviados</Chip>
          <Chip tone="emerald">{hist.responderam} responderam</Chip>
          {hist.chips.map((c) => (
            <Chip key={c.instancia_id}>
              chip {c.numero}: {c.enviados}
            </Chip>
          ))}
          {hist.ultimo && (
            <span className="text-xs text-muted-foreground">
              {hist.primeiro && hist.primeiro !== hist.ultimo
                ? `de ${formatData(hist.primeiro)} a ${formatData(hist.ultimo)}`
                : `em ${formatData(hist.ultimo)}`}
            </span>
          )}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        {/* ---------------- ESQUERDA: leads ---------------- */}
        <div className="space-y-3 rounded-lg border p-3">
          {/* tabs */}
          <div className="flex flex-wrap gap-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => {
                  setTab(t.key);
                  setSel(new Set());
                }}
                title={t.dica}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm",
                  tab === t.key ? "bg-primary text-primary-foreground" : "hover:bg-accent",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* filtros */}
          <div className="flex flex-wrap items-center gap-2">
            <Select value={fCategoria} onValueChange={setFCategoria}>
              <SelectTrigger className="h-8 w-auto min-w-[9rem] text-xs">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__todas">Toda categoria</SelectItem>
                {categorias.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={fCidade} onValueChange={setFCidade}>
              <SelectTrigger className="h-8 w-auto min-w-[8rem] text-xs">
                <SelectValue placeholder="Cidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__todas">Toda cidade</SelectItem>
                {cidades.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">Limite</span>
              <Input
                type="number"
                min={0}
                value={limite}
                onChange={(e) => setLimite(Math.max(0, parseInt(e.target.value) || 0))}
                className="h-8 w-16 text-xs"
                title="0 = sem limite"
              />
            </div>
          </div>

          {/* contadores */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Chip tone="emerald">A enviar: {aEnviar.length}</Chip>
            <Chip tone="violet">Já enviados: {jaEnviados}</Chip>
            {semWhats > 0 && <Chip tone="rose">{semWhats} sem WhatsApp (fora)</Chip>}
            <button className="ml-auto text-primary hover:underline" onClick={toggleTodos}>
              {filtrados.every((l) => sel.has(l.id)) && filtrados.length
                ? "Limpar seleção"
                : "Selecionar todos"}
            </button>
          </div>

          {/* lista */}
          {carregando ? (
            <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
            </div>
          ) : filtrados.length === 0 ? (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              Nenhum lead neste filtro.
            </div>
          ) : (
            <div className="max-h-[460px] space-y-1 overflow-y-auto pr-1">
              {filtrados.map((l) => (
                <label
                  key={l.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md border px-2 py-1.5 text-sm hover:bg-accent/40"
                >
                  <Checkbox checked={sel.has(l.id)} onCheckedChange={() => toggle(l.id)} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{l.lead_nome}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {[l.category, l.city].filter(Boolean).join(" · ") || "—"}
                    </div>
                  </div>
                  <EstadoLeadBadge l={l} />
                </label>
              ))}
            </div>
          )}

          {/* ações */}
          <div className="flex flex-wrap gap-2 border-t pt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={preparar}
              disabled={!!ocupado || concluida}
            >
              {ocupado === "preparar" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Preparar ({selArr.filter((l) => ["pendente", "erro"].includes(l.estado)).length})
            </Button>
            <Button size="sm" variant="outline" onClick={aprovar} disabled={!!ocupado || concluida}>
              {ocupado === "aprovar" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              Aprovar ({selArr.filter((l) => l.estado === "rascunho").length})
            </Button>
            <Button
              size="sm"
              onClick={enviar}
              disabled={!!ocupado || concluida || !temChipDisparo}
              title={
                !temChipDisparo
                  ? "Conecte um chip de disparo na aba Conexão"
                  : "Envia com intervalo entre as mensagens"
              }
            >
              {ocupado === "enviar" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Enviar ({(selArr.length ? selArr : aEnviar).filter(PRONTOS_PARA_ENVIO).length})
            </Button>
            {ocupado === "enviar" && (
              <Button size="sm" variant="ghost" onClick={() => (cancelar.current = true)}>
                Parar
              </Button>
            )}
            {progresso && (
              <span className="flex items-center text-xs text-muted-foreground">
                {progresso.feito}/{progresso.total}
              </span>
            )}
          </div>
        </div>

        {/* ---------------- DIREITA: mensagem ---------------- */}
        <div className="space-y-3 rounded-lg border p-3">
          <div className="flex items-center gap-2 font-medium">
            <MessageSquare className="h-4 w-4" /> Mensagem
          </div>

          {/* variáveis */}
          <div>
            <div className="mb-1 text-xs text-muted-foreground">Variáveis (clique p/ copiar):</div>
            <div className="flex flex-wrap gap-1">
              {WA_TOKENS.map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    navigator.clipboard?.writeText(`{{${t}}}`);
                    toast.success(`{{${t}}} copiado`);
                  }}
                  className="rounded border bg-muted/40 px-1.5 py-0.5 font-mono text-xs hover:bg-accent"
                >
                  {`{{${t}}}`}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {"{{bairro}}"} fica vazio (o Flow Leads não coleta bairro). {"{{nota}}"} só aparece
              para quem tem nota real (≥ 4,5) — nunca inventa.
            </p>
          </div>

          {/* variações */}
          {cfg && <VariacoesEditor cfg={cfg} disabled={concluida} onChange={salvarConfig} />}

          {/* preview */}
          <div>
            <div className="mb-1 text-xs text-muted-foreground">
              Prévia {leadPreview ? `(${leadPreview.lead_nome})` : ""}:
            </div>
            <div className="rounded-md border bg-muted/30 p-2 text-sm">
              {cfg && leadPreview ? (
                <PreviewMensagem cfg={cfg} lead={leadPreview} />
              ) : (
                <span className="text-muted-foreground">Selecione um lead para ver a prévia.</span>
              )}
            </div>
          </div>

          {/* intervalo + tempo */}
          {cfg && (
            <div className="space-y-2 border-t pt-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Intervalo (s):</span>
                <Input
                  type="number"
                  min={WA_INTERVALO_MIN_ABS}
                  max={WA_INTERVALO_MAX_ABS}
                  value={cfg.intervalo_min}
                  onChange={(e) =>
                    salvarConfig({ ...cfg, intervalo_min: clamp(parseInt(e.target.value) || 0) })
                  }
                  className="h-8 w-16"
                />
                <span className="text-muted-foreground">até</span>
                <Input
                  type="number"
                  min={WA_INTERVALO_MIN_ABS}
                  max={WA_INTERVALO_MAX_ABS}
                  value={cfg.intervalo_max}
                  onChange={(e) =>
                    salvarConfig({ ...cfg, intervalo_max: clamp(parseInt(e.target.value) || 0) })
                  }
                  className="h-8 w-16"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Recomendado 35–60s (mín 15 · máx 180). Intervalo é vazão, não cautela: instantâneo
                derruba a conta.
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                <Chip>
                  Mensagens a enviar:{" "}
                  {(selArr.length ? selArr : aEnviar).filter(PRONTOS_PARA_ENVIO).length}
                </Chip>
                <Chip>Tempo estimado: {tempoEstimado()}</Chip>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EstadoLeadBadge({ l }: { l: WaCampanhaLead }) {
  if (l.enviado) return <Tag tone="violet">enviado</Tag>;
  if (!l.whatsapp) return <Tag tone="rose">sem WhatsApp</Tag>;
  if (l.estado === "aprovado") return <Tag tone="emerald">a enviar</Tag>;
  if (l.estado === "rascunho") return <Tag tone="amber">aprovar</Tag>;
  if (l.estado === "sem_motivo") return <Tag>sem motivo</Tag>;
  if (l.estado === "descartado") return <Tag>descartado</Tag>;
  if (l.estado === "erro") return <Tag tone="rose">erro</Tag>;
  return <Tag>preparar</Tag>;
}

function Tag({ children, tone }: { children: React.ReactNode; tone?: string }) {
  const cls =
    tone === "violet"
      ? "bg-violet-100 text-violet-800"
      : tone === "emerald"
        ? "bg-emerald-100 text-emerald-800"
        : tone === "amber"
          ? "bg-amber-100 text-amber-800"
          : tone === "rose"
            ? "bg-rose-100 text-rose-800"
            : "bg-muted text-muted-foreground";
  return (
    <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px]", cls)}>{children}</span>
  );
}

function VariacoesEditor({
  cfg,
  disabled,
  onChange,
}: {
  cfg: WaCampanhaConfig;
  disabled?: boolean;
  onChange: (c: WaCampanhaConfig) => void;
}) {
  const set = (variacoes: WaVariacao[]) => onChange({ ...cfg, variacoes });
  const ativas = cfg.variacoes.filter((v) => v.ativa).length;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Variações (revezam, nunca repetem a anterior)</span>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 px-2"
          disabled={disabled}
          onClick={() =>
            set([
              ...cfg.variacoes,
              { id: `v${Date.now()}`, texto: "Oi {{nome}}! {{motivo}} {{link}}", ativa: true },
            ])
          }
        >
          <Plus className="h-3.5 w-3.5" /> Adicionar
        </Button>
      </div>
      {ativas < 2 && (
        <p className="text-[11px] text-amber-700">
          Com menos de 2 variações ativas, o texto vai igual pra todo mundo — o que mais derruba
          conta. Ative pelo menos 2.
        </p>
      )}
      {cfg.variacoes.map((v, i) => (
        <div key={v.id} className="rounded-md border p-2">
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                checked={v.ativa}
                disabled={disabled}
                onCheckedChange={(on) =>
                  set(cfg.variacoes.map((x) => (x.id === v.id ? { ...x, ativa: on } : x)))
                }
              />
              <span className="text-xs text-muted-foreground">Variação {i + 1}</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-rose-700"
              disabled={disabled}
              onClick={() => set(cfg.variacoes.filter((x) => x.id !== v.id))}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Textarea
            value={v.texto}
            disabled={disabled}
            onChange={(e) =>
              set(cfg.variacoes.map((x) => (x.id === v.id ? { ...x, texto: e.target.value } : x)))
            }
            rows={3}
            className="text-sm"
          />
        </div>
      ))}
    </div>
  );
}

function PreviewMensagem({ cfg, lead }: { cfg: WaCampanhaConfig; lead: WaCampanhaLead }) {
  const dados = {
    business_name: lead.lead_nome,
    city: lead.city,
    category: lead.category,
    whatsapp: lead.whatsapp,
    rating: lead.rating,
    review_count: lead.review_count,
    score_breakdown: lead.score_breakdown,
    link: lead.url_publica ?? "(link aparece após aprovar)",
  };
  const eleg = variacoesElegiveis(cfg.variacoes, dados);
  if (eleg.length === 0)
    return (
      <span className="text-muted-foreground">
        Nenhuma variação elegível para este lead (ex.: variação cita nota, mas o lead não tem).
      </span>
    );
  const v = escolherVariacao(eleg, lead.lead_id, null)!;
  return <span className="whitespace-pre-wrap">{resolverVariaveis(v.texto, dados)}</span>;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const clamp = (n: number) => Math.min(WA_INTERVALO_MAX_ABS, Math.max(WA_INTERVALO_MIN_ABS, n));
