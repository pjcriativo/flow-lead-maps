// Mapa interativo (Leaflet + tiles do OpenStreetMap, grátis e sem chave).
// Clicar marca o pin (centro da busca); o círculo mostra o raio escolhido.
// Leaflet é importado dinamicamente (client-only) — a rota do painel é ssr:false.
import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

type LatLng = { lat: number; lng: number };

// Centro default: Curitiba (só visual; a busca só usa o pin quando marcado).
const CENTRO_PADRAO: [number, number] = [-25.4284, -49.2733];

export function MapaBusca({
  pin,
  raioKm,
  onPick,
}: {
  pin: LatLng | null;
  raioKm: number;
  onPick: (p: LatLng) => void;
}) {
  const divRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const refs = useRef<{ L: any; map: any; marker: any; circle: any }>({ L: null, map: null, marker: null, circle: null });
  const prevPinKey = useRef<string>("");
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  // init (uma vez)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !divRef.current || refs.current.map) return;
      refs.current.L = L;
      const map = L.map(divRef.current).setView(CENTRO_PADRAO, 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);
      map.on("click", (e: { latlng: { lat: number; lng: number } }) =>
        onPickRef.current({ lat: e.latlng.lat, lng: e.latlng.lng }),
      );
      refs.current.map = map;
      setTimeout(() => map.invalidateSize(), 120);
    })();
    return () => {
      cancelled = true;
      if (refs.current.map) {
        refs.current.map.remove();
        refs.current.map = null;
      }
    };
  }, []);

  // atualiza pin + círculo do raio
  useEffect(() => {
    const { L, map } = refs.current;
    if (!L || !map) return;
    if (refs.current.marker) { map.removeLayer(refs.current.marker); refs.current.marker = null; }
    if (refs.current.circle) { map.removeLayer(refs.current.circle); refs.current.circle = null; }
    if (pin) {
      refs.current.marker = L.circleMarker([pin.lat, pin.lng], {
        radius: 7, color: "#1e3a8a", fillColor: "#3b82f6", fillOpacity: 1, weight: 2,
      }).addTo(map);
      refs.current.circle = L.circle([pin.lat, pin.lng], {
        radius: raioKm * 1000, color: "#3b82f6", fillColor: "#3b82f6", fillOpacity: 0.1, weight: 1,
      }).addTo(map);
      // Enquadra a área só quando o PINO muda (cidade nova ou clique), não a cada ajuste de raio.
      const key = `${pin.lat.toFixed(5)},${pin.lng.toFixed(5)}`;
      if (key !== prevPinKey.current) {
        map.fitBounds(refs.current.circle.getBounds(), { padding: [24, 24], maxZoom: 15 });
        prevPinKey.current = key;
      }
    } else {
      prevPinKey.current = "";
    }
  }, [pin, raioKm]);

  return (
    <div className="relative">
      <div ref={divRef} className="h-72 w-full overflow-hidden rounded-lg border border-border" />
      <div className="pointer-events-none absolute left-2 top-2 z-[400] rounded bg-card/90 px-2 py-1 text-xs text-muted-foreground shadow">
        {pin ? "Clique para mover o pin" : "Clique no mapa para marcar o centro da busca"}
      </div>
    </div>
  );
}
