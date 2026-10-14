import { useState } from "react";
import { Check, PenTool, X } from "lucide-react";
import { toast } from "sonner";
import type { CorporateSignatureItem, SignatureData } from "@/types/templates";
import { renderSignatureHtml } from "./templates-data";

interface SignatureEditorModalProps {
  isOpen: boolean;
  signature: CorporateSignatureItem | null;
  currentData: SignatureData;
  onClose: () => void;
  onSave: (data: SignatureData, setAsDefault: boolean) => boolean;
}

export function SignatureEditorModal({
  isOpen,
  signature,
  currentData,
  onClose,
  onSave,
}: SignatureEditorModalProps) {
  const [data, setData] = useState<SignatureData>({ ...currentData });
  const [isDefault, setIsDefault] = useState(true);

  if (!isOpen || !signature) return null;

  const previewHtml = renderSignatureHtml(signature.htmlTemplate, data);

  const handleSave = () => {
    if (!data.nome.trim()) {
      toast.error("O nome na assinatura não pode ficar vazio.");
      return;
    }

    if (onSave(data, isDefault)) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative flex h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-[#0e1118] text-white shadow-2xl">
        {/* Topbar */}
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-800/80 px-5 py-3.5 bg-[#121520]">
          <div className="flex items-center gap-3">
            <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <PenTool className="size-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white">Editar Assinatura: {signature.nome}</h3>
              <p className="text-[11px] text-zinc-400">
                Preencha os dados oficiais de contato para os e-mails da sua organização
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            <X className="size-4.5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          <div className="w-full lg:w-1/2 overflow-y-auto p-5 border-r border-zinc-800/80 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-zinc-300">Nome Completo</label>
                <input
                  type="text"
                  value={data.nome}
                  onChange={(e) => setData({ ...data, nome: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-[#141824] px-3 py-1.5 text-xs text-white focus:border-[#ff6200] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-300">Cargo / Função</label>
                <input
                  type="text"
                  value={data.cargo}
                  onChange={(e) => setData({ ...data, cargo: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-[#141824] px-3 py-1.5 text-xs text-white focus:border-[#ff6200] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-zinc-300">Empresa</label>
                <input
                  type="text"
                  value={data.empresa}
                  onChange={(e) => setData({ ...data, empresa: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-[#141824] px-3 py-1.5 text-xs text-white focus:border-[#ff6200] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-300">
                  Telefone / Celular
                </label>
                <input
                  type="text"
                  value={data.telefone}
                  onChange={(e) => setData({ ...data, telefone: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-[#141824] px-3 py-1.5 text-xs text-white focus:border-[#ff6200] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-zinc-300">E-mail Comercial</label>
                <input
                  type="email"
                  value={data.email}
                  onChange={(e) => setData({ ...data, email: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-[#141824] px-3 py-1.5 text-xs text-white focus:border-[#ff6200] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-300">Website</label>
                <input
                  type="text"
                  value={data.site}
                  onChange={(e) => setData({ ...data, site: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-[#141824] px-3 py-1.5 text-xs text-white focus:border-[#ff6200] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-zinc-300">Endereço / Cidade</label>
              <input
                type="text"
                value={data.endereco || ""}
                onChange={(e) => setData({ ...data, endereco: e.target.value })}
                className="mt-1 w-full rounded-lg border border-zinc-800 bg-[#141824] px-3 py-1.5 text-xs text-white focus:border-[#ff6200] focus:outline-none"
              />
            </div>

            <div className="pt-2 border-t border-zinc-800">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="size-4 rounded border-zinc-700 bg-zinc-900 text-[#ff6200] focus:ring-[#ff6200]"
                />
                <span className="text-xs font-semibold text-zinc-300">
                  Definir como assinatura padrão da organização
                </span>
              </label>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="rounded-xl bg-[#ff6200] px-5 py-2 text-xs font-bold text-white shadow-lg hover:bg-[#e65800] active:scale-[0.98]"
              >
                Salvar Assinatura
              </button>
            </div>
          </div>

          {/* Prévia da Assinatura */}
          <div className="hidden lg:flex w-1/2 overflow-y-auto bg-[#07090e] p-6 items-center justify-center">
            <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-5 text-zinc-900 shadow-xl">
              <div className="w-full" dangerouslySetInnerHTML={{ __html: previewHtml }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
