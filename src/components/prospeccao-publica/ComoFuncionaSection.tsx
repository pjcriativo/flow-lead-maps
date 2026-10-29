import { Search, ListFilter, BarChart3, ArrowRight } from "lucide-react";

export function ComoFuncionaSection() {
  const passos = [
    {
      numero: "01",
      titulo: "Escolha seu público",
      desc: "Defina nicho, região e critérios de busca.",
      icon: Search,
    },
    {
      numero: "02",
      titulo: "Descubra oportunidades",
      desc: "Utilize os canais e filtros para encontrar leads qualificados.",
      icon: ListFilter,
    },
    {
      numero: "03",
      titulo: "Organize suas vendas",
      desc: "Envie para o CRM e acompanhe o funil comercial.",
      icon: BarChart3,
    },
  ];

  return (
    <section id="como-funciona" className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 py-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* Esquerda: Título e Subtítulo */}
        <div className="lg:col-span-4 text-left">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.25em] text-[#ff6200] mb-3">
            COMO FUNCIONA
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Da busca ao cliente, em{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff7a00] to-[#ff4500]">
              3 passos.
            </span>
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
            Um processo simples e eficiente para encontrar oportunidades e organizar suas vendas.
          </p>
        </div>

        {/* Direita: Três Etapas Conectadas com Setas */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {passos.map((p, idx) => (
            <div key={p.numero} className="relative flex flex-col items-center md:items-start text-center md:text-left">
              {/* Ícone Redondo Laranja Grande com Borda */}
              <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#ff6200]/15 border-2 border-[#ff6200] text-[#ff6200] shadow-[0_0_20px_rgba(255,98,0,0.3)]">
                <p.icon className="h-7 w-7" />
              </div>

              {/* Número + Título */}
              <div className="space-y-1">
                <div className="text-xs font-mono font-bold text-[#ff6200] tracking-wider">
                  {p.numero}
                </div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  {p.titulo}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
                  {p.desc}
                </p>
              </div>

              {/* Seta de Conexão Entre os Passos (apenas no desktop e nos 2 primeiros) */}
              {idx < passos.length - 1 && (
                <div className="hidden lg:block absolute -right-3 top-8 text-slate-600">
                  <ArrowRight className="h-5 w-5" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

