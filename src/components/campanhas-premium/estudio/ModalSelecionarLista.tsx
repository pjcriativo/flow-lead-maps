import React, { useState } from "react";
import { X, Search, Users, Check, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SimpleListaItem } from "@/services/campaign-studio-service";

interface ModalSelecionarListaProps {
  isOpen: boolean;
  listas: SimpleListaItem[];
  selectedListaId: string | null;
  onClose: () => void;
  onSelectLista: (lista: SimpleListaItem) => void;
}

export function ModalSelecionarLista({
  isOpen,
  listas,
  selectedListaId,
  onClose,
  onSelectLista,
}: ModalSelecionarListaProps) {
  const [search, setSearch] = useState("");

  if (!isOpen) return null;

  const filtered = listas.filter(
    (l) =>
      l.nome.toLowerCase().includes(search.toLowerCase()) ||
      l.nicho.toLowerCase().includes(search.toLowerCase()) ||
      l.cidade.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-zinc-800 bg-[#10131b] text-white shadow-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#ff6200]/10 text-[#ff6200]">
              <Users className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Selecionar lista de leads</h3>
              <p className="text-[11px] text-zinc-400">
                Escolha a lista comercial que receberá os envios da campanha
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Busca */}
        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome da lista, nicho ou cidade..."
            className="h-9 w-full rounded-xl border border-zinc-800 bg-[#0d1017] pl-9 pr-3 text-xs text-white placeholder-zinc-500 focus:border-[#ff6200] focus:outline-none"
          />
        </div>

        {/* Lista de Opções */}
        <div className="mt-4 max-h-72 overflow-y-auto space-y-2 pr-1">
          {filtered.map((l) => {
            const isSelected = l.id === selectedListaId;
            return (
              <div
                key={l.id}
                onClick={() => {
                  onSelectLista(l);
                  onClose();
                }}
                className={cn(
                  "flex items-center justify-between rounded-xl border p-3 cursor-pointer transition-all",
                  isSelected
                    ? "border-[#ff6200] bg-[#ff6200]/10"
                    : "border-zinc-800 bg-[#141824] hover:border-zinc-700",
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white truncate">{l.nome}</span>
                    <span className="rounded-md border border-zinc-700/60 bg-zinc-800/80 px-1.5 py-0.5 text-[9px] font-semibold text-zinc-300">
                      {l.nicho}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-[11px] text-zinc-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3 text-zinc-500" />
                      <span>{l.cidade}</span>
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-emerald-400">
                      {l.leadsQualificados} qualificados
                    </span>
                    <span>•</span>
                    <span>{l.leadsComEmail} com e-mail</span>
                  </div>
                </div>

                <div className="shrink-0 pl-2">
                  {isSelected ? (
                    <div className="flex size-5 items-center justify-center rounded-full bg-[#ff6200] text-white">
                      <Check className="size-3 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="size-5 rounded-full border border-zinc-700" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-5 border-t border-zinc-800/80 pt-3 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
