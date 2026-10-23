import React from "react";
import { X, MapPin, Globe, Compass, ArrowUpRight, BarChart2 } from "lucide-react";
import { REGIOES_LEADS_PADRAO } from "./relatorios-data";

interface MapaRegioesModalProps {
  aberto: boolean;
  onFechar: () => void;
}

export function MapaRegioesModal({ aberto, onFechar }: MapaRegioesModalProps) {
  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-2xl border border-white/10 bg-[#0c1017] p-6 shadow-2xl overflow-hidden">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-orange-500/20 text-[#f97316] border border-orange-500/30">
              <MapPin className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Distribuição Geográfica de Leads</h2>
              <p className="text-xs text-neutral-400">
                Mapeamento regional de concentração de prospecção e oportunidades
              </p>
            </div>
          </div>
          <button
            onClick={onFechar}
            className="rounded-lg p-2 text-neutral-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Visualização de Mapa & Estatísticas */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card Esquerdo: Mapa SVG Representativo do Brasil com polos */}
          <div className="rounded-xl border border-white/5 bg-[#121620] p-4 flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                <Compass className="size-3.5 text-[#f97316]" /> Concentração Territorial
              </span>
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider">Brasil</span>
            </div>

            {/* Simulação Gráfica Vetorial de Mapa de Calor Regional */}
            <div className="relative h-64 flex items-center justify-center">
              <svg viewBox="0 0 400 360" className="w-full h-full max-h-60 opacity-90">
                {/* Contorno simplificado do Brasil */}
                <path
                  d="M120 40 C 180 30, 240 50, 310 90 C 350 120, 360 160, 340 210 C 320 250, 260 300, 210 340 C 170 320, 140 270, 120 220 C 90 180, 80 120, 120 40 Z"
                  fill="#070a10"
                  stroke="#1e2638"
                  strokeWidth="2"
                />

                {/* Hotspot Curitiba - PR */}
                <circle cx="210" cy="270" r="18" fill="#f97316" fillOpacity="0.25" />
                <circle cx="210" cy="270" r="7" fill="#f97316" />
                <text x="225" y="274" fill="#ffffff" fontSize="11" fontWeight="bold">
                  Curitiba (26%)
                </text>

                {/* Hotspot São Paulo - SP */}
                <circle cx="230" cy="245" r="16" fill="#f97316" fillOpacity="0.25" />
                <circle cx="230" cy="245" r="6.5" fill="#f97316" />
                <text x="245" y="249" fill="#ffffff" fontSize="11" fontWeight="bold">
                  São Paulo (23%)
                </text>

                {/* Hotspot Rio de Janeiro - RJ */}
                <circle cx="260" cy="235" r="13" fill="#3b82f6" fillOpacity="0.3" />
                <circle cx="260" cy="235" r="5" fill="#3b82f6" />
                <text x="272" y="238" fill="#93c5fd" fontSize="10">
                  Rio (13%)
                </text>

                {/* Hotspot Belo Horizonte - MG */}
                <circle cx="245" cy="210" r="12" fill="#3b82f6" fillOpacity="0.3" />
                <circle cx="245" cy="210" r="5" fill="#3b82f6" />
                <text x="257" y="213" fill="#93c5fd" fontSize="10">
                  BH (10%)
                </text>

                {/* Hotspot Brasília - DF */}
                <circle cx="210" cy="180" r="11" fill="#10b981" fillOpacity="0.3" />
                <circle cx="210" cy="180" r="4.5" fill="#10b981" />
                <text x="222" y="183" fill="#6ee7b7" fontSize="10">
                  Brasília (9%)
                </text>
              </svg>
            </div>

            <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-2 border-t border-white/5">
              <span>Foco de tração: Região Sul e Sudeste</span>
              <span className="text-orange-400 font-semibold">Total: 4.280 leads</span>
            </div>
          </div>

          {/* Card Direito: Tabela Detalhada com Volumes e Percentuais */}
          <div className="flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-neutral-300 block">
                Detalhamento por Região &amp; Volume
              </span>
              <div className="space-y-2">
                {REGIOES_LEADS_PADRAO.map((reg, idx) => (
                  <div
                    key={reg.localizacao}
                    className="p-2.5 rounded-lg bg-[#121620] border border-white/5 flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-neutral-200">
                        {idx + 1}. {reg.localizacao}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-mono font-bold">
                          {reg.quantidade.toLocaleString("pt-BR")}
                        </span>
                        <span className="text-[11px] text-orange-400 font-medium">
                          ({reg.percentual}%)
                        </span>
                      </div>
                    </div>
                    {/* Barra */}
                    <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-orange-600 to-[#f97316]"
                        style={{ width: `${reg.larguraBarraPercent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-[11px] text-neutral-500">
              * Nesta fase demonstrativa, as regiões refletem o mapeamento estático das campanhas aprovadas.
            </p>
          </div>
        </div>

        {/* Rodapé */}
        <div className="mt-6 flex items-center justify-end pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onFechar}
            className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-xs font-semibold text-white transition-colors"
          >
            Fechar Mapeamento
          </button>
        </div>
      </div>
    </div>
  );
}
