/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { Crosshair, Layers, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { MAP_CONFIG, MAP_LAYERS } from "@/lib/map-config";
import type { Lead } from "@/lib/leads-api";
import "leaflet/dist/leaflet.css";

type LatLng = { lat: number; lng: number };

interface GoogleMapsRunningMapPanelProps {
  pin: LatLng | null;
  raioKm: number;
  cidade: string;
  uf: string;
  leads: Lead[];
  totalEncontrados: number;
  duplicatasCount: number;
}

export function GoogleMapsRunningMapPanel({
  pin,
  raioKm,
  cidade,
  leads,
  totalEncontrados,
  duplicatasCount,
}: GoogleMapsRunningMapPanelProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const refs = useRef<{
    L: any;
    map: any;
    centerMarker: any;
    circle: any;
    tileLayer: any;
    leadMarkers: any[];
  }>({
    L: null,
    map: null,
    centerMarker: null,
    circle: null,
    tileLayer: null,
    leadMarkers: [],
  });

  const [mapStyle, setMapStyle] = useState<"dark" | "streets">("dark");
  const prevCenterKey = useRef<string>("");

  // 1. Inicializa Leaflet com camada sem marca d'água
  useEffect(() => {
    let cancelled = false;
    const mapRefs = refs.current;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !divRef.current || refs.current.map) return;
      refs.current.L = L;

      const centerCoord: [number, number] = pin ? [pin.lat, pin.lng] : MAP_CONFIG.defaultCenter;

      const map = L.map(divRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView(centerCoord, 12);

      // Camada centralizada OpenStreetMap com tema escuro via CSS
      const currentLayer = MAP_LAYERS[mapStyle] || MAP_LAYERS.dark;
      const tileLayer = L.tileLayer(currentLayer.url, {
        maxZoom: currentLayer.maxZoom,
        subdomains: currentLayer.subdomains,
      }).addTo(map);

      refs.current.tileLayer = tileLayer;
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

  // 2. Alterna camadas
  useEffect(() => {
    const { L, map, tileLayer } = refs.current;
    if (!L || !map || !tileLayer) return;

    map.removeLayer(tileLayer);
    const currentLayer = MAP_LAYERS[mapStyle] || MAP_LAYERS.dark;
    refs.current.tileLayer = L.tileLayer(currentLayer.url, {
      maxZoom: currentLayer.maxZoom,
      subdomains: currentLayer.subdomains,
    }).addTo(map);
  }, [mapStyle]);

  // 3. Atualiza Centro da Busca e Círculo de Raio
  useEffect(() => {
    const { L, map } = refs.current;
    if (!L || !map) return;

    if (refs.current.centerMarker) {
      map.removeLayer(refs.current.centerMarker);
      refs.current.centerMarker = null;
    }
    if (refs.current.circle) {
      map.removeLayer(refs.current.circle);
      refs.current.circle = null;
    }

    if (pin) {
      const centerIcon = L.divIcon({
        className: "custom-map-center",
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

      refs.current.centerMarker = L.marker([pin.lat, pin.lng], { icon: centerIcon }).addTo(map);

      refs.current.circle = L.circle([pin.lat, pin.lng], {
        radius: raioKm * 1000,
        color: "#ff6200",
        fillColor: "#ff6200",
        fillOpacity: 0.12,
        weight: 1.5,
      }).addTo(map);

      const key = `${pin.lat.toFixed(4)},${pin.lng.toFixed(4)}`;
      if (key !== prevCenterKey.current) {
        map.fitBounds(refs.current.circle.getBounds(), { padding: [24, 24], maxZoom: 14 });
        prevCenterKey.current = key;
      }
    }
  }, [pin, raioKm, cidade]);

  // 4. Plota marcadores pontuais das empresas encontradas com coordenadas reais
  useEffect(() => {
    const { L, map } = refs.current;
    if (!L || !map) return;

    // Remove marcadores anteriores
    refs.current.leadMarkers.forEach((m) => map.removeLayer(m));
    refs.current.leadMarkers = [];

    // Limita a renderização a 200 marcadores simultâneos para preservar performance
    const leadsComCoords = leads
      .filter((l) => typeof l.latitude === "number" && typeof l.longitude === "number")
      .slice(0, 200);

    leadsComCoords.forEach((lead) => {
      const isGold = (lead.score ?? 0) >= 80;
      const dotColor = isGold ? "#10b981" : "#ff6200";

      const dotIcon = L.divIcon({
        className: "custom-lead-dot",
        html: `
          <div style="width:8px; height:8px; background-color:${dotColor}; border-radius:50%; border:1.5px solid white; box-shadow:0 0 6px rgba(0,0,0,0.5); transform:translate(-50%, -50%);"></div>
        `,
        iconSize: [0, 0],
      });

      const marker = L.marker([lead.latitude!, lead.longitude!], { icon: dotIcon }).addTo(map);

      marker.bindPopup(`
        <div style="font-family:sans-serif; font-size:11px; color:#111;">
          <strong style="display:block; font-size:12px; margin-bottom:2px;">${lead.business_name}</strong>
          <div>${lead.address || "Sem endereço cadastrado"}</div>
          ${lead.phone ? `<div style="color:#059669; font-weight:bold; margin-top:3px;">${lead.phone}</div>` : ""}
          <div style="margin-top:4px; font-size:10px; color:#6b7280;">Score: <strong>${lead.score ?? 0} pts</strong></div>
        </div>
      `);

      refs.current.leadMarkers.push(marker);
    });
  }, [leads]);

  // Ações de Zoom e Centralização
  const handleZoomIn = () => refs.current.map?.zoomIn();
  const handleZoomOut = () => refs.current.map?.zoomOut();
  const handleRecenter = () => {
    if (pin && refs.current.map) {
      refs.current.map.setView([pin.lat, pin.lng], 12);
    }
  };

  return (
    <div className="relative h-88 sm:h-96 w-full overflow-hidden rounded-2xl border border-home-border bg-[#0b1016] shadow-sm">
      {/* Container do Leaflet */}
      <div
        ref={divRef}
        className={cn("h-full w-full", mapStyle === "dark" && MAP_CONFIG.darkTilesClass)}
      />

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

      {/* Legenda do Mapa no Canto Inferior Esquerdo (Idêntica à Referência) */}
      <div className="absolute bottom-3 left-3 z-[400] flex flex-col gap-1 rounded-xl border border-home-border/80 bg-[#101720]/90 px-3 py-2 text-[10px] text-white shadow-lg backdrop-blur-md select-none">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-home-orange" />
          <span className="text-home-muted">Empresas encontradas ({totalEncontrados})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-emerald-400" />
          <span className="text-home-muted">Leads inéditos ({leads.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-amber-400" />
          <span className="text-home-muted">Duplicatas ({duplicatasCount})</span>
        </div>
      </div>

      {/* Atribuição no Canto Inferior Direito */}
      <div className="absolute bottom-2 right-3 z-[400] flex items-center gap-2 text-[9px] text-home-muted/70 select-none">
        <span className="rounded bg-[#101720]/80 px-1.5 py-0.5 border border-home-border/40 font-semibold text-home-orange">
          Raio da busca: {raioKm} km
        </span>
        <span className="hidden sm:inline">{MAP_CONFIG.attribution}</span>
      </div>
    </div>
  );
}
