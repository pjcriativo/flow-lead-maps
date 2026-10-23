// Submenu Lateral Interno Exclusivo do Módulo Propostas Comerciais
// Fiel à identidade visual premium do Flow Business, com rolagem independente e suporte responsivo.
import React, { useState } from "react";
import {
  Clock,
  Eye,
  FileText,
  LayoutDashboard,
  LayoutTemplate,
  Menu,
  Sparkles,
  SquarePen,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type TelaPropostasId = "painel" | "criador" | "modelos" | "acompanhamento";

export interface ItemNavegacaoPropostas {
  numero: string;
  id: TelaPropostasId;
  rotulo: string;
  sub: string;
  disponivel: boolean;
  icon: LucideIcon;
}

export const TODAS_AS_TELAS_PROPOSTAS: ItemNavegacaoPropostas[] = [
  {
    numero: "01",
    id: "painel",
    rotulo: "Painel de Propostas",
    sub: "Listagem, métricas e pipeline de propostas",
    disponivel: true,
    icon: LayoutDashboard,
  },
  {
    numero: "02",
    id: "criador",
    rotulo: "Criador Profissional",
    sub: "Editor A4, modelos e geração com IA",
    disponivel: true,
    icon: SquarePen,
  },
  {
    numero: "03",
    id: "modelos",
    rotulo: "Biblioteca de Modelos",
    sub: "Templates e modelos reutilizáveis",
    disponivel: false,
    icon: LayoutTemplate,
  },
  {
    numero: "04",
    id: "acompanhamento",
    rotulo: "Acompanhamento",
    sub: "Rastreamento, visualizações e aceites",
    disponivel: false,
    icon: Eye,
  },
];

interface PropostasSidebarNavProps {
  telaAtiva: TelaPropostasId;
  onSelecionarTela: (id: TelaPropostasId) => void;
}

export function PropostasSidebarNav({
  telaAtiva,
  onSelecionarTela,
}: PropostasSidebarNavProps) {
  const [mobileAberto, setMobileAberto] = useState(false);

  const telaAtual =
    TODAS_AS_TELAS_PROPOSTAS.find((t) => t.id === telaAtiva) ||
    TODAS_AS_TELAS_PROPOSTAS[0];

  return (
    <>
      {/* Barra de Toggle Mobile */}
      <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between border-b border-[#1b2232] bg-[#0c1017]/95 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-lg bg-orange-500/15 text-[#f95d14]">
            <FileText className="size-4" />
          </span>
          <div>
            <span className="text-xs font-bold text-white">Propostas Comerciais</span>
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
          <span>{mobileAberto ? "Fechar Menu" : "4 Telas"}</span>
        </button>
      </div>

      {/* Drawer Mobile */}
      {mobileAberto && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/80 backdrop-blur-sm p-4 pt-16 overflow-y-auto">
          <div className="rounded-2xl border border-[#1b2232] bg-[#0c1017] p-4 shadow-2xl space-y-2">
            <div className="flex items-center justify-between pb-3 border-b border-[#1b2232]">
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-xl bg-orange-500/15 text-[#f95d14]">
                  <FileText className="size-5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white">Propostas Comerciais</h3>
                  <p className="text-[11px] text-neutral-400">Ciclo Comercial com IA</p>
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
              {TODAS_AS_TELAS_PROPOSTAS.map((item) => {
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

      {/* Submenu Lateral Desktop Fixo */}
      <aside
        aria-label="Submenu Propostas Comerciais"
        className="hidden lg:flex w-[240px] xl:w-[250px] shrink-0 flex-col border-r border-[#1b2232] bg-[#0c1017] min-h-screen p-4 space-y-4 select-none"
      >
        {/* Cabeçalho do Submenu Interno */}
        <div className="flex items-start gap-3 px-1 py-1">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/15 border border-orange-500/30 text-[#f95d14] shadow-sm">
            <FileText className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold tracking-tight text-white leading-tight">
              Propostas Comerciais
            </h2>
            <p className="mt-0.5 text-[11px] text-neutral-400 leading-snug">
              Ciclo comercial com IA
            </p>
          </div>
        </div>

        {/* Separador */}
        <div className="h-px w-full bg-[#1b2232]" />

        {/* Lista dos 4 Itens */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto scrollbar-none pr-0.5">
          {TODAS_AS_TELAS_PROPOSTAS.map((item) => {
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
                  <span className="rounded bg-neutral-900/80 px-1.5 py-0.5 text-[8px] uppercase tracking-wide text-neutral-600 border border-neutral-800 shrink-0">
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
                        ? "bg-[#f95d14] text-white shadow-sm"
                        : "border border-white/5 bg-[#121620] text-neutral-400 group-hover:text-white"
                    )}
                  >
                    {item.numero}
                  </span>
                  <Icon
                    className={cn(
                      "size-4 shrink-0 transition-colors",
                      ativa ? "text-[#f95d14]" : "text-neutral-400 group-hover:text-white"
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] leading-tight font-medium">
                      {item.rotulo}
                    </span>
                    <span className="block truncate text-[10px] text-neutral-500 font-normal mt-0.5">
                      {item.sub}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
