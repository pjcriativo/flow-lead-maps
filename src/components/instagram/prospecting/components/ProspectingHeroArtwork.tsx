import { Heart, Search, Shirt, Sparkles, UtensilsCrossed } from "lucide-react";

export function ProspectingHeroArtwork() {
  return (
    <div className="relative flex items-center justify-center w-full max-w-[380px] h-[220px] mx-auto select-none">
      {/* Círculos concêntricos decorativos de fundo */}
      <div className="absolute size-64 rounded-full border border-pink-200/40 opacity-70 animate-pulse pointer-events-none" />
      <div className="absolute size-48 rounded-full border border-purple-200/50 opacity-80 pointer-events-none" />
      <div className="absolute size-32 rounded-full bg-gradient-to-tr from-[#F77737]/10 via-[#E1306C]/10 to-[#833AB4]/10 blur-xl pointer-events-none" />

      {/* Bloco central do Instagram com gradiente oficial */}
      <div className="relative z-10 flex size-20 sm:size-22 items-center justify-center rounded-[24px] bg-gradient-to-tr from-[#F77737] via-[#E1306C] to-[#833AB4] p-0.5 shadow-[0_14px_36px_rgba(225,48,108,0.38)] ring-4 ring-white/90 transition-transform duration-300 hover:scale-105">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-10 sm:size-11 text-white drop-shadow-sm"
        >
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </svg>
      </div>

      {/* 4 Avatares circulares flutuantes realistas */}
      {/* Avatar 1: Topo Centro-Direita */}
      <div className="absolute top-3 left-[46%] z-20 size-9 rounded-full border-2 border-white shadow-md overflow-hidden transition-transform duration-300 hover:scale-110">
        <img
          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face"
          alt="Profissional"
          className="size-full object-cover"
        />
      </div>

      {/* Avatar 2: Topo Direita */}
      <div className="absolute top-1 right-10 z-20 size-8 rounded-full border-2 border-white shadow-md overflow-hidden transition-transform duration-300 hover:scale-110">
        <img
          src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face"
          alt="Profissional"
          className="size-full object-cover"
        />
      </div>

      {/* Avatar 3: Fundo Esquerda */}
      <div className="absolute bottom-5 left-10 z-20 size-9 rounded-full border-2 border-white shadow-md overflow-hidden transition-transform duration-300 hover:scale-110">
        <img
          src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=face"
          alt="Profissional"
          className="size-full object-cover"
        />
      </div>

      {/* Avatar 4: Fundo Centro-Direita */}
      <div className="absolute bottom-3 left-[48%] z-20 size-8 rounded-full border-2 border-white shadow-md overflow-hidden transition-transform duration-300 hover:scale-110">
        <img
          src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face"
          alt="Profissional"
          className="size-full object-cover"
        />
      </div>

      {/* Pílula de busca: negócios locais */}
      <div className="absolute top-[38%] left-[45%] z-20 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 shadow-[0_6px_20px_rgba(0,0,0,0.08)] border border-slate-100/90 backdrop-blur-md">
        <Search className="size-3.5 text-slate-400" />
        <span className="text-xs font-semibold text-slate-800">negócios locais</span>
      </div>

      {/* 4 Chips de categorias flutuantes à direita */}
      <div className="absolute right-[-10px] top-4 z-20 flex flex-col gap-2">
        <div className="flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[10.5px] font-semibold text-slate-700 shadow-sm border border-slate-100/90 backdrop-blur-md">
          <UtensilsCrossed className="size-3 text-purple-500" />
          <span>Bares e restaurantes</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[10.5px] font-semibold text-slate-700 shadow-sm border border-slate-100/90 backdrop-blur-md ml-2">
          <Sparkles className="size-3 text-emerald-600" />
          <span>Beleza e estética</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[10.5px] font-semibold text-slate-700 shadow-sm border border-slate-100/90 backdrop-blur-md">
          <Heart className="size-3 text-rose-500" />
          <span>Saúde e bem-estar</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[10.5px] font-semibold text-slate-700 shadow-sm border border-slate-100/90 backdrop-blur-md ml-1">
          <Shirt className="size-3 text-indigo-500" />
          <span>Moda e acessórios</span>
        </div>
      </div>
    </div>
  );
}
