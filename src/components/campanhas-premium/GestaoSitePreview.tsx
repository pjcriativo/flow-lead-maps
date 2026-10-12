import { useState } from "react";
import {
  ExternalLink,
  Eye,
  Monitor,
  Pencil,
  Smartphone,
  Sparkles,
  Tablet,
  Utensils,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { GestaoLeadItem } from "./gestao-producao-data";

interface GestaoSitePreviewProps {
  lead: GestaoLeadItem;
  onEditSite?: () => void;
  onOpenSite?: () => void;
  className?: string;
}

export function GestaoSitePreview({
  lead,
  onEditSite,
  onOpenSite,
  className,
}: GestaoSitePreviewProps) {
  const [activeTab, setActiveTab] = useState<"site" | "proposta" | "analise" | "historico">("site");
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");

  const handleOpenExternal = () => {
    if (lead.siteUrl) {
      window.open(lead.siteUrl, "_blank");
    } else {
      toast.info("A URL pública oficial será gerada quando a proposta for aprovada (Publish-on-Approve).");
    }
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-home-border bg-home-surface/80 p-4 shadow-[0_4px_20px_rgba(0,0,0,0.15)] sm:p-5 space-y-3.5",
        className,
      )}
    >
      {/* Abas Superiores do Painel Direito: Site gerado | Proposta comercial | Análise da IA | Histórico */}
      <div className="flex items-center justify-between border-b border-home-border/60 pb-3">
        <div className="flex items-center gap-4 sm:gap-6">
          <button
            type="button"
            onClick={() => setActiveTab("site")}
            className={cn(
              "relative pb-2 text-xs font-semibold transition-colors cursor-pointer",
              activeTab === "site"
                ? "text-white after:absolute after:bottom-[-13px] after:left-0 after:right-0 after:h-0.5 after:bg-home-orange"
                : "text-home-muted hover:text-white",
            )}
          >
            Site gerado
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("proposta")}
            className={cn(
              "relative pb-2 text-xs font-semibold transition-colors cursor-pointer",
              activeTab === "proposta"
                ? "text-white after:absolute after:bottom-[-13px] after:left-0 after:right-0 after:h-0.5 after:bg-home-orange"
                : "text-home-muted hover:text-white",
            )}
          >
            Proposta comercial
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("analise")}
            className={cn(
              "relative pb-2 text-xs font-semibold transition-colors cursor-pointer",
              activeTab === "analise"
                ? "text-white after:absolute after:bottom-[-13px] after:left-0 after:right-0 after:h-0.5 after:bg-home-orange"
                : "text-home-muted hover:text-white",
            )}
          >
            Análise da IA
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("historico")}
            className={cn(
              "relative pb-2 text-xs font-semibold transition-colors cursor-pointer",
              activeTab === "historico"
                ? "text-white after:absolute after:bottom-[-13px] after:left-0 after:right-0 after:h-0.5 after:bg-home-orange"
                : "text-home-muted hover:text-white",
            )}
          >
            Histórico
          </button>
        </div>

        {/* Botão Abrir site no canto superior direito */}
        <button
          type="button"
          onClick={handleOpenExternal}
          className="flex items-center gap-1.5 rounded-lg border border-home-border bg-home-surface px-2.5 py-1 text-xs font-medium text-home-foreground hover:bg-home-surface-strong hover:text-white transition-colors"
        >
          <ExternalLink className="size-3.5 text-home-muted" />
          Abrir site
        </button>
      </div>

      {activeTab === "site" && (
        <>
          {/* Container da Prévia Visual do Site */}
          <div
            className={cn(
              "relative mx-auto overflow-hidden rounded-xl border border-home-border bg-[#0d0f14] shadow-inner transition-all duration-300",
              device === "desktop" && "w-full min-h-[300px]",
              device === "tablet" && "max-w-[480px] min-h-[300px]",
              device === "mobile" && "max-w-[320px] min-h-[300px]",
            )}
          >
            {lead.htmlGerado ? (
              <iframe
                title={`Prévia do site ${lead.name}`}
                srcDoc={lead.htmlGerado}
                sandbox="allow-same-origin"
                className="w-full h-[320px] border-0 bg-white"
              />
            ) : (
              <>
                {/* Barra de Navegação Simulada do Site */}
                <div className="flex items-center justify-between border-b border-white/10 bg-black/60 px-4 py-2.5 backdrop-blur-md">
                  <div className="flex items-center gap-2">
                    <div className="flex size-6 items-center justify-center rounded-md bg-amber-500/20 text-amber-400">
                      <Utensils className="size-3.5" />
                    </div>
            <span className="text-xs font-bold text-white tracking-wide">
              {lead.name}
            </span>
          </div>

          {device === "desktop" && (
            <div className="hidden sm:flex items-center gap-3 text-[10px] text-zinc-300">
              <span className="text-amber-400 font-semibold cursor-pointer">Início</span>
              <span className="hover:text-white cursor-pointer">Sobre</span>
              <span className="hover:text-white cursor-pointer">Cardápio</span>
              <span className="hover:text-white cursor-pointer">Galeria</span>
              <span className="hover:text-white cursor-pointer">Contato</span>
            </div>
          )}

          <button
            type="button"
            className="rounded-lg bg-home-orange px-2.5 py-1 text-[10px] font-bold text-white shadow-sm"
          >
            Reservar Mesa
          </button>
        </div>

        {/* Hero Section do Redesign com Imagem de Restaurante */}
        <div className="relative flex flex-col justify-center px-6 py-10 sm:py-12 bg-gradient-to-r from-black/90 via-black/70 to-black/50">
          {/* Background Image de Restaurante Sofisticado */}
          <div
            className="absolute inset-0 -z-10 bg-cover bg-center opacity-40 mix-blend-luminosity"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1000&auto=format&fit=crop&q=80')",
            }}
          />

          <div className="max-w-md space-y-2.5">
            <span className="inline-block rounded-md bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-amber-300">
              ALTA GASTRONOMIA
            </span>

            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
              Sabores que Contam Histórias
            </h3>

            <p className="text-[11px] sm:text-xs text-zinc-300 leading-relaxed max-w-sm">
              Uma experiência gastronômica única no coração de {lead.city || "São Paulo"}. Cozinha contemporânea com ingredientes selecionados.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1.5">
              <button
                type="button"
                className="rounded-lg bg-home-orange px-3 py-1.5 text-xs font-bold text-white shadow-md hover:bg-home-orange/90 transition-colors"
              >
                Conheça nosso cardápio
              </button>
              <button
                type="button"
                className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10 transition-colors"
              >
                Fazer reserva
              </button>
            </div>
          </div>
        </div>
              </>
            )}
          </div>

          {/* Barra de Controles da Prévia: Alternância de Dispositivos + Editar Site */}
          <div className="flex items-center justify-between border-t border-home-border/60 pt-2.5">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setDevice("desktop")}
                className={cn(
                  "flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                  device === "desktop"
                    ? "border-amber-500/40 bg-amber-500/10 text-white"
                    : "border-transparent text-home-muted hover:text-white",
                )}
              >
                <Monitor className="size-3.5" />
                Desktop
              </button>

              <button
                type="button"
                onClick={() => setDevice("tablet")}
                className={cn(
                  "flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                  device === "tablet"
                    ? "border-amber-500/40 bg-amber-500/10 text-white"
                    : "border-transparent text-home-muted hover:text-white",
                )}
              >
                <Tablet className="size-3.5" />
                Tablet
              </button>

              <button
                type="button"
                onClick={() => setDevice("mobile")}
                className={cn(
                  "flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                  device === "mobile"
                    ? "border-amber-500/40 bg-amber-500/10 text-white"
                    : "border-transparent text-home-muted hover:text-white",
                )}
              >
                <Smartphone className="size-3.5" />
                Mobile
              </button>
            </div>

            <button
              type="button"
              onClick={onEditSite}
              className="flex items-center gap-1.5 rounded-xl border border-home-border bg-home-surface px-3 py-1.5 text-xs font-semibold text-home-foreground transition-all hover:bg-home-surface-strong hover:text-white"
            >
              <Pencil className="size-3.5 text-home-muted" />
              Editar site
            </button>
          </div>
        </>
      )}

      {activeTab === "proposta" && (
        <div className="rounded-xl border border-home-border bg-home-background/60 p-4 space-y-3 min-h-[300px]">
          <div className="flex items-center justify-between border-b border-home-border/60 pb-2.5">
            <span className="text-xs font-semibold text-white">Resumo da Proposta</span>
            <span className="text-[11px] text-home-muted">Canal: E-mail / WhatsApp</span>
          </div>
          <div className="space-y-2 text-xs">
            <div>
              <span className="text-home-muted">Assunto: </span>
              <span className="text-white font-medium">{lead.propostaAssunto || "Sem assunto definido"}</span>
            </div>
            <div>
              <span className="text-home-muted">Status do Rascunho: </span>
              <span className="text-amber-400 font-medium capitalize">{lead.status}</span>
            </div>
            <div className="pt-2">
              <span className="text-home-muted block mb-1">Prévia do Texto:</span>
              <p className="rounded-lg bg-home-surface p-3 text-[11px] text-zinc-300 whitespace-pre-wrap border border-home-border/60">
                {lead.propostaCorpo || "Nenhum corpo gerado ainda para esta proposta."}
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "analise" && (
        <div className="rounded-xl border border-home-border bg-home-background/60 p-4 space-y-3 min-h-[300px]">
          <div className="flex items-center justify-between border-b border-home-border/60 pb-2.5">
            <span className="text-xs font-semibold text-white">Diagnóstico Comercial da IA</span>
            <span className="text-[10px] rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-amber-400 font-medium">
              Lead Qualificado
            </span>
          </div>
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-home-surface p-2.5 border border-home-border/60">
                <div className="text-[10px] text-home-muted">Avaliação Google</div>
                <div className="text-sm font-bold text-white">4.8 ★ (184 avaliações)</div>
              </div>
              <div className="rounded-lg bg-home-surface p-2.5 border border-home-border/60">
                <div className="text-[10px] text-home-muted">Site Atual</div>
                <div className="text-sm font-bold text-amber-400">Desatualizado / Lento</div>
              </div>
            </div>
            <div className="rounded-lg bg-home-surface p-3 border border-home-border/60 space-y-1.5">
              <span className="text-xs font-semibold text-white block">Oportunidade Comercial:</span>
              <p className="text-[11px] text-home-muted leading-relaxed">
                O {lead.name} possui excelente reputação gastronômica, mas sua presença web atual perde conversões de reservas para concorrentes diretos no Google Maps. A proposta foca em cardápio mobile rápido e botão de reserva direta.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "historico" && (
        <div className="rounded-xl border border-home-border bg-home-background/60 p-4 space-y-3 min-h-[300px]">
          <div className="flex items-center justify-between border-b border-home-border/60 pb-2.5">
            <span className="text-xs font-semibold text-white">Linha do Tempo do Lead</span>
            <span className="text-[11px] text-home-muted">{lead.city} - {lead.uf}</span>
          </div>
          <div className="space-y-3 text-xs pt-1">
            <div className="flex items-start gap-2.5">
              <span className="size-2 rounded-full bg-emerald-400 mt-1.5" />
              <div>
                <div className="font-semibold text-white">Lead vinculado à campanha</div>
                <div className="text-[10px] text-home-muted">Registrado no banco de dados</div>
              </div>
            </div>
            {lead.hasSite && (
              <div className="flex items-start gap-2.5">
                <span className="size-2 rounded-full bg-amber-400 mt-1.5" />
                <div>
                  <div className="font-semibold text-white">Site redesign preparado</div>
                  <div className="text-[10px] text-home-muted">IA gerou estrutura de alta conversão</div>
                </div>
              </div>
            )}
            {lead.hasProposal && (
              <div className="flex items-start gap-2.5">
                <span className="size-2 rounded-full bg-blue-400 mt-1.5" />
                <div>
                  <div className="font-semibold text-white">Rascunho de abordagem criado</div>
                  <div className="text-[10px] text-home-muted">Aguardando aprovação e publicação</div>
                </div>
              </div>
            )}
            {lead.status === "aprovado" && (
              <div className="flex items-start gap-2.5">
                <span className="size-2 rounded-full bg-emerald-400 mt-1.5" />
                <div>
                  <div className="font-semibold text-white">Proposta aprovada (Publish-on-Approve)</div>
                  <div className="text-[10px] text-home-muted">URL pública ativada no Storage</div>
                </div>
              </div>
            )}
            {lead.status === "enviado" && (
              <div className="flex items-start gap-2.5">
                <span className="size-2 rounded-full bg-cyan-400 mt-1.5" />
                <div>
                  <div className="font-semibold text-white">Abordagem comercial enviada</div>
                  <div className="text-[10px] text-home-muted">Mensagem disparada com sucesso</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
