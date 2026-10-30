import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import {
  InstagramIcon,
  LinkedInIcon,
  YouTubeIcon,
  TikTokIcon,
  GoogleMapsIcon,
} from "@/components/home-publica/HomeIcons";

export function PrincipaisCanaisSection() {
  const canais = [
    {
      id: "instagram",
      nome: "Instagram",
      descricao: "Encontre perfis, filtre por nicho e seguidores e gere leads qualificados.",
      icone: InstagramIcon,
      borda: "border-pink-500/30 hover:border-pink-500/70",
      glow: "hover:shadow-[0_0_25px_rgba(236,72,153,0.25)]",
    },
    {
      id: "linkedin",
      nome: "LinkedIn",
      descricao: "Encontre empresas e tomadores de decisão com dados completos.",
      icone: LinkedInIcon,
      borda: "border-blue-500/30 hover:border-blue-500/70",
      glow: "hover:shadow-[0_0_25px_rgba(59,130,246,0.25)]",
    },
    {
      id: "youtube",
      nome: "YouTube",
      descricao: "Descubra canais, criadores e negócios do seu nicho.",
      icone: YouTubeIcon,
      borda: "border-red-500/30 hover:border-red-500/70",
      glow: "hover:shadow-[0_0_25px_rgba(239,68,68,0.25)]",
    },
    {
      id: "tiktok",
      nome: "TikTok",
      descricao: "Encontre perfis em alta e novos jogadores do seu mercado.",
      icone: TikTokIcon,
      borda: "border-cyan-500/30 hover:border-cyan-500/70",
      glow: "hover:shadow-[0_0_25px_rgba(6,182,212,0.25)]",
    },
    {
      id: "google-maps",
      nome: "Google Maps",
      descricao: "Encontre empresas locais com telefone, endereço e site.",
      icone: GoogleMapsIcon,
      borda: "border-emerald-500/30 hover:border-emerald-500/70",
      glow: "hover:shadow-[0_0_25px_rgba(16,185,129,0.25)]",
    },
  ];

  return (
    <section id="canais" className="relative py-16 sm:py-24 border-b border-white/[0.06] bg-[#03060a]">
      {/* Luz Difusa Laranja */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-full max-w-6xl opacity-20 blur-[130px]"
        style={{
          background: "radial-gradient(circle, #ff6200 0%, transparent 65%)",
        }}
      />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 relative z-10">
        {/* CABEÇALHO DA SEÇÃO */}
        <div className="flex flex-col items-start text-left max-w-2xl mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#ff6200]/30 bg-[#ff6200]/10 px-3.5 py-1 text-xs font-bold tracking-wider text-[#ff7a00] uppercase mb-4 shadow-[0_0_12px_rgba(255,98,0,0.15)]">
            CANAIS DE PROSPECÇÃO
          </div>

          <h2 className="font-sans text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            Prospecção em{" "}
            <span className="text-[#ff6200] drop-shadow-[0_0_20px_rgba(255,98,0,0.35)]">
              múltiplos canais.
            </span>
          </h2>

          <p className="mt-3 text-sm sm:text-base text-slate-300">
            Encontre, filtre e qualifique leads com dados reais em todas as principais plataformas.
          </p>
        </div>

        {/* GRADE DE 5 CARDS DE CANAIS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {canais.map((canal) => {
            const Icone = canal.icone;
            return (
              <div
                key={canal.id}
                className={`group relative rounded-2xl border ${canal.borda} bg-[#070c14]/90 backdrop-blur-md p-5 transition-all duration-300 ${canal.glow} hover:-translate-y-1 flex flex-col justify-between`}
              >
                <div>
                  {/* Ícone Grande do Canal */}
                  <div className="h-12 w-12 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                    <Icone className="h-7 w-7" />
                  </div>

                  {/* Nome do Canal */}
                  <h3 className="text-base font-bold text-white mb-2 group-hover:text-[#ff7a00] transition-colors">
                    {canal.nome}
                  </h3>

                  {/* Descrição Curta */}
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {canal.descricao}
                  </p>
                </div>

                {/* Seta no Canto Inferior */}
                <div className="mt-6 pt-3 border-t border-white/[0.06] flex justify-end">
                  <Link
                    to="/pricing"
                    preload="render"
                    aria-label={`Ver planos e detalhes para ${canal.nome}`}
                    className="h-7 w-7 rounded-full bg-white/[0.05] border border-white/10 group-hover:bg-[#ff6200] group-hover:border-[#ff6200] flex items-center justify-center text-slate-300 group-hover:text-white transition-all shadow-sm"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
