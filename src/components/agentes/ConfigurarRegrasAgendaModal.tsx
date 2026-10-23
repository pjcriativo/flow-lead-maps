// Modal de Configuração de Regras da Agenda Inteligente
// Parametrização de intervalos, limites diários por closer e regras de confirmação.
import React, { useState } from "react";
import {
  Check,
  Clock,
  ShieldCheck,
  Sliders,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfigurarRegrasAgendaModalProps {
  aberto: boolean;
  onFechar: () => void;
  onSalvar: () => void;
}

export function ConfigurarRegrasAgendaModal({
  aberto,
  onFechar,
  onSalvar,
}: ConfigurarRegrasAgendaModalProps) {
  const [duracaoPadrao, setDuracaoPadrao] = useState("30");
  const [intervaloMinimo, setIntervaloMinimo] = useState("15");
  const [limiteDiario, setLimiteDiario] = useState("6");
  const [confirmacaoObrigatoria, setConfirmacaoObrigatoria] = useState(true);
  const [lembreteWhatsApp, setLembreteWhatsApp] = useState(true);
  const [antecedenciaMinima, setAntecedenciaMinima] = useState("2");

  if (!aberto) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSalvar();
    onFechar();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0e121b] p-6 shadow-2xl text-neutral-100 max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onFechar}
          className="absolute right-4 top-4 p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="size-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400">
            <Sliders className="size-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Configurar Regras da Agenda</h3>
            <p className="text-xs text-neutral-400">
              Defina as diretrizes operacionais de agendamento aplicadas pelos agentes SDR e closers.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          {/* Duração Padrão & Intervalo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-neutral-300 mb-1.5">
                Duração Padrão das Reuniões
              </label>
              <select
                value={duracaoPadrao}
                onChange={(e) => setDuracaoPadrao(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#141824] px-3 py-2 text-xs text-white focus:border-orange-500/60 focus:outline-none"
              >
                <option value="15">15 minutos (Quick Call)</option>
                <option value="30">30 minutos (Padrão)</option>
                <option value="45">45 minutos (Demo)</option>
                <option value="60">60 minutos (Consultoria)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-neutral-300 mb-1.5">
                Intervalo Mínimo (Buffer)
              </label>
              <select
                value={intervaloMinimo}
                onChange={(e) => setIntervaloMinimo(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#141824] px-3 py-2 text-xs text-white focus:border-orange-500/60 focus:outline-none"
              >
                <option value="0">Sem intervalo</option>
                <option value="10">10 minutos</option>
                <option value="15">15 minutos (Recomendado)</option>
                <option value="30">30 minutos</option>
              </select>
            </div>
          </div>

          {/* Limite Diário & Antecedência */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-neutral-300 mb-1.5">
                Limite Diário por Closer
              </label>
              <input
                type="number"
                value={limiteDiario}
                onChange={(e) => setLimiteDiario(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#141824] px-3 py-2 text-xs text-white focus:border-orange-500/60 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-300 mb-1.5">
                Antecedência Mínima (Horas)
              </label>
              <input
                type="number"
                value={antecedenciaMinima}
                onChange={(e) => setAntecedenciaMinima(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#141824] px-3 py-2 text-xs text-white focus:border-orange-500/60 focus:outline-none"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-2.5 pt-2 border-t border-white/5">
            <div className="flex items-center justify-between rounded-xl border border-white/5 bg-[#141824] p-3">
              <div>
                <span className="font-semibold text-white block">Confirmação Prévia Obrigatória</span>
                <span className="text-[10px] text-neutral-400">
                  Exige que o lead confirme presença 2h antes da reunião via WhatsApp
                </span>
              </div>
              <button
                type="button"
                onClick={() => setConfirmacaoObrigatoria(!confirmacaoObrigatoria)}
                className={cn(
                  "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
                  confirmacaoObrigatoria ? "bg-orange-500" : "bg-neutral-700"
                )}
              >
                <span
                  className={cn(
                    "inline-block size-3.5 transform rounded-full bg-white transition-transform",
                    confirmacaoObrigatoria ? "translate-x-4" : "translate-x-1"
                  )}
                />
              </button>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-white/5 bg-[#141824] p-3">
              <div>
                <span className="font-semibold text-white block">Lembretes Automáticos por WhatsApp</span>
                <span className="text-[10px] text-neutral-400">
                  Disparo de lembrete 24h e 1h antes com link do Google Meet
                </span>
              </div>
              <button
                type="button"
                onClick={() => setLembreteWhatsApp(!lembreteWhatsApp)}
                className={cn(
                  "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
                  lembreteWhatsApp ? "bg-orange-500" : "bg-neutral-700"
                )}
              >
                <span
                  className={cn(
                    "inline-block size-3.5 transform rounded-full bg-white transition-transform",
                    lembreteWhatsApp ? "translate-x-4" : "translate-x-1"
                  )}
                />
              </button>
            </div>
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
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#FF5500] hover:bg-[#e04b00] px-4 py-2 font-bold text-white shadow-lg shadow-orange-600/20 transition-colors"
            >
              <Check className="size-4" />
              <span>Salvar Regras</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
