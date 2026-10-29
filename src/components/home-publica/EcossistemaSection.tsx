import { Zap, Target, BarChart3, ShieldCheck, ArrowRight } from "lucide-react";
import {
  FlowLogoMark,
  GoogleMapsIcon,
  InstagramIcon,
  LinkedInIcon,
  WhatsAppIcon,
  BotAiIcon,
  PropostasContratosIcon,
} from "./HomeIcons";

export function EcossistemaSection() {
  const beneficios = [
    {
      icon: Zap,
      title: "Mais produtividade",
      desc: "Menos tarefas manuais no dia a dia.",
    },
    {
      icon: Target,
      title: "Leads organizados",
      desc: "Foco em oportunidades reais de fechamento.",
    },
    {
      icon: BarChart3,
      title: "Processos automatizados",
      desc: "Do primeiro contato ao follow-up contínuo.",
    },
    {
      icon: ShieldCheck,
      title: "Acompanhamento comercial",
      desc: "Ciclo de vendas transparente, ágil e seguro.",
    },
  ];

  return (
    <section id="ecossistema" className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 py-20">
      {/* Container Principal com Estética Escura e Borda Iluminada */}
      <div className="relative rounded-3xl border border-white/[0.08] bg-[#070b12]/90 p-6 sm:p-10 lg:p-12 overflow-hidden shadow-2xl">
        {/* Glow de Fundo */}
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[450px] w-[550px] bg-[radial-gradient(ellipse_at_center,_rgba(255,98,0,0.15)_0%,_transparent_70%)] blur-3xl -z-10" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center">
          {/* Coluna 1 (Esquerda): Chamada Textual */}
          <div className="lg:col-span-4 text-left">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.25em] text-[#ff6200] mb-3">
              ECOSSISTEMA INTEGRADO
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Tudo conectado em um só lugar.
            </h2>
            <p className="mt-4 text-sm sm:text-base text-slate-400 leading-relaxed">
              Do primeiro contato ao acompanhamento comercial. Mais organização, mais oportunidades.
            </p>
            <div className="mt-8">
              <a
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-xl bg-[#ff6200] px-6 py-3.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,98,0,0.35)] hover:bg-[#e05600] hover:shadow-[0_0_28px_rgba(255,98,0,0.5)] transition-all"
              >
                Conhecer a plataforma <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Coluna 2 (Centro): Diagrama do Hub Central Conectado */}
          <div className="lg:col-span-5 flex items-center justify-center py-6 sm:py-0">
            <div className="relative w-[300px] h-[300px] sm:w-[340px] sm:h-[340px] flex items-center justify-center">
              {/* Linhas SVG Conectando os Nós ao Centro */}
              <svg viewBox="0 0 340 340" className="absolute inset-0 w-full h-full pointer-events-none" fill="none">
                {/* Linhas Circulares de Órbita */}
                <circle cx="170" cy="170" r="110" stroke="#ffffff" strokeOpacity="0.06" strokeDasharray="4 4" />
                <circle cx="170" cy="170" r="60" stroke="#ff6200" strokeOpacity="0.15" />

                {/* Raios de Conexão com Pulsos Sutis */}
                {/* Centro -> Top (Instagram) */}
                <line x1="170" y1="170" x2="170" y2="45" stroke="#ff6200" strokeWidth="1.5" strokeOpacity="0.5" />
                {/* Centro -> Top Left (Maps) */}
                <line x1="170" y1="170" x2="65" y2="90" stroke="#ff6200" strokeWidth="1.5" strokeOpacity="0.4" />
                {/* Centro -> Top Right (LinkedIn) */}
                <line x1="170" y1="170" x2="275" y2="90" stroke="#ff6200" strokeWidth="1.5" strokeOpacity="0.4" />
                {/* Centro -> Bottom Right (WhatsApp) */}
                <line x1="170" y1="170" x2="280" y2="245" stroke="#ff6200" strokeWidth="1.5" strokeOpacity="0.5" />
                {/* Centro -> Bottom (Propostas) */}
                <line x1="170" y1="170" x2="190" y2="295" stroke="#ff6200" strokeWidth="1.5" strokeOpacity="0.4" />
                {/* Centro -> Bottom Left (Agentes IA) */}
                <line x1="170" y1="170" x2="110" y2="285" stroke="#ff6200" strokeWidth="1.5" strokeOpacity="0.5" />
                {/* Centro -> Left (CRM) */}
                <line x1="170" y1="170" x2="55" y2="200" stroke="#ff6200" strokeWidth="1.5" strokeOpacity="0.4" />
              </svg>

              {/* HUB CENTRAL: LOGO FLOW BUSINESS */}
              <div className="relative z-10 flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-2xl border-2 border-[#ff6200] bg-[#0d1421] shadow-[0_0_35px_rgba(255,98,0,0.5)] transition-transform duration-300 hover:scale-105">
                <FlowLogoMark className="h-14 w-14 sm:h-16 sm:w-16" />
                <span className="absolute -bottom-2 rounded-full bg-[#ff6200] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-md">
                  Flow
                </span>
              </div>

              {/* NÓ 1: Top (Instagram) */}
              <div
                className="absolute top-2 left-1/2 -translate-x-1/2 flex h-11 w-11 items-center justify-center rounded-xl bg-[#0e1624] border border-white/10 shadow-lg hover:scale-110 hover:border-[#d6249f]/60 transition-transform"
                title="Instagram"
              >
                <InstagramIcon className="h-6 w-6" />
              </div>

              {/* NÓ 2: Top-Left (Google Maps) */}
              <div
                className="absolute top-12 left-6 flex h-11 w-11 items-center justify-center rounded-xl bg-[#0e1624] border border-white/10 shadow-lg hover:scale-110 hover:border-[#EA4335]/60 transition-transform"
                title="Google Maps"
              >
                <GoogleMapsIcon className="h-6 w-6" />
              </div>

              {/* NÓ 3: Top-Right (LinkedIn) */}
              <div
                className="absolute top-12 right-6 flex h-11 w-11 items-center justify-center rounded-xl bg-[#0e1624] border border-white/10 shadow-lg hover:scale-110 hover:border-[#0A66C2]/60 transition-transform"
                title="LinkedIn"
              >
                <LinkedInIcon className="h-6 w-6" />
              </div>

              {/* NÓ 4: Left (CRM & Métricas) */}
              <div
                className="absolute top-44 left-2 flex h-10 w-10 items-center justify-center rounded-xl bg-[#0e1624] border border-white/10 shadow-lg hover:scale-110 hover:border-blue-500/60 transition-transform text-blue-400"
                title="CRM e Métricas"
              >
                <BarChart3 className="h-5 w-5 text-blue-400" />
              </div>

              {/* NÓ 5: Right (WhatsApp) */}
              <div
                className="absolute bottom-14 right-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#0e1624] border border-white/10 shadow-lg hover:scale-110 hover:border-[#25D366]/60 transition-transform"
                title="WhatsApp"
              >
                <WhatsAppIcon className="h-6 w-6" />
              </div>

              {/* NÓ 6: Bottom-Left (Agentes de IA) */}
              <div
                className="absolute bottom-4 left-16 flex h-11 w-11 items-center justify-center rounded-xl bg-[#0e1624] border border-white/10 shadow-lg hover:scale-110 hover:border-cyan-400/60 transition-transform"
                title="Agentes de IA"
              >
                <BotAiIcon className="h-6 w-6" />
              </div>

              {/* NÓ 7: Bottom-Right (Propostas e Contratos) */}
              <div
                className="absolute bottom-3 right-16 flex h-11 w-11 items-center justify-center rounded-xl bg-[#0e1624] border border-white/10 shadow-lg hover:scale-110 hover:border-sky-400/60 transition-transform"
                title="Propostas e Contratos"
              >
                <PropostasContratosIcon className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* Coluna 3 (Direita): 4 Benefícios Objetivos */}
          <div className="lg:col-span-3 space-y-4">
            {beneficios.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3.5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:border-[#ff6200]/30 hover:bg-white/[0.05] transition-colors"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#ff6200]/15 text-[#ff6200]">
                  <item.icon className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white tracking-tight">{item.title}</h4>
                  <p className="text-xs text-slate-400 leading-snug mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

