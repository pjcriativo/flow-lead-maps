import {
  Bookmark,
  Check,
  Edit2,
  Globe,
  Info,
  Instagram,
  Layers,
  MapPin,
  Phone,
  Play,
  RotateCcw,
  ShieldCheck,
  Sliders,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface GoogleMapsSearchSummaryProps {
  nicho: string;
  categoria?: string;
  cidade: string;
  uf: string;
  raioKm: number;
  limite: number;
  onChangeLimite: (val: number) => void;
  maxLimite: number;
  nomeLista: string;
  onEditarNomeLista?: () => void;
  filtrosCaptura: string[]; // ["telefone", "site", "instagram"]
  onToggleFiltroCaptura: (filtro: string) => void;
  buscarEmails: boolean;
  running: boolean;
  onIniciar: () => void;
  onSalvarConfiguracao?: () => void;
}

export function GoogleMapsSearchSummary({
  nicho,
  categoria,
  cidade,
  uf,
  raioKm,
  limite,
  onChangeLimite,
  maxLimite,
  nomeLista,
  onEditarNomeLista,
  filtrosCaptura,
  onToggleFiltroCaptura,
  buscarEmails,
  running,
  onIniciar,
  onSalvarConfiguracao,
}: GoogleMapsSearchSummaryProps) {
  const prontoParaIniciar = Boolean(nicho.trim()) && Boolean(cidade.trim() || uf.trim());

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-home-border bg-home-surface/90 p-4 space-y-4">
      {/* Cabeçalho do Resumo */}
      <div className="flex items-center gap-2 border-b border-home-border/60 pb-3">
        <Info className="size-4 text-home-orange" />
        <h2 className="text-xs font-bold uppercase tracking-wider text-white">
          Resumo da prospecção
        </h2>
      </div>

      {/* Lista de Especificações */}
      <div className="space-y-3.5 text-xs">
        {/* Nicho Selecionado */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 text-home-muted min-w-0">
            <Sparkles className="size-3.5 text-home-orange shrink-0" />
            <span className="text-[11px] font-medium">Nicho selecionado</span>
          </div>
          <div className="text-right">
            <span className="font-semibold text-white truncate block max-w-44">
              {nicho || "Não definido"}
            </span>
            {categoria && (
              <span className="inline-block mt-0.5 text-[9px] font-medium text-blue-400 bg-blue-500/10 px-1.5 py-0.2 rounded border border-blue-500/20">
                {categoria}
              </span>
            )}
          </div>
        </div>

        {/* Localização */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 text-home-muted">
            <MapPin className="size-3.5 text-home-orange shrink-0" />
            <span className="text-[11px] font-medium">Localização</span>
          </div>
          <div className="text-right">
            <span className="font-semibold text-white block">
              {cidade ? `${cidade} - ${uf || "BR"}` : "Não definida"}
            </span>
            <span className="text-[10px] text-home-muted">Raio de {raioKm} km</span>
          </div>
        </div>

        {/* Quantidade de Leads com Slider Interno */}
        <div className="space-y-1.5 rounded-xl border border-home-border/60 bg-[#101720]/70 p-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-home-muted">
              <Users className="size-3.5 text-home-orange shrink-0" />
              <span className="text-[11px] font-medium">Quantidade de leads</span>
            </div>
            <span className="font-bold text-white text-xs">{limite}</span>
          </div>

          <Slider
            value={[limite]}
            min={10}
            max={Math.min(maxLimite, 500)}
            step={10}
            onValueChange={([val]) => onChangeLimite(val)}
            className="py-1"
          />

          <div className="flex justify-between text-[10px] text-home-muted">
            <span>mín. 10</span>
            <span>máx. {maxLimite} nesta fonte</span>
          </div>
        </div>

        {/* Nome da Lista */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 text-home-muted min-w-0">
            <Layers className="size-3.5 text-home-orange shrink-0" />
            <span className="text-[11px] font-medium">Nome da lista</span>
          </div>
          <div className="flex items-center gap-1.5 max-w-44 text-right">
            <span className="font-semibold text-white text-[11px] truncate" title={nomeLista}>
              {nomeLista || "Sugestão automática"}
            </span>
            {onEditarNomeLista && (
              <button
                type="button"
                onClick={onEditarNomeLista}
                title="Editar nome"
                className="text-home-muted hover:text-white transition-colors"
              >
                <Edit2 className="size-3" />
              </button>
            )}
          </div>
        </div>

        {/* Filtros por Captura */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-home-muted">
            <div className="flex items-center gap-2">
              <Sliders className="size-3.5 text-home-orange shrink-0" />
              <span className="text-[11px] font-medium">Filtros por captura</span>
            </div>
            {filtrosCaptura.length > 0 && (
              <span className="text-[10px] font-semibold text-home-orange">
                {filtrosCaptura.length} selecionado{filtrosCaptura.length > 1 ? "s" : ""}
              </span>
            )}
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
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onToggleFiltroCaptura(f.id)}
                  aria-pressed={ativo}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all duration-200 border cursor-pointer select-none",
                    ativo
                      ? "bg-gradient-to-r from-[#ff6200] to-[#ff7a29] border-[#ff8c42] text-white font-bold shadow-[0_2px_12px_rgba(255,98,0,0.45)] ring-1 ring-white/20 scale-[1.02]"
                      : "bg-[#101720] border-home-border text-home-muted hover:text-white hover:border-home-border/80 hover:bg-[#16202c]",
                  )}
                >
                  <Icon
                    className={cn("size-3 shrink-0", ativo ? "text-white" : "text-home-muted")}
                  />
                  <span>{f.label}</span>
                  {ativo && (
                    <Check className="size-3 stroke-[3] text-white shrink-0 animate-in zoom-in-75 duration-150" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Fonte de Busca */}
        <div className="flex items-center justify-between gap-2 border-t border-home-border/50 pt-2.5">
          <div className="flex items-center gap-2 text-home-muted">
            <Globe className="size-3.5 text-blue-400 shrink-0" />
            <span className="text-[11px] font-medium">Fonte de busca</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-white text-[11px]">Google Maps (Apify)</span>
            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1 py-0.2 rounded border border-emerald-500/20">
              ATIVA
            </span>
          </div>
        </div>

        {/* Busca de E-mails */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-home-muted">
            <span className="text-[11px] font-medium">Busca de e-mails (site)</span>
          </div>
          <span
            className={cn(
              "text-[10px] font-bold px-1.5 py-0.5 rounded",
              buscarEmails
                ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                : "bg-home-surface text-home-muted border border-home-border",
            )}
          >
            {buscarEmails ? "Ativada" : "Desativada"}
          </span>
        </div>

        {/* Política de Deduplicação */}
        <div className="flex items-start gap-2 rounded-xl bg-[#101720]/60 p-2.5 border border-home-border/50 text-[10px] text-home-muted">
          <ShieldCheck className="size-3.5 text-home-orange shrink-0 mt-0.5" />
          <p className="leading-snug">
            <strong>Duplicatas:</strong> Empresas já entregues à sua organização serão
            desconsideradas automaticamente.
          </p>
        </div>
      </div>

      {/* Ações: Iniciar Prospecção + Salvar Configuração */}
      <div className="space-y-2 pt-2">
        <Button
          type="button"
          disabled={!prontoParaIniciar || running}
          onClick={onIniciar}
          className={cn(
            "w-full h-11 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg",
            prontoParaIniciar && !running
              ? "bg-home-orange hover:bg-home-orange-strong text-white shadow-[0_0_20px_rgba(255,98,0,0.35)]"
              : "opacity-60 cursor-not-allowed",
          )}
        >
          {running ? (
            <span className="flex items-center gap-2">
              <RotateCcw className="size-4 animate-spin text-white" />
              Prospectando...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Play className="size-4 fill-white" />
              Iniciar prospecção
            </span>
          )}
        </Button>

        {onSalvarConfiguracao && (
          <Button
            type="button"
            variant="outline"
            onClick={onSalvarConfiguracao}
            className="w-full h-9 text-xs font-semibold rounded-xl border-home-border bg-[#101720] text-home-foreground/90 hover:bg-home-surface-strong hover:text-white transition-colors"
          >
            <Bookmark className="size-3.5 mr-2 text-home-muted" />
            Salvar configuração
          </Button>
        )}
      </div>
    </div>
  );
}
