// Modal de Agendamento de Nova Reunião Comercial
// Permite cadastrar reuniões no calendário da equipe com validação local.
import React, { useState } from "react";
import {
  Calendar,
  Check,
  Clock,
  Globe,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Sparkles,
  User,
  Video,
  X,
} from "lucide-react";
import type { ReuniãoCalendario } from "./agenda-data";

interface NovaReuniaoModalProps {
  aberto: boolean;
  onFechar: () => void;
  onSalvar: (reuniao: Omit<ReuniãoCalendario, "id">) => void;
}

export function NovaReuniaoModal({
  aberto,
  onFechar,
  onSalvar,
}: NovaReuniaoModalProps) {
  const [titulo, setTitulo] = useState("");
  const [empresaOuLead, setEmpresaOuLead] = useState("");
  const [responsavel, setResponsavel] = useState("Vendedor");
  const [diaSemana, setDiaSemana] = useState(2); // Quarta por padrão
  const [horaInicio, setHoraInicio] = useState("09:00");
  const [horaFim, setHoraFim] = useState("09:30");
  const [categoria, setCategoria] = useState<ReuniãoCalendario["categoria"]>("comercial");
  const [isOnline, setIsOnline] = useState(true);
  const [leadTelefone, setLeadTelefone] = useState("");
  const [resumoQualificacao, setResumoQualificacao] = useState("");

  if (!aberto) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !empresaOuLead.trim()) return;

    let cor: ReuniãoCalendario["cor"] = "azul";
    if (categoria === "comercial") cor = "azul";
    else if (categoria === "estrategia") cor = "roxo";
    else if (categoria === "demo") cor = "verde";
    else if (categoria === "followup") cor = "ambar";
    else if (categoria === "onboarding") cor = "verde";
    else if (categoria === "prospeccao") cor = "azul";
    else if (categoria === "planejamento") cor = "cinza";

    onSalvar({
      titulo: titulo.trim(),
      empresaOuLead: empresaOuLead.trim(),
      responsavel,
      diaSemana: Number(diaSemana),
      horaInicio,
      horaFim,
      categoria,
      cor,
      isOnline,
      status: "confirmada",
      leadTelefone: leadTelefone.trim() || undefined,
      resumoQualificacao: resumoQualificacao.trim() || undefined,
    });

    setTitulo("");
    setEmpresaOuLead("");
    setResumoQualificacao("");
    onFechar();
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
            <h3 className="text-lg font-bold text-white">Agendar Nova Reunião</h3>
            <p className="text-xs text-neutral-400">
              Cadastre uma reunião comercial e distribua para o agente ou closer responsável.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          {/* Título & Empresa */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-neutral-300 mb-1.5">
                Título da Reunião *
              </label>
              <input
                type="text"
                required
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Apresentação Comercial"
                className="w-full rounded-xl border border-white/10 bg-[#141824] px-3.5 py-2 text-xs text-white focus:border-orange-500/60 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-300 mb-1.5">
                Empresa / Lead *
              </label>
              <input
                type="text"
                required
                value={empresaOuLead}
                onChange={(e) => setEmpresaOuLead(e.target.value)}
                placeholder="Ex: Clínica Sorriso Saúde"
                className="w-full rounded-xl border border-white/10 bg-[#141824] px-3.5 py-2 text-xs text-white focus:border-orange-500/60 focus:outline-none"
              />
            </div>
          </div>

          {/* Responsável & Categoria */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-neutral-300 mb-1.5">
                Vendedor / Closer Responsável
              </label>
              <select
                value={responsavel}
                onChange={(e) => setResponsavel(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#141824] px-3 py-2 text-xs text-white focus:border-orange-500/60 focus:outline-none"
              >
                <option value="Vendedor">Vendedor (Closer Especialista)</option>
                <option value="SDR">SDR (Qualificador)</option>
                <option value="CEO de IA">CEO de IA (Orquestrador)</option>
                <option value="Estrategista">Estrategista</option>
                <option value="Gerente Comercial">Gerente Comercial</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-neutral-300 mb-1.5">
                Tipo de Reunião
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as any)}
                className="w-full rounded-xl border border-white/10 bg-[#141824] px-3 py-2 text-xs text-white focus:border-orange-500/60 focus:outline-none"
              >
                <option value="comercial">Apresentação Comercial</option>
                <option value="demo">Demonstração de Produto</option>
                <option value="estrategia">Alinhamento Estratégico</option>
                <option value="followup">Follow-up de Proposta</option>
                <option value="onboarding">Onboarding / Boas-vindas</option>
              </select>
            </div>
          </div>

          {/* Dia da Semana & Horário */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-neutral-300 mb-1.5">
                Dia da Semana
              </label>
              <select
                value={diaSemana}
                onChange={(e) => setDiaSemana(Number(e.target.value))}
                className="w-full rounded-xl border border-white/10 bg-[#141824] px-3 py-2 text-xs text-white focus:border-orange-500/60 focus:outline-none"
              >
                <option value={0}>Seg 20 Out</option>
                <option value={1}>Ter 21 Out</option>
                <option value={2}>Qua 22 Out (Hoje)</option>
                <option value={3}>Qui 23 Out</option>
                <option value={4}>Sex 24 Out</option>
                <option value={5}>Sáb 25 Out</option>
                <option value={6}>Dom 26 Out</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-neutral-300 mb-1.5">
                Início
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
                Fim
              </label>
              <input
                type="time"
                value={horaFim}
                onChange={(e) => setHoraFim(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#141824] px-3 py-2 text-xs text-white focus:border-orange-500/60 focus:outline-none"
              />
            </div>
          </div>

          {/* Modalidade */}
          <div className="flex items-center justify-between rounded-xl border border-white/5 bg-[#141824] p-3">
            <div className="flex items-center gap-2">
              <Video className="size-4 text-orange-400" />
              <div>
                <span className="font-semibold text-white block">Videoconferência Online</span>
                <span className="text-[10px] text-neutral-400">Gera link dinâmico do Google Meet</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOnline(!isOnline)}
              className={cn(
                "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
                isOnline ? "bg-orange-500" : "bg-neutral-700"
              )}
            >
              <span
                className={cn(
                  "inline-block size-3.5 transform rounded-full bg-white transition-transform",
                  isOnline ? "translate-x-4" : "translate-x-1"
                )}
              />
            </button>
          </div>

          {/* Resumo da Qualificação SDR */}
          <div>
            <label className="block font-semibold text-neutral-300 mb-1.5">
              Resumo da Qualificação (Handover SDR → Vendedor)
            </label>
            <textarea
              rows={2}
              value={resumoQualificacao}
              onChange={(e) => setResumoQualificacao(e.target.value)}
              placeholder="Dores identificadas, orçamento estimado e decisores presentes..."
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
              disabled={!titulo.trim() || !empresaOuLead.trim()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#FF5500] hover:bg-[#e04b00] px-4 py-2 font-bold text-white shadow-lg shadow-orange-600/20 transition-colors disabled:opacity-50"
            >
              <Check className="size-4" />
              <span>Agendar Reunião</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
