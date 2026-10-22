// Submenu Lateral Interno do Módulo Agentes & Automações
// Fiel ao layout aprovado: substitui a barra horizontal superior por um segundo menu lateral premium.
import React, { useState } from "react";
import {
  BarChart3,
  Bot,
  Brain,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  Database,
  FileCheck,
  FolderKanban,
  GitBranch,
  Home,
  Layers,
  LayoutDashboard,
  Link2,
  Menu,
  ShieldCheck,
  Sliders,
  Sparkles,
  Target,
  User,
  Users,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type TelaAgentesId =
  | "visao_geral"
  | "equipe"
  | "perfil"
  | "treinamento"
  | "memoria"
  | "skills"
  | "fluxos"
  | "planejamento"
  | "agenda"
  | "copiloto"
  | "aprovacoes"
  | "relatorios";

export interface ItemNavegacaoTela {
  numero: string;
  id: TelaAgentesId;
  rotulo: string;
  sub: string;
  disponivel: boolean;
  icon: LucideIcon;
}

export const TODAS_AS_TELAS_AGENTES: ItemNavegacaoTela[] = [
  {
    numero: "01",
    id: "visao_geral",
    rotulo: "Visão Geral",
    sub: "Painel executivo da operação comercial",
    disponivel: true,
    icon: Home,
  },
  {
    numero: "02",
    id: "equipe",
    rotulo: "Equipe & Enxames",
    sub: "Gestão de agentes, departamentos e enxames",
    disponivel: true,
    icon: Users,
  },
  {
    numero: "03",
    id: "perfil",
    rotulo: "Perfil do Agente",
    sub: "Identidade, autonomia, metas e desempenho",
    disponivel: true,
    icon: User,
  },
  {
    numero: "04",
    id: "treinamento",
    rotulo: "Treinamento & Conhecimento",
    sub: "Documentos, catálogos, FAQs e base RAG",
    disponivel: true,
    icon: Brain,
  },
  {
    numero: "05",
    id: "memoria",
    rotulo: "Memória & Segundo Cérebro",
    sub: "Memória por lead, projeto e Obsidian",
    disponivel: true,
    icon: Database,
  },
  {
    numero: "06",
    id: "skills",
    rotulo: "Skills & Integrações",
    sub: "Ferramentas internas, APIs e permissões",
    disponivel: false,
    icon: Link2,
  },
  {
    numero: "07",
    id: "fluxos",
    rotulo: "Fluxos & Automações",
    sub: "Construtor visual de etapas e gatilhos",
    disponivel: false,
    icon: GitBranch,
  },
  {
    numero: "08",
    id: "planejamento",
    rotulo: "Planejamento & Metas",
    sub: "Configuração da operação e execução",
    disponivel: false,
    icon: Target,
  },
  {
    numero: "09",
    id: "agenda",
    rotulo: "Agenda Inteligente",
    sub: "Calendário de reuniões e confirmações",
    disponivel: false,
    icon: Calendar,
  },
  {
    numero: "10",
    id: "copiloto",
    rotulo: "Copiloto de IA",
    sub: "Chat com agentes e supervisão",
    disponivel: false,
    icon: Sparkles,
  },
  {
    numero: "11",
    id: "aprovacoes",
    rotulo: "Aprovações & Histórico",
    sub: "Fila de decisões e auditoria copiloto",
    disponivel: false,
    icon: ShieldCheck,
  },
  {
    numero: "12",
    id: "relatorios",
    rotulo: "Relatórios & Resultados",
    sub: "Funil, produtividade, conversões e ROI",
    disponivel: false,
    icon: BarChart3,
  },
];

interface AgentesSidebarNavProps {
  telaAtiva: TelaAgentesId;
  onSelecionarTela: (id: TelaAgentesId) => void;
}

export function AgentesSidebarNav({
  telaAtiva,
  onSelecionarTela,
}: AgentesSidebarNavProps) {
  const [mobileAberto, setMobileAberto] = useState(false);

  const telaAtual =
    TODAS_AS_TELAS_AGENTES.find((t) => t.id === telaAtiva) ||
    TODAS_AS_TELAS_AGENTES[0];

  return (
    <>
      {/* Botão de Toggle para Mobile / Telas pequenas */}
      <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between border-b border-[#1b2232] bg-[#0c1017]/95 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-lg bg-orange-500/15 text-[#f95d14]">
            <Bot className="size-4" />
          </span>
          <div>
            <span className="text-xs font-bold text-white">Agentes &amp; Automações</span>
            <span className="text-[10px] text-neutral-400 block -mt-0.5">
              {telaAtual.numero} — {telaAtual.rotulo}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMobileAberto(!mobileAberto)}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#121620] px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10"
        >
          {mobileAberto ? <X className="size-4" /> : <Menu className="size-4" />}
          <span>{mobileAberto ? "Fechar Menu" : "12 Telas"}</span>
        </button>
      </div>

      {/* Drawer Mobile */}
      {mobileAberto && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/80 backdrop-blur-sm p-4 pt-16 overflow-y-auto">
          <div className="rounded-2xl border border-[#1b2232] bg-[#0c1017] p-4 shadow-2xl space-y-2">
            <div className="flex items-center justify-between pb-3 border-b border-[#1b2232]">
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-xl bg-orange-500/15 text-[#f95d14]">
                  <Bot className="size-5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white">Agentes &amp; Automações</h3>
                  <p className="text-[11px] text-neutral-400">12 telas do Ecossistema Comercial de IA</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileAberto(false)}
                className="rounded-lg p-1 text-neutral-400 hover:text-white"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-1.5 pt-2">
              {TODAS_AS_TELAS_AGENTES.map((item) => {
                const ativa = telaAtiva === item.id;
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={!item.disponivel}
                    onClick={() => {
                      if (item.disponivel) {
                        onSelecionarTela(item.id);
                        setMobileAberto(false);
                      }
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl p-2.5 text-left text-xs font-semibold transition-all",
                      ativa
                        ? "bg-[#f95d14] text-white shadow-lg shadow-orange-600/30"
                        : item.disponivel
                        ? "text-neutral-300 hover:bg-white/5 hover:text-white"
                        : "text-neutral-600 opacity-50 cursor-not-allowed",
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={cn(
                        "flex size-6 items-center justify-center rounded-md font-mono text-[10px] font-bold",
                        ativa ? "bg-black/20 text-white" : "bg-white/5 text-neutral-400"
                      )}>
                        {item.numero}
                      </span>
                      <Icon className="size-4 shrink-0" />
                      <div>
                        <p className="leading-tight">{item.rotulo}</p>
                        <p className="text-[10px] opacity-60 font-normal">{item.sub}</p>
                      </div>
                    </div>

                    {!item.disponivel && (
                      <span className="text-[9px] uppercase tracking-wide bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded text-neutral-500">
                        Em breve
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Submenu Lateral Desktop Fixo / Fiel à Imagem 2 */}
      <aside
        aria-label="Submenu Agentes & Automações"
        className="hidden lg:flex w-[250px] xl:w-[260px] shrink-0 flex-col border-r border-[#1b2232] bg-[#0c1017] min-h-screen p-4 space-y-4 select-none"
      >
        {/* Cabeçalho do Submenu Interno */}
        <div className="flex items-start gap-3 px-1 py-1">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/15 border border-orange-500/30 text-[#f95d14] shadow-sm">
            <Bot className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold tracking-tight text-white leading-tight">
              Agentes &amp; Automações
            </h2>
            <p className="mt-0.5 text-[11px] text-neutral-400 leading-snug">
              12 telas do Ecossistema Comercial de IA
            </p>
          </div>
        </div>

        {/* Separador sutil */}
        <div className="h-px w-full bg-[#1b2232]" />

        {/* Lista Vertical dos 12 Itens do Módulo */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto scrollbar-none pr-0.5">
          {TODAS_AS_TELAS_AGENTES.map((item) => {
            const ativa = telaAtiva === item.id;
            const Icon = item.icon;

            if (!item.disponivel) {
              return (
                <div
                  key={item.id}
                  title={`${item.numero} ${item.rotulo} — Em desenvolvimento`}
                  className="group flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-medium text-neutral-600 transition-colors cursor-not-allowed select-none"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-lg border border-white/5 bg-[#121620] font-mono text-[10px] text-neutral-600">
                      {item.numero}
                    </span>
                    <Icon className="size-4 shrink-0 text-neutral-600" />
                    <span className="truncate text-[12px]">{item.rotulo}</span>
                  </div>
                  <span className="rounded bg-neutral-900/80 px-1 py-0.5 text-[8px] uppercase tracking-wide text-neutral-600 border border-neutral-800 shrink-0">
                    Em breve
                  </span>
                </div>
              );
            }

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelecionarTela(item.id)}
                className={cn(
                  "group flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs font-semibold transition-all",
                  ativa
                    ? "bg-[#f95d14] text-white shadow-lg shadow-orange-600/25 ring-1 ring-orange-500"
                    : "text-neutral-300 hover:bg-[#121620] hover:text-white",
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-lg font-mono text-[10px] font-bold transition-colors",
                      ativa
                        ? "bg-black/20 text-white shadow-inner"
                        : "border border-white/5 bg-[#121620] text-neutral-400 group-hover:border-white/10 group-hover:text-neutral-200",
                    )}
                  >
                    {item.numero}
                  </span>
                  <Icon
                    className={cn(
                      "size-4 shrink-0 transition-colors",
                      ativa ? "text-white" : "text-neutral-400 group-hover:text-white",
                    )}
                  />
                  <span className="truncate text-[12px]">{item.rotulo}</span>
                </div>

                {ativa && (
                  <ChevronRight className="size-3.5 text-white shrink-0 opacity-80" />
                )}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
