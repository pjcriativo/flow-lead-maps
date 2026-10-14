import React, { useState } from "react";
import { X, Search, LayoutTemplate, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { OFFICIAL_EMAIL_TEMPLATES } from "../templates/templates-data";
import type { EmailTemplateItem } from "@/types/templates";

interface ModalSelecionarTemplateProps {
  isOpen: boolean;
  selectedTemplateId: string;
  onClose: () => void;
  onSelectTemplate: (template: EmailTemplateItem) => void;
}

export function ModalSelecionarTemplate({
  isOpen,
  selectedTemplateId,
  onClose,
  onSelectTemplate,
}: ModalSelecionarTemplateProps) {
  const [search, setSearch] = useState("");

  if (!isOpen) return null;

  const filtered = OFFICIAL_EMAIL_TEMPLATES.filter(
    (t) =>
      t.nome.toLowerCase().includes(search.toLowerCase()) ||
      t.descricao.toLowerCase().includes(search.toLowerCase()) ||
      t.categoriaLabel.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-2xl border border-zinc-800 bg-[#10131b] text-white shadow-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#ff6200]/10 text-[#ff6200]">
              <LayoutTemplate className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Escolher template base</h3>
              <p className="text-[11px] text-zinc-400">
                Selecione um modelo da Biblioteca para aplicar sua estrutura ao e-mail
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
            placeholder="Buscar template por nome ou categoria..."
            className="h-9 w-full rounded-xl border border-zinc-800 bg-[#0d1017] pl-9 pr-3 text-xs text-white placeholder-zinc-500 focus:border-[#ff6200] focus:outline-none"
          />
        </div>

        {/* Grid de Templates */}
        <div className="mt-4 max-h-[60vh] overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pr-1">
          {filtered.map((t) => {
            const isSelected = t.id === selectedTemplateId;
            return (
              <div
                key={t.id}
                onClick={() => {
                  onSelectTemplate(t);
                  onClose();
                }}
                className={cn(
                  "group relative flex flex-col justify-between rounded-xl border p-2.5 cursor-pointer transition-all",
                  isSelected
                    ? "border-[#ff6200] bg-[#ff6200]/10 shadow-lg shadow-[#ff6200]/15"
                    : "border-zinc-800 bg-[#141824] hover:border-zinc-700",
                )}
              >
                {/* Miniatura com Imagem Real */}
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-zinc-900 border border-zinc-800">
                  <img
                    src={`/images/templates/${t.id}.png`}
                    alt={t.nome}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        "/images/templates/apresentacao-comercial.png";
                    }}
                  />
                  {isSelected && (
                    <div className="absolute top-2 right-2 flex size-5 items-center justify-center rounded-full bg-[#ff6200] text-white shadow-md">
                      <Check className="size-3 stroke-[3]" />
                    </div>
                  )}
                </div>

                <div className="mt-2">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-white truncate">{t.nome}</span>
                    <span className="shrink-0 rounded-md border border-zinc-700/60 bg-zinc-800/80 px-1.5 py-0.2 text-[9px] font-semibold text-zinc-300">
                      {t.categoriaLabel}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[10.5px] leading-relaxed text-zinc-400">
                    {t.descricao}
                  </p>
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
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
