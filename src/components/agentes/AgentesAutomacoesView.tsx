// Tela 01 — Agentes & Automações · Painel. Visão executiva do módulo.
// HONESTIDADE: os agentes de IA ainda não têm backend. Tudo que é deles aparece "Em breve" e sem
// números inventados. O que é real hoje vem das receitas/rodadas da automação e da base de leads.
import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  ArrowRight,
  Bot,
  CalendarCheck,
  ChevronRight,
  FileText,
  Filter,
  Layers,
  Loader2,
  Plus,
  RefreshCw,
  Settings2,
  Target,
  Users,
  Zap,
  Heart,
  Mic,
  Wrench,
  Database,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDataHora } from "@/lib/format";
import { listarReceitas, type Receita, type Rodada } from "@/services/automacao";
import {
  carregarResumoPainel,
  listarRodadasRecentes,
  type ResumoPainelAgentes,
} from "@/services/agentes";
import { AutomacaoSection } from "@/components/automacao/AutomacaoSection";
import {
  ABAS_AGENTES,
  CAPACIDADES,
  CEO_AGENTE,
  EQUIPE_AGENTES,
  FLUXO_OPERACIONAL,
  type AbaAgentes,
} from "./agentes-data";

const PANEL_CLASS =
  "rounded-2xl border border-home-border bg-[radial-gradient(circle_at_top_right,rgba(20,47,66,0.12),transparent_40%),var(--home-surface)]";

const ICONES_CAPACIDADE: Record<string, LucideIcon> = {
  memoria: Database,
  skills: Wrench,
  voz: Mic,
  sentimento: Heart,
};

const SOON_TITLE = "Em breve — ainda não disponível";

function EmBreve({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "rounded-full border border-home-border bg-home-surface-strong px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-home-muted",
        className,
      )}
    >
      Em breve
    </span>
  );
}

function Secao({
  titulo,
  sub,
  icon: Icon,
  acao,
  className,
  children,
}: {
  titulo: string;
  sub?: string;
  icon: LucideIcon;
  acao?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn(PANEL_CLASS, "p-5", className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-home-orange/15 text-home-orange">
            <Icon className="size-5" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-home-foreground">{titulo}</h2>
            {sub ? <p className="mt-0.5 text-xs text-home-muted">{sub}</p> : null}
          </div>
        </div>
        {acao}
      </div>
      {children}
    </section>
  );
}

const fmt = (n: number) => n.toLocaleString("pt-BR");

const STATUS_RODADA: Record<string, { texto: string; cor: string }> = {
  rodando: { texto: "Em andamento", cor: "text-home-blue" },
  concluida: { texto: "Concluída", cor: "text-home-green" },
  parada_teto: { texto: "Parada pelo limite", cor: "text-home-amber" },
  erro: { texto: "Com erro", cor: "text-home-red" },
};

export function AgentesAutomacoesView({ onRevisar }: { onRevisar?: () => void }) {
  const [aba, setAba] = useState<AbaAgentes>("painel");
  const [resumo, setResumo] = useState<ResumoPainelAgentes | null>(null);
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [rodadas, setRodadas] = useState<Rodada[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [falhou, setFalhou] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setFalhou(false);
    try {
      const [r, rec, rod] = await Promise.all([
        carregarResumoPainel(),
        listarReceitas(),
        listarRodadasRecentes(6),
      ]);
      setResumo(r);
      setReceitas(rec);
      setRodadas(rod);
    } catch {
      setFalhou(true);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const receitasAtivas = receitas.filter((r) => r.ativa);
  const leadsMes = receitas.reduce((a, r) => a + (r.leads_mes ?? 0), 0);
  const tetoMes = receitas.reduce((a, r) => a + (r.max_leads_mes ?? 0), 0);
  const nomeReceita = (id: string) => receitas.find((r) => r.id === id)?.nome ?? "Receita removida";
  const valor = (n: number | undefined) => (carregando || falhou || n == null ? "—" : fmt(n));

  const kpis: { icon: LucideIcon; cor: string; valor: string; rotulo: string; real: boolean }[] = [
    {
      icon: Users,
      cor: "text-home-blue",
      valor: valor(resumo?.leadsNaBase),
      rotulo: "Leads na base",
      real: true,
    },
    {
      icon: Filter,
      cor: "text-home-purple",
      valor: valor(resumo?.rodadas30d.qualificados),
      rotulo: "Qualificados pela automação (30 dias)",
      real: true,
    },
    {
      icon: Zap,
      cor: "text-home-amber",
      valor: carregando || falhou ? "—" : fmt(receitasAtivas.length),
      rotulo: "Receitas com agendamento ligado",
      real: true,
    },
    {
      icon: FileText,
      cor: "text-home-cyan",
      valor: valor(resumo?.rodadas30d.preparados),
      rotulo: "Propostas preparadas (30 dias)",
      real: true,
    },
    {
      icon: CalendarCheck,
      cor: "text-home-green",
      valor: "—",
      rotulo: "Reuniões agendadas",
      real: false,
    },
    { icon: Bot, cor: "text-home-orange", valor: "0", rotulo: "Agentes de IA ativos", real: false },
  ];

  return (
    <div className="min-h-svh bg-home-background text-home-foreground">
      <div className="mx-auto max-w-[1600px] px-4 pb-10 pt-6 sm:px-6 lg:px-7">
        {/* Cabeçalho */}
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-home-orange text-sm font-bold text-white">
              01
            </span>
            <div>
              <nav
                aria-label="Breadcrumb"
                className="flex items-center gap-1 text-[11px] text-home-muted"
              >
                <ChevronRight className="size-3" /> Visão Geral
              </nav>
              <h1 className="text-2xl font-semibold tracking-tight">Agentes &amp; Automações</h1>
              <p className="mt-1 max-w-2xl text-sm text-home-muted">
                Central de agentes comerciais inteligentes, em modo copiloto: você aprova, os
                agentes preparam.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled
              title={SOON_TITLE}
              className="flex h-10 cursor-not-allowed items-center gap-2 rounded-xl border border-home-border bg-home-surface px-4 text-xs font-semibold text-home-muted opacity-70"
            >
              <Users className="size-4" /> Montar equipe com CEO de IA
            </button>
            <button
              type="button"
              disabled
              title={SOON_TITLE}
              className="flex h-10 cursor-not-allowed items-center gap-2 rounded-xl border border-home-border bg-home-surface px-4 text-xs font-semibold text-home-muted opacity-70"
            >
              <Settings2 className="size-4" /> Configurar metas
            </button>
            <button
              type="button"
              onClick={() => setAba("automacoes")}
              className="flex h-10 items-center gap-2 rounded-xl bg-home-orange px-4 text-xs font-semibold text-white transition-opacity hover:opacity-90"
            >
              <Plus className="size-4" /> Nova operação
            </button>
          </div>
        </header>

        {/* Navegação interna */}
        <nav
          aria-label="Navegação do módulo"
          className="mt-5 flex gap-1 overflow-x-auto border-b border-home-border"
        >
          {ABAS_AGENTES.map((a) => {
            const ativa = aba === a.id;
            return (
              <button
                key={a.id}
                type="button"
                disabled={!a.disponivel}
                title={a.disponivel ? undefined : SOON_TITLE}
                aria-current={ativa ? "page" : undefined}
                onClick={() => a.disponivel && setAba(a.id)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-semibold transition-colors",
                  ativa
                    ? "border-home-orange text-home-orange"
                    : "border-transparent text-home-muted",
                  a.disponivel ? "hover:text-home-foreground" : "cursor-not-allowed opacity-60",
                )}
              >
                {a.label}
                {a.disponivel ? null : <EmBreve className="px-1.5 py-0 text-[9px]" />}
              </button>
            );
          })}
        </nav>

        {aba === "automacoes" ? (
          <div className="mt-6 rounded-2xl bg-background p-4 text-foreground sm:p-6">
            <AutomacaoSection onRevisar={onRevisar} />
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            {falhou ? (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-home-red/40 bg-home-red/10 px-4 py-3 text-sm">
                <span>Não foi possível carregar os dados do painel.</span>
                <button
                  type="button"
                  onClick={carregar}
                  className="flex items-center gap-1.5 text-xs font-semibold text-home-orange"
                >
                  <RefreshCw className="size-3.5" /> Tentar de novo
                </button>
              </div>
            ) : null}

            {/* CEO + comando */}
            <section className="relative overflow-hidden rounded-2xl border border-home-orange/50 bg-[radial-gradient(circle_at_20%_0%,rgba(255,98,0,0.18),transparent_55%),var(--home-surface)] p-6">
              <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,420px)]">
                <div className="flex items-start gap-5">
                  <span className="flex size-24 shrink-0 items-center justify-center rounded-2xl border border-home-orange/40 bg-home-orange/10 text-home-orange sm:size-32">
                    <CEO_AGENTE.icon className="size-12 sm:size-16" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md border border-home-border bg-home-surface-strong px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-home-muted">
                        Agente orquestrador
                      </span>
                      <EmBreve />
                    </div>
                    <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                      {CEO_AGENTE.nome}
                    </h2>
                    <p className="mt-2 max-w-xl text-sm text-home-muted">{CEO_AGENTE.descricao}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {[
                        "Planejamento",
                        "Delegação",
                        "Análise de performance",
                        "Tomada de decisão",
                      ].map((c) => (
                        <span
                          key={c}
                          className="rounded-full border border-home-border bg-home-surface-strong px-3 py-1 text-[11px] text-home-muted"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-home-border bg-home-surface-strong/60 p-4">
                  <p className="text-xs font-semibold text-home-foreground">Comando da operação</p>
                  <p className="mt-1 text-xs text-home-muted">
                    O CEO de IA e os demais agentes ainda não foram ativados. Hoje a prospecção
                    automática roda por receitas, sempre com a sua aprovação.
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAba("automacoes")}
                      className="h-10 rounded-xl border border-home-border bg-home-surface text-xs font-semibold transition-colors hover:bg-home-surface-strong"
                    >
                      Ver receitas atuais
                    </button>
                    <button
                      type="button"
                      disabled
                      title={SOON_TITLE}
                      className="h-10 cursor-not-allowed rounded-xl bg-home-orange/40 text-xs font-semibold text-white/80"
                    >
                      Conversar com o CEO
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* KPIs */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
              {kpis.map((k) => (
                <div key={k.rotulo} className={cn(PANEL_CLASS, "flex items-center gap-3 p-4")}>
                  <span
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-xl bg-home-surface-strong",
                      k.cor,
                    )}
                  >
                    <k.icon className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-2xl font-semibold leading-none">
                      {carregando && k.real ? <Loader2 className="size-5 animate-spin" /> : k.valor}
                    </p>
                    <p className="mt-1.5 text-[11px] leading-tight text-home-muted">{k.rotulo}</p>
                    {k.real ? null : <EmBreve className="mt-1 inline-block" />}
                  </div>
                </div>
              ))}
            </div>

            {/* Equipe + Enxame */}
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
              <Secao
                titulo="Equipe de Agentes"
                sub="Perfis planejados da equipe. Os agentes serão ativados em etapas."
                icon={Users}
              >
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
                  {EQUIPE_AGENTES.map((a) => (
                    <div
                      key={a.id}
                      className={cn(
                        "flex flex-col items-center rounded-xl border bg-home-surface-strong/50 p-3 text-center",
                        a.id === "ceo" ? "border-home-orange/60" : "border-home-border",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-14 items-center justify-center rounded-full bg-home-surface",
                          a.cor,
                        )}
                      >
                        <a.icon className="size-7" />
                      </span>
                      <p className="mt-2 text-xs font-semibold">{a.nome}</p>
                      <p className="mt-0.5 text-[10px] leading-tight text-home-muted">{a.funcao}</p>
                      <EmBreve className="mt-2" />
                    </div>
                  ))}
                </div>
              </Secao>

              <Secao
                titulo="Enxame de Automação"
                sub="O CEO coordenará os agentes conforme o plano comercial."
                icon={Layers}
              >
                <div className="flex flex-col items-center">
                  <div className="rounded-xl border border-home-orange/50 px-4 py-2 text-center">
                    <p className="text-xs font-semibold">CEO de IA</p>
                    <p className="text-[10px] text-home-muted">Orquestra o enxame</p>
                  </div>
                  <div className="h-4 w-px bg-home-orange/60" />
                  <div className="grid w-full grid-cols-3 gap-2 border-t border-home-orange/60 pt-3 sm:grid-cols-6">
                    {EQUIPE_AGENTES.filter((a) => a.id !== "ceo").map((a) => (
                      <div key={a.id} className="flex flex-col items-center text-center">
                        <span
                          className={cn(
                            "flex size-10 items-center justify-center rounded-full bg-home-surface-strong",
                            a.cor,
                          )}
                        >
                          <a.icon className="size-5" />
                        </span>
                        <p className="mt-1 text-[10px] font-semibold leading-tight">{a.nome}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </Secao>
            </div>

            {/* Plano semanal + Fluxo + Metas */}
            <div className="grid gap-5 xl:grid-cols-3">
              <Secao
                titulo="Plano semanal de prospecção"
                sub="Receitas de prospecção cadastradas e seus agendamentos."
                icon={CalendarCheck}
                acao={
                  <button
                    type="button"
                    onClick={() => setAba("automacoes")}
                    className="flex items-center gap-1 text-[11px] font-semibold text-home-orange"
                  >
                    Abrir automações <ArrowRight className="size-3" />
                  </button>
                }
              >
                {carregando ? (
                  <Loader2 className="size-4 animate-spin text-home-muted" />
                ) : receitas.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-home-border p-4 text-center text-xs text-home-muted">
                    Nenhuma receita ainda. Crie uma em Automações para ela aparecer aqui.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="text-[10px] uppercase tracking-wide text-home-muted">
                        <tr>
                          <th className="py-2 pr-3 font-medium">Frequência</th>
                          <th className="py-2 pr-3 font-medium">Nicho / Local</th>
                          <th className="py-2 pr-3 font-medium">Canal</th>
                          <th className="py-2 pr-3 font-medium">Leads/rodada</th>
                          <th className="py-2 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {receitas.slice(0, 6).map((r) => (
                          <tr key={r.id} className="border-t border-home-border">
                            <td className="py-2 pr-3 capitalize">{r.frequencia}</td>
                            <td className="py-2 pr-3">
                              {r.nicho} · {r.cidade}
                              {r.uf ? `/${r.uf}` : ""}
                            </td>
                            <td className="py-2 pr-3 capitalize">{r.canal}</td>
                            <td className="py-2 pr-3">{fmt(r.leads_por_rodada)}</td>
                            <td
                              className={cn(
                                "py-2 font-semibold",
                                r.ativa ? "text-home-green" : "text-home-muted",
                              )}
                            >
                              {r.ativa ? "Agendada" : "Pausada"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Secao>

              <Secao
                titulo="Fluxo de operação comercial"
                sub="Do primeiro contato ao cliente fechado, com agentes especializados."
                icon={Filter}
              >
                <ol className="flex items-start justify-between gap-1">
                  {FLUXO_OPERACIONAL.map((e, i) => (
                    <li key={e.id} className="flex min-w-0 flex-1 items-start">
                      <div className="flex min-w-0 flex-1 flex-col items-center text-center">
                        <span
                          className={cn(
                            "flex size-11 items-center justify-center rounded-xl text-sm font-bold",
                            e.disponivel
                              ? "bg-home-orange/20 text-home-orange"
                              : "bg-home-surface-strong text-home-muted",
                          )}
                        >
                          {i + 1}
                        </span>
                        <p className="mt-2 text-[11px] font-semibold">{e.titulo}</p>
                        <p className="text-[10px] leading-tight text-home-muted">{e.sub}</p>
                        {e.disponivel ? (
                          <span className="mt-1 text-[9px] font-semibold uppercase text-home-green">
                            Via receitas
                          </span>
                        ) : (
                          <EmBreve className="mt-1 px-1.5 py-0 text-[9px]" />
                        )}
                      </div>
                      {i < FLUXO_OPERACIONAL.length - 1 ? (
                        <ChevronRight className="mt-3.5 size-3.5 shrink-0 text-home-muted" />
                      ) : null}
                    </li>
                  ))}
                </ol>
              </Secao>

              <Secao
                titulo="Metas e resultados"
                sub="Acompanhamento de desempenho da operação."
                icon={Target}
              >
                <div className="space-y-4">
                  <MetaBarra
                    rotulo="Leads do mês (automação)"
                    atual={leadsMes}
                    meta={tetoMes}
                    carregando={carregando}
                  />
                  {["Reuniões agendadas", "Propostas enviadas", "Vendas fechadas"].map((m) => (
                    <div key={m}>
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="text-home-muted">{m}</span>
                        <EmBreve />
                      </div>
                      <div className="h-2 rounded-full bg-home-surface-strong" />
                    </div>
                  ))}
                </div>
              </Secao>
            </div>

            {/* Atividades + Capacidades */}
            <div className="grid gap-5 xl:grid-cols-2">
              <Secao
                titulo="Atividades recentes"
                sub="Últimas rodadas executadas pela automação de prospecção."
                icon={Zap}
              >
                {carregando ? (
                  <Loader2 className="size-4 animate-spin text-home-muted" />
                ) : rodadas.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-home-border p-4 text-center text-xs text-home-muted">
                    Nenhuma rodada executada ainda.
                  </p>
                ) : (
                  <ul className="divide-y divide-home-border">
                    {rodadas.map((r) => {
                      const st = STATUS_RODADA[r.status] ?? {
                        texto: r.status,
                        cor: "text-home-muted",
                      };
                      return (
                        <li
                          key={r.id}
                          className="flex items-start justify-between gap-3 py-2.5 text-xs"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-semibold">{nomeReceita(r.receita_id)}</p>
                            <p className="text-home-muted">
                              {fmt(r.leads_buscados)} buscados · {fmt(r.leads_preparados)} prontos
                              para revisão
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className={cn("font-semibold", st.cor)}>{st.texto}</p>
                            <p className="text-home-muted">{formatDataHora(r.iniciada_em)}</p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {onRevisar ? (
                  <button
                    type="button"
                    onClick={onRevisar}
                    className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-home-orange"
                  >
                    Revisar rascunhos em Campanhas <ArrowRight className="size-3" />
                  </button>
                ) : null}
              </Secao>

              <Secao
                titulo="Capacidades e integrações (Copiloto)"
                sub="Recursos que os agentes usarão para executar com autonomia supervisionada."
                icon={Bot}
              >
                <div className="grid grid-cols-2 gap-3">
                  {CAPACIDADES.map((c) => {
                    const Icon = ICONES_CAPACIDADE[c.id];
                    return (
                      <div
                        key={c.id}
                        className="rounded-xl border border-home-border bg-home-surface-strong/50 p-3"
                      >
                        <div className="flex items-center justify-between">
                          <Icon className="size-5 text-home-orange" />
                          <EmBreve />
                        </div>
                        <p className="mt-2 text-xs font-semibold">{c.titulo}</p>
                        <p className="mt-0.5 text-[11px] leading-snug text-home-muted">{c.texto}</p>
                      </div>
                    );
                  })}
                </div>
              </Secao>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MetaBarra({
  rotulo,
  atual,
  meta,
  carregando,
}: {
  rotulo: string;
  atual: number;
  meta: number;
  carregando: boolean;
}) {
  const pct = meta > 0 ? Math.min(100, Math.round((atual / meta) * 100)) : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="text-home-muted">{rotulo}</span>
        <span className="font-semibold">
          {carregando
            ? "—"
            : meta > 0
              ? `${fmt(atual)} / ${fmt(meta)} · ${pct}%`
              : "Sem limite definido"}
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={rotulo}
        className="h-2 overflow-hidden rounded-full bg-home-surface-strong"
      >
        <div className="h-full rounded-full bg-home-orange" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
