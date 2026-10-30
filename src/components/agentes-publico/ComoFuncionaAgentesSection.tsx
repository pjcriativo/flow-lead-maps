import { Target, Users2, BarChart2, ArrowRight } from "lucide-react";

export function ComoFuncionaAgentesSection() {
  const passos = [
    {
      numero: "01",
      icone: Target,
      titulo: "Defina seu objetivo",
      descricao: "Informe seu nicho, produto e metas.",
      destaque: "Sua fase de crescimento.",
    },
    {
      numero: "02",
      icone: Users2,
      titulo: "O CEO monta a equipe",
      descricao: "O CEO propõe a estratégia e coordena os agentes.",
      destaque: "Execução orientada a metas.",
    },
    {
      numero: "03",
      icone: BarChart2,
      titulo: "Acompanhe os resultados",
      descricao: "Consulte tarefas, oportunidades e o desempenho comercial.",
      destaque: "Evolução contínua das vendas.",
    },
  ];

  return (
    <section className="relative py-16 sm:py-24 border-b border-white/[0.06] bg-[#05080e]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 relative z-10">
        {/* CABEÇALHO DA SEÇÃO */}
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-14">
          <h2 className="font-sans text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            Como funciona
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-300">
            Do planejamento aos resultados, em três passos simples.
          </p>
        </div>

        {/* 3 PASSOS SEQUENCIAIS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 relative">
          {passos.map((passo, idx) => {
            const Icone = passo.icone;
            const isLast = idx === passos.length - 1;

            return (
              <div key={passo.numero} className="relative flex flex-col">
                {/* Card do Passo */}
                <div className="relative rounded-2xl border border-white/10 bg-[#070c14]/80 p-6 flex-1 flex flex-col items-start transition-all duration-300 hover:border-[#ff6200]/40 hover:bg-[#070c14]">
                  {/* Topo do Card: Ícone e Número */}
                  <div className="flex items-center justify-between w-full mb-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#ff6200]/10 border border-[#ff6200]/30 text-[#ff6200] shadow-[0_0_15px_rgba(255,98,0,0.15)]">
                      <Icone className="h-6 w-6" />
                    </div>
                    <span className="font-mono text-sm font-bold text-slate-500">
                      {passo.numero}
                    </span>
                  </div>

                  {/* Título e Textos */}
                  <h3 className="text-base sm:text-lg font-bold text-white mb-2">
                    {passo.titulo}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-3">
                    {passo.descricao}
                  </p>
                  <span className="text-[11px] font-semibold text-[#ff7a00] mt-auto">
                    {passo.destaque}
                  </span>
                </div>

                {/* Seta Conectora entre os Passos (apenas desktop) */}
                {!isLast && (
                  <div className="hidden md:flex absolute -right-4 lg:-right-5 top-1/2 -translate-y-1/2 z-20 h-8 w-8 items-center justify-center rounded-full bg-[#0a0f18] border border-white/10 text-[#ff6200] shadow-md pointer-events-none">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
