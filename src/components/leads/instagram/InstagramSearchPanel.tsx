import { useMemo, useState } from "react";
import { Instagram, Loader2, MapPin, Search, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { NichoSelector } from "../NichoSelector";
import { UF_LIST } from "../leads-shared";
import { estimarCustoColeta } from "@/lib/redes-teto";
import { montarPlanoDescobertaInstagram } from "@/lib/instagram-discovery";
import { estrategiaPorId, type Estrategia, type PedidoBusca } from "@/lib/fontes-prospeccao";
import { CitySelector } from "./CitySelector";

type Objetivo = "todos" | "sem_site";

export function InstagramSearchPanel({
  running,
  onBuscar,
}: {
  running: boolean;
  onBuscar: (estrategia: Estrategia, pedido: PedidoBusca) => Promise<void>;
}) {
  const [nicho, setNicho] = useState("");
  const [uf, setUf] = useState("");
  const [cidade, setCidade] = useState("");
  const [objetivo, setObjetivo] = useState<Objetivo>("todos");
  const [minSeguidores, setMinSeguidores] = useState(100);
  const [limite, setLimite] = useState(50);
  const [soComerciais, setSoComerciais] = useState(true);
  const [exigirLocalidade, setExigirLocalidade] = useState(true);
  const [exigirContatoExterno, setExigirContatoExterno] = useState(false);
  const [somenteNovos, setSomenteNovos] = useState(true);

  const estrategia = estrategiaPorId("IG-LOCAL")!;
  const podeBuscar = Boolean(nicho.trim() && uf && cidade && !running);
  const plano = useMemo(() => {
    if (!nicho.trim() || !cidade.trim()) return null;
    return montarPlanoDescobertaInstagram({ nicho, cidade, metaQualificados: limite });
  }, [cidade, limite, nicho]);
  const custo = useMemo(
    () => estimarCustoColeta(plano?.maxCandidatos ?? limite),
    [limite, plano?.maxCandidatos],
  );

  const buscar = async () => {
    if (!podeBuscar) return;
    await onBuscar(estrategia, {
      fonte: "instagram",
      estrategia: estrategia.id,
      titulo: estrategia.titulo,
      limite,
      somenteNovos,
      campos: {
        nicho,
        cidade,
        uf,
        minSeguidores,
        soComerciais,
        exigirLocalidade,
        semSiteProprio: objetivo === "sem_site",
        exigirContatoExterno,
      },
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border bg-secondary/30 p-4">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Instagram className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold">Descobrir perfis comerciais no Instagram</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Busca perfis na rede social e valida nicho, cidade e qualidade antes de salvar. Nenhum
              dado do Maps entra nesta busca.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Fonte: Instagram
        </span>
      </div>

      <section className="space-y-3" aria-labelledby="ig-publico">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            1
          </span>
          <h3 id="ig-publico" className="text-sm font-semibold">
            Defina o público
          </h3>
        </div>
        <NichoSelector value={nicho} onSelect={setNicho} disabled={running} />
        {nicho && (
          <p className="text-xs text-muted-foreground">
            Nicho selecionado: <b className="text-foreground">{nicho}</b>
          </p>
        )}
      </section>

      <section className="space-y-3" aria-labelledby="ig-local">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            2
          </span>
          <h3 id="ig-local" className="text-sm font-semibold">
            Escolha a região
          </h3>
        </div>
        <div className="grid gap-3 md:grid-cols-[160px_1fr]">
          <div>
            <Label className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground">
              Estado
            </Label>
            <Select
              value={uf}
              onValueChange={(novoUf) => {
                setUf(novoUf);
                setCidade("");
              }}
              disabled={running}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a UF" />
              </SelectTrigger>
              <SelectContent>
                {UF_LIST.map((sigla) => (
                  <SelectItem key={sigla} value={sigla}>
                    {sigla}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground">
              Cidade
            </Label>
            <CitySelector uf={uf} value={cidade} onChange={setCidade} disabled={running} />
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 rounded-lg border border-border px-3 py-2.5">
          <div>
            <Label htmlFor="ig-local-confirmado" className="text-sm">
              Exigir cidade no perfil
            </Label>
            <p className="text-xs text-muted-foreground">
              Evita salvar perfis sem evidência pública da cidade escolhida.
            </p>
          </div>
          <Switch
            id="ig-local-confirmado"
            checked={exigirLocalidade}
            onCheckedChange={setExigirLocalidade}
            disabled={running}
          />
        </div>
      </section>

      <section className="space-y-3" aria-labelledby="ig-qualificacao">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            3
          </span>
          <h3 id="ig-qualificacao" className="text-sm font-semibold">
            Qualifique os perfis
          </h3>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-lg border border-border p-3">
            <Label className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground">
              Objetivo
            </Label>
            <Select
              value={objetivo}
              onValueChange={(v) => setObjetivo(v as Objetivo)}
              disabled={running}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os perfis relevantes</SelectItem>
                <SelectItem value="sem_site">Somente sem site próprio</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-lg border border-border p-3">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span>Seguidores mínimos</span>
              <b>{minSeguidores.toLocaleString("pt-BR")}</b>
            </div>
            <Slider
              value={[minSeguidores]}
              min={0}
              max={10000}
              step={100}
              onValueChange={(v) => setMinSeguidores(v[0])}
              disabled={running}
            />
          </div>
          <FilterSwitch
            id="ig-comercial"
            label="Somente contas comerciais"
            hint="Remove perfis pessoais quando o Instagram informa o tipo da conta."
            value={soComerciais}
            onChange={setSoComerciais}
            disabled={running}
          />
          <FilterSwitch
            id="ig-contato"
            label="Exigir contato fora do Instagram"
            hint="Opcional: e-mail, telefone, WhatsApp ou site. Desligado permite abordagem por DM."
            value={exigirContatoExterno}
            onChange={setExigirContatoExterno}
            disabled={running}
          />
          <FilterSwitch
            id="ig-novos"
            label="Entregar somente leads novos"
            hint="Ligado, a coleta ignora duplicados e continua até buscar a meta de novos leads."
            value={somenteNovos}
            onChange={setSomenteNovos}
            disabled={running}
          />
        </div>
        <div className="rounded-lg border border-border bg-secondary/20 p-3">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="inline-flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" /> Meta de leads
              qualificados
            </span>
            <b>{limite}</b>
          </div>
          <Slider
            value={[limite]}
            min={10}
            max={100}
            step={10}
            onValueChange={(v) => setLimite(v[0])}
            disabled={running}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Para entregar {limite}, o motor pode analisar até {plano?.maxCandidatos ?? limite}
            perfis em consultas complementares e para assim que atingir a meta. Estimativa máxima:
            <b className="text-foreground"> US$ {custo.toFixed(2)}</b>; buscas recentes idênticas
            usam cache e custam US$ 0.
          </p>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
        <Button onClick={() => void buscar()} disabled={!podeBuscar} className="min-w-48">
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          {running ? "Analisando perfis…" : "Buscar perfis"}
        </Button>
        {!nicho || !uf || !cidade ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" /> Selecione nicho, estado e cidade para buscar.
          </span>
        ) : null}
      </div>
    </div>
  );
}

function FilterSwitch({
  id,
  label,
  hint,
  value,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  hint: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
      <div>
        <Label htmlFor={id} className="text-sm">
          {label}
        </Label>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <Switch id={id} checked={value} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}
