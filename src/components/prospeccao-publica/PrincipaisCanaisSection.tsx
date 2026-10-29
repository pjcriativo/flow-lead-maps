import { CheckCircle2, ArrowRight } from "lucide-react";
import {
  GoogleMapsIcon,
  InstagramIcon,
  LinkedInIcon,
} from "../home-publica/HomeIcons";

export function PrincipaisCanaisSection() {
  const canais = [
    {
      id: "maps",
      nome: "Google Maps",
      sub: "Encontre empresas por nicho e localização.",
      icon: GoogleMapsIcon,
      // Mini Mockup de Mapa
      renderMockup: () => (
        <div className="relative h-32 w-full rounded-xl bg-slate-950 border border-white/5 overflow-hidden my-4">
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:12px_12px] opacity-70" />
          {/* Pins Laranja Conectados */}
          <div className="absolute top-6 left-8 h-3 w-3 rounded-full bg-[#ff6200] shadow-[0_0_8px_#ff6200]" />
          <div className="absolute top-14 left-24 h-3 w-3 rounded-full bg-[#ff6200] shadow-[0_0_8px_#ff6200]" />
          <div className="absolute top-8 right-16 h-3.5 w-3.5 rounded-full bg-[#ff6200] ring-2 ring-white/50 shadow-[0_0_12px_#ff6200]" />
          <div className="absolute bottom-6 right-24 h-3 w-3 rounded-full bg-[#ff6200] shadow-[0_0_8px_#ff6200]" />
          {/* Linhas de conexão sutis */}
          <svg className="absolute inset-0 h-full w-full pointer-events-none" fill="none">
            <line x1="38" y1="30" x2="102" y2="62" stroke="#ff6200" strokeWidth="1" strokeOpacity="0.4" strokeDasharray="3 3" />
            <line x1="102" y1="62" x2="200" y2="38" stroke="#ff6200" strokeWidth="1" strokeOpacity="0.4" strokeDasharray="3 3" />
          </svg>
        </div>
      ),
      itens: [
        "Busca por segmento",
        "Localização",
        "Dados empresariais",
        "Filtros avançados",
        "Organização em listas",
      ],
    },
    {
      id: "instagram",
      nome: "Instagram",
      sub: "Descubra perfis e oportunidades comerciais.",
      icon: InstagramIcon,
      // Mini Mockup de Instagram
      renderMockup: () => (
        <div className="grid grid-cols-3 gap-2 my-4">
          <div className="h-32 rounded-xl bg-[#0e1624] border border-white/10 p-2 flex flex-col justify-between">
            <div className="h-14 w-full rounded-lg bg-gradient-to-tr from-purple-900/40 to-pink-900/40 border border-white/5" />
            <div className="space-y-1">
              <div className="h-1.5 w-12 bg-white/30 rounded" />
              <div className="h-1 w-8 bg-white/20 rounded" />
            </div>
          </div>
          <div className="h-32 rounded-xl bg-[#0e1624] border border-white/10 p-2 flex flex-col justify-between">
            <div className="h-14 w-full rounded-lg bg-gradient-to-tr from-pink-900/40 to-orange-900/40 border border-white/5" />
            <div className="space-y-1">
              <div className="h-1.5 w-12 bg-white/30 rounded" />
              <div className="h-1 w-8 bg-white/20 rounded" />
            </div>
          </div>
          <div className="h-32 rounded-xl bg-[#0e1624] border border-white/10 p-2 flex flex-col justify-between">
            <div className="h-14 w-full rounded-lg bg-gradient-to-tr from-purple-900/40 to-blue-900/40 border border-white/5" />
            <div className="space-y-1">
              <div className="h-1.5 w-12 bg-white/30 rounded" />
              <div className="h-1 w-8 bg-white/20 rounded" />
            </div>
          </div>
        </div>
      ),
      itens: [
        "Pesquisa de perfis",
        "Filtros de segmentação",
        "Análise de perfis",
        "Inteligência competitiva",
        "Organização no CRM",
      ],
    },
    {
      id: "linkedin",
      nome: "LinkedIn",
      sub: "Explore oportunidades no mercado B2B.",
      icon: LinkedInIcon,
      // Mini Mockup de LinkedIn
      renderMockup: () => (
        <div className="my-4 h-32 rounded-xl bg-[#090e18] border border-white/10 p-2.5 flex flex-col justify-between">
          <div className="flex items-center gap-2 pb-1.5 border-b border-white/5">
            <div className="h-5 w-5 rounded bg-[#0A66C2] flex items-center justify-center text-[10px] font-bold text-white">in</div>
            <div className="h-2 w-24 bg-white/20 rounded" />
          </div>
          <div className="space-y-1.5">
            <div className="p-1.5 rounded bg-white/5 flex items-center justify-between text-[10px]">
              <div className="h-1.5 w-20 bg-white/40 rounded" />
              <div className="h-1.5 w-8 bg-[#ff6200]/50 rounded" />
            </div>
            <div className="p-1.5 rounded bg-white/5 flex items-center justify-between text-[10px]">
              <div className="h-1.5 w-24 bg-white/40 rounded" />
              <div className="h-1.5 w-8 bg-[#ff6200]/50 rounded" />
            </div>
          </div>
        </div>
      ),
      itens: [
        "Empresas e profissionais",
        "Segmentação comercial",
        "Organização de oportunidades",
        "Integração com CRM",
        "Planejamento de prospecção",
      ],
    },
  ];

  return (
    <section id="canais" className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 py-20">
      {/* Header da Seção */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="inline-block text-xs font-bold uppercase tracking-[0.25em] text-[#ff6200] mb-3">
          PRINCIPAIS CANAIS
        </span>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
          Prospecção poderosa em{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff7a00] to-[#ff4500]">
            múltiplos canais.
          </span>
        </h2>
        <p className="mt-4 text-base sm:text-lg text-slate-300">
          Encontre empresas, perfis e oportunidades em diferentes plataformas, com filtros inteligentes e dados organizados.
        </p>
      </div>

      {/* Grade dos 3 Cards Principais */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {canais.map((c) => (
          <div
            key={c.id}
            className="group relative flex flex-col justify-between rounded-3xl border border-white/[0.08] bg-[#090e17]/90 p-6 sm:p-7 backdrop-blur-md transition-all duration-300 hover:border-[#ff6200]/50 hover:bg-[#0c1320] hover:shadow-[0_0_30px_rgba(255,98,0,0.18)]"
          >
            <div>
              {/* Topo: Ícone + Título e Subtítulo */}
              <div className="flex items-center gap-3.5 mb-2">
                <div className="h-12 w-12 shrink-0 rounded-2xl overflow-hidden shadow-md group-hover:scale-105 transition-transform">
                  <c.icon className="h-full w-full" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight group-hover:text-[#ff7a00] transition-colors">
                    {c.nome}
                  </h3>
                  <p className="text-xs text-slate-400 leading-snug">{c.sub}</p>
                </div>
              </div>

              {/* Mockup Ilustrativo */}
              {c.renderMockup()}

              {/* Lista de Recursos (Checklist Laranja) */}
              <ul className="space-y-3 my-6 text-xs sm:text-sm text-slate-300">
                {c.itens.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-[#ff6200] shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Rodapé do Card com Botão de Ação Circular */}
            <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 group-hover:text-white transition-colors">
                Explorar canal
              </span>
              <a
                href="/pricing"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.05] border border-white/10 text-white group-hover:bg-[#ff6200] group-hover:border-[#ff6200] group-hover:shadow-[0_0_15px_rgba(255,98,0,0.5)] transition-all"
                aria-label={`Explorar recursos do ${c.nome}`}
              >
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

