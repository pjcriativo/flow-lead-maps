import { useState } from "react";
import { Calendar, Clock, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import type {
  CanalPlataforma,
  FormatoConteudo,
  PublicacaoItem,
} from "./calendario-data";
import { PlatformIcon } from "../conteudos/PlatformIcon";

interface AgendarPublicacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (pub: Partial<PublicacaoItem>) => void;
}

export function AgendarPublicacaoModal({
  isOpen,
  onClose,
  onSave,
}: AgendarPublicacaoModalProps) {
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState<CanalPlataforma>("instagram");
  const [format, setFormat] = useState<FormatoConteudo>("reels_shorts");
  const [dateStr, setDateStr] = useState("2024-08-14");
  const [timeStr, setTimeStr] = useState("12:00");
  const [mode, setMode] = useState<"manual" | "ia">("manual");

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!title.trim()) {
      toast.error("Informe o título do conteúdo.");
      return;
    }

    onSave({
      title,
      platform,
      format,
      time: timeStr,
      timeSlot: `${timeStr.slice(0, 2)}:00`,
      status: "agendado",
      dayIndex: 3, // Qua 14
      dateIso: `${dateStr}T${timeStr}:00Z`,
      imageUrl:
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&auto=format&fit=crop&q=80",
    });

    toast.success("Publicação agendada com sucesso!");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl border border-home-border/80 bg-[#0E131B] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-home-border/60">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-home-orange/15 border border-home-orange/30 text-home-orange flex items-center justify-center">
              <Calendar className="size-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Agendar Nova Publicação
              </h2>
              <p className="text-xs text-home-muted">
                Programe seu conteúdo nos canais conectados ou use os melhores horários da IA.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-home-muted hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="mt-4 space-y-4 text-xs">
          {/* Título */}
          <div>
            <label className="block text-home-muted font-medium mb-1.5">
              Título da Publicação *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Reels Motivacional - Constância e Foco"
              className="w-full bg-[#141A23] border border-home-border/60 rounded-lg p-2.5 text-white placeholder:text-home-muted/50 focus:outline-none focus:border-home-orange"
            />
          </div>

          {/* Canal & Formato */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-home-muted font-medium mb-1.5">
                Canal
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as CanalPlataforma)}
                className="w-full bg-[#141A23] border border-home-border/60 rounded-lg p-2.5 text-white focus:outline-none focus:border-home-orange"
              >
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
                <option value="linkedin">LinkedIn</option>
                <option value="youtube">YouTube</option>
                <option value="tiktok">TikTok</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>

            <div>
              <label className="block text-home-muted font-medium mb-1.5">
                Formato
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as FormatoConteudo)}
                className="w-full bg-[#141A23] border border-home-border/60 rounded-lg p-2.5 text-white focus:outline-none focus:border-home-orange"
              >
                <option value="reels_shorts">Reels / Shorts</option>
                <option value="post_simples">Post simples</option>
                <option value="carrossel">Carrossel</option>
                <option value="video_longo">Vídeo longo</option>
                <option value="artigo">Artigo</option>
                <option value="mensagem">Mensagem</option>
              </select>
            </div>
          </div>

          {/* Modo de Agendamento */}
          <div>
            <label className="block text-home-muted font-medium mb-1.5">
              Modo de Agendamento
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode("manual")}
                className={`py-2 px-3 rounded-lg border text-left flex items-center gap-2 cursor-pointer transition-colors ${
                  mode === "manual"
                    ? "bg-home-surface-strong border-home-orange text-white"
                    : "bg-[#141A23] border-home-border/60 text-home-muted hover:text-white"
                }`}
              >
                <Clock className="size-3.5 text-home-orange shrink-0" />
                <div>
                  <span className="font-semibold block text-[11px]">Horário específico</span>
                  <span className="text-[10px] text-home-muted">Definir data e hora</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMode("ia")}
                className={`py-2 px-3 rounded-lg border text-left flex items-center gap-2 cursor-pointer transition-colors ${
                  mode === "ia"
                    ? "bg-home-surface-strong border-home-orange text-white"
                    : "bg-[#141A23] border-home-border/60 text-home-muted hover:text-white"
                }`}
              >
                <Sparkles className="size-3.5 text-purple-400 shrink-0" />
                <div>
                  <span className="font-semibold block text-[11px]">Melhor horário por IA</span>
                  <span className="text-[10px] text-home-muted">Pico de audiência</span>
                </div>
              </button>
            </div>
          </div>

          {/* Data e Hora */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-home-muted font-medium mb-1.5">
                Data de Publicação
              </label>
              <input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full bg-[#141A23] border border-home-border/60 rounded-lg p-2.5 text-white focus:outline-none focus:border-home-orange"
              >
              </input>
            </div>
            <div>
              <label className="block text-home-muted font-medium mb-1.5">
                Horário
              </label>
              <input
                type="time"
                value={timeStr}
                onChange={(e) => setTimeStr(e.target.value)}
                className="w-full bg-[#141A23] border border-home-border/60 rounded-lg p-2.5 text-white focus:outline-none focus:border-home-orange"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t border-home-border/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-home-muted hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-home-orange hover:bg-home-orange-hover text-white shadow-[0_0_15px_rgba(255,98,0,0.3)] transition-all cursor-pointer"
          >
            Confirmar Agendamento
          </button>
        </div>
      </div>
    </div>
  );
}
