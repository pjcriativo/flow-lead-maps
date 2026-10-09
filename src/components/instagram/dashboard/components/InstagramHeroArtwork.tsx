import { Heart, MessageCircle, UserRound } from "lucide-react";

export function InstagramHeroArtwork() {
  return (
    <div className="relative flex items-center justify-center w-full max-w-[280px] h-[210px] mx-auto select-none">
      {/* Círculos concêntricos decorativos de fundo */}
      <div className="absolute size-52 rounded-full border border-pink-200/40 opacity-70 animate-pulse pointer-events-none" />
      <div className="absolute size-40 rounded-full border border-purple-200/50 opacity-80 pointer-events-none" />
      <div className="absolute size-28 rounded-full bg-gradient-to-tr from-[#F77737]/10 via-[#E1306C]/10 to-[#833AB4]/10 blur-xl pointer-events-none" />

      {/* Bloco central do Instagram com gradiente oficial */}
      <div className="relative z-10 flex size-20 sm:size-24 items-center justify-center rounded-[26px] bg-gradient-to-tr from-[#F77737] via-[#E1306C] to-[#833AB4] p-0.5 shadow-[0_14px_36px_rgba(225,48,108,0.38)] ring-4 ring-white/80 transition-transform duration-300 hover:scale-105">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-10 sm:size-12 text-white drop-shadow-sm"
        >
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </svg>
      </div>

      {/* Badge flutuante: Curtidas (Topo Esquerdo) */}
      <div className="absolute -top-1 left-2 sm:left-4 z-20 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 shadow-[0_6px_20px_rgba(0,0,0,0.08)] border border-slate-100/90 backdrop-blur-md transition-transform duration-300 hover:-translate-y-0.5">
        <span className="flex size-5 items-center justify-center rounded-full bg-rose-50">
          <Heart className="size-3 fill-[#EF4444] text-[#EF4444]" />
        </span>
        <span className="text-xs font-bold text-slate-800">278</span>
      </div>

      {/* Badge flutuante: Seguidores (Topo Direito) */}
      <div className="absolute top-2 -right-1 sm:right-2 z-20 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 shadow-[0_6px_20px_rgba(0,0,0,0.08)] border border-slate-100/90 backdrop-blur-md transition-transform duration-300 hover:-translate-y-0.5">
        <span className="flex size-5 items-center justify-center rounded-full bg-indigo-50">
          <UserRound className="size-3 text-[#6366F1]" />
        </span>
        <span className="text-xs font-bold text-slate-800">+24</span>
      </div>

      {/* Badge flutuante: Mensagens (Inferior Direito) */}
      <div className="absolute bottom-2 -right-1 sm:right-3 z-20 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 shadow-[0_6px_20px_rgba(0,0,0,0.08)] border border-slate-100/90 backdrop-blur-md transition-transform duration-300 hover:-translate-y-0.5">
        <span className="flex size-5 items-center justify-center rounded-full bg-purple-50">
          <MessageCircle className="size-3 fill-[#A855F7] text-[#A855F7]" />
        </span>
        <span className="text-xs font-bold text-slate-800">12</span>
      </div>
    </div>
  );
}
