import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
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
  MessageCircleMore,
  Radar,
  Search,
  Send,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { InstagramSearchPanel } from "@/components/leads/instagram/InstagramSearchPanel";
import { InstagramRunSummary } from "@/components/leads/instagram/InstagramResults";
import { CommentsHunter } from "@/components/instagram/comments/CommentsHunter";
import { CompetitorIntelligence } from "@/components/instagram/competitors/CompetitorIntelligence";
import { ContentDiscoveryHunter } from "@/components/instagram/content/ContentDiscoveryHunter";
import type { Estrategia, PedidoBusca } from "@/lib/fontes-prospeccao";
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

export function InstagramWorkspace() {
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
  const [tab, setTab] = useState("overview");

  const load = useCallback(async () => {
    try {
      const [profiles, instagramCampaigns] = await Promise.all([
        listarInstagramLeads(),
        listarCampanhasInstagram(),
      ]);
      setLeads(profiles);
      setCampaigns(instagramCampaigns);
      if (!selectedCampaign && instagramCampaigns[0]) setSelectedCampaign(instagramCampaigns[0].id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao carregar o Instagram.");
    } finally {
      setLoading(false);
    }
  }, [selectedCampaign]);

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
    if (!normalized) return leads;
    return leads.filter((item) =>
      [item.username, item.full_name, item.biography, item.lead.category, item.lead.city]
        .join(" ")
        .toLocaleLowerCase("pt-BR")
        .includes(normalized),
    );
  }, [leads, query]);

  const metrics = useMemo(() => {
    const followers = leads.reduce((total, lead) => total + Number(lead.followers_count ?? 0), 0);
    const engagement = leads.filter((lead) => lead.engagement_rate != null);
    return {
      profiles: leads.length,
      followers,
      engagement: engagement.length
        ? engagement.reduce((total, lead) => total + Number(lead.engagement_rate), 0) /
          engagement.length
        : 0,
      contactable: leads.filter(
        (lead) => lead.business_email || lead.business_phone || lead.external_url,
      ).length,
    };
  }, [leads]);

  const chartData = useMemo(() => {
    const ranges = [
      { label: "Até 1 mil", min: 0, max: 999 },
      { label: "1–5 mil", min: 1000, max: 4999 },
      { label: "5–20 mil", min: 5000, max: 19999 },
      { label: "20 mil+", min: 20000, max: Infinity },
    ];
    return ranges.map((range) => ({
      name: range.label,
      perfis: leads.filter((lead) => {
        const followers = Number(lead.followers_count ?? 0);
        return followers >= range.min && followers <= range.max;
      }).length,
    }));
  }, [leads]);

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
  };

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-5">
      <header className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="h-1.5 bg-[linear-gradient(90deg,var(--instagram-orange),var(--instagram-pink),var(--instagram-purple))]" />
        <div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,var(--instagram-orange),var(--instagram-pink),var(--instagram-purple))] text-white shadow-lg">
              <Instagram className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold">Instagram Prospect</h1>
                <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                  Ativo
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Descoberta, inteligência de perfil e abordagem assistida em um só ambiente.
              </p>
            </div>
          </div>
          <Button onClick={() => setTab("discover")}>
            <Search className="h-4 w-4" /> Nova prospecção
          </Button>
        </div>
      </header>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid h-auto w-full grid-cols-2 p-1 sm:grid-cols-4 lg:w-fit lg:grid-cols-7">
          <TabsTrigger value="overview">
            <BarChart3 /> Visão geral
          </TabsTrigger>
          <TabsTrigger value="discover">
            <Search /> Descobrir
          </TabsTrigger>
          <TabsTrigger value="comments">
            <MessageCircleMore /> Comentários
          </TabsTrigger>
          <TabsTrigger value="radar">
            <Radar /> Radar
          </TabsTrigger>
          <TabsTrigger value="competitors">
            <Eye /> Concorrentes
          </TabsTrigger>
          <TabsTrigger value="leads">
            <Users /> Perfis
          </TabsTrigger>
          <TabsTrigger value="campaigns">
            <Megaphone /> Direct
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-5 space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi
              icon={Users}
              label="Perfis qualificados"
              value={metrics.profiles.toLocaleString("pt-BR")}
            />
            <Kpi
              icon={Activity}
              label="Seguidores alcançáveis"
              value={compact(metrics.followers)}
            />
            <Kpi
              icon={Sparkles}
              label="Engajamento médio"
              value={`${metrics.engagement.toFixed(2)}%`}
            />
            <Kpi
              icon={Target}
              label="Com contato externo"
              value={metrics.contactable.toLocaleString("pt-BR")}
            />
          </div>
          <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
              <h2 className="font-semibold">Distribuição por audiência</h2>
              <p className="text-sm text-muted-foreground">
                Faixa real de seguidores dos perfis coletados.
              </p>
              <div className="mt-5 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                    <Tooltip cursor={{ fill: "var(--secondary)" }} />
                    <Bar dataKey="perfis" fill="var(--instagram-pink)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
              <h2 className="font-semibold">Próxima melhor ação</h2>
              <div className="mt-4 space-y-4">
                <Action
                  icon={Search}
                  title="Amplie a base"
                  text="Combine nicho, cidade e filtros para buscar perfis novos."
                  onClick={() => setTab("discover")}
                />
                <Action
                  icon={Eye}
                  title="Revise a inteligência"
                  text="Abra o perfil completo antes da abordagem."
                  onClick={() => setTab("leads")}
                />
                <Action
                  icon={Send}
                  title="Crie uma cadência"
                  text="Prepare mensagens personalizadas para envio manual seguro."
                  onClick={() => setTab("campaigns")}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="discover" className="mt-5">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
            <InstagramSearchPanel running={running} onBuscar={handleSearch} />
          </div>
          {lastRun?.resumo ? (
            <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
              <InstagramRunSummary resumo={lastRun.resumo} />
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="comments" className="mt-5">
          <CommentsHunter onLeadsChanged={load} />
        </TabsContent>

        <TabsContent value="radar" className="mt-5">
          <ContentDiscoveryHunter onLeadsChanged={load} />
        </TabsContent>

        <TabsContent value="competitors" className="mt-5">
          <CompetitorIntelligence />
        </TabsContent>

        <TabsContent value="leads" className="mt-5 space-y-4">
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
                <table className="w-full min-w-[1100px] text-sm">
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
        </TabsContent>

        <TabsContent value="campaigns" className="mt-5 grid gap-5 xl:grid-cols-[340px_1fr]">
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
        </TabsContent>
      </Tabs>

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
    </div>
  );
}

function Kpi({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-[var(--instagram-pink)]" />
      </div>
      <div className="mt-2 text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}
function Action({
  icon: Icon,
  title,
  text,
  onClick,
}: {
  icon: typeof Search;
  title: string;
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-start gap-3 rounded-xl border border-border p-3 text-left transition hover:bg-secondary/50"
    >
      <span className="rounded-lg bg-primary/10 p-2 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <span>
        <b className="block text-sm">{title}</b>
        <span className="text-xs text-muted-foreground">{text}</span>
      </span>
    </button>
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
  return (
    <tr className="border-t border-border hover:bg-secondary/30">
      <td className="px-4 py-3">
        <Checkbox checked={checked} onCheckedChange={(value) => onCheck(value === true)} />
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
