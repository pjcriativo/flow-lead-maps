import { useState } from "react";
import {
  Check,
  Code,
  Copy,
  Laptop,
  Maximize2,
  Minimize2,
  Smartphone,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { EmailTemplateItem, TemplateVariables } from "@/types/templates";
import { interpolateVariables } from "./templates-data";

interface TemplatePreviewModalProps {
  isOpen: boolean;
  template: EmailTemplateItem | null;
  variables: TemplateVariables;
  onClose: () => void;
  onPersonalizar: (template: EmailTemplateItem) => void;
  onUseTemplate: (template: EmailTemplateItem) => void;
}

export function TemplatePreviewModal({
  isOpen,
  template,
  variables,
  onClose,
  onPersonalizar,
  onUseTemplate,
}: TemplatePreviewModalProps) {
  const [deviceView, setDeviceView] = useState<"desktop" | "mobile">("desktop");
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !template) return null;

  const renderedHtml = interpolateVariables(template.conteudoHtml, variables);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(renderedHtml);
      setCopied(true);
      toast.success("Código HTML copiado com sucesso!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar o código.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-[#0e1118] text-white shadow-2xl">
        {/* Topbar do Modal */}
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-800/80 px-5 py-3.5 bg-[#121520]">
          <div className="flex items-center gap-3">
            <span className="flex size-7 items-center justify-center rounded-lg bg-[#ff6200]/20 text-[#ff6200]">
              <Sparkles className="size-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">{template.nome}</h3>
                <span className="rounded-md border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-zinc-300">
                  {template.categoriaLabel}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Prévia de renderização compatível com clientes de e-mail
              </p>
            </div>
          </div>

          {/* Alternador de dispositivos & Ações do Topbar */}
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-xl border border-zinc-800 bg-[#090c12] p-0.5">
              <button
                type="button"
                onClick={() => setDeviceView("desktop")}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  deviceView === "desktop"
                    ? "bg-zinc-800 text-white shadow-sm font-bold"
                    : "text-zinc-400 hover:text-white",
                )}
              >
                <Laptop className="size-3.5" />
                <span>Desktop (600px)</span>
              </button>
              <button
                type="button"
                onClick={() => setDeviceView("mobile")}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  deviceView === "mobile"
                    ? "bg-zinc-800 text-white shadow-sm font-bold"
                    : "text-zinc-400 hover:text-white",
                )}
              >
                <Smartphone className="size-3.5" />
                <span>Mobile (375px)</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowCode(!showCode)}
              className={cn(
                "flex items-center gap-1.5 rounded-xl border border-zinc-800 px-3 py-1.5 text-xs font-medium transition-colors",
                showCode
                  ? "bg-[#ff6200] text-white font-bold"
                  : "bg-zinc-800/60 text-zinc-300 hover:bg-zinc-800",
              )}
            >
              <Code className="size-3.5" />
              <span>{showCode ? "Ver Layout" : "Ver HTML"}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyCode}
              title="Copiar HTML"
              className="flex size-8 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-800/60 text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
            >
              {copied ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
            >
              <X className="size-4.5" />
            </button>
          </div>
        </div>

        {/* Corpo com visualização do e-mail e painel de parâmetros */}
        <div className="flex flex-1 overflow-hidden">
          {/* Área de Visualização do E-mail */}
          <div className="flex-1 overflow-y-auto bg-[#07090e] p-4 sm:p-8 flex items-start justify-center">
            {showCode ? (
              <pre className="w-full max-w-3xl overflow-x-auto rounded-xl border border-zinc-800 bg-[#090c12] p-4 text-[12px] font-mono leading-relaxed text-zinc-300">
                {renderedHtml}
              </pre>
            ) : (
              <div
                className={cn(
                  "overflow-hidden rounded-2xl border border-zinc-800/90 bg-[#12151f] shadow-2xl transition-all duration-300",
                  deviceView === "desktop" ? "w-[600px]" : "w-[375px]",
                )}
              >
                {/* Cabeçalho do Cliente de E-mail Simulado */}
                <div className="border-b border-zinc-800/80 bg-[#181c2b] px-4 py-3 text-xs">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-zinc-500 font-semibold">Assunto:</span>
                    <span className="font-semibold text-white truncate">
                      {interpolateVariables(template.assuntoPadrao, variables)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500">De:</span>
                    <span className="text-zinc-300">
                      {variables.nome_remetente || "Remetente não configurado"}
                    </span>
                  </div>
                </div>

                {/* E-mail Real Renderizado */}
                <div
                  className="w-full bg-inherit"
                  dangerouslySetInnerHTML={{ __html: renderedHtml }}
                />
              </div>
            )}
          </div>

          {/* Painel Lateral com Informações e Variáveis */}
          <div className="hidden lg:flex w-80 shrink-0 flex-col border-l border-zinc-800/80 bg-[#0e121b] p-5 overflow-y-auto">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Informações do Modelo
            </h4>
            <p className="mt-2 text-xs leading-relaxed text-zinc-300">{template.descricao}</p>

            <div className="my-4 border-t border-zinc-800" />

            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Campos Dinâmicos
            </h4>
            <p className="mt-1 text-[11px] text-zinc-400">
              Preenchidos automaticamente com base no perfil da organização ativa:
            </p>

            <div className="mt-3 space-y-2">
              {template.variaveisSuportadas.map((tag) => (
                <div
                  key={tag}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 bg-[#141824] px-2.5 py-1.5 text-xs"
                >
                  <code className="text-[11px] text-amber-400">{`{{${tag}}}`}</code>
                  <span className="max-w-[130px] truncate text-[11px] font-medium text-zinc-300">
                    {variables[tag] || "Automático"}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-6 space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  onPersonalizar(template);
                  onClose();
                }}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 py-2.5 text-xs font-bold text-white transition-all hover:bg-zinc-800"
              >
                Personalizar este template
              </button>

              <button
                type="button"
                onClick={() => {
                  onUseTemplate(template);
                  onClose();
                }}
                className="w-full rounded-xl bg-[#ff6200] py-2.5 text-xs font-bold text-white shadow-lg transition-all hover:bg-[#e65800] active:scale-[0.98]"
              >
                Usar template em campanha
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
