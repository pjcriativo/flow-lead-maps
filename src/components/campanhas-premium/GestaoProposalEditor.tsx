import { useState } from "react";
import {
  ChevronDown,
  Mail,
  Maximize2,
  MessageSquare,
  Send,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { GestaoLeadItem } from "./gestao-producao-data";

interface GestaoProposalEditorProps {
  lead: GestaoLeadItem;
  onSaveDraft?: (assunto: string, corpo: string) => void;
  onTestSend?: (lead: GestaoLeadItem) => void;
  onSendProposal?: (lead: GestaoLeadItem) => void;
  className?: string;
}

export function GestaoProposalEditor({
  lead,
  onSaveDraft,
  onTestSend,
  onSendProposal,
  className,
}: GestaoProposalEditorProps) {
  const [canal, setCanal] = useState<"email" | "whatsapp">("email");
  const [assunto, setAssunto] = useState(
    lead.propostaAssunto ||
      `Idéia para destacar o ${lead.name} no Google e atrair mais clientes`,
  );
  const [corpo, setCorpo] = useState(
    lead.propostaCorpo ||
      `Olá,\n\nTudo bem?\n\nAnalisei o site do ${lead.name} e identifiquei algumas oportunidades para atrair mais clientes através do Google. Preparei uma proposta personalizada com um novo site e uma estratégia completa de presença online.\n\nVale a pena conferir!\n\nAbraços,`,
  );

  const handleSalvar = () => {
    onSaveDraft?.(assunto, corpo);
    toast.success("Rascunho da proposta comercial salvo.");
  };

  const handleTestar = () => {
    onTestSend?.(lead);
    toast.info(`Simulação de envio enviada para o seu e-mail de teste.`);
  };

  const handleEnviar = () => {
    onSendProposal?.(lead);
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-home-border bg-home-surface/80 p-4 shadow-[0_4px_20px_rgba(0,0,0,0.15)] sm:p-5 space-y-3.5",
        className,
      )}
    >
      {/* Cabeçalho da Proposta Comercial */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-bold text-white tracking-tight">
            Proposta comercial
          </h3>

          {/* Seletor de Canal: E-mail / WhatsApp */}
          <div className="flex items-center rounded-xl border border-home-border bg-home-background p-0.5">
            <button
              type="button"
              onClick={() => setCanal("email")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors",
                canal === "email"
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  : "text-home-muted hover:text-white",
              )}
            >
              <Mail className="size-3.5" />
              E-mail
            </button>

            <button
              type="button"
              onClick={() => setCanal("whatsapp")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors",
                canal === "whatsapp"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "text-home-muted hover:text-white",
              )}
            >
              <MessageSquare className="size-3.5" />
              WhatsApp
            </button>
          </div>
        </div>

        {/* Usar Modelo + Expandir */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => toast.info("Seletor de modelos de copy por nicho")}
            className="flex items-center gap-1.5 rounded-lg border border-home-border bg-home-background px-2.5 py-1 text-xs font-medium text-home-foreground hover:bg-home-surface-strong"
          >
            Usar modelo
            <ChevronDown className="size-3 text-home-muted" />
          </button>

          <button
            type="button"
            onClick={() => toast.info("Expandir editor")}
            className="flex size-7 items-center justify-center rounded-lg border border-home-border bg-home-background text-home-muted hover:text-white"
          >
            <Maximize2 className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Campo Assunto */}
      {canal === "email" && (
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-home-muted w-14 shrink-0">
            Assunto
          </label>
          <input
            type="text"
            value={assunto}
            onChange={(e) => setAssunto(e.target.value)}
            className="h-8.5 w-full rounded-xl border border-home-border bg-home-background px-3 text-xs text-white outline-none focus:border-home-blue"
          />
        </div>
      )}

      {/* Editor do Corpo da Proposta */}
      <div>
        <textarea
          rows={7}
          value={corpo}
          onChange={(e) => setCorpo(e.target.value)}
          className="w-full resize-none rounded-xl border border-home-border bg-home-background p-3 text-xs leading-relaxed text-white outline-none focus:border-home-blue font-sans"
        />
      </div>

      {/* Barra de Ações Inferior: Salvar rascunho / Testar envio / Enviar proposta */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-home-border/60 pt-3">
        <button
          type="button"
          onClick={handleSalvar}
          className="flex h-9 items-center gap-1.5 rounded-xl border border-home-border bg-home-surface px-3.5 text-xs font-semibold text-home-foreground transition-all hover:bg-home-surface-strong hover:text-white"
        >
          Salvar rascunho
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTestar}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-home-border bg-home-surface px-3.5 text-xs font-semibold text-home-foreground transition-all hover:bg-home-surface-strong hover:text-white"
          >
            <Send className="size-3.5 text-home-muted" />
            Testar envio
          </button>

          <button
            type="button"
            onClick={handleEnviar}
            className="flex h-9 items-center gap-1.5 rounded-xl bg-home-orange px-4 text-xs font-bold text-white shadow-[0_0_24px_rgba(255,98,0,0.35)] transition-all duration-200 hover:bg-home-orange/90 hover:shadow-[0_0_30px_rgba(255,98,0,0.5)] active:scale-[0.98]"
          >
            <Send className="size-3.5" />
            Enviar proposta
          </button>
        </div>
      </div>
    </div>
  );
}
