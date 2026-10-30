import { TrendingUp, ArrowUpRight } from "lucide-react";

export function ResultadosReaisSection() {
  const metricas = [
    {
      titulo: "Leads encontrados",
      valor: "2.847",
      crescimento: "+ 32%",
      iconeCrescimento: ArrowUpRight,
      barras: [40, 55, 60, 48, 70, 85, 100],
    },
    {
      titulo: "Taxa de qualificação",
      valor: "28%",
      crescimento: "+ 18%",
      iconeCrescimento: ArrowUpRight,
      curva: true,
    },
    {
      titulo: "Leads no CRM",
      valor: "463",
      crescimento: "+ 42%",
      iconeCrescimento: ArrowUpRight,
      barras: [30, 45, 50, 65, 75, 85, 100],
    },
  ];

  return (
    <section className="relative py-16 sm:py-24 border-b border-white/[0.06] bg-[#05080e]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 relative z-10">
        {/* CABEÇALHO DA SEÇÃO */}
        <div className="flex flex-col items-start text-left max-w-2xl mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#ff6200]/30 bg-[#ff6200]/10 px-3.5 py-1 text-xs font-bold tracking-wider text-[#ff7a00] uppercase mb-4 shadow-[0_0_12px_rgba(255,98,0,0.15)]">
            RESULTADOS REAIS
          </div>

          <h2 className="font-sans text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            Mais oportunidades. <br />
            <span className="text-[#ff6200] drop-shadow-[0_0_20px_rgba(255,98,0,0.35)]">
              Mais clientes.
            </span>
          </h2>

          <p className="mt-3 text-sm sm:text-base text-slate-300">
            Acompanhe sua prospecção em tempo real e tenha total controle dos seus resultados.
          </p>
        </div>

        {/* 3 CARDS DE MÉTRICAS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {metricas.map((item, idx) => (
            <div
              key={idx}
              className="relative rounded-2xl border border-white/10 bg-[#070c14]/90 p-6 flex flex-col justify-between transition-all duration-300 hover:border-[#ff6200]/40 hover:shadow-[0_0_25px_rgba(255,98,0,0.15)]"
            >
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-1">{item.titulo}</p>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                    {item.valor}
                  </span>
                  <span className="inline-flex items-center text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <item.iconeCrescimento className="h-3 w-3 mr-0.5" />
                    {item.crescimento}
                  </span>
                </div>
              </div>

              {/* Mini Gráfico Visual em Laranja */}
              <div className="mt-8 pt-4 border-t border-white/[0.06] h-16 flex items-end justify-between gap-2">
                {item.barras ? (
                  item.barras.map((altura, bIdx) => (
                    <div
                      key={bIdx}
                      className="flex-1 rounded-t-sm bg-gradient-to-t from-[#ff6200]/40 to-[#ff6200] transition-all hover:brightness-125"
                      style={{ height: `${altura}%` }}
                    />
                  ))
                ) : (
                  // Gráfico de Linha / Curva Laranja
                  <div className="w-full h-full flex items-center justify-center relative">
                    <svg
                      viewBox="0 0 100 40"
                      className="w-full h-full overflow-visible"
                      preserveAspectRatio="none"
                    >
                      <path
                        d="M0,35 Q25,30 45,20 T80,10 T100,5"
                        fill="none"
                        stroke="#ff6200"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      <circle cx="100" cy="5" r="3" fill="#ff6200" className="animate-pulse" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

