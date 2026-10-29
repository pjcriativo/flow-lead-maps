import { useState, useRef } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  X,
  Search,
  Bell,
  ArrowUpRight,
  TrendingUp,
  Users,
  Target,
  Bot,
  Building2,
  Briefcase,
  FileSpreadsheet,
  FileCheck,
  BarChart3,
  Sparkles,
} from "lucide-react";
import { FlowLogoMark } from "./HomeIcons";

export function HeroVideoMockup() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (!videoRef.current) {
      setShowModal(true);
      return;
    }
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {
        // Fallback to modal if browser blocks or video source not supported
        setShowModal(true);
      });
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const duration = videoRef.current.duration || 1;
      setProgress((current / duration) * 100);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="relative mx-auto mt-12 w-full max-w-6xl px-4 sm:px-6">
      {/* 1. Efeitos de Fundo Luminosos (Linhas Curvas de Laser Laranja e Aura Volumétrica) */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-[500px] w-[1000px] -translate-x-1/2">
        {/* Grande aura central */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,98,0,0.22)_0%,_rgba(255,80,0,0.08)_45%,_transparent_70%)] blur-2xl" />

        {/* Linhas curvas de laser laranja (reproduzindo exatamente o efeito da imagem de referência) */}
        <svg
          viewBox="0 0 1000 500"
          className="absolute inset-0 h-full w-full opacity-60"
          fill="none"
        >
          <path
            d="M50 350C150 120 350 40 500 50C650 60 850 140 950 380"
            stroke="url(#orange-glow-beam-1)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M100 420C220 180 380 90 500 95C620 100 780 190 900 440"
            stroke="url(#orange-glow-beam-2)"
            strokeWidth="1.5"
            strokeOpacity="0.7"
          />
          <path
            d="M20 280C140 80 330 10 500 15C670 20 860 90 980 290"
            stroke="url(#orange-glow-beam-1)"
            strokeWidth="1.2"
            strokeOpacity="0.4"
          />
          <defs>
            <linearGradient id="orange-glow-beam-1" x1="0" y1="0" x2="1000" y2="0" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FF4500" stopOpacity="0" />
              <stop offset="30%" stopColor="#FF6200" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#FFA040" stopOpacity="1" />
              <stop offset="70%" stopColor="#FF6200" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#FF4500" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="orange-glow-beam-2" x1="0" y1="0" x2="1000" y2="0" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FF6200" stopOpacity="0" />
              <stop offset="50%" stopColor="#FF7A00" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#FF6200" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* 2. Container dos 3 Painéis com Efeito 3D em Perspectiva */}
      <div className="relative flex items-center justify-center [perspective:1400px]">
        {/* Painel Esquerdo com Perspectiva 3D (Google Maps Satélite / Leads) */}
        <div
          className="hidden lg:block absolute -left-12 top-8 z-0 w-[300px] h-[380px] rounded-2xl bg-[#090d14]/90 border border-white/10 p-4 shadow-2xl backdrop-blur-md opacity-45 pointer-events-none transition-transform duration-500 hover:opacity-60"
          style={{
            transform: "rotateY(16deg) rotateZ(-3deg) scale(0.92)",
            transformOrigin: "right center",
          }}
        >
          <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-semibold text-white">
              <Building2 className="w-3.5 h-3.5 text-[#ff6200]" /> Google Maps Pro
            </span>
            <span className="text-[10px] bg-[#ff6200]/20 text-[#ff6200] px-1.5 py-0.5 rounded">São Paulo, SP</span>
          </div>
          {/* Miniatura satélite com pins */}
          <div className="relative mt-3 h-44 rounded-lg overflow-hidden bg-slate-900 border border-white/5">
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:12px_12px] opacity-70" />
            {/* Pins luminosos */}
            <div className="absolute top-6 left-12 w-2.5 h-2.5 rounded-full bg-[#EA4335] shadow-[0_0_8px_#EA4335]" />
            <div className="absolute top-16 left-24 w-2.5 h-2.5 rounded-full bg-[#4285F4] shadow-[0_0_8px_#4285F4]" />
            <div className="absolute top-10 right-14 w-2.5 h-2.5 rounded-full bg-[#34A853] shadow-[0_0_8px_#34A853]" />
            <div className="absolute bottom-8 left-16 w-2.5 h-2.5 rounded-full bg-[#FBBC04] shadow-[0_0_8px_#FBBC04]" />
            <div className="absolute bottom-12 right-20 w-3 h-3 rounded-full bg-[#ff6200] ring-2 ring-white/40 shadow-[0_0_12px_#ff6200]" />
          </div>
          <div className="mt-3 space-y-2 text-[11px]">
            <div className="flex justify-between items-center text-slate-300 bg-white/5 p-1.5 rounded">
              <span className="truncate">Clinica Odonto Prime</span>
              <span className="text-emerald-400 font-mono">+11 98...</span>
            </div>
            <div className="flex justify-between items-center text-slate-300 bg-white/5 p-1.5 rounded">
              <span className="truncate">Dra. Amanda Dermatologia</span>
              <span className="text-emerald-400 font-mono">+11 97...</span>
            </div>
          </div>
        </div>

        {/* Painel Direito com Perspectiva 3D (Campanhas / WhatsApp) */}
        <div
          className="hidden lg:block absolute -right-12 top-8 z-0 w-[300px] h-[380px] rounded-2xl bg-[#090d14]/90 border border-white/10 p-4 shadow-2xl backdrop-blur-md opacity-45 pointer-events-none transition-transform duration-500 hover:opacity-60"
          style={{
            transform: "rotateY(-16deg) rotateZ(3deg) scale(0.92)",
            transformOrigin: "left center",
          }}
        >
          <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-semibold text-white">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> WhatsApp Ativo
            </span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">Online</span>
          </div>
          <div className="mt-3 space-y-2 text-[11px]">
            <div className="p-2 rounded-lg bg-white/5 border border-white/5">
              <div className="flex justify-between text-white font-medium">
                <span>Campanha Odonto SP</span>
                <span className="text-emerald-400 font-mono">89%</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div className="bg-emerald-500 h-full w-[89%]" />
              </div>
            </div>
            <div className="p-2 rounded-lg bg-white/5 border border-white/5">
              <div className="flex justify-between text-white font-medium">
                <span>Follow-up Decisores</span>
                <span className="text-[#ff6200] font-mono">142 envios</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 truncate">
                "Olá Roberto, tudo bem? Vi a expansão da sua clínica..."
              </p>
            </div>
            <div className="p-2 rounded-lg bg-white/5 border border-white/5">
              <div className="flex justify-between text-white font-medium">
                <span>Agente IA Comercial</span>
                <span className="text-cyan-400 font-mono">Ativo 24/7</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 truncate">
                Qualificando respostas e agendando demonstrações.
              </p>
            </div>
          </div>
        </div>

        {/* 3. GRANDE PAINEL CENTRAL — VÍDEO & INTERFACE FLOW BUSINESS */}
        <div
          id="demo"
          className="relative z-10 w-full overflow-hidden rounded-2xl md:rounded-3xl border-2 border-[#ff6200]/70 bg-[#070b11] shadow-[0_0_50px_rgba(255,98,0,0.32)] transition-all duration-300 hover:border-[#ff6200] hover:shadow-[0_0_70px_rgba(255,98,0,0.45)]"
        >
          {/* Top Bar da Interface do Mockup */}
          <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#0a0f18] px-3 py-2.5 sm:px-5 sm:py-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                <div className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
              </div>
              <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-white/10">
                <FlowLogoMark className="h-5 w-5" />
                <span className="font-bold text-white text-xs tracking-tight">Flow Business</span>
              </div>
            </div>

            {/* Campo de Busca Simulado */}
            <div className="flex items-center gap-2 rounded-lg bg-white/[0.06] border border-white/10 px-3 py-1 text-slate-400 text-[11px] w-48 sm:w-72">
              <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="truncate">Buscar leads, empresas, contatos...</span>
            </div>

            {/* Ações do Topo */}
            <div className="flex items-center gap-2 sm:gap-3 text-slate-400">
              <div className="relative p-1">
                <Bell className="h-3.5 w-3.5 text-slate-300" />
                <span className="absolute top-0 right-0 h-1.5 w-1.5 rounded-full bg-[#ff6200]" />
              </div>
              <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-[#ff6200] to-[#ffa040] p-0.5">
                <div className="h-full w-full rounded-full bg-slate-900 flex items-center justify-center text-[10px] font-bold text-white">
                  FB
                </div>
              </div>
            </div>
          </div>

          {/* Área Principal de Exibição / Poster 16:9 */}
          <div className="relative aspect-[16/9] w-full bg-[#05080e] overflow-hidden select-none">
            {/* Interface Interna do Dashboard Flow Business (Fidelidade Absoluta à Imagem de Referência) */}
            <div className="absolute inset-0 flex">
              {/* Sidebar Lateral Esquerda do Dashboard */}
              <div className="hidden md:flex flex-col w-44 shrink-0 border-r border-white/[0.08] bg-[#070c14] p-3 text-[11px]">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 rounded-lg bg-[#ff6200]/15 border border-[#ff6200]/30 px-2.5 py-1.5 text-white font-medium shadow-[0_0_12px_rgba(255,98,0,0.15)]">
                    <BarChart3 className="h-3.5 w-3.5 text-[#ff6200]" />
                    <span>Visão Geral</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    <span>Leads</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                    <Target className="h-3.5 w-3.5 text-slate-400" />
                    <span>Oportunidades</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                    <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                    <span>CRM</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                    <TrendingUp className="h-3.5 w-3.5 text-slate-400" />
                    <span>Campanhas</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                    <Bot className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Agentes de IA</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                    <FileCheck className="h-3.5 w-3.5 text-slate-400" />
                    <span>Propostas</span>
                  </div>
                </div>
              </div>

              {/* Corpo Principal da Visão Geral */}
              <div className="flex-1 p-3 sm:p-5 flex flex-col justify-between overflow-hidden">
                {/* Título da Seção */}
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight">Visão Geral</h3>
                    <p className="text-[10px] text-slate-400">Resumo comercial atualizado em tempo real</p>
                  </div>
                  <div className="text-[10px] text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded">
                    Últimos 6 meses ▾
                  </div>
                </div>

                {/* Linha com 4 Cards de Métricas Reais da Imagem */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 my-2">
                  <div className="rounded-xl border border-white/[0.08] bg-[#0c121c]/90 p-2 sm:p-3">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Leads capturados</span>
                      <Users className="h-3 w-3 text-blue-400" />
                    </div>
                    <div className="mt-1 flex items-baseline justify-between">
                      <span className="text-sm sm:text-base font-extrabold text-white">2.847</span>
                      <span className="text-[10px] font-semibold text-emerald-400 flex items-center">
                        <ArrowUpRight className="h-2.5 w-2.5" /> 23%
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/[0.08] bg-[#0c121c]/90 p-2 sm:p-3">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Oportunidades</span>
                      <Target className="h-3 w-3 text-purple-400" />
                    </div>
                    <div className="mt-1 flex items-baseline justify-between">
                      <span className="text-sm sm:text-base font-extrabold text-white">463</span>
                      <span className="text-[10px] font-semibold text-emerald-400 flex items-center">
                        <ArrowUpRight className="h-2.5 w-2.5" /> 18%
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/[0.08] bg-[#0c121c]/90 p-2 sm:p-3">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Clientes</span>
                      <Briefcase className="h-3 w-3 text-emerald-400" />
                    </div>
                    <div className="mt-1 flex items-baseline justify-between">
                      <span className="text-sm sm:text-base font-extrabold text-white">52</span>
                      <span className="text-[10px] font-semibold text-emerald-400 flex items-center">
                        <ArrowUpRight className="h-2.5 w-2.5" /> 42%
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/[0.08] bg-[#0c121c]/90 p-2 sm:p-3">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Receita gerada</span>
                      <TrendingUp className="h-3 w-3 text-[#ff6200]" />
                    </div>
                    <div className="mt-1 flex items-baseline justify-between">
                      <span className="text-sm sm:text-base font-extrabold text-white">R$ 148.920</span>
                      <span className="text-[10px] font-semibold text-emerald-400 flex items-center">
                        <ArrowUpRight className="h-2.5 w-2.5" /> 37%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Área Inferior: Gráfico de Leads & Canais de Origem */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3 flex-1 min-h-0">
                  {/* Gráfico Curvo de Alta Resolução */}
                  <div className="md:col-span-2 rounded-xl border border-white/[0.08] bg-[#090e17]/90 p-2.5 sm:p-3 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span className="font-semibold text-white">Leads e Oportunidades</span>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#ff6200]" /> Leads
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-400" /> Oportunidades
                        </span>
                      </div>
                    </div>

                    {/* SVG do Gráfico com Curva Laranja Brilhante */}
                    <div className="relative w-full h-24 sm:h-32">
                      <svg viewBox="0 0 400 120" className="w-full h-full" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="chart-orange-grad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#FF6200" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#FF6200" stopOpacity="0.0" />
                          </linearGradient>
                          <linearGradient id="chart-blue-grad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        {/* Linhas de Grade Horizontais */}
                        <line x1="0" y1="20" x2="400" y2="20" stroke="#ffffff" strokeOpacity="0.05" />
                        <line x1="0" y1="60" x2="400" y2="60" stroke="#ffffff" strokeOpacity="0.05" />
                        <line x1="0" y1="100" x2="400" y2="100" stroke="#ffffff" strokeOpacity="0.05" />

                        {/* Área e Linha Azul (Oportunidades) */}
                        <path
                          d="M0 95 Q 60 85, 120 75 T 240 50 T 320 40 T 400 25 L 400 120 L 0 120 Z"
                          fill="url(#chart-blue-grad)"
                        />
                        <path
                          d="M0 95 Q 60 85, 120 75 T 240 50 T 320 40 T 400 25"
                          fill="none"
                          stroke="#38BDF8"
                          strokeWidth="1.8"
                        />

                        {/* Área e Linha Laranja (Leads - Destaque Principal) */}
                        <path
                          d="M0 80 Q 70 70, 130 90 T 220 45 T 310 55 T 400 15 L 400 120 L 0 120 Z"
                          fill="url(#chart-orange-grad)"
                        />
                        <path
                          d="M0 80 Q 70 70, 130 90 T 220 45 T 310 55 T 400 15"
                          fill="none"
                          stroke="#FF6200"
                          strokeWidth="2.4"
                        />

                        {/* Pontos de Destaque */}
                        <circle cx="220" cy="45" r="3.5" fill="#FFFFFF" stroke="#FF6200" strokeWidth="2" />
                        <circle cx="310" cy="55" r="3.5" fill="#FFFFFF" stroke="#FF6200" strokeWidth="2" />
                        <circle cx="400" cy="15" r="4" fill="#FFA040" stroke="#FFFFFF" strokeWidth="1.5" />
                      </svg>
                    </div>

                    <div className="flex justify-between text-[9px] text-slate-500 pt-1 border-t border-white/[0.05]">
                      <span>Jan</span>
                      <span>Fev</span>
                      <span>Mar</span>
                      <span>Abr</span>
                      <span>Mai</span>
                      <span>Jun</span>
                    </div>
                  </div>

                  {/* Canais de Origem */}
                  <div className="hidden sm:flex flex-col justify-between rounded-xl border border-white/[0.08] bg-[#090e17]/90 p-2.5 sm:p-3 text-[10px]">
                    <span className="font-semibold text-white">Canais de origem</span>
                    <div className="space-y-1.5 my-auto">
                      <div>
                        <div className="flex justify-between text-slate-300 pb-0.5">
                          <span className="flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#EA4335]" /> Google Maps
                          </span>
                          <span className="font-mono text-white">34%</span>
                        </div>
                        <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                          <div className="bg-[#EA4335] h-full w-[34%]" />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-slate-300 pb-0.5">
                          <span className="flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#D6249F]" /> Instagram
                          </span>
                          <span className="font-mono text-white">28%</span>
                        </div>
                        <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                          <div className="bg-[#D6249F] h-full w-[28%]" />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-slate-300 pb-0.5">
                          <span className="flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#0A66C2]" /> LinkedIn
                          </span>
                          <span className="font-mono text-white">18%</span>
                        </div>
                        <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                          <div className="bg-[#0A66C2] h-full w-[18%]" />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-slate-300 pb-0.5">
                          <span className="flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#25D366]" /> WhatsApp
                          </span>
                          <span className="font-mono text-white">14%</span>
                        </div>
                        <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                          <div className="bg-[#25D366] h-full w-[14%]" />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-slate-300 pb-0.5">
                          <span className="flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" /> Outros
                          </span>
                          <span className="font-mono text-white">6%</span>
                        </div>
                        <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                          <div className="bg-slate-400 h-full w-[6%]" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* BOTÃO CENTRAL DE REPRODUÇÃO (Play Button com Pulso Laranja e Interatividade) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/25 backdrop-blur-[1.5px] transition-opacity duration-300 hover:bg-black/15">
              <button
                type="button"
                onClick={togglePlay}
                aria-label="Assistir demonstração da plataforma Flow Business"
                className="group relative flex items-center justify-center"
              >
                {/* Pulso e Aura Luminosa do Play */}
                <span className="absolute -inset-3 rounded-full bg-[#ff6200] opacity-35 blur-md animate-pulse" />
                <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-[#ff7a00] to-[#ff4500] opacity-75 group-hover:scale-110 transition-transform duration-300" />

                {/* Círculo Principal do Botão */}
                <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-gradient-to-b from-[#ff7a00] to-[#ff4500] text-white shadow-[0_0_30px_rgba(255,98,0,0.65)] ring-4 ring-white/20 transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_45px_rgba(255,98,0,0.85)] group-active:scale-95">
                  <Play className="h-7 w-7 sm:h-9 sm:w-9 fill-white text-white translate-x-0.5" />
                </div>
              </button>

              <span className="mt-4 rounded-full bg-black/60 px-4 py-1.5 text-xs font-medium text-white/90 backdrop-blur-md border border-white/10">
                Ver demonstração da plataforma (1 min)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. MODAL / PLAYER DE VÍDEO COMPLETO E ACESSÍVEL */}
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 sm:p-6 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setShowModal(false)}
        >
          <div
            className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-[#ff6200]/50 bg-[#070b12] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar do Player */}
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-[#0a0f18]">
              <div className="flex items-center gap-2">
                <FlowLogoMark className="h-5 w-5" />
                <span className="text-sm font-bold text-white">Demonstração Comercial — Flow Business</span>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                aria-label="Fechar vídeo"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Container do Vídeo */}
            <div className="relative aspect-video w-full bg-black flex items-center justify-center">
              <video
                ref={videoRef}
                className="h-full w-full object-contain"
                playsInline
                controls
                autoPlay
                onTimeUpdate={handleTimeUpdate}
                poster="/og-image-flow-business.png"
              >
                {/* Fallback de vídeo WebM/MP4 acessível */}
                <source src="/demo-flow-business.mp4" type="video/mp4" />
                Seu navegador não suporta a tag de vídeo.
              </video>
            </div>

            {/* Informações da Demonstração */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-[#0a0f18] border-t border-white/10 text-xs text-slate-300">
              <p>
                Acompanhe como nossa IA projeta campanhas, extrai leads qualificados e agenda reuniões no automático.
              </p>
              <a
                href="/pricing"
                className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-[#ff6200] px-4 py-2 font-semibold text-white shadow-md hover:bg-[#e05600] transition-colors"
              >
                Ver Planos Disponíveis →
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
