import React, { useState } from "react";
import {
  Check,
  CheckCircle2,
  Database,
  Globe,
  Link2,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConexaoExternaItem } from "./treinamento-data";

interface ConexaoExternaModalProps {
  aberto: boolean;
  onFechar: () => void;
  conexao?: ConexaoExternaItem | null;
  onSalvar?: (conexaoId: string, novoStatus: "Conectado" | "Não conectado") => void;
}

export function ConexaoExternaModal({
  aberto,
  onFechar,
  conexao,
  onSalvar,
}: ConexaoExternaModalProps) {
  const [conectado, setConectado] = useState(conexao?.status === "Conectado");
  const [caminhoVault, setCaminhoVault] = useState("C:/Users/PlayHard/Documents/Obsidian/FlowBusinessVault");
  const [sincronizacaoAutomatica, setSincronizacaoAutomatica] = useState(true);

  if (!aberto || !conexao) return null;

  const salvar = () => {
    if (onSalvar) {
      onSalvar(conexao.id, conectado ? "Conectado" : "Não conectado");
    }
    onFechar();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={onFechar} />

      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#0c1017] text-neutral-100 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#1b2232] bg-[#121620] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-orange-500/20 text-[#f95d14]">
              <Database className="size-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Configurar Conexão: {conexao.nome}
              </h3>
              <p className="text-xs text-neutral-400">
                Sincronização de documentos e notas para o Segundo Cérebro.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onFechar}
            className="rounded-lg p-1 text-neutral-400 hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <div className="rounded-xl border border-white/5 bg-[#121620] p-4 flex items-center justify-between">
            <div>
              <p className="font-bold text-white">Status da Conexão</p>
              <p className="text-[11px] text-neutral-400">
                {conectado
                  ? "Atualmente conectado e disponível para consulta copiloto."
                  : "Desconectado. Os agentes não lerão esta pasta."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setConectado(!conectado)}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                conectado ? "bg-emerald-500" : "bg-neutral-700",
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                  conectado ? "translate-x-5" : "translate-x-0",
                )}
              />
            </button>
          </div>

          <div>
            <label className="block font-semibold text-neutral-300">
              Caminho da Pasta / Vault Local
            </label>
            <input
              type="text"
              value={caminhoVault}
              onChange={(e) => setCaminhoVault(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[#1b2232] bg-[#111723] p-2.5 text-xs text-white focus:border-[#f95d14] focus:outline-none"
            />
          </div>

          <div className="rounded-xl border border-white/5 bg-[#121620] p-3.5 flex items-center justify-between">
            <div>
              <p className="font-bold text-white">Sincronização em Tempo Real</p>
              <p className="text-[11px] text-neutral-400">
                Indexar novos arquivos Markdown automaticamente quando salvos.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSincronizacaoAutomatica(!sincronizacaoAutomatica)}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                sincronizacaoAutomatica ? "bg-emerald-500" : "bg-neutral-700",
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                  sincronizacaoAutomatica ? "translate-x-5" : "translate-x-0",
                )}
              />
            </button>
          </div>

          <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-3 flex items-start gap-2.5">
            <Sparkles className="size-4 text-[#f95d14] shrink-0 mt-0.5" />
            <p className="text-[11px] text-neutral-300 leading-relaxed">
              Configuração visual demonstrativa da interface. A indexação real RAG será ativada na fase de backend sem custos extras de armazenamento.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[#1b2232] bg-[#121620] px-6 py-4">
          <button
            type="button"
            onClick={onFechar}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-neutral-300 hover:bg-white/10"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={salvar}
            className="rounded-xl bg-[#f95d14] px-5 py-2 text-xs font-bold text-white shadow-lg shadow-orange-500/20 hover:bg-[#ff6c26]"
          >
            Salvar Conexão
          </button>
        </div>
      </div>
    </div>
  );
}
