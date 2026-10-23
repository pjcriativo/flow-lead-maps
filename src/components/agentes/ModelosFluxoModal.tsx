// Modal de Galeria de Modelos de Fluxos de Automação
// Permite explorar, pré-visualizar e carregar receitas de fluxos comerciais.
import React, { useState } from "react";
import {
  ArrowRight,
  Bot,
  CalendarCheck,
  Check,
  Copy,
  Eye,
  FileText,
  Filter,
  Flame,
  GitBranch,
  Headphones,
  Layers,
  MessageSquare,
  PlusCircle,
  Sparkles,
  UserCheck,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MODELOS_FLUXOS_INICIAIS, type ModeloFluxoItem } from "./fluxos-data";

interface ModelosFluxoModalProps {
  aberto: boolean;
  onFechar: () => void;
  onSelecionarModelo: (modelo: ModeloFluxoItem) => void;
}

export function ModelosFluxoModal({
  aberto,
  onFechar,
  onSelecionarModelo,
}: ModelosFluxoModalProps) {
  const [categoriaAtiva, setCategoriaAtiva] = useState<"todos" | "prospeccao" | "vendas" | "pos_venda">("todos");
  const [busca, setBusca] = useState("");

  if (!aberto) return null;

  const filtrados = MODELOS_FLUXOS_INICIAIS.filter((m) => {
    const matchCat = categoriaAtiva === "todos" || m.categoria === categoriaAtiva;
    const matchBusca =
      !busca ||
      m.nome.toLowerCase().includes(busca.toLowerCase()) ||
      m.descricao.toLowerCase().includes(busca.toLowerCase());
    return matchCat && matchBusca;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-2xl border border-white/10 bg-[#0e121b] p-6 shadow-2xl text-neutral-100 max-h-[90vh] overflow-y-auto">
        {/* Fechar */}
        <button
          type="button"
          onClick={onFechar}
          className="absolute right-4 top-4 p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="size-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400">
            <Layers className="size-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Galeria de Modelos de Fluxos</h3>
            <p className="text-xs text-neutral-400">
              Escolha uma receita pré-configurada para carregar no construtor visual.
            </p>
          </div>
        </div>

        {/* Filtros e Busca */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 rounded-xl border border-white/5 bg-[#141824] p-1">
            {[
              { id: "todos", rotulo: "Todos" },
              { id: "prospeccao", rotulo: "Prospecção" },
              { id: "vendas", rotulo: "Vendas" },
              { id: "pos_venda", rotulo: "Pós-venda" },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoriaAtiva(cat.id as any)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                  categoriaAtiva === cat.id
                    ? "bg-[#FF5500] text-white shadow"
                    : "text-neutral-400 hover:text-white"
                )}
              >
                {cat.rotulo}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar modelo..."
            className="rounded-xl border border-white/10 bg-[#141824] px-3.5 py-1.5 text-xs text-white placeholder-neutral-500 focus:border-orange-500/60 focus:outline-none"
          />
        </div>

        {/* Grid de Modelos */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtrados.map((modelo) => {
            const Icon = modelo.icon;
            return (
              <div
                key={modelo.id}
                className="group flex flex-col justify-between rounded-xl border border-white/5 bg-[#121620] p-4 transition-all hover:border-orange-500/40 hover:bg-[#161c2a]"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className={cn("flex size-9 items-center justify-center rounded-xl border", modelo.corBg, modelo.corIcone)}>
                      <Icon className="size-4" />
                    </div>
                    <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] font-medium text-neutral-400 capitalize">
                      {modelo.categoria.replace("_", " ")}
                    </span>
                  </div>

                  <h4 className="mt-3 text-sm font-bold text-white group-hover:text-orange-400 transition-colors">
                    {modelo.nome}
                  </h4>
                  <p className="mt-1 text-xs text-neutral-400 line-clamp-2">
                    {modelo.descricao}
                  </p>

                  <div className="mt-3 flex items-center gap-3 text-[11px] text-neutral-400 border-t border-white/5 pt-2">
                    <span>
                      Etapas: <strong className="text-white">{modelo.etapasCount}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Sucesso: <strong className="text-emerald-400">{modelo.taxaSucesso}</strong>
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      onSelecionarModelo(modelo);
                      onFechar();
                    }}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-neutral-200 transition-all hover:border-orange-500/50 hover:bg-orange-500/10 hover:text-white"
                  >
                    <span>Carregar no Canvas</span>
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Rodapé */}
        <div className="mt-6 flex items-center justify-between pt-3 border-t border-white/5 text-xs text-neutral-400">
          <span>{filtrados.length} modelos disponíveis para demonstração</span>
          <button
            type="button"
            onClick={onFechar}
            className="rounded-xl border border-white/10 px-4 py-2 font-semibold text-neutral-300 hover:bg-white/5 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
