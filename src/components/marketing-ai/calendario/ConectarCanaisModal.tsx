import { CheckCircle2, Globe, Shield, X } from "lucide-react";
import { toast } from "sonner";
import { CANAIS_STATUS } from "./calendario-data";
import { PlatformIcon } from "../conteudos/PlatformIcon";

interface ConectarCanaisModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConectarCanaisModal({
  isOpen,
  onClose,
}: ConectarCanaisModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl border border-home-border/80 bg-[#0E131B] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-home-border/60">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-home-orange/15 border border-home-orange/30 text-home-orange flex items-center justify-center">
              <Globe className="size-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Canais e Contas Conectadas
              </h2>
              <p className="text-xs text-home-muted">
                Gerencie permissões para publicação automática de conteúdo.
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

        {/* Channels List */}
        <div className="mt-4 space-y-2.5">
          {CANAIS_STATUS.map((channel) => (
            <div
              key={channel.id}
              className="flex items-center justify-between rounded-xl border border-home-border/60 bg-[#141A23] p-3 text-xs"
            >
              <div className="flex items-center gap-3">
                <PlatformIcon platform={channel.id} size="md" />
                <div>
                  <span className="font-semibold text-white block">
                    {channel.name}
                  </span>
                  <span className="text-[10px] text-home-muted">
                    Permissões de postagem ativas
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="size-3" />
                  Conectado
                </span>
                <button
                  type="button"
                  onClick={() => toast.info(`Configurações de ${channel.name} abertas.`)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-home-muted hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Configurar
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Security badge */}
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-white/5 p-2.5 text-[11px] text-home-muted">
          <Shield className="size-4 text-emerald-400 shrink-0" />
          <span>Suas conexões usam OAuth seguro e tokens criptografados de cada rede oficial.</span>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-end pt-4 border-t border-home-border/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-home-orange hover:bg-home-orange-hover text-white shadow-[0_0_15px_rgba(255,98,0,0.3)] transition-all cursor-pointer"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
}
