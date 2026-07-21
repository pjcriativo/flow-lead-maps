// Seletor das 3 FONTES DE PROSPECÇÃO + o motor de ESTRATÉGIAS (10 por rede).
// Cada estratégia declara os campos que precisa (src/lib/fontes-prospeccao.ts) e a tela se monta
// sozinha a partir disso — não existem 20 formulários hardcoded.
// Instagram e LinkedIn ainda NÃO coletam: os campos validam e montam o pedido, mas o botão fica
// desabilitado e se explica. Nada aqui finge que já busca.
import { useMemo, useState } from "react";
import {
  Instagram,
  Linkedin,
  MapPin,
  Lock,
  Info,
  Check,
  AlertTriangle,
  Search,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { buscarRedes } from "@/services/whatsapp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  FONTES,
  ORDEM_FONTES,
  CAMPOS,
  CARGOS_SUGERIDOS,
  VIABILIDADE_UI,
  estrategiasDe,
  validarEstrategia,
  montarPedido,
  type FonteProspeccao,
  type Estrategia,
  type ValoresBusca,
  type CampoId,
  type Viabilidade,
} from "@/lib/fontes-prospeccao";

const ICONE: Record<FonteProspeccao, React.ReactNode> = {
  google_maps: <MapPin className="h-4 w-4" />,
  instagram: <Instagram className="h-4 w-4" />,
  linkedin: <Linkedin className="h-4 w-4" />,
};

// Identidade de cada fonte quando SELECIONADA (a marca ajuda a saber onde se está).
const ATIVO: Record<FonteProspeccao, string> = {
  google_maps: "border-primary bg-primary/5 ring-1 ring-primary/30",
  instagram: "border-fuchsia-500 bg-fuchsia-500/5 ring-1 ring-fuchsia-500/30",
  linkedin: "border-sky-600 bg-sky-600/5 ring-1 ring-sky-600/30",
};
const SELO: Record<FonteProspeccao, string> = {
  google_maps: "text-primary",
  instagram: "text-fuchsia-600",
  linkedin: "text-sky-700",
};
const CARTAO_SEL: Record<Exclude<FonteProspeccao, "google_maps">, string> = {
  instagram: "border-fuchsia-500 bg-fuchsia-500/5",
  linkedin: "border-sky-600 bg-sky-600/5",
};

const VIAB_CLS: Record<Viabilidade, string> = {
  viavel: "bg-emerald-100 text-emerald-800",
  fragil: "bg-amber-100 text-amber-800",
  planejado: "bg-secondary text-muted-foreground",
};

/** Os 3 cartões do topo. Trocar de fonte troca os campos abaixo. */
export function FonteSelector({
  valor,
  onChange,
  disabled,
}: {
  valor: FonteProspeccao;
  onChange: (f: FonteProspeccao) => void;
  disabled?: boolean;
}) {
  return (
    <div role="tablist" aria-label="Fonte de prospecção" className="grid gap-2 sm:grid-cols-3">
      {ORDEM_FONTES.map((id) => {
        const f = FONTES[id];
        const sel = valor === id;
        return (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={sel}
            disabled={disabled}
            onClick={() => onChange(id)}
            className={cn(
              "group rounded-xl border border-border bg-card p-3 text-left transition-all duration-200",
              "hover:border-foreground/20 hover:shadow-[var(--shadow-card)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "disabled:cursor-not-allowed disabled:opacity-60",
              sel && ATIVO[id],
            )}
          >
            <div className="flex items-center gap-2">
              <span className={cn("shrink-0", sel ? SELO[id] : "text-muted-foreground")}>
                {ICONE[id]}
              </span>
              <span className="text-sm font-semibold">{f.label}</span>
              {f.estado === "em_breve" ? (
                <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Em breve
                </span>
              ) : (
                <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-800">
                  <Check className="h-3 w-3" /> Ativa
                </span>
              )}
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{f.resumo}</p>
            <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">
              {f.busca}
            </p>
          </button>
        );
      })}
    </div>
  );
}

/** Um campo, montado a partir do que a estratégia pediu. */
function Campo({
  id,
  valores,
  onChange,
}: {
  id: CampoId;
  valores: ValoresBusca;
  onChange: (id: CampoId, v: string | number | boolean) => void;
}) {
  const c = CAMPOS[id];
  const htmlId = `campo-${id}`;
  const val = valores[id];

  if (c.tipo === "booleano") {
    return (
      <div className="flex items-center gap-2 rounded-md border border-border bg-secondary/40 px-3 py-2">
        <Label
          htmlFor={htmlId}
          className="cursor-pointer text-xs font-medium text-muted-foreground"
        >
          {c.label}
        </Label>
        <Switch
          id={htmlId}
          checked={Boolean(val)}
          onCheckedChange={(v) => onChange(id, v)}
          className="ml-auto"
        />
      </div>
    );
  }

  if (c.tipo === "numero") {
    return (
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {c.label}
          </Label>
          <span className="text-sm font-semibold tabular-nums">
            {Number(val ?? 0).toLocaleString("pt-BR")}
          </span>
        </div>
        <Slider
          value={[Number(val ?? 0)]}
          min={0}
          max={50000}
          step={100}
          onValueChange={(v) => onChange(id, v[0])}
        />
        {c.ajuda && <p className="mt-1 text-[11px] text-muted-foreground">{c.ajuda}</p>}
      </div>
    );
  }

  if (c.tipo === "select") {
    return (
      <div>
        <Label
          htmlFor={htmlId}
          className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground"
        >
          {c.label}
        </Label>
        <Select value={String(val ?? "")} onValueChange={(v) => onChange(id, v)}>
          <SelectTrigger id={htmlId} aria-label={c.label}>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {(c.opcoes ?? []).map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div>
      <Label
        htmlFor={htmlId}
        className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground"
      >
        {c.label}
      </Label>
      <Input
        id={htmlId}
        placeholder={c.placeholder}
        value={String(val ?? "")}
        onChange={(e) => onChange(id, e.target.value)}
      />
      {/* atalhos de decisor: o cargo é o campo que mais trava o dono */}
      {id === "cargo" && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {CARGOS_SUGERIDOS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChange(id, s)}
              className={cn(
                "rounded-md border px-2 py-0.5 text-[11px] transition-colors",
                val === s
                  ? "border-sky-600 bg-sky-600/10 text-sky-800"
                  : "border-border bg-card text-muted-foreground hover:border-foreground/20",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      )}
      {c.ajuda && id !== "cargo" && (
        <p className="mt-1 text-[11px] text-muted-foreground">{c.ajuda}</p>
      )}
    </div>
  );
}

/** Fonte que ainda não coleta: estratégias + campos da escolhida + pedido + botão travado. */
export function FormEstrategias({
  fonte,
  estrategiaId,
  onEstrategia,
  valores,
  onValores,
}: {
  fonte: Exclude<FonteProspeccao, "google_maps">;
  estrategiaId: string;
  onEstrategia: (id: string) => void;
  valores: ValoresBusca;
  onValores: (v: ValoresBusca) => void;
}) {
  const f = FONTES[fonte];
  const lista = useMemo(() => estrategiasDe(fonte), [fonte]);
  const atual: Estrategia = useMemo(
    () => lista.find((e) => e.id === estrategiaId) ?? lista[0],
    [lista, estrategiaId],
  );
  const erros = useMemo(() => validarEstrategia(atual, valores).erros, [atual, valores]);
  const pedido = useMemo(() => montarPedido(atual, valores), [atual, valores]);
  const camposOk = erros.length === 0;
  const [rodando, setRodando] = useState(false);
  const [resultado, setResultado] = useState<string | null>(null);

  const coletar = async () => {
    setRodando(true);
    setResultado(null);
    try {
      const r = await buscarRedes(atual.id, pedido.campos, pedido.limite);
      if (!r.ok) {
        const msg =
          r.reason === "teto" ? `Teto de gasto: ${r.motivo}` : `Não coletou: ${r.reason ?? "erro"}`;
        toast.error(msg);
        setResultado(msg);
        return;
      }
      const txt =
        `${r.inseridos} lead(s) novo(s) de ${r.encontrados} encontrado(s)` +
        (r.descartados ? ` · ${r.descartados} descartado(s) sem contato` : "") +
        ` · custo US$ ${(r.custo ?? 0).toFixed(4)} · gasto no mês US$ ${(r.gastoMesDepois ?? 0).toFixed(2)} de ${r.teto?.mes ?? 50}`;
      toast.success(`${r.inseridos} lead(s) coletado(s).`);
      setResultado(txt);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Falha na coleta";
      toast.error(msg);
      setResultado(msg);
    } finally {
      setRodando(false);
    }
  };

  const set = (id: CampoId, v: string | number | boolean) => onValores({ ...valores, [id]: v });

  return (
    <div className="space-y-4">
      {fonte === "linkedin" && (
        <div className="rounded-lg border border-sky-600/30 bg-sky-600/5 p-2.5 text-[11px] leading-relaxed text-sky-900">
          Aqui o lead é uma <b>pessoa</b>, não um estabelecimento — você escolhe o cargo de quem
          decide. É o que mata a objeção <i>“preciso falar com meu sócio”</i>.
        </div>
      )}

      {/* ESTRATÉGIA — cada uma prospecta de um jeito e pede campos diferentes */}
      <div>
        <Label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Estratégia de prospecção ({lista.length} opções)
        </Label>
        <div
          role="radiogroup"
          aria-label="Estratégia de prospecção"
          className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3"
        >
          {lista.map((e) => {
            const sel = e.id === atual.id;
            return (
              <button
                key={e.id}
                type="button"
                role="radio"
                aria-checked={sel}
                data-estrategia={e.id}
                onClick={() => onEstrategia(e.id)}
                className={cn(
                  "rounded-lg border border-border bg-card p-2.5 text-left transition-all duration-150",
                  "hover:border-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  sel && CARTAO_SEL[fonte],
                )}
              >
                <div className="flex items-center gap-1.5">
                  <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                    {e.id}
                  </span>
                  <span className="truncate text-xs font-semibold">{e.titulo}</span>
                  <span
                    title={VIABILIDADE_UI[e.viabilidade].dica}
                    className={cn(
                      "ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide",
                      VIAB_CLS[e.viabilidade],
                    )}
                  >
                    {VIABILIDADE_UI[e.viabilidade].label}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                  {e.descricao}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* campos que ESTA estratégia precisa */}
      <div className="rounded-lg border border-border bg-secondary/20 p-3">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            {atual.id}
          </span>
          <span className="text-sm font-semibold">{atual.titulo}</span>
          <span className="text-xs text-muted-foreground">— {atual.descricao}</span>
        </div>

        {atual.nota && (
          <p className="mb-3 flex gap-2 rounded-md border border-amber-500/40 bg-amber-50 p-2 text-[11px] leading-relaxed text-amber-900">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              <b>{VIABILIDADE_UI[atual.viabilidade].label}:</b> {atual.nota}
            </span>
          </p>
        )}

        {atual.campos.length > 0 ? (
          <div className="grid items-end gap-3 md:grid-cols-2 lg:grid-cols-3">
            {atual.campos.map((id) => (
              <Campo key={id} id={id} valores={valores} onChange={set} />
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Esta estratégia não tem campos: ela depende da sua própria conta e vira uma lista para
            abordagem manual.
          </p>
        )}

        <div className="mt-3 max-w-[320px] border-t border-border pt-3">
          <div className="mb-1.5 flex items-center justify-between">
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Quantidade
            </Label>
            <span className="text-sm font-semibold tabular-nums">
              {Number(valores.limite ?? 50)}
            </span>
          </div>
          <Slider
            value={[Number(valores.limite ?? 50)]}
            min={10}
            max={200}
            step={5}
            onValueChange={(v) => onValores({ ...valores, limite: v[0] })}
          />
        </div>
      </div>

      {/* o que a coleta traria + o pedido montado */}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-secondary/30 p-3">
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            O que a coleta vai trazer
          </div>
          <div className="flex flex-wrap gap-1.5">
            {f.extrai.map((e) => (
              <span
                key={e}
                className="rounded-md border border-border bg-card px-2 py-1 text-[11px] text-foreground"
              >
                {e}
              </span>
            ))}
          </div>
          <p className="mt-2 flex gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {f.encaixe}
          </p>
          <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
            <b className="text-foreground">Onde a coleta pluga:</b> {atual.pluga}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-secondary/30 p-3">
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Pedido de busca montado
          </div>
          {camposOk ? (
            <pre className="max-h-[132px] overflow-auto rounded-md bg-card p-2 font-mono text-[11px] leading-relaxed text-muted-foreground">
              {JSON.stringify(pedido, null, 1)}
            </pre>
          ) : (
            <ul className="space-y-1">
              {erros.map((e) => (
                <li key={e} className="flex gap-1.5 text-[11px] text-amber-700">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {e}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {f.aviso && (
        <p className="flex gap-2 rounded-lg border border-amber-500/40 bg-amber-50 p-2.5 text-[11px] leading-relaxed text-amber-900">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            <b>Coleta em desenvolvimento.</b> {f.aviso}
          </span>
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3">
        {atual.coleta ? (
          <Button
            className="h-10 min-w-[190px] font-semibold"
            disabled={!camposOk || rodando}
            onClick={coletar}
            title={camposOk ? "Coleta real — respeita o teto de gasto" : "Complete os campos"}
          >
            {rodando ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            {rodando ? "Buscando…" : "Buscar agora"}
          </Button>
        ) : (
          <Button
            disabled
            className="h-10 min-w-[190px]"
            title="A coleta desta estratégia ainda não está ligada"
          >
            <Lock className="h-4 w-4" /> Buscar — em breve
          </Button>
        )}
        <p className="text-xs text-muted-foreground">
          {atual.coleta ? (
            camposOk ? (
              <>
                Coleta ligada nesta estratégia. Ela <b>gasta de verdade</b> e para sozinha no teto
                (US$ 5 por busca · US$ 50 no mês).
              </>
            ) : (
              <>Complete os campos acima para poder buscar.</>
            )
          ) : (
            <>
              O botão está travado porque a <b>coleta desta estratégia ainda não está ligada</b> —
              nada é buscado nem gravado.
            </>
          )}
        </p>
      </div>
      {resultado && (
        <p className="rounded-lg border border-border bg-secondary/30 p-2.5 text-[11px] text-muted-foreground">
          {resultado}
        </p>
      )}
    </div>
  );
}
