import { Orbit } from "lucide-react";

interface CommonAudiencesCardProps {
  onViewDetails?: () => void;
  commonCount?: string;
  overlapPercent?: string;
}

export function CommonAudiencesCard({
  onViewDetails,
  commonCount = "12.4K",
  overlapPercent = "28%",
}: CommonAudiencesCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      {/* Header do Card */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB]">
            <Orbit className="size-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Audiências em comum</h3>
        </div>

        <button
          type="button"
          onClick={onViewDetails}
          className="rounded-lg border border-slate-200/90 px-2.5 py-1 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
        >
          Ver detalhes
        </button>
      </div>

      {/* Conteúdo com Diagrama de Venn e Métricas */}
      <div className="mt-4 flex items-center gap-4">
        {/* Diagrama de Venn SVG */}
        <div className="relative flex h-14 w-24 shrink-0 items-center justify-center">
          <svg className="h-14 w-24" viewBox="0 0 96 56" fill="none">
            {/* Círculo Rosa (Esquerda) */}
            <circle
              cx="36"
              cy="28"
              r="24"
              fill="#F472B6"
              fillOpacity="0.32"
              stroke="#F472B6"
              strokeWidth="1.5"
            />
            {/* Círculo Roxo (Direita) */}
            <circle
              cx="60"
              cy="28"
              r="24"
              fill="#A78BFA"
              fillOpacity="0.32"
              stroke="#A78BFA"
              strokeWidth="1.5"
            />
            {/* Interseção com máscara ou elipse sutil de destaque */}
            <path
              d="M 48 10 A 24 24 0 0 1 48 46 A 24 24 0 0 1 48 10 Z"
              fill="#C084FC"
              fillOpacity="0.45"
            />
          </svg>
        </div>

        {/* Textos da Audiência */}
        <div className="min-w-0">
          <div className="text-sm font-bold text-slate-900">
            {commonCount} <span className="text-xs font-normal text-slate-500">perfis em comum</span>
          </div>
          <p className="mt-1 text-[11px] leading-tight text-slate-500">
            <span className="font-semibold text-slate-700">{overlapPercent}</span> da audiência do
            concorrente também segue seu perfil.
          </p>
        </div>
      </div>
    </div>
  );
}
