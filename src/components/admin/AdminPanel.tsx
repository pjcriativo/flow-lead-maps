// Painel /admin — casca visual com DADOS REAIS (layout inspirado no LeadzenAI; identidade
// 100% Flow Leads: navy + dourado + serif nos títulos — nada de laranja).
// Regra anti-mentira: todo número vem de src/services/admin.ts (rastreável). O que não tem
// base ainda aparece como "Em breve" — nunca um placeholder inventado.
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  ShieldCheck,
  Users,
  CreditCard,
  Wallet,
  BarChart3,
  LifeBuoy,
  Settings,
  Search,
  Bell,
  Moon,
  Megaphone,
  Smartphone,
  Send,
  MessagesSquare,
  Globe,
  Repeat,
  CircleDollarSign,
  FileSearch,
  Contact,
  ArrowLeft,
  TerminalSquare,
  Radar,
  ChevronDown,
  ChevronRight,
  Tag,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Link } from "@tanstack/react-router";
import { FlowLeadsLogo } from "@/components/FlowLeadsLogo";
import { cn } from "@/lib/utils";
import { carregarPainelAdmin, type PainelAdmin } from "@/services/admin";
import { AdminRoles, AdminStaffs } from "./AdminStaffRoles";
import { AdminAllUsers, AdminSubscribers } from "./AdminUsers";
import { AdminPlanos } from "./AdminPlanos";
import { AdminTickets } from "./AdminTickets";
import { AdminRelatorios } from "./AdminRelatorios";
import { AdminConfiguracoes } from "./AdminConfiguracoes";
import { AdminNotificacoes } from "./AdminNotificacoes";
import { AdminCms } from "./AdminCms";
import { AdminPagamentos } from "./AdminPagamentos";
import { lerConfigPublica } from "@/services/config-publica";
import { setFusoHorario } from "@/lib/format";

/* ─────────────────────────── moldura ─────────────────────────── */

type TelaAdmin =
  | "dashboard"
  | "roles"
  | "staffs"
  | "all-users"
  | "subscribers"
  | "plans"
  | "tickets"
  | "relatorios"
  | "configuracoes"
  | "notificacoes"
  | "cms"
  | "pagamentos";

type ItemNav = {
  rotulo: string;
  Icon: typeof LayoutDashboard;
  tela?: TelaAdmin;
  emBreve?: boolean;
  filhos?: { rotulo: string; tela: TelaAdmin }[];
};

// Navegação em grupos, como no LeadzenAI: pais expansíveis com sub-itens dentro.
const NAV: ItemNav[] = [
  { rotulo: "Painel", Icon: LayoutDashboard, tela: "dashboard" },
  {
    rotulo: "Equipe & Papéis",
    Icon: ShieldCheck,
    filhos: [
      { rotulo: "Papéis", tela: "roles" },
      { rotulo: "Colaboradores", tela: "staffs" },
    ],
  },
  {
    rotulo: "Usuários",
    Icon: Users,
    filhos: [
      { rotulo: "Todos os usuários", tela: "all-users" },
      { rotulo: "Assinantes", tela: "subscribers" },
    ],
  },
  { rotulo: "Planos", Icon: Tag, tela: "plans" },
  { rotulo: "Pagamentos", Icon: Wallet, tela: "pagamentos" },
  { rotulo: "Relatórios", Icon: BarChart3, tela: "relatorios" },
  { rotulo: "Suporte", Icon: LifeBuoy, tela: "tickets" },
  { rotulo: "Notificações", Icon: Bell, tela: "notificacoes" },
  { rotulo: "Conteúdos do site", Icon: Globe, tela: "cms" },
  { rotulo: "Configurações", Icon: Settings, tela: "configuracoes" },
];

function EmBreve({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "rounded-full border border-gold/40 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-gold",
        className,
      )}
    >
      Em breve
    </span>
  );
}

function Sidebar({ tela, onNavegar }: { tela: TelaAdmin; onNavegar: (t: TelaAdmin) => void }) {
  // grupo aberto: começa aberto o grupo que contém a tela atual
  const grupoDaTela = NAV.find((n) => n.filhos?.some((f) => f.tela === tela))?.rotulo ?? null;
  const [aberto, setAberto] = useState<string | null>(grupoDaTela);

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex h-16 items-center border-b border-sidebar-border px-4">
        <FlowLeadsLogo variant="dark" className="h-7" />
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV.map((item) => {
          const { rotulo, Icon, tela: destino, emBreve, filhos } = item;
          // 1) item simples navegável
          if (destino) {
            return (
              <button
                key={rotulo}
                type="button"
                aria-current={tela === destino ? "page" : undefined}
                onClick={() => onNavegar(destino)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                  tela === destino
                    ? "border-l-2 border-gold bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                )}
              >
                <Icon className={cn("h-4 w-4", tela === destino && "text-gold")} />
                {rotulo}
              </button>
            );
          }
          // 2) grupo com sub-itens (expansível, como no print)
          if (filhos) {
            const estaAberto = aberto === rotulo;
            const filhoAtivo = filhos.some((f) => f.tela === tela);
            return (
              <div key={rotulo}>
                <button
                  type="button"
                  aria-expanded={estaAberto}
                  onClick={() => setAberto(estaAberto ? null : rotulo)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                    filhoAtivo
                      ? "text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                  )}
                >
                  <Icon className={cn("h-4 w-4", filhoAtivo && "text-gold")} />
                  {rotulo}
                  {estaAberto ? (
                    <ChevronDown className="ml-auto h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="ml-auto h-3.5 w-3.5" />
                  )}
                </button>
                {estaAberto && (
                  <div className="mt-1 space-y-0.5 pl-4">
                    {filhos.map((f) => (
                      <button
                        key={f.tela}
                        type="button"
                        aria-current={tela === f.tela ? "page" : undefined}
                        onClick={() => onNavegar(f.tela)}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-md border-l-2 px-3 py-1.5 text-[13px] transition-colors",
                          tela === f.tela
                            ? "border-gold bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
                            : "border-sidebar-border/40 text-sidebar-foreground/60 hover:text-sidebar-foreground",
                        )}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            tela === f.tela ? "bg-gold" : "bg-sidebar-foreground/40",
                          )}
                        />
                        {f.rotulo}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          }
          // 3) sem base ainda → visível, desabilitado, dizendo o porquê
          return (
            <div
              key={rotulo}
              aria-disabled="true"
              title="Este módulo ainda não tem base no produto — em breve."
              className={cn(
                "flex cursor-not-allowed items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/50",
                !emBreve && "",
              )}
            >
              <Icon className="h-4 w-4" />
              {rotulo}
              <EmBreve className="ml-auto" />
            </div>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-4">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 text-xs text-sidebar-foreground/70 hover:text-sidebar-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao app
        </Link>
        <p className="mt-2 text-[10px] uppercase tracking-wider text-sidebar-foreground/40">
          Painel v1.0
        </p>
      </div>
    </aside>
  );
}

function Topbar({ email }: { email: string }) {
  return (
    <header className="flex h-16 items-center gap-3 border-b border-border bg-card px-5">
      <div className="relative max-w-sm flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
        <input
          disabled
          placeholder="Busca — em breve"
          className="h-9 w-full cursor-not-allowed rounded-md border border-input bg-secondary/50 pl-9 pr-3 text-sm text-muted-foreground placeholder:text-muted-foreground/60"
        />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <button
          disabled
          title="Tema — em breve"
          className="flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-md border border-border text-muted-foreground/50"
        >
          <Moon className="h-4 w-4" />
        </button>
        <button
          disabled
          title="Notificações — em breve"
          className="flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-md border border-border text-muted-foreground/50"
        >
          <Bell className="h-4 w-4" />
        </button>
        <div className="ml-1 flex items-center gap-2 border-l border-border pl-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy font-serif text-sm text-gold">
            {email.charAt(0).toUpperCase()}
          </span>
          <span className="hidden text-xs text-muted-foreground md:block">{email}</span>
        </div>
      </div>
    </header>
  );
}

/* ─────────────────────────── blocos ─────────────────────────── */

function Kpi({
  rotulo,
  valor,
  detalhe,
  Icon,
  tom = "primario",
}: {
  rotulo: string;
  valor: string;
  detalhe?: string;
  Icon: typeof Users;
  tom?: "primario" | "sucesso" | "ouro" | "navy";
}) {
  const cores = {
    primario: "bg-accent text-primary",
    sucesso: "bg-[#16A34A]/10 text-[#16A34A]",
    ouro: "bg-gold/10 text-gold",
    navy: "bg-navy/5 text-navy",
  }[tom];
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/30 hover:shadow-lg">
      <div className="flex items-start gap-3">
        <span
          className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", cores)}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {rotulo}
          </p>
          <p className="mt-0.5 font-serif text-2xl leading-tight text-foreground">{valor}</p>
          {detalhe && (
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{detalhe}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiEmBreve({
  rotulo,
  motivo,
  Icon,
}: {
  rotulo: string;
  motivo: string;
  Icon: typeof Users;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-secondary/30 p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground/60">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {rotulo}
            </p>
            <EmBreve />
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground/80">{motivo}</p>
        </div>
      </div>
    </div>
  );
}

const usd = (v: number) => `US$ ${v.toFixed(2)}`;

/* status → cor da identidade (nunca laranja): ativa/rodando=azul, concluída=verde,
 * parada_teto=dourado (freio proposital), erro=vermelho, resto=cinza. */
const STATUS_CLS: Record<string, string> = {
  ativa: "bg-accent text-primary",
  rodando: "bg-accent text-primary",
  concluida: "bg-[#16A34A]/10 text-[#15803D]",
  parada_teto: "bg-gold/15 text-gold",
  erro: "bg-destructive/10 text-destructive",
};
function BadgeStatus({ s }: { s: string }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-medium",
        STATUS_CLS[s] ?? "bg-secondary text-muted-foreground",
      )}
    >
      {s.replace("_", " ")}
    </span>
  );
}

const DONUT_CORES: Record<string, string> = {
  ativa: "#2563EB",
  concluida: "#16A34A",
  pausada: "#B8933D",
};

/* ─────────────────────────── página ─────────────────────────── */

export function AdminPanel({ email }: { email: string }) {
  const [painel, setPainel] = useState<PainelAdmin | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [tela, setTela] = useState<TelaAdmin>("dashboard");

  const recarregar = () =>
    carregarPainelAdmin()
      .then((p) => setPainel(p))
      .catch((e) => setErro(e instanceof Error ? e.message : String(e)));

  useEffect(() => {
    let vivo = true;
    carregarPainelAdmin()
      .then((p) => vivo && setPainel(p))
      .catch((e) => vivo && setErro(e instanceof Error ? e.message : String(e)));
    // ⚙️ Configurações: fuso horário de exibição das datas do painel admin
    lerConfigPublica().then((c) => setFusoHorario(c.fuso_horario));
    return () => {
      vivo = false;
    };
  }, []);

  // aliases: um estado só (a Edge devolve a plataforma inteira), o JSX segue simples
  const kpis = painel?.kpis ?? null;
  const serie = painel
    ? {
        pontos: painel.serie14d,
        temAlgo: painel.serie14d.some((p) => p.leads > 0 || p.disparos > 0),
      }
    : null;
  const donut = painel?.statusCampanhas ?? null;
  const leads = painel?.leadsRecentes ?? [];
  const camps = painel?.campanhasRecentes ?? [];
  const buscas = painel?.buscasRecentes ?? [];
  const usuarios = painel?.usuarios ?? [];
  const snapshot = painel?.snapshot ?? null;

  if (tela !== "dashboard") {
    return (
      <div className="flex min-h-screen bg-background text-foreground">
        <Sidebar tela={tela} onNavegar={setTela} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar email={email} />
          <main className="mx-auto w-full max-w-[1100px] flex-1 space-y-5 p-5">
            {erro && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                Falha ao carregar: {erro}
              </p>
            )}
            {tela === "roles" && <AdminRoles roles={painel?.roles ?? []} onMudou={recarregar} />}
            {tela === "staffs" && (
              <AdminStaffs staffs={painel?.staffs ?? []} onMudou={recarregar} />
            )}
            {tela === "all-users" && (
              <AdminAllUsers usuarios={painel?.usuarios ?? []} onMudou={recarregar} />
            )}
            {tela === "subscribers" && <AdminSubscribers />}
            {tela === "plans" && <AdminPlanos planos={painel?.planos ?? []} onMudou={recarregar} />}
            {tela === "tickets" && <AdminTickets />}
            {tela === "relatorios" && <AdminRelatorios />}
            {tela === "configuracoes" && <AdminConfiguracoes />}
            {tela === "notificacoes" && <AdminNotificacoes />}
            {tela === "cms" && <AdminCms />}
            {tela === "pagamentos" && <AdminPagamentos />}
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar tela={tela} onNavegar={setTela} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar email={email} />
        <main className="mx-auto w-full max-w-[1280px] flex-1 space-y-5 p-5">
          <div className="rounded-xl border border-border bg-card p-5 text-center shadow-[var(--shadow-card)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
              Visão geral
            </p>
            <h1 className="mt-1 font-serif text-2xl text-foreground">Centro de comando</h1>
            <p className="mx-auto mt-1 max-w-xl text-sm text-muted-foreground">
              A plataforma inteira, todas as orgs — leads, campanhas, WhatsApp, buscas e gasto de
              API. Cada número vem de uma consulta real no servidor (papel de super admin verificado
              lá); o que ainda não tem base aparece como “Em breve”.
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              {/* ação REAL: leva à tela de usuários da plataforma */}
              <button
                onClick={() => setTela("all-users")}
                className="flex items-center gap-1.5 rounded-md border border-gold/40 bg-gold/10 px-3 py-1.5 text-xs font-semibold text-gold hover:bg-gold/15"
              >
                <Users className="h-3.5 w-3.5" /> Gerenciar usuários
              </button>
              <button
                onClick={() => setTela("tickets")}
                className="flex items-center gap-1.5 rounded-md border border-gold/40 bg-gold/10 px-3 py-1.5 text-xs font-semibold text-gold hover:bg-gold/15"
              >
                <LifeBuoy className="h-3.5 w-3.5" /> Tickets
              </button>
              {/* ação REAL: o agendador da automação (pg_cron) vive na aba Automação do app */}
              <a
                href="/dashboard?secao=automacao"
                className="flex items-center gap-1.5 rounded-md border border-gold/40 bg-gold/10 px-3 py-1.5 text-xs font-semibold text-gold hover:bg-gold/15"
              >
                <TerminalSquare className="h-3.5 w-3.5" /> Cron da automação
              </a>
            </div>
          </div>

          {erro && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              Falha ao carregar: {erro}
            </p>
          )}

          {/* KPIs reais (fonte: services/admin.ts — uma função por card) */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi
              rotulo="Total de leads"
              valor={kpis ? String(kpis.leads) : "…"}
              detalhe="tabela leads"
              Icon={Contact}
            />
            <Kpi
              rotulo="Campanhas"
              valor={kpis ? String(kpis.campanhas) : "…"}
              detalhe={kpis ? `${kpis.campanhasAtivas} ativas` : undefined}
              Icon={Megaphone}
            />
            <Kpi
              rotulo="Chips WhatsApp"
              valor={kpis ? String(kpis.chips) : "…"}
              detalhe={kpis ? `${kpis.chipsProntos} conectado(s) e pareado(s)` : undefined}
              Icon={Smartphone}
              tom="sucesso"
            />
            <Kpi
              rotulo="Disparos WhatsApp"
              valor={kpis ? String(kpis.disparos) : "…"}
              detalhe="wa_envios — só conta envio confirmado"
              Icon={Send}
              tom="navy"
            />
            <Kpi
              rotulo="Mensagens de conversa"
              valor={kpis ? String(kpis.conversas) : "…"}
              detalhe="wa_mensagens (recebidas + enviadas)"
              Icon={MessagesSquare}
            />
            <Kpi
              rotulo="Buscas de leads"
              valor={kpis ? String(kpis.buscasMaps + kpis.buscasRedes) : "…"}
              detalhe={kpis ? `${kpis.buscasMaps} Maps · ${kpis.buscasRedes} redes` : undefined}
              Icon={FileSearch}
            />
            <Kpi
              rotulo="Sites publicados"
              valor={kpis ? String(kpis.sites) : "…"}
              detalhe="sites_publicados"
              Icon={Globe}
              tom="sucesso"
            />
            <Kpi
              rotulo="Follow-ups enviados"
              valor={kpis ? String(kpis.followups) : "…"}
              detalhe="propostas.follow_up_count (medido)"
              Icon={Repeat}
              tom="navy"
            />
            <Kpi
              rotulo="Gasto de API no mês"
              valor={kpis ? usd(kpis.gastoMesUsd) : "…"}
              detalhe={kpis ? `livro-caixa · teto ${usd(kpis.tetoMesUsd)}` : undefined}
              Icon={CircleDollarSign}
              tom="ouro"
            />
            <Kpi
              rotulo="Usuários da plataforma"
              valor={kpis ? String(kpis.usuarios) : "…"}
              detalhe="count(profiles) — todas as orgs"
              Icon={Users}
              tom="ouro"
            />
            <Kpi
              rotulo="Buscas ativas"
              valor={snapshot ? String(snapshot.scrape.rodando) : "…"}
              detalhe={
                snapshot
                  ? `${snapshot.scrape.concluidas} concluída(s) · ${snapshot.scrape.paradasTeto} parada(s) no teto · ${snapshot.scrape.erros} erro(s)`
                  : undefined
              }
              Icon={Radar}
              tom="sucesso"
            />
            <Kpi
              rotulo="Tickets abertos"
              valor={kpis ? String(kpis.ticketsAbertos) : "…"}
              detalhe="aberto + em andamento — todas as orgs"
              Icon={LifeBuoy}
              tom="ouro"
            />
            {/* sem base no produto ainda → Em breve, não zero fake */}
            <KpiEmBreve
              rotulo="Falhas de envio"
              motivo="Métrica entra junto com o disparo real (hoje não há envios)."
              Icon={Bell}
            />
          </div>

          {/* gráficos — só dado real */}
          <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
            <div className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
              <h2 className="font-serif text-lg">Leads × Disparos</h2>
              <p className="text-xs text-muted-foreground">
                Últimos 14 dias — leads criados (leads.created_at) e disparos confirmados
                (wa_envios.enviado_em).
              </p>
              {serie && serie.temAlgo ? (
                <div className="mt-3 h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={serie.pontos}
                      margin={{ top: 4, right: 8, left: -18, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="dia" tick={{ fontSize: 10 }} stroke="#5B6472" />
                      <YAxis allowDecimals={false} tick={{ fontSize: 10 }} stroke="#5B6472" />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line
                        isAnimationActive={false}
                        type="monotone"
                        dataKey="leads"
                        name="Leads novos"
                        stroke="#2563EB"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        isAnimationActive={false}
                        type="monotone"
                        dataKey="disparos"
                        name="Disparos"
                        stroke="#B8933D"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="mt-3 flex h-56 items-center justify-center rounded-lg border border-dashed border-border bg-secondary/30 text-sm text-muted-foreground">
                  {serie ? "Sem atividade nos últimos 14 dias — nada a desenhar." : "Carregando…"}
                </div>
              )}
            </div>
            <div className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
              <h2 className="font-serif text-lg">Status das campanhas</h2>
              <p className="text-xs text-muted-foreground">Distribuição real (tabela campanhas).</p>
              {donut && donut.length > 0 ? (
                <div className="mt-3 h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        isAnimationActive={false}
                        data={donut}
                        dataKey="total"
                        nameKey="status"
                        innerRadius="62%"
                        outerRadius="88%"
                        paddingAngle={2}
                      >
                        {donut.map((d) => (
                          <Cell key={d.status} fill={DONUT_CORES[d.status] ?? "#5B6472"} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="mt-3 flex h-56 items-center justify-center rounded-lg border border-dashed border-border bg-secondary/30 text-sm text-muted-foreground">
                  {donut ? "Nenhuma campanha ainda." : "Carregando…"}
                </div>
              )}
            </div>
          </div>

          {/* retrato da plataforma — sinais rápidos de CRM/mensageria/prontidão (como no
              "Platform Snapshot" da referência), cada número de uma query real da Edge */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
            <h2 className="font-serif text-lg">Retrato da plataforma</h2>
            <p className="text-xs text-muted-foreground">
              Sinais rápidos de CRM, mensageria e prontidão dos leads — todas as orgs.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border border-border bg-secondary/20 p-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Follow-ups enviados
                </p>
                <p className="mt-0.5 font-serif text-xl">{kpis ? kpis.followups : "…"}</p>
                <p className="text-[11px] text-muted-foreground">
                  propostas.follow_up_count (medido pela edge)
                </p>
              </div>
              <div className="rounded-lg border border-dashed border-border bg-secondary/30 p-3">
                <div className="flex items-center gap-2">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Follow-ups hoje · atrasados · próximos
                  </p>
                  <EmBreve />
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground/80">
                  Não existe agendamento por data: o follow-up dispara por idade da proposta (edge
                  follow-up-cron). Contadores por dia entram quando houver agenda.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-secondary/20 p-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Modelos de mensagem
                </p>
                <p className="mt-0.5 font-serif text-xl">{snapshot ? snapshot.templatesWa : "…"}</p>
                <p className="text-[11px] text-muted-foreground">wa_scripts cadastrados</p>
              </div>
              <div className="rounded-lg border border-border bg-secondary/20 p-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Leads acionáveis
                </p>
                <p className="mt-0.5 font-serif text-xl">
                  {snapshot ? snapshot.leadsAcionaveis : "…"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  com canal de contato (sem_contato = false)
                </p>
              </div>
              <div className="rounded-lg border border-border bg-secondary/20 p-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Aprovados p/ disparo
                </p>
                <p className="mt-0.5 font-serif text-xl">
                  {snapshot ? snapshot.aprovadosDisparo : "…"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  campanha_leads estado 'aprovado'
                </p>
              </div>
              <div className="rounded-lg border border-border bg-secondary/20 p-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Segmentos de leads
                </p>
                <div className="mt-1.5 space-y-1">
                  {(snapshot?.segmentos ?? []).map((s) => (
                    <div key={s.categoria} className="flex items-center justify-between text-xs">
                      <span className="truncate text-muted-foreground">{s.categoria}</span>
                      <span className="ml-2 font-serif">{s.total}</span>
                    </div>
                  ))}
                  {!snapshot && <p className="text-xs text-muted-foreground">…</p>}
                </div>
              </div>
            </div>
          </div>

          {/* usuários — a plataforma real, org por org */}
          <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
            <div className="border-b border-border px-4 py-3">
              <h2 className="font-serif text-lg">Usuários da plataforma</h2>
              <p className="text-xs text-muted-foreground">
                Todas as contas (profiles) — e-mail, plano e desde quando.
              </p>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.email} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5 font-medium">{u.email}</td>
                    <td className="px-4 py-2.5 text-xs uppercase text-muted-foreground">
                      {u.plan ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">
                      desde {new Date(u.created_at).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                ))}
                {usuarios.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-center text-sm text-muted-foreground">
                      Carregando…
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* tabelas — dado real */}
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
              <div className="border-b border-border px-4 py-3">
                <h2 className="font-serif text-lg">Leads recentes</h2>
                <p className="text-xs text-muted-foreground">
                  Os últimos salvos — de qualquer org (o dono aparece em cada linha).
                </p>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {leads.map((l) => (
                    <tr key={l.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-2.5">
                        <p className="font-medium">{l.business_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {l.city ?? "—"} · {l.dono}
                        </p>
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">
                        {new Date(l.created_at).toLocaleDateString("pt-BR")}
                      </td>
                    </tr>
                  ))}
                  {leads.length === 0 && (
                    <tr>
                      <td className="px-4 py-6 text-center text-sm text-muted-foreground">
                        Nenhum lead ainda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
              <div className="border-b border-border px-4 py-3">
                <h2 className="font-serif text-lg">Campanhas recentes</h2>
                <p className="text-xs text-muted-foreground">Nome, canal e status reais.</p>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {camps.map((c) => (
                    <tr key={c.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-2.5">
                        <p className="font-medium">{c.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          <span className="uppercase">{c.canal}</span> · {c.dono}
                        </p>
                      </td>
                      <td
                        className="px-2 py-2.5 text-right text-xs tabular-nums text-muted-foreground"
                        title="enviados / leads na campanha"
                      >
                        {c.enviados}/{c.total}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <BadgeStatus s={c.status} />
                      </td>
                    </tr>
                  ))}
                  {camps.length === 0 && (
                    <tr>
                      <td className="px-4 py-6 text-center text-sm text-muted-foreground">
                        Nenhuma campanha ainda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
              <div className="border-b border-border px-4 py-3">
                <h2 className="font-serif text-lg">Buscas e gerações recentes</h2>
                <p className="text-xs text-muted-foreground">
                  Livro-caixa (redes_buscas): coleta em redes e geração de sites, com custo real.
                </p>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {buscas.map((b) => (
                    <tr key={b.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-2.5">
                        <p className="font-medium">
                          {b.fonte === "ia_site" ? "Site por IA" : b.fonte} ·{" "}
                          <span className="font-mono text-xs">{b.estrategia}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {b.inseridos} inserido(s) · {usd(Number(b.custo_usd))} · {b.dono}
                        </p>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <BadgeStatus s={b.status} />
                      </td>
                    </tr>
                  ))}
                  {buscas.length === 0 && (
                    <tr>
                      <td className="px-4 py-6 text-center text-sm text-muted-foreground">
                        Nenhuma busca registrada ainda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="rounded-xl border border-dashed border-border bg-secondary/30 p-4">
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-lg text-muted-foreground">Tickets de suporte</h2>
                <EmBreve />
              </div>
              <p className="mt-1 text-sm text-muted-foreground/80">
                O módulo de suporte ainda não existe no produto — este espaço já está reservado para
                ele. Nenhum dado é exibido porque nenhum dado existe.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
