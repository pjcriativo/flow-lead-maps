import { Search, Filter, FolderPlus, TrendingUp, ArrowRight } from "lucide-react";

export function ComoFuncionaSection() {
  const etapas = [
    {
      numero: "01",
      icone: Search,
      titulo: "Buscar",
      descricao: "Defina o nicho, localização e filtros.",
      destaque: "Varredura multicanal inteligente.",
    },
    {
      numero: "02",
      icone: Filter,
      titulo: "Qualificar",
      descricao: "Analise os leads encontrados.",
      destaque: "Filtros e métricas de engajamento.",
    },
    {
      numero: "03",
      icone: FolderPlus,
      titulo: "Adicionar ao CRM",
      descricao: "Salve os melhores leads no seu funil.",
      destaque: "Organização instantânea em listas.",
    },
    {
      numero: "04",
      icone: TrendingUp,
      titulo: "Converter",
      descricao: "Acompanhe e feche mais negócios.",
      destaque: "Atendimento e vendas no automático.",
    },
  ];

  return (
    <section className="relative py-16 sm:py-24 border-b border-white/[0.06] bg-[#03060a]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 relative z-10">
        {/* CABEÇALHO DA SEÇÃO */}
        <div className="flex flex-col items-start text-left max-w-2xl mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#ff6200]/30 bg-[#ff6200]/10 px-3.5 py-1 text-xs font-bold tracking-wider text-[#ff7a00] uppercase mb-4 shadow-[0_0_12px_rgba(255,98,0,0.15)]">
            COMO FUNCIONA
          </div>

          <h2 className="font-sans text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            Da busca ao cliente,{" "}
            <span className="text-[#ff6200] drop-shadow-[0_0_20px_rgba(255,98,0,0.35)]">
              em 4 etapas.
            </span>
          </h2>
        </div>

        {/* 4 ETAPAS SEQUENCIAIS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {etapas.map((etapa, idx) => {
            const Icone = etapa.icone;
            const isLast = idx === etapas.length - 1;

            return (
              <div key={etapa.numero} className="relative flex flex-col">
                {/* Card da Etapa */}
                <div className="relative rounded-2xl border border-white/10 bg-[#070c14]/90 p-6 flex-1 flex flex-col items-start transition-all duration-300 hover:border-[#ff6200]/40 hover:bg-[#070c14]">
                  {/* Topo do Card: Ícone e Número */}
                  <div className="flex items-center justify-between w-full mb-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#ff6200]/10 border border-[#ff6200]/30 text-[#ff6200] shadow-[0_0_15px_rgba(255,98,0,0.15)]">
                      <Icone className="h-6 w-6" />
                    </div>
                    <span className="font-mono text-sm font-bold text-slate-500">
                      {etapa.numero}
                    </span>
                  </div>

                  {/* Título e Textos */}
                  <h3 className="text-base sm:text-lg font-bold text-white mb-2">
                    {etapa.titulo}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-3">
                    {etapa.descricao}
                  </p>
                  <span className="text-[11px] font-semibold text-[#ff7a00] mt-auto">
                    {etapa.destaque}
                  </span>
                </div>

                {/* Seta Conectora entre as Etapas (apenas desktop grande) */}
                {!isLast && (
                  <div className="hidden lg:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 h-7 w-7 items-center justify-center rounded-full bg-[#0a0f18] border border-white/10 text-[#ff6200] shadow-md pointer-events-none">
                    <ArrowRight className="h-3.5 w-3.5" />
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
