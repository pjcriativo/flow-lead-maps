import React, { useState } from "react";
import {
  DollarSign,
  Lock,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  X,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LimitesRestricoesModalProps {
  aberto: boolean;
  onFechar: () => void;
  limitesIniciais?: {
    orcamentoMensal: string;
    limiteTarefasDia: number;
    autonomiaOperacional: string;
    aprovacaoHumanaObrigatoria: boolean;
    restricoesFerramentas: string[];
  };
  onSalvar?: (novosLimites: any) => void;
}

export function LimitesRestricoesModal({
  aberto,
  onFechar,
  limitesIniciais,
  onSalvar,
}: LimitesRestricoesModalProps) {
  const [orcamento, setOrcamento] = useState(limitesIniciais?.orcamentoMensal || "R$ 1.500,00");
  const [tarefasDia, setTarefasDia] = useState(limitesIniciais?.limiteTarefasDia || 50);
  const [aprovacaoObrigatoria, setAprovacaoObrigatoria] = useState(
    limitesIniciais?.aprovacaoHumanaObrigatoria ?? true,
  );
  const [ferramentas, setFerramentas] = useState<string[]>(
    limitesIniciais?.restricoesFerramentas || ["Google Maps", "WhatsApp", "CRM Interno"],
  );

  if (!aberto) return null;

  const toggleFerramenta = (f: string) => {
    setFerramentas((prev) =>
      prev.includes(f) ? prev.filter((item) => item !== f) : [...prev, f],
    );
  };

  const salvar = () => {
    if (onSalvar) {
      onSalvar({
        orcamentoMensal: orcamento,
        limiteTarefasDia: tarefasDia,
        aprovacaoHumanaObrigatoria: aprovacaoObrigatoria,
        restricoesFerramentas: ferramentas,
      });
    }
    onFechar();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={onFechar} />

      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-rose-500/30 bg-[#0c1017] text-neutral-100 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#1b2232] bg-[#121620] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400">
              <ShieldAlert className="size-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Limites e Restrições do Agente
              </h3>
              <p className="text-xs text-neutral-400">
                Parâmetros de segurança e teto de gastos no modo Copiloto.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onFechar}
            className="rounded-lg p-1 text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-4 p-6 text-xs">
          <div>
            <label className="block font-semibold text-neutral-300">
              Teto de Orçamento Mensal em APIs / Chips
            </label>
            <input
              type="text"
              value={orcamento}
              onChange={(e) => setOrcamento(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#1b2232] bg-[#111723] p-2.5 text-xs text-white focus:border-[#f95d14] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-neutral-300">
              Limite Máximo de Tarefas por Dia: {tarefasDia}
            </label>
            <input
              type="range"
              min="10"
              max="200"
              step="5"
              value={tarefasDia}
              onChange={(e) => setTarefasDia(Number(e.target.value))}
              className="mt-2 w-full accent-[#f95d14]"
            />
          </div>

          <div className="rounded-xl border border-white/5 bg-[#121620] p-3.5 flex items-center justify-between">
            <div>
              <p className="font-bold text-white">Aprovação Humana Obrigatória</p>
              <p className="text-[11px] text-neutral-400">
                Nenhuma mensagem externa é enviada sem o seu clique prévio.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAprovacaoObrigatoria(!aprovacaoObrigatoria)}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                aprovacaoObrigatoria ? "bg-emerald-500" : "bg-neutral-700",
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                  aprovacaoObrigatoria ? "translate-x-5" : "translate-x-0",
                )}
              />
            </button>
          </div>

          <div>
            <label className="block font-semibold text-neutral-300 mb-2">
              Ferramentas Autorizadas para o Agente
            </label>
            <div className="grid grid-cols-2 gap-2">
              {["Google Maps", "WhatsApp", "CRM Interno", "Disparo E-mail", "Obsidian RAG", "Google Agenda"].map(
                (ferr) => {
                  const ativo = ferramentas.includes(ferr);
                  return (
                    <button
                      key={ferr}
                      type="button"
                      onClick={() => toggleFerramenta(ferr)}
                      className={cn(
                        "flex items-center justify-between rounded-xl border p-2.5 text-xs font-semibold transition-all",
                        ativo
                          ? "border-[#f95d14] bg-[#f95d14]/10 text-white"
                          : "border-[#1b2232] bg-[#111723] text-neutral-400 hover:border-white/20",
                      )}
                    >
                      <span>{ferr}</span>
                      {ativo && <Check className="size-3.5 text-[#f95d14]" />}
                    </button>
                  );
                },
              )}
            </div>
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
            Salvar Limites
          </button>
        </div>
      </div>
    </div>
  );
}
