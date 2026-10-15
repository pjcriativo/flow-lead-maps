import { Search, UserCheck, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import type { StudioLeadOption } from "@/services/campaign-studio-service";

interface ModalSelecionarDestinatariosProps {
  isOpen: boolean;
  leads: StudioLeadOption[];
  selectedIds: string[];
  onClose: () => void;
  onConfirm: (selectedIds: string[]) => void;
}

export function ModalSelecionarDestinatarios({
  isOpen,
  leads,
  selectedIds,
  onClose,
  onConfirm,
}: ModalSelecionarDestinatariosProps) {
  const [search, setSearch] = useState("");
  const [selection, setSelection] = useState(() => new Set(selectedIds));
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query
      ? leads.filter((lead) => `${lead.nome} ${lead.email ?? ""}`.toLowerCase().includes(query))
      : leads;
  }, [leads, search]);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl border border-zinc-800 bg-[#10131b] p-5 text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div>
            <h3 className="text-sm font-bold">Selecionar destinatários</h3>
            <p className="text-[11px] text-zinc-400">
              A seleção não comprova elegibilidade para marketing.
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-zinc-400">
            <X className="size-4" />
          </button>
        </div>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-500" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar nome ou e-mail..."
            className="h-9 w-full rounded-xl border border-zinc-800 bg-[#0d1017] pl-9 pr-3 text-xs outline-none focus:border-[#ff6200]"
          />
        </div>
        <div className="mt-3 max-h-80 space-y-1 overflow-y-auto">
          {filtered.map((lead) => (
            <label
              key={lead.id}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-800 p-3 hover:bg-zinc-900"
            >
              <Checkbox
                checked={selection.has(lead.id)}
                onCheckedChange={() =>
                  setSelection((current) => {
                    const next = new Set(current);
                    if (next.has(lead.id)) next.delete(lead.id);
                    else next.add(lead.id);
                    return next;
                  })
                }
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold">{lead.nome}</span>
                <span className="block truncate text-[11px] text-zinc-400">
                  {lead.email ?? "Sem e-mail"}
                </span>
              </span>
              <span className="text-[10px] text-amber-400">
                {lead.elegibilidade === "nao_validado"
                  ? "Não validado"
                  : lead.elegibilidade === "descadastro"
                    ? "Descadastrado"
                    : "Sem e-mail"}
              </span>
            </label>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-zinc-800 pt-4">
          <span className="text-xs text-zinc-400">{selection.size} selecionados</span>
          <button
            type="button"
            onClick={() => {
              onConfirm([...selection]);
              onClose();
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-[#ff6200] px-4 py-2 text-xs font-bold"
          >
            <UserCheck className="size-3.5" />
            Confirmar seleção
          </button>
        </div>
      </div>
    </div>
  );
}
