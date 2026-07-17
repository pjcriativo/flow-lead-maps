// Aba CAMPANHAS — TELA ÚNICA de disparo (layout do S-zap/Kaptar): compõe e dispara direto, sem
// lista de campanhas na frente. À esquerda TIPO DE LEAD + FILTROS + leads; à direita o painel
// Mensagem (Texto/Script, nome, variáveis, variações que REVEZAM, preview, intervalo, Disparar).
// Embaixo, CAMPANHAS REALIZADAS. Por baixo é o NOSSO motor: "Disparar" cria a campanha
// (canal='whatsapp'), prepara → aprova (publica o link {{link}}) → envia com intervalo/jitter.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Send,
  Trash2,
  Plus,
  Loader2,
  CheckCheck,
  MessageSquare,
  FileText,
  Zap,
  Shuffle,
  Clock,
  Users,
  AlertTriangle,
  History,
  RefreshCw,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
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
  listarLeadsWaCompose,
  listarChips,
  listarScripts,
  criarScript,
  enviarCampanhaLeadWa,
  enviadosPorCampanhaWa,
  WA_MOTIVO_LABEL,
  type WaLeadCompose,
  type WaScript,
} from "@/services/whatsapp";
import {
  listarCampanhas,
  criarCampanhaWaDaSelecao,
  listarCampanhaLeadsWaView,
  prepararCampanhaLead,
  aprovarCampanhaLead,
} from "@/services/campanhas";
import {
  resolverVariaveis,
  escolherVariacao,
  variacoesElegiveis,
  variacoesPadrao,
  WA_TOKENS,
  WA_INTERVALO_MIN_ABS,
  WA_INTERVALO_MAX_ABS,
  type WaVariacao,
} from "@/lib/wa-copy";

type TabKey = "todos" | "qualificados" | "em_contato" | "ativos";
const TABS: { key: TabKey; label: string; icon: React.ReactNode; dica: string }[] = [
  {
    key: "todos",
    label: "Todos",
    icon: <Users className="h-3.5 w-3.5" />,
    dica: "todos com WhatsApp",
  },
  {
    key: "qualificados",
    label: "Qualificados",
    icon: <Zap className="h-3.5 w-3.5" />,
    dica: "score alto, não contatado",
  },
  {
    key: "em_contato",
    label: "Em contato",
    icon: <MessageSquare className="h-3.5 w-3.5" />,
    dica: "contatado / proposta enviada",
  },
  {
    key: "ativos",
    label: "Ativos",
    icon: <CheckCheck className="h-3.5 w-3.5" />,
    dica: "respondeu / reunião",
  },
];
const SCORE_QUALIFICADO = 70;

function passaTab(l: WaLeadCompose, tab: TabKey): boolean {
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

export function WaCampanhas() {
  const [leads, setLeads] = useState<WaLeadCompose[]>([]);
  const [scripts, setScripts] = useState<WaScript[]>([]);
  const [realizadas, setRealizadas] = useState<(Campanha & { enviados: number })[]>([]);
  const [temChipDisparo, setTemChipDisparo] = useState<boolean | null>(null);
  const [carregando, setCarregando] = useState(true);

  const [tab, setTab] = useState<TabKey>("todos");
  const [fSegmento, setFSegmento] = useState("__todas");
  const [fCidade, setFCidade] = useState("__todas");
  const [limite, setLimite] = useState(0);
  const [sel, setSel] = useState<Set<string>>(new Set());

  const [nome, setNome] = useState("");
  const [modo, setModo] = useState<"texto" | "script">("texto");
  const [variacoes, setVariacoes] = useState<WaVariacao[]>(() => variacoesPadrao());
  const [intervaloBase, setIntervaloBase] = useState(35);
  const [variar, setVariar] = useState(true);

  const [disparando, setDisparando] = useState(false);
  const [progresso, setProgresso] = useState<{ feito: number; total: number; fase: string } | null>(
    null,
  );
  const cancelar = useRef(false);

  const carregar = useCallback(async () => {
    try {
      const [ls, sc, chips, camps] = await Promise.all([
        listarLeadsWaCompose(),
        listarScripts().catch(() => [] as WaScript[]),
        listarChips().catch(() => []),
        listarCampanhas("whatsapp").catch(() => [] as Campanha[]),
      ]);
      setLeads(ls);
      setScripts(sc);
      setTemChipDisparo(chips.some((c) => c.funcao === "disparo" && c.status === "conectado"));
      const env = await enviadosPorCampanhaWa(camps.map((c) => c.id)).catch(
        () => ({}) as Record<string, number>,
      );
      setRealizadas(
        camps.map((c) => ({ ...c, enviados: env[c.id] ?? 0 })).filter((c) => c.enviados > 0),
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao carregar");
    } finally {
      setCarregando(false);
    }
  }, []);
  useEffect(() => {
    carregar();
  }, [carregar]);

  const segmentos = useMemo(
    () => [...new Set(leads.map((l) => l.category).filter((c): c is string => !!c))].sort(),
    [leads],
  );
  const cidades = useMemo(
    () => [...new Set(leads.map((l) => l.city).filter((c): c is string => !!c))].sort(),
    [leads],
  );
  const filtrados = useMemo(() => {
    let r = leads.filter((l) => passaTab(l, tab));
    if (fSegmento !== "__todas") r = r.filter((l) => l.category === fSegmento);
    if (fCidade !== "__todas") r = r.filter((l) => l.city === fCidade);
    if (limite > 0) r = r.slice(0, limite);
    return r;
  }, [leads, tab, fSegmento, fCidade, limite]);

  const selArr = filtrados.filter((l) => sel.has(l.id));
  const aEnviar = (selArr.length ? selArr : filtrados).filter((l) => !l.enviado);
  const jaEnviados = leads.filter((l) => l.enviado).length;
  const variacoesAtivas = variacoes.filter((v) => v.ativa);

  const intervaloMin = intervaloBase;
  const intervaloMax = variar
    ? Math.min(WA_INTERVALO_MAX_ABS, Math.round(intervaloBase * 1.5))
    : intervaloBase;

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

  const setVariacao = (id: string, patch: Partial<WaVariacao>) =>
    setVariacoes((vs) => vs.map((v) => (v.id === id ? { ...v, ...patch } : v)));

  const salvarComoScript = async () => {
    const principal = variacoes[0];
    if (!principal?.texto.trim()) {
      toast.error("Escreva a mensagem principal primeiro.");
      return;
    }
    try {
      await criarScript({
        nome: nome.trim() || "Mensagem principal",
        tipo: "texto",
        mensagem: principal.texto,
      });
      toast.success("Salvo como script.");
      setScripts(await listarScripts());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao salvar script");
    }
  };

  const intervaloMs = () =>
    (intervaloMin + Math.random() * Math.max(0, intervaloMax - intervaloMin)) * 1000;

  const tempoEstimado = () => {
    const n = aEnviar.length;
    if (n <= 1) return n === 1 ? "~imediato" : "—";
    const medio = (intervaloMin + intervaloMax) / 2;
    const seg = (n - 1) * medio;
    const min = Math.round(seg / 60);
    return min < 1 ? `~${Math.round(seg)}s` : `~${min} min`;
  };

  const leadPreview = selArr[0] ?? filtrados[0] ?? null;

  const disparar = async () => {
    if (!temChipDisparo) {
      toast.error("Conecte um chip de disparo na aba WhatsApp.");
      return;
    }
    if (variacoesAtivas.length === 0) {
      toast.error("Ative ao menos uma variação da mensagem.");
      return;
    }
    const alvos = aEnviar;
    if (alvos.length === 0) {
      toast.error("Selecione leads (com WhatsApp e ainda não enviados).");
      return;
    }
    setDisparando(true);
    cancelar.current = false;
    setProgresso({ feito: 0, total: alvos.length, fase: "criando campanha" });
    let ok = 0;
    const motivos: Record<string, number> = {};
    try {
      const { campanha_id } = await criarCampanhaWaDaSelecao(
        nome,
        alvos.map((l) => l.id),
        {
          intervalo_min: intervaloMin,
          intervalo_max: intervaloMax,
          variacoes,
        },
      );
      const cls = await listarCampanhaLeadsWaView(campanha_id);
      for (let i = 0; i < cls.length; i++) {
        if (cancelar.current) break;
        const cl = cls[i];
        setProgresso({ feito: i, total: cls.length, fase: `preparando ${cl.lead_nome}` });
        const r = await prepararCampanhaLead(cl, campanha_id);
        if (r.estado === "sem_motivo") {
          motivos["sem_motivo"] = (motivos["sem_motivo"] ?? 0) + 1;
        } else if (r.estado === "rascunho" && r.proposta) {
          setProgresso({ feito: i, total: cls.length, fase: `publicando ${cl.lead_nome}` });
          await aprovarCampanhaLead(cl.id, r.proposta);
          setProgresso({ feito: i, total: cls.length, fase: `enviando ${cl.lead_nome}` });
          const env = await enviarCampanhaLeadWa(cl.id);
          if (env.ok) ok++;
          else {
            motivos[env.reason ?? "erro"] = (motivos[env.reason ?? "erro"] ?? 0) + 1;
            if (env.reason === "sem_chip") {
              toast.error("Sem chip de disparo — disparo pausado.");
              break;
            }
          }
        } else {
          motivos["erro"] = (motivos["erro"] ?? 0) + 1;
        }
        setProgresso({ feito: i + 1, total: cls.length, fase: "" });
        if (i < cls.length - 1 && !cancelar.current) await sleep(intervaloMs());
      }
      const resumo = Object.entries(motivos)
        .map(([k, n]) => `${n} ${WA_MOTIVO_LABEL[k] ?? k}`)
        .join(" · ");
      toast.success(`Disparados ${ok}/${alvos.length}.` + (resumo ? ` Fora: ${resumo}.` : ""));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha no disparo");
    } finally {
      setDisparando(false);
      setProgresso(null);
      setSel(new Set());
      carregar();
    }
  };

  const semChip = temChipDisparo === false;

  return (
    <div className="space-y-4">
      {/* aviso de conexão (estilo Kaptar) */}
      {semChip && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/40 bg-amber-50 p-4">
          <div className="flex items-start gap-2 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <div className="font-medium">WhatsApp não conectado</div>
              <div>Conecte um chip de disparo antes de disparar campanhas.</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid items-start gap-4 lg:grid-cols-[1.35fr_1fr]">
        {/* ================= ESQUERDA ================= */}
        <div className="space-y-4">
          {/* TIPO DE LEAD */}
          <div className="rounded-2xl border bg-card p-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Tipo de lead
            </div>
            <div className="flex flex-wrap gap-2">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => {
                    setTab(t.key);
                    setSel(new Set());
                  }}
                  title={t.dica}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition",
                    tab === t.key
                      ? "border-emerald-500 bg-emerald-50 font-medium text-emerald-700"
                      : "hover:bg-accent",
                  )}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* FILTROS */}
          <div className="rounded-2xl border bg-card p-4">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Filtros
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Campo label="Segmento">
                <Select value={fSegmento} onValueChange={setFSegmento}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Todo segmento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__todas">Todo segmento</SelectItem>
                    {segmentos.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Campo>
              <Campo label="Cidade">
                <Select value={fCidade} onValueChange={setFCidade}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Toda cidade" />
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
              </Campo>
              <Campo label="Bairro">
                <Input disabled placeholder="não coletado neste app" className="h-9" />
              </Campo>
              <Campo label="Limite de leads (0 = sem limite)">
                <Input
                  type="number"
                  min={0}
                  value={limite}
                  onChange={(e) => setLimite(Math.max(0, parseInt(e.target.value) || 0))}
                  className="h-9"
                />
              </Campo>
            </div>
          </div>

          {/* A enviar / Já enviados */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-50/60 py-2.5 font-medium text-emerald-700">
              <Send className="h-4 w-4" /> A enviar ({aEnviar.length})
            </div>
            <div className="flex items-center justify-center gap-2 rounded-xl border py-2.5 text-muted-foreground">
              <CheckCheck className="h-4 w-4" /> Já enviados ({jaEnviados})
            </div>
          </div>

          {/* Lista */}
          <div className="rounded-2xl border bg-card">
            <div className="flex items-center justify-between border-b px-4 py-2.5 text-sm">
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={filtrados.length > 0 && filtrados.every((l) => sel.has(l.id))}
                  onCheckedChange={toggleTodos}
                />
                {filtrados.length} leads
              </label>
              {sel.size > 0 && (
                <span className="text-xs text-muted-foreground">{sel.size} selecionados</span>
              )}
            </div>
            {carregando ? (
              <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
              </div>
            ) : filtrados.length === 0 ? (
              <div className="flex flex-col items-center gap-1 py-12 text-center text-sm text-muted-foreground">
                <Users className="h-7 w-7 text-muted-foreground/40" />
                Nenhum lead encontrado com os filtros aplicados
              </div>
            ) : (
              <div className="max-h-[520px] overflow-y-auto">
                {filtrados.map((l) => (
                  <label
                    key={l.id}
                    className="flex cursor-pointer items-center gap-2 border-b px-4 py-2 text-sm last:border-0 hover:bg-accent/40"
                  >
                    <Checkbox checked={sel.has(l.id)} onCheckedChange={() => toggle(l.id)} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{l.business_name}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {[l.category, l.city].filter(Boolean).join(" · ") || "—"}
                      </div>
                    </div>
                    {l.enviado && (
                      <span className="shrink-0 rounded-full bg-violet-100 px-2 py-0.5 text-[11px] text-violet-800">
                        enviado
                      </span>
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ================= DIREITA: Mensagem ================= */}
        <div className="space-y-3 rounded-2xl border bg-card p-4 lg:sticky lg:top-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-medium">
              <MessageSquare className="h-4 w-4 text-emerald-600" /> Mensagem
            </div>
            <div className="flex rounded-lg border p-0.5 text-xs">
              <button
                onClick={() => setModo("texto")}
                className={cn(
                  "flex items-center gap-1 rounded-md px-2 py-1",
                  modo === "texto" && "bg-muted font-medium",
                )}
              >
                <FileText className="h-3.5 w-3.5" /> Texto
              </button>
              <button
                onClick={() => setModo("script")}
                className={cn(
                  "flex items-center gap-1 rounded-md px-2 py-1",
                  modo === "script" && "bg-muted font-medium",
                )}
              >
                <Zap className="h-3.5 w-3.5" /> Script
              </button>
            </div>
          </div>

          {/* nome */}
          <div>
            <label className="text-xs font-semibold uppercase text-muted-foreground">
              Nome da campanha
            </label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="ex: Prospecção dentistas Curitiba"
              className="mt-1"
            />
          </div>

          {/* Script mode: escolher salvo */}
          {modo === "script" && (
            <div className="rounded-lg border bg-muted/30 p-2">
              <div className="mb-1 text-xs text-muted-foreground">Usar um script salvo:</div>
              {scripts.length === 0 ? (
                <div className="text-xs text-muted-foreground">
                  Nenhum script salvo — crie na aba Scripts.
                </div>
              ) : (
                <Select
                  onValueChange={(id) => {
                    const s = scripts.find((x) => x.id === id);
                    if (s?.mensagem)
                      setVariacoes([{ id: "principal", texto: s.mensagem, ativa: true }]);
                  }}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Escolher script…" />
                  </SelectTrigger>
                  <SelectContent>
                    {scripts
                      .filter((s) => s.tipo === "texto" && s.mensagem)
                      .map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.nome}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* variáveis */}
          <div>
            <div className="text-xs font-semibold uppercase text-muted-foreground">
              Variáveis disponíveis{" "}
              <span className="font-normal normal-case">(entram na variação)</span>
            </div>
            <div className="mt-1 flex flex-wrap gap-1">
              {WA_TOKENS.map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    navigator.clipboard?.writeText(`{{${t}}}`);
                    toast.success(`{{${t}}} copiado`);
                  }}
                  className="rounded-md border bg-muted/40 px-1.5 py-0.5 font-mono text-xs hover:bg-accent"
                >
                  {`{{${t}}}`}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {"{{bairro}}"} fica vazio (não coletamos bairro). {"{{nota}}"} só entra para quem tem
              nota real ≥ 4,5 — nunca inventa.
            </p>
          </div>

          {/* box verde info */}
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-50/60 p-3 text-xs text-emerald-900">
            <div className="flex items-center gap-1.5 font-medium">
              <Shuffle className="h-3.5 w-3.5" /> Variações da mensagem (evita bloqueio)
            </div>
            <p className="mt-1">
              Escreva a principal e crie outras versões dizendo a mesma coisa de formas diferentes.
              O sistema <b>reveza</b> as variações — <b>nunca manda a mesma duas seguidas</b>. Texto
              igual pra todo mundo é o que mais derruba conta.
            </p>
          </div>

          {/* variações */}
          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold uppercase text-muted-foreground">
                Variações da mensagem
              </span>
              <span className="flex items-center gap-1 text-emerald-600">
                <Shuffle className="h-3 w-3" /> {variacoesAtivas.length} ativa
                {variacoesAtivas.length !== 1 ? "s" : ""} rotacionando
              </span>
            </div>
            <div className="mt-2 max-h-64 space-y-2 overflow-y-auto pr-1">
              {variacoes.map((v, i) => (
                <div key={v.id} className="rounded-lg border p-2">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-medium">
                      #{i + 1} {i === 0 ? "Principal" : ""}
                    </span>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1 text-xs">
                        <Switch
                          checked={v.ativa}
                          onCheckedChange={(on) => setVariacao(v.id, { ativa: on })}
                        />
                        Ativa
                      </label>
                      {variacoes.length > 1 && (
                        <button
                          onClick={() => setVariacoes((vs) => vs.filter((x) => x.id !== v.id))}
                          className="text-rose-600 hover:text-rose-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <Textarea
                    value={v.texto}
                    onChange={(e) => setVariacao(v.id, { texto: e.target.value })}
                    rows={3}
                    className="text-sm"
                  />
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              className="mt-2 w-full border-emerald-500/40 bg-emerald-50/40 text-emerald-700 hover:bg-emerald-50"
              onClick={() =>
                setVariacoes((vs) => [
                  ...vs,
                  { id: `v${vs.length}-${Date.now()}`, texto: "", ativa: true },
                ])
              }
            >
              <Plus className="h-4 w-4" /> Adicionar variação
            </Button>
            <Button variant="outline" className="mt-2 w-full" onClick={salvarComoScript}>
              <Save className="h-4 w-4" /> Salvar mensagem principal como script
            </Button>
          </div>

          {/* preview */}
          <div className="rounded-lg border bg-muted/30 p-2 text-sm">
            <div className="mb-1 text-xs text-muted-foreground">
              Preview {leadPreview ? `(${leadPreview.business_name})` : "(primeiro selecionado)"}:
            </div>
            {leadPreview ? (
              <PreviewMensagem variacoes={variacoes} lead={leadPreview} />
            ) : (
              <span className="text-muted-foreground">Selecione um lead para ver a prévia.</span>
            )}
          </div>

          {/* intervalo */}
          <div className="space-y-2 border-t pt-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4 text-emerald-600" /> Intervalo entre mensagens
            </div>
            <div className="flex items-center gap-3">
              <Slider
                value={[intervaloBase]}
                min={WA_INTERVALO_MIN_ABS}
                max={WA_INTERVALO_MAX_ABS}
                step={1}
                onValueChange={([v]) => setIntervaloBase(v)}
                className="flex-1"
              />
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={intervaloBase}
                  min={WA_INTERVALO_MIN_ABS}
                  max={WA_INTERVALO_MAX_ABS}
                  onChange={(e) =>
                    setIntervaloBase(
                      Math.min(
                        WA_INTERVALO_MAX_ABS,
                        Math.max(WA_INTERVALO_MIN_ABS, parseInt(e.target.value) || 0),
                      ),
                    )
                  }
                  className="h-8 w-16"
                />
                <span className="text-sm text-muted-foreground">s</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>
                Mín 15 · Máx 180 · Recomendado 35–60
                {variar ? ` → varia entre ${intervaloMin} e ${intervaloMax}s` : ""}
              </span>
              <label className="flex items-center gap-1">
                <Checkbox checked={variar} onCheckedChange={(v) => setVariar(!!v)} /> Variar
                intervalo
              </label>
            </div>
          </div>

          {/* mensagens a enviar + tempo */}
          <div className="flex items-center justify-between border-t pt-3 text-sm">
            <div>
              <div className="text-muted-foreground">Mensagens a enviar</div>
              <div className="text-xl font-semibold tabular-nums">{aEnviar.length}</div>
            </div>
            <div className="text-right">
              <div className="text-muted-foreground">Tempo estimado</div>
              <div className="font-medium">{tempoEstimado()}</div>
            </div>
          </div>

          {progresso && (
            <div className="rounded-lg bg-muted/40 p-2 text-xs text-muted-foreground">
              {progresso.feito}/{progresso.total} · {progresso.fase}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              className="flex-1 bg-emerald-600 font-semibold hover:bg-emerald-700"
              onClick={disparar}
              disabled={disparando || semChip}
            >
              {disparando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Disparar Campanha
            </Button>
            {disparando && (
              <Button variant="outline" onClick={() => (cancelar.current = true)}>
                Parar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* CAMPANHAS REALIZADAS */}
      <div>
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <History className="h-3.5 w-3.5" /> Campanhas realizadas
          <button onClick={carregar} className="ml-auto normal-case">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="rounded-2xl border bg-card">
          {realizadas.length === 0 ? (
            <div className="flex flex-col items-center gap-1 py-10 text-center text-sm text-muted-foreground">
              <History className="h-6 w-6 text-muted-foreground/40" />
              Nenhuma campanha realizada ainda
            </div>
          ) : (
            <div className="divide-y">
              {realizadas.map((c) => (
                <div key={c.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span className="truncate font-medium">{c.nome}</span>
                  <span className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                    <span>{formatData(c.criada_em)}</span>
                    <span className="rounded-full bg-violet-50 px-2 py-0.5 text-violet-800">
                      {c.enviados} enviados
                    </span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function PreviewMensagem({ variacoes, lead }: { variacoes: WaVariacao[]; lead: WaLeadCompose }) {
  const dados = {
    business_name: lead.business_name,
    city: lead.city,
    category: lead.category,
    whatsapp: lead.whatsapp,
    rating: lead.rating,
    review_count: lead.review_count,
    score_breakdown: lead.score_breakdown,
    link: "(link gerado ao disparar)",
  };
  const eleg = variacoesElegiveis(variacoes, dados);
  if (eleg.length === 0)
    return (
      <span className="text-muted-foreground">Nenhuma variação ativa elegível para este lead.</span>
    );
  const v = escolherVariacao(eleg, lead.id, null)!;
  return <span className="whitespace-pre-wrap">{resolverVariaveis(v.texto, dados)}</span>;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
