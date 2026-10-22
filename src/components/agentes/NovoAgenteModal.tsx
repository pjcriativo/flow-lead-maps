import React, { useState } from "react";
import {
  Bot,
  Briefcase,
  Check,
  Plus,
  ShieldCheck,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgenteDetalhado } from "./equipe-data";

interface NovoAgenteModalProps {
  aberto: boolean;
  onFechar: () => void;
  onCriar: (agente: AgenteDetalhado) => void;
}

const AVATARES_SUGERIDOS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
];

export function NovoAgenteModal({ aberto, onFechar, onCriar }: NovoAgenteModalProps) {
  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("");
  const [departamento, setDepartamento] = useState("Prospecção");
  const [especialidade, setEspecialidade] = useState("");
  const [metas, setMetas] = useState("");
  const [nivelAutonomia, setNivelAutonomia] = useState<"Alto" | "Supervisionado">("Supervisionado");
  const [avatarUrl, setAvatarUrl] = useState(AVATARES_SUGERIDOS[0]);

  if (!aberto) return null;

  const salvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !cargo.trim()) return;

    const novo: AgenteDetalhado = {
      id: `agente-${Date.now()}`,
      nome: nome.trim(),
      cargo: cargo.trim(),
      departamento,
      departamentoId: departamento.toLowerCase().replace(/\s+/g, "-"),
      especialidade: especialidade.trim() || "Operações Comerciais",
      avatarUrl,
      status: "Online",
      tarefas: 0,
      metas: metas.trim() || "Aguardando primeira distribuição de tarefas pelo CEO",
      descricao: `Especialista em ${departamento} atuando em modo ${nivelAutonomia}.`,
      taxaSucesso: "100%",
      nivelAutonomia,
    };

    onCriar(novo);
    onFechar();
    setNome("");
    setCargo("");
    setEspecialidade("");
    setMetas("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={onFechar} />

      <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-[#1b2232] bg-[#0c1017] text-neutral-100 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#1b2232] bg-[#121620] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-orange-500/20 text-[#f95d14]">
              <Bot className="size-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Adicionar Novo Agente de IA
              </h3>
              <p className="text-xs text-neutral-400">
                Configure um novo especialista para integrar a equipe comercial.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onFechar}
            className="rounded-lg p-1 text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={salvar} className="space-y-4 p-6 text-xs">
          {/* Avatar Selection */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300">
              Avatar do Profissional
            </label>
            <div className="mt-2 flex items-center gap-3">
              {AVATARES_SUGERIDOS.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setAvatarUrl(url)}
                  className={cn(
                    "relative size-12 overflow-hidden rounded-full border-2 transition-all",
                    avatarUrl === url
                      ? "border-[#f95d14] ring-2 ring-[#f95d14]/40 scale-105"
                      : "border-white/15 opacity-60 hover:opacity-100",
                  )}
                >
                  <img src={url} alt="Avatar" className="size-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-neutral-300">Nome do Agente</label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Clara, Bernardo, Lucas..."
                className="mt-1 w-full rounded-xl border border-[#1b2232] bg-[#111723] p-2.5 text-xs text-white focus:border-[#f95d14] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-300">Cargo / Função</label>
              <input
                type="text"
                required
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                placeholder="Ex: Auditor de Propostas, SDR B2B..."
                className="mt-1 w-full rounded-xl border border-[#1b2232] bg-[#111723] p-2.5 text-xs text-white focus:border-[#f95d14] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-neutral-300">Departamento</label>
              <select
                value={departamento}
                onChange={(e) => setDepartamento(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#1b2232] bg-[#111723] p-2.5 text-xs text-white focus:border-[#f95d14] focus:outline-none"
              >
                <option value="Direção">Direção</option>
                <option value="Estratégia">Estratégia</option>
                <option value="Prospecção">Prospecção</option>
                <option value="Pré-vendas">Pré-vendas</option>
                <option value="Vendas">Vendas</option>
                <option value="Gestão Comercial">Gestão Comercial</option>
                <option value="SEO e Marketing">SEO e Marketing</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-neutral-300">Nível de Autonomia</label>
              <select
                value={nivelAutonomia}
                onChange={(e) => setNivelAutonomia(e.target.value as "Alto" | "Supervisionado")}
                className="mt-1 w-full rounded-xl border border-[#1b2232] bg-[#111723] p-2.5 text-xs text-white focus:border-[#f95d14] focus:outline-none"
              >
                <option value="Supervisionado">Supervisionado (Copiloto)</option>
                <option value="Alto">Alto (Execução Direta)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-neutral-300">Especialidade Principal</label>
            <input
              type="text"
              value={especialidade}
              onChange={(e) => setEspecialidade(e.target.value)}
              placeholder="Ex: Mensagens diretas, quebra de objeções no WhatsApp..."
              className="mt-1 w-full rounded-xl border border-[#1b2232] bg-[#111723] p-2.5 text-xs text-white focus:border-[#f95d14] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-neutral-300">Metas Iniciais</label>
            <input
              type="text"
              value={metas}
              onChange={(e) => setMetas(e.target.value)}
              placeholder="Ex: Analisar 200 propostas / mês..."
              className="mt-1 w-full rounded-xl border border-[#1b2232] bg-[#111723] p-2.5 text-xs text-white focus:border-[#f95d14] focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1b2232]">
            <button
              type="button"
              onClick={onFechar}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 font-semibold text-neutral-300 hover:bg-white/10"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-xl bg-[#f95d14] px-5 py-2 font-semibold text-white shadow-lg shadow-orange-500/20 hover:bg-[#ff6c26]"
            >
              <Plus className="size-4" />
              <span>Adicionar à Equipe</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
