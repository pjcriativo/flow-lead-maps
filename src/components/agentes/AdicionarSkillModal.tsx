// Modal para Adicionar Nova Skill ao Catálogo Demonstrativo do Agente
import React, { useState } from "react";
import {
  Brain,
  Check,
  CheckCircle2,
  Code,
  Info,
  Lightbulb,
  Plus,
  ShieldCheck,
  Sliders,
  Sparkles,
  Target,
  Wrench,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SkillItem } from "./skills-data";

interface AdicionarSkillModalProps {
  aberto: boolean;
  onFechar: () => void;
  onAdicionar: (novaSkill: SkillItem) => void;
}

export function AdicionarSkillModal({
  aberto,
  onFechar,
  onAdicionar,
}: AdicionarSkillModalProps) {
  if (!aberto) return null;

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("Estratégia");
  const [ferramentas, setFerramentas] = useState("CRM, OpenAI, WhatsApp");
  const [permissaoSensivel, setPermissaoSensivel] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !descricao.trim()) return;

    setSalvando(true);
    setTimeout(() => {
      onAdicionar({
        id: `skill-${Date.now()}`,
        nome,
        descricao,
        categoria,
        ativo: true,
        icon: Wrench,
        corIcone: "text-[#f95d14]",
        corBg: "bg-orange-500/10 border-orange-500/20",
      });
      setSalvando(false);
      onFechar();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-[#1e2638] bg-[#0c1017] p-6 shadow-2xl space-y-5">
        
        {/* Cabeçalho */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl border border-orange-500/30 bg-orange-500/10 text-[#f95d14]">
              <Sparkles className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Adicionar Nova Skill</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Capacidade operacional para o agente</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onFechar}
            className="rounded-lg p-1 text-neutral-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Aviso de demonstração */}
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 flex items-start gap-2.5">
          <Info className="size-4 text-blue-400 shrink-0 mt-0.5" />
          <p className="text-xs text-neutral-300 leading-relaxed">
            Nesta etapa visual, novas skills são registradas no catálogo local demonstrativo. O motor de execução e regras de MCP serão habilitados nas fases seguintes.
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 block mb-1.5">
              Nome da Habilidade *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Qualificação Avançada de Leads B2B"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full rounded-xl border border-[#1e2638] bg-[#121620] px-3 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 block mb-1.5">
                Categoria
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full rounded-xl border border-[#1e2638] bg-[#121620] px-3 py-2.5 text-xs text-white focus:border-orange-500 focus:outline-none"
              >
                <option>Estratégia</option>
                <option>Dados</option>
                <option>Gestão</option>
                <option>Comunicação</option>
                <option>Automação</option>
                <option>Vendas</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 block mb-1.5">
                Agente Responsável
              </label>
              <input
                type="text"
                disabled
                value="CEO de IA (Orquestrador)"
                className="w-full rounded-xl border border-[#1e2638] bg-[#090c12] px-3 py-2.5 text-xs text-neutral-400 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 block mb-1.5">
              Descrição Operacional *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Descreva o que esta habilidade permite que o agente realize com autonomia..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full rounded-xl border border-[#1e2638] bg-[#121620] p-3 text-xs text-white placeholder-neutral-500 focus:border-orange-500 focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 block mb-1.5">
              Ferramentas &amp; Módulos Requeridos
            </label>
            <input
              type="text"
              value={ferramentas}
              onChange={(e) => setFerramentas(e.target.value)}
              placeholder="Ex: CRM, Evolution API, Google Maps"
              className="w-full rounded-xl border border-[#1e2638] bg-[#121620] px-3 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-[#1e2638] bg-[#121620] p-3">
            <div>
              <p className="font-semibold text-white">Requer Aprovação Humana</p>
              <p className="text-[11px] text-neutral-400">
                Ações sensíveis executadas por esta skill exigem confirmação do operador
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPermissaoSensivel(!permissaoSensivel)}
              className={cn(
                "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
                permissaoSensivel ? "bg-orange-500" : "bg-neutral-800",
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block size-4 transform rounded-full bg-white shadow ring-0 transition duration-200",
                  permissaoSensivel ? "translate-x-4" : "translate-x-0",
                )}
              />
            </button>
          </div>

          {/* Rodapé com botões */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#1b2232]">
            <button
              type="button"
              onClick={onFechar}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-neutral-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="flex items-center gap-1.5 rounded-xl bg-[#f95d14] px-5 py-2 text-xs font-bold text-white shadow-md shadow-orange-500/20 hover:bg-[#ff6c26] transition-all"
            >
              <Plus className="size-3.5" />
              <span>{salvando ? "Adicionando..." : "Adicionar Skill"}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
