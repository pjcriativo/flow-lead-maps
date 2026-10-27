// Submenu Lateral Interno Exclusivo do Módulo Financeiro
// Fiel à identidade visual premium do Flow Business, com rolagem independente e suporte responsivo.
import React, { useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart3,
  CheckSquare,
  CircleDollarSign,
  CreditCard,
  DollarSign,
  FileSpreadsheet,
  FileText,
  Landmark,
  LayoutDashboard,
  Menu,
  Receipt,
  Settings,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type TelaFinanceiroId =
  | "painel"
  | "receitas"
  | "despesas"
  | "cobrancas"
  | "relatorios"
  | "configuracoes";

export interface ItemNavegacaoFinanceiro {
  numero: string;
  id: TelaFinanceiroId;
  rotulo: string;
  sub: string;
  disponivel: boolean;
  icon: LucideIcon;
}

export const TODAS_AS_TELAS_FINANCEIRO: ItemNavegacaoFinanceiro[] = [
  {
    numero: "01",
    id: "painel",
    rotulo: "Painel Financeiro",
    sub: "Visão executiva, KPIs e gráficos",
    disponivel: true,
    icon: LayoutDashboard,
  },
  {
    numero: "02",
    id: "receitas",
    rotulo: "Receitas",
    sub: "Recebíveis e recorrência",
    disponivel: true,
    icon: TrendingUp,
  },
  {
    numero: "03",
    id: "despesas",
    rotulo: "Despesas",
    sub: "Custos e contas a pagar",
    disponivel: true,
    icon: TrendingDown,
  },
  {
    numero: "04",
    id: "cobrancas",
    rotulo: "Cobranças",
    sub: "Inadimplência e vencimentos",
    disponivel: true,
    icon: Receipt,
  },
  {
    numero: "05",
    id: "relatorios",
    rotulo: "Relatórios",
    sub: "Fluxo de caixa e resultados",
    disponivel: true,
    icon: BarChart3,
  },
  {
    numero: "06",
    id: "configuracoes",
    rotulo: "Configurações",
    sub: "Contas e preferências",
    disponivel: true,
    icon: Settings,
  },
];

interface FinanceiroSidebarNavProps {
  telaAtiva: TelaFinanceiroId;
  onSelecionarTela: (id: TelaFinanceiroId) => void;
}

export function FinanceiroSidebarNav({
  telaAtiva,
  onSelecionarTela,
}: FinanceiroSidebarNavProps) {
  const [mobileAberto, setMobileAberto] = useState(false);

  const telaAtual =
    TODAS_AS_TELAS_FINANCEIRO.find((t) => t.id === telaAtiva) ||
    TODAS_AS_TELAS_FINANCEIRO[0];

  return (
    <>
      {/* Barra de Toggle Mobile */}
      <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between border-b border-[#1b2232] bg-[#0c1017]/95 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-lg bg-orange-500/15 text-[#f95d14]">
            <CircleDollarSign className="size-4" />
          </span>
          <div>
            <span className="text-xs font-bold text-white">Financeiro</span>
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
          <span>Menu</span>
        </button>
      </div>

      {/* Drawer Mobile Flutuante */}
      {mobileAberto && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="fixed inset-y-0 left-0 w-4/5 max-w-xs bg-[#0c1017] border-r border-[#1b2232] p-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-orange-500/15 text-[#f95d14]">
                    <CircleDollarSign className="size-4" />
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-white">Financeiro</h2>
                    <p className="text-[10px] text-neutral-400">Gestão e fluxo de caixa</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileAberto(false)}
                  className="p-1 rounded-lg text-neutral-400 hover:text-white"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Lista de Itens no Mobile */}
              <div className="space-y-1.5">
                {TODAS_AS_TELAS_FINANCEIRO.map((item) => {
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
                        "w-full flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all text-left",
                        ativa
                          ? "border-orange-500/50 bg-gradient-to-r from-orange-600 to-[#f97316] text-white shadow-lg shadow-orange-600/20"
                          : item.disponivel
                          ? "border-white/5 bg-[#121620] text-neutral-300 hover:bg-white/10 hover:text-white"
                          : "border-white/5 bg-[#121620]/40 text-neutral-600 opacity-60 cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={cn(
                            "flex size-6 items-center justify-center rounded-md font-mono text-[10px] font-bold",
                            ativa ? "bg-black/20 text-white" : "bg-white/5 text-neutral-400"
                          )}
                        >
                          {item.numero}
                        </span>
                        <Icon className="size-4 shrink-0" />
                        <div>
                          <p className="leading-tight">{item.rotulo}</p>
                          <p className="text-[10px] opacity-70 font-normal">{item.sub}</p>
                        </div>
                      </div>

                      {!item.disponivel && (
                        <span className="text-[9px] uppercase tracking-wide bg-orange-500/10 border border-orange-500/30 px-1.5 py-0.5 rounded text-orange-400 font-bold">
                          Em breve
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submenu Lateral Desktop Fixo */}
      <aside
        aria-label="Submenu Financeiro"
        className="hidden lg:flex w-[240px] xl:w-[250px] shrink-0 flex-col border-r border-[#1b2232] bg-[#0c1017] min-h-screen p-4 space-y-4 select-none"
      >
        {/* Cabeçalho do Submenu Interno */}
        <div className="flex items-start gap-3 px-1 py-1">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/15 border border-orange-500/30 text-[#f95d14] shadow-sm">
            <CircleDollarSign className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold tracking-tight text-white leading-tight">
              Financeiro
            </h2>
            <p className="mt-0.5 text-[11px] text-neutral-400 leading-snug">
              Gestão e fluxo de caixa
            </p>
          </div>
        </div>

        {/* Separador */}
        <div className="h-px w-full bg-[#1b2232]" />

        {/* Lista dos 6 Itens */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto scrollbar-none pr-0.5">
          {TODAS_AS_TELAS_FINANCEIRO.map((item) => {
            const ativa = telaAtiva === item.id;
            const Icon = item.icon;

            if (!item.disponivel) {
              return (
                <div
                  key={item.id}
                  title={`${item.numero} ${item.rotulo} — Em breve`}
                  className="group flex items-center justify-between rounded-xl px-2.5 py-2.5 text-xs font-medium text-neutral-600 transition-colors cursor-not-allowed select-none"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-lg border border-white/5 bg-[#121620] font-mono text-[10px] text-neutral-600">
                      {item.numero}
                    </span>
                    <Icon className="size-4 shrink-0 text-neutral-600" />
                    <span className="truncate text-[12px]">{item.rotulo}</span>
                  </div>
                  <span className="rounded bg-orange-500/10 px-1.5 py-0.5 text-[8px] uppercase tracking-wide text-orange-400 border border-orange-500/30 shrink-0 font-bold">
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
                  "group relative flex w-full items-center justify-between rounded-xl px-2.5 py-2.5 text-xs font-medium transition-all text-left",
                  ativa
                    ? "border border-orange-500/50 bg-gradient-to-r from-orange-500/20 via-orange-500/10 to-transparent text-white font-semibold shadow-sm shadow-orange-500/10"
                    : "border border-transparent text-neutral-400 hover:border-white/5 hover:bg-[#121620] hover:text-white"
                )}
              >
                {/* Linha Indicadora Laranja */}
                {ativa && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-[#f95d14]" />
                )}

                <div className="flex items-center gap-2.5 min-w-0 pl-1">
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-lg font-mono text-[10px] font-bold transition-colors",
                      ativa
                        ? "bg-[#f95d14] text-white shadow-sm shadow-orange-500/30"
                        : "border border-white/5 bg-[#121620] text-neutral-400 group-hover:text-white"
                    )}
                  >
                    {item.numero}
                  </span>
                  <Icon
                    className={cn(
                      "size-4 shrink-0 transition-colors",
                      ativa ? "text-orange-400" : "text-neutral-400 group-hover:text-neutral-200"
                    )}
                  />
                  <span className="truncate text-[12px]">{item.rotulo}</span>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Rodapé Informativo do Submenu */}
        <div className="pt-3 border-t border-[#1b2232] text-[11px] text-neutral-500">
          <p className="flex items-center gap-1.5 font-medium text-neutral-400">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            <span>Módulo Ativo</span>
          </p>
          <p className="mt-1 text-[10px] text-neutral-500 leading-tight">
            Gestão integrada com Propostas, Contratos e CRM.
          </p>
        </div>
      </aside>
    </>
  );
}
