import { ChevronRight, MapPin } from "lucide-react";

export function GoogleMapsHeader() {
  return (
    <div className="space-y-3">
      {/* Breadcrumb */}
      <nav
        aria-label="Navegação"
        className="flex items-center gap-1.5 text-xs text-home-muted select-none"
      >
        <span className="hover:text-white transition-colors cursor-default">Google Maps</span>
        <ChevronRight className="size-3.5 text-home-muted/60" />
        <span className="font-semibold text-white">Configurar Busca</span>
      </nav>

      {/* Título Principal e Descrição */}
      <div className="flex items-start gap-3.5">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-home-orange text-white shadow-[0_0_20px_rgba(255,98,0,0.35)]">
          <MapPin className="size-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Google Maps</h1>
          <p className="text-xs text-home-muted mt-0.5">
            Encontre empresas locais com telefone, site, redes sociais e muito mais. Pesquise por
            nicho, cidade e região.
          </p>
        </div>
      </div>
    </div>
  );
}
