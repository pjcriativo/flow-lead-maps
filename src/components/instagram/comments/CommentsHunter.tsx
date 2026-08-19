import { useEffect, useMemo, useState } from "react";
import {
  AtSign,
  BadgeCheck,
  Building2,
  CheckCircle2,
  ExternalLink,
  Filter,
  Heart,
  History,
  Instagram,
  Loader2,
  MapPin,
  MessageCircleMore,
  Radar,
  SearchCheck,
  Sparkles,
  Target,
  UserRoundSearch,
  Users,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CitySelector } from "@/components/leads/instagram/CitySelector";
import { NichoSelector } from "@/components/leads/NichoSelector";
import {
  estimateCommentsHunterCost,
  listCommentsHunterHistory,
  runCommentsHunter,
  type CommentLeadResult,
  type CommentsHunterHistory,
  type CommentsHunterInput,
  type CommentsHunterResponse,
} from "@/services/instagram-discovery";
import {
  InstagramField as Field,
  INSTAGRAM_UFS,
  InstagramRangeField as RangeField,
  InstagramSourceChoice as SourceChoice,
  InstagramToggleField as ToggleField,
} from "@/components/instagram/shared/InstagramDiscoveryFields";

const INITIAL_INPUT: CommentsHunterInput = {
  sourceType: "profile",
  profile: "",
  postUrls: [],
  niche: "",
  city: "",
  state: "",
  maxPosts: 3,
  commentsPerPost: 30,
  targetLeads: 15,
  minIntentScore: 40,
  minLeadScore: 55,
  onlyProfessionals: true,
  requireLocation: false,
  requireNiche: true,
};

type ResultFilter = "all" | CommentLeadResult["decision"];

export function CommentsHunter({
  onLeadsChanged,
}: {
  onLeadsChanged?: () => Promise<void> | void;
}) {
  const [input, setInput] = useState(INITIAL_INPUT);
  const [urlsText, setUrlsText] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<CommentsHunterResponse | null>(null);
  const [history, setHistory] = useState<CommentsHunterHistory[]>([]);
  const [filter, setFilter] = useState<ResultFilter>("all");

  useEffect(() => {
    let active = true;
    void listCommentsHunterHistory()
      .then((jobs) => {
        if (active) setHistory(jobs);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const parsedUrls = useMemo(
    () =>
      urlsText
        .split(/\r?\n|,/)
        .map((url) => url.trim())
        .filter(Boolean),
    [urlsText],
  );
  const effectiveInput = useMemo(
    () => ({ ...input, postUrls: input.sourceType === "posts" ? parsedUrls : [] }),
    [input, parsedUrls],
  );
  const estimatedCost = estimateCommentsHunterCost(effectiveInput);
  const requestedComments =
    (input.sourceType === "profile" ? input.maxPosts : Math.max(1, parsedUrls.length)) *
    input.commentsPerPost;
  const visibleResults = useMemo(
    () => (result?.results ?? []).filter((item) => filter === "all" || item.decision === filter),
    [filter, result],
  );

  const update = <K extends keyof CommentsHunterInput>(key: K, value: CommentsHunterInput[K]) => {
    setInput((current) => ({ ...current, [key]: value }));
  };

  const run = async () => {
    if (!effectiveInput.niche) return toast.error("Escolha o nicho do lead ideal.");
    if (effectiveInput.sourceType === "profile" && !effectiveInput.profile.trim()) {
      return toast.error("Informe o perfil concorrente ou criador de conteúdo.");
    }
    if (effectiveInput.sourceType === "posts" && effectiveInput.postUrls.length === 0) {
      return toast.error("Cole ao menos uma URL de post ou Reel.");
    }
    setRunning(true);
    try {
      const response = await runCommentsHunter(effectiveInput);
      setResult(response);
      setFilter("all");
      const jobs = await listCommentsHunterHistory().catch(() => []);
      setHistory(jobs);
      await onLeadsChanged?.();
      toast.success(
        `${response.stats?.newLeads ?? 0} novos leads qualificados por evidência de comentário.`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "A busca por comentários falhou.");
    } finally {
      setRunning(false);
    }
  };

  const restore = (job: CommentsHunterHistory) => {
    if (job.result) setResult(job.result);
    setInput({ ...INITIAL_INPUT, ...job.input });
    setUrlsText(job.input.postUrls?.join("\n") ?? "");
    setFilter("all");
  };

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="h-1 bg-[linear-gradient(90deg,var(--instagram-orange),var(--instagram-pink),var(--instagram-purple))]" />
        <div className="space-y-6 p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
            <div className="flex gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Radar className="size-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold">Comments Hunter</h2>
                  <Badge className="gap-1">
                    <Sparkles className="size-3" /> Novo motor
                  </Badge>
                </div>
                <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                  Encontra quem demonstrou intenção real em posts do nicho, elimina spam e enriquece
                  somente os autores promissores. Cada lead chega com a prova do comentário.
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm">
              <div className="flex items-center gap-2 font-medium">
                <WalletCards className="size-4 text-primary" /> Custo máximo estimado
              </div>
              <div className="mt-1 text-xl font-semibold">US$ {estimatedCost.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">cache recente custa US$ 0</div>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-4">
            <FlowStep icon={Instagram} number="1" title="Posts" text="Perfil ou URLs escolhidas" />
            <FlowStep
              icon={MessageCircleMore}
              number="2"
              title="Intenção"
              text="Comentários úteis, sem spam"
            />
            <FlowStep
              icon={UserRoundSearch}
              number="3"
              title="Perfil"
              text="Enriquecimento seletivo"
            />
            <FlowStep
              icon={SearchCheck}
              number="4"
              title="Lead"
              text="Score + evidência rastreável"
            />
          </div>

          <div>
            <Label className="mb-2 block">1. Onde estão os comentários?</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              <SourceChoice
                active={input.sourceType === "profile"}
                icon={AtSign}
                title="Perfil concorrente ou referência"
                text="Busca os posts recentes do perfil automaticamente."
                onClick={() => update("sourceType", "profile")}
              />
              <SourceChoice
                active={input.sourceType === "posts"}
                icon={MessageCircleMore}
                title="Posts ou Reels específicos"
                text="Maior controle: você escolhe exatamente onde minerar."
                onClick={() => update("sourceType", "posts")}
              />
            </div>
          </div>

          {input.sourceType === "profile" ? (
            <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
              <Field label="Perfil público">
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={input.profile}
                    onChange={(event) => update("profile", event.target.value.replace(/^@/, ""))}
                    placeholder="perfil_concorrente"
                    className="pl-9"
                    disabled={running}
                  />
                </div>
              </Field>
              <RangeField
                label="Posts recentes para analisar"
                value={input.maxPosts}
                min={1}
                max={8}
                onChange={(value) => update("maxPosts", value)}
              />
            </div>
          ) : (
            <Field label="URLs públicas — uma por linha">
              <Textarea
                value={urlsText}
                onChange={(event) => setUrlsText(event.target.value)}
                placeholder={
                  "https://www.instagram.com/p/.../\nhttps://www.instagram.com/reel/.../"
                }
                rows={4}
                disabled={running}
              />
              <p className="text-xs text-muted-foreground">Até 8 posts ou Reels por trabalho.</p>
            </Field>
          )}

          <div>
            <Label className="mb-2 block">2. Quem é o lead ideal?</Label>
            <NichoSelector
              value={input.niche}
              onSelect={(niche) => update("niche", niche)}
              disabled={running}
            />
            {input.niche ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Nicho selecionado: <strong className="text-foreground">{input.niche}</strong>
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-[140px_1fr]">
            <Field label="Estado">
              <Select
                value={input.state}
                onValueChange={(state) => {
                  setInput((current) => ({ ...current, state, city: "" }));
                }}
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
            </Field>
            <Field label="Cidade">
              <CitySelector
                uf={input.state}
                value={input.city}
                onChange={(city) => update("city", city)}
                disabled={running}
              />
            </Field>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <RangeField
              label="Comentários por post"
              value={input.commentsPerPost}
              min={5}
              max={100}
              step={5}
              onChange={(value) => update("commentsPerPost", value)}
            />
            <RangeField
              label="Meta de leads"
              value={input.targetLeads}
              min={1}
              max={50}
              onChange={(value) => update("targetLeads", value)}
            />
            <RangeField
              label="Intenção mínima"
              value={input.minIntentScore}
              suffix="/100"
              min={0}
              max={100}
              step={5}
              onChange={(value) => update("minIntentScore", value)}
            />
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <ToggleField
              checked={input.onlyProfessionals}
              onChange={(checked) => update("onlyProfessionals", checked)}
              title="Somente contas profissionais"
              text="Ideal para prospecção B2B. Desligue para captar consumidores."
            />
            <ToggleField
              checked={input.requireNiche}
              onChange={(checked) => update("requireNiche", checked)}
              title="Exigir aderência ao nicho"
              text="O perfil precisa declarar sinais do segmento escolhido."
            />
            <ToggleField
              checked={input.requireLocation}
              onChange={(checked) => update("requireLocation", checked)}
              title="Exigir cidade no perfil"
              text="Use quando localização pública for indispensável."
              disabled={!input.city}
            />
          </div>

          <div className="flex flex-col justify-between gap-4 border-t border-border pt-5 sm:flex-row sm:items-center">
            <div className="text-sm text-muted-foreground">
              <strong className="text-foreground">{requestedComments}</strong> comentários no teto ·
              enriquecimento só dos melhores · limite duro de custo antes de rodar
            </div>
            <Button onClick={run} disabled={running} size="lg" className="min-w-52">
              {running ? <Loader2 className="size-4 animate-spin" /> : <Radar className="size-4" />}
              {running ? "Minerando evidências…" : "Caçar leads engajados"}
            </Button>
          </div>
        </div>
      </section>

      {result?.stats ? (
        <CommentsResults
          result={result}
          visibleResults={visibleResults}
          filter={filter}
          onFilter={setFilter}
        />
      ) : null}

      {history.length ? (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <div className="mb-3 flex items-center gap-2">
            <History className="size-4 text-primary" />
            <h3 className="font-semibold">Buscas recentes por comentários</h3>
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
                    {job.input.sourceType === "profile"
                      ? `@${job.input.profile}`
                      : "Posts selecionados"}
                  </span>
                  <Badge variant="outline">{job.status}</Badge>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {job.input.niche} · {job.stats?.qualified ?? 0} qualificados · US${" "}
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

function CommentsResults({
  result,
  visibleResults,
  filter,
  onFilter,
}: {
  result: CommentsHunterResponse;
  visibleResults: CommentLeadResult[];
  filter: ResultFilter;
  onFilter: (filter: ResultFilter) => void;
}) {
  const stats = result.stats!;
  const funnel = [
    { label: "Comentários", value: stats.comments, icon: MessageCircleMore },
    { label: "Autores únicos", value: stats.uniqueCommenters, icon: Users },
    { label: "Com intenção", value: stats.intentCandidates, icon: Target },
    { label: "Qualificados", value: stats.qualified, icon: BadgeCheck },
    { label: "Novos leads", value: stats.newLeads, icon: CheckCircle2 },
  ];
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
      <div className="flex flex-col justify-between gap-3 border-b border-border p-5 lg:flex-row lg:items-center">
        <div>
          <h2 className="font-semibold">Resultado rastreável</h2>
          <p className="text-sm text-muted-foreground">
            Cada perfil mantém o comentário que acionou a qualificação.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline">{stats.posts} posts</Badge>
          <Badge variant="outline">US$ {Number(result.actualCost ?? 0).toFixed(3)} real</Badge>
          {Object.values(stats.cache).some(Boolean) ? (
            <Badge variant="secondary">cache reutilizado</Badge>
          ) : null}
        </div>
      </div>
      <div className="grid gap-2 p-5 sm:grid-cols-2 xl:grid-cols-5">
        {funnel.map((item, index) => (
          <div
            key={item.label}
            className="relative rounded-xl border border-border bg-muted/20 p-4"
          >
            <item.icon className="size-4 text-primary" />
            <div className="mt-3 text-2xl font-semibold">{item.value}</div>
            <div className="text-xs text-muted-foreground">{item.label}</div>
            {index < funnel.length - 1 ? (
              <div className="absolute -right-1 top-1/2 hidden size-2 -translate-y-1/2 rotate-45 border-r border-t border-border bg-card xl:block" />
            ) : null}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 border-y border-border px-5 py-3">
        <Filter className="size-4 text-muted-foreground" />
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
      </div>
      <div className="divide-y divide-border">
        {visibleResults.map((lead) => (
          <CommentLeadCard key={`${lead.username}-${lead.sourceUrl}`} lead={lead} />
        ))}
        {!visibleResults.length ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Nenhum perfil neste filtro.
          </div>
        ) : null}
      </div>
    </section>
  );
}

function CommentLeadCard({ lead }: { lead: CommentLeadResult }) {
  return (
    <article className="grid gap-4 p-5 xl:grid-cols-[minmax(260px,1.1fr)_minmax(300px,1.4fr)_220px_140px] xl:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar className="size-12 border border-border">
          <AvatarImage src={lead.avatarUrl ?? undefined} alt={`Avatar de @${lead.username}`} />
          <AvatarFallback>{lead.username.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <strong className="truncate">{lead.fullName || `@${lead.username}`}</strong>
            {lead.professional ? <Building2 className="size-3.5 shrink-0 text-primary" /> : null}
          </div>
          <a
            href={`https://instagram.com/${lead.username}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            @{lead.username} <ExternalLink className="size-3" />
          </a>
          <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>{compact(lead.followers)} seguidores</span>
            <span>{lead.posts} posts</span>
            {lead.category ? <span>{lead.category}</span> : null}
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-muted/30 p-3">
        <div className="mb-1 flex items-center justify-between gap-2 text-xs">
          <Badge variant="secondary">{intentLabel(lead.intentLabel)}</Badge>
          <span className="flex items-center gap-1 text-muted-foreground">
            <Heart className="size-3" /> {lead.commentLikes}
          </span>
        </div>
        <blockquote className="line-clamp-3 text-sm">“{lead.comment}”</blockquote>
        {lead.sourceUrl ? (
          <a
            href={lead.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            Ver comentário na origem <ExternalLink className="size-3" />
          </a>
        ) : null}
      </div>
      <div className="space-y-2 text-xs">
        <Signal label="Intenção" value={lead.intentScore} />
        <Signal label="Score do lead" value={lead.leadScore} />
        <Signal label="Autenticidade" value={lead.authenticity} />
        <div className="flex flex-wrap gap-1">
          {lead.nicheMatch ? <Badge variant="outline">nicho ✓</Badge> : null}
          {lead.locationMatch ? (
            <Badge variant="outline">
              <MapPin className="mr-1 size-3" />
              local ✓
            </Badge>
          ) : null}
        </div>
      </div>
      <div className="xl:text-right">
        <DecisionBadge decision={lead.decision} />
        {lead.rejectionReason ? (
          <p className="mt-2 text-xs text-muted-foreground">{reasonLabel(lead.rejectionReason)}</p>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">salvo no CRM</p>
        )}
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
  icon: typeof Radar;
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

function Signal({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between">
        <span className="text-muted-foreground">{label}</span>
        <strong>{value}</strong>
      </div>
      <Progress value={value} className="h-1.5" />
    </div>
  );
}

function DecisionBadge({ decision }: { decision: CommentLeadResult["decision"] }) {
  const labels = {
    qualified: "Novo lead",
    duplicate: "Já estava na base",
    candidate: "Candidato",
    rejected: "Rejeitado",
  };
  return (
    <Badge
      variant={
        decision === "qualified" ? "default" : decision === "rejected" ? "destructive" : "secondary"
      }
    >
      {labels[decision]}
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

function intentLabel(value: CommentLeadResult["intentLabel"]) {
  return {
    compra: "Intenção de compra",
    duvida: "Dúvida comercial",
    interesse: "Interesse",
    elogio: "Elogio",
    generico: "Genérico",
  }[value];
}

function reasonLabel(value: string) {
  return (
    (
      {
        perfil_indisponivel: "perfil indisponível",
        conta_pessoal: "conta pessoal",
        fora_nicho: "sem evidência do nicho",
        fora_localidade: "sem confirmação da cidade",
        score_insuficiente: "score abaixo do mínimo",
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
