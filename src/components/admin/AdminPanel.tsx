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
import {
  carregarKpis,
  carregarSerie14d,
  carregarStatusCampanhas,
  carregarLeadsRecentes,
  carregarCampanhasRecentes,
  carregarBuscasRecentes,
  type AdminKpis,
  type PontoSerie,
  type LeadRecente,
  type CampanhaRecente,
  type BuscaRecente,
} from "@/services/admin";

/* ─────────────────────────── moldura ─────────────────────────── */

const NAV: { rotulo: string; Icon: typeof LayoutDashboard; pronto?: boolean }[] = [
  { rotulo: "Dashboard", Icon: LayoutDashboard, pronto: true },
  { rotulo: "Staff & Roles", Icon: ShieldCheck },
  { rotulo: "Usuários", Icon: Users },
  { rotulo: "Planos", Icon: CreditCard },
  { rotulo: "Pagamentos", Icon: Wallet },
  { rotulo: "Relatórios", Icon: BarChart3 },
  { rotulo: "Suporte", Icon: LifeBuoy },
  { rotulo: "Configurações", Icon: Settings },
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

function Sidebar() {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex h-16 items-center border-b border-sidebar-border px-4">
        <FlowLeadsLogo variant="dark" className="h-7" />
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV.map(({ rotulo, Icon, pronto }) =>
          pronto ? (
            <div
              key={rotulo}
              aria-current="page"
              className="flex items-center gap-2.5 rounded-lg border-l-2 border-gold bg-sidebar-accent px-3 py-2 text-sm font-semibold text-sidebar-accent-foreground"
            >
              <Icon className="h-4 w-4 text-gold" />
              {rotulo}
            </div>
          ) : (
            // sem base ainda → visível, mas desabilitado e dizendo o porquê
            <div
              key={rotulo}
              aria-disabled="true"
              title="Este módulo ainda não tem base no produto — em breve."
              className="flex cursor-not-allowed items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/50"
            >
              <Icon className="h-4 w-4" />
              {rotulo}
              <EmBreve className="ml-auto" />
            </div>
          ),
        )}
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
    <div className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
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
  const [kpis, setKpis] = useState<AdminKpis | null>(null);
  const [serie, setSerie] = useState<{ pontos: PontoSerie[]; temAlgo: boolean } | null>(null);
  const [donut, setDonut] = useState<{ status: string; total: number }[] | null>(null);
  const [leads, setLeads] = useState<LeadRecente[]>([]);
  const [camps, setCamps] = useState<CampanhaRecente[]>([]);
  const [buscas, setBuscas] = useState<BuscaRecente[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    Promise.all([
      carregarKpis(),
      carregarSerie14d(),
      carregarStatusCampanhas(),
      carregarLeadsRecentes(),
      carregarCampanhasRecentes(),
      carregarBuscasRecentes(),
    ])
      .then(([k, s, d, l, c, b]) => {
        if (!vivo) return;
        setKpis(k);
        setSerie(s);
        setDonut(d);
        setLeads(l);
        setCamps(c);
        setBuscas(b);
      })
      .catch((e) => vivo && setErro(e instanceof Error ? e.message : String(e)));
    return () => {
      vivo = false;
    };
  }, []);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar email={email} />
        <main className="mx-auto w-full max-w-[1280px] flex-1 space-y-5 p-5">
          <div className="rounded-xl border border-border bg-card p-5 text-center shadow-[var(--shadow-card)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
              Visão geral
            </p>
            <h1 className="mt-1 font-serif text-2xl text-foreground">Centro de comando</h1>
            <p className="mx-auto mt-1 max-w-xl text-sm text-muted-foreground">
              A operação ao vivo — leads, campanhas, WhatsApp, buscas e gasto de API. Cada número
              vem de uma consulta real; o que ainda não tem base aparece como “Em breve”.
            </p>
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
            {/* sem base no produto ainda → Em breve, não zero fake */}
            <KpiEmBreve
              rotulo="Total de usuários"
              motivo="A plataforma tem 1 org por ora; multi-usuário entra com memberships."
              Icon={Users}
            />
            <KpiEmBreve
              rotulo="Tickets abertos"
              motivo="Não existe módulo de suporte ainda."
              Icon={LifeBuoy}
            />
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
                        type="monotone"
                        dataKey="leads"
                        name="Leads novos"
                        stroke="#2563EB"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
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

          {/* tabelas — dado real */}
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
              <div className="border-b border-border px-4 py-3">
                <h2 className="font-serif text-lg">Leads recentes</h2>
                <p className="text-xs text-muted-foreground">Os últimos salvos na base.</p>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {leads.map((l) => (
                    <tr key={l.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-2.5">
                        <p className="font-medium">{l.business_name}</p>
                        <p className="text-xs text-muted-foreground">{l.city ?? "—"}</p>
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
                        <p className="text-xs uppercase text-muted-foreground">{c.canal}</p>
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
                          {b.inseridos} inserido(s) · {usd(Number(b.custo_usd))}
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
