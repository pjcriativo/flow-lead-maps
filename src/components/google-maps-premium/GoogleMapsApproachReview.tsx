import { useState } from "react";
import {
  Users,
  Target,
  Send,
  Clock,
  Folder,
  CheckCircle2,
  Info,
  Bookmark,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Lead } from "@/lib/leads-api";
import type { ObjetivoComercial } from "./GoogleMapsApproachStrategy";

export interface GoogleMapsApproachReviewProps {
  selectedLeadsCount: number;
  objetivo: ObjetivoComercial;
  canaisSelecionados: string[];
  momentoEnvio: "agora" | "agendar";
  nomeLista: string;
  mensagens: {
    whatsapp: string;
    email: string;
    instagram: string;
  };
  focusedLead: Lead | null;
  onIniciarCampanha: () => void;
  onSalvarRascunho: () => void;
}

export function GoogleMapsApproachReview({
  selectedLeadsCount,
  objetivo,
  canaisSelecionados,
  momentoEnvio,
  nomeLista,
  mensagens,
  focusedLead,
  onIniciarCampanha,
  onSalvarRascunho,
}: GoogleMapsApproachReviewProps) {
  const [previewTab, setPreviewTab] = useState<"whatsapp" | "email">("whatsapp");

  // Rótulos amigáveis para resumo
  const objetivoLabels: Record<ObjetivoComercial, string> = {
    atrair_clientes: "Atrair novos clientes",
    parcerias: "Parcerias comerciais",
    agendamento: "Agendamento de reunião",
    promocoes: "Divulgação de promoções",
  };

  const canalLabels: Record<string, string> = {
    whatsapp: "WhatsApp",
    email: "E-mail",
    instagram: "Instagram",
    telefone: "Telefone",
  };

  const canaisTexto =
    canaisSelecionados.length > 0
      ? canaisSelecionados.map((c) => canalLabels[c] || c).join(" e ")
      : "Nenhum canal selecionado";

  // Substitui variáveis pelo lead de exemplo focado
  const resolverPrevia = (texto: string) => {
    if (!texto) return "Nenhuma mensagem configurada para este canal.";
    const lead = focusedLead;
    return texto
      .replace(/{nome_empresa}/g, lead?.business_name || "Clínica Sorriso Curitiba")
      .replace(/{categoria}/g, lead?.category || "clínica odontológica")
      .replace(/{cidade}/g, lead?.city || "Curitiba")
      .replace(/{uf}/g, lead?.state || "PR")
      .replace(/{endereco}/g, lead?.address || "Av. Batel, 1230")
      .replace(/{avaliacao}/g, lead?.rating ? String(lead.rating) : "4.8")
      .replace(
        /{site}/g,
        lead?.website ? lead.website.replace(/^https?:\/\//, "") : "sorrisocuritiba.com.br",
      )
      .replace(
        /{instagram}/g,
        lead?.instagram_url
          ? lead.instagram_url
              .replace(/^https?:\/\/(www\.)?instagram\.com\//, "@")
              .replace(/\/$/, "")
          : "@sorrisocuritiba",
      )
      .replace(/{seu_nome}/g, "Marcos Gonçalves");
  };

  const textoPreview = resolverPrevia(mensagens[previewTab]);

  return (
    <div className="rounded-2xl border border-home-border bg-[#101720]/90 p-4 shadow-sm flex flex-col justify-between space-y-4 h-full">
      {/* Topo da Coluna 4 */}
      <div className="space-y-1">
        <h3 className="text-sm font-extrabold text-white tracking-tight">4. Revisão e Envio</h3>
        <p className="text-[11px] text-home-muted leading-tight">
          Confira os detalhes da sua campanha antes de iniciar.
        </p>
      </div>

      {/* Resumo da Campanha */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-white tracking-tight">Resumo da campanha</label>
        <div className="rounded-xl border border-home-border/70 bg-home-surface/40 p-2.5 space-y-2 text-xs">
          {/* Leads selecionados */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-home-muted">
              <Users className="size-3.5 text-home-orange" />
              <span>Leads selecionados</span>
            </div>
            <span className="font-semibold text-white">{selectedLeadsCount} empresas</span>
          </div>

          {/* Objetivo */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-home-muted">
              <Target className="size-3.5 text-home-orange" />
              <span>Objetivo</span>
            </div>
            <span className="font-semibold text-white truncate max-w-[150px]">
              {objetivoLabels[objetivo]}
            </span>
          </div>

          {/* Canais de comunicação */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-home-muted">
              <Send className="size-3.5 text-home-orange" />
              <span>Canais de comunicação</span>
            </div>
            <span className="font-semibold text-white truncate max-w-[150px]">{canaisTexto}</span>
          </div>

          {/* Início do envio */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-home-muted">
              <Clock className="size-3.5 text-home-orange" />
              <span>Início do envio</span>
            </div>
            <span className="font-semibold text-white">
              {momentoEnvio === "agora" ? "Agora" : "Programado"}
            </span>
          </div>

          {/* Lista de destino */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-home-muted">
              <Folder className="size-3.5 text-home-orange" />
              <span>Lista de destino</span>
            </div>
            <span className="font-semibold text-white truncate max-w-[140px]">{nomeLista}</span>
          </div>

          {/* Mensagens personalizadas */}
          <div className="flex items-center justify-between border-t border-home-border/40 pt-1.5">
            <div className="flex items-center gap-1.5 text-home-muted">
              <CheckCircle2 className="size-3.5 text-emerald-400" />
              <span>Mensagens personalizadas</span>
            </div>
            <span className="font-semibold text-emerald-400 text-[11px]">
              {canaisSelecionados.length} canal(is) configurado(s)
            </span>
          </div>
        </div>
      </div>

      {/* Caixa Informativa com Ícone */}
      <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-2.5 flex items-start gap-2 text-[11px] text-blue-300">
        <Info className="size-4 shrink-0 text-blue-400 mt-0.5" />
        <p className="leading-tight">
          As mensagens serão personalizadas automaticamente com os dados de cada empresa.
        </p>
      </div>

      {/* Seção: Preview da Mensagem */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-white tracking-tight">Preview da mensagem</label>
          <div className="flex rounded-lg border border-home-border p-0.5 bg-home-surface/60 text-[10px]">
            <button
              type="button"
              onClick={() => setPreviewTab("whatsapp")}
              className={cn(
                "px-2 py-0.5 rounded font-semibold transition-colors cursor-pointer",
                previewTab === "whatsapp"
                  ? "bg-home-orange text-white"
                  : "text-home-muted hover:text-white",
              )}
            >
              WhatsApp
            </button>
            <button
              type="button"
              onClick={() => setPreviewTab("email")}
              className={cn(
                "px-2 py-0.5 rounded font-semibold transition-colors cursor-pointer",
                previewTab === "email"
                  ? "bg-home-orange text-white"
                  : "text-home-muted hover:text-white",
              )}
            >
              E-mail
            </button>
          </div>
        </div>

        {/* Bolha de Visualização do WhatsApp */}
        {previewTab === "whatsapp" ? (
          <div className="rounded-xl border border-emerald-900/60 bg-[#0b141a] p-3 text-xs shadow-inner space-y-2">
            <div className="rounded-lg bg-[#005c4b] text-white p-2.5 leading-relaxed text-[11px] shadow-sm space-y-1">
              <p className="whitespace-pre-line">{textoPreview}</p>
              <div className="flex items-center justify-end gap-1 text-[9px] text-white/70 pt-1">
                <span>10:42</span>
                <span className="text-cyan-300">✓✓</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-home-border bg-[#0a0f16] p-3 text-xs space-y-2">
            <div className="border-b border-home-border/40 pb-1.5 text-[10px] space-y-0.5">
              <p className="text-home-muted">
                Para:{" "}
                <span className="text-white">{focusedLead?.email || "contato@empresa.com.br"}</span>
              </p>
              <p className="text-home-muted">
                Assunto:{" "}
                <span className="font-semibold text-white">
                  Oportunidade Comercial para {focusedLead?.business_name || "sua empresa"}
                </span>
              </p>
            </div>
            <p className="text-[11px] text-home-foreground leading-relaxed whitespace-pre-line">
              {textoPreview}
            </p>
          </div>
        )}
      </div>

      {/* Botões Finais de Ação */}
      <div className="pt-2 border-t border-home-border/60 space-y-2">
        {/* Iniciar Campanha */}
        <button
          type="button"
          onClick={onIniciarCampanha}
          className="w-full inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-home-orange px-4 text-xs font-bold text-white shadow-md shadow-home-orange/20 hover:bg-home-orange-hover transition-colors cursor-pointer"
        >
          <Send className="size-3.5" />
          <span>Iniciar Campanha</span>
        </button>

        {/* Salvar como rascunho */}
        <button
          type="button"
          onClick={onSalvarRascunho}
          className="w-full inline-flex h-8 items-center justify-center gap-1.5 rounded-xl border border-home-border bg-home-surface/80 px-4 text-xs font-semibold text-white hover:bg-home-surface hover:border-home-border/80 transition-colors cursor-pointer"
        >
          <Bookmark className="size-3.5 text-home-muted" />
          <span>Salvar como rascunho</span>
        </button>
      </div>
    </div>
  );
}
