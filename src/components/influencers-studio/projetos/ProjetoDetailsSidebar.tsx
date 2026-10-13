import React, { useState } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Subtitles,
  Pencil,
  Sliders,
  Download,
  Copy,
  Share2,
  Send,
  Trash2,
  User,
  ShoppingBag,
  Smartphone,
  Clock,
  Calendar,
  UserCheck,
  Mic,
  Home,
  Sparkles,
  Music,
  Check,
  ChevronDown,
} from "lucide-react";
import { type ProjetoVideoItem } from "./projetos-data";

interface ProjetoDetailsSidebarProps {
  project: ProjetoVideoItem;
  onBaixarVideo: (project: ProjetoVideoItem) => void;
  onEditarProjeto: (project: ProjetoVideoItem) => void;
  onDuplicar: (project: ProjetoVideoItem) => void;
  onCompartilhar: (project: ProjetoVideoItem) => void;
  onPublicar: (project: ProjetoVideoItem) => void;
  onExcluir: (project: ProjetoVideoItem) => void;
  onOpenPlayerModal: (project: ProjetoVideoItem) => void;
}

export const ProjetoDetailsSidebar: React.FC<ProjetoDetailsSidebarProps> = ({
  project,
  onBaixarVideo,
  onEditarProjeto,
  onDuplicar,
  onCompartilhar,
  onPublicar,
  onExcluir,
  onOpenPlayerModal,
}) => {
  const [activeTab, setActiveTab] = useState<"info" | "roteiro" | "cenas" | "elementos">("info");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="bg-[#0E1626]/90 border border-slate-800/80 rounded-2xl p-4 flex flex-col gap-4 shadow-xl backdrop-blur-md sticky top-4">
      {/* 1. Video Player Container */}
      <div className="relative aspect-16/10 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-lg group">
        <img
          src={project.thumbnailUrl}
          alt={project.title}
          className="w-full h-full object-cover object-top"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/30" />

        {/* Top-Right Status Badge */}
        <div className="absolute top-3 right-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-[11px] font-semibold backdrop-blur-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Concluído</span>
          </div>
        </div>

        {/* Center Big Play Button */}
        <button
          onClick={() => onOpenPlayerModal(project)}
          className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-black/60 hover:bg-orange-500 text-white hover:text-slate-950 flex items-center justify-center backdrop-blur-sm transition-all shadow-xl border border-white/20 hover:border-orange-400 group-hover:scale-105 cursor-pointer"
          title="Reproduzir vídeo em tela cheia"
        >
          <Play className="w-5 h-5 fill-current ml-0.5" />
        </button>

        {/* Bottom Video Controls Overlay */}
        <div className="absolute bottom-0 inset-x-0 p-2.5 bg-gradient-to-t from-black/95 via-black/70 to-transparent flex flex-col gap-1.5">
          {/* Scrubber Progress Bar */}
          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pos = (e.clientX - rect.left) / rect.width;
              setVideoProgress(Math.min(100, Math.max(0, pos * 100)));
            }}
            className="w-full h-1 bg-slate-700/60 hover:h-1.5 rounded-full overflow-hidden cursor-pointer transition-all relative"
          >
            <div
              className="h-full bg-orange-500 relative transition-all"
              style={{ width: `${isPlaying ? 35 : videoProgress}%` }}
            />
          </div>

          {/* Controls row */}
          <div className="flex items-center justify-between text-slate-300 text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlay}
                className="hover:text-white transition-colors cursor-pointer"
              >
                {isPlaying ? (
                  <Pause className="w-3.5 h-3.5 fill-current" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )}
              </button>

              <span className="text-[11px] font-mono text-slate-400">
                0:00 / {project.duration.replace(/^0+/, "") || "0:32"}
              </span>
            </div>

            <div className="flex items-center gap-2 text-slate-400">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="hover:text-slate-200 transition-colors cursor-pointer"
                title={isMuted ? "Ativar som" : "Desativar som"}
              >
                {isMuted ? (
                  <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5" />
                )}
              </button>

              <button
                className="hover:text-slate-200 transition-colors cursor-pointer"
                title="Legendas"
              >
                <Subtitles className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onOpenPlayerModal(project)}
                className="hover:text-slate-200 transition-colors cursor-pointer"
                title="Tela cheia"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Title, Description and Tags */}
      <div className="flex flex-col gap-2">
        {/* Title + Edit Pencil + Waveform badge */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-tight">
              {project.title}
            </h2>
            <button
              onClick={() => onEditarProjeto(project)}
              className="text-slate-400 hover:text-orange-400 transition-colors p-1"
              title="Editar título"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="w-7 h-7 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-orange-400 shrink-0">
            <Sliders className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-400 leading-relaxed">
          {project.description}
        </p>

        {/* Tags */}
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          {project.tags.map((tag, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60 text-[10px] font-medium text-slate-300"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* 3. Action Buttons */}
      <div className="flex flex-col gap-2">
        {/* Row 1: Big download & edit buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onBaixarVideo(project)}
            className="flex items-center justify-center gap-2 py-2 px-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-orange-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Baixar vídeo</span>
          </button>

          <button
            onClick={() => onEditarProjeto(project)}
            className="flex items-center justify-center gap-2 py-2 px-3 bg-slate-800/90 hover:bg-slate-750 border border-slate-700/80 text-white font-semibold text-xs rounded-xl hover:border-slate-600 transition-all cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5 text-slate-300" />
            <span>Editar projeto</span>
          </button>
        </div>

        {/* Row 2: 4 compact action buttons */}
        <div className="grid grid-cols-4 gap-1.5">
          <button
            onClick={() => onDuplicar(project)}
            className="flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 hover:text-white text-[11px] font-medium transition-colors cursor-pointer"
            title="Duplicar projeto"
          >
            <Copy className="w-3 h-3 text-slate-400" />
            <span>Duplicar</span>
          </button>

          <button
            onClick={() => onCompartilhar(project)}
            className="flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 hover:text-white text-[11px] font-medium transition-colors cursor-pointer"
            title="Compartilhar"
          >
            <Share2 className="w-3 h-3 text-slate-400" />
            <span>Compartilhar</span>
          </button>

          <button
            onClick={() => onPublicar(project)}
            className="flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 hover:text-white text-[11px] font-medium transition-colors cursor-pointer"
            title="Publicar projeto"
          >
            <Send className="w-3 h-3 text-slate-400" />
            <span>Publicar</span>
            <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
          </button>

          <button
            onClick={() => onExcluir(project)}
            className="flex items-center justify-center gap-1 py-1.5 px-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg text-rose-400 text-[11px] font-medium transition-colors cursor-pointer"
            title="Excluir projeto"
          >
            <Trash2 className="w-3 h-3 text-rose-400" />
            <span>Excluir</span>
          </button>
        </div>
      </div>

      {/* 4. Detail Tabs */}
      <div className="flex flex-col gap-3 pt-1 border-t border-slate-800/80">
        {/* Tab Headers */}
        <div className="flex items-center gap-4 border-b border-slate-800/80 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("info")}
            className={`pb-2 transition-colors relative cursor-pointer ${
              activeTab === "info"
                ? "text-orange-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>Informações</span>
            {activeTab === "info" && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-orange-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("roteiro")}
            className={`pb-2 transition-colors relative cursor-pointer ${
              activeTab === "roteiro"
                ? "text-orange-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>Roteiro</span>
            {activeTab === "roteiro" && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-orange-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("cenas")}
            className={`pb-2 transition-colors relative cursor-pointer ${
              activeTab === "cenas"
                ? "text-orange-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>Cenas ({project.scenesCount})</span>
            {activeTab === "cenas" && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-orange-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("elementos")}
            className={`pb-2 transition-colors relative cursor-pointer ${
              activeTab === "elementos"
                ? "text-orange-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>Elementos</span>
            {activeTab === "elementos" && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-orange-500 rounded-full" />
            )}
          </button>
        </div>

        {/* Tab Content: Informações (2 Columns Grid) */}
        {activeTab === "info" && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-[11px]">
            {/* Column 1 */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-slate-400">Avatar utilizado:</span>
                <span className="text-slate-200 font-semibold">{project.avatarName}</span>
              </div>

              <div className="flex items-center gap-2">
                <ShoppingBag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-slate-400">Produto:</span>
                <span className="text-slate-200 font-semibold">{project.productName}</span>
              </div>

              <div className="flex items-center gap-2">
                <Smartphone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-slate-400">Formato:</span>
                <span className="text-slate-200 font-semibold">{project.format}</span>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-slate-400">Duração:</span>
                <span className="text-slate-200 font-semibold">{project.durationSeconds} segundos</span>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-slate-400">Criado em:</span>
                <span className="text-slate-200 font-semibold">{project.createdAtDetailed}</span>
              </div>

              <div className="flex items-center gap-2">
                <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-slate-400">Gerado por:</span>
                <span className="text-slate-200 font-semibold">{project.generatedBy}</span>
              </div>
            </div>

            {/* Column 2 */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <Mic className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-slate-400">Voz e idioma:</span>
                <span className="text-slate-200 font-semibold">{project.voiceName}</span>
              </div>

              <div className="flex items-center gap-2">
                <Home className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-slate-400">Cenário:</span>
                <span className="text-slate-200 font-semibold">{project.scenario}</span>
              </div>

              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-slate-400">Estilo visual:</span>
                <span className="text-slate-200 font-semibold">{project.visualStyle}</span>
              </div>

              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-slate-400">Legendas:</span>
                <span className="text-slate-200 font-semibold">
                  {project.hasSubtitles ? "Sim" : "Não"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Music className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-slate-400">Música de fundo:</span>
                <span className="text-slate-200 font-semibold">
                  {project.hasBackgroundMusic ? "Sim" : "Não"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                <span className="text-slate-400">CTA animado:</span>
                <span className="text-slate-200 font-semibold">
                  {project.hasAnimatedCta ? "Sim" : "Não"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: Roteiro */}
        {activeTab === "roteiro" && (
          <div className="flex flex-col gap-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 leading-relaxed font-sans whitespace-pre-line max-h-48 overflow-y-auto">
              {project.scriptText ||
                "Roteiro estruturado gerado por inteligência artificial para conversão e engajamento comercial."}
            </div>
            <button
              onClick={() => onEditarProjeto(project)}
              className="text-[11px] text-orange-400 hover:text-orange-300 flex items-center gap-1 self-end transition-colors"
            >
              <Pencil className="w-3 h-3" />
              <span>Editar roteiro no estúdio</span>
            </button>
          </div>
        )}

        {/* Tab Content: Cenas */}
        {activeTab === "cenas" && (
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
            {project.scenes && project.scenes.length > 0 ? (
              project.scenes.map((scene) => (
                <div
                  key={scene.sceneNumber}
                  className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 flex flex-col gap-1 text-[11px]"
                >
                  <div className="flex items-center justify-between text-slate-300 font-semibold">
                    <span>
                      Cena {scene.sceneNumber}: {scene.title}
                    </span>
                    <span className="text-orange-400 text-[10px]">{scene.duration}</span>
                  </div>
                  <p className="text-slate-400 text-[10px]">{scene.narration}</p>
                </div>
              ))
            ) : (
              <div className="text-slate-400 text-xs py-3 text-center">
                5 cenas estruturadas sincronizadas com áudio e legendas.
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Elementos */}
        {activeTab === "elementos" && (
          <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
            {project.elements && project.elements.length > 0 ? (
              project.elements.map((el, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-[11px]"
                >
                  <div className="flex flex-col">
                    <span className="text-white font-medium">{el.name}</span>
                    <span className="text-slate-400 text-[10px]">{el.type}</span>
                  </div>
                  <span className="text-emerald-400 font-semibold text-[10px]">
                    {el.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-slate-400 text-xs py-3 text-center">
                Todos os assets e faixas de áudio carregados e aplicados.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
