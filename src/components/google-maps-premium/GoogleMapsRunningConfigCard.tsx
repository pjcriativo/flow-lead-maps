import {
  Edit2,
  Globe,
  Instagram,
  Layers,
  MapPin,
  Phone,
  Radar,
  Sliders,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface GoogleMapsRunningConfigCardProps {
  nicho: string;
  categoria?: string;
  cidade: string;
  uf: string;
  raioKm: number;
  limite: number;
  nomeLista: string;
  buscarEmails: boolean;
  filtrosCaptura: string[];
  running: boolean;
  onEditarConfiguracao: () => void;
}

export function GoogleMapsRunningConfigCard({
  nicho,
  categoria,
  cidade,
  uf,
  raioKm,
  limite,
  nomeLista,
  buscarEmails,
  filtrosCaptura,
  running,
  onEditarConfiguracao,
}: GoogleMapsRunningConfigCardProps) {
  const handleVoltar = () => {
    if (running) {
      const ok = window.confirm(
        "A prospecção está em andamento. Deseja realmente voltar para a tela de configuração?",
      );
      if (!ok) return;
    }
    onEditarConfiguracao();
  };

  return (
    <div className="rounded-2xl border border-home-border bg-home-surface/90 p-4 space-y-3.5 shadow-sm backdrop-blur-md">
      {/* Cabeçalho da Configuração com Botão de Edição */}
      <div className="flex items-center justify-between border-b border-home-border/60 pb-3">
        <div className="flex items-center gap-2">
          <Radar className="size-4 text-home-orange" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            Configuração da busca
          </h3>
        </div>

        <button
          type="button"
          onClick={handleVoltar}
          className="inline-flex items-center gap-1.5 rounded-lg border border-home-border bg-[#101720] px-2.5 py-1 text-[11px] font-semibold text-home-muted hover:border-home-orange hover:text-white transition-colors cursor-pointer"
        >
          <Edit2 className="size-3 text-home-orange" />
          <span>Editar configuração</span>
        </button>
      </div>

      <div className="space-y-3 text-xs">
        {/* 1. Nicho / Especialidade */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 text-home-muted shrink-0">
            <Radar className="size-3.5 text-home-orange shrink-0" />
            <span className="text-[11px] font-medium">Nicho / Especialidade</span>
          </div>
          <div className="flex items-center gap-1.5 text-right flex-wrap justify-end">
            <span className="font-semibold text-white">{nicho || "Geral"}</span>
            {categoria && (
              <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[9px] font-semibold text-blue-400 border border-blue-500/30">
                {categoria}
              </span>
            )}
          </div>
        </div>

        {/* 2. Localização */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 text-home-muted shrink-0">
            <MapPin className="size-3.5 text-home-orange shrink-0" />
            <span className="text-[11px] font-medium">Localização</span>
          </div>
          <div className="text-right">
            <span className="font-semibold text-white block">
              {cidade ? `${cidade} - ${uf || "BR"}` : "Brasil"}
            </span>
            <span className="text-[10px] text-home-muted">raio de {raioKm} km</span>
          </div>
        </div>

        {/* 3. Quantidade solicitada */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-home-muted">
            <Users className="size-3.5 text-home-orange shrink-0" />
            <span className="text-[11px] font-medium">Quantidade solicitada</span>
          </div>
          <span className="font-semibold text-white">{limite} leads</span>
        </div>

        {/* 4. Nome da lista */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 text-home-muted shrink-0">
            <Layers className="size-3.5 text-home-orange shrink-0" />
            <span className="text-[11px] font-medium">Nome da lista</span>
          </div>
          <span className="font-semibold text-white truncate max-w-44 text-right" title={nomeLista}>
            {nomeLista}
          </span>
        </div>

        {/* 5. Fonte de busca */}
        <div className="flex items-center justify-between gap-2 border-t border-home-border/50 pt-2.5">
          <div className="flex items-center gap-2 text-home-muted">
            <Globe className="size-3.5 text-blue-400 shrink-0" />
            <span className="text-[11px] font-medium">Fonte de busca</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-white text-[11px]">Google Maps via Apify</span>
            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
              ATIVA
            </span>
          </div>
        </div>

        {/* 6. Enriquecimento */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-home-muted">
            <span className="text-[11px] font-medium">Enriquecimento</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-white">Buscar e-mails (visita ao site)</span>
            <span
              className={cn(
                "text-[9px] font-bold px-1.5 py-0.5 rounded-full border",
                buscarEmails
                  ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
                  : "bg-home-surface text-home-muted border-home-border",
              )}
            >
              {buscarEmails ? "ATIVADO" : "DESATIVADO"}
            </span>
          </div>
        </div>

        {/* 7. Filtros por captura */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center gap-2 text-home-muted">
            <Sliders className="size-3.5 text-home-orange shrink-0" />
            <span className="text-[11px] font-medium">Filtros por captura</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "telefone", label: "Telefone", icon: Phone },
              { id: "site", label: "Site", icon: Globe },
              { id: "instagram", label: "Instagram", icon: Instagram },
            ].map((f) => {
              const ativo = filtrosCaptura.includes(f.id);
              const Icon = f.icon;

              return (
                <div
                  key={f.id}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium border select-none",
                    ativo
                      ? "bg-gradient-to-r from-[#ff6200] to-[#ff7a29] border-[#ff8c42] text-white font-bold shadow-[0_2px_10px_rgba(255,98,0,0.35)]"
                      : "bg-[#101720] border-home-border text-home-muted/80 opacity-70",
                  )}
                >
                  <Icon className="size-3 shrink-0" />
                  <span>{f.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
