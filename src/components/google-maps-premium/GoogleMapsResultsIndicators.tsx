import { Building2, CheckCircle2, Layers, Mail, Phone, Instagram } from "lucide-react";

export interface GoogleMapsResultsIndicatorsProps {
  totalEncontrados: number;
  leadsIneditos: number;
  duplicatasDescartadas: number;
  comEmail: number;
  comTelefone: number;
  comInstagram: number;
}

export function GoogleMapsResultsIndicators({
  totalEncontrados,
  leadsIneditos,
  duplicatasDescartadas,
  comEmail,
  comTelefone,
  comInstagram,
}: GoogleMapsResultsIndicatorsProps) {
  // Cálculo rigoroso de porcentagens (apenas quando denominador for conhecido e maior que zero)
  const pctIneditos =
    totalEncontrados > 0 ? Math.round((leadsIneditos / totalEncontrados) * 100) : 0;
  const pctDuplicatas =
    totalEncontrados > 0 ? Math.round((duplicatasDescartadas / totalEncontrados) * 100) : 0;
  const pctEmail = leadsIneditos > 0 ? Math.round((comEmail / leadsIneditos) * 100) : 0;
  const pctTelefone = leadsIneditos > 0 ? Math.round((comTelefone / leadsIneditos) * 100) : 0;
  const pctInstagram = leadsIneditos > 0 ? Math.round((comInstagram / leadsIneditos) * 100) : 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* 1. Empresas encontradas */}
      <div className="relative rounded-2xl border border-home-border bg-[#101720]/90 p-3.5 shadow-sm hover:border-home-border/80 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex size-8 items-center justify-center rounded-xl bg-home-orange/15 text-home-orange border border-home-orange/30">
            <Building2 className="size-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <p className="text-[11px] font-medium text-home-muted leading-tight">
            Empresas encontradas
          </p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-xl font-extrabold text-white tracking-tight">
              {totalEncontrados}
            </span>
          </div>
          <span className="text-[10px] text-home-muted">total na pesquisa</span>
        </div>
      </div>

      {/* 2. Leads inéditos */}
      <div className="relative rounded-2xl border border-home-border bg-[#101720]/90 p-3.5 shadow-sm hover:border-home-border/80 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="size-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <p className="text-[11px] font-medium text-home-muted leading-tight">Leads inéditos</p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-xl font-extrabold text-white tracking-tight">
              {leadsIneditos}
            </span>
          </div>
          <span className="text-[10px] font-semibold text-emerald-400">
            {pctIneditos}% do total
          </span>
        </div>
      </div>

      {/* 3. Duplicatas descartadas */}
      <div className="relative rounded-2xl border border-home-border bg-[#101720]/90 p-3.5 shadow-sm hover:border-home-border/80 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex size-8 items-center justify-center rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <Layers className="size-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <p className="text-[11px] font-medium text-home-muted leading-tight">
            Duplicatas descartadas
          </p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-xl font-extrabold text-white tracking-tight">
              {duplicatasDescartadas}
            </span>
          </div>
          <span className="text-[10px] text-home-muted">{pctDuplicatas}% do total</span>
        </div>
      </div>

      {/* 4. Com e-mails encontrados */}
      <div className="relative rounded-2xl border border-home-border bg-[#101720]/90 p-3.5 shadow-sm hover:border-home-border/80 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex size-8 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Mail className="size-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <p className="text-[11px] font-medium text-home-muted leading-tight">
            Com e-mails encontrados
          </p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-xl font-extrabold text-white tracking-tight">{comEmail}</span>
          </div>
          <span className="text-[10px] font-semibold text-amber-400">{pctEmail}% dos inéditos</span>
        </div>
      </div>

      {/* 5. Com telefone */}
      <div className="relative rounded-2xl border border-home-border bg-[#101720]/90 p-3.5 shadow-sm hover:border-home-border/80 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex size-8 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <Phone className="size-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <p className="text-[11px] font-medium text-home-muted leading-tight">Com telefone</p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-xl font-extrabold text-white tracking-tight">{comTelefone}</span>
          </div>
          <span className="text-[10px] font-semibold text-blue-400">
            {pctTelefone}% dos inéditos
          </span>
        </div>
      </div>

      {/* 6. Com Instagram */}
      <div className="relative rounded-2xl border border-home-border bg-[#101720]/90 p-3.5 shadow-sm hover:border-home-border/80 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex size-8 items-center justify-center rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30">
            <Instagram className="size-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <p className="text-[11px] font-medium text-home-muted leading-tight">Com Instagram</p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-xl font-extrabold text-white tracking-tight">{comInstagram}</span>
          </div>
          <span className="text-[10px] font-semibold text-purple-400">
            {pctInstagram}% dos inéditos
          </span>
        </div>
      </div>
    </div>
  );
}
