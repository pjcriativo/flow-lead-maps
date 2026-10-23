// Barra de Navegação Interna Compartilhada do Módulo Agentes & Automações
// Conecta todas as 12 telas do ecossistema, destacando as ativas e preservando URLs.
import React, { useState } from "react";
import {
  BarChart3,
  Bot,
  Brain,
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Crown,
  Database,
  FileCheck,
  FolderKanban,
  GitBranch,
  Layers,
  LayoutDashboard,
  Menu,
  ShieldCheck,
  Sliders,
  Sparkles,
  Target,
  User,
  Users,
  Wrench,
  X,
  Zap,
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
    icon: LayoutDashboard,
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
    disponivel: true,
    icon: Wrench,
  },
  {
    numero: "07",
    id: "fluxos",
    rotulo: "Fluxos & Automações",
    sub: "Construtor visual de etapas e gatilhos",
    disponivel: true,
    icon: GitBranch,
  },
  {
    numero: "08",
    id: "planejamento",
    rotulo: "Planejamento & Metas",
    sub: "Configuração da operação e execução",
    disponivel: true,
    icon: Target,
  },
  {
    numero: "09",
    id: "agenda",
    rotulo: "Agenda Inteligente",
    sub: "Calendário de reuniões e confirmações",
    disponivel: true,
    icon: CalendarCheck,
  },
  {
    numero: "10",
    id: "copiloto",
    rotulo: "Copiloto do CEO",
    sub: "Chat com agentes e supervisão",
    disponivel: true,
    icon: Bot,
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

interface AgentesNavHeaderProps {
  telaAtiva: TelaAgentesId;
  onSelecionarTela: (id: TelaAgentesId) => void;
}

export function AgentesNavHeader({ telaAtiva, onSelecionarTela }: AgentesNavHeaderProps) {
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);

  const telaAtualObj =
    TODAS_AS_TELAS_AGENTES.find((t) => t.id === telaAtiva) || TODAS_AS_TELAS_AGENTES[0];

  return (
    <div className="sticky top-0 z-30 border-b border-[#1b2232] bg-[#0c1017]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1680px] items-center justify-between px-4 py-2.5 sm:px-6 lg:px-8">
        
        {/* Indicador do Módulo */}
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-lg bg-orange-500/15 text-[#f95d14]">
            <Bot className="size-4" />
          </span>
          <div className="hidden sm:block">
            <span className="text-xs font-bold text-white tracking-wide">
              Agentes &amp; Automações
            </span>
            <span className="text-[10px] text-neutral-400 block -mt-0.5">
              12 Telas do Ecossistema Comercial de IA
            </span>
          </div>
        </div>

        {/* Desktop: Horizontal Pill Navigation */}
        <nav
          aria-label="Telas do módulo Agentes & Automações"
          className="hidden md:flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1"
        >
          {TODAS_AS_TELAS_AGENTES.map((item) => {
            const ativa = telaAtiva === item.id;
            const Icon = item.icon;

            if (!item.disponivel) {
              return (
                <div
                  key={item.id}
                  title={`${item.numero} ${item.rotulo} — Em desenvolvimento`}
                  className="flex shrink-0 cursor-not-allowed items-center gap-1.5 rounded-xl border border-transparent px-3 py-1.5 text-xs font-medium text-neutral-600 transition-colors"
                >
                  <span className="text-[10px] font-mono text-neutral-700">{item.numero}</span>
                  <span className="truncate max-w-[110px]">{item.rotulo}</span>
                  <span className="rounded bg-neutral-900 px-1 py-0.2 text-[8px] uppercase tracking-wide text-neutral-600 border border-neutral-800">
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
                  "flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all",
                  ativa
                    ? "bg-[#f95d14] text-white shadow-md shadow-orange-600/30 ring-1 ring-orange-500"
                    : "border border-white/5 bg-[#121620] text-neutral-300 hover:border-white/15 hover:bg-[#181e2b] hover:text-white",
                )}
              >
                <span
                  className={cn(
                    "text-[10px] font-mono",
                    ativa ? "text-orange-200" : "text-neutral-500",
                  )}
                >
                  {item.numero}
                </span>
                <Icon className="size-3.5" />
                <span>{item.rotulo}</span>
              </button>
            );
          })}
        </nav>

        {/* Mobile / Compact Selector */}
        <div className="md:hidden flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMenuMobileAberto(!menuMobileAberto)}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#121620] px-3 py-1.5 text-xs font-bold text-white shadow-sm"
          >
            <span className="text-[#f95d14] font-mono">{telaAtualObj.numero}</span>
            <span>{telaAtualObj.rotulo}</span>
            <ChevronDown className="size-3.5 text-neutral-400" />
          </button>
        </div>

      </div>

      {/* Mobile Drawer / Dropdown */}
      {menuMobileAberto && (
        <div className="md:hidden border-t border-[#1b2232] bg-[#0c1017] p-4 shadow-2xl space-y-1.5 max-h-[70vh] overflow-y-auto">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 px-2 pb-1">
            Selecione a tela do módulo
          </p>
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
                    setMenuMobileAberto(false);
                  }
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold transition-all",
                  ativa
                    ? "bg-[#f95d14] text-white"
                    : item.disponivel
                      ? "text-neutral-300 hover:bg-white/5 hover:text-white"
                      : "text-neutral-600 opacity-50 cursor-not-allowed",
                )}
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[10px] opacity-70">{item.numero}</span>
                  <Icon className="size-4" />
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
                {ativa && <CheckCircle2 className="size-4 text-white" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
