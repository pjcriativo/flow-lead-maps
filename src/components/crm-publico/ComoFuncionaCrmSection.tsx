import {
  DownloadCloud,
  Filter,
  Kanban,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

export function ComoFuncionaCrmSection() {
  const etapas = [
    {
      numero: "01",
      titulo: "Capturar",
      desc: "Receba leads dos seus canais de prospecção.",
      icon: DownloadCloud,
    },
    {
      numero: "02",
      titulo: "Qualificar",
      desc: "Identifique e classifique as melhores oportunidades.",
      icon: Filter,
    },
    {
      numero: "03",
      titulo: "Acompanhar",
      desc: "Gerencie o funil de vendas e as etapas de negociação.",
      icon: Kanban,
    },
    {
      numero: "04",
      titulo: "Converter",
      desc: "Feche negócios e acompanhe seus clientes.",
      icon: CheckCircle2,
    },
  ];

  return (
    <section className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 py-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* Esquerda: Headline e Subtítulo */}
        <div className="lg:col-span-4 text-left">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.25em] text-[#ff6200] mb-3">
            COMO FUNCIONA
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Do lead ao cliente, em{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff7a00] to-[#ff4500]">
              4 etapas.
            </span>
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
            Um processo simples e eficiente para organizar suas vendas e aumentar suas conversões.
          </p>
        </div>

        {/* Direita: As 4 Etapas Horizontais */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-center">
          {etapas.map((e, idx) => (
            <div key={e.numero} className="relative flex flex-col items-center lg:items-start text-center lg:text-left">
              {/* Ícone Redondo Laranja Grande com Borda */}
              <div className="relative mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#ff6200]/15 border-2 border-[#ff6200] text-[#ff6200] shadow-[0_0_20px_rgba(255,98,0,0.3)]">
                <e.icon className="h-6 w-6" />
              </div>

              {/* Número + Título */}
              <div className="space-y-1">
                <div className="text-xs font-mono font-bold text-[#ff6200] tracking-wider">
                  {e.numero}
                </div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  {e.titulo}
                </h3>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  {e.desc}
                </p>
              </div>

              {/* Seta de Conexão Entre os Passos */}
              {idx < etapas.length - 1 && (
                <div className="hidden lg:block absolute -right-3 top-7 text-slate-600">
                  <ArrowRight className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

