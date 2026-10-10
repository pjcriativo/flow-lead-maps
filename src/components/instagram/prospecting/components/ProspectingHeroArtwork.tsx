import { Heart, Search, Shirt, Sparkles, UtensilsCrossed } from "lucide-react";

export function ProspectingHeroArtwork() {
  return (
    <div className="relative w-[430px] h-[220px] select-none shrink-0 scale-90 sm:scale-95 xl:scale-100 origin-center">
      {/* Círculos concêntricos decorativos e aura de fundo */}
      <div className="pointer-events-none absolute left-[45px] top-[15px] size-48 rounded-full bg-gradient-to-tr from-[#F77737]/15 via-[#E1306C]/12 to-[#833AB4]/15 blur-2xl" />
      <div className="pointer-events-none absolute left-[25px] top-[10px] size-56 rounded-full border border-pink-200/40 opacity-70" />
      <div className="pointer-events-none absolute left-[55px] top-[38px] size-40 rounded-full border border-purple-200/50 opacity-60" />

      {/* ======================================================== */}
      {/* GRUPO ESQUERDA / CENTRO: Ícone Instagram + Busca + Avatares */}
      {/* ======================================================== */}

      {/* 1. Ícone oficial do Instagram (squircle gradiente) */}
      <div className="absolute left-[12px] top-[66px] z-10 flex size-[74px] items-center justify-center rounded-[24px] bg-gradient-to-tr from-[#F77737] via-[#E1306C] to-[#833AB4] p-0.5 shadow-[0_14px_36px_rgba(225,48,108,0.36)] ring-4 ring-white/95 transition-transform duration-300 hover:scale-105">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-10 text-white drop-shadow-sm"
        >
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </svg>
      </div>

      {/* 2. Pílula de busca: "🔍 negócios locais" (ao lado do ícone) */}
      <div className="absolute left-[72px] top-[82px] z-20 flex items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-1.5 shadow-[0_6px_22px_rgba(0,0,0,0.08)] border border-slate-100/90 backdrop-blur-md">
        <Search className="size-3.5 text-slate-400 stroke-[2.5]" />
        <span className="text-[11.5px] font-semibold text-slate-800 whitespace-nowrap">
          negócios locais
        </span>
      </div>

      {/* 3. Quatro avatares circulares flutuantes realistas */}
      {/* Avatar 1: Topo Centro (acima da pílula de busca) */}
      <div className="absolute left-[110px] top-[14px] z-20 size-9 rounded-full border-2 border-white shadow-md overflow-hidden transition-transform duration-300 hover:scale-110">
        <img
          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face"
          alt="Profissional"
          className="size-full object-cover"
        />
      </div>

      {/* Avatar 2: Topo Direita (canto superior da busca) */}
      <div className="absolute left-[190px] top-[18px] z-20 size-8 rounded-full border-2 border-white shadow-md overflow-hidden transition-transform duration-300 hover:scale-110">
        <img
          src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face"
          alt="Profissional"
          className="size-full object-cover"
        />
      </div>

      {/* Avatar 3: Fundo Esquerda (abaixo do ícone Instagram) */}
      <div className="absolute left-[54px] top-[156px] z-20 size-9 rounded-full border-2 border-white shadow-md overflow-hidden transition-transform duration-300 hover:scale-110">
        <img
          src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=face"
          alt="Profissional"
          className="size-full object-cover"
        />
      </div>

      {/* Avatar 4: Fundo Direita (abaixo da pílula de busca) */}
      <div className="absolute left-[152px] top-[154px] z-20 size-8 rounded-full border-2 border-white shadow-md overflow-hidden transition-transform duration-300 hover:scale-110">
        <img
          src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face"
          alt="Profissional"
          className="size-full object-cover"
        />
      </div>

      {/* ======================================================== */}
      {/* GRUPO DIREITA: 4 Chips de categorias verticais sem colisão */}
      {/* ======================================================== */}
      <div className="absolute right-0 top-[18px] bottom-[18px] z-20 flex flex-col justify-between items-start">
        {/* Chip 1: Bares e restaurantes */}
        <div className="flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[10.5px] font-semibold text-slate-700 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-100/90 backdrop-blur-md transition-transform duration-200 hover:translate-x-1">
          <UtensilsCrossed className="size-3 text-[#8B5CF6]" />
          <span>Bares e restaurantes</span>
        </div>

        {/* Chip 2: Beleza e estética */}
        <div className="flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[10.5px] font-semibold text-slate-700 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-100/90 backdrop-blur-md ml-2 transition-transform duration-200 hover:translate-x-1">
          <Sparkles className="size-3 text-[#059669]" />
          <span>Beleza e estética</span>
        </div>

        {/* Chip 3: Saúde e bem-estar */}
        <div className="flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[10.5px] font-semibold text-slate-700 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-100/90 backdrop-blur-md ml-0.5 transition-transform duration-200 hover:translate-x-1">
          <Heart className="size-3 text-[#E1306C]" />
          <span>Saúde e bem-estar</span>
        </div>

        {/* Chip 4: Moda e acessórios */}
        <div className="flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[10.5px] font-semibold text-slate-700 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-100/90 backdrop-blur-md ml-1.5 transition-transform duration-200 hover:translate-x-1">
          <Shirt className="size-3 text-[#6366F1]" />
          <span>Moda e acessórios</span>
        </div>
      </div>
    </div>
  );
}
