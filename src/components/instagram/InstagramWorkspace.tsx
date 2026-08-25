import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Eye,
  Instagram,
  Link as LinkIcon,
  Loader2,
  Mail,
  Megaphone,
  MessageCircle,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { InstagramSearchPanel } from "@/components/leads/instagram/InstagramSearchPanel";
import { InstagramRunSummary } from "@/components/leads/instagram/InstagramResults";
import { CommentsHunter } from "@/components/instagram/comments/CommentsHunter";
import { CompetitorIntelligence } from "@/components/instagram/competitors/CompetitorIntelligence";
import { ContentDiscoveryHunter } from "@/components/instagram/content/ContentDiscoveryHunter";
import { InstagramAnalyticsDashboard } from "@/components/instagram/dashboard/InstagramAnalyticsDashboard";
import { InstagramHome } from "@/components/instagram/dashboard/InstagramHome";
import {
  InstagramScoreBars,
  InstagramScoreControls,
  type InstagramScoreSort,
} from "@/components/instagram/shared/InstagramScoreV2";
import { InstagramInbox } from "@/components/instagram/inbox/InstagramInbox";
import { InstagramClientHunter } from "@/components/instagram/hunter/InstagramClientHunter";
import { InstagramAppShell } from "@/components/instagram/navigation/InstagramAppShell";
import {
  isInstagramView,
  type InstagramView,
} from "@/components/instagram/navigation/instagram-navigation";
import type { Estrategia, PedidoBusca } from "@/lib/fontes-prospeccao";
import {
  instagramScoreValue,
  isInstagramScoreV2,
  type InstagramScoreV2Result,
} from "@/lib/instagram-score-v2";
import { buscarRedes, type ColetaRedes } from "@/services/whatsapp";
import {
  atualizarTarefaInstagram,
  criarCampanhaInstagram,
  listarCampanhasInstagram,
  listarInstagramLeads,
  listarTarefasInstagram,
  type InstagramCampaign,
  type InstagramLead,
  type InstagramOutreachTask,
} from "@/services/instagram";
import { cn } from "@/lib/utils";

const TEMPLATE_PADRAO =
  "Oi, {{nome}}! Vi o trabalho de vocês em {{cidade}} e gostei muito do perfil. Posso te mostrar uma ideia rápida para transformar mais visitas do Instagram em oportunidades?";

export function InstagramWorkspace({ onExit }: { onExit: () => void }) {
  const [leads, setLeads] = useState<InstagramLead[]>([]);
  const [campaigns, setCampaigns] = useState<InstagramCampaign[]>([]);
  const [tasks, setTasks] = useState<InstagramOutreachTask[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [creating, setCreating] = useState(false);
  const [campaignOpen, setCampaignOpen] = useState(false);
  const [profile, setProfile] = useState<InstagramLead | null>(null);
  const [campaignName, setCampaignName] = useState("");
  const [message, setMessage] = useState(TEMPLATE_PADRAO);
  const [lastRun, setLastRun] = useState<ColetaRedes | null>(null);
  const [tab, setTab] = useState<InstagramView>("home");
  const [profileScoreSort, setProfileScoreSort] = useState<InstagramScoreSort>("total");
  const [profileMinScore, setProfileMinScore] = useState(0);
  const [dashboardRevision, setDashboardRevision] = useState(0);

  const load = useCallback(async () => {
    try {
      const [profiles, instagramCampaigns] = await Promise.all([
        listarInstagramLeads(),
        listarCampanhasInstagram(),
      ]);
      setLeads(profiles);
      setCampaigns(instagramCampaigns);
      setSelectedCampaign((current) => current || instagramCampaigns[0]?.id || "");
      setDashboardRevision((current) => current + 1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao carregar o Instagram.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!selectedCampaign) {
      setTasks([]);
      return;
    }
    void listarTarefasInstagram(selectedCampaign)
      .then(setTasks)
      .catch(() => setTasks([]));
  }, [selectedCampaign]);

  const handleSearch = async (strategy: Estrategia, order: PedidoBusca) => {
    setRunning(true);
    try {
      const result = await buscarRedes(strategy.id, order.campos, order.limite, {
        somenteNovos: order.somenteNovos,
      });
      setLastRun(result);
      if (!result.ok)
        throw new Error(result.motivo || result.detalhe || result.reason || "Busca falhou.");
      await load();
      setTab("leads");
      if (result.resumo?.motivoParada === "fonte_esgotada") {
        toast.warning(
          `O Instagram esgotou os perfis públicos disponíveis: ${result.resumo.entregues}/${result.resumo.meta} entregues.`,
        );
      } else {
        toast.success(`${result.resumo?.entregues ?? result.inseridos ?? 0} leads entregues.`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível concluir a busca.");
    } finally {
      setRunning(false);
    }
  };

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("pt-BR");
    return leads
      .filter(
        (item) =>
          !normalized ||
          [item.username, item.full_name, item.biography, item.lead.category, item.lead.city]
            .join(" ")
            .toLocaleLowerCase("pt-BR")
            .includes(normalized),
      )
      .filter((item) => profileScoreValue(item, "total") >= profileMinScore)
      .sort(
        (left, right) =>
          profileScoreValue(right, profileScoreSort) - profileScoreValue(left, profileScoreSort),
      );
  }, [leads, profileMinScore, profileScoreSort, query]);

  const selectedLeads = leads.filter((lead) => selected.has(lead.lead_id));

  const createCampaign = async () => {
    if (!campaignName.trim()) return toast.error("Informe o nome da campanha.");
    setCreating(true);
    try {
      const id = await criarCampanhaInstagram({
        nome: campaignName,
        mensagem: message,
        leads: selectedLeads,
      });
      await load();
      setSelectedCampaign(id);
      setSelected(new Set());
      setCampaignOpen(false);
      setTab("campaigns");
      toast.success("Campanha de Direct assistido criada.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao criar campanha.");
    } finally {
      setCreating(false);
    }
  };

  const updateTask = async (task: InstagramOutreachTask, state: string) => {
    await atualizarTarefaInstagram(task.id, state);
    setTasks(await listarTarefasInstagram(task.campanha_id));
    setCampaigns(await listarCampanhasInstagram());
    setDashboardRevision((current) => current + 1);
  };

  return (
    <InstagramAppShell activeView={tab} onViewChange={setTab} onExit={onExit}>
      {tab === "home" ? (
        <InstagramHome
          leadsCount={leads.length}
          campaigns={campaigns}
          tasks={tasks}
          selectedCampaignName={
            campaigns.find((campaign) => campaign.id === selectedCampaign)?.nome
          }
          onNavigate={setTab}
        />
      ) : null}

      {tab === "overview" ? (
        <div className="space-y-5">
          <InstagramAnalyticsDashboard refreshToken={dashboardRevision} />
        </div>
      ) : null}

      {tab === "hunter" ? <InstagramClientHunter /> : null}

      {tab === "discover" ? (
        <div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
            <InstagramSearchPanel running={running} onBuscar={handleSearch} />
          </div>
          {lastRun?.resumo ? (
            <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
              <InstagramRunSummary resumo={lastRun.resumo} />
            </div>
          ) : null}
        </div>
      ) : null}

      {tab === "comments" ? <CommentsHunter onLeadsChanged={load} /> : null}

      {tab === "radar" ? <ContentDiscoveryHunter onLeadsChanged={load} /> : null}

      {tab === "competitors" ? (
        <CompetitorIntelligence onNavigate={(view) => isInstagramView(view) && setTab(view)} />
      ) : null}

      {tab === "inbox" ? <InstagramInbox /> : null}

      {tab === "leads" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
            <div className="relative min-w-64 flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por perfil, nicho ou cidade"
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-3">
              <InstagramScoreControls
                sort={profileScoreSort}
                minScore={profileMinScore}
                onSortChange={setProfileScoreSort}
                onMinScoreChange={setProfileMinScore}
              />
              <span className="text-sm text-muted-foreground">{selected.size} selecionados</span>
              <Button
                disabled={!selected.size}
                onClick={() => {
                  setCampaignName(`Prospecção Instagram ${new Date().toLocaleDateString("pt-BR")}`);
                  setCampaignOpen(true);
                }}
              >
                <Megaphone className="h-4 w-4" /> Criar campanha
              </Button>
            </div>
          </div>

          {loading ? (
            <Loading />
          ) : filtered.length ? (
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1250px] text-sm">
                  <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="w-12 px-4 py-3">
                        <Checkbox
                          checked={selected.size === filtered.length && filtered.length > 0}
                          onCheckedChange={(checked) =>
                            setSelected(
                              checked ? new Set(filtered.map((lead) => lead.lead_id)) : new Set(),
                            )
                          }
                        />
                      </th>
                      <th className="px-4 py-3">Perfil</th>
                      <th className="px-4 py-3">Score v2</th>
                      <th className="px-4 py-3">Audiência</th>
                      <th className="px-4 py-3">Engajamento</th>
                      <th className="px-4 py-3">Local</th>
                      <th className="px-4 py-3">Canais</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((item) => (
                      <ProfileRow
                        key={item.lead_id}
                        item={item}
                        checked={selected.has(item.lead_id)}
                        onCheck={(checked) =>
                          setSelected((current) => {
                            const next = new Set(current);
                            if (checked) next.add(item.lead_id);
                            else next.delete(item.lead_id);
                            return next;
                          })
                        }
                        onOpen={() => setProfile(item)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <Empty
              title="Nenhum perfil qualificado ainda"
              text="Faça uma busca para montar sua base de prospecção no Instagram."
            />
          )}
        </div>
      ) : null}

      {tab === "campaigns" ? (
        <div className="grid gap-5 xl:grid-cols-[340px_1fr]">
          <aside className="space-y-3">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
              <h2 className="font-semibold">Campanhas de Direct</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Fluxo assistido e rastreável, sem automação não autorizada.
              </p>
            </div>
            {campaigns.map((campaign) => (
              <button
                key={campaign.id}
                onClick={() => setSelectedCampaign(campaign.id)}
                className={cn(
                  "w-full rounded-xl border bg-card p-4 text-left transition",
                  selectedCampaign === campaign.id
                    ? "border-primary ring-2 ring-primary/10"
                    : "border-border hover:border-primary/40",
                )}
              >
                <div className="font-medium">{campaign.nome}</div>
                <div className="mt-3 flex justify-between text-xs text-muted-foreground">
                  <span>
                    {campaign.sent}/{campaign.total} enviados
                  </span>
                  <span>{campaign.replied} respostas</span>
                </div>
                <Progress
                  value={campaign.total ? (campaign.sent / campaign.total) * 100 : 0}
                  className="mt-2 h-1.5"
                />
              </button>
            ))}
            {!campaigns.length && (
              <Empty
                title="Nenhuma campanha"
                text="Selecione perfis e prepare sua primeira abordagem."
              />
            )}
          </aside>
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
            <div className="border-b border-border p-5">
              <h2 className="font-semibold">Fila de abordagem</h2>
              <p className="text-sm text-muted-foreground">
                Copie a mensagem, abra o perfil e registre o que aconteceu.
              </p>
            </div>
            <div className="divide-y divide-border">
              {tasks.map((task) => (
                <TaskRow key={task.id} task={task} onUpdate={updateTask} />
              ))}
              {!tasks.length && (
                <div className="p-8">
                  <Empty
                    title="Fila vazia"
                    text="Escolha uma campanha ou crie uma nova a partir dos perfis."
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <ProfileDialog profile={profile} onClose={() => setProfile(null)} />
      <Dialog open={campaignOpen} onOpenChange={setCampaignOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar campanha de Direct assistido</DialogTitle>
            <DialogDescription>
              {selectedLeads.length} perfis selecionados. As variáveis serão personalizadas por
              lead.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="campaign-name">Nome</Label>
              <Input
                id="campaign-name"
                value={campaignName}
                onChange={(event) => setCampaignName(event.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="campaign-message">Mensagem</Label>
              <Textarea
                id="campaign-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={7}
                className="mt-1.5"
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                Variáveis: {"{{nome}}"}, {"{{usuario}}"}, {"{{cidade}}"}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCampaignOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => void createCampaign()} disabled={creating}>
              {creating ? <Loader2 className="animate-spin" /> : <Megaphone />} Criar fila
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </InstagramAppShell>
  );
}

function ProfileRow({
  item,
  checked,
  onCheck,
  onOpen,
}: {
  item: InstagramLead;
  checked: boolean;
  onCheck: (value: boolean) => void;
  onOpen: () => void;
}) {
  const scoreV2 = instagramProfileScore(item);
  return (
    <tr className="border-t border-border hover:bg-secondary/30">
      <td className="px-4 py-3">
        <Checkbox checked={checked} onCheckedChange={(value) => onCheck(value === true)} />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-primary/10 px-2.5 py-1 font-semibold text-primary">
            {scoreV2?.total ?? item.lead.score}
          </span>
          {scoreV2 ? (
            <span className="text-[11px] leading-4 text-muted-foreground">
              I {scoreV2.scores.intent} · F {scoreV2.scores.fit}
              <br />A {scoreV2.scores.activity} · R {scoreV2.scores.authenticity}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">score legado</span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={item.profile_pic_url ?? undefined} alt={item.username} />
            <AvatarFallback>{item.username.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="max-w-64">
            <div className="flex items-center gap-1.5 font-semibold">
              {item.full_name || item.lead.business_name}
              {item.verified && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
            </div>
            <div className="truncate text-xs text-muted-foreground">
              @{item.username} ·{" "}
              {item.business_category || item.lead.category || "Perfil profissional"}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <b>{compact(Number(item.followers_count ?? 0))}</b>
        <div className="text-xs text-muted-foreground">
          {compact(Number(item.posts_count ?? 0))} posts
        </div>
      </td>
      <td className="px-4 py-3 tabular-nums">
        {item.engagement_rate != null ? `${Number(item.engagement_rate).toFixed(2)}%` : "—"}
      </td>
      <td className="px-4 py-3">
        {[item.lead.city, item.lead.state].filter(Boolean).join("/") || "—"}
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-1.5">
          {item.lead.instagram_url && <Badge icon={Instagram} text="DM" />}
          {item.business_phone && <Badge icon={MessageCircle} text="WhatsApp" />}
          {item.business_email && <Badge icon={Mail} text="E-mail" />}
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <Button size="sm" variant="outline" onClick={onOpen}>
          <Eye className="h-4 w-4" /> Inteligência
        </Button>
      </td>
    </tr>
  );
}
function Badge({ icon: Icon, text }: { icon: typeof Instagram; text: string }) {
  return (
    <span
      title={text}
      className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-xs"
    >
      <Icon className="h-3 w-3" />
      {text}
    </span>
  );
}
function TaskRow({
  task,
  onUpdate,
}: {
  task: InstagramOutreachTask;
  onUpdate: (task: InstagramOutreachTask, state: string) => Promise<void>;
}) {
  const sent = ["sent", "replied", "interested", "converted"].includes(task.state);
  return (
    <div className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-medium">{task.lead?.business_name || "Perfil Instagram"}</div>
          <span
            className={cn(
              "mt-1 inline-flex rounded-full px-2 py-0.5 text-xs",
              sent ? "bg-success/10 text-success" : "bg-secondary text-muted-foreground",
            )}
          >
            {task.state}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              void navigator.clipboard
                .writeText(task.message_text)
                .then(() => toast.success("Mensagem copiada."))
            }
          >
            <Copy className="h-4 w-4" /> Copiar
          </Button>
          {task.lead?.instagram_url && (
            <Button size="sm" variant="outline" asChild>
              <a
                href={task.lead.instagram_url}
                target="_blank"
                rel="noreferrer"
                onClick={() => void onUpdate(task, "opened")}
              >
                <Instagram className="h-4 w-4" /> Abrir perfil
              </a>
            </Button>
          )}
          <Button size="sm" disabled={sent} onClick={() => void onUpdate(task, "sent")}>
            <Check className="h-4 w-4" /> Marcar enviado
          </Button>
          {sent && (
            <Button size="sm" variant="outline" onClick={() => void onUpdate(task, "replied")}>
              <MessageCircle className="h-4 w-4" /> Respondeu
            </Button>
          )}
        </div>
      </div>
      <p className="mt-3 rounded-lg bg-secondary/50 p-3 text-sm text-muted-foreground">
        {task.message_text}
      </p>
    </div>
  );
}
function ProfileDialog({
  profile,
  onClose,
}: {
  profile: InstagramLead | null;
  onClose: () => void;
}) {
  const scoreV2 = profile ? instagramProfileScore(profile) : null;
  return (
    <Dialog open={Boolean(profile)} onOpenChange={(open) => !open && onClose()}>
      {profile && (
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile.profile_pic_url ?? undefined} />
                <AvatarFallback>{profile.username.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="flex items-center gap-2">
                  {profile.full_name || profile.lead.business_name}
                  {profile.verified && <CheckCircle2 className="h-4 w-4 text-primary" />}
                </DialogTitle>
                <DialogDescription>
                  @{profile.username} · {profile.business_category || "Perfil profissional"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-3">
            <MiniMetric value={compact(Number(profile.followers_count ?? 0))} label="seguidores" />
            <MiniMetric value={compact(Number(profile.following_count ?? 0))} label="seguindo" />
            <MiniMetric value={compact(Number(profile.posts_count ?? 0))} label="publicações" />
          </div>
          {profile.biography && (
            <div>
              <h3 className="mb-1 text-sm font-semibold">Bio</h3>
              <p className="whitespace-pre-wrap rounded-xl bg-secondary/50 p-3 text-sm">
                {profile.biography}
              </p>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-3">
            <MiniMetric
              value={
                profile.engagement_rate != null
                  ? `${Number(profile.engagement_rate).toFixed(2)}%`
                  : "—"
              }
              label="engajamento"
            />
            <MiniMetric value={compact(Number(profile.avg_likes ?? 0))} label="média de curtidas" />
            <MiniMetric
              value={compact(Number(profile.avg_comments ?? 0))}
              label="média de comentários"
            />
          </div>
          {scoreV2 ? (
            <div className="rounded-xl border border-border p-4">
              <InstagramScoreBars score={scoreV2} />
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {profile.external_url && (
              <Button variant="outline" asChild>
                <a href={profile.external_url} target="_blank" rel="noreferrer">
                  <LinkIcon className="h-4 w-4" /> Link da bio <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            )}
            <Button asChild>
              <a
                href={profile.lead.instagram_url ?? `https://instagram.com/${profile.username}`}
                target="_blank"
                rel="noreferrer"
              >
                <Instagram className="h-4 w-4" /> Abrir Instagram
              </a>
            </Button>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}
function instagramProfileScore(profile: InstagramLead): InstagramScoreV2Result | null {
  return isInstagramScoreV2(profile.score_v2) ? profile.score_v2 : null;
}
function profileScoreValue(profile: InstagramLead, dimension: InstagramScoreSort): number {
  const scoreV2 = instagramProfileScore(profile);
  if (scoreV2) return instagramScoreValue(scoreV2, dimension);
  if (dimension === "total") return Number(profile.lead_score ?? profile.lead.score ?? 0);
  return Number(
    dimension === "intent"
      ? profile.intent_score
      : dimension === "fit"
        ? profile.fit_score
        : dimension === "activity"
          ? profile.activity_score
          : profile.authenticity_score,
  );
}
function MiniMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-border p-3 text-center">
      <div className="font-semibold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="py-8 text-center">
      <Instagram className="mx-auto h-8 w-8 text-muted-foreground/50" />
      <div className="mt-3 font-medium">{title}</div>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
function Loading() {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" /> Carregando perfis…
    </div>
  );
}
function compact(value: number) {
  return new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 }).format(
    value,
  );
}
