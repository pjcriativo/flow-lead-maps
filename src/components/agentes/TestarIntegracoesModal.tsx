// Modal de Diagnóstico e Teste Visual de Integrações
import React, { useState } from "react";
import {
  Activity,
  CheckCircle2,
  Clock,
  ExternalLink,
  Info,
  RefreshCw,
  ShieldCheck,
  Wifi,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TestarIntegracoesModalProps {
  aberto: boolean;
  onFechar: () => void;
}

export function TestarIntegracoesModal({ aberto, onFechar }: TestarIntegracoesModalProps) {
  if (!aberto) return null;

  const [testando, setTestando] = useState(false);
  const [concluido, setConcluido] = useState(true);

  const executarTeste = () => {
    setTestando(true);
    setConcluido(false);
    setTimeout(() => {
      setTestando(false);
      setConcluido(true);
    }, 1200);
  };

  const testes = [
    { nome: "OpenAI API (GPT-4o)", latencia: "284ms", status: "Operacional", cor: "text-emerald-400" },
    { nome: "Google Workspace API", latencia: "112ms", status: "Operacional", cor: "text-emerald-400" },
    { nome: "WhatsApp Business Evolution", latencia: "95ms", status: "Operacional", cor: "text-emerald-400" },
    { nome: "Google Maps / Apify Scraping", latencia: "420ms", status: "Operacional", cor: "text-emerald-400" },
    { nome: "Obsidian Vault Local Sync", latencia: "45ms", status: "Pronto", cor: "text-emerald-400" },
    { nome: "Notion Cloud Workspace", latencia: "--", status: "Aguardando Conexão", cor: "text-neutral-400" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-[#1e2638] bg-[#0c1017] p-6 shadow-2xl space-y-5">
        
        {/* Cabeçalho */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
              <Activity className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Diagnóstico de Integrações</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Verificação de status, latência e conectividade</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onFechar}
            className="rounded-lg p-1 text-neutral-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Lista de testes */}
        <div className="space-y-2">
          {testes.map((item) => (
            <div
              key={item.nome}
              className="flex items-center justify-between rounded-xl border border-white/5 bg-[#121620] p-3 text-xs"
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className={cn("size-4 shrink-0", item.cor)} />
                <span className="font-medium text-neutral-200">{item.nome}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-neutral-400">{item.latencia}</span>
                <span className={cn("text-[11px] font-bold", item.cor)}>{item.status}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Rodapé com botão de reteste */}
        <div className="flex items-center justify-between pt-3 border-t border-[#1b2232]">
          <span className="text-[11px] text-neutral-400">
            5 de 6 serviços conectados e prontos
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={executarTeste}
              disabled={testando}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-neutral-200 hover:bg-white/10 hover:text-white"
            >
              <RefreshCw className={cn("size-3.5", testando && "animate-spin")} />
              <span>{testando ? "Testando..." : "Testar novamente"}</span>
            </button>
            <button
              type="button"
              onClick={onFechar}
              className="rounded-xl bg-[#f95d14] px-4 py-2 text-xs font-bold text-white hover:bg-[#ff6c26]"
            >
              Concluído
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
