/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { MAP_CONFIG } from "@/lib/map-config";
import type { Lead } from "@/lib/leads-api";
import "leaflet/dist/leaflet.css";

interface GoogleMapsHistoryMapProps {
  center: { lat: number; lng: number } | null;
  raioKm: number;
  cidade: string;
  leads?: Lead[];
}

export function GoogleMapsHistoryMap({
  center,
  raioKm,
  cidade,
  leads = [],
}: GoogleMapsHistoryMapProps) {
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

  const [mapLoaded, setMapLoaded] = useState(false);

  // Inicialização do Leaflet Dark
  useEffect(() => {
    let cancelled = false;
    const mapRefs = refs.current;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !divRef.current || refs.current.map) return;
      refs.current.L = L;

      const centerCoord: [number, number] = center
        ? [center.lat, center.lng]
        : MAP_CONFIG.defaultCenter;

      const map = L.map(divRef.current, {
        zoomControl: false,
        attributionControl: false,
        dragging: true,
        scrollWheelZoom: false,
      }).setView(centerCoord, 12);

      const tileLayer = L.tileLayer(MAP_CONFIG.tileUrl, {
        maxZoom: MAP_CONFIG.maxZoom,
        subdomains: MAP_CONFIG.subdomains,
        className: MAP_CONFIG.darkTilesClass,
      }).addTo(map);

      refs.current.tileLayer = tileLayer;
      mapRefs.map = map;
      setMapLoaded(true);
      setTimeout(() => map.invalidateSize(), 150);
    })();

    return () => {
      cancelled = true;
      if (mapRefs.map) {
        mapRefs.map.remove();
        mapRefs.map = null;
      }
    };
  }, [center]);

  // Atualizar marcadores, círculo de raio e pin central
  useEffect(() => {
    const { L, map } = refs.current;
    if (!L || !map || !mapLoaded) return;

    // Remover marcadores anteriores
    if (refs.current.centerMarker) {
      map.removeLayer(refs.current.centerMarker);
      refs.current.centerMarker = null;
    }
    if (refs.current.circle) {
      map.removeLayer(refs.current.circle);
      refs.current.circle = null;
    }
    for (const m of refs.current.leadMarkers) {
      map.removeLayer(m);
    }
    refs.current.leadMarkers = [];

    const centerCoord: [number, number] = center
      ? [center.lat, center.lng]
      : MAP_CONFIG.defaultCenter;

    map.setView(centerCoord, 12);

    // Círculo de Raio Azul/Laranja translúcido
    const circle = L.circle(centerCoord, {
      radius: (raioKm || 10) * 1000,
      color: "#ff6200",
      weight: 1.5,
      opacity: 0.8,
      fillColor: "#ff6200",
      fillOpacity: 0.12,
      dashArray: "4, 6",
    }).addTo(map);
    refs.current.circle = circle;

    // Pino Central
    const centerIcon = L.divIcon({
      className: "custom-history-center-pin",
      html: `
        <div style="position:relative;display:flex;align-items:center;justify-content:center;width:28px;height:28px;">
          <div style="position:absolute;width:24px;height:24px;border-radius:50%;background:rgba(255,98,0,0.3);animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
          <div style="position:relative;width:16px;height:16px;border-radius:50%;background:#ff6200;border:2.5px solid #ffffff;box-shadow:0 0 10px rgba(255,98,0,0.6);"></div>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    const centerMarker = L.marker(centerCoord, { icon: centerIcon }).addTo(map);
    refs.current.centerMarker = centerMarker;

    // Marcadores dos leads com coordenadas válidas
    const newMarkers: any[] = [];
    const leadsComGeo = (leads || []).filter(
      (l) => l.latitude != null && l.longitude != null && !isNaN(Number(l.latitude)),
    );

    for (const lead of leadsComGeo.slice(0, 30)) {
      const leadIcon = L.divIcon({
        className: "custom-history-lead-pin",
        html: `
          <div style="width:10px;height:10px;border-radius:50%;background:#ff6200;border:1.5px solid #ffffff;box-shadow:0 0 6px rgba(255,98,0,0.8);"></div>
        `,
        iconSize: [10, 10],
        iconAnchor: [5, 5],
      });

      const lm = L.marker([Number(lead.latitude), Number(lead.longitude)], {
        icon: leadIcon,
      }).addTo(map);

      lm.bindTooltip(lead.business_name || "Lead", {
        direction: "top",
        className: "leaflet-dark-tooltip",
      });

      newMarkers.push(lm);
    }

    refs.current.leadMarkers = newMarkers;
  }, [center, raioKm, leads, mapLoaded]);

  const handleZoomIn = () => refs.current.map?.zoomIn();
  const handleZoomOut = () => refs.current.map?.zoomOut();

  return (
    <div className="relative h-44 w-full overflow-hidden rounded-xl border border-home-border/80 bg-[#121214]">
      <div ref={divRef} className="h-full w-full" />

      {/* Controles de Zoom Flutuantes */}
      <div className="absolute top-2.5 right-2.5 z-400 flex flex-col gap-1">
        <button
          type="button"
          onClick={handleZoomIn}
          aria-label="Aumentar zoom"
          className="flex size-6 items-center justify-center rounded-md border border-home-border bg-home-surface/90 text-home-muted hover:text-white hover:bg-home-surface-strong transition-colors shadow-sm"
        >
          <Plus className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          aria-label="Diminuir zoom"
          className="flex size-6 items-center justify-center rounded-md border border-home-border bg-home-surface/90 text-home-muted hover:text-white hover:bg-home-surface-strong transition-colors shadow-sm"
        >
          <Minus className="size-3.5" />
        </button>
      </div>

      {/* Etiqueta da Cidade */}
      <div className="absolute bottom-2 left-2 z-400 rounded-md border border-home-border/80 bg-home-surface/90 px-2 py-0.5 text-[10px] font-semibold text-white/90 shadow-sm backdrop-blur-xs">
        {cidade || "Área da Busca"}
      </div>
    </div>
  );
}
