// Seletor das 3 FONTES DE PROSPECÇÃO + os formulários de Instagram e LinkedIn.
// Cada fonte prospecta de um jeito, então cada uma tem os SEUS campos (não reusa os do Maps).
// Instagram e LinkedIn ainda NÃO coletam: os campos validam e montam o pedido, mas o botão
// fica desabilitado e se explica. Nada aqui finge que já busca.
import { useMemo } from "react";
import { Instagram, Linkedin, MapPin, Lock, Info, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
  MODOS_INSTAGRAM,
  CARGOS_SUGERIDOS,
  TAMANHOS_EMPRESA,
  validarInstagram,
  validarLinkedIn,
  pedidoInstagram,
  pedidoLinkedIn,
  type FonteProspeccao,
  type BuscaInstagram,
  type BuscaLinkedIn,
  type ModoInstagram,
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
              {f.estado === "em_breve" && (
                <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Em breve
                </span>
              )}
              {f.estado === "ativa" && (
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

/** Painel comum das fontes que ainda não coletam: o que extrai, encaixe, aviso e o botão travado. */
function PainelEmBreve({
  fonte,
  erros,
  pedido,
}: {
  fonte: FonteProspeccao;
  erros: string[];
  pedido: unknown;
}) {
  const f = FONTES[fonte];
  const camposOk = erros.length === 0;
  return (
    <div className="space-y-3">
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
        </div>

        <div className="rounded-lg border border-border bg-secondary/30 p-3">
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Pedido de busca montado
          </div>
          {camposOk ? (
            <pre className="max-h-[104px] overflow-auto rounded-md bg-card p-2 font-mono text-[11px] leading-relaxed text-muted-foreground">
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
        <Button
          disabled
          className="h-10 min-w-[190px]"
          title="A coleta desta fonte ainda não está ligada"
        >
          <Lock className="h-4 w-4" /> Buscar — em breve
        </Button>
        <p className="text-xs text-muted-foreground">
          {camposOk ? (
            <>
              Campos válidos e pedido montado. O botão está travado porque a{" "}
              <b>coleta do {f.label} ainda não está ligada</b> — nada é buscado nem gravado por
              enquanto.
            </>
          ) : (
            <>Complete os campos ao lado. Mesmo completos, a coleta ainda não está ligada.</>
          )}
        </p>
      </div>
    </div>
  );
}

/** INSTAGRAM — prospecção por DESCOBERTA (hashtag / localização / seguidores de um perfil). */
export function FormInstagram({
  valor,
  onChange,
}: {
  valor: BuscaInstagram;
  onChange: (v: BuscaInstagram) => void;
}) {
  const modo = MODOS_INSTAGRAM.find((m) => m.id === valor.modo)!;
  const erros = useMemo(() => validarInstagram(valor).erros, [valor]);
  const pedido = useMemo(() => pedidoInstagram(valor), [valor]);
  const set = <K extends keyof BuscaInstagram>(k: K, v: BuscaInstagram[K]) =>
    onChange({ ...valor, [k]: v });

  return (
    <div className="space-y-4">
      <div>
        <Label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Modo de busca
        </Label>
        <ToggleGroup
          type="single"
          value={valor.modo}
          onValueChange={(v) => v && set("modo", v as ModoInstagram)}
          variant="outline"
          className="flex-wrap justify-start"
        >
          {MODOS_INSTAGRAM.map((m) => (
            <ToggleGroupItem key={m.id} value={m.id} aria-label={m.label} className="px-3">
              {m.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <p className="mt-1 text-[11px] text-muted-foreground">{modo.dica}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <Label
            htmlFor="ig-termo"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            {modo.rotuloTermo}
          </Label>
          <Input
            id="ig-termo"
            placeholder={modo.placeholder}
            value={valor.termo}
            onChange={(e) => set("termo", e.target.value)}
          />
        </div>
        <div>
          <Label
            htmlFor="ig-cidade"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            Cidade <span className="normal-case text-muted-foreground/70">(opcional)</span>
          </Label>
          <Input
            id="ig-cidade"
            placeholder="ex.: Curitiba"
            value={valor.cidade}
            onChange={(e) => set("cidade", e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-6">
        <div className="min-w-[240px] flex-1">
          <div className="mb-1.5 flex items-center justify-between">
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Seguidores (mínimo)
            </Label>
            <span className="text-sm font-semibold tabular-nums">
              {valor.minSeguidores.toLocaleString("pt-BR")}
            </span>
          </div>
          <Slider
            value={[valor.minSeguidores]}
            min={0}
            max={50000}
            step={100}
            onValueChange={(v) => set("minSeguidores", v[0])}
          />
          <p className="mt-1 text-[11px] text-muted-foreground">
            Corta perfil pessoal e conta parada. Muito alto = poucos resultados.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-border bg-secondary/40 px-3 py-2">
          <Instagram className="h-4 w-4 text-fuchsia-600" />
          <Label
            htmlFor="ig-com"
            className="cursor-pointer text-xs font-medium text-muted-foreground"
          >
            Só contas comerciais
          </Label>
          <Switch
            id="ig-com"
            checked={valor.soComerciais}
            onCheckedChange={(v) => set("soComerciais", v)}
          />
        </div>
        <div className="min-w-[200px] flex-1">
          <div className="mb-1.5 flex items-center justify-between">
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Quantidade
            </Label>
            <span className="text-sm font-semibold tabular-nums">{valor.limite}</span>
          </div>
          <Slider
            value={[valor.limite]}
            min={10}
            max={200}
            step={5}
            onValueChange={(v) => set("limite", v[0])}
          />
        </div>
      </div>

      <PainelEmBreve fonte="instagram" erros={erros} pedido={pedido} />
    </div>
  );
}

/** LINKEDIN — prospecção por FILTRO PROFISSIONAL (busca PESSOA, não negócio). */
export function FormLinkedIn({
  valor,
  onChange,
}: {
  valor: BuscaLinkedIn;
  onChange: (v: BuscaLinkedIn) => void;
}) {
  const erros = useMemo(() => validarLinkedIn(valor).erros, [valor]);
  const pedido = useMemo(() => pedidoLinkedIn(valor), [valor]);
  const set = <K extends keyof BuscaLinkedIn>(k: K, v: BuscaLinkedIn[K]) =>
    onChange({ ...valor, [k]: v });

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-sky-600/30 bg-sky-600/5 p-2.5 text-[11px] leading-relaxed text-sky-900">
        Aqui o lead é uma <b>pessoa</b>, não um estabelecimento — você escolhe o cargo de quem
        decide. É o que mata a objeção <i>“preciso falar com meu sócio”</i>.
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <Label
            htmlFor="li-cargo"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            Cargo do decisor
          </Label>
          <Input
            id="li-cargo"
            placeholder="ex.: Proprietário, Gerente de Marketing"
            value={valor.cargo}
            onChange={(e) => set("cargo", e.target.value)}
          />
          <div className="mt-1.5 flex flex-wrap gap-1">
            {CARGOS_SUGERIDOS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => set("cargo", c)}
                className={cn(
                  "rounded-md border px-2 py-0.5 text-[11px] transition-colors",
                  valor.cargo === c
                    ? "border-sky-600 bg-sky-600/10 text-sky-800"
                    : "border-border bg-card text-muted-foreground hover:border-foreground/20",
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label
            htmlFor="li-setor"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            Setor
          </Label>
          <Input
            id="li-setor"
            placeholder="ex.: Odontologia, Estética, Advocacia"
            value={valor.setor}
            onChange={(e) => set("setor", e.target.value)}
          />
        </div>
        <div>
          <Label
            htmlFor="li-regiao"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            Região
          </Label>
          <Input
            id="li-regiao"
            placeholder="ex.: Curitiba e região, Paraná"
            value={valor.regiao}
            onChange={(e) => set("regiao", e.target.value)}
          />
        </div>
        <div>
          <Label
            htmlFor="li-tam"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            Tamanho da empresa
          </Label>
          <Select value={valor.tamanhoEmpresa} onValueChange={(v) => set("tamanhoEmpresa", v)}>
            <SelectTrigger id="li-tam" aria-label="Tamanho da empresa">
              <SelectValue placeholder="Qualquer tamanho" />
            </SelectTrigger>
            <SelectContent>
              {TAMANHOS_EMPRESA.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="max-w-[320px]">
        <div className="mb-1.5 flex items-center justify-between">
          <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Quantidade
          </Label>
          <span className="text-sm font-semibold tabular-nums">{valor.limite}</span>
        </div>
        <Slider
          value={[valor.limite]}
          min={10}
          max={200}
          step={5}
          onValueChange={(v) => set("limite", v[0])}
        />
      </div>

      <PainelEmBreve fonte="linkedin" erros={erros} pedido={pedido} />
    </div>
  );
}
