import {
  Compass,
  Edit3,
  MapPin,
  Calendar,
  Folder,
  Target,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

export interface GoogleMapsResultsInfoProps {
  nicho: string;
  categoria?: string;
  cidade: string;
  uf: string;
  raioKm: number;
  dataBusca: string;
  nomeLista: string;
  limite: number;
  leadsIneditos: number;
  totalEncontrados: number;
  isParcial?: boolean;
  onEditarPesquisa: () => void;
}

export function GoogleMapsResultsInfo({
  nicho,
  categoria,
  cidade,
  uf,
  raioKm,
  dataBusca,
  nomeLista,
  limite,
  leadsIneditos,
  totalEncontrados,
  isParcial,
  onEditarPesquisa,
}: GoogleMapsResultsInfoProps) {
  return (
    <div className="rounded-2xl border border-home-border bg-[#101720]/90 p-4 shadow-sm flex flex-col justify-between space-y-3.5">
      {/* Topo do Card com Botão Editar Pesquisa */}
      <div className="flex items-center justify-between border-b border-home-border/60 pb-3">
        <div className="flex items-center gap-2">
          <Compass className="size-4 text-home-orange" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-white">
            Informações da pesquisa
          </h2>
        </div>
        <button
          type="button"
          onClick={onEditarPesquisa}
          className="inline-flex items-center gap-1.5 rounded-lg border border-home-border/80 bg-home-surface/60 px-2.5 py-1 text-[11px] font-semibold text-home-muted hover:text-white hover:border-home-border hover:bg-home-surface transition-colors cursor-pointer"
        >
          <Edit3 className="size-3 text-home-orange" />
          <span>Editar pesquisa</span>
        </button>
      </div>

      {/* Lista de Atributos da Busca */}
      <div className="space-y-2.5 text-xs">
        {/* Nicho + Categoria */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-home-muted shrink-0">
            <Target className="size-3.5 text-home-orange/80" />
            <span>Nicho</span>
          </div>
          <div className="flex items-center gap-2 min-w-0 justify-end">
            <span className="font-semibold text-white truncate">{nicho}</span>
            {categoria && (
              <span className="rounded-md bg-cyan-500/15 px-2 py-0.5 text-[10px] font-semibold text-cyan-400 border border-cyan-500/30 shrink-0">
                {categoria}
              </span>
            )}
          </div>
        </div>

        {/* Localização e Raio */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-home-muted shrink-0">
            <MapPin className="size-3.5 text-home-orange/80" />
            <span>Localização</span>
          </div>
          <span className="font-semibold text-white text-right truncate">
            {cidade} - {uf} {raioKm > 0 ? `(raio de ${raioKm} km)` : ""}
          </span>
        </div>

        {/* Data da busca */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-home-muted shrink-0">
            <Calendar className="size-3.5 text-home-orange/80" />
            <span>Data da busca</span>
          </div>
          <span className="font-semibold text-white text-right">{dataBusca}</span>
        </div>

        {/* Nome da lista */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-home-muted shrink-0">
            <Folder className="size-3.5 text-home-orange/80" />
            <span>Nome da lista</span>
          </div>
          <span className="font-semibold text-white text-right truncate max-w-[180px]">
            {nomeLista}
          </span>
        </div>

        {/* Quantidade solicitada */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-home-muted shrink-0">
            <Target className="size-3.5 text-home-orange/80" />
            <span>Quantidade solicitada</span>
          </div>
          <span className="font-semibold text-white text-right">{limite} leads</span>
        </div>

        {/* Leads entregues */}
        <div className="flex items-center justify-between gap-2 border-t border-home-border/40 pt-2">
          <div className="flex items-center gap-1.5 text-home-muted shrink-0">
            <CheckCircle2 className="size-3.5 text-emerald-400" />
            <span>Leads entregues</span>
          </div>
          <span className="font-semibold text-emerald-400 text-right">
            {leadsIneditos} inéditos{" "}
            <span className="text-home-muted font-normal">({totalEncontrados} encontrados)</span>
          </span>
        </div>
      </div>

      {/* Alerta de execução parcial se houver */}
      {isParcial && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 flex items-center gap-2 text-[11px] text-amber-300">
          <AlertTriangle className="size-4 shrink-0 text-amber-400" />
          <span>Busca encerrada com entrega parcial. Leads obtidos foram preservados.</span>
        </div>
      )}
    </div>
  );
}
