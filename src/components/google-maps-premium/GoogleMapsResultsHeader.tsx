import { useState } from "react";
import { Eye, MapPin, Plus, RotateCcw, FolderPlus } from "lucide-react";

export interface GoogleMapsResultsHeaderProps {
  nicho: string;
  cidade: string;
  uf: string;
  raioKm: number;
  limite: number;
  nomeLista: string;
  dataBusca: string;
  selectedCount: number;
  onNovaBusca: () => void;
  onAdicionarSelecionados: () => void;
  onEditarPesquisa: () => void;
}

export function GoogleMapsResultsHeader({
  nicho,
  cidade,
  uf,
  raioKm,
  limite,
  nomeLista,
  dataBusca,
  selectedCount,
  onNovaBusca,
  onAdicionarSelecionados,
}: GoogleMapsResultsHeaderProps) {
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Lado Esquerdo: Breadcrumb, Ícone e Títulos */}
        <div className="space-y-1">
          {/* Breadcrumb Oficial - Tornado interativo */}
          <div className="flex items-center gap-1.5 text-xs text-home-muted font-medium">
            <span
              onClick={onNovaBusca}
              className="cursor-pointer hover:text-home-orange transition-colors"
            >
              Google Maps
            </span>
            <span className="text-home-muted/50">›</span>
            <span className="text-white font-semibold">Resultados da Busca</span>
          </div>

          {/* Título e Subtítulo com Ícone em Destaque */}
          <div className="flex items-center gap-3 pt-0.5">
            <div className="flex size-10 items-center justify-center rounded-xl bg-home-orange/15 text-home-orange shrink-0 border border-home-orange/30 shadow-md shadow-home-orange/20">
              <MapPin className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-white tracking-tight">
                  Resultados da Busca
                </h1>
              </div>
              <p className="text-xs text-home-muted">
                Analise, filtre e organize os leads encontrados. Selecione empresas, adicione à sua
                lista e inicie suas campanhas.
              </p>
            </div>
          </div>
        </div>

        {/* Lado Direito: Ações Principais do Topo */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Botão 1: Voltar à prospecção */}
          <button
            type="button"
            onClick={onEditarPesquisa}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-home-border bg-[#101720] px-3.5 text-xs font-semibold text-white hover:border-home-border/80 hover:bg-home-surface transition-colors cursor-pointer"
          >
            <span className="text-xs font-medium">←</span>
            <span>Voltar à prospecção</span>
          </button>

          {/* Botão 2: Ver detalhes da pesquisa */}
          <button
            type="button"
            onClick={() => setModalDetalhesAberto(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-home-border bg-[#101720] px-3.5 text-xs font-semibold text-white hover:border-home-border/80 hover:bg-home-surface transition-colors cursor-pointer"
          >
            <Eye className="size-3.5 text-home-muted" />
            <span>Ver detalhes da pesquisa</span>
          </button>

          {/* Botão 3: Nova busca */}
          <button
            type="button"
            onClick={onNovaBusca}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-home-border bg-[#101720] px-3.5 text-xs font-semibold text-white hover:border-home-border/80 hover:bg-home-surface transition-colors cursor-pointer"
          >
            <RotateCcw className="size-3.5 text-home-muted" />
            <span>Nova busca</span>
          </button>

          {/* Botão 3: Adicionar selecionados à lista */}
          <button
            type="button"
            onClick={onAdicionarSelecionados}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-home-orange px-4 text-xs font-bold text-white shadow-md shadow-home-orange/20 hover:bg-home-orange-hover transition-colors cursor-pointer"
          >
            <FolderPlus className="size-3.5" />
            <span>
              Adicionar selecionados à lista
              {selectedCount > 0 ? ` (${selectedCount})` : ""}
            </span>
          </button>
        </div>
      </div>

      {/* Modal: Detalhes da Pesquisa Real */}
      {modalDetalhesAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-home-border bg-[#101720] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-home-border/60 pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-home-orange" />
                <h3 className="text-sm font-bold text-white">Parâmetros da Pesquisa</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalDetalhesAberto(false)}
                className="text-home-muted hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-home-border/40">
                <span className="text-home-muted">Nicho Informado:</span>
                <span className="font-semibold text-white">{nicho}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-home-border/40">
                <span className="text-home-muted">Localização:</span>
                <span className="font-semibold text-white">
                  {cidade} - {uf} ({raioKm} km)
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-home-border/40">
                <span className="text-home-muted">Data da Busca:</span>
                <span className="font-semibold text-white">{dataBusca}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-home-border/40">
                <span className="text-home-muted">Nome da Lista:</span>
                <span className="font-semibold text-white truncate max-w-[200px]">{nomeLista}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-home-muted">Quantidade Solicitada:</span>
                <span className="font-semibold text-white">{limite} leads</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setModalDetalhesAberto(false)}
              className="w-full rounded-xl bg-home-orange py-2 text-xs font-bold text-white hover:bg-home-orange-hover transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
