import { Users, BarChart3, Bot, ShieldCheck } from "lucide-react";

export function IndicadoresSection() {
  const indicadores = [
    {
      icon: Users,
      title: "Prospecção Multicanal",
      descricao: "Google Maps, Instagram e LinkedIn integrados em um só lugar.",
    },
    {
      icon: BarChart3,
      title: "CRM Integrado",
      descricao: "Pipeline visual completo com métricas e histórico de interações.",
    },
    {
      icon: Bot,
      title: "Agentes de IA",
      descricao: "Automação comercial inteligente operando 24 horas por dia.",
    },
    {
      icon: ShieldCheck,
      title: "Controle de Operações",
      descricao: "Segurança, isolamento de dados e gestão transparente de equipes.",
    },
  ];

  return (
    <section className="relative z-10 mx-auto -mt-6 max-w-6xl px-4 sm:px-6 pt-12 pb-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {indicadores.map((item, idx) => (
          <div
            key={idx}
            className="group relative flex items-center gap-3.5 rounded-2xl border border-white/[0.08] bg-[#090d14]/80 p-4 backdrop-blur-sm transition-all duration-300 hover:border-[#ff6200]/40 hover:bg-[#0c121c] hover:shadow-[0_0_20px_rgba(255,98,0,0.12)]"
          >
            {/* Ícone em destaque laranja */}
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#ff6200]/15 border border-[#ff6200]/30 text-[#ff6200] transition-transform duration-300 group-hover:scale-105">
              <item.icon className="h-5 w-5" />
            </div>

            {/* Textos */}
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-white tracking-tight group-hover:text-[#ff7a00] transition-colors truncate">
                {item.title}
              </h4>
              <p className="mt-0.5 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {item.descricao}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

