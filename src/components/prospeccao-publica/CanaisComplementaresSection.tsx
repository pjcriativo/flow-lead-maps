import { ArrowRight } from "lucide-react";
import {
  BusinessB2BIcon,
  YouTubeIcon,
  TikTokIcon,
} from "../home-publica/HomeIcons";

export function CanaisComplementaresSection() {
  const complementares = [
    {
      id: "b2b",
      title: "Business B2B",
      desc: "Empresas e dados corporativos.",
      icon: BusinessB2BIcon,
    },
    {
      id: "youtube",
      title: "YouTube",
      desc: "Canais e criadores do seu nicho.",
      // YouTube em badge arredondado vermelho
      renderIcon: () => (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FF0000] text-white shadow-md">
          <YouTubeIcon className="h-6 w-6" />
        </div>
      ),
    },
    {
      id: "tiktok",
      title: "TikTok",
      desc: "Perfis e tendências do seu mercado.",
      icon: TikTokIcon,
    },
  ];

  return (
    <section className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 py-12">
      {/* Eyebrow */}
      <div className="mb-6">
        <span className="inline-block text-xs font-bold uppercase tracking-[0.25em] text-[#ff6200]">
          CANAIS COMPLEMENTARES
        </span>
      </div>

      {/* Grid de 3 Cards Horizontais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {complementares.map((c) => (
          <div
            key={c.id}
            className="group relative flex items-center justify-between rounded-2xl border border-white/[0.08] bg-[#090e17]/85 p-4 sm:p-5 backdrop-blur-md transition-all duration-300 hover:border-[#ff6200]/40 hover:bg-[#0c121e] hover:shadow-[0_0_20px_rgba(255,98,0,0.14)]"
          >
            <div className="flex items-center gap-3.5 min-w-0 pr-2">
              {c.renderIcon ? (
                c.renderIcon()
              ) : c.icon ? (
                <div className="h-12 w-12 shrink-0 rounded-2xl overflow-hidden shadow-md">
                  <c.icon className="h-full w-full" />
                </div>
              ) : null}

              <div className="min-w-0">
                <h4 className="text-sm font-bold text-white tracking-tight group-hover:text-[#ff7a00] transition-colors truncate">
                  {c.title}
                </h4>
                <p className="mt-0.5 text-xs text-slate-400 truncate">
                  {c.desc}
                </p>
              </div>
            </div>

            <a
              href="/pricing"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.04] border border-white/10 text-slate-300 group-hover:bg-[#ff6200] group-hover:text-white group-hover:border-[#ff6200] transition-all"
              aria-label={`Ver canal ${c.title}`}
            >
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}

