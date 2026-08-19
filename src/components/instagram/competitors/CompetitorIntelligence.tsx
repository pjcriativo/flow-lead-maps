import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Archive,
  AtSign,
  BarChart3,
  BellRing,
  CalendarClock,
  ExternalLink,
  Eye,
  Hash,
  Heart,
  History,
  Instagram,
  Lightbulb,
  Loader2,
  MapPin,
  MessageCircleQuestion,
  MessageSquareText,
  Plus,
  Radar,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CitySelector } from "@/components/leads/instagram/CitySelector";
import { NichoSelector } from "@/components/leads/NichoSelector";
import {
  INSTAGRAM_UFS,
  InstagramField,
  InstagramRangeField,
} from "@/components/instagram/shared/InstagramDiscoveryFields";
import {
  archiveInstagramCompetitor,
  estimateCompetitorCost,
  listInstagramCompetitors,
  monitorInstagramCompetitor,
  saveInstagramCompetitor,
  type InstagramCompetitor,
  type InstagramCompetitorAlert,
  type InstagramCompetitorSnapshot,
} from "@/services/instagram-competitors";

const DEFAULT_MONITOR = { maxPosts: 12, commentPosts: 3, commentsPerPost: 30 };
const EMPTY_FORM = {
  username: "",
  label: "",
  niche: "",
  city: "",
  state: "",
  monitoringIntervalHours: 168,
};

export function CompetitorIntelligence() {
  const [competitors, setCompetitors] = useState<InstagramCompetitor[]>([]);
  const [snapshots, setSnapshots] = useState<InstagramCompetitorSnapshot[]>([]);
  const [alerts, setAlerts] = useState<InstagramCompetitorAlert[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [monitor, setMonitor] = useState(DEFAULT_MONITOR);

  useEffect(() => {
    let active = true;
    void listInstagramCompetitors()
      .then((data) => {
        if (!active) return;
        setCompetitors(data.competitors);
        setSnapshots(data.snapshots);
        setAlerts(data.alerts);
        setSelectedId((current) =>
          current && data.competitors.some((item) => item.id === current)
            ? current
            : (data.competitors[0]?.id ?? null),
        );
      })
      .catch((error) => {
        if (active)
          toast.error(error instanceof Error ? error.message : "Falha ao carregar concorrentes.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const reload = async (preferredId?: string) => {
    const data = await listInstagramCompetitors();
    setCompetitors(data.competitors);
    setSnapshots(data.snapshots);
    setAlerts(data.alerts);
    setSelectedId((current) => {
      const requested = preferredId ?? current;
      return requested && data.competitors.some((item) => item.id === requested)
        ? requested
        : (data.competitors[0]?.id ?? null);
    });
  };

  const selected = competitors.find((item) => item.id === selectedId) ?? null;
  const selectedSnapshots = useMemo(
    () => snapshots.filter((item) => item.competitor_id === selectedId),
    [selectedId, snapshots],
  );
  const latest = selectedSnapshots[0] ?? null;
  const selectedAlerts = useMemo(
    () => alerts.filter((item) => item.competitor_id === selectedId),
    [alerts, selectedId],
  );
  const estimatedCost = estimateCompetitorCost({ competitorId: selectedId ?? "", ...monitor });

  const analyze = async (competitorId: string) => {
    setRunningId(competitorId);
    try {
      const response = await monitorInstagramCompetitor({ competitorId, ...monitor });
      await reload(competitorId);
      toast.success(
        `${response.stats?.posts ?? 0} conteúdos e ${response.stats?.comments ?? 0} comentários analisados.`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Monitoramento não concluído.");
    } finally {
      setRunningId(null);
    }
  };

  const save = async () => {
    if (!form.username.trim()) return toast.error("Informe o @ do concorrente.");
    if (!form.niche) return toast.error("Escolha o nicho do concorrente.");
    setSaving(true);
    try {
      const competitor = await saveInstagramCompetitor({
        ...form,
        username: form.username.replace(/^@/, "").trim(),
      });
      await reload(competitor.id);
      setForm(EMPTY_FORM);
      setDialogOpen(false);
      toast.success("Concorrente adicionado. Iniciando o primeiro snapshot.");
      await analyze(competitor.id);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível salvar o concorrente.",
      );
    } finally {
      setSaving(false);
    }
  };

  const archive = async (competitorId: string) => {
    try {
      await archiveInstagramCompetitor(competitorId);
      await reload();
      toast.success("Concorrente removido do monitoramento.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível arquivar.");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-80 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="h-1 bg-[linear-gradient(90deg,var(--instagram-orange),var(--instagram-pink),var(--instagram-purple))]" />
        <div className="flex flex-col justify-between gap-4 p-5 lg:flex-row lg:items-start">
          <div className="flex gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Eye className="size-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold">Competitor Intelligence</h2>
                <Badge>
                  <Sparkles className="mr-1 size-3" /> Fase 3
                </Badge>
              </div>
              <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                Acompanha crescimento, conteúdo, audiência e oportunidades nos comentários. Cada
                atualização cria um snapshot histórico comparável.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="rounded-xl border border-border bg-muted/40 px-4 py-2 text-sm">
              <span className="text-muted-foreground">Próxima análise: </span>
              <strong>US$ {estimatedCost.toFixed(2)}</strong>
            </div>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="size-4" /> Adicionar concorrente
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Monitorados</h3>
            <Badge variant="secondary">{competitors.length}</Badge>
          </div>
          {competitors.map((competitor) => {
            const snapshot = snapshots.find((item) => item.competitor_id === competitor.id);
            const active = competitor.id === selectedId;
            return (
              <button
                key={competitor.id}
                type="button"
                onClick={() => setSelectedId(competitor.id)}
                aria-pressed={active}
                className={[
                  "w-full rounded-2xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:bg-muted/40",
                ].join(" ")}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="size-11 border border-border">
                    <AvatarImage
                      src={snapshot?.profile_pic_url ?? undefined}
                      alt={`Avatar de @${competitor.username}`}
                    />
                    <AvatarFallback>{competitor.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="truncate font-medium">
                      {competitor.label || snapshot?.full_name || `@${competitor.username}`}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      @{competitor.username}
                    </div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Seguidores</span>
                    <div className="font-medium">{compact(snapshot?.followers_count ?? 0)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Engajamento</span>
                    <div className="font-medium">
                      {Number(snapshot?.engagement_rate ?? 0).toFixed(2)}%
                    </div>
                  </div>
                </div>
                {competitor.last_analyzed_at ? (
                  <div className="mt-3 text-[11px] text-muted-foreground">
                    Atualizado {relativeDate(competitor.last_analyzed_at)}
                  </div>
                ) : (
                  <div className="mt-3 text-[11px] text-primary">Aguardando primeiro snapshot</div>
                )}
              </button>
            );
          })}
          {!competitors.length ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
              <Radar className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium">Nenhum concorrente monitorado</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Adicione um perfil para criar o primeiro snapshot.
              </p>
            </div>
          ) : null}
        </aside>

        {selected ? (
          <div className="min-w-0 space-y-5">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">@{selected.username}</h3>
                    <Badge variant="outline">{selected.niche}</Badge>
                    {selected.city ? (
                      <Badge variant="outline">
                        <MapPin className="mr-1 size-3" /> {selected.city}/{selected.state}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Atualizações geram histórico; o cache evita pagar novamente por dados recentes.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" asChild>
                    <a
                      href={`https://instagram.com/${selected.username}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Instagram className="size-4" /> Abrir perfil
                    </a>
                  </Button>
                  <Button onClick={() => analyze(selected.id)} disabled={runningId === selected.id}>
                    {runningId === selected.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <RefreshCw className="size-4" />
                    )}
                    {runningId === selected.id ? "Atualizando…" : "Atualizar inteligência"}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Arquivar concorrente">
                        <Archive />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Arquivar @{selected.username}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          O histórico será preservado, mas o perfil sairá da lista de monitoramento.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => archive(selected.id)}>
                          Arquivar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <InstagramRangeField
                  label="Posts/Reels"
                  value={monitor.maxPosts}
                  min={5}
                  max={30}
                  onChange={(value) =>
                    setMonitor((current) => ({
                      ...current,
                      maxPosts: value,
                      commentPosts: Math.min(current.commentPosts, value),
                    }))
                  }
                />
                <InstagramRangeField
                  label="Posts com comentários"
                  value={monitor.commentPosts}
                  min={1}
                  max={5}
                  onChange={(value) =>
                    setMonitor((current) => ({ ...current, commentPosts: value }))
                  }
                />
                <InstagramRangeField
                  label="Comentários por post"
                  value={monitor.commentsPerPost}
                  min={10}
                  max={100}
                  step={10}
                  onChange={(value) =>
                    setMonitor((current) => ({ ...current, commentsPerPost: value }))
                  }
                />
              </div>
            </div>
            {latest ? (
              <CompetitorDashboard
                competitor={selected}
                snapshot={latest}
                snapshots={selectedSnapshots}
                alerts={selectedAlerts}
              />
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
                <History className="mx-auto size-10 text-muted-foreground" />
                <h3 className="mt-4 font-semibold">Primeiro snapshot ainda não criado</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Clique em Atualizar inteligência para coletar os dados públicos.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
            Selecione ou adicione um concorrente.
          </div>
        )}
      </section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Adicionar concorrente</DialogTitle>
            <DialogDescription>
              O primeiro snapshot analisará perfil, conteúdo recente e comentários públicos.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <InstagramField label="@ do concorrente">
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={form.username}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, username: event.target.value }))
                  }
                  placeholder="concorrente"
                  className="pl-9"
                />
              </div>
            </InstagramField>
            <InstagramField label="Nome interno (opcional)">
              <Input
                value={form.label}
                onChange={(event) =>
                  setForm((current) => ({ ...current, label: event.target.value }))
                }
                placeholder="Principal concorrente"
              />
            </InstagramField>
            <div className="sm:col-span-2">
              <InstagramField label="Nicho">
                <NichoSelector
                  value={form.niche}
                  onSelect={(niche) => setForm((current) => ({ ...current, niche }))}
                  disabled={saving}
                />
              </InstagramField>
            </div>
            <InstagramField label="Estado">
              <Select
                value={form.state}
                onValueChange={(state) => setForm((current) => ({ ...current, state, city: "" }))}
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
                uf={form.state}
                value={form.city}
                onChange={(city) => setForm((current) => ({ ...current, city }))}
                disabled={saving}
              />
            </InstagramField>
            <div className="sm:col-span-2">
              <InstagramField label="Frequência planejada">
                <Select
                  value={String(form.monitoringIntervalHours)}
                  onValueChange={(value) =>
                    setForm((current) => ({ ...current, monitoringIntervalHours: Number(value) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24">Diária</SelectItem>
                    <SelectItem value="72">A cada 3 dias</SelectItem>
                    <SelectItem value="168">Semanal</SelectItem>
                    <SelectItem value="720">Mensal</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Nesta fase, a atualização é acionada pela tela; a frequência prepara a próxima
                  coleta.
                </p>
              </InstagramField>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}{" "}
              Adicionar e analisar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CompetitorDashboard({
  competitor,
  snapshot,
  snapshots,
  alerts,
}: {
  competitor: InstagramCompetitor;
  snapshot: InstagramCompetitorSnapshot;
  snapshots: InstagramCompetitorSnapshot[];
  alerts: InstagramCompetitorAlert[];
}) {
  const comments = snapshot.comment_summary;
  const relatedProfiles = normalizeRelatedProfiles(snapshot.profile_snapshot);
  const chartData = [...snapshots].reverse().map((item) => ({
    date: new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(
      new Date(item.captured_at),
    ),
    seguidores: item.followers_count,
    engajamento: item.engagement_rate,
  }));
  return (
    <Tabs defaultValue="overview">
      <TabsList className="grid h-auto w-full grid-cols-2 p-1 lg:w-fit lg:grid-cols-4">
        <TabsTrigger value="overview">
          <BarChart3 /> Visão geral
        </TabsTrigger>
        <TabsTrigger value="audience">
          <Users /> Audiência
        </TabsTrigger>
        <TabsTrigger value="strategy">
          <Hash /> Estratégia
        </TabsTrigger>
        <TabsTrigger value="alerts">
          <BellRing /> Alertas{" "}
          {alerts.length ? (
            <Badge variant="secondary" className="ml-1">
              {alerts.length}
            </Badge>
          ) : null}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="mt-5 space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi
            icon={Users}
            label="Seguidores"
            value={compact(snapshot.followers_count)}
            detail={delta(snapshot.follower_delta)}
          />
          <Kpi
            icon={Activity}
            label="Engajamento robusto"
            value={`${Number(snapshot.engagement_rate).toFixed(2)}%`}
            detail={delta(snapshot.engagement_delta, " p.p.")}
          />
          <Kpi
            icon={CalendarClock}
            label="Frequência"
            value={`${Number(snapshot.posting_frequency_weekly).toFixed(1)}/sem`}
            detail={`${snapshot.posts_delta >= 0 ? "+" : ""}${snapshot.posts_delta} posts`}
          />
          <Kpi
            icon={Target}
            label="Oportunidades"
            value={String(comments.intentOpportunities?.length ?? 0)}
            detail={`${comments.recurringCommenters?.length ?? 0} recorrentes`}
          />
        </div>
        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <Panel title="Evolução histórica" subtitle={`${snapshots.length} snapshots preservados`}>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis
                    yAxisId="followers"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    domain={["auto", "auto"]}
                  />
                  <YAxis
                    yAxisId="engagement"
                    orientation="right"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                  />
                  <Tooltip />
                  <Line
                    yAxisId="followers"
                    type="monotone"
                    dataKey="seguidores"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    yAxisId="engagement"
                    type="monotone"
                    dataKey="engajamento"
                    stroke="var(--instagram-pink)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>
          <Panel title="Saúde do conteúdo" subtitle="Métricas resistentes a outliers">
            <div className="space-y-4">
              <Metric label="Score de conteúdo" value={snapshot.content_score} />
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Stat label="Média de likes" value={compact(snapshot.average_likes)} />
                <Stat label="Mediana de likes" value={compact(snapshot.median_likes)} />
                <Stat label="Média comentários" value={compact(snapshot.average_comments)} />
                <Stat label="Mediana comentários" value={compact(snapshot.median_comments)} />
              </div>
            </div>
          </Panel>
        </div>
        <Panel
          title="Conteúdos que mais mobilizam"
          subtitle="Ranking por curtidas + peso de comentários"
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {snapshot.top_posts.slice(0, 5).map((post) => (
              <a
                key={post.url}
                href={post.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-border p-4 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{post.contentType}</Badge>
                  <ExternalLink className="size-3.5 text-muted-foreground" />
                </div>
                <p className="mt-3 line-clamp-3 text-sm">
                  {post.caption || "Sem legenda pública."}
                </p>
                <div className="mt-3 flex gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Heart className="size-3" /> {compact(post.likes)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquareText className="size-3" /> {compact(post.comments)}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </Panel>
      </TabsContent>
      <TabsContent value="audience" className="mt-5 space-y-5">
        <div className="grid gap-5 lg:grid-cols-2">
          <Panel
            title="Leads quentes nos comentários"
            subtitle={`${comments.purchaseIntentCount ?? 0} sinais fortes de intenção`}
          >
            {comments.intentOpportunities?.length ? (
              <div className="space-y-2">
                {comments.intentOpportunities.slice(0, 10).map((item) => (
                  <div
                    key={`${item.username}-${item.text}`}
                    className="rounded-xl border border-border p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <a
                        href={`https://instagram.com/${item.username}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-primary hover:underline"
                      >
                        @{item.username}
                      </a>
                      <Badge>{item.score}/100</Badge>
                    </div>
                    <p className="mt-2 text-sm">“{item.text}”</p>
                  </div>
                ))}
              </div>
            ) : (
              <Empty text="Nenhuma intenção comercial forte nesta amostra." />
            )}
          </Panel>
          <Panel
            title="Comentaristas recorrentes"
            subtitle="Pessoas que voltam e demonstram afinidade"
          >
            {comments.recurringCommenters?.length ? (
              <div className="space-y-2">
                {comments.recurringCommenters.slice(0, 10).map((item) => (
                  <div
                    key={item.username}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border p-3"
                  >
                    <div>
                      <a
                        href={`https://instagram.com/${item.username}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-primary hover:underline"
                      >
                        @{item.username}
                      </a>
                      <p className="line-clamp-1 text-xs text-muted-foreground">
                        {item.bestEvidence}
                      </p>
                    </div>
                    <Badge variant="secondary">{item.count}x</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <Empty text="É preciso mais de um comentário por pessoa para medir recorrência." />
            )}
          </Panel>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <Panel
            title="Objeções da audiência"
            subtitle={`${comments.objectionCount ?? 0} sinais encontrados`}
          >
            {comments.objections?.length ? (
              <div className="space-y-3">
                {comments.objections.map((item) => (
                  <div key={item.category}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="capitalize">{item.category}</span>
                      <strong>{item.count}</strong>
                    </div>
                    <Progress value={Math.min(100, item.count * 20)} className="h-1.5" />
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {item.examples[0]}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <Empty text="Nenhuma objeção repetida detectada." />
            )}
          </Panel>
          <Panel title="Assuntos das perguntas" subtitle="Vocabulário mais frequente nas dúvidas">
            <div className="flex flex-wrap gap-2">
              {comments.questionTopics?.map((item) => (
                <Badge key={item.name} variant="outline">
                  {item.name} · {item.count}
                </Badge>
              ))}
            </div>
            {!comments.questionTopics?.length ? (
              <Empty text="Nenhuma pergunta pública na amostra." />
            ) : null}
          </Panel>
        </div>
      </TabsContent>
      <TabsContent value="strategy" className="mt-5 space-y-5">
        <div className="grid gap-5 lg:grid-cols-2">
          <Panel title="Hashtags mais usadas" subtitle="Frequência na amostra recente">
            <RankList icon={Hash} items={snapshot.hashtags} prefix="#" />
          </Panel>
          <Panel title="Locais utilizados" subtitle="Onde o concorrente marca presença">
            <RankList icon={MapPin} items={snapshot.locations} />
          </Panel>
        </div>
        <Panel title="Mix de formatos" subtitle="Distribuição dos conteúdos analisados">
          <div className="grid gap-3 sm:grid-cols-3">
            {Object.entries(snapshot.format_counts).map(([format, count]) => (
              <div key={format} className="rounded-xl border border-border p-4">
                <div className="text-2xl font-semibold">{count}</div>
                <div className="text-xs capitalize text-muted-foreground">{format}</div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel
          title="Perfis relacionados"
          subtitle="Sugestões públicas do Instagram para expandir o radar"
        >
          {relatedProfiles.length ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {relatedProfiles.slice(0, 12).map((profile) => (
                <a
                  key={profile.username}
                  href={`https://instagram.com/${profile.username}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Avatar className="size-10">
                    <AvatarImage src={profile.avatarUrl} alt="" />
                    <AvatarFallback>{profile.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{profile.fullName}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      @{profile.username}
                    </div>
                  </div>
                  <ExternalLink className="size-3.5 text-muted-foreground" />
                </a>
              ))}
            </div>
          ) : (
            <Empty text="O Instagram não retornou perfis relacionados neste snapshot." />
          )}
        </Panel>
      </TabsContent>
      <TabsContent value="alerts" className="mt-5">
        <Panel
          title="Alertas e oportunidades"
          subtitle={`Sinais ligados a @${competitor.username}`}
        >
          {alerts.length ? (
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex gap-3 rounded-xl border border-border p-4">
                  <AlertIcon type={alert.alert_type} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <strong className="text-sm">{alert.title}</strong>
                      <Badge
                        variant={
                          alert.severity === "warning"
                            ? "destructive"
                            : alert.severity === "opportunity"
                              ? "default"
                              : "secondary"
                        }
                      >
                        {alert.score}/100
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{alert.description}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {relativeDate(alert.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty text="Nenhum alerta relevante neste histórico." />
          )}
        </Panel>
      </TabsContent>
    </Tabs>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between">
        <Icon className="size-4 text-primary" />
        <span className="text-xs text-muted-foreground">{detail}</span>
      </div>
      <div className="mt-3 text-2xl font-semibold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}
function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-sm">
        <span>{label}</span>
        <strong>{value}/100</strong>
      </div>
      <Progress value={value} />
    </div>
  );
}
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/40 p-3">
      <div className="font-semibold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <div className="py-8 text-center text-sm text-muted-foreground">
      <Lightbulb className="mx-auto mb-2 size-6" />
      {text}
    </div>
  );
}
function RankList({
  icon: Icon,
  items,
  prefix = "",
}: {
  icon: typeof Hash;
  items: Array<{ name: string; count: number }>;
  prefix?: string;
}) {
  return items.length ? (
    <div className="space-y-2">
      {items.slice(0, 12).map((item, index) => (
        <div
          key={item.name}
          className="flex items-center gap-3 rounded-xl border border-border p-3"
        >
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
            {index + 1}
          </span>
          <Icon className="size-4 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate text-sm">
            {prefix}
            {item.name}
          </span>
          <Badge variant="secondary">{item.count}x</Badge>
        </div>
      ))}
    </div>
  ) : (
    <Empty text="Nenhum sinal desta categoria na amostra." />
  );
}
function AlertIcon({ type }: { type: InstagramCompetitorAlert["alert_type"] }) {
  const Icon =
    type === "purchase_intent"
      ? Target
      : type === "recurring_commenter"
        ? Users
        : type === "follower_growth" || type === "engagement_jump"
          ? TrendingUp
          : type === "objection_spike"
            ? AlertTriangle
            : type === "new_hashtag"
              ? Hash
              : BellRing;
  return (
    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
      <Icon className="size-4" />
    </div>
  );
}
function compact(value: number) {
  return new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 }).format(
    Number(value ?? 0),
  );
}
function delta(value: number, suffix = "") {
  const number = Number(value ?? 0);
  return `${number > 0 ? "+" : ""}${number.toFixed(suffix ? 2 : 0)}${suffix}`;
}
function relativeDate(value: string) {
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000);
  if (days <= 0) return "hoje";
  if (days === 1) return "há 1 dia";
  return `há ${days} dias`;
}

function normalizeRelatedProfiles(snapshot: Record<string, unknown> | null) {
  const rawProfiles = snapshot?.relatedProfiles;
  if (!Array.isArray(rawProfiles)) return [];
  return rawProfiles.flatMap((value) => {
    if (!value || typeof value !== "object") return [];
    const profile = value as Record<string, unknown>;
    const username = String(profile.username ?? profile.userName ?? "")
      .replace(/^@/, "")
      .trim();
    if (!username) return [];
    return [
      {
        username,
        fullName: String(profile.fullName ?? profile.name ?? username),
        avatarUrl: String(profile.profilePicUrlHD ?? profile.profilePicUrl ?? ""),
      },
    ];
  });
}
