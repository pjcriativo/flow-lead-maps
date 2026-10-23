// Modal para Criação e Edição de Atividade no Calendário Semanal
// Interações demonstrativas locais com validação e fidelidade estética.
import React, { useState } from "react";
import {
  AlertCircle,
  Calendar,
  Check,
  Clock,
  Sparkles,
  Tag,
  User,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { EventoCalendario } from "./planejamento-data";

interface AdicionarAtividadeModalProps {
  aberto: boolean;
  onFechar: () => void;
  onSalvarAtividade: (atividade: Omit<EventoCalendario, "id">) => void;
}

export function AdicionarAtividadeModal({
  aberto,
  onFechar,
  onSalvarAtividade,
}: AdicionarAtividadeModalProps) {
  const [titulo, setTitulo] = useState("");
  const [agente, setAgente] = useState("CEO de IA");
  const [diaSemana, setDiaSemana] = useState(2); // Quarta por padrão
  const [horaInicio, setHoraInicio] = useState("09:00");
  const [horaFim, setHoraFim] = useState("10:30");
  const [categoria, setCategoria] = useState<EventoCalendario["categoria"]>("planejamento");
  const [cor, setCor] = useState<EventoCalendario["cor"]>("laranja");
  const [descricao, setDescricao] = useState("");

  if (!aberto) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;

    onSalvarAtividade({
      titulo: titulo.trim(),
      agente,
      diaSemana: Number(diaSemana),
      horaInicio,
      horaFim,
      categoria,
      cor,
      descricao: descricao.trim() || undefined,
    });

    setTitulo("");
    setDescricao("");
    onFechar();
  };

  const handleCategoriaChange = (cat: EventoCalendario["categoria"]) => {
    setCategoria(cat);
    // Sugere cor de acordo com a categoria
    switch (cat) {
      case "planejamento":
        setCor("laranja");
        break;
      case "prospeccao":
        setCor("azul");
        break;
      case "reuniao":
        setCor("ambar");
        break;
      case "campanha":
        setCor("verde");
        break;
      case "analise":
        setCor("roxo");
        break;
      case "followup":
        setCor("ambar");
        break;
      case "proposta":
        setCor("roxo");
        break;
      default:
        setCor("cinza");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl border border-white/10 bg-[#0e121b] p-6 shadow-2xl text-neutral-100 max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onFechar}
          className="absolute right-4 top-4 p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="size-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400">
            <Calendar className="size-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Adicionar Atividade Comercial</h3>
            <p className="text-xs text-neutral-400">
              Agende uma tarefa ou rotina para ser executada pelos agentes de IA.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          {/* Título da Atividade */}
          <div>
            <label className="block font-semibold text-neutral-300 mb-1.5">
              Nome da Atividade *
            </label>
            <input
              type="text"
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Prospecção de 50 novas clínicas em SP"
              className="w-full rounded-xl border border-white/10 bg-[#141824] px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-orange-500/60 focus:outline-none"
            />
          </div>

          {/* Agente Responsável & Dia da Semana */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-neutral-300 mb-1.5">
                Agente Responsável
              </label>
              <select
                value={agente}
                onChange={(e) => setAgente(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#141824] px-3 py-2.5 text-xs text-white focus:border-orange-500/60 focus:outline-none"
              >
                <option value="CEO de IA">CEO de IA (Orquestrador)</option>
                <option value="SDR">SDR (Qualificador)</option>
                <option value="Vendedor">Vendedor (Closer)</option>
                <option value="Estrategista">Estrategista (Campanhas)</option>
                <option value="Equipe">Equipe Comercial</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-neutral-300 mb-1.5">
                Dia da Semana
              </label>
              <select
                value={diaSemana}
                onChange={(e) => setDiaSemana(Number(e.target.value))}
                className="w-full rounded-xl border border-white/10 bg-[#141824] px-3 py-2.5 text-xs text-white focus:border-orange-500/60 focus:outline-none"
              >
                <option value={0}>Segunda-feira (20 Out)</option>
                <option value={1}>Terça-feira (21 Out)</option>
                <option value={2}>Quarta-feira (22 Out) — Hoje</option>
                <option value={3}>Quinta-feira (23 Out)</option>
                <option value={4}>Sexta-feira (24 Out)</option>
                <option value={5}>Sábado (25 Out)</option>
                <option value={6}>Domingo (26 Out)</option>
              </select>
            </div>
          </div>

          {/* Horário Início & Fim */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-neutral-300 mb-1.5">
                Horário Inicial
              </label>
              <input
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#141824] px-3 py-2 text-xs text-white focus:border-orange-500/60 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-300 mb-1.5">
                Horário Final
              </label>
              <input
                type="time"
                value={horaFim}
                onChange={(e) => setHoraFim(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#141824] px-3 py-2 text-xs text-white focus:border-orange-500/60 focus:outline-none"
              />
            </div>
          </div>

          {/* Categoria & Cor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-neutral-300 mb-1.5">
                Categoria da Ação
              </label>
              <select
                value={categoria}
                onChange={(e) => handleCategoriaChange(e.target.value as any)}
                className="w-full rounded-xl border border-white/10 bg-[#141824] px-3 py-2.5 text-xs text-white focus:border-orange-500/60 focus:outline-none"
              >
                <option value="planejamento">Planejamento & Estratégia</option>
                <option value="prospeccao">Prospecção Ativa</option>
                <option value="reuniao">Reunião Comercial</option>
                <option value="campanha">Campanha de Tráfego / Mensagens</option>
                <option value="analise">Análise de Dados / Leads</option>
                <option value="followup">Follow-up com Oportunidades</option>
                <option value="proposta">Envio e Negociação de Proposta</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-neutral-300 mb-1.5">
                Identificação Visual (Cor)
              </label>
              <select
                value={cor}
                onChange={(e) => setCor(e.target.value as any)}
                className="w-full rounded-xl border border-white/10 bg-[#141824] px-3 py-2.5 text-xs text-white focus:border-orange-500/60 focus:outline-none"
              >
                <option value="laranja">Laranja (Executivo / Planejamento)</option>
                <option value="azul">Azul (Prospecção / SDR)</option>
                <option value="verde">Verde (Campanhas / Ativas)</option>
                <option value="roxo">Roxo (Estratégia / Propostas)</option>
                <option value="ambar">Âmbar (Reuniões / Follow-up)</option>
                <option value="cinza">Cinza (Alinhamentos Internos)</option>
              </select>
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block font-semibold text-neutral-300 mb-1.5">
              Descrição / Critérios de Sucesso
            </label>
            <textarea
              rows={2}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva detalhes específicos da execução pelo agente..."
              className="w-full rounded-xl border border-white/10 bg-[#141824] px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:border-orange-500/60 focus:outline-none resize-none"
            />
          </div>

          {/* Rodapé */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/5">
            <button
              type="button"
              onClick={onFechar}
              className="rounded-xl border border-white/10 px-4 py-2 font-semibold text-neutral-300 hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!titulo.trim()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#FF5500] hover:bg-[#e04b00] px-4 py-2 font-bold text-white shadow-lg shadow-orange-600/20 transition-colors disabled:opacity-50"
            >
              <Check className="size-4" />
              <span>Salvar no Calendário</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
