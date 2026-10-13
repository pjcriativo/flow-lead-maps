import React, { useState } from "react";
import {
  Volume2,
  Mic,
  Play,
  Pause,
  Sliders,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

interface StepNavProps {
  onBack: () => void;
  onNext: () => void;
  nextLabel: string;
}

// -------------------------------------------------------------
// STEP 2: VOZ E IDIOMA
// -------------------------------------------------------------
export const AvatarVoiceStep: React.FC<StepNavProps & { avatarName: string }> = ({
  onBack,
  onNext,
  avatarName,
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState("pt-BR");
  const [selectedVoice, setSelectedVoice] = useState("sofia-natural");
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(0);

  const voices = [
    {
      id: "sofia-natural",
      name: "Sofia Natural (Recomendada)",
      accent: "Português - Brasil (Neutro)",
      style: "Expressiva, jovem e confiante",
      sample: "Olá! Pronta para transformar as vendas do seu negócio hoje?",
    },
    {
      id: "isabella-comercial",
      name: "Isabella Comercial",
      accent: "Português - Brasil (Paulista)",
      style: "Profissional, acolhedora e persuasiva",
      sample: "Conheça os melhores produtos com descontos exclusivos.",
    },
    {
      id: "mariana-casual",
      name: "Mariana Casual",
      accent: "Português - Brasil (Carioca)",
      style: "Descontraída, enérgica e autêntica",
      sample: "Gente, vocês não têm ideia do quanto essa dica vai ajudar!",
    },
    {
      id: "clara-executiva",
      name: "Clara Executiva",
      accent: "Português - Brasil (Corporativo)",
      style: "Séria, didática e sofisticada",
      sample: "Apresentamos o relatório trimestral com métricas consolidadas.",
    },
  ];

  const togglePlay = () => {
    setIsPlayingAudio(!isPlayingAudio);
  };

  return (
    <div className="bg-[#0B111E]/80 border border-slate-800/80 rounded-2xl p-6 shadow-lg space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white">Voz e Idioma do Avatar</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Defina o idioma principal e a voz neural sintética para {avatarName}.
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
          <Volume2 className="w-5 h-5" />
        </div>
      </div>

      {/* Language Selector */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300">Idioma Principal</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: "pt-BR", label: "Português (Brasil)", flag: "🇧🇷" },
            { id: "en-US", label: "Inglês (Estados Unidos)", flag: "🇺🇸" },
            { id: "es-ES", label: "Espanhol (América Latina)", flag: "🇲🇽" },
          ].map((lang) => (
            <button
              key={lang.id}
              type="button"
              onClick={() => setSelectedLanguage(lang.id)}
              className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                selectedLanguage === lang.id
                  ? "border-orange-500 bg-orange-500/10 text-white"
                  : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700"
              }`}
            >
              <span className="text-xl">{lang.flag}</span>
              <span className="text-xs font-semibold">{lang.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Voice List */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300">Vozes Disponíveis</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {voices.map((v) => {
            const isSelected = selectedVoice === v.id;
            return (
              <div
                key={v.id}
                onClick={() => setSelectedVoice(v.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? "border-orange-500 bg-orange-500/10 shadow-md shadow-orange-500/10"
                    : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{v.name}</span>
                    <span className="text-[10px] text-orange-400 font-medium">{v.accent}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{v.style}</p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] italic text-slate-400 truncate max-w-[200px]">
                    "{v.sample}"
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePlay();
                    }}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center gap-1 text-[10px] font-semibold transition-colors"
                  >
                    {isPlayingAudio && isSelected ? (
                      <Pause className="w-3 h-3 text-orange-400" />
                    ) : (
                      <Play className="w-3 h-3 text-orange-400" />
                    )}
                    <span>Ouvir amostra</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Voice Controls: Speed & Pitch */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Velocidade da fala</span>
            <span className="text-orange-400 font-bold">{speed.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0.8"
            max="1.4"
            step="0.1"
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="w-full accent-orange-500 cursor-pointer"
          />
        </div>
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Tom vocal</span>
            <span className="text-orange-400 font-bold">{pitch > 0 ? `+${pitch}` : pitch}</span>
          </div>
          <input
            type="range"
            min="-5"
            max="5"
            step="1"
            value={pitch}
            onChange={(e) => setPitch(parseInt(e.target.value, 10))}
            className="w-full accent-orange-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Nav Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold border border-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Aparência</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
        >
          <span>{nextLabel}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// STEP 3: PERSONALIDADE
// -------------------------------------------------------------
export const AvatarPersonalityStep: React.FC<StepNavProps & { avatarName: string }> = ({
  onBack,
  onNext,
  avatarName,
}) => {
  const [communicationStyle, setCommunicationStyle] = useState("consultivo");
  const [toneOfVoice, setToneOfVoice] = useState("amigavel");
  const [brandNiche, setBrandNiche] = useState("lifestyle");
  const [guidelines, setGuidelines] = useState(
    "Falar em primeira pessoa, focar em benefícios reais do produto, transmitir entusiasmo sem exageros e sempre incluir uma chamada para ação clara.",
  );

  return (
    <div className="bg-[#0B111E]/80 border border-slate-800/80 rounded-2xl p-6 shadow-lg space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white">Personalidade e Comportamento</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure como {avatarName} se expressará nos roteiros gerados por IA.
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
          <Sparkles className="w-5 h-5" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Estilo de comunicação */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300">Perfil de Comunicação</label>
          <div className="space-y-2">
            {[
              { id: "consultivo", label: "Consultivo & Especialista", desc: "Autoridade técnica, dados e orientações sólidas" },
              { id: "amigavel", label: "Amigável & Próximo", desc: "Tom de conversa entre amigos e influenciador casual" },
              { id: "persuasivo", label: "Comercial & Persuasivo", desc: "Foco direto em conversão, vendas e promoções" },
              { id: "didatico", label: "Educativo & Didático", desc: "Ideal para tutorais, explicativos e passo a passo" },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setCommunicationStyle(p.id)}
                className={`w-full p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  communicationStyle === p.id
                    ? "border-orange-500 bg-orange-500/10 text-white"
                    : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="text-xs font-bold text-white">{p.label}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{p.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Tom de Voz */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300">Tom de Voz</label>
          <div className="space-y-2">
            {[
              { id: "amigavel", label: "Descontraído e Autêntico", desc: "Linguagem simples, gírias moderadas e energia alta" },
              { id: "formal", label: "Profissional e Corporativo", desc: "Sem gírias, vocabulário refinado e postura sóbria" },
              { id: "entusiasta", label: "Enérgico e Vibrante", desc: "Ritmo dinâmico, ganchos rápidos e apelo emocional" },
              { id: "elegante", label: "Sofisticado e Premium", desc: "Focado em produtos de alto valor e exclusividade" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setToneOfVoice(t.id)}
                className={`w-full p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  toneOfVoice === t.id
                    ? "border-orange-500 bg-orange-500/10 text-white"
                    : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="text-xs font-bold text-white">{t.label}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{t.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Diretrizes textuais */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-300">
          Diretrizes & Restrições de Marca para os Roteiros
        </label>
        <textarea
          rows={3}
          value={guidelines}
          onChange={(e) => setGuidelines(e.target.value)}
          className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/80 transition-colors"
          placeholder="Ex: Não prometer curas milagrosas, sempre mencionar o link na bio..."
        />
      </div>

      {/* Nav Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold border border-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Voz</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
        >
          <span>{nextLabel}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// STEP 4: ESTILO E CENÁRIOS
// -------------------------------------------------------------
export const AvatarSceneStyleStep: React.FC<StepNavProps & { avatarName: string }> = ({
  onBack,
  onNext,
  avatarName,
}) => {
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [lighting, setLighting] = useState("soft-studio");
  const [framing, setFraming] = useState("plano-medio");

  return (
    <div className="bg-[#0B111E]/80 border border-slate-800/80 rounded-2xl p-6 shadow-lg space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white">Estilo Visual e Cenários</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure proporções, iluminação e enquadramento para as futuras gerações de {avatarName}.
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
          <Sliders className="w-5 h-5" />
        </div>
      </div>

      {/* Proporção de vídeo */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300">Proporção Predileta de Vídeo</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: "9:16", label: "Vertical (9:16)", desc: "Reels, TikTok, Shorts e Stories" },
            { id: "16:9", label: "Horizontal (16:9)", desc: "YouTube, Landing Pages e Cursos" },
            { id: "1:1", label: "Quadrado (1:1)", desc: "Feed Instagram e Anúncios Facebook" },
          ].map((asp) => (
            <button
              key={asp.id}
              type="button"
              onClick={() => setAspectRatio(asp.id)}
              className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                aspectRatio === asp.id
                  ? "border-orange-500 bg-orange-500/10 text-white"
                  : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700"
              }`}
            >
              <div className="text-xs font-bold text-white">{asp.label}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{asp.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Iluminação */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300">Iluminação do Cenário</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: "soft-studio", label: "Estúdio Suave", desc: "Luz difusa, sombras suaves e alta definição" },
            { id: "natural", label: "Luz Natural (Janela)", desc: "Realismo autêntico para vídeos estilo UGC" },
            { id: "cinematic", label: "Cinematográfica", desc: "Contraste dramático e iluminação traseira sutil" },
          ].map((lt) => (
            <button
              key={lt.id}
              type="button"
              onClick={() => setLighting(lt.id)}
              className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                lighting === lt.id
                  ? "border-orange-500 bg-orange-500/10 text-white"
                  : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700"
              }`}
            >
              <div className="text-xs font-bold text-white">{lt.label}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{lt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Enquadramento */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300">Enquadramento Padrão</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: "plano-medio", label: "Plano Médio (Cintura para cima)", desc: "Permite gestos expressivos com as mãos" },
            { id: "busto", label: "Primeiro Plano (Busto)", desc: "Foco no rosto, expressões e sincronia labial" },
            { id: "close", label: "Close-up (Rosto)", desc: "Ideal para depoimentos e reações emotivas" },
          ].map((fr) => (
            <button
              key={fr.id}
              type="button"
              onClick={() => setFraming(fr.id)}
              className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                framing === fr.id
                  ? "border-orange-500 bg-orange-500/10 text-white"
                  : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700"
              }`}
            >
              <div className="text-xs font-bold text-white">{fr.label}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{fr.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Nav Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold border border-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Personalidade</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
        >
          <span>{nextLabel}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// STEP 5: REVISÃO E CRIAÇÃO
// -------------------------------------------------------------
export const AvatarReviewStep: React.FC<{
  avatarName: string;
  imageUrl: string;
  ageRange: string;
  gender: string;
  ethnicity: string;
  onBack: () => void;
  onConfirmCreation: () => void;
}> = ({
  avatarName,
  imageUrl,
  ageRange,
  gender,
  ethnicity,
  onBack,
  onConfirmCreation,
}) => {
  const [agreeTerms, setAgreeTerms] = useState(true);

  return (
    <div className="bg-[#0B111E]/80 border border-slate-800/80 rounded-2xl p-6 shadow-lg space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white">Revisão e Criação do Avatar</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Confira todos os parâmetros antes de salvar o personagem exclusivo para o seu workspace.
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
          <CheckCircle2 className="w-5 h-5" />
        </div>
      </div>

      {/* Review Card */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        {/* Avatar Image Preview */}
        <div className="md:col-span-4 flex flex-col items-center">
          <div className="w-40 aspect-[3/4] rounded-xl overflow-hidden border-2 border-orange-500/80 shadow-lg">
            <img src={imageUrl} alt={avatarName} className="w-full h-full object-cover object-top" />
          </div>
          <span className="text-sm font-bold text-white mt-2">{avatarName}</span>
          <span className="text-[11px] text-orange-400 font-medium">Avatar Exclusivo de Marca</span>
        </div>

        {/* Configuration Summary Table */}
        <div className="md:col-span-8 space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Especificações Consolidadas
          </h3>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-850/60 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[10px] block">Aparência</span>
              <span className="text-white font-medium">{gender} • {ageRange} • {ethnicity}</span>
            </div>
            <div className="p-3 bg-slate-850/60 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[10px] block">Voz Neural</span>
              <span className="text-white font-medium">Português (BR) • Sofia Natural</span>
            </div>
            <div className="p-3 bg-slate-850/60 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[10px] block">Comportamento Comercial</span>
              <span className="text-white font-medium">Consultivo & Amigável</span>
            </div>
            <div className="p-3 bg-slate-850/60 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[10px] block">Proporção & Iluminação</span>
              <span className="text-white font-medium">9:16 Vertical • Estúdio Suave</span>
            </div>
          </div>

          {/* Workspace & Security Notice */}
          <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-xl flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-300 leading-relaxed">
              Este avatar ficará vinculado exclusivamente à sua organização. Nenhum concorrente ou outro cliente terá acesso às referências e modelos treinados.
            </div>
          </div>
        </div>
      </div>

      {/* Consent Checkbox */}
      <div className="flex items-center gap-2.5 pt-2">
        <input
          id="terms-check"
          type="checkbox"
          checked={agreeTerms}
          onChange={(e) => setAgreeTerms(e.target.checked)}
          className="w-4 h-4 rounded accent-orange-500 cursor-pointer"
        />
        <label htmlFor="terms-check" className="text-xs text-slate-300 cursor-pointer">
          Confirmo que as diretrizes do avatar respeitam os termos de uso ético e direitos autorais da marca.
        </label>
      </div>

      {/* Nav Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold border border-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Estilo</span>
        </button>

        <button
          type="button"
          disabled={!agreeTerms}
          onClick={onConfirmCreation}
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-500/25 transition-all cursor-pointer active:scale-95"
        >
          <Sparkles className="w-4 h-4" />
          <span>Salvar e Registrar Avatar da Marca</span>
        </button>
      </div>
    </div>
  );
};
