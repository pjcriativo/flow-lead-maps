import React, { useState } from "react";
import {
  Edit3,
  Save,
  Eye,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  Link as LinkIcon,
  Image as ImageIcon,
  ChevronDown,
  Clock,
  Type,
  Square,
  Minus,
  GripVertical,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { StudioCampaignDraft, StudioEmailBlock } from "@/types/campaign-studio";
import { toast } from "sonner";

interface EditorEmailCanvasProps {
  draft: StudioCampaignDraft;
  onChangeDraft: (updater: (prev: StudioCampaignDraft) => StudioCampaignDraft) => void;
  onSaveDraft: () => void;
  onOpenPreview: () => void;
  onChangeTemplate: () => void;
}

export function EditorEmailCanvas({
  draft,
  onChangeDraft,
  onSaveDraft,
  onOpenPreview,
  onChangeTemplate,
}: EditorEmailCanvasProps) {
  const [selectedBlockId, setSelectedBlockId] = useState<string>("bloco-mensagem");
  const [fontSize, setFontSize] = useState("14");
  const [fontFamily, setFontFamily] = useState("Inter");
  const [isFormattingActive, setIsFormattingActive] = useState({
    bold: false,
    italic: false,
    underline: false,
    align: "left",
  });

  const handleToggleBlock = (blockId: string) => {
    onChangeDraft((prev) => ({
      ...prev,
      blocos: prev.blocos.map((b) =>
        b.id === blockId ? { ...b, ativo: !b.ativo } : b,
      ),
    }));
  };

  const handleAddBlock = (tipo: StudioEmailBlock["tipo"], titulo: string) => {
    const newBlock: StudioEmailBlock = {
      id: `bloco-${Date.now()}`,
      tipo,
      titulo,
      subtitulo: `Novo elemento adicionado`,
      ativo: true,
    };
    onChangeDraft((prev) => ({
      ...prev,
      blocos: [...prev.blocos, newBlock],
    }));
    toast.success(`Elemento "${titulo}" adicionado ao e-mail.`);
  };

  return (
    <div className="flex flex-1 flex-col rounded-2xl border border-zinc-800/80 bg-[#10131b] p-4 text-white shadow-sm min-w-0">
      {/* 1. Header do Editor */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/70 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 items-center justify-center rounded-lg bg-[#ff6200]/10 text-[#ff6200]">
            <Edit3 className="size-4" />
          </div>
          <h3 className="text-sm font-bold text-white tracking-wide">
            Editor do e-mail
          </h3>
          <button
            type="button"
            onClick={onChangeTemplate}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-700/80 bg-[#141824] px-2.5 py-1 text-[11px] font-semibold text-zinc-300 hover:border-[#ff6200] hover:text-white transition-colors"
          >
            <span>Template base:</span>
            <span className="text-white font-bold">{draft.templateNome}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSaveDraft}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <Save className="size-3.5" />
            <span>Salvar rascunho</span>
          </button>

          <button
            type="button"
            onClick={onOpenPreview}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <Eye className="size-3.5" />
            <span>Pré-visualizar</span>
          </button>
        </div>
      </div>

      {/* 2. Campo de Assunto do E-mail */}
      <div className="pt-3">
        <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
          Assunto do e-mail
        </label>
        <input
          type="text"
          value={draft.assunto}
          onChange={(e) =>
            onChangeDraft((prev) => ({ ...prev, assunto: e.target.value }))
          }
          placeholder="Digite o assunto que chamará a atenção do destinatário..."
          className="h-10 w-full rounded-xl border border-zinc-800 bg-[#0d1017] px-3 text-xs font-medium text-white placeholder-zinc-500 focus:border-[#ff6200] focus:outline-none transition-colors"
        />
      </div>

      {/* 3. Barra Superior de Formatação Rica */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5 rounded-xl border border-zinc-800 bg-[#0d1017] p-1.5 text-zinc-300">
        {/* Seletor de Fonte */}
        <select
          value={fontFamily}
          onChange={(e) => setFontFamily(e.target.value)}
          className="h-7 rounded-lg border border-zinc-800 bg-[#141824] px-2 text-[11px] font-semibold text-zinc-200 focus:outline-none"
        >
          <option value="Inter">Inter</option>
          <option value="Roboto">Roboto</option>
          <option value="Arial">Arial</option>
          <option value="Georgia">Georgia</option>
        </select>

        {/* Seletor de Tamanho */}
        <select
          value={fontSize}
          onChange={(e) => setFontSize(e.target.value)}
          className="h-7 rounded-lg border border-zinc-800 bg-[#141824] px-2 text-[11px] font-semibold text-zinc-200 focus:outline-none"
        >
          <option value="12">12</option>
          <option value="14">14</option>
          <option value="16">16</option>
          <option value="18">18</option>
          <option value="20">20</option>
        </select>

        <div className="h-4 w-[1px] bg-zinc-800 mx-0.5" />

        {/* Botões B, I, U */}
        <button
          type="button"
          onClick={() =>
            setIsFormattingActive((prev) => ({ ...prev, bold: !prev.bold }))
          }
          className={cn(
            "flex size-7 items-center justify-center rounded-lg hover:bg-zinc-800",
            isFormattingActive.bold && "bg-zinc-800 text-[#ff6200]",
          )}
        >
          <Bold className="size-3.5" />
        </button>

        <button
          type="button"
          onClick={() =>
            setIsFormattingActive((prev) => ({ ...prev, italic: !prev.italic }))
          }
          className={cn(
            "flex size-7 items-center justify-center rounded-lg hover:bg-zinc-800",
            isFormattingActive.italic && "bg-zinc-800 text-[#ff6200]",
          )}
        >
          <Italic className="size-3.5" />
        </button>

        <button
          type="button"
          onClick={() =>
            setIsFormattingActive((prev) => ({ ...prev, underline: !prev.underline }))
          }
          className={cn(
            "flex size-7 items-center justify-center rounded-lg hover:bg-zinc-800",
            isFormattingActive.underline && "bg-zinc-800 text-[#ff6200]",
          )}
        >
          <Underline className="size-3.5" />
        </button>

        <div className="h-4 w-[1px] bg-zinc-800 mx-0.5" />

        {/* Alinhamentos */}
        <button
          type="button"
          onClick={() =>
            setIsFormattingActive((prev) => ({ ...prev, align: "left" }))
          }
          className={cn(
            "flex size-7 items-center justify-center rounded-lg hover:bg-zinc-800",
            isFormattingActive.align === "left" && "bg-zinc-800 text-white",
          )}
        >
          <AlignLeft className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() =>
            setIsFormattingActive((prev) => ({ ...prev, align: "center" }))
          }
          className={cn(
            "flex size-7 items-center justify-center rounded-lg hover:bg-zinc-800",
            isFormattingActive.align === "center" && "bg-zinc-800 text-white",
          )}
        >
          <AlignCenter className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() =>
            setIsFormattingActive((prev) => ({ ...prev, align: "right" }))
          }
          className={cn(
            "flex size-7 items-center justify-center rounded-lg hover:bg-zinc-800",
            isFormattingActive.align === "right" && "bg-zinc-800 text-white",
          )}
        >
          <AlignRight className="size-3.5" />
        </button>

        <button
          type="button"
          className="flex size-7 items-center justify-center rounded-lg hover:bg-zinc-800"
        >
          <List className="size-3.5" />
        </button>

        <div className="h-4 w-[1px] bg-zinc-800 mx-0.5" />

        <button
          type="button"
          className="flex size-7 items-center justify-center rounded-lg hover:bg-zinc-800"
        >
          <LinkIcon className="size-3.5" />
        </button>

        <button
          type="button"
          className="flex size-7 items-center justify-center rounded-lg hover:bg-zinc-800"
        >
          <ImageIcon className="size-3.5" />
        </button>

        {/* Dropdown Variáveis */}
        <div className="ml-auto relative">
          <button
            type="button"
            onClick={() =>
              toast.info("Clique nas variáveis da coluna esquerda para inseri-las no e-mail.")
            }
            className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-[#141824] px-2.5 py-1 text-[11px] font-semibold text-zinc-300 hover:text-white"
          >
            <span>Variáveis</span>
            <ChevronDown className="size-3" />
          </button>
        </div>
      </div>

      {/* 4. Canvas Central do E-mail com Barra Lateral de Ferramentas */}
      <div className="relative mt-4 flex gap-3 flex-1 min-h-[460px]">
        {/* Folha do E-mail (Preview Interativo Fiel à Referência) */}
        <div className="flex-1 rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-900 shadow-lg min-h-[440px] flex flex-col justify-between select-none">
          {/* Header da Mensagem */}
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-[#ff6200] font-black text-sm">⚡</span>
              <span className="text-sm font-extrabold tracking-tight text-zinc-900">
                Flow Business
              </span>
            </div>
            <span className="text-[11px] font-medium text-zinc-400">
              Soluções para seu crescimento
            </span>
          </div>

          {/* Corpo do E-mail */}
          <div className="my-5 space-y-4">
            <div className="flex flex-col md:flex-row items-start justify-between gap-5">
              <div className="flex-1 space-y-3">
                <h2 className="text-lg sm:text-xl font-extrabold text-zinc-900 leading-tight">
                  Vamos impulsionar o{" "}
                  <span className="text-[#ff6200]">crescimento da sua clínica?</span>
                </h2>

                <p className="text-xs sm:text-[13px] text-zinc-600 leading-relaxed">
                  Olá <strong className="text-zinc-800 font-bold">{"{{nome}}"}</strong>,
                </p>
                <p className="text-xs sm:text-[13px] text-zinc-600 leading-relaxed">
                  Vi que a <strong className="text-zinc-800 font-bold">{"{{empresa}}"}</strong> é
                  referência em odontologia em Curitiba e acredito que podemos explorar
                  juntos novas oportunidades para atrair mais pacientes.
                </p>

                <div className="pt-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#ff6200] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-[#ff6200]/25 transition-transform hover:scale-[1.02]"
                  >
                    <span>Quero conversar sobre essa oportunidade</span>
                    <span>→</span>
                  </button>
                </div>
              </div>

              {/* Foto Ilustrativa Lateral com Selo Flutuante */}
              <div className="relative w-44 h-32 rounded-xl overflow-hidden border border-zinc-200 shrink-0 shadow-sm">
                <img
                  src="/images/templates/proposta-servicos.png"
                  alt="Clínica Moderna"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-2 text-white">
                  <div className="text-[9px] font-bold leading-tight">
                    Mais pacientes
                  </div>
                  <div className="text-[8px] text-zinc-300">
                    Mais resultados para sua clínica
                  </div>
                </div>
              </div>
            </div>

            {/* Micro-cards de Benefícios (3 colunas) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 border-t border-zinc-100">
              <div className="flex items-center gap-2 rounded-xl bg-zinc-50 border border-zinc-200/80 p-2 text-[11px]">
                <span className="size-6 rounded-lg bg-orange-100 text-[#ff6200] flex items-center justify-center font-bold">
                  👥
                </span>
                <span className="font-semibold text-zinc-700 leading-tight">
                  Mais pacientes qualificados
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-zinc-50 border border-zinc-200/80 p-2 text-[11px]">
                <span className="size-6 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                  ⚡
                </span>
                <span className="font-semibold text-zinc-700 leading-tight">
                  Crescimento previsível
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-zinc-50 border border-zinc-200/80 p-2 text-[11px]">
                <span className="size-6 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                  🛡️
                </span>
                <span className="font-semibold text-zinc-700 leading-tight">
                  Parceria de longo prazo
                </span>
              </div>
            </div>
          </div>

          {/* Rodapé e Assinatura */}
          <div className="border-t border-zinc-200 pt-3 flex items-center justify-between text-xs text-zinc-600">
            <div>
              <div className="text-[11px] text-zinc-400">Atenciosamente,</div>
              <div className="font-bold text-zinc-900 mt-0.5">{draft.remetenteNome}</div>
              <div className="text-[11px] text-zinc-500">
                {draft.assinaturaNome} | Flow Business
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-400">
              <span className="text-[#ff6200] font-black text-xs">⚡</span>
              <span className="text-[11px] font-bold text-zinc-800">Flow Business</span>
            </div>
          </div>
        </div>

        {/* Barra Vertical de Ferramentas / Elementos (Aa Texto, Botão, Imagem, Separador) */}
        <div className="flex flex-col gap-2 rounded-2xl border border-zinc-800/80 bg-[#0d1017] p-2 shrink-0">
          <button
            type="button"
            onClick={() => handleAddBlock("texto", "Bloco de Texto")}
            className="flex flex-col items-center justify-center size-14 rounded-xl border border-zinc-800 bg-[#141824] p-1.5 text-zinc-400 hover:border-[#ff6200] hover:text-white transition-colors"
          >
            <span className="text-sm font-bold">Aa</span>
            <span className="text-[10px] font-semibold mt-0.5">Texto</span>
          </button>

          <button
            type="button"
            onClick={() => handleAddBlock("botao", "Botão CTA")}
            className="flex flex-col items-center justify-center size-14 rounded-xl border border-zinc-800 bg-[#141824] p-1.5 text-zinc-400 hover:border-[#ff6200] hover:text-white transition-colors"
          >
            <Square className="size-4" />
            <span className="text-[10px] font-semibold mt-0.5">Botão</span>
          </button>

          <button
            type="button"
            onClick={() => handleAddBlock("imagem", "Imagem")}
            className="flex flex-col items-center justify-center size-14 rounded-xl border border-zinc-800 bg-[#141824] p-1.5 text-zinc-400 hover:border-[#ff6200] hover:text-white transition-colors"
          >
            <ImageIcon className="size-4" />
            <span className="text-[10px] font-semibold mt-0.5">Imagem</span>
          </button>

          <button
            type="button"
            onClick={() => handleAddBlock("separador", "Separador")}
            className="flex flex-col items-center justify-center size-14 rounded-xl border border-zinc-800 bg-[#141824] p-1.5 text-zinc-400 hover:border-[#ff6200] hover:text-white transition-colors"
          >
            <Minus className="size-4" />
            <span className="text-[10px] font-semibold mt-0.5">Separador</span>
          </button>
        </div>
      </div>

      {/* 5. Navegador de Blocos do Template */}
      <div className="mt-4 pt-3 border-t border-zinc-800/60">
        <div className="text-xs font-bold text-white mb-2">Blocos do template</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {draft.blocos.map((bloco) => (
            <div
              key={bloco.id}
              onClick={() => setSelectedBlockId(bloco.id)}
              className={cn(
                "flex items-center gap-2 rounded-xl border p-2 cursor-pointer transition-all",
                selectedBlockId === bloco.id
                  ? "border-[#ff6200] bg-[#ff6200]/10"
                  : "border-zinc-800 bg-[#0d1017] hover:border-zinc-700",
              )}
            >
              <GripVertical className="size-3 text-zinc-500 shrink-0" />
              <div className="min-w-0 flex-1 leading-tight">
                <div className="text-xs font-bold text-white truncate">{bloco.titulo}</div>
                <div className="text-[10px] text-zinc-500 truncate">{bloco.subtitulo}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Indicador de Última Edição */}
      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-zinc-500">
        <Clock className="size-3" />
        <span>Última edição há 2 min</span>
      </div>
    </div>
  );
}
