import {
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  Edit3,
  Repeat,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { PublicacaoItem } from "./calendario-data";
import { PlatformIcon } from "../conteudos/PlatformIcon";

interface PublicacaoDetalhesDrawerProps {
  item: PublicacaoItem | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (id: string, newStatus: PublicacaoItem["status"]) => void;
}

export function PublicacaoDetalhesDrawer({
  item,
  isOpen,
  onClose,
  onStatusChange,
}: PublicacaoDetalhesDrawerProps) {
  if (!isOpen || !item) return null;

  const handleApprove = () => {
    onStatusChange?.(item.id, "publicado");
    toast.success("Publicação aprovada com sucesso!");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity">
      <div className="relative w-full max-w-md h-full bg-[#0E131B] border-l border-home-border/70 p-6 overflow-y-auto shadow-2xl flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-home-border/60">
            <div className="flex items-center gap-2">
              <PlatformIcon platform={item.platform} size="md" />
              <div>
                <span className="text-[11px] font-semibold text-home-muted uppercase tracking-wider">
                  {item.platform} • {item.format.replace("_", " ")}
                </span>
                <h3 className="text-base font-bold text-white">
                  {item.title}
                </h3>
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

          {/* Media Preview */}
          <div className="mt-4 rounded-xl overflow-hidden border border-white/10 aspect-video bg-black/50">
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Status & Schedule Info */}
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <div className="bg-[#141A23] border border-home-border/60 rounded-xl p-3 flex flex-col gap-1">
              <span className="text-[10px] text-home-muted font-medium flex items-center gap-1">
                <Clock className="size-3" /> Horário
              </span>
              <span className="text-xs font-bold text-white">
                {item.time} ({item.dateIso.slice(8, 10)} de Agosto)
              </span>
            </div>

            <div className="bg-[#141A23] border border-home-border/60 rounded-xl p-3 flex flex-col gap-1">
              <span className="text-[10px] text-home-muted font-medium flex items-center gap-1">
                <CheckCircle2 className="size-3" /> Status
              </span>
              <span className="text-xs font-bold text-white capitalize">
                {item.status.replace("_", " ")}
              </span>
            </div>
          </div>

          {/* Copy Text */}
          {item.copy && (
            <div className="mt-3 bg-[#141A23] border border-home-border/60 rounded-xl p-3 flex flex-col gap-2">
              <span className="text-[10px] text-home-muted font-medium">
                Copy da Publicação
              </span>
              <p className="text-xs text-white/90 whitespace-pre-line leading-relaxed">
                {item.copy}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons Footer */}
        <div className="mt-6 pt-4 border-t border-home-border/60 flex flex-col gap-2">
          {item.status !== "publicado" && (
            <button
              type="button"
              onClick={handleApprove}
              className="w-full py-2.5 rounded-xl bg-home-orange hover:bg-home-orange-hover text-white text-xs font-semibold shadow-[0_0_15px_rgba(255,98,0,0.35)] transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="size-3.5" />
              Aprovar Publicação
            </button>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toast.info("Modo de edição habilitado.")}
              className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-medium border border-white/10 transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <Edit3 className="size-3" />
              Editar
            </button>
            <button
              type="button"
              onClick={() => toast.info("Reagendamento solicitado.")}
              className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-medium border border-white/10 transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <Repeat className="size-3" />
              Reagendar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
