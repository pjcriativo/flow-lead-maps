// Modal de Conexão e Configuração de Fontes de Memória
import React, { useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Database,
  ExternalLink,
  Folder,
  HardDrive,
  Info,
  Link2,
  Lock,
  RefreshCw,
  ShieldCheck,
  Sliders,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { FonteMemoriaItem } from "./memoria-data";

interface ConectarFonteModalProps {
  aberto: boolean;
  fonte: FonteMemoriaItem | null;
  onFechar: () => void;
  onSalvarStatus?: (id: string, novoStatus: "ativo" | "conectado" | "nao_conectado") => void;
}

export function ConectarFonteModal({
  aberto,
  fonte,
  onFechar,
  onSalvarStatus,
}: ConectarFonteModalProps) {
  if (!aberto || !fonte) return null;

  const [sincronizacaoAutomatica, setSincronizacaoAutomatica] = useState(true);
  const [frequencia, setFrequencia] = useState("A cada 1 hora");
  const [pastasSelecionadas, setPastasSelecionadas] = useState<string[]>([
    "Notas de Reuniões",
    "Estratégia e Playbooks",
    "Clientes e Contratos",
  ]);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  const handleSalvar = () => {
    setSalvando(true);
    setTimeout(() => {
      setSalvando(false);
      setSucesso(true);
      if (onSalvarStatus) {
        onSalvarStatus(fonte.id, "conectado");
      }
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
              <Database className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{fonte.nome}</h3>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold border",
                    fonte.status === "conectado" || fonte.status === "ativo"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : "bg-neutral-800 text-neutral-400 border-neutral-700",
                  )}
                >
                  {fonte.statusRotulo}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">{fonte.descricao}</p>
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

        {/* Aviso de demonstração de frontend */}
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 flex items-start gap-2.5">
          <Info className="size-4 text-blue-400 shrink-0 mt-0.5" />
          <p className="text-xs text-neutral-300 leading-relaxed">
            Nesta etapa estamos construindo o frontend visual. A integração segura com OAuth e sincronização de arquivos externos será configurada na fase de backend.
          </p>
        </div>

        {/* Configurações Locais */}
        <div className="space-y-4 text-xs">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 block mb-1.5">
              Frequência de Sincronização
            </label>
            <select
              value={frequencia}
              onChange={(e) => setFrequencia(e.target.value)}
              className="w-full rounded-xl border border-[#1e2638] bg-[#121620] px-3 py-2.5 text-xs text-white focus:border-orange-500 focus:outline-none"
            >
              <option>Em tempo real (Webhook)</option>
              <option>A cada 15 minutos</option>
              <option>A cada 1 hora</option>
              <option>Diariamente à meia-noite</option>
              <option>Apenas sob demanda manual</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 block mb-1.5">
              Pastas &amp; Contextos Autorizados
            </label>
            <div className="space-y-1.5 rounded-xl border border-[#1e2638] bg-[#121620] p-3 max-h-36 overflow-y-auto">
              {["Notas de Reuniões", "Estratégia e Playbooks", "Clientes e Contratos", "Ideias de Marketing", "Financeiro Confidencial"].map(
                (pasta) => {
                  const marcada = pastasSelecionadas.includes(pasta);
                  return (
                    <label
                      key={pasta}
                      className="flex items-center gap-2 cursor-pointer text-xs text-neutral-300 hover:text-white"
                    >
                      <input
                        type="checkbox"
                        checked={marcada}
                        onChange={() => {
                          if (marcada) {
                            setPastasSelecionadas(pastasSelecionadas.filter((p) => p !== pasta));
                          } else {
                            setPastasSelecionadas([...pastasSelecionadas, pasta]);
                          }
                        }}
                        className="rounded border-neutral-700 bg-neutral-900 text-[#f95d14] focus:ring-0"
                      />
                      <Folder className="size-3.5 text-neutral-500" />
                      <span>{pasta}</span>
                    </label>
                  );
                },
              )}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-[#1e2638] bg-[#121620] p-3">
            <div>
              <p className="font-semibold text-white">Sincronização Contínua</p>
              <p className="text-[11px] text-neutral-400">
                Permitir que o agente monitore novas notas e arquivos salvos
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSincronizacaoAutomatica(!sincronizacaoAutomatica)}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
                sincronizacaoAutomatica ? "bg-[#f95d14]" : "bg-neutral-800",
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200",
                  sincronizacaoAutomatica ? "translate-x-5" : "translate-x-0",
                )}
              />
            </button>
          </div>
        </div>

        {/* Rodapé com botões */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#1b2232]">
          <button
            type="button"
            onClick={onFechar}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-neutral-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSalvar}
            disabled={salvando || sucesso}
            className="flex items-center gap-1.5 rounded-xl bg-[#f95d14] px-4 py-2 text-xs font-bold text-white shadow-md shadow-orange-500/20 hover:bg-[#ff6c26] transition-all"
          >
            {sucesso ? (
              <>
                <Check className="size-4" />
                <span>Salvo!</span>
              </>
            ) : salvando ? (
              <>
                <RefreshCw className="size-4 animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <span>Salvar Configuração</span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
