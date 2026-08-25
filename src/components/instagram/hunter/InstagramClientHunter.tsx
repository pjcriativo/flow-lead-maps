import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Copy,
  Crosshair,
  Database,
  Flame,
  GitCompareArrows,
  Loader2,
  LockKeyhole,
  MapPin,
  RefreshCw,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  generateOpportunityApproach,
  enrichInstagramOpportunities,
  getInstagramCommercialReport,
  getInstagramPlan,
  listInstagramOpportunities,
  overlapCompetitorAudiences,
  searchCompetitorAudiences,
  updateOpportunityStatus,
  type AudienceMember,
  type AudienceOverlapResponse,
  type InstagramCommercialReport,
  type InstagramOpportunity,
  type InstagramPlanStatus,
} from "@/services/instagram-client-hunter";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  usernames: z
    .array(z.string().regex(/^[a-zA-Z0-9._]{1,30}$/))
    .min(1)
    .max(5),
  resultsLimit: z.number().int().min(20).max(2_000),
});

const usageItems: Array<{ key: keyof InstagramPlanStatus["used"]; label: string }> = [
  { key: "audienceProfiles", label: "Perfis de audiência" },
  { key: "hunts", label: "Caçadas" },
  { key: "overlaps", label: "Cruzamentos" },
  { key: "enrichments", label: "Enriquecimentos" },
  { key: "leads", label: "Leads qualificados" },
];

function parseUsernames(value: string): string[] {
  return [
    ...new Set(
      value
        .split(/[\s,;]+/)
        .map((item) => item.trim().replace(/^@/, "").toLowerCase())
        .filter(Boolean),
    ),
  ];
}

function UsagePanel({ plan }: { plan: InstagramPlanStatus }) {
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-card via-card to-primary/[0.04] shadow-[var(--shadow-card)]">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4 text-primary" /> Limites do Instagram
            </CardTitle>
            <CardDescription className="mt-1">
              Uso mensal da organização, protegido no servidor.
            </CardDescription>
          </div>
          <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
            Plano {plan.planName}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {usageItems.map(({ key, label }) => {
          const used = Number(plan.used[key]);
          const limit = Number(plan.limits[key]);
          const percent = limit > 0 ? Math.min(100, (used / limit) * 100) : 100;
          return (
            <div key={key} className="rounded-xl border border-border/70 bg-background/70 p-3">
              <div className="mb-2 flex items-center justify-between gap-2 text-xs">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-semibold">
                  {used}/{limit}
                </span>
              </div>
              <Progress
                value={percent}
                className={cn("h-1.5", limit === 0 && "[&>div]:bg-muted-foreground")}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function AudienceCard({ member }: { member: AudienceMember }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-background p-3">
      <Avatar className="h-10 w-10">
        <AvatarImage src={member.profilePicUrl ?? undefined} alt="" />
        <AvatarFallback>{member.username.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">@{member.username}</p>
        <p className="truncate text-xs text-muted-foreground">
          {member.fullName || "Nome não informado"}
        </p>
      </div>
      {member.verified ? <CheckCircle2 className="h-4 w-4 text-sky-500" /> : null}
    </div>
  );
}

function OpportunityCard({
  opportunity,
  onChanged,
}: {
  opportunity: InstagramOpportunity;
  onChanged: () => Promise<void>;
}) {
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState(opportunity.suggested_approach ?? "");
  const profile = opportunity.profile;
  const generate = async () => {
    setGenerating(true);
    try {
      const result = await generateOpportunityApproach(
        opportunity.id,
        "uma análise rápida e personalizada",
      );
      setMessage(result);
      toast.success("Abordagem contextual criada sem custo de IA.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao gerar abordagem.");
    } finally {
      setGenerating(false);
    }
  };
  const changeStatus = async (status: InstagramOpportunity["status"]) => {
    await updateOpportunityStatus(opportunity.id, status);
    await onChanged();
  };
  return (
    <Card className="overflow-hidden shadow-[var(--shadow-card)]">
      <div
        className={cn(
          "h-1",
          opportunity.temperature === "quente"
            ? "bg-destructive"
            : opportunity.temperature === "morno"
              ? "bg-amber-500"
              : "bg-sky-500",
        )}
      />
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-11 w-11">
            <AvatarImage src={profile?.profile_pic_url ?? undefined} alt="" />
            <AvatarFallback>{profile?.username?.slice(0, 2).toUpperCase() ?? "IG"}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold">@{profile?.username ?? "perfil"}</p>
              <Badge
                variant="outline"
                className={cn(
                  opportunity.temperature === "quente" &&
                    "border-destructive/30 bg-destructive/10 text-destructive",
                )}
              >
                {opportunity.score} · {opportunity.temperature}
              </Badge>
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {profile?.full_name || opportunity.sources.map((source) => `@${source}`).join(" · ")}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {opportunity.reasons.map((reason) => (
            <span
              key={reason}
              className="rounded-full bg-secondary px-2 py-1 text-[11px] text-secondary-foreground"
            >
              {reason}
            </span>
          ))}
        </div>
        {message ? (
          <div className="rounded-xl border border-primary/15 bg-primary/[0.04] p-3 text-xs leading-relaxed">
            {message}
            <Button
              variant="ghost"
              size="sm"
              className="ml-1 h-7"
              onClick={() =>
                void navigator.clipboard
                  .writeText(message)
                  .then(() => toast.success("Mensagem copiada."))
              }
            >
              <Copy className="h-3.5 w-3.5" /> Copiar
            </Button>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={generate} disabled={generating}>
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}{" "}
            Abordagem
          </Button>
          <Button size="sm" variant="outline" onClick={() => void changeStatus("saved")}>
            Salvar
          </Button>
          <Button size="sm" onClick={() => void changeStatus("contacted")}>
            Marcar contato
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function InstagramClientHunter() {
  const [plan, setPlan] = useState<InstagramPlanStatus | null>(null);
  const [opportunities, setOpportunities] = useState<InstagramOpportunity[]>([]);
  const [report, setReport] = useState<InstagramCommercialReport | null>(null);
  const [mapsLeads, setMapsLeads] = useState<Array<Record<string, unknown>>>([]);
  const [profilesText, setProfilesText] = useState("");
  const [limit, setLimit] = useState(100);
  const [audiences, setAudiences] = useState<Record<string, AudienceMember[]>>({});
  const [overlap, setOverlap] = useState<AudienceOverlapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [enriching, setEnriching] = useState(false);

  const refresh = useCallback(async () => {
    const [nextPlan, nextOpportunities, nextReport] = await Promise.all([
      getInstagramPlan(),
      listInstagramOpportunities(),
      getInstagramCommercialReport(),
    ]);
    setPlan(nextPlan);
    setOpportunities(nextOpportunities);
    setReport(nextReport.report);
    setMapsLeads(nextReport.mapsInstagram);
  }, []);

  useEffect(() => {
    void refresh()
      .catch((error) =>
        toast.error(error instanceof Error ? error.message : "Falha ao carregar o Caça-clientes."),
      )
      .finally(() => setLoading(false));
  }, [refresh]);

  const usernames = useMemo(() => parseUsernames(profilesText), [profilesText]);
  const runAudience = async () => {
    const parsed = searchSchema.safeParse({ usernames, resultsLimit: limit });
    if (!parsed.success) return toast.error("Informe de 1 a 5 perfis públicos válidos.");
    setRunning(true);
    try {
      const result = await searchCompetitorAudiences(
        parsed.data.usernames,
        parsed.data.resultsLimit,
      );
      setAudiences(result.sources);
      setOverlap(null);
      await refresh();
      toast.success(
        result.cacheHit
          ? `${result.total} perfis vieram da base, sem nova cobrança.`
          : `${result.total} perfis analisados; ${result.newProfiles} eram novos para sua conta.`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível analisar a audiência.",
      );
    } finally {
      setRunning(false);
    }
  };
  const runOverlap = async () => {
    if (usernames.length < 2) return toast.error("Informe ao menos dois perfis para cruzar.");
    setRunning(true);
    try {
      const result = await overlapCompetitorAudiences(usernames);
      setOverlap(result);
      await refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível cruzar as audiências.",
      );
    } finally {
      setRunning(false);
    }
  };

  if (loading || !plan)
    return (
      <div className="flex min-h-72 items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );

  const enrichOpportunities = async () => {
    setEnriching(true);
    try {
      const remaining = Math.max(0, plan.limits.enrichments - plan.used.enrichments);
      const result = await enrichInstagramOpportunities(Math.min(10, remaining));
      await refresh();
      toast.success(
        result.enriched
          ? `${result.enriched} oportunidades qualificadas com dados de perfil.`
          : "As oportunidades atuais já estavam qualificadas.",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao qualificar oportunidades.");
    } finally {
      setEnriching(false);
    }
  };

  return (
    <div className="space-y-5">
      <UsagePanel plan={plan} />
      <div className="grid gap-5 xl:grid-cols-[1.05fr_1.95fr]">
        <Card className="h-fit shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crosshair className="h-5 w-5 text-primary" /> Caçar pelo concorrente
            </CardTitle>
            <CardDescription>
              Informe perfis do mesmo mercado. A base compartilhada é consultada antes de qualquer
              coleta paga.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium">Perfis públicos (até 5)</label>
              <Textarea
                value={profilesText}
                onChange={(event) => setProfilesText(event.target.value)}
                placeholder="pablomarcal1, wendellcarvalho"
                rows={4}
              />
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Separe por vírgula, espaço ou nova linha.
              </p>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium">Amostra por perfil</label>
              <Input
                type="number"
                min={20}
                max={Math.min(2_000, plan.limits.audienceProfiles)}
                value={limit}
                onChange={(event) => setLimit(Number(event.target.value))}
              />
            </div>
            <Button
              className="w-full"
              onClick={runAudience}
              disabled={running || !usernames.length}
            >
              {running ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}{" "}
              Analisar seguidores
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={runOverlap}
              disabled={running || usernames.length < 2}
            >
              <GitCompareArrows className="h-4 w-4" /> Cruzar audiências
              {!plan.features.overlap ? <LockKeyhole className="ml-auto h-3.5 w-3.5" /> : null}
            </Button>
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-3 text-xs text-emerald-800 dark:text-emerald-300">
              <Database className="mb-1 h-4 w-4" /> Perfis já conhecidos são reutilizados. Uma nova
              cobrança só ocorre quando a base ainda não tem a amostra solicitada.
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="audience">
          <TabsList className="grid h-auto w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="audience">
              <Users /> Audiência
            </TabsTrigger>
            <TabsTrigger value="opportunities">
              <Flame /> Oportunidades
            </TabsTrigger>
            <TabsTrigger value="maps">
              <MapPin /> Maps + IG
            </TabsTrigger>
            <TabsTrigger value="report">
              <BarChart3 /> Relatório
            </TabsTrigger>
          </TabsList>
          <TabsContent value="audience" className="mt-4 space-y-4">
            {overlap ? (
              <Card className="border-primary/20 shadow-[var(--shadow-card)]">
                <CardHeader>
                  <CardTitle className="text-base">Cruzamento de audiência</CardTitle>
                  <CardDescription>
                    {overlap.locked
                      ? `Encontramos ${overlap.preview?.overlap ?? 0} perfis em comum. Veja as identidades a partir do plano ${overlap.requiredPlan}.`
                      : `${overlap.overlap?.length ?? 0} perfis aparecem em mais de uma audiência.`}
                  </CardDescription>
                </CardHeader>
                {!overlap.locked ? (
                  <CardContent className="grid gap-3 sm:grid-cols-2">
                    {overlap.overlap?.slice(0, 100).map((member) => (
                      <div key={member.key} className="rounded-xl border p-3">
                        <p className="font-semibold">@{member.username}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Presente em {member.sources.map((source) => `@${source}`).join(" e ")}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                ) : null}
              </Card>
            ) : Object.keys(audiences).length ? (
              Object.entries(audiences).map(([source, members]) => (
                <Card key={source} className="shadow-[var(--shadow-card)]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Seguidores de @{source}</CardTitle>
                    <CardDescription>{members.length} perfis na amostra</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {members.slice(0, 120).map((member) => (
                      <AudienceCard key={member.identityKey} member={member} />
                    ))}
                  </CardContent>
                </Card>
              ))
            ) : (
              <EmptyState
                icon={Users}
                title="Comece por um concorrente"
                text="Analise uma audiência pública ou cruze dois perfis para localizar quem já demonstra afinidade com o mercado."
              />
            )}
          </TabsContent>
          <TabsContent value="opportunities" className="mt-4">
            {opportunities.length ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-3">
                  <div>
                    <p className="text-sm font-semibold">Fila inteligente de prospecção</p>
                    <p className="text-xs text-muted-foreground">
                      Enriqueça somente os melhores perfis para preservar sua cota e a margem.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={enrichOpportunities}
                    disabled={enriching || plan.used.enrichments >= plan.limits.enrichments}
                  >
                    {enriching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    Qualificar top 10
                  </Button>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  {opportunities.map((opportunity) => (
                    <OpportunityCard
                      key={opportunity.id}
                      opportunity={opportunity}
                      onChanged={refresh}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState
                icon={Flame}
                title="Nenhuma oportunidade ainda"
                text="As melhores oportunidades aparecerão aqui com score, origem e evidência."
              />
            )}
          </TabsContent>
          <TabsContent value="maps" className="mt-4">
            {mapsLeads.length ? (
              <Card className="shadow-[var(--shadow-card)]">
                <CardHeader>
                  <CardTitle className="text-base">Oportunidades Maps + Instagram</CardTitle>
                  <CardDescription>
                    Empresas encontradas no Maps que também têm Instagram, priorizando presença
                    digital fraca.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {mapsLeads.map((lead) => (
                    <div
                      key={String(lead.id)}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3"
                    >
                      <div>
                        <p className="font-semibold">{String(lead.business_name ?? "Empresa")}</p>
                        <p className="text-xs text-muted-foreground">
                          {[lead.category, lead.city].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!lead.has_website ? (
                          <Badge className="bg-amber-500/10 text-amber-700 hover:bg-amber-500/10">
                            Sem site forte
                          </Badge>
                        ) : null}
                        <Button size="sm" variant="outline" asChild>
                          <a href={String(lead.instagram_url)} target="_blank" rel="noreferrer">
                            Ver Instagram <ArrowRight className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : (
              <EmptyState
                icon={MapPin}
                title="Sem cruzamentos Maps + Instagram"
                text="Quando uma empresa do Maps tiver um perfil Instagram público, ela será priorizada aqui."
              />
            )}
          </TabsContent>
          <TabsContent value="report" className="mt-4">
            {report ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <Metric
                  icon={Target}
                  label="Oportunidades"
                  value={report.opportunities}
                  detail={`${report.hot} quentes`}
                />
                <Metric
                  icon={Users}
                  label="Concorrentes"
                  value={report.competitors}
                  detail={`${report.runs} análises em 30 dias`}
                />
                <Metric
                  icon={TrendingUp}
                  label="Conversões ganhas"
                  value={report.won}
                  detail="Marcadas pela equipe"
                />
                <Metric
                  icon={Database}
                  label="Custo Apify"
                  value={`US$ ${report.costUsd.toFixed(2)}`}
                  detail={`US$ ${report.costPerOpportunityUsd.toFixed(3)} por oportunidade`}
                />
                <Metric
                  icon={MapPin}
                  label="Maps + Instagram"
                  value={report.mapsInstagram}
                  detail={`${report.weakDigitalPresence} com presença fraca`}
                />
                <Card className="border-dashed">
                  <CardContent className="flex h-full min-h-32 items-center justify-center p-5">
                    <Button variant="outline" onClick={() => void refresh()}>
                      <RefreshCw className="h-4 w-4" /> Atualizar relatório
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : null}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Users;
  title: string;
  text: string;
}) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed bg-card p-8 text-center">
      <div className="mb-3 rounded-2xl bg-primary/10 p-3 text-primary">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Target;
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <Card className="shadow-[var(--shadow-card)]">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{label}</span>
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}
