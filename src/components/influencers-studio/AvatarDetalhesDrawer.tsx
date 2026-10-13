import React from "react";
import { X, Play, Languages, Mic, Award, CheckCircle2, Clapperboard, Star } from "lucide-react";
import type { FeaturedAvatarItem } from "./influencers-data";

interface AvatarDetalhesDrawerProps {
  avatar: FeaturedAvatarItem | null;
  onClose: () => void;
  onUsarEmVideo: (avatar: FeaturedAvatarItem) => void;
}

export const AvatarDetalhesDrawer: React.FC<AvatarDetalhesDrawerProps> = ({
  avatar,
  onClose,
  onUsarEmVideo,
}) => {
  if (!avatar) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#0F1626] border-l border-slate-800 h-full p-6 overflow-y-auto flex flex-col justify-between shadow-2xl relative">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
            <div>
              <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider">
                Perfil do Influencer de IA
              </span>
              <h3 className="text-lg font-bold text-white">{avatar.name}</h3>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Avatar Photo with Badge */}
          <div className="relative rounded-2xl overflow-hidden mb-6 border border-slate-800 shadow-xl bg-slate-900 aspect-[4/5]">
            <img
              src={avatar.imageUrl}
              alt={avatar.name}
              className="w-full h-full object-cover object-top"
            />
            <div className="absolute top-3 left-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-black/70 backdrop-blur-md text-amber-400 border border-amber-500/40">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                {avatar.categoryBadge}
              </span>
            </div>

            {/* Play audio preview */}
            <div className="absolute bottom-3 right-3">
              <button
                type="button"
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-orange-500 text-white shadow-lg hover:bg-orange-600 transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Ouvir Voz</span>
              </button>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Especialidade & Função
              </h4>
              <p className="text-sm font-bold text-white">{avatar.role}</p>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Idiomas Disponíveis
              </h4>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Languages className="w-4 h-4 text-orange-400 shrink-0" />
                <span>{avatar.language || "Português (BR), Inglês, Espanhol (+40)"}</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Estilo Vocal
              </h4>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Mic className="w-4 h-4 text-orange-400 shrink-0" />
                <span>{avatar.voiceStyle || "Natural, Empática e Articulada"}</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Sobre este Influencer
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                {avatar.description ||
                  "Treinado em modelos de inteligência artificial de última geração com sincronização labial avançada e microexpressões faciais humanas."}
              </p>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="pt-6 border-t border-slate-800 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors text-center"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={() => {
              onUsarEmVideo(avatar);
              onClose();
            }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-md transition-all text-center cursor-pointer"
          >
            <Clapperboard className="w-4 h-4" />
            <span>Usar em Vídeo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
