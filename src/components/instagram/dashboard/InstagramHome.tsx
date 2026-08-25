import {
  ArrowRight,
  CheckCircle2,
  Crosshair,
  Database,
  Eye,
  Megaphone,
  MessageCircle,
  MousePointerClick,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { InstagramCampaign, InstagramOutreachTask } from "@/services/instagram";
import type { InstagramView } from "@/components/instagram/navigation/instagram-navigation";

export function InstagramHome({
  leadsCount,
  campaigns,
  tasks,
  selectedCampaignName,
  onNavigate,
}: {
  leadsCount: number;
  campaigns: InstagramCampaign[];
  tasks: InstagramOutreachTask[];
  selectedCampaignName?: string;
  onNavigate: (view: InstagramView) => void;
}) {
  const totalSent = campaigns.reduce((total, campaign) => total + campaign.sent, 0);
  const totalReplies = campaigns.reduce((total, campaign) => total + campaign.replied, 0);
  const readyTasks = tasks.filter((task) =>
    ["pending", "ready", "opened"].includes(task.state),
  ).length;
  const conversion = totalSent ? Math.round((totalReplies / totalSent) * 100) : 0;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_center,var(--instagram-pink),transparent_68%)] opacity-[0.09] lg:block" />
        <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:p-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-instagram-pink/20 bg-instagram-pink/5 px-3 py-1 text-xs font-semibold text-instagram-pink">
              <Sparkles className="size-3.5" />
              Central de prospecção
            </div>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
              Transforme sinais do Instagram em conversas comerciais.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
              Descubra quem já demonstra interesse, priorize os perfis certos e execute sua
              abordagem em um fluxo simples, mensurável e sem desperdiçar buscas.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button size="lg" onClick={() => onNavigate("hunter")}>
                <Crosshair className="size-4" /> Iniciar caça-clientes
              </Button>
              <Button size="lg" variant="outline" onClick={() => onNavigate("leads")}>
                Ver minha base <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-background/80 p-5 backdrop-blur-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Próxima ação
                </p>
                <h3 className="mt-1 font-semibold">Avance sua fila de abordagem</h3>
              </div>
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MousePointerClick className="size-4" />
              </span>
            </div>
            <div className="mt-5 rounded-xl bg-muted/60 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Aguardando ação</span>
                <strong className="tabular-nums">{readyTasks}</strong>
              </div>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {selectedCampaignName || "Crie uma campanha a partir dos seus perfis"}
              </p>
            </div>
            <Button
              className="mt-4 w-full"
              variant="secondary"
              onClick={() => onNavigate("campaigns")}
            >
              Abrir operação <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumo da operação">
        <MetricCard
          icon={Database}
          value={leadsCount}
          label="perfis na sua base"
          detail="Prontos para segmentar"
        />
        <MetricCard
          icon={Megaphone}
          value={campaigns.length}
          label="campanhas criadas"
          detail="Operações rastreáveis"
        />
        <MetricCard
          icon={MessageCircle}
          value={totalReplies}
          label="respostas registradas"
          detail={`${totalSent} abordagens enviadas`}
        />
        <MetricCard
          icon={Target}
          value={`${conversion}%`}
          label="taxa de resposta"
          detail="Sobre envios registrados"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(340px,0.7fr)]">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-instagram-pink">
                Seu fluxo
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight">
                Da descoberta à conversa
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Cada etapa tem um objetivo claro e reutiliza a inteligência já coletada.
              </p>
            </div>
            <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
              Base anti-duplicidade ativa
            </span>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <JourneyStep
              number="01"
              icon={Eye}
              title="Descobrir"
              text="Encontre intenção em nichos, comentários, conteúdos e concorrentes."
              action="Explorar fontes"
              onClick={() => onNavigate("discover")}
            />
            <JourneyStep
              number="02"
              icon={Users}
              title="Priorizar"
              text="Use score, contexto e sinais reais para trabalhar os melhores perfis."
              action="Ver perfis"
              onClick={() => onNavigate("leads")}
            />
            <JourneyStep
              number="03"
              icon={MessageCircle}
              title="Abordar"
              text="Personalize a conversa, acompanhe a resposta e registre o resultado."
              action="Abrir campanhas"
              onClick={() => onNavigate("campaigns")}
            />
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Eficiência
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight">
                Mais resultado por busca
              </h2>
            </div>
            <span className="flex size-10 items-center justify-center rounded-2xl bg-success/10 text-success">
              <CheckCircle2 className="size-5" />
            </span>
          </div>

          <div className="mt-6 space-y-5">
            <EfficiencyItem
              label="Leads preservados na base"
              value={leadsCount ? 100 : 0}
              detail={`${leadsCount} perfis disponíveis para reaproveitamento`}
            />
            <EfficiencyItem
              label="Campanhas com resposta"
              value={
                campaigns.length
                  ? Math.min(
                      100,
                      Math.round(
                        (campaigns.filter((campaign) => campaign.replied > 0).length /
                          campaigns.length) *
                          100,
                      ),
                    )
                  : 0
              }
              detail={`${campaigns.filter((campaign) => campaign.replied > 0).length} de ${campaigns.length} campanhas`}
            />
            <EfficiencyItem
              label="Resposta sobre abordagens"
              value={Math.min(100, conversion)}
              detail={`${totalReplies} respostas em ${totalSent} envios`}
            />
          </div>

          <button
            type="button"
            onClick={() => onNavigate("overview")}
            className="mt-6 flex w-full items-center justify-between rounded-xl border border-border px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-muted/60"
          >
            Ver desempenho completo
            <ArrowRight className="size-4 text-muted-foreground" />
          </button>
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  value,
  label,
  detail,
}: {
  icon: typeof Database;
  value: number | string;
  label: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
          <p className="mt-1 text-sm font-medium">{label}</p>
        </div>
        <span className="flex size-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function JourneyStep({
  number,
  icon: Icon,
  title,
  text,
  action,
  onClick,
}: {
  number: string;
  icon: typeof Eye;
  title: string;
  text: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-2xl border border-border bg-background p-4 text-left transition-all hover:-translate-y-0.5 hover:border-instagram-pink/30 hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="flex size-9 items-center justify-center rounded-xl bg-instagram-pink/10 text-instagram-pink">
          <Icon className="size-4" />
        </span>
        <span className="text-xs font-semibold tabular-nums text-muted-foreground/50">
          {number}
        </span>
      </div>
      <h3 className="mt-5 font-semibold">{title}</h3>
      <p className="mt-1 min-h-15 text-xs leading-5 text-muted-foreground">{text}</p>
      <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-instagram-pink">
        {action}{" "}
        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </button>
  );
}

function EfficiencyItem({
  label,
  value,
  detail,
}: {
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium">{label}</span>
        <span className="font-semibold tabular-nums">{value}%</span>
      </div>
      <Progress value={value} className="mt-2 h-1.5" />
      <p className="mt-1.5 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}
