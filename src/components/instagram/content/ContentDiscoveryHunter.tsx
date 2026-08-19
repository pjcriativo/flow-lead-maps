import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Film,
  Hash,
  History,
  Instagram,
  Loader2,
  MapPinned,
  Radar,
  SearchCheck,
  Sparkles,
  Users,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CitySelector } from "@/components/leads/instagram/CitySelector";
import { NichoSelector } from "@/components/leads/NichoSelector";
import {
  INSTAGRAM_UFS,
  InstagramField,
  InstagramRangeField,
  InstagramSourceChoice,
  InstagramToggleField,
} from "@/components/instagram/shared/InstagramDiscoveryFields";
import {
  InstagramScoreBars,
  InstagramScoreControls,
  type InstagramScoreSort,
} from "@/components/instagram/shared/InstagramScoreV2";
import { instagramScoreValue } from "@/lib/instagram-score-v2";
import {
  estimateContentDiscoveryCost,
  listContentDiscoveryHistory,
  runContentDiscovery,
  type ContentDiscoveryHistory,
  type ContentDiscoveryInput,
  type ContentDiscoveryResponse,
  type ContentLeadResult,
} from "@/services/instagram-discovery";

const INITIAL_INPUT: ContentDiscoveryInput = {
  mode: "hashtags",
  hashtags: [],
  niche: "",
  city: "",
  state: "",
  locationQuery: "",
  sourcesLimit: 5,
  postsPerSource: 10,
  targetLeads: 15,
  recentDays: 90,
  minFollowers: 100,
  maxFollowers: 250_000,
  minContentScore: 45,
  minLeadScore: 55,
  onlyProfessionals: true,
  requireLocation: false,
  requireNiche: true,
};

type ResultFilter = "all" | ContentLeadResult["decision"];
const PAGE_SIZE = 8;

export function ContentDiscoveryHunter({
  onLeadsChanged,
}: {
  onLeadsChanged?: () => Promise<void> | void;
}) {
  const [input, setInput] = useState(INITIAL_INPUT);
  const [hashtagsText, setHashtagsText] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<ContentDiscoveryResponse | null>(null);
  const [history, setHistory] = useState<ContentDiscoveryHistory[]>([]);
  const [filter, setFilter] = useState<ResultFilter>("all");
  const [page, setPage] = useState(1);
  const [scoreSort, setScoreSort] = useState<InstagramScoreSort>("total");
  const [minScore, setMinScore] = useState(0);

  useEffect(() => {
    let active = true;
    void listContentDiscoveryHistory(input.mode)
      .then((jobs) => {
        if (active) setHistory(jobs);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [input.mode]);

  const hashtags = useMemo(
    () =>
      [
        ...new Set(
          hashtagsText
            .split(/[\s,;]+/)
            .map((tag) => tag.trim())
            .filter(Boolean),
        ),
      ].slice(0, 6),
    [hashtagsText],
  );
  const effectiveInput = useMemo(() => ({ ...input, hashtags }), [hashtags, input]);
  const estimatedCost = estimateContentDiscoveryCost(effectiveInput);
  const requestedContent =
    (input.mode === "hashtags" ? Math.max(1, hashtags.length) : input.sourcesLimit) *
    input.postsPerSource;
  const filtered = useMemo(() => {
    return (result?.results ?? [])
      .filter((item) => filter === "all" || item.decision === filter)
      .filter((item) => item.scoreV2.total >= minScore)
      .sort(
        (left, right) =>
          instagramScoreValue(right.scoreV2, scoreSort) -
          instagramScoreValue(left.scoreV2, scoreSort),
      );
  }, [filter, minScore, result, scoreSort]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const update = <K extends keyof ContentDiscoveryInput>(key: K, value: ContentDiscoveryInput[K]) =>
    setInput((current) => ({ ...current, [key]: value }));

  const chooseMode = (mode: ContentDiscoveryInput["mode"]) => {
    setInput((current) => ({ ...current, mode }));
    setResult(null);
    setFilter("all");
    setPage(1);
  };

  const run = async () => {
    if (!effectiveInput.niche) return toast.error("Escolha o nicho do lead ideal.");
    if (effectiveInput.mode === "hashtags" && !effectiveInput.hashtags.length) {
      return toast.error("Informe ao menos uma hashtag do nicho ou da cidade.");
    }
    if (effectiveInput.mode === "places" && !effectiveInput.city && !effectiveInput.locationQuery) {
      return toast.error("Escolha a cidade ou informe um bairro/local.");
    }
    setRunning(true);
    try {
      const response = await runContentDiscovery(effectiveInput);
      setResult(response);
      setFilter("all");
      setPage(1);
      setHistory(await listContentDiscoveryHistory(effectiveInput.mode).catch(() => []));
      await onLeadsChanged?.();
      toast.success(`${response.stats?.newLeads ?? 0} novos leads descobertos por conteúdo.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "A descoberta por conteúdo falhou.");
    } finally {
      setRunning(false);
    }
  };

  const restore = (job: ContentDiscoveryHistory) => {
    setInput({ ...INITIAL_INPUT, ...job.input });
    setHashtagsText(job.input.hashtags?.map((tag) => `#${tag}`).join(", ") ?? "");
    setResult(job.result);
    setFilter("all");
    setPage(1);
  };

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="h-1 bg-[linear-gradient(90deg,var(--instagram-orange),var(--instagram-pink),var(--instagram-purple))]" />
        <div className="space-y-6 p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
            <div className="flex gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Sparkles className="size-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold">Discovery Radar</h2>
                  <Badge className="gap-1">
                    <Radar className="size-3" /> Fase 2
                  </Badge>
                </div>
                <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                  Descobre negócios por hashtags ou lugares reais, mede conteúdo, atividade e
                  engajamento robusto, e só enriquece os autores mais promissores.
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm">
              <div className="flex items-center gap-2 font-medium">
                <WalletCards className="size-4 text-primary" /> Teto estimado
              </div>
              <div className="mt-1 text-xl font-semibold">US$ {estimatedCost.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">cache reutilizado custa US$ 0</div>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-4">
            <FlowStep icon={Radar} number="1" title="Origem" text="Hashtag ou local público" />
            <FlowStep icon={Film} number="2" title="Conteúdo" text="Posts e Reels recentes" />
            <FlowStep
              icon={BarChart3}
              number="3"
              title="Sinais"
              text="Fit, atividade e engajamento"
            />
            <FlowStep
              icon={SearchCheck}
              number="4"
              title="Lead"
              text="Perfil enriquecido + prova"
            />
          </div>

          <div>
            <Label className="mb-2 block">1. Escolha a fonte de descoberta</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              <InstagramSourceChoice
                active={input.mode === "hashtags"}
                icon={Hash}
                title="Hashtag Hunter"
                text="Encontra quem publica nas hashtags do nicho e da região."
                onClick={() => chooseMode("hashtags")}
              />
              <InstagramSourceChoice
                active={input.mode === "places"}
                icon={MapPinned}
                title="Places Hunter"
                text="Pesquisa locais comerciais e analisa autores que publicam neles."
                onClick={() => chooseMode("places")}
              />
            </div>
          </div>

          {input.mode === "hashtags" ? (
            <InstagramField label="Hashtags — separe por vírgula (máx. 6)">
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={hashtagsText}
                  onChange={(event) => setHashtagsText(event.target.value)}
                  placeholder="odontologia, dentistacuritiba, ortodontia"
                  className="pl-9"
                  disabled={running}
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {hashtags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    #{tag.replace(/^#/, "")}
                  </Badge>
                ))}
              </div>
            </InstagramField>
          ) : (
            <div className="grid gap-4 lg:grid-cols-[1fr_180px]">
              <InstagramField label="Bairro, local conhecido ou tipo de estabelecimento">
                <Input
                  value={input.locationQuery}
                  onChange={(event) => update("locationQuery", event.target.value)}
                  placeholder="Batel, Shopping Mueller ou clínica odontológica"
                  disabled={running}
                />
              </InstagramField>
              <InstagramRangeField
                label="Locais para analisar"
                value={input.sourcesLimit}
                min={1}
                max={12}
                onChange={(value) => update("sourcesLimit", value)}
              />
            </div>
          )}

          <div>
            <Label className="mb-2 block">2. Defina o lead ideal</Label>
            <NichoSelector
              value={input.niche}
              onSelect={(niche) => update("niche", niche)}
              disabled={running}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-[140px_1fr]">
            <InstagramField label="Estado">
              <Select
                value={input.state}
                onValueChange={(state) => setInput((current) => ({ ...current, state, city: "" }))}
                disabled={running}
              >
                <SelectTrigger>
                  <SelectValue placeholder="UF" />
                </SelectTrigger>
                <SelectContent>
                  {INSTAGRAM_UFS.map((uf) => (
                    <SelectItem key={uf} value={uf}>
                      {uf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </InstagramField>
            <InstagramField label="Cidade">
              <CitySelector
                uf={input.state}
                value={input.city}
                onChange={(city) => update("city", city)}
                disabled={running}
              />
            </InstagramField>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InstagramRangeField
              label="Conteúdos por origem"
              value={input.postsPerSource}
              min={3}
              max={30}
              onChange={(value) => update("postsPerSource", value)}
            />
            <InstagramRangeField
              label="Recência"
              value={input.recentDays}
              suffix=" dias"
              min={7}
              max={365}
              step={7}
              onChange={(value) => update("recentDays", value)}
            />
            <InstagramRangeField
              label="Meta de leads"
              value={input.targetLeads}
              min={1}
              max={50}
              onChange={(value) => update("targetLeads", value)}
            />
            <InstagramRangeField
              label="Score de conteúdo"
              value={input.minContentScore}
              suffix="/100"
              min={0}
              max={100}
              step={5}
              onChange={(value) => update("minContentScore", value)}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <InstagramRangeField
              label="Seguidores mínimos"
              value={input.minFollowers}
              min={0}
              max={10_000}
              step={100}
              onChange={(value) => update("minFollowers", value)}
            />
            <InstagramRangeField
              label="Seguidores máximos"
              value={input.maxFollowers}
              min={10_000}
              max={1_000_000}
              step={10_000}
              onChange={(value) => update("maxFollowers", value)}
            />
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            <InstagramToggleField
              checked={input.onlyProfessionals}
              onChange={(value) => update("onlyProfessionals", value)}
              title="Somente contas profissionais"
              text="Separa negócios e criadores de consumidores comuns."
            />
            <InstagramToggleField
              checked={input.requireNiche}
              onChange={(value) => update("requireNiche", value)}
              title="Exigir aderência ao nicho"
              text="Aceita evidência no perfil ou no conteúdo publicado."
            />
            <InstagramToggleField
              checked={input.requireLocation}
              onChange={(value) => update("requireLocation", value)}
              title="Exigir evidência da cidade"
              text="Usa perfil, legenda ou local marcado como confirmação."
              disabled={!input.city}
            />
          </div>

          <div className="flex flex-col justify-between gap-4 border-t border-border pt-5 sm:flex-row sm:items-center">
            <div className="text-sm text-muted-foreground">
              <strong className="text-foreground">{requestedContent}</strong> conteúdos no teto ·
              mediana reduz distorção por post viral · enriquecimento seletivo
            </div>
            <Button onClick={run} disabled={running} size="lg" className="min-w-52">
              {running ? (
                <Loader2 className="size-4 animate-spin" />
              ) : input.mode === "hashtags" ? (
                <Hash className="size-4" />
              ) : (
                <MapPinned className="size-4" />
              )}
              {running
                ? "Analisando sinais…"
                : input.mode === "hashtags"
                  ? "Caçar por hashtags"
                  : "Caçar por lugares"}
            </Button>
          </div>
        </div>
      </section>

      {result?.stats ? (
        <ContentResults
          result={result}
          visible={visible}
          filter={filter}
          onFilter={(value) => {
            setFilter(value);
            setPage(1);
          }}
          page={page}
          pages={pages}
          onPage={setPage}
          scoreSort={scoreSort}
          minScore={minScore}
          onScoreSort={(value) => {
            setScoreSort(value);
            setPage(1);
          }}
          onMinScore={(value) => {
            setMinScore(value);
            setPage(1);
          }}
        />
      ) : null}

      {history.length ? (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <div className="mb-3 flex items-center gap-2">
            <History className="size-4 text-primary" />
            <h3 className="font-semibold">Buscas recentes desta fonte</h3>
          </div>
          <div className="grid gap-2 lg:grid-cols-3">
            {history.slice(0, 6).map((job) => (
              <button
                key={job.id}
                type="button"
                onClick={() => restore(job)}
                className="rounded-xl border border-border p-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">
                    {job.input.mode === "hashtags"
                      ? job.input.hashtags.map((tag) => `#${tag}`).join(" · ")
                      : job.input.locationQuery || job.input.city}
                  </span>
                  <Badge variant="outline">{job.status}</Badge>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {job.input.niche} · {Number(job.stats?.qualified ?? 0)} qualificados · US${" "}
                  {Number(job.actual_cost_usd ?? 0).toFixed(2)}
                </div>
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function ContentResults({
  result,
  visible,
  filter,
  onFilter,
  page,
  pages,
  onPage,
  scoreSort,
  minScore,
  onScoreSort,
  onMinScore,
}: {
  result: ContentDiscoveryResponse;
  visible: ContentLeadResult[];
  filter: ResultFilter;
  onFilter: (value: ResultFilter) => void;
  page: number;
  pages: number;
  onPage: (page: number) => void;
  scoreSort: InstagramScoreSort;
  minScore: number;
  onScoreSort: (sort: InstagramScoreSort) => void;
  onMinScore: (score: number) => void;
}) {
  const stats = result.stats!;
  const funnel = [
    { label: "Origens", value: stats.sourcesFound, icon: Radar },
    { label: "Conteúdos", value: stats.contentItems, icon: Film },
    { label: "Perfis únicos", value: stats.uniqueProfiles, icon: Users },
    { label: "Qualificados", value: stats.qualified, icon: BadgeCheck },
    { label: "Novos leads", value: stats.newLeads, icon: CheckCircle2 },
  ];
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
      <div className="flex flex-col justify-between gap-3 border-b border-border p-5 lg:flex-row lg:items-center">
        <div>
          <h2 className="font-semibold">Inteligência de conteúdo</h2>
          <p className="text-sm text-muted-foreground">
            Score médio {stats.averageContentScore}/100 · evidência preservada em cada perfil.
          </p>
        </div>
        <Badge variant="outline">Custo real US$ {Number(result.actualCost ?? 0).toFixed(3)}</Badge>
      </div>
      <div className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-5">
        {funnel.map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-card p-4">
            <Icon className="size-4 text-primary" />
            <div className="mt-2 text-2xl font-semibold">{value}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 border-y border-border px-5 py-3">
        {(["all", "qualified", "duplicate", "candidate", "rejected"] as ResultFilter[]).map(
          (value) => (
            <Button
              key={value}
              variant={filter === value ? "default" : "outline"}
              size="sm"
              onClick={() => onFilter(value)}
            >
              {filterLabel(value)}
            </Button>
          ),
        )}
        <InstagramScoreControls
          className="sm:ml-auto"
          sort={scoreSort}
          minScore={minScore}
          onSortChange={onScoreSort}
          onMinScoreChange={onMinScore}
        />
      </div>
      <div className="divide-y divide-border">
        {visible.map((lead) => (
          <ContentLeadCard key={`${lead.username}-${lead.sourceUrl}`} lead={lead} />
        ))}
        {!visible.length ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Nenhum perfil neste filtro.
          </div>
        ) : null}
      </div>
      {pages > 1 ? (
        <div className="flex items-center justify-end gap-2 border-t border-border p-4">
          <span className="text-xs text-muted-foreground">
            Página {page} de {pages}
          </span>
          <Button
            variant="outline"
            size="icon"
            aria-label="Página anterior"
            disabled={page === 1}
            onClick={() => onPage(page - 1)}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Próxima página"
            disabled={page === pages}
            onClick={() => onPage(page + 1)}
          >
            <ChevronRight />
          </Button>
        </div>
      ) : null}
    </section>
  );
}

function ContentLeadCard({ lead }: { lead: ContentLeadResult }) {
  return (
    <article className="grid gap-4 p-5 xl:grid-cols-[minmax(220px,1fr)_minmax(280px,1.15fr)_310px_120px] xl:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar className="size-12 border border-border">
          <AvatarImage src={lead.avatarUrl ?? undefined} alt={`Avatar de @${lead.username}`} />
          <AvatarFallback>{lead.username.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <strong className="truncate">{lead.fullName || `@${lead.username}`}</strong>
            {lead.accountKind === "business" ? (
              <Building2 className="size-3.5 text-primary" />
            ) : lead.accountKind === "creator" ? (
              <Sparkles className="size-3.5 text-primary" />
            ) : null}
          </div>
          <a
            href={`https://instagram.com/${lead.username}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            @{lead.username}
            <ExternalLink className="size-3" />
          </a>
          <div className="mt-1 text-xs text-muted-foreground">
            {compact(lead.followers)} seguidores · {lead.category || accountLabel(lead.accountKind)}
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-muted/30 p-3">
        <div className="mb-1 flex flex-wrap gap-1">
          <Badge variant="secondary">{lead.sourceType === "hashtags" ? "Hashtag" : "Local"}</Badge>
          {lead.signals.formats.map((format) => (
            <Badge key={format} variant="outline">
              {format}
            </Badge>
          ))}
        </div>
        <p className="line-clamp-3 text-sm">{lead.evidenceCaption}</p>
        {lead.sourceUrl ? (
          <a
            href={lead.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            Abrir evidência
            <ExternalLink className="size-3" />
          </a>
        ) : null}
      </div>
      <div className="space-y-2 text-xs">
        <InstagramScoreBars score={lead.scoreV2} />
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline">{lead.signals.robustEngagementRate.toFixed(2)}% eng.</Badge>
          <Badge variant="outline">mediana {compact(lead.signals.medianLikes)} likes</Badge>
          {lead.nicheMatch ? <Badge variant="outline">nicho ✓</Badge> : null}
          {lead.locationMatch ? <Badge variant="outline">local ✓</Badge> : null}
        </div>
      </div>
      <div className="xl:text-right">
        <DecisionBadge decision={lead.decision} />
        <p className="mt-2 text-xs text-muted-foreground">
          {lead.rejectionReason
            ? reasonLabel(lead.rejectionReason)
            : `${lead.contentCount} conteúdos analisados`}
        </p>
      </div>
    </article>
  );
}

function FlowStep({
  icon: Icon,
  number,
  title,
  text,
}: {
  icon: typeof Instagram;
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 p-3">
      <div className="relative flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" />
        <span className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
          {number}
        </span>
      </div>
      <div>
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{text}</div>
      </div>
    </div>
  );
}

function DecisionBadge({ decision }: { decision: ContentLeadResult["decision"] }) {
  return (
    <Badge
      variant={
        decision === "qualified" ? "default" : decision === "rejected" ? "destructive" : "secondary"
      }
    >
      {
        {
          qualified: "Novo lead",
          duplicate: "Já estava na base",
          candidate: "Candidato",
          rejected: "Rejeitado",
        }[decision]
      }
    </Badge>
  );
}

function filterLabel(value: ResultFilter) {
  return {
    all: "Todos",
    qualified: "Novos",
    duplicate: "Repetidos",
    candidate: "Candidatos",
    rejected: "Rejeitados",
  }[value];
}

function accountLabel(value: ContentLeadResult["accountKind"]) {
  return { business: "Negócio", creator: "Criador", consumer: "Consumidor" }[value];
}

function reasonLabel(value: string) {
  return (
    (
      {
        perfil_indisponivel: "perfil indisponível",
        conta_pessoal: "conta pessoal",
        poucos_seguidores: "audiência abaixo do mínimo",
        seguidores_acima_do_maximo: "audiência acima do máximo",
        fora_nicho: "sem aderência ao nicho",
        fora_localidade: "sem evidência da cidade",
        conteudo_fraco: "conteúdo abaixo do score",
        score_insuficiente: "score final insuficiente",
        meta_atingida: "fora da meta desta busca",
        limite_plano: "limite do plano",
        erro_banco: "falha ao salvar",
      } as Record<string, string>
    )[value] ?? value
  );
}

function compact(value: number) {
  return new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 }).format(
    value,
  );
}
