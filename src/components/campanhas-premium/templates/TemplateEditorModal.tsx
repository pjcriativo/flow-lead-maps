import { useState } from "react";
import { Edit3, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import type { CustomTemplateItem, EmailTemplateItem, TemplateVariables } from "@/types/templates";
import { interpolateVariables } from "./templates-data";

interface TemplateEditorModalProps {
  isOpen: boolean;
  template: EmailTemplateItem | null;
  initialVariables: TemplateVariables;
  onClose: () => void;
  onSave: (
    customTemplate: Partial<CustomTemplateItem> & {
      nome: string;
      categoria: EmailTemplateItem["categoria"];
    },
  ) => boolean;
}

export function TemplateEditorModal({
  isOpen,
  template,
  initialVariables,
  onClose,
  onSave,
}: TemplateEditorModalProps) {
  const [nome, setNome] = useState(template?.nome || "");
  const [assunto, setAssunto] = useState(template?.assuntoPadrao || "");
  const [preheader, setPreheader] = useState(template?.preheaderPadrao || "");
  const [ctaTexto, setCtaTexto] = useState(template?.ctaTexto || "Saiba mais");
  const [ctaUrl, setCtaUrl] = useState(template?.ctaUrl || "https://flowbusiness.com.br");
  const [vars, setVars] = useState<TemplateVariables>(initialVariables);

  if (!isOpen || !template) return null;

  const currentVars: TemplateVariables = {
    ...initialVariables,
    ...vars,
  };

  const previewHtml = interpolateVariables(template.conteudoHtml, currentVars);

  const handleSave = () => {
    if (!nome.trim()) {
      toast.error("Informe um nome para o modelo personalizado.");
      return;
    }

    const saved = onSave({
      id: template.isPersonalizado ? template.id : undefined,
      nome: nome.trim(),
      descricao: `Modelo personalizado baseado em ${template.nome}`,
      categoria: template.categoria,
      assuntoPadrao: assunto,
      preheaderPadrao: preheader,
      ctaTexto,
      ctaUrl,
      conteudoHtml: template.conteudoHtml,
      temaEscuro: template.temaEscuro,
    });

    if (saved) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-[#0e1118] text-white shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-800/80 px-5 py-3.5 bg-[#121520]">
          <div className="flex items-center gap-3">
            <span className="flex size-7 items-center justify-center rounded-lg bg-[#ff6200]/20 text-[#ff6200]">
              <Edit3 className="size-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white">Personalizar Modelo: {template.nome}</h3>
              <p className="text-[11px] text-zinc-400">
                Edite os parâmetros da mensagem e salve na sua organização
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

        {/* Content Form + Live Preview */}
        <div className="flex flex-1 overflow-hidden">
          {/* Formulário de Edição */}
          <div className="w-full lg:w-1/2 overflow-y-auto p-5 border-r border-zinc-800/80 space-y-4">
            <div>
              <label className="text-xs font-semibold text-zinc-300">
                Nome do Modelo Personalizado
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Apresentação Comercial - Setor Imobiliário"
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-[#141824] px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-[#ff6200] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300">Assunto do E-mail</label>
              <input
                type="text"
                value={assunto}
                onChange={(e) => setAssunto(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-[#141824] px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-[#ff6200] focus:outline-none"
              />
              <span className="text-[10px] text-zinc-500">
                Suporta variáveis dinâmicas como {"{{empresa}}"}
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300">
                Preheader (Texto de Apoio)
              </label>
              <input
                type="text"
                value={preheader}
                onChange={(e) => setPreheader(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-[#141824] px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-[#ff6200] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-zinc-300">Texto do Botão (CTA)</label>
                <input
                  type="text"
                  value={ctaTexto}
                  onChange={(e) => setCtaTexto(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-800 bg-[#141824] px-3 py-2 text-xs text-white focus:border-[#ff6200] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-300">Link do Botão (URL)</label>
                <input
                  type="text"
                  value={ctaUrl}
                  onChange={(e) => setCtaUrl(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-800 bg-[#141824] px-3 py-2 text-xs text-white focus:border-[#ff6200] focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-800">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                Dados do Remetente
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-zinc-400">Nome do Remetente</label>
                  <input
                    type="text"
                    value={currentVars.nome_remetente || ""}
                    onChange={(e) => setVars({ ...vars, nome_remetente: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-zinc-800 bg-[#141824] px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400">Empresa do Remetente</label>
                  <input
                    type="text"
                    value={currentVars.empresa_remetente || ""}
                    onChange={(e) => setVars({ ...vars, empresa_remetente: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-zinc-800 bg-[#141824] px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={currentVars.telefone_remetente || ""}
                    onChange={(e) => setVars({ ...vars, telefone_remetente: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-zinc-800 bg-[#141824] px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400">Website</label>
                  <input
                    type="text"
                    value={currentVars.site_remetente || ""}
                    onChange={(e) => setVars({ ...vars, site_remetente: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-zinc-800 bg-[#141824] px-3 py-1.5 text-xs text-white"
                  />
                </div>
              </div>
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
                Salvar Modelo Personalizado
              </button>
            </div>
          </div>

          {/* Prévia ao vivo */}
          <div className="hidden lg:flex w-1/2 overflow-y-auto bg-[#07090e] p-6 items-start justify-center">
            <div className="w-[480px] overflow-hidden rounded-xl border border-zinc-800 bg-[#12151f] shadow-2xl">
              <div className="border-b border-zinc-800/80 bg-[#181c2b] px-4 py-2 text-[11px]">
                <div className="text-zinc-500 font-semibold mb-0.5">Assunto simulado:</div>
                <div className="text-white font-bold truncate">
                  {interpolateVariables(assunto, currentVars)}
                </div>
              </div>
              <div
                className="scale-90 origin-top"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
