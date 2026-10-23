// Modal Demonstrativo para Configuração de Servidores MCP (Model Context Protocol)
import React, { useState } from "react";
import {
  Check,
  CheckCircle2,
  Code,
  Database,
  ExternalLink,
  Info,
  Layers,
  Network,
  RefreshCw,
  Server,
  Terminal,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfigurarMcpModalProps {
  aberto: boolean;
  onFechar: () => void;
}

export function ConfigurarMcpModal({ aberto, onFechar }: ConfigurarMcpModalProps) {
  if (!aberto) return null;

  const [nomeServidor, setNomeServidor] = useState("mcp-flow-business");
  const [urlServidor, setUrlServidor] = useState("stdio://tools/commercial-flow");
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  const handleSalvar = () => {
    setSalvando(true);
    setTimeout(() => {
      setSalvando(false);
      setSucesso(true);
      setTimeout(() => {
        setSucesso(false);
        onFechar();
      }, 1000);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-[#1e2638] bg-[#0c1017] p-6 shadow-2xl space-y-5">
        
        {/* Cabeçalho */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl border border-orange-500/30 bg-orange-500/10 text-[#f95d14]">
              <Terminal className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Servidor MCP (Model Context Protocol)</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Conexão controlada com ferramentas e bases</p>
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

        {/* Aviso de demonstração */}
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 flex items-start gap-2.5">
          <Info className="size-4 text-blue-400 shrink-0 mt-0.5" />
          <p className="text-xs text-neutral-300 leading-relaxed">
            O protocolo MCP permite expor funções seguras para os agentes. Nesta fase, preparamos a arquitetura de interface e os contratos visuais.
          </p>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 block mb-1.5">
              Nome do Servidor MCP
            </label>
            <input
              type="text"
              value={nomeServidor}
              onChange={(e) => setNomeServidor(e.target.value)}
              className="w-full rounded-xl border border-[#1e2638] bg-[#121620] px-3 py-2.5 text-xs text-white focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 block mb-1.5">
              Endpoint / URI de Conexão
            </label>
            <input
              type="text"
              value={urlServidor}
              onChange={(e) => setUrlServidor(e.target.value)}
              className="w-full rounded-xl border border-[#1e2638] bg-[#121620] px-3 py-2.5 text-xs text-white font-mono focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 block mb-1.5">
              Ferramentas Expostas Demonstrativas
            </label>
            <div className="space-y-1.5 rounded-xl border border-[#1e2638] bg-[#121620] p-3 text-neutral-300">
              <div className="flex items-center justify-between">
                <span>query_database_leads</span>
                <span className="text-[10px] text-emerald-400 font-mono">read-only</span>
              </div>
              <div className="flex items-center justify-between">
                <span>extract_google_maps_companies</span>
                <span className="text-[10px] text-emerald-400 font-mono">scoped</span>
              </div>
              <div className="flex items-center justify-between">
                <span>schedule_commercial_meeting</span>
                <span className="text-[10px] text-orange-400 font-mono">requires-approval</span>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#1b2232]">
          <button
            type="button"
            onClick={onFechar}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-neutral-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={handleSalvar}
            disabled={salvando || sucesso}
            className="flex items-center gap-1.5 rounded-xl bg-[#f95d14] px-5 py-2 text-xs font-bold text-white shadow-md shadow-orange-500/20 hover:bg-[#ff6c26] transition-all"
          >
            {sucesso ? <Check className="size-4" /> : salvando ? <RefreshCw className="size-4 animate-spin" /> : null}
            <span>{sucesso ? "Salvo!" : salvando ? "Salvando..." : "Salvar Configuração"}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
