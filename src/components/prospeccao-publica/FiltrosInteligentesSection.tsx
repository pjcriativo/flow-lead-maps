import { CheckCircle2, Search, RotateCcw, ChevronDown, Check } from "lucide-react";

export function FiltrosInteligentesSection() {
  const bullets = [
    "Nicho e palavras-chave",
    "Tipo de conta",
    "Localização",
    "E-mail e WhatsApp",
    "Seguidores e engajamento",
    "Conta comercial",
  ];

  return (
    <section className="relative py-16 sm:py-24 border-b border-white/[0.06] bg-[#05080e]">
      {/* Luz Difusa Laranja */}
      <div
        className="pointer-events-none absolute top-1/2 right-1/4 -translate-y-1/2 h-[500px] w-full max-w-4xl opacity-20 blur-[130px]"
        style={{
          background: "radial-gradient(circle, #ff6200 0%, transparent 65%)",
        }}
      />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* LADO ESQUERDO: Textos e Bullets */}
          <div className="lg:col-span-5 flex flex-col items-start text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#ff6200]/30 bg-[#ff6200]/10 px-3.5 py-1 text-xs font-bold tracking-wider text-[#ff7a00] uppercase mb-4 shadow-[0_0_12px_rgba(255,98,0,0.15)]">
              FILTROS INTELIGENTES
            </div>

            <h2 className="font-sans text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Resultados mais <br />
              <span className="text-[#ff6200] drop-shadow-[0_0_20px_rgba(255,98,0,0.35)]">
                rápidos e precisos.
              </span>
            </h2>

            <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
              Use filtros avançados para encontrar exatamente o seu público-alvo e gerar listas de leads qualificados.
            </p>

            {/* Grade de 6 Bullets */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              {bullets.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2.5">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#ff6200]/20 text-[#ff6200] shrink-0">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-slate-200">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* LADO DIREITO: Painel de Filtros + Cards de Leads */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-white/10 bg-[#070c14]/90 p-5 sm:p-6 shadow-2xl relative overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* Coluna 1 do Mockup: Formulário de Filtros (7 colunas) */}
                <div className="md:col-span-7 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Filtros de busca
                  </h3>

                  {/* Campo Nicho e Localização */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-300 block mb-1">
                        Nicho
                      </label>
                      <div className="rounded-lg bg-black/50 border border-white/10 px-2.5 py-1.5 text-[11px] text-slate-200 truncate">
                        Ex: Clínica, Restaurante...
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-300 block mb-1">
                        Localização
                      </label>
                      <div className="rounded-lg bg-black/50 border border-white/10 px-2.5 py-1.5 text-[11px] text-slate-200 flex items-center justify-between">
                        <span className="truncate">São Paulo - SP</span>
                        <span className="text-[#ff6200]">📍</span>
                      </div>
                    </div>
                  </div>

                  {/* Campo Seguidores e Tipo de Conta */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-300 block mb-1">
                        Seguidores
                      </label>
                      <div className="rounded-lg bg-black/50 border border-white/10 px-2.5 py-1.5 text-[11px] text-slate-200 flex items-center justify-between">
                        <span>1K - 100K</span>
                        <ChevronDown className="h-3 w-3 text-slate-400" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-300 block mb-1">
                        Tipo de conta
                      </label>
                      <div className="rounded-lg bg-black/50 border border-white/10 px-2.5 py-1.5 text-[11px] text-slate-200 flex items-center justify-between">
                        <span className="truncate">Conta comercial</span>
                        <ChevronDown className="h-3 w-3 text-slate-400" />
                      </div>
                    </div>
                  </div>

                  {/* Campo E-mail e WhatsApp */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-300 block mb-1">
                        E-mail
                      </label>
                      <div className="rounded-lg bg-black/50 border border-white/10 px-2.5 py-1.5 text-[11px] text-slate-200 flex items-center justify-between">
                        <span>Todos</span>
                        <ChevronDown className="h-3 w-3 text-slate-400" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-300 block mb-1">
                        WhatsApp
                      </label>
                      <div className="rounded-lg bg-black/50 border border-white/10 px-2.5 py-1.5 text-[11px] text-slate-200 flex items-center justify-between">
                        <span>Todos</span>
                        <ChevronDown className="h-3 w-3 text-slate-400" />
                      </div>
                    </div>
                  </div>

                  {/* Botões de Ação do Filtro */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-[#ff6200] hover:bg-[#e05600] text-white py-2 px-3 text-xs font-bold shadow-md transition-colors"
                    >
                      <Search className="h-3.5 w-3.5" />
                      <span>Buscar leads →</span>
                    </button>
                    <button
                      type="button"
                      className="flex items-center justify-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 hover:text-white py-2 px-3 text-xs font-semibold transition-colors"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Limpar filtros</span>
                    </button>
                  </div>
                </div>

                {/* Coluna 2 do Mockup: Cards de Leads Sobrepostos (5 colunas) */}
                <div className="md:col-span-5 relative flex justify-center">
                  <div className="relative w-full max-w-[210px]">
                    {/* Card de Fundo 2 */}
                    <div className="absolute top-2 -right-4 w-full h-[210px] rounded-xl bg-[#0d1422] border border-white/5 opacity-40 shadow-md" />

                    {/* Card de Fundo 1 */}
                    <div className="absolute top-1 -right-2 w-full h-[210px] rounded-xl bg-[#0c1320] border border-white/10 opacity-70 shadow-lg" />

                    {/* Card Principal Frontal */}
                    <div className="relative rounded-xl border border-[#ff6200]/40 bg-[#0a101d] p-3.5 shadow-[0_0_20px_rgba(255,98,0,0.2)]">
                      {/* Foto / Retrato do Lead */}
                      <div className="rounded-lg overflow-hidden h-24 w-full bg-gradient-to-tr from-rose-500/20 to-[#ff6200]/20 border border-white/10 relative mb-3">
                        <img
                          src="/images/agentes/agente-vendas.webp"
                          alt="Lead qualificado Clínica Vida"
                          className="w-full h-full object-cover object-top"
                          loading="lazy"
                        />
                        <div className="absolute top-1.5 right-1.5 bg-emerald-500 rounded-full p-0.5 text-white">
                          <Check className="h-2.5 w-2.5" />
                        </div>
                      </div>

                      {/* Informações do Lead */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-white">Clínica Vida</p>
                          <span className="text-[10px] text-emerald-400 font-semibold">Ativo</span>
                        </div>
                        <p className="text-[10px] text-slate-400">@clinicavida</p>

                        <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-[10px]">
                          <div>
                            <span className="font-bold text-white">28.4K</span>
                            <span className="text-slate-400 text-[9px] block">seguidores</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[#ff7a00] font-bold">Comercial</span>
                            <span className="text-slate-400 text-[9px] block">São Paulo - SP</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

