// Modal para Configurar Conexões de APIs e Conectores Externos
import React, { useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Code,
  DollarSign,
  ExternalLink,
  Info,
  Key,
  Layers,
  Lock,
  RefreshCw,
  Server,
  ShieldCheck,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ApiConectorItem } from "./skills-data";

interface ConectarApiModalProps {
  aberto: boolean;
  conector: ApiConectorItem | null;
  onFechar: () => void;
  onSalvarStatus?: (id: string, novoStatus: "conectado" | "configurar" | "nao_conectado") => void;
}

export function ConectarApiModal({
  aberto,
  conector,
  onFechar,
  onSalvarStatus,
}: ConectarApiModalProps) {
  if (!aberto || !conector) return null;

  const [ambiente, setAmbiente] = useState("Produção");
  const [limiteMensal, setLimiteMensal] = useState("R$ 500,00");
  const [aprovacaoExigida, setAprovacaoExigida] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  const handleSalvar = () => {
    setSalvando(true);
    setTimeout(() => {
      setSalvando(false);
      setSucesso(true);
      if (onSalvarStatus) {
        onSalvarStatus(conector.id, "conectado");
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
              <Code className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{conector.nome}</h3>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold border",
                    conector.status === "conectado"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : conector.status === "configurar"
                      ? "bg-orange-500/10 text-orange-400 border-orange-500/30"
                      : "bg-neutral-800 text-neutral-400 border-neutral-700",
                  )}
                >
                  {conector.statusRotulo}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">{conector.descricao}</p>
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

        {/* Aviso de segurança */}
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 flex items-start gap-2.5">
          <Info className="size-4 text-blue-400 shrink-0 mt-0.5" />
          <p className="text-xs text-neutral-300 leading-relaxed">
            Nesta etapa visual de demonstração, as configurações são simuladas localmente. Chaves criptografadas e OAuth oficial serão vinculados nas etapas de backend seguro.
          </p>
        </div>

        {/* Formulário Demonstrativo */}
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 block mb-1.5">
                Ambiente
              </label>
              <select
                value={ambiente}
                onChange={(e) => setAmbiente(e.target.value)}
                className="w-full rounded-xl border border-[#1e2638] bg-[#121620] px-3 py-2.5 text-xs text-white focus:border-orange-500 focus:outline-none"
              >
                <option>Produção</option>
                <option>Sandbox / Testes</option>
                <option>Desenvolvimento</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 block mb-1.5">
                Teto de Custo Mensal
              </label>
              <input
                type="text"
                value={limiteMensal}
                onChange={(e) => setLimiteMensal(e.target.value)}
                className="w-full rounded-xl border border-[#1e2638] bg-[#121620] px-3 py-2.5 text-xs text-white focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 block mb-1.5">
              Escopos e Permissões Autorizadas
            </label>
            <div className="space-y-1.5 rounded-xl border border-[#1e2638] bg-[#121620] p-3 text-xs text-neutral-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-3.5 text-emerald-400" />
                <span>Leitura e interpretação de contexto</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-3.5 text-emerald-400" />
                <span>Geração de conteúdo supervisionada</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-3.5 text-emerald-400" />
                <span>Chamadas de ferramentas e extração de dados</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-[#1e2638] bg-[#121620] p-3">
            <div>
              <p className="font-semibold text-white">Controle de Segurança Ativo</p>
              <p className="text-[11px] text-neutral-400">
                Bloquear chamadas acima do teto e auditar requisições
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAprovacaoExigida(!aprovacaoExigida)}
              className={cn(
                "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
                aprovacaoExigida ? "bg-[#f95d14]" : "bg-neutral-800",
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block size-4 transform rounded-full bg-white shadow ring-0 transition duration-200",
                  aprovacaoExigida ? "translate-x-4" : "translate-x-0",
                )}
              />
            </button>
          </div>
        </div>

        {/* Rodapé com botões */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#1b2232]">
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
            className="flex items-center gap-1.5 rounded-xl bg-[#f95d14] px-5 py-2 text-xs font-bold text-white shadow-md shadow-orange-500/20 hover:bg-[#ff6c26] transition-all"
          >
            {sucesso ? (
              <>
                <Check className="size-4" />
                <span>Conectado!</span>
              </>
            ) : salvando ? (
              <>
                <RefreshCw className="size-4 animate-spin" />
                <span>Validando...</span>
              </>
            ) : (
              <span>Salvar Conexão</span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
