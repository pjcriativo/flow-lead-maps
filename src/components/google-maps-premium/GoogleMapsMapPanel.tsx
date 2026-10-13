import { useEffect, useRef, useState } from "react";
import { Crosshair, Layers, MapPin, Minus, Plus, Radar, Search } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import "leaflet/dist/leaflet.css";

type LatLng = { lat: number; lng: number };

// Coordenada padrão (Curitiba / PR)
const CENTRO_PADRAO: [number, number] = [-25.4284, -49.2733];

interface GoogleMapsMapPanelProps {
  pin: LatLng | null;
  raioKm: number;
  cidade: string;
  uf: string;
  onChangeRaio: (raio: number) => void;
  onPickPin: (p: LatLng) => void;
  onSearchEndereco?: (endereco: string) => Promise<void>;
}

export function GoogleMapsMapPanel({
  pin,
  raioKm,
  cidade,
  uf,
  onChangeRaio,
  onPickPin,
  onSearchEndereco,
}: GoogleMapsMapPanelProps) {
  const divRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const refs = useRef<{ L: any; map: any; marker: any; circle: any; tileLayer: any }>({
    L: null,
    map: null,
    marker: null,
    circle: null,
    tileLayer: null,
  });

  const [enderecoInput, setEnderecoInput] = useState("");
  const [mapStyle, setMapStyle] = useState<"dark" | "streets">("dark");
  const onPickRef = useRef(onPickPin);
  onPickRef.current = onPickPin;
  const prevPinKey = useRef<string>("");

  // Inicializa Leaflet com tema Dark
  useEffect(() => {
    let cancelled = false;
    const mapRefs = refs.current;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !divRef.current || refs.current.map) return;
      refs.current.L = L;

      const map = L.map(divRef.current, {
        zoomControl: false, // controles customizados no design
        attributionControl: false,
      }).setView(pin ? [pin.lat, pin.lng] : CENTRO_PADRAO, 12);

      // CartoDB Dark Matter tiles (estilo premium escuro idêntico à referência)
      const tileUrl =
        mapStyle === "dark"
          ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

      const tileLayer = L.tileLayer(tileUrl, {
        maxZoom: 19,
        subdomains: "abcd",
      }).addTo(map);

      refs.current.tileLayer = tileLayer;

      map.on("click", (e: { latlng: { lat: number; lng: number } }) => {
        onPickRef.current({ lat: e.latlng.lat, lng: e.latlng.lng });
      });

      mapRefs.map = map;
      setTimeout(() => map.invalidateSize(), 150);
    })();

    return () => {
      cancelled = true;
      if (mapRefs.map) {
        mapRefs.map.remove();
        mapRefs.map = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Alterna o estilo das camadas
  useEffect(() => {
    const { L, map, tileLayer } = refs.current;
    if (!L || !map || !tileLayer) return;

    map.removeLayer(tileLayer);
    const tileUrl =
      mapStyle === "dark"
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

    refs.current.tileLayer = L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: "abcd",
    }).addTo(map);
  }, [mapStyle]);

  // Atualiza Marcador e Círculo de Raio (Laranja Premium)
  useEffect(() => {
    const { L, map } = refs.current;
    if (!L || !map) return;

    if (refs.current.marker) {
      map.removeLayer(refs.current.marker);
      refs.current.marker = null;
    }
    if (refs.current.circle) {
      map.removeLayer(refs.current.circle);
      refs.current.circle = null;
    }

    if (pin) {
      // Marcador com ícone de pin no centro
      const pinIcon = L.divIcon({
        className: "custom-map-pin",
        html: `
          <div style="display:flex; flex-direction:column; align-items:center; transform: translate(-50%, -100%);">
            <div style="background:#ff6200; color:white; padding:3px 8px; border-radius:12px; font-size:11px; font-weight:bold; box-shadow:0 2px 8px rgba(0,0,0,0.6); white-space:nowrap; border:1px solid rgba(255,255,255,0.3);">
              ${cidade || "Centro"}
            </div>
            <div style="width:0; height:0; border-left:6px solid transparent; border-right:6px solid transparent; border-top:8px solid #ff6200;"></div>
          </div>
        `,
        iconSize: [0, 0],
      });

      refs.current.marker = L.marker([pin.lat, pin.lng], { icon: pinIcon }).addTo(map);

      // Círculo Laranja indicando o raio de busca
      refs.current.circle = L.circle([pin.lat, pin.lng], {
        radius: raioKm * 1000,
        color: "#ff6200",
        fillColor: "#ff6200",
        fillOpacity: 0.14,
        weight: 1.5,
      }).addTo(map);

      const key = `${pin.lat.toFixed(4)},${pin.lng.toFixed(4)}`;
      if (key !== prevPinKey.current) {
        map.fitBounds(refs.current.circle.getBounds(), { padding: [28, 28], maxZoom: 15 });
        prevPinKey.current = key;
      }
    } else {
      prevPinKey.current = "";
    }
  }, [pin, raioKm, cidade]);

  // Ações de Zoom e Centralização
  const handleZoomIn = () => refs.current.map?.zoomIn();
  const handleZoomOut = () => refs.current.map?.zoomOut();
  const handleRecenter = () => {
    if (pin && refs.current.map) {
      refs.current.map.setView([pin.lat, pin.lng], 12);
    }
  };

  const handleSubmeterEndereco = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enderecoInput.trim() || !onSearchEndereco) return;
    await onSearchEndereco(enderecoInput.trim());
  };

  return (
    <div className="space-y-3">
      {/* Box do Mapa com Overlays */}
      <div className="relative h-88 sm:h-96 w-full overflow-hidden rounded-2xl border border-home-border bg-[#0b1016]">
        {/* Container do Leaflet */}
        <div ref={divRef} className="h-full w-full" />

        {/* Barra de Pesquisa de Endereço Overlay no Topo */}
        <form
          onSubmit={handleSubmeterEndereco}
          className="absolute left-14 right-14 top-3 z-[400] max-w-sm mx-auto"
        >
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-home-muted" />
            <input
              type="text"
              value={enderecoInput}
              onChange={(e) => setEnderecoInput(e.target.value)}
              placeholder="Digite um endereço para centralizar o mapa..."
              className="h-8.5 w-full rounded-xl border border-home-border/80 bg-[#101720]/90 pl-8.5 pr-3 text-[11px] text-white shadow-lg backdrop-blur-md placeholder:text-home-muted/80 focus:border-home-orange focus:ring-1 focus:ring-home-orange/30 outline-none"
            />
          </div>
        </form>

        {/* Controles de Zoom e Centralização no Canto Superior Esquerdo */}
        <div className="absolute left-3 top-3 z-[400] flex flex-col gap-1.5">
          <div className="flex flex-col rounded-xl border border-home-border/80 bg-[#101720]/90 overflow-hidden shadow-lg backdrop-blur-md">
            <button
              type="button"
              onClick={handleZoomIn}
              aria-label="Aumentar zoom"
              className="flex size-7.5 items-center justify-center text-home-muted hover:bg-home-surface-strong hover:text-white transition-colors"
            >
              <Plus className="size-4" />
            </button>
            <div className="h-px bg-home-border/60" />
            <button
              type="button"
              onClick={handleZoomOut}
              aria-label="Diminuir zoom"
              className="flex size-7.5 items-center justify-center text-home-muted hover:bg-home-surface-strong hover:text-white transition-colors"
            >
              <Minus className="size-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleRecenter}
            aria-label="Recentralizar no pino"
            className="flex size-7.5 items-center justify-center rounded-xl border border-home-border/80 bg-[#101720]/90 text-home-muted hover:bg-home-surface-strong hover:text-white shadow-lg backdrop-blur-md transition-colors"
          >
            <Crosshair className="size-4" />
          </button>
        </div>

        {/* Alternador de Camada no Canto Superior Direito */}
        <div className="absolute right-3 top-3 z-[400]">
          <button
            type="button"
            onClick={() => setMapStyle((s) => (s === "dark" ? "streets" : "dark"))}
            title={mapStyle === "dark" ? "Trocar para visual claro" : "Trocar para visual escuro"}
            className="flex size-7.5 items-center justify-center rounded-xl border border-home-border/80 bg-[#101720]/90 text-home-muted hover:bg-home-surface-strong hover:text-white shadow-lg backdrop-blur-md transition-colors"
          >
            <Layers className="size-4" />
          </button>
        </div>

        {/* Legenda do Mapa no Canto Inferior Esquerdo */}
        <div className="absolute bottom-3 left-3 z-[400] flex flex-col gap-1 rounded-xl border border-home-border/80 bg-[#101720]/90 px-3 py-2 text-[10px] text-white shadow-lg backdrop-blur-md select-none">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-home-orange" />
            <span className="text-home-muted">Centro da busca</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full border border-home-orange" />
            <span className="text-home-muted">Raio da busca ({raioKm} km)</span>
          </div>
        </div>

        {/* Atribuição no Canto Inferior Direito */}
        <div className="absolute bottom-1 right-2 z-[400] text-[9px] text-home-muted/60 select-none">
          Leaflet | © OpenStreetMap contributors
        </div>
      </div>

      {/* Controle de Raio da Busca */}
      <div className="rounded-2xl border border-home-border bg-home-surface/80 p-3.5 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-home-muted select-none">
            Raio da Busca
          </span>
          <span className="font-bold text-home-orange text-xs">{raioKm} km</span>
        </div>

        <Slider
          value={[raioKm]}
          min={1}
          max={50}
          step={1}
          onValueChange={([val]) => onChangeRaio(val)}
          className="py-1"
        />

        {/* Info Nota: Cidade, UF e Raio */}
        <div className="flex items-center gap-2 pt-1 text-[11px] text-home-muted">
          <Radar className="size-3.5 text-home-orange shrink-0 animate-pulse" />
          <span>
            Buscando em:{" "}
            <strong className="text-white">
              {cidade || "—"}
              {uf ? ` - ${uf}` : ""}
            </strong>{" "}
            · raio de <strong className="text-home-orange">{raioKm} km</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
