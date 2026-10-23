// Modal de Detalhes da Reunião e Handover SDR → Vendedor
// Apresenta a qualificação do lead, status da agenda e ações rápidas de reagendamento.
import React from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  RotateCcw,
  Sparkles,
  User,
  Video,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReuniãoCalendario } from "./agenda-data";

interface DetalhesReuniaoModalProps {
  reuniao: ReuniãoCalendario | null;
  onFechar: () => void;
  onReagendar?: (id: string) => void;
  onCancelar?: (id: string) => void;
}

export function DetalhesReuniaoModal({
  reuniao,
  onFechar,
  onReagendar,
  onCancelar,
}: DetalhesReuniaoModalProps) {
  if (!reuniao) return null;

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

        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400">
            <Calendar className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white truncate">{reuniao.titulo}</h3>
              <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-bold text-emerald-400 capitalize">
                {reuniao.status}
              </span>
            </div>
            <p className="text-xs text-neutral-300 font-medium">
              {reuniao.empresaOuLead}
            </p>
          </div>
        </div>

        {/* Bloco de Horário e Modalidade */}
        <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2.5 rounded-xl border border-white/5 bg-[#141824] p-3">
            <Clock className="size-4 text-orange-400 shrink-0" />
            <div>
              <span className="text-[10px] text-neutral-400 block">Horário Agendado</span>
              <span className="font-bold text-white">
                {reuniao.horaInicio} - {reuniao.horaFim}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl border border-white/5 bg-[#141824] p-3">
            <Video className="size-4 text-blue-400 shrink-0" />
            <div>
              <span className="text-[10px] text-neutral-400 block">Modalidade</span>
              <span className="font-bold text-white">
                {reuniao.isOnline ? "Google Meet (Online)" : "Reunião Presencial"}
              </span>
            </div>
          </div>
        </div>

        {/* Handover SDR → Vendedor */}
        <div className="mt-4 rounded-xl border border-purple-500/30 bg-[#161226] p-4 text-xs space-y-2">
          <div className="flex items-center gap-2 text-purple-300 font-bold">
            <Sparkles className="size-4" />
            <span>Handover SDR → Closer</span>
          </div>

          <p className="text-neutral-300 text-xs leading-relaxed">
            {reuniao.resumoQualificacao ||
              "Lead qualificado pelo agente SDR com base no perfil ideal de cliente (ICP). Agendamento confirmado e inserido automaticamente na agenda do vendedor."}
          </p>

          <div className="flex items-center gap-4 text-[11px] text-neutral-400 pt-2 border-t border-purple-500/20">
            <span>
              Responsável na chamada: <strong className="text-white">{reuniao.responsavel}</strong>
            </span>
          </div>
        </div>

        {/* Ações */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/5">
          <button
            type="button"
            onClick={() => {
              if (onCancelar) onCancelar(reuniao.id);
              onFechar();
            }}
            className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition-colors"
          >
            Cancelar Reunião
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (onReagendar) onReagendar(reuniao.id);
                onFechar();
              }}
              className="rounded-xl border border-white/10 bg-[#141824] px-4 py-2 text-xs font-semibold text-neutral-200 hover:text-white hover:border-white/20 transition-colors"
            >
              Reagendar
            </button>

            <button
              type="button"
              onClick={onFechar}
              className="rounded-xl bg-[#FF5500] hover:bg-[#e04b00] px-4 py-2 text-xs font-bold text-white shadow-lg shadow-orange-600/20 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
