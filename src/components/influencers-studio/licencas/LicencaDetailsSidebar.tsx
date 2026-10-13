import React, { useState } from "react";
import {
  Play,
  Pencil,
  Copy,
  Download,
  Share2,
  Trash2,
  Globe,
  Link as LinkIcon,
  Video,
  BarChart3,
  FileText,
  Clock,
  Sparkles,
  Award,
} from "lucide-react";
import { SiInstagram, SiTiktok } from "react-icons/si";
import { type InfluencerLicenciadoItem } from "./licencas-data";

interface LicencaDetailsSidebarProps {
  influencer: InfluencerLicenciadoItem;
  onCriarVideo: (influencer: InfluencerLicenciadoItem) => void;
  onEditar: (influencer: InfluencerLicenciadoItem) => void;
  onDuplicar: (influencer: InfluencerLicenciadoItem) => void;
  onExportar: (influencer: InfluencerLicenciadoItem) => void;
  onCompartilhar: (influencer: InfluencerLicenciadoItem) => void;
  onExcluir: (influencer: InfluencerLicenciadoItem) => void;
  onOpenPreview: (influencer: InfluencerLicenciadoItem) => void;
}

export const LicencaDetailsSidebar: React.FC<LicencaDetailsSidebarProps> = ({
  influencer,
  onCriarVideo,
  onEditar,
  onDuplicar,
  onExportar,
  onCompartilhar,
  onExcluir,
  onOpenPreview,
}) => {
  const [activeTab, setActiveTab] = useState<"info" | "licenca" | "stats" | "conteudos">("info");

  return (
    <div className="bg-[#0E1626]/90 border border-slate-800/80 rounded-2xl p-4 flex flex-col gap-4 shadow-xl backdrop-blur-md sticky top-4">
      {/* 1. Header Photo / Video Preview */}
      <div className="relative aspect-16/10 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-lg group">
        <img
          src={influencer.imageUrl}
          alt={influencer.name}
          className="w-full h-full object-cover object-top"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30" />

        {/* Top-Left License Status Badge */}
        <div className="absolute top-3 left-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[11px] font-semibold backdrop-blur-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Licença ativa</span>
          </div>
        </div>

        {/* Top-Right Edit Button */}
        <button
          onClick={() => onEditar(influencer)}
          className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 hover:bg-black/90 text-white/90 hover:text-white border border-white/10 text-xs font-medium backdrop-blur-xs transition-colors cursor-pointer"
        >
          <Pencil className="w-3 h-3 text-slate-300" />
          <span>Editar</span>
        </button>

        {/* Center Big Play Button */}
        <button
          onClick={() => onOpenPreview(influencer)}
          className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-black/60 hover:bg-orange-500 text-white hover:text-slate-950 flex items-center justify-center backdrop-blur-sm transition-all shadow-xl border border-white/20 hover:border-orange-400 group-hover:scale-105 cursor-pointer"
          title="Ver prévia do influencer"
        >
          <Play className="w-5 h-5 fill-current ml-0.5" />
        </button>
      </div>

      {/* 2. Title, Description and Tags */}
      <div className="flex flex-col gap-2">
        {/* Name + Pencil */}
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-white tracking-tight">
            {influencer.name}
          </h2>
          <button
            onClick={() => onEditar(influencer)}
            className="text-slate-400 hover:text-orange-400 transition-colors p-1"
            title="Editar nome"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-400 leading-relaxed">
          {influencer.description}
        </p>

        {/* Tags */}
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          {influencer.tags.map((tag, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60 text-[10px] font-medium text-slate-300"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* 3. Detail Tabs */}
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
            onClick={() => setActiveTab("licenca")}
            className={`pb-2 transition-colors relative cursor-pointer ${
              activeTab === "licenca"
                ? "text-orange-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>Licença e Uso</span>
            {activeTab === "licenca" && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-orange-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("stats")}
            className={`pb-2 transition-colors relative cursor-pointer ${
              activeTab === "stats"
                ? "text-orange-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>Estatísticas</span>
            {activeTab === "stats" && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-orange-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("conteudos")}
            className={`pb-2 transition-colors relative cursor-pointer ${
              activeTab === "conteudos"
                ? "text-orange-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>Conteúdos</span>
            {activeTab === "conteudos" && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-orange-500 rounded-full" />
            )}
          </button>
        </div>

        {/* Tab Content: Informações (2 Columns Grid) */}
        {activeTab === "info" && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px]">
            {/* Column 1: Info do Avatar */}
            <div className="flex flex-col gap-2">
              <div className="flex flex-col">
                <span className="text-slate-400 text-[10px]">Tipo</span>
                <span className="text-slate-200 font-semibold">
                  {influencer.type === "meu_avatar"
                    ? "Meu avatar exclusivo"
                    : "Influencer Licenciado"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-slate-400 text-[10px]">Idioma</span>
                <span className="text-slate-200 font-semibold">{influencer.language}</span>
              </div>

              <div className="flex flex-col">
                <span className="text-slate-400 text-[10px]">Idade aparente</span>
                <span className="text-slate-200 font-semibold">{influencer.ageRange}</span>
              </div>

              <div className="flex flex-col">
                <span className="text-slate-400 text-[10px]">Gênero</span>
                <span className="text-slate-200 font-semibold">{influencer.gender}</span>
              </div>

              <div className="flex flex-col">
                <span className="text-slate-400 text-[10px]">Tom de voz</span>
                <span className="text-slate-200 font-semibold">{influencer.voiceTone}</span>
              </div>

              <div className="flex flex-col">
                <span className="text-slate-400 text-[10px]">Canais</span>
                <div className="flex items-center gap-2 mt-0.5 text-slate-300">
                  <SiInstagram className="w-3.5 h-3.5 text-pink-400" />
                  <SiTiktok className="w-3 h-3 text-white" />
                  <LinkIcon className="w-3 h-3 text-slate-400" />
                </div>
              </div>

              <div className="flex flex-col">
                <span className="text-slate-400 text-[10px]">Formato</span>
                <span className="text-slate-200 font-semibold">{influencer.formats}</span>
              </div>

              <div className="flex flex-col">
                <span className="text-slate-400 text-[10px]">Especialidades</span>
                <span className="text-slate-200 font-semibold">
                  {influencer.specialties.join(", ")}
                </span>
              </div>
            </div>

            {/* Column 2: Bloco Licença */}
            <div className="flex flex-col gap-2 border-l border-slate-800/80 pl-3">
              <div className="text-xs font-bold text-white mb-0.5">Licença</div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[10px]">Status</span>
                <div className="flex items-center gap-1 text-emerald-400 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Ativa</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[10px]">Tipo</span>
                <span className="text-slate-200 font-semibold">
                  {influencer.licenseDetails.type}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[10px]">Início</span>
                <span className="text-slate-200 font-semibold">
                  {influencer.licenseDetails.startDate}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[10px]">Renovação</span>
                <span className="text-slate-200 font-semibold">
                  {influencer.licenseDetails.renewalDate}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[10px]">Dias restantes</span>
                <span className="text-amber-400 font-bold">
                  {influencer.licenseDetails.daysRemaining} dias
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[10px]">Limite de uso</span>
                <span className="text-slate-200 font-semibold">
                  {influencer.licenseDetails.usageLimit}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[10px]">Território</span>
                <span className="text-slate-200 font-semibold">
                  {influencer.licenseDetails.territory}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: Licença e Uso */}
        {activeTab === "licenca" && (
          <div className="flex flex-col gap-2.5 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-2 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Contrato de Referência:</span>
                <span className="text-white font-mono font-semibold">
                  {influencer.licenseDetails.contractRef}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Titular da Propriedade:</span>
                <span className="text-white font-semibold">
                  {influencer.licenseDetails.holder}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Exclusividade de Marca:</span>
                <span className="text-emerald-400 font-semibold">
                  {influencer.licenseDetails.exclusivity ? "Garantida" : "Compartilhada"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Canais Autorizados:</span>
                <span className="text-white font-semibold">
                  {influencer.authorizedChannels.join(", ").toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: Estatísticas */}
        {activeTab === "stats" && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400">Vídeos Produzidos</span>
              <div className="text-base font-extrabold text-white mt-0.5">
                {influencer.stats?.videosProduced || 18}
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400">Minutos Renderizados</span>
              <div className="text-base font-extrabold text-white mt-0.5">
                {influencer.stats?.minutesRendered || 34} min
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400">Projetos Ativos</span>
              <div className="text-base font-extrabold text-white mt-0.5">
                {influencer.stats?.projectsCount || 14}
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400">Créditos Consumidos</span>
              <div className="text-base font-extrabold text-orange-400 mt-0.5">
                {influencer.stats?.creditsUsed || 540}
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: Conteúdos */}
        {activeTab === "conteudos" && (
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
            {influencer.associatedContents && influencer.associatedContents.length > 0 ? (
              influencer.associatedContents.map((content, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-[11px]"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-md bg-slate-800 overflow-hidden shrink-0">
                      <img
                        src={content.thumbnailUrl}
                        alt={content.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-white font-semibold truncate max-w-[140px]">
                        {content.title}
                      </span>
                      <span className="text-slate-400 text-[10px]">
                        {content.channel} • {content.duration}
                      </span>
                    </div>
                  </div>
                  <span className="text-emerald-400 text-[10px] font-semibold">Concluído</span>
                </div>
              ))
            ) : (
              <div className="text-slate-400 text-xs py-3 text-center">
                Nenhum conteúdo produzido recentemente com este influencer.
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Action Buttons */}
      <div className="flex flex-col gap-2">
        {/* Big orange primary button */}
        <button
          onClick={() => onCriarVideo(influencer)}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-orange-500/20 active:scale-98 transition-all cursor-pointer"
        >
          <Play className="w-4 h-4 fill-current stroke-[2.5]" />
          <span>Criar novo vídeo com este influencer</span>
        </button>

        {/* 4 compact action buttons */}
        <div className="grid grid-cols-4 gap-1.5">
          <button
            onClick={() => onDuplicar(influencer)}
            className="flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 hover:text-white text-[11px] font-medium transition-colors cursor-pointer"
            title="Duplicar configurações"
          >
            <Copy className="w-3 h-3 text-slate-400" />
            <span>Duplicar</span>
          </button>

          <button
            onClick={() => onExportar(influencer)}
            className="flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 hover:text-white text-[11px] font-medium transition-colors cursor-pointer"
            title="Exportar dados do influencer"
          >
            <Download className="w-3 h-3 text-slate-400" />
            <span>Exportar</span>
          </button>

          <button
            onClick={() => onCompartilhar(influencer)}
            className="flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 hover:text-white text-[11px] font-medium transition-colors cursor-pointer"
            title="Compartilhar"
          >
            <Share2 className="w-3 h-3 text-slate-400" />
            <span>Compartilhar</span>
          </button>

          <button
            onClick={() => onExcluir(influencer)}
            className="flex items-center justify-center gap-1 py-1.5 px-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg text-rose-400 text-[11px] font-medium transition-colors cursor-pointer"
            title="Excluir ou desvincular"
          >
            <Trash2 className="w-3 h-3 text-rose-400" />
            <span>Excluir</span>
          </button>
        </div>
      </div>
    </div>
  );
};
