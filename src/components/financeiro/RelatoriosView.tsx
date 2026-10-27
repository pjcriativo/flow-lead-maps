// Tela 05: Relatórios Financeiros (Gestão → Financeiro → Relatórios)
// Apresenta fluxo de caixa consolidado, DRE gerencial, distribuição de receitas e despesas com design premium do Flow Business.

import React, { useState } from "react";
import {
  BarChart3,
  Calendar,
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Layers,
  PieChart,
  Printer,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/format";
import type { TelaFinanceiroId } from "./FinanceiroSidebarNav";

interface RelatoriosViewProps {
  onMudarTela: (tela: TelaFinanceiroId) => void;
}

export function RelatoriosView({ onMudarTela }: RelatoriosViewProps) {
  const [periodo, setPeriodo] = useState("Outubro 2026");
  const [abaRelatorio, setAbaRelatorio] = useState<"fluxo" | "dre" | "categorias" | "clientes">("fluxo");

  return (
    <div className="flex-1 min-w-0 p-3 sm:p-5 lg:p-6 flex flex-col gap-5 overflow-x-hidden">
      {/* Cabeçalho */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <button
              type="button"
              onClick={() => onMudarTela("painel")}
              className="hover:text-neutral-300 cursor-pointer"
            >
              Gestão
            </button>
            <span className="text-neutral-600">›</span>
            <button
              type="button"
              onClick={() => onMudarTela("painel")}
              className="hover:text-neutral-300 cursor-pointer"
            >
              Financeiro
            </button>
            <span className="text-neutral-600">›</span>
            <span className="flex items-center gap-1.5 font-medium text-orange-400">
              <BarChart3 className="size-3.5 text-orange-400" />
              Relatórios
            </span>
          </div>

          <div className="flex items-center gap-3 mt-0.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-orange-500/15 border border-orange-500/30 text-[#f95d14] shadow-sm">
              <BarChart3 className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Relatórios Financeiros
              </h1>
              <p className="mt-0.5 text-xs text-neutral-400 sm:text-sm">
                Acompanhe demonstrativos, fluxo de caixa, DRE gerencial e métricas de rentabilidade.
              </p>
            </div>
          </div>
        </div>

        {/* Ações superiores */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => toast.success("Exportando relatório em PDF...")}
            className="flex h-9 items-center gap-2 rounded-xl border border-white/10 bg-[#0e121a] px-3 text-xs font-semibold text-neutral-300 hover:border-white/20 hover:text-white transition-all"
          >
            <Download className="size-3.5 text-neutral-400" />
            <span>Exportar PDF</span>
          </button>
          <button
            type="button"
            onClick={() => toast.success("Exportando planilha em Excel...")}
            className="flex h-9 items-center gap-2 rounded-xl border border-white/10 bg-[#0e121a] px-3 text-xs font-semibold text-neutral-300 hover:border-white/20 hover:text-white transition-all"
          >
            <FileSpreadsheet className="size-3.5 text-emerald-400" />
            <span>Excel (.xlsx)</span>
          </button>
        </div>
      </header>

      {/* 4 Cards de Métricas Consolidada */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl border border-white/5 bg-[#0c1017] flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Receita Bruta</span>
            <TrendingUp className="size-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white">
            {formatBRL(48500)}
          </div>
          <span className="text-[11px] text-emerald-400 font-medium">+18,4% vs mês anterior</span>
        </div>

        <div className="p-4 rounded-2xl border border-white/5 bg-[#0c1017] flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Despesas Totais</span>
            <TrendingDown className="size-4 text-rose-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white">
            {formatBRL(18770)}
          </div>
          <span className="text-[11px] text-neutral-400 font-medium">Margem controlada</span>
        </div>

        <div className="p-4 rounded-2xl border border-white/5 bg-[#0c1017] flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Lucro Operacional (EBITDA)</span>
            <Sparkles className="size-4 text-orange-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">
            {formatBRL(29730)}
          </div>
          <span className="text-[11px] text-emerald-400 font-medium">Margem líquida de 61,3%</span>
        </div>

        <div className="p-4 rounded-2xl border border-white/5 bg-[#0c1017] flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Saldo em Contas</span>
            <Wallet className="size-4 text-cyan-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white">
            {formatBRL(90120)}
          </div>
          <span className="text-[11px] text-cyan-400 font-medium">4 contas ativas</span>
        </div>
      </div>

      {/* Abas e Tabela do Relatório */}
      <div className="rounded-2xl border border-white/10 bg-[#0c1017] p-4 sm:p-5 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
          <div className="flex items-center gap-1.5 bg-[#121620] p-1 rounded-xl border border-white/5 text-xs">
            <button
              type="button"
              onClick={() => setAbaRelatorio("fluxo")}
              className={cn(
                "px-3 py-1.5 rounded-lg font-semibold transition-all",
                abaRelatorio === "fluxo"
                  ? "bg-orange-600 text-white shadow-sm"
                  : "text-neutral-400 hover:text-white"
              )}
            >
              Fluxo de Caixa Mensal
            </button>
            <button
              type="button"
              onClick={() => setAbaRelatorio("dre")}
              className={cn(
                "px-3 py-1.5 rounded-lg font-semibold transition-all",
                abaRelatorio === "dre"
                  ? "bg-orange-600 text-white shadow-sm"
                  : "text-neutral-400 hover:text-white"
              )}
            >
              DRE Gerencial
            </button>
            <button
              type="button"
              onClick={() => setAbaRelatorio("categorias")}
              className={cn(
                "px-3 py-1.5 rounded-lg font-semibold transition-all",
                abaRelatorio === "categorias"
                  ? "bg-orange-600 text-white shadow-sm"
                  : "text-neutral-400 hover:text-white"
              )}
            >
              Por Centros de Custo
            </button>
          </div>

          <span className="text-xs text-neutral-400">
            Período de referência: <strong className="text-neutral-200">01/10/2026 a 31/10/2026</strong>
          </span>
        </div>

        {/* Tabela do Demonstrativo */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/5 text-neutral-400">
                <th className="py-2.5 px-3 font-semibold">Conta / Rubrica</th>
                <th className="py-2.5 px-3 font-semibold text-right">Previsto</th>
                <th className="py-2.5 px-3 font-semibold text-right">Realizado</th>
                <th className="py-2.5 px-3 font-semibold text-right">Variação</th>
                <th className="py-2.5 px-3 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              <tr className="hover:bg-white/[0.02]">
                <td className="py-3 px-3 font-sans font-semibold text-white">Receitas de Serviços Recorrentes</td>
                <td className="py-3 px-3 text-right text-neutral-400">{formatBRL(35000)}</td>
                <td className="py-3 px-3 text-right text-emerald-400 font-bold">{formatBRL(36000)}</td>
                <td className="py-3 px-3 text-right text-emerald-400">+2,8%</td>
                <td className="py-3 px-3 text-center">
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    Acima da meta
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-white/[0.02]">
                <td className="py-3 px-3 font-sans font-semibold text-white">Implantação e Setup de Clientes</td>
                <td className="py-3 px-3 text-right text-neutral-400">{formatBRL(10000)}</td>
                <td className="py-3 px-3 text-right text-emerald-400 font-bold">{formatBRL(12500)}</td>
                <td className="py-3 px-3 text-right text-emerald-400">+25,0%</td>
                <td className="py-3 px-3 text-center">
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    Excelente
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-white/[0.02]">
                <td className="py-3 px-3 font-sans font-semibold text-rose-300">Custos de Marketing & Ads</td>
                <td className="py-3 px-3 text-right text-neutral-400">{formatBRL(9000)}</td>
                <td className="py-3 px-3 text-right text-rose-400 font-bold">{formatBRL(8450)}</td>
                <td className="py-3 px-3 text-right text-emerald-400">-6,1%</td>
                <td className="py-3 px-3 text-center">
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                    Econômico
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-white/[0.02]">
                <td className="py-3 px-3 font-sans font-semibold text-rose-300">Infraestrutura em Nuvem & SaaS</td>
                <td className="py-3 px-3 text-right text-neutral-400">{formatBRL(4500)}</td>
                <td className="py-3 px-3 text-right text-rose-400 font-bold">{formatBRL(4380)}</td>
                <td className="py-3 px-3 text-right text-emerald-400">-2,6%</td>
                <td className="py-3 px-3 text-center">
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    No limite
                  </span>
                </td>
              </tr>
              <tr className="bg-white/[0.03] font-bold">
                <td className="py-3 px-3 font-sans text-white">Saldo Operacional Líquido</td>
                <td className="py-3 px-3 text-right text-neutral-300">{formatBRL(31500)}</td>
                <td className="py-3 px-3 text-right text-emerald-400 text-sm">{formatBRL(35670)}</td>
                <td className="py-3 px-3 text-right text-emerald-400">+13,2%</td>
                <td className="py-3 px-3 text-center">
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Superavitário
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
