import { useState } from "react";
import {
  ExternalLink,
  Eye,
  Instagram,
  MapPin,
  Phone,
  RotateCw,
  Share2,
  Sparkles,
  Star,
  Users,
  X,
} from "lucide-react";
import type { Lead } from "@/lib/leads-api";
import type { SearchHistoryItem } from "./google-maps-history-types";
import { GoogleMapsHistoryMap } from "./GoogleMapsHistoryMap";
import { GoogleMapsCategoryIcon } from "./GoogleMapsCategoryIcon";

interface GoogleMapsHistoryDetailsProps {
  item: SearchHistoryItem;
  leads?: Lead[];
  loadingLeads?: boolean;
  onClose: () => void;
  onVerResultados: (item: SearchHistoryItem) => void;
  onUsarLeads: (item: SearchHistoryItem) => void;
  onNovaBuscaComCriterios: (item: SearchHistoryItem) => void;
  onOpenLista?: (listId: string) => void;
  onOpenLeads?: (leadId?: string) => void;
}

export function GoogleMapsHistoryDetails({
  item,
  leads = [],
  loadingLeads = false,
  onClose,
  onVerResultados,
  onUsarLeads,
  onNovaBuscaComCriterios,
  onOpenLista,
  onOpenLeads,
}: GoogleMapsHistoryDetailsProps) {
  const [activeTab, setActiveTab] = useState<"resumo" | "leads" | "duplicatas" | "configuracao">(
    "resumo",
  );

  // Percentuais calculados com segurança
  const totalEncontrados = item.encontrados || leads.length;
  const pctIneditos = totalEncontrados > 0 ? Math.round((item.ineditos / totalEncontrados) * 100) : 0;
  const pctDuplicatas = totalEncontrados > 0 ? Math.round((item.duplicatas / totalEncontrados) * 100) : 0;

  const totalLeadsConhecidos = leads.length > 0 ? leads.length : item.encontrados;
  const emailsTotal = item.emailsCount || leads.filter((l) => Boolean(l.email)).length;
  const telefonesTotal = item.telefonesCount || leads.filter((l) => Boolean(l.phone || l.whatsapp)).length;
  const instagramTotal = item.instagramCount || leads.filter((l) => Boolean(l.instagram_url)).length;

  const pctEmails = totalLeadsConhecidos > 0 ? Math.round((emailsTotal / totalLeadsConhecidos) * 100) : 0;
  const pctTelefones = totalLeadsConhecidos > 0 ? Math.round((telefonesTotal / totalLeadsConhecidos) * 100) : 0;
  const pctInstagram = totalLeadsConhecidos > 0 ? Math.round((instagramTotal / totalLeadsConhecidos) * 100) : 0;

  // Formatação de data
  const dataFormatada = new Date(item.dataHora).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Badge de Status
  const renderStatusBadge = () => {
    if (item.status === "concluida") {
      return (
        <span className="inline-flex items-center rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
          Concluída
        </span>
      );
    }
    if (item.status === "parcial") {
      return (
        <span className="inline-flex items-center rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400">
          Parcial
        </span>
      );
    }
    if (item.status === "erro") {
      return (
        <span className="inline-flex items-center rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-400">
          Erro
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-md border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-zinc-400">
        {item.statusLabel}
      </span>
    );
  };

  return (
    <aside className="w-full lg:w-[420px] shrink-0 rounded-2xl border border-home-border bg-home-surface/95 p-4 space-y-4 shadow-xl">
      {/* 1. Cabeçalho do Painel: Título, Data, Badge e Fechar */}
      <div className="flex items-start justify-between gap-3 border-b border-home-border/60 pb-3.5">
        <div className="space-y-1 min-w-0">
          <h3 className="text-sm font-bold text-white tracking-tight line-clamp-1">
            {item.nomeLista || `${item.nicho} — ${item.cidade}`}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-home-muted">{dataFormatada}</span>
            {renderStatusBadge()}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar detalhes"
          className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-home-border text-home-muted hover:text-white hover:bg-home-surface-strong transition-colors cursor-pointer"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* 2. Abas do Painel: Resumo | Leads | Duplicatas | Configuração */}
      <div className="flex items-center border-b border-home-border/60 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab("resumo")}
          className={`pb-2.5 px-2 transition-colors cursor-pointer relative ${
            activeTab === "resumo"
              ? "text-home-orange font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-home-orange"
              : "text-home-muted hover:text-white"
          }`}
        >
          Resumo
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("leads")}
          className={`pb-2.5 px-2 transition-colors cursor-pointer relative ${
            activeTab === "leads"
              ? "text-home-orange font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-home-orange"
              : "text-home-muted hover:text-white"
          }`}
        >
          Leads ({leads.length || item.encontrados})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("duplicatas")}
          className={`pb-2.5 px-2 transition-colors cursor-pointer relative ${
            activeTab === "duplicatas"
              ? "text-home-orange font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-home-orange"
              : "text-home-muted hover:text-white"
          }`}
        >
          Duplicatas ({item.duplicatas})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("configuracao")}
          className={`pb-2.5 px-2 transition-colors cursor-pointer relative ${
            activeTab === "configuracao"
              ? "text-home-orange font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-home-orange"
              : "text-home-muted hover:text-white"
          }`}
        >
          Configuração
        </button>
      </div>

      {/* 3. Conteúdo da Aba Ativa */}
      {activeTab === "resumo" && (
        <div className="space-y-4">
          {/* Linha 1 de Indicadores de Resultados: Encontradas | Inéditos | Duplicatas */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-home-border/80 bg-home-surface p-2.5 text-center">
              <span className="block text-base font-extrabold text-white">
                {totalEncontrados}
              </span>
              <span className="block text-[10px] text-home-muted mt-0.5 leading-tight">
                Empresas encontradas
              </span>
            </div>

            <div className="rounded-xl border border-home-border/80 bg-home-surface p-2.5 text-center">
              <span className="block text-base font-extrabold text-emerald-400">
                {item.ineditos}
              </span>
              <span className="block text-[10px] text-emerald-400/80 mt-0.5 leading-tight font-medium">
                Leads inéditos {pctIneditos > 0 && `(${pctIneditos}%)`}
              </span>
            </div>

            <div className="rounded-xl border border-home-border/80 bg-home-surface p-2.5 text-center">
              <span className="block text-base font-extrabold text-amber-400">
                {item.duplicatas}
              </span>
              <span className="block text-[10px] text-amber-400/80 mt-0.5 leading-tight font-medium">
                Duplicatas {pctDuplicatas > 0 && `(${pctDuplicatas}%)`}
              </span>
            </div>
          </div>

          {/* Linha 2 de Canais de Contato: Com e-mails | Com telefone | Com Instagram */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-home-border/80 bg-home-surface p-2.5 text-center">
              <div className="flex items-center justify-center gap-1 text-amber-400">
                <Star className="size-3.5 fill-amber-400 text-amber-400" />
                <span className="text-sm font-extrabold text-white">{emailsTotal}</span>
              </div>
              <span className="block text-[10px] text-home-muted mt-0.5 leading-tight">
                Com e-mails {pctEmails > 0 && `(${pctEmails}%)`}
              </span>
            </div>

            <div className="rounded-xl border border-home-border/80 bg-home-surface p-2.5 text-center">
              <div className="flex items-center justify-center gap-1 text-blue-400">
                <Phone className="size-3.5 text-blue-400" />
                <span className="text-sm font-extrabold text-white">{telefonesTotal}</span>
              </div>
              <span className="block text-[10px] text-home-muted mt-0.5 leading-tight">
                Com telefone {pctTelefones > 0 && `(${pctTelefones}%)`}
              </span>
            </div>

            <div className="rounded-xl border border-home-border/80 bg-home-surface p-2.5 text-center">
              <div className="flex items-center justify-center gap-1 text-fuchsia-400">
                <Instagram className="size-3.5 text-fuchsia-400" />
                <span className="text-sm font-extrabold text-white">{instagramTotal}</span>
              </div>
              <span className="block text-[10px] text-home-muted mt-0.5 leading-tight">
                Com Instagram {pctInstagram > 0 && `(${pctInstagram}%)`}
              </span>
            </div>
          </div>

          {/* Mini-mapa Interativo Leaflet Dark com Raio e Marcadores */}
          <GoogleMapsHistoryMap
            center={item.center}
            raioKm={item.raioKm}
            cidade={item.cidade}
            leads={leads}
          />

          {/* Lista de Informações da Pesquisa */}
          <div className="space-y-2 text-xs divide-y divide-home-border/40">
            <div className="flex items-center justify-between pt-1 text-home-muted">
              <span>Nicho</span>
              <span className="font-semibold text-white text-right">{item.nicho}</span>
            </div>

            <div className="flex items-center justify-between pt-1.5 text-home-muted">
              <span>Categoria</span>
              <span className="font-semibold text-white text-right">{item.categoria}</span>
            </div>

            <div className="flex items-center justify-between pt-1.5 text-home-muted">
              <span>Localização</span>
              <span className="font-semibold text-white text-right">
                {item.cidade} - {item.uf} (raio de {item.raioKm} km)
              </span>
            </div>

            <div className="flex items-center justify-between pt-1.5 text-home-muted">
              <span>Quantidade solicitada</span>
              <span className="font-semibold text-white text-right">{item.solicitado} leads</span>
            </div>

            <div className="flex items-center justify-between pt-1.5 text-home-muted">
              <span>Lista criada</span>
              {item.listId && item.nomeLista ? (
                <button
                  type="button"
                  onClick={() => onOpenLista?.(item.listId!)}
                  className="inline-flex items-center gap-1 font-semibold text-blue-400 hover:text-blue-300 hover:underline cursor-pointer"
                >
                  <span className="line-clamp-1 max-w-[180px]">{item.nomeLista}</span>
                  <ExternalLink className="size-3 shrink-0" />
                </button>
              ) : (
                <span className="text-home-muted/80 italic">Sem lista vinculada</span>
              )}
            </div>

            <div className="flex items-center justify-between pt-1.5 text-home-muted">
              <span>Tempo de coleta</span>
              <span className="font-semibold text-white text-right">
                {item.tempoColeta || "—"}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1.5 text-home-muted">
              <span>Provedor</span>
              <span className="font-semibold text-white text-right">{item.provedor}</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === "leads" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-home-muted">
            <span>{leads.length} leads vinculados</span>
            {item.listId && (
              <button
                type="button"
                onClick={() => onOpenLista?.(item.listId!)}
                className="text-home-orange hover:underline cursor-pointer font-semibold"
              >
                Abrir em Minhas Listas
              </button>
            )}
          </div>

          {loadingLeads ? (
            <div className="py-8 text-center text-xs text-home-muted">Carregando leads...</div>
          ) : leads.length === 0 ? (
            <div className="py-8 text-center text-xs text-home-muted">
              Nenhum lead individual persistido para esta busca.
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {leads.map((lead) => (
                <div
                  key={lead.id}
                  onClick={() => onOpenLeads?.(lead.id)}
                  className="rounded-xl border border-home-border/80 bg-home-surface p-2.5 hover:border-home-orange/40 hover:bg-home-surface-strong transition-all cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white line-clamp-1">
                      {lead.business_name}
                    </span>
                    {lead.score && (
                      <span className="rounded bg-home-orange/20 px-1.5 py-0.5 text-[10px] font-bold text-home-orange">
                        {lead.score}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-home-muted">
                    {lead.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="size-3 text-blue-400" />
                        {lead.phone}
                      </span>
                    )}
                    {lead.email && (
                      <span className="flex items-center gap-1">
                        <Star className="size-3 text-amber-400" />
                        {lead.email}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "duplicatas" && (
        <div className="space-y-3 text-xs text-home-muted">
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-amber-200 space-y-1.5">
            <h4 className="font-bold text-amber-300">Deduplicação de Leads</h4>
            <p className="text-[11px] leading-relaxed">
              O motor de prospecção do Flow Business verifica o histórico permanente da sua
              organização no momento da coleta. Estabelecimentos já capturados em pesquisas
              anteriores não são recarregados e não consomem o saldo de leads do seu plano.
            </p>
          </div>

          <div className="rounded-xl border border-home-border bg-home-surface p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span>Duplicatas descartadas nesta busca</span>
              <span className="font-bold text-white">{item.duplicatas}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Percentual de economia</span>
              <span className="font-bold text-emerald-400">{pctDuplicatas}%</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === "configuracao" && (
        <div className="space-y-2 text-xs divide-y divide-home-border/40">
          <div className="flex items-center justify-between pt-1 text-home-muted">
            <span>Nicho digitado</span>
            <span className="font-semibold text-white">{item.nicho}</span>
          </div>
          <div className="flex items-center justify-between pt-1.5 text-home-muted">
            <span>Categoria identificada</span>
            <span className="font-semibold text-white">{item.categoria}</span>
          </div>
          <div className="flex items-center justify-between pt-1.5 text-home-muted">
            <span>Estado (UF)</span>
            <span className="font-semibold text-white">{item.uf}</span>
          </div>
          <div className="flex items-center justify-between pt-1.5 text-home-muted">
            <span>Cidade</span>
            <span className="font-semibold text-white">{item.cidade}</span>
          </div>
          <div className="flex items-center justify-between pt-1.5 text-home-muted">
            <span>Raio da busca</span>
            <span className="font-semibold text-white">{item.raioKm} km</span>
          </div>
          <div className="flex items-center justify-between pt-1.5 text-home-muted">
            <span>Meta solicitada</span>
            <span className="font-semibold text-white">{item.solicitado} empresas</span>
          </div>
          <div className="flex items-center justify-between pt-1.5 text-home-muted">
            <span>Enriquecimento por e-mail</span>
            <span className="font-semibold text-white">Ativo (visita ao site)</span>
          </div>
          <div className="flex items-center justify-between pt-1.5 text-home-muted">
            <span>Nome da lista</span>
            <span className="font-semibold text-white">{item.nomeLista || "—"}</span>
          </div>
          <div className="flex items-center justify-between pt-1.5 text-home-muted">
            <span>Status da execução</span>
            <span className="font-semibold text-white">{item.statusLabel}</span>
          </div>
        </div>
      )}

      {/* 4. Ações Finais do Painel */}
      <div className="space-y-2.5 pt-2 border-t border-home-border/60">
        {/* Botão Primário: Ver resultados da busca */}
        <button
          type="button"
          onClick={() => onVerResultados(item)}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-home-orange font-bold text-white shadow-[0_0_20px_rgba(255,98,0,0.35)] transition-all hover:bg-home-orange-dark cursor-pointer text-xs active:scale-[0.98]"
        >
          <Eye className="size-4" />
          <span>Ver resultados da busca</span>
        </button>

        {/* Linha com 2 Botões Secundários: Usar estes leads & Nova busca com estes critérios */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onUsarLeads(item)}
            className="flex h-9 items-center justify-center gap-1.5 rounded-xl border border-home-border bg-home-surface/90 px-2 text-[11px] font-semibold text-white hover:bg-home-surface-strong hover:border-home-border-strong transition-all cursor-pointer"
          >
            <Share2 className="size-3.5 text-home-muted" />
            <span className="truncate">Usar estes leads</span>
          </button>

          <button
            type="button"
            onClick={() => onNovaBuscaComCriterios(item)}
            className="flex h-9 items-center justify-center gap-1.5 rounded-xl border border-home-border bg-home-surface/90 px-2 text-[11px] font-semibold text-white hover:bg-home-surface-strong hover:border-home-border-strong transition-all cursor-pointer"
          >
            <RotateCw className="size-3.5 text-home-orange" />
            <span className="truncate">Nova busca com critérios</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
