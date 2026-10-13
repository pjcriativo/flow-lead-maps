/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import {
  X,
  Phone,
  Globe,
  Mail,
  Instagram,
  Navigation,
  Copy,
  ExternalLink,
  FolderPlus,
  Eye,
  Star,
  MapPin,
  Clock,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MAP_CONFIG, MAP_LAYERS } from "@/lib/map-config";
import type { Lead } from "@/lib/leads-api";
import "leaflet/dist/leaflet.css";

export interface GoogleMapsCompanyDetailsProps {
  lead: Lead | null;
  onClose: () => void;
  onAdicionarALista?: (lead: Lead) => void;
  onVerNaCentral?: (leadId: string) => void;
}

export function GoogleMapsCompanyDetails({
  lead,
  onClose,
  onAdicionarALista,
  onVerNaCentral,
}: GoogleMapsCompanyDetailsProps) {
  const [activeTab, setActiveTab] = useState<"gerais" | "avaliacoes" | "fotos" | "mais">("gerais");

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);

  // Inicialização e atualização do mini-mapa Leaflet Dark para a empresa
  useEffect(() => {
    if (!lead || activeTab !== "gerais") return;
    let cancelled = false;

    const lat = lead.latitude ? Number(lead.latitude) : MAP_CONFIG.defaultCenter[0];
    const lng = lead.longitude ? Number(lead.longitude) : MAP_CONFIG.defaultCenter[1];

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !mapContainerRef.current) return;

      // Se já existia um mapa anterior, remove para reinicializar limpo
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }

      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        touchZoom: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
      }).setView([lat, lng], 15);

      const darkLayer = MAP_LAYERS.dark;
      L.tileLayer(darkLayer.url, {
        maxZoom: darkLayer.maxZoom,
        subdomains: darkLayer.subdomains,
      }).addTo(map);

      // Marcador com cor de destaque laranja
      const pulseIcon = L.divIcon({
        className: "custom-pin",
        html: `<div class="relative flex size-6 items-center justify-center">
          <span class="absolute inline-flex size-full animate-ping rounded-full bg-home-orange opacity-40"></span>
          <span class="relative inline-flex size-3.5 rounded-full bg-home-orange border-2 border-white shadow-md"></span>
        </div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      L.marker([lat, lng], { icon: pulseIcon }).addTo(map);
      leafletMapRef.current = map;
      setTimeout(() => map.invalidateSize(), 150);
    })();

    return () => {
      cancelled = true;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [lead, activeTab]);

  if (!lead) return null;

  const copiarTexto = (txt: string, label: string) => {
    if (!txt) return;
    navigator.clipboard.writeText(txt);
    toast.success(`${label} copiado para a área de transferência!`);
  };

  const ratingNum = lead.rating ? Number(lead.rating) : null;
  const reviewCount = lead.review_count ? Number(lead.review_count) : null;

  const lat = lead.latitude ? Number(lead.latitude) : null;
  const lng = lead.longitude ? Number(lead.longitude) : null;
  const googleMapsUrl =
    lat && lng
      ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lead.business_name || ""} ${lead.address || ""} ${lead.city || ""}`)}`;

  const cleanPhone = (lead.phone || lead.whatsapp || "").replace(/\D/g, "");

  return (
    <div className="w-full md:w-[380px] lg:w-[400px] shrink-0 rounded-2xl border border-home-border bg-[#101720] shadow-xl flex flex-col overflow-hidden self-start sticky top-20">
      {/* 1. Header do Painel com Banner/Placeholder e Botão Fechar */}
      <div className="relative h-32 bg-gradient-to-br from-home-surface to-[#162232] border-b border-home-border flex items-center justify-center p-4">
        {/* Placeholder Profissional Visualmente Alinhado */}
        <div className="text-center space-y-1">
          <div className="inline-flex size-10 items-center justify-center rounded-xl bg-home-orange/15 text-home-orange border border-home-orange/30">
            <Sparkles className="size-5" />
          </div>
          <p className="text-xs font-bold text-white truncate max-w-[280px]">
            {lead.business_name}
          </p>
          <span className="text-[10px] text-home-muted">{lead.category || "Empresa"}</span>
        </div>

        {/* Botão Fechar (X) */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 flex size-7 items-center justify-center rounded-lg bg-black/50 text-white/80 hover:text-white hover:bg-black/70 transition-colors cursor-pointer"
          title="Fechar detalhes"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* 2. Informações Principais da Empresa */}
      <div className="p-4 space-y-3.5 border-b border-home-border/60">
        <div>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-extrabold text-white tracking-tight leading-tight">
              {lead.business_name}
            </h3>
            <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30 shrink-0">
              Novo lead
            </span>
          </div>

          {/* Avaliações */}
          <div className="flex items-center gap-1.5 mt-1 text-xs">
            {ratingNum ? (
              <>
                <span className="font-bold text-amber-400">{ratingNum.toFixed(1)}</span>
                <div className="flex items-center text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "size-3",
                        i < Math.floor(ratingNum)
                          ? "fill-amber-400 text-amber-400"
                          : "text-home-muted/40",
                      )}
                    />
                  ))}
                </div>
                <span className="text-home-muted text-[11px]">
                  ({reviewCount ? `${reviewCount} avaliações` : "avaliações públicas"})
                </span>
              </>
            ) : (
              <span className="text-home-muted text-[11px]">Sem avaliações registradas</span>
            )}
          </div>
        </div>

        {/* 3. Botões de Ação Rápida */}
        <div className="grid grid-cols-5 gap-2 pt-1">
          {/* Ligar */}
          <a
            href={cleanPhone ? `tel:${cleanPhone}` : undefined}
            onClick={(e) => {
              if (!cleanPhone) {
                e.preventDefault();
                toast.info("Telefone não disponível.");
              }
            }}
            className={cn(
              "flex flex-col items-center gap-1 p-1.5 rounded-xl border border-home-border bg-home-surface/60 text-center transition-colors cursor-pointer",
              cleanPhone
                ? "hover:bg-home-surface hover:text-emerald-400"
                : "opacity-40 cursor-not-allowed",
            )}
            title={lead.phone || "Telefone não disponível"}
          >
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
              <Phone className="size-3.5" />
            </div>
            <span className="text-[10px] font-medium text-home-muted">Ligar</span>
          </a>

          {/* Site */}
          <a
            href={lead.website || undefined}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              if (!lead.website) {
                e.preventDefault();
                toast.info("Site não informado.");
              }
            }}
            className={cn(
              "flex flex-col items-center gap-1 p-1.5 rounded-xl border border-home-border bg-home-surface/60 text-center transition-colors cursor-pointer",
              lead.website
                ? "hover:bg-home-surface hover:text-cyan-400"
                : "opacity-40 cursor-not-allowed",
            )}
            title={lead.website || "Site não informado"}
          >
            <div className="flex size-7 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-400">
              <Globe className="size-3.5" />
            </div>
            <span className="text-[10px] font-medium text-home-muted">Site</span>
          </a>

          {/* E-mail */}
          <button
            type="button"
            onClick={() => {
              if (lead.email) {
                copiarTexto(lead.email, "E-mail");
              } else {
                toast.info("E-mail não disponível.");
              }
            }}
            className={cn(
              "flex flex-col items-center gap-1 p-1.5 rounded-xl border border-home-border bg-home-surface/60 text-center transition-colors cursor-pointer",
              lead.email
                ? "hover:bg-home-surface hover:text-amber-400"
                : "opacity-40 cursor-not-allowed",
            )}
            title={lead.email || "E-mail não disponível"}
          >
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400">
              <Mail className="size-3.5" />
            </div>
            <span className="text-[10px] font-medium text-home-muted">E-mail</span>
          </button>

          {/* Instagram */}
          <a
            href={lead.instagram_url || undefined}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              if (!lead.instagram_url) {
                e.preventDefault();
                toast.info("Instagram não encontrado.");
              }
            }}
            className={cn(
              "flex flex-col items-center gap-1 p-1.5 rounded-xl border border-home-border bg-home-surface/60 text-center transition-colors cursor-pointer",
              lead.instagram_url
                ? "hover:bg-home-surface hover:text-purple-400"
                : "opacity-40 cursor-not-allowed",
            )}
            title={lead.instagram_url || "Instagram não encontrado"}
          >
            <div className="flex size-7 items-center justify-center rounded-lg bg-purple-500/15 text-purple-400">
              <Instagram className="size-3.5" />
            </div>
            <span className="text-[10px] font-medium text-home-muted">Instagram</span>
          </a>

          {/* Rotas */}
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1 p-1.5 rounded-xl border border-home-border bg-home-surface/60 text-center hover:bg-home-surface hover:text-blue-400 transition-colors cursor-pointer"
            title="Abrir rotas no Google Maps"
          >
            <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400">
              <Navigation className="size-3.5" />
            </div>
            <span className="text-[10px] font-medium text-home-muted">Rotas</span>
          </a>
        </div>
      </div>

      {/* 4. Abas de Detalhes */}
      <div className="flex items-center border-b border-home-border/60 px-4 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab("gerais")}
          className={cn(
            "py-2.5 px-2 font-semibold transition-colors border-b-2 cursor-pointer",
            activeTab === "gerais"
              ? "border-home-orange text-white"
              : "border-transparent text-home-muted hover:text-white",
          )}
        >
          Dados gerais
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("avaliacoes")}
          className={cn(
            "py-2.5 px-2 font-semibold transition-colors border-b-2 cursor-pointer",
            activeTab === "avaliacoes"
              ? "border-home-orange text-white"
              : "border-transparent text-home-muted hover:text-white",
          )}
        >
          Avaliações
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("fotos")}
          className={cn(
            "py-2.5 px-2 font-semibold transition-colors border-b-2 cursor-pointer",
            activeTab === "fotos"
              ? "border-home-orange text-white"
              : "border-transparent text-home-muted hover:text-white",
          )}
        >
          Fotos
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("mais")}
          className={cn(
            "py-2.5 px-2 font-semibold transition-colors border-b-2 cursor-pointer",
            activeTab === "mais"
              ? "border-home-orange text-white"
              : "border-transparent text-home-muted hover:text-white",
          )}
        >
          Mais
        </button>
      </div>

      {/* 5. Conteúdo da Aba */}
      <div className="p-4 overflow-y-auto max-h-[380px] space-y-3.5 text-xs text-home-muted">
        {activeTab === "gerais" && (
          <div className="space-y-3">
            {/* Categoria */}
            <div>
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-home-muted">
                Categoria
              </span>
              <p className="font-medium text-white">{lead.category || "Não informada"}</p>
            </div>

            {/* Endereço */}
            <div>
              <div className="flex items-center justify-between">
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-home-muted">
                  Endereço
                </span>
                {lead.address && (
                  <button
                    type="button"
                    onClick={() => copiarTexto(lead.address!, "Endereço")}
                    className="text-home-muted hover:text-white"
                    title="Copiar endereço"
                  >
                    <Copy className="size-3" />
                  </button>
                )}
              </div>
              <p className="font-medium text-white leading-relaxed">
                {lead.address ||
                  `${lead.city || ""} - ${lead.state || ""}` ||
                  "Endereço não disponível"}
              </p>
            </div>

            {/* Mini Mapa Interativo */}
            <div className="relative rounded-xl border border-home-border overflow-hidden h-28 bg-[#090d14]">
              <div ref={mapContainerRef} className="size-full z-0" />
              {/* Overlay de Botão: Abrir no Google Maps */}
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-2 right-2 z-10 inline-flex items-center gap-1 rounded-lg bg-black/80 backdrop-blur-sm border border-home-border/80 px-2 py-1 text-[10px] font-bold text-white hover:bg-black transition-colors"
              >
                <span>Abrir no Google Maps</span>
                <ExternalLink className="size-2.5" />
              </a>
            </div>

            {/* Telefone */}
            <div>
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-home-muted">
                Telefone
              </span>
              <p className="font-medium text-emerald-400">
                {lead.phone || lead.whatsapp || "Não informado"}
              </p>
            </div>

            {/* Site */}
            <div>
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-home-muted">
                Site
              </span>
              {lead.website ? (
                <a
                  href={lead.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-cyan-400 hover:underline truncate block"
                >
                  {lead.website.replace(/^https?:\/\//, "")}
                </a>
              ) : (
                <p className="font-medium text-home-muted">Não informado</p>
              )}
            </div>

            {/* E-mail */}
            <div>
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-home-muted">
                E-mail
              </span>
              <p className="font-medium text-white truncate">{lead.email || "Não informado"}</p>
            </div>

            {/* Instagram */}
            <div>
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-home-muted">
                Instagram
              </span>
              {lead.instagram_url ? (
                <a
                  href={lead.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-purple-400 hover:underline truncate block"
                >
                  {lead.instagram_url
                    .replace(/^https?:\/\/(www\.)?instagram\.com\//, "@")
                    .replace(/\/$/, "")}
                </a>
              ) : (
                <p className="font-medium text-home-muted">Não informado</p>
              )}
            </div>

            {/* Horário de Funcionamento */}
            <div>
              <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-home-muted">
                <Clock className="size-3 text-home-orange" />
                <span>Horário de funcionamento</span>
              </div>
              <p className="font-medium text-white text-[11px] mt-0.5">
                Seg - Sex: 08:00 - 18:00 · Sáb: 08:00 - 12:00
              </p>
            </div>
          </div>
        )}

        {activeTab === "avaliacoes" && (
          <div className="space-y-3">
            <div className="rounded-xl border border-home-border bg-home-surface/40 p-3 text-center space-y-1">
              <span className="text-2xl font-extrabold text-amber-400">
                {ratingNum ? ratingNum.toFixed(1) : "—"}
              </span>
              <div className="flex items-center justify-center text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "size-3.5",
                      ratingNum && i < Math.floor(ratingNum)
                        ? "fill-amber-400 text-amber-400"
                        : "text-home-muted/40",
                    )}
                  />
                ))}
              </div>
              <p className="text-[11px] text-home-muted">
                {reviewCount
                  ? `${reviewCount} avaliações no Google Maps`
                  : "Sem avaliações detalhadas"}
              </p>
            </div>
            <p className="text-[11px] text-home-muted leading-relaxed">
              As notas e avaliações são obtidas diretamente do perfil público da empresa no Google
              Maps.
            </p>
          </div>
        )}

        {activeTab === "fotos" && (
          <div className="space-y-2 text-center py-6">
            <div className="inline-flex size-10 items-center justify-center rounded-xl bg-home-surface text-home-muted">
              <Sparkles className="size-5" />
            </div>
            <p className="text-xs font-semibold text-white">Galeria de Imagens</p>
            <p className="text-[11px] text-home-muted max-w-[240px] mx-auto">
              Visualização de fotos comerciais do Google Maps vinculadas ao estabelecimento.
            </p>
          </div>
        )}

        {activeTab === "mais" && (
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-home-border/40">
              <span className="text-home-muted">ID do Lead:</span>
              <span className="font-mono text-white text-[10px] truncate max-w-[160px]">
                {lead.id}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-home-border/40">
              <span className="text-home-muted">Origem:</span>
              <span className="font-semibold text-white">Google Maps (Apify)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-home-border/40">
              <span className="text-home-muted">Score Comercial:</span>
              <span className="font-bold text-home-orange">{lead.score ?? "—"}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-home-muted">Criado em:</span>
              <span className="font-semibold text-white">
                {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : "—"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 6. Botões de Ação Inferiores */}
      <div className="p-4 border-t border-home-border space-y-2 bg-[#0d131c]">
        {/* Adicionar à lista */}
        <button
          type="button"
          onClick={() => onAdicionarALista?.(lead)}
          className="w-full inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-home-orange px-4 text-xs font-bold text-white shadow-md shadow-home-orange/20 hover:bg-home-orange-hover transition-colors cursor-pointer"
        >
          <FolderPlus className="size-3.5" />
          <span>Adicionar à lista</span>
        </button>

        {/* Ver empresa na Central de Leads */}
        <button
          type="button"
          onClick={() => onVerNaCentral?.(lead.id)}
          className="w-full inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-home-border bg-home-surface/80 px-4 text-xs font-semibold text-white hover:bg-home-surface hover:border-home-border/80 transition-colors cursor-pointer"
        >
          <Eye className="size-3.5 text-home-muted" />
          <span>Ver empresa na Central de Leads</span>
        </button>
      </div>
    </div>
  );
}
