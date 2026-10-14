import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Globe, Loader2, MapPin, Search } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { ESTADOS_BRASIL, listarMunicipiosPorUf, type MunicipioIbge } from "@/lib/ibge";

interface GoogleMapsLocationProps {
  uf: string;
  cidade: string;
  onSelectUf: (uf: string) => void;
  onSelectCidade: (cidade: string) => void;
  buscarEmails: boolean;
  onToggleBuscarEmails: (ativo: boolean) => void;
  disabled?: boolean;
}

export function GoogleMapsLocation({
  uf,
  cidade,
  onSelectUf,
  onSelectCidade,
  buscarEmails,
  onToggleBuscarEmails,
  disabled,
}: GoogleMapsLocationProps) {
  const [municipios, setMunicipios] = useState<MunicipioIbge[]>([]);
  const [loadingMunicipios, setLoadingMunicipios] = useState(false);
  const [cidadeComboAberto, setCidadeComboAberto] = useState(false);
  const [termoBuscaCidade, setTermoBuscaCidade] = useState("");
  const cidadeDropdownRef = useRef<HTMLDivElement>(null);

  // Carrega os municípios oficiais sempre que a UF mudar
  useEffect(() => {
    if (!uf) {
      setMunicipios([]);
      return;
    }

    let cancel = false;
    const ctrl = new AbortController();

    async function carregar() {
      setLoadingMunicipios(true);
      try {
        const lista = await listarMunicipiosPorUf(uf, ctrl.signal);
        if (!cancel) {
          setMunicipios(lista);
        }
      } catch (err) {
        if (!cancel) {
          console.warn(`[GoogleMapsLocation] Falha ao carregar municípios para ${uf}:`, err);
        }
      } finally {
        if (!cancel) {
          setLoadingMunicipios(false);
        }
      }
    }

    void carregar();

    return () => {
      cancel = true;
      ctrl.abort();
    };
  }, [uf]);

  // Fecha o combo de cidade ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (cidadeDropdownRef.current && !cidadeDropdownRef.current.contains(event.target as Node)) {
        setCidadeComboAberto(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtra cidades por nome
  const cidadesFiltradas = useMemo(() => {
    const q = termoBuscaCidade.toLowerCase().trim();
    if (!q) return municipios;
    return municipios.filter((m) => m.nome.toLowerCase().includes(q));
  }, [municipios, termoBuscaCidade]);

  return (
    <div className="relative z-30 grid grid-cols-1 gap-2.5 sm:grid-cols-12 items-center bg-home-surface/90 border border-home-border rounded-2xl p-2.5">
      {/* 1. ESTADO (UF) — Obrigatório aparecer ANTES de Cidade */}
      <div className="sm:col-span-3 space-y-1">
        <label className="text-[10px] font-bold uppercase tracking-wider text-home-muted select-none">
          Estado (UF)
        </label>
        <div className="relative">
          <select
            value={uf}
            disabled={disabled}
            onChange={(e) => {
              const novaUf = e.target.value;
              onSelectUf(novaUf);
              onSelectCidade(""); // Limpa a cidade ao trocar a UF conforme regra estrita
              setTermoBuscaCidade("");
            }}
            className="h-9 w-full appearance-none rounded-xl border border-home-border bg-[#101720] px-3 pr-8 text-xs font-semibold text-white focus:border-home-orange focus:ring-1 focus:ring-home-orange/30 outline-none transition-colors cursor-pointer disabled:opacity-50"
          >
            <option value="">Selecione a UF</option>
            {ESTADOS_BRASIL.map((est) => (
              <option key={est.sigla} value={est.sigla}>
                {est.sigla} — {est.nome}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-home-muted" />
        </div>
      </div>

      {/* 2. CIDADES — Municípios oficiais do IBGE com busca interna */}
      <div ref={cidadeDropdownRef} className="relative z-40 sm:col-span-4 space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold uppercase tracking-wider text-home-muted select-none">
            Cidade
          </label>
          {uf && municipios.length > 0 && (
            <span className="text-[9px] text-home-muted/70">{municipios.length} municípios</span>
          )}
        </div>

        <button
          type="button"
          disabled={!uf || disabled}
          onClick={() => setCidadeComboAberto((prev) => !prev)}
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-xl border border-home-border bg-[#101720] px-3 text-left text-xs font-semibold transition-colors disabled:opacity-50",
            cidade ? "text-white" : "text-home-muted/80",
            cidadeComboAberto && "border-home-orange ring-1 ring-home-orange/30",
          )}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            {loadingMunicipios ? (
              <Loader2 className="size-3.5 animate-spin text-home-orange shrink-0" />
            ) : (
              <MapPin className="size-3.5 text-home-orange shrink-0" />
            )}
            <span className="truncate">
              {cidade || (uf ? "Selecione o município" : "Escolha o estado primeiro")}
            </span>
          </div>
          <ChevronDown className="size-3.5 text-home-muted shrink-0" />
        </button>

        {/* Dropdown com busca de municípios */}
        {cidadeComboAberto && uf && (
          <div className="absolute left-0 right-0 top-full z-[1000] mt-1.5 max-h-60 overflow-hidden rounded-xl border border-home-border bg-[#101720] p-1.5 shadow-2xl backdrop-blur-xl">
            {/* Campo de pesquisa interna de cidades */}
            <div className="relative mb-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3 text-home-muted -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                placeholder="Filtrar cidade..."
                value={termoBuscaCidade}
                onChange={(e) => setTermoBuscaCidade(e.target.value)}
                className="h-7.5 w-full rounded-lg border border-home-border/80 bg-home-surface/80 pl-7 pr-2 text-[11px] text-white placeholder:text-home-muted outline-none focus:border-home-orange"
              />
            </div>

            {/* Lista rolável de municípios */}
            <div className="max-h-48 overflow-y-auto space-y-0.5 scrollbar-thin scrollbar-thumb-home-border">
              {cidadesFiltradas.map((mun) => {
                const isSelected = mun.nome.toLowerCase() === cidade.toLowerCase();
                return (
                  <button
                    key={mun.id}
                    type="button"
                    onClick={() => {
                      onSelectCidade(mun.nome);
                      setCidadeComboAberto(false);
                      setTermoBuscaCidade("");
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors",
                      isSelected
                        ? "bg-home-orange text-white font-semibold"
                        : "text-home-foreground/90 hover:bg-home-surface-strong hover:text-white",
                    )}
                  >
                    <span className="truncate">{mun.nome}</span>
                    {isSelected && <Check className="size-3 text-white" />}
                  </button>
                );
              })}

              {cidadesFiltradas.length === 0 && (
                <div className="py-4 text-center text-xs text-home-muted">
                  Nenhum município encontrado.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. DISPONIBILIDADE DA BUSCA */}
      <div className="sm:col-span-3 space-y-1">
        <label className="text-[10px] font-bold uppercase tracking-wider text-home-muted select-none">
          Fonte de Busca
        </label>
        <div className="flex h-9 items-center justify-between rounded-xl border border-home-border bg-[#101720] px-2.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <Globe className="size-3.5 text-blue-400 shrink-0" />
            <span className="text-xs font-semibold text-white truncate">Base conectada</span>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400 border border-emerald-500/30">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            ATIVA
          </span>
        </div>
      </div>

      {/* 4. ENRIQUECIMENTO: Buscar e-mails (visita ao site) */}
      <div className="sm:col-span-2 flex items-center justify-between sm:justify-end gap-2.5 pt-4 sm:pt-4">
        <label
          htmlFor="switch-emails"
          className="text-[10px] font-semibold text-home-muted hover:text-white transition-colors cursor-pointer select-none leading-tight"
        >
          Buscar e-mails <span className="block text-[9px] text-home-muted/70">(site)</span>
        </label>
        <Switch
          id="switch-emails"
          checked={buscarEmails}
          onCheckedChange={onToggleBuscarEmails}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
