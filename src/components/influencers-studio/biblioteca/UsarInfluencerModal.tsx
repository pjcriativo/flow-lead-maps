import React, { useState } from "react";
import { X, Clapperboard, Check, Sparkles, ShieldCheck } from "lucide-react";
import type { InfluencerCatalogItem } from "./biblioteca-data";

interface UsarInfluencerModalProps {
  isOpen: boolean;
  onClose: () => void;
  influencer: InfluencerCatalogItem | null;
  onConfirmSuccess?: () => void;
}

export const UsarInfluencerModal: React.FC<UsarInfluencerModalProps> = ({
  isOpen,
  onClose,
  influencer,
  onConfirmSuccess,
}) => {
  const [projectTitle, setProjectTitle] = useState("");
  const [useCase, setUseCase] = useState("UGC Comercial");
  const [isDone, setIsDone] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !influencer) return null;

  const handleConfirm = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsDone(true);
      onConfirmSuccess?.();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0F1626] border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-left">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <img
            src={influencer.imageUrl}
            alt={influencer.name}
            className="w-12 h-12 rounded-xl object-cover border border-slate-700 shadow-md shrink-0"
          />
          <div>
            <h3 className="text-base font-bold text-white">
              Usar {influencer.name} em Produção
            </h3>
            <p className="text-xs text-slate-400">{influencer.role}</p>
          </div>
        </div>

        {isDone ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <Check className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Influencer Vinculado!</h4>
              <p className="text-xs text-slate-400 mt-1">
                {influencer.name} foi adicionado(a) ao seu projeto e está pronto(a) para renderização.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 transition-all cursor-pointer shadow-md"
            >
              Concluir
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Nome da Campanha / Projeto
              </label>
              <input
                type="text"
                placeholder="Ex: Lançamento Coleção Primavera"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900/80 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Objetivo do Vídeo
              </label>
              <select
                value={useCase}
                onChange={(e) => setUseCase(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900/80 border border-slate-800 text-white focus:outline-none focus:border-orange-500"
              >
                <option value="UGC Comercial">UGC Comercial para Redes Sociais</option>
                <option value="Anúncio Pago">Anúncio Pago (Meta Ads / TikTok)</option>
                <option value="Review de Produto">Review e Prova Social</option>
                <option value="Institucional">Vídeo Explicativo e Institucional</option>
              </select>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-300">
              <ShieldCheck className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
              <span>
                Licença comercial inclusa no seu plano com direitos de veiculação em redes sociais e anúncios.
              </span>
            </div>

            <button
              type="button"
              disabled={isLoading}
              onClick={handleConfirm}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 shadow-lg transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Vinculando influencer...
                </>
              ) : (
                <>
                  <Clapperboard className="w-4 h-4" />
                  Confirmar e Iniciar Roteiro
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
