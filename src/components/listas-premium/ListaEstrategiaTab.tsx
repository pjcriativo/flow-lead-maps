// Aba Estratégia da Lista Selecionada — Reprodução fiel da referência visual aprovada
import { useState } from "react";
import {
  Tag,
  Users,
  Target,
  Mail,
  MessageCircle,
  Instagram,
  Linkedin,
  Copy,
  Check,
  Plus,
  ArrowRight,
  Table as TableIcon,
  MoreVertical,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Lead } from "@/lib/leads-api";
import {
  deriveIllustrativeStrategy,
  type CampanhaComCanal,
  type LeadListWithFullStats,
} from "./listas-premium-data";

interface ListaEstrategiaTabProps {
  lista: LeadListWithFullStats;
  leads: Lead[];
  linkedCampaigns: CampanhaComCanal[];
  onCreateCampaign: () => void;
  onViewAllLeads: () => void;
}

export function ListaEstrategiaTab({
  lista,
  leads,
  linkedCampaigns,
  onCreateCampaign,
  onViewAllLeads,
}: ListaEstrategiaTabProps) {
  const strategy = deriveIllustrativeStrategy(lista.niche, lista.city, lista.uf);
  const [selectedChannel, setSelectedChannel] = useState<"whatsapp" | "email" | "instagram">(
    "whatsapp",
  );
  const [copied, setCopied] = useState(false);

  // Canais ativos
  const [activeChannels, setActiveChannels] = useState({
    email: true,
    whatsapp: true,
    instagram: true,
    linkedin: false,
  });

  const toggleChannel = (key: keyof typeof activeChannels) => {
    setActiveChannels((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getMessageContent = () => {
    if (selectedChannel === "whatsapp") return strategy.rascunho_mensagens.whatsapp;
    if (selectedChannel === "email") {
      return `Assunto: ${strategy.rascunho_mensagens.email.assunto}\n\n${strategy.rascunho_mensagens.email.corpo}`;
    }
    return strategy.rascunho_mensagens.instagram;
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(getMessageContent());
    setCopied(true);
    toast.success("Rascunho de mensagem copiado para a área de transferência.");
    setTimeout(() => setCopied(false), 2000);
  };

  // Os 5 primeiros leads para o preview inferior
  const previewLeads = leads.slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-2xl border border-blue-500/25 bg-blue-500/10 p-4 text-xs text-blue-100">
        <Info className="mt-0.5 size-4 shrink-0 text-blue-300" />
        <p>
          <strong>Modelo ilustrativo não persistido.</strong> Oferta, público, abordagem, canais,
          sequência e mensagens abaixo são um rascunho local de referência. Alterações nesta aba não
          são salvas e nenhuma IA paga é acionada.
        </p>
      </div>
      {/* 🟢 LINHA 1: Três Cards Principais de Estratégia */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {/* Card 1: Oferta principal */}
        <div className="rounded-2xl border border-home-border bg-home-surface/90 p-4 backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-500">
            <Tag className="size-3.5 stroke-[2.5]" />
            <span>Exemplo ilustrativo — Oferta principal</span>
          </div>
          <h4 className="mt-2 text-sm font-bold text-white line-clamp-1">
            {strategy.oferta_principal.titulo}
          </h4>
          <p className="mt-1 text-xs text-home-muted leading-relaxed line-clamp-3">
            {strategy.oferta_principal.descricao}
          </p>
        </div>

        {/* Card 2: Público e contexto */}
        <div className="rounded-2xl border border-home-border bg-home-surface/90 p-4 backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-500">
            <Users className="size-3.5 stroke-[2.5]" />
            <span>Exemplo ilustrativo — Público e contexto</span>
          </div>
          <h4 className="mt-2 text-sm font-bold text-white line-clamp-1">
            {strategy.publico_contexto.titulo}
          </h4>
          <p className="mt-1 text-xs text-home-muted leading-relaxed line-clamp-3">
            {strategy.publico_contexto.descricao}
          </p>
        </div>

        {/* Card 3: Abordagem */}
        <div className="rounded-2xl border border-home-border bg-home-surface/90 p-4 backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-500">
            <Target className="size-3.5 stroke-[2.5]" />
            <span>Abordagem ilustrativa</span>
          </div>
          <ul className="mt-2 space-y-1 text-xs text-home-muted">
            {strategy.abordagem.map((item, idx) => (
              <li key={idx} className="flex items-center gap-1.5 line-clamp-1">
                <span className="size-1 rounded-full bg-amber-500/80 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 🟢 LINHA 2: Três Colunas (Canais & Sequência | Rascunho | Campanhas & Resultados) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Coluna 1 (Canais sugeridos + Sequência de abordagem) — 4 cols */}
        <div className="space-y-4 lg:col-span-4 flex flex-col justify-between">
          {/* Bloco Canais Sugeridos */}
          <div className="rounded-2xl border border-home-border bg-home-surface/90 p-4 backdrop-blur-md">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="text-amber-500">⚡</span> Canais sugeridos (rascunho local)
            </h4>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {/* E-mail */}
              <button
                type="button"
                onClick={() => toggleChannel("email")}
                className={cn(
                  "flex items-center justify-between gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all",
                  activeChannels.email
                    ? "border-amber-500/40 bg-amber-500/10 text-white"
                    : "border-home-border bg-home-surface-strong text-home-muted hover:text-white",
                )}
              >
                <span className="flex items-center gap-1.5">
                  <Mail className="size-3.5 text-blue-400" /> E-mail
                </span>
                <input
                  type="checkbox"
                  checked={activeChannels.email}
                  readOnly
                  className="size-3.5 accent-amber-500 rounded"
                />
              </button>

              {/* WhatsApp */}
              <button
                type="button"
                onClick={() => toggleChannel("whatsapp")}
                className={cn(
                  "flex items-center justify-between gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all",
                  activeChannels.whatsapp
                    ? "border-amber-500/40 bg-amber-500/10 text-white"
                    : "border-home-border bg-home-surface-strong text-home-muted hover:text-white",
                )}
              >
                <span className="flex items-center gap-1.5">
                  <MessageCircle className="size-3.5 text-emerald-400" /> WhatsApp
                </span>
                <input
                  type="checkbox"
                  checked={activeChannels.whatsapp}
                  readOnly
                  className="size-3.5 accent-amber-500 rounded"
                />
              </button>

              {/* Instagram */}
              <button
                type="button"
                onClick={() => toggleChannel("instagram")}
                className={cn(
                  "flex items-center justify-between gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all",
                  activeChannels.instagram
                    ? "border-amber-500/40 bg-amber-500/10 text-white"
                    : "border-home-border bg-home-surface-strong text-home-muted hover:text-white",
                )}
              >
                <span className="flex items-center gap-1.5">
                  <Instagram className="size-3.5 text-pink-400" /> Instagram
                </span>
                <input
                  type="checkbox"
                  checked={activeChannels.instagram}
                  readOnly
                  className="size-3.5 accent-amber-500 rounded"
                />
              </button>

              {/* LinkedIn */}
              <button
                type="button"
                onClick={() => toggleChannel("linkedin")}
                className={cn(
                  "flex items-center justify-between gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all",
                  activeChannels.linkedin
                    ? "border-amber-500/40 bg-amber-500/10 text-white"
                    : "border-home-border bg-home-surface-strong text-home-muted hover:text-white",
                )}
              >
                <span className="flex items-center gap-1.5">
                  <Linkedin className="size-3.5 text-sky-400" /> LinkedIn
                </span>
                <input
                  type="checkbox"
                  checked={activeChannels.linkedin}
                  readOnly
                  className="size-3.5 accent-amber-500 rounded"
                />
              </button>
            </div>
          </div>

          {/* Bloco Sequência de Abordagem */}
          <div className="rounded-2xl border border-home-border bg-home-surface/90 p-4 backdrop-blur-md">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="text-amber-500">🧭</span> Sequência de abordagem (ilustrativa)
            </h4>
            <div className="mt-3 space-y-3">
              {strategy.sequencia.map((step) => (
                <div key={step.ordem} className="flex items-start gap-3">
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[11px] font-bold text-black shadow-sm mt-0.5">
                    {step.ordem}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white">{step.etapa}</p>
                    <p className="text-[11px] text-home-muted leading-tight">{step.objetivo}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Coluna 2 (Rascunho de mensagem) — 4 cols */}
        <div className="lg:col-span-4">
          <div className="flex h-full flex-col justify-between rounded-2xl border border-home-border bg-home-surface/90 p-4 backdrop-blur-md">
            <div>
              {/* Header com Tabs de Canal */}
              <div className="flex items-center justify-between border-b border-home-border/80 pb-2.5">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="text-amber-500">📝</span> Rascunho de mensagem (local)
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedChannel("email")}
                    className={cn(
                      "text-xs font-semibold pb-1 transition-colors cursor-pointer",
                      selectedChannel === "email"
                        ? "text-amber-400 border-b-2 border-amber-500"
                        : "text-home-muted hover:text-white",
                    )}
                  >
                    E-mail
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedChannel("whatsapp")}
                    className={cn(
                      "text-xs font-semibold pb-1 transition-colors cursor-pointer",
                      selectedChannel === "whatsapp"
                        ? "text-amber-400 border-b-2 border-amber-500"
                        : "text-home-muted hover:text-white",
                    )}
                  >
                    WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedChannel("instagram")}
                    className={cn(
                      "text-xs font-semibold pb-1 transition-colors cursor-pointer",
                      selectedChannel === "instagram"
                        ? "text-amber-400 border-b-2 border-amber-500"
                        : "text-home-muted hover:text-white",
                    )}
                  >
                    Instagram
                  </button>
                </div>
              </div>

              {/* Caixa de Mensagem Editável / Copiável */}
              <div className="relative mt-3 rounded-xl border border-home-border/80 bg-home-surface-strong/95 p-3.5">
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  title="Copiar mensagem"
                  className="absolute top-3 right-3 flex size-7 items-center justify-center rounded-lg bg-home-surface text-home-muted hover:text-white transition-colors"
                >
                  {copied ? (
                    <Check className="size-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                </button>

                <p className="whitespace-pre-wrap text-xs text-home-foreground leading-relaxed font-sans pr-6">
                  {getMessageContent()}
                </p>
              </div>
            </div>

            {/* Variáveis dinâmicas sugeridas */}
            <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-2 border-t border-home-border/60 text-[10px] text-home-muted">
              <span>Variáveis:</span>
              <span className="rounded bg-home-surface px-1.5 py-0.5 text-amber-400 font-mono">
                {"{{nome}}"}
              </span>
              <span className="rounded bg-home-surface px-1.5 py-0.5 text-amber-400 font-mono">
                {"{{empresa}}"}
              </span>
              <span className="rounded bg-home-surface px-1.5 py-0.5 text-amber-400 font-mono">
                {"{{cidade}}"}
              </span>
            </div>
          </div>
        </div>

        {/* Coluna 3 (dados persistidos + disponibilidade de resultados) — 4 cols */}
        <div className="space-y-4 lg:col-span-4 flex flex-col justify-between">
          {/* Bloco Campanhas Vinculadas */}
          <div className="rounded-2xl border border-home-border bg-home-surface/90 p-4 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <span className="text-amber-500">📢</span> Campanhas vinculadas (persistidas)
              </h4>
              <button
                type="button"
                onClick={onCreateCampaign}
                title="Nova campanha para esta lista"
                className="flex size-6 items-center justify-center rounded-lg bg-home-surface text-home-muted hover:bg-home-orange hover:text-white transition-colors"
              >
                <Plus className="size-3.5 stroke-[2.5]" />
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {linkedCampaigns.length > 0 ? (
                linkedCampaigns.slice(0, 3).map((camp) => (
                  <div
                    key={camp.id}
                    className="flex items-center justify-between rounded-xl border border-home-border/70 bg-home-surface-strong/80 p-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-white truncate">{camp.nome}</p>
                      <p className="text-[11px] text-home-muted">
                        {camp.total} leads • {camp.canal}
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/25">
                      {camp.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className="rounded-xl border border-dashed border-home-border bg-home-surface-strong/60 p-3 text-xs text-home-muted">
                  Nenhuma campanha persistida está vinculada a esta lista.
                </p>
              )}
            </div>
          </div>

          {/* Bloco Resultados Rápidos */}
          <div className="rounded-2xl border border-home-border bg-home-surface/90 p-4 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <span className="text-amber-500">📊</span> Resultados rápidos
              </h4>
            </div>
            <p className="mt-3 rounded-xl border border-dashed border-home-border bg-home-surface-strong/60 p-3 text-xs leading-relaxed text-home-muted">
              Sem métricas de execução consolidadas por lista. Consulte a aba Resultados para ver os
              dados disponíveis e os indicadores ainda não rastreados.
            </p>
          </div>
        </div>
      </div>

      {/* 🟢 LINHA 3: Preview de leads (5 primeiros) */}
      <div className="rounded-2xl border border-home-border bg-home-surface/90 p-4 backdrop-blur-md">
        <div className="flex items-center justify-between pb-3 border-b border-home-border/80">
          <div className="flex items-center gap-2">
            <TableIcon className="size-4 text-amber-500" />
            <h4 className="text-xs sm:text-sm font-bold text-white">
              Preview de leads (5 primeiros)
            </h4>
          </div>

          <button
            type="button"
            onClick={onViewAllLeads}
            className="flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
          >
            Ver todos os leads
            <ArrowRight className="size-3.5" />
          </button>
        </div>

        {/* Tabela de Preview */}
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-home-border/60 text-[11px] font-semibold text-home-muted uppercase tracking-wider">
                <th className="pb-2 font-medium">Empresa</th>
                <th className="pb-2 font-medium">Cidade</th>
                <th className="pb-2 font-medium">Contato</th>
                <th className="pb-2 font-medium">Origem</th>
                <th className="pb-2 font-medium text-center">Score</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-home-border/40">
              {previewLeads.length > 0 ? (
                previewLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-home-surface-strong/50 transition-colors">
                    <td className="py-2.5 font-semibold text-white">
                      {lead.business_name || "Empresa sem nome"}
                    </td>
                    <td className="py-2.5 text-home-muted">
                      {[lead.city, lead.state].filter(Boolean).join(" - ") || "—"}
                    </td>
                    <td className="py-2.5 text-home-muted font-mono text-[11px]">
                      {lead.email || lead.phone || lead.whatsapp || "Sem contato"}
                    </td>
                    <td className="py-2.5 text-home-muted">
                      {lead.origem_fonte || "Não informada"}
                    </td>
                    <td className="py-2.5 text-center font-bold text-amber-400 tabular-nums">
                      {lead.score ?? "—"}
                    </td>
                    <td className="py-2.5">
                      <span className="inline-flex rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                        {lead.status === "new" ? "Novo" : lead.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        type="button"
                        onClick={onViewAllLeads}
                        className="p-1 text-home-muted hover:text-white"
                      >
                        <MoreVertical className="size-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-home-muted">
                    Nenhum lead persistido disponível para pré-visualização.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
