import { useMemo, useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  Bold,
  Copy,
  Edit3,
  Image as ImageIcon,
  Italic,
  Columns2,
  Link as LinkIcon,
  Minus,
  Plus,
  Space,
  Square,
  Trash2,
  Type,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  CAMPAIGN_VARIABLES,
  addEmailBlock,
  duplicateEmailBlock,
  moveEmailBlock,
  removeEmailBlock,
  renderEmailPreview,
  updateEmailBlock,
  type EditableEmailDocument,
  type EmailBlockPatch,
} from "@/lib/campaign-email-editor";
import type { BlockType, StudioCampaignDraft } from "@/types/campaign-studio";

interface EditorEmailCanvasProps {
  draft: StudioCampaignDraft;
  onChangeDraft: (updater: (prev: StudioCampaignDraft) => StudioCampaignDraft) => void;
  onChangeTemplate: () => void;
}

const ADDABLE_BLOCKS: Array<{
  tipo: BlockType;
  label: string;
  icon: typeof Type;
}> = [
  { tipo: "titulo", label: "Titulo", icon: Type },
  { tipo: "texto", label: "Texto", icon: Type },
  { tipo: "botao", label: "Botao", icon: Square },
  { tipo: "imagem", label: "Imagem", icon: ImageIcon },
  { tipo: "separador", label: "Separador", icon: Minus },
  { tipo: "espacamento", label: "Espaco", icon: Space },
  { tipo: "duas_colunas", label: "2 colunas", icon: Columns2 },
];

function documentFromDraft(draft: StudioCampaignDraft): EditableEmailDocument {
  return { html: draft.templateHtmlSnapshot, blocks: draft.blocos };
}

export function EditorEmailCanvas({
  draft,
  onChangeDraft,
  onChangeTemplate,
}: EditorEmailCanvasProps) {
  const [selectedBlockId, setSelectedBlockId] = useState(draft.blocos[0]?.id ?? "");
  const selectedBlock =
    draft.blocos.find((block) => block.id === selectedBlockId) ?? draft.blocos[0] ?? null;
  const previewHtml = useMemo(
    () => renderEmailPreview(draft.templateHtmlSnapshot),
    [draft.templateHtmlSnapshot],
  );

  const applyDocument = (document: EditableEmailDocument) => {
    onChangeDraft((current) => ({
      ...current,
      templateHtmlSnapshot: document.html,
      blocos: document.blocks,
    }));
  };

  const patchSelectedBlock = (patch: EmailBlockPatch) => {
    if (!selectedBlock) return;
    try {
      applyDocument(updateEmailBlock(documentFromDraft(draft), selectedBlock.id, patch));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel editar o bloco.");
    }
  };

  const handleAddBlock = (tipo: BlockType) => {
    const next = addEmailBlock(documentFromDraft(draft), tipo);
    applyDocument(next);
    setSelectedBlockId(next.blocks.at(-1)?.id ?? "");
  };

  const handleBlockAction = (action: "duplicate" | "remove" | "up" | "down") => {
    if (!selectedBlock) return;
    try {
      const current = documentFromDraft(draft);
      const next =
        action === "duplicate"
          ? duplicateEmailBlock(current, selectedBlock.id)
          : action === "remove"
            ? removeEmailBlock(current, selectedBlock.id)
            : moveEmailBlock(current, selectedBlock.id, action);
      applyDocument(next);
      if (action === "remove") setSelectedBlockId(next.blocks[0]?.id ?? "");
    } catch (error) {
      toast.info(error instanceof Error ? error.message : "Acao indisponivel para este bloco.");
    }
  };

  const insertVariable = (token: string) => {
    if (!selectedBlock) return;
    if (selectedBlock.tipo === "botao") {
      patchSelectedBlock({ ctaTexto: `${selectedBlock.ctaTexto ?? ""}${token}` });
    } else if (selectedBlock.tipo === "titulo" || selectedBlock.tipo === "texto") {
      patchSelectedBlock({ conteudoTexto: `${selectedBlock.conteudoTexto ?? ""}${token}` });
    } else {
      toast.info("Selecione um titulo, texto ou botao para inserir a variavel.");
    }
  };

  return (
    <section className="flex min-w-0 flex-1 flex-col rounded-2xl border border-zinc-800/80 bg-[#10131b] p-4 text-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/70 pb-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#ff6200]/10 text-[#ff6200]">
            <Edit3 className="size-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold tracking-wide">Editor do e-mail</h3>
            <p className="truncate text-[11px] text-zinc-500">
              Todas as alteracoes abaixo atualizam o HTML salvo.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onChangeTemplate}
          className="rounded-lg border border-zinc-700 bg-[#141824] px-3 py-1.5 text-[11px] font-semibold text-zinc-300 transition-colors hover:border-[#ff6200] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6200]"
        >
          Template: <strong className="text-white">{draft.templateNome}</strong>
        </button>
      </div>

      <div className="mt-3">
        <label
          htmlFor="campaign-subject"
          className="mb-1 block text-[11px] font-semibold text-zinc-400"
        >
          Assunto do e-mail
        </label>
        <input
          id="campaign-subject"
          value={draft.assunto}
          onChange={(event) =>
            onChangeDraft((current) => ({ ...current, assunto: event.target.value }))
          }
          className="h-10 w-full rounded-xl border border-zinc-800 bg-[#0d1017] px-3 text-xs text-white outline-none transition-colors focus:border-[#ff6200]"
        />
        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          <span className="mr-1 text-[9px] text-zinc-600">Inserir no assunto:</span>
          {CAMPAIGN_VARIABLES.slice(0, 4).map((variable) => (
            <button
              key={variable.key}
              type="button"
              onClick={() =>
                onChangeDraft((current) => ({
                  ...current,
                  assunto: `${current.assunto}${variable.token}`,
                }))
              }
              className="rounded border border-zinc-800 px-1.5 py-0.5 font-mono text-[8px] text-zinc-500 hover:border-[#ff6200] hover:text-zinc-300"
            >
              {variable.token}
            </button>
          ))}
        </div>
      </div>

      {selectedBlock ? (
        <div className="mt-3 space-y-3 rounded-xl border border-zinc-800 bg-[#0d1017] p-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[11px] font-bold text-zinc-300">{selectedBlock.titulo}</span>
            <button
              type="button"
              aria-label="Negrito"
              aria-pressed={selectedBlock.negrito ?? false}
              onClick={() => patchSelectedBlock({ negrito: !selectedBlock.negrito })}
              className={cn(
                "flex size-8 items-center justify-center rounded-lg border border-zinc-800",
                selectedBlock.negrito && "border-[#ff6200] bg-[#ff6200]/10 text-[#ff6200]",
              )}
            >
              <Bold className="size-3.5" />
            </button>
            <button
              type="button"
              aria-label="Italico"
              aria-pressed={selectedBlock.italico ?? false}
              onClick={() => patchSelectedBlock({ italico: !selectedBlock.italico })}
              className={cn(
                "flex size-8 items-center justify-center rounded-lg border border-zinc-800",
                selectedBlock.italico && "border-[#ff6200] bg-[#ff6200]/10 text-[#ff6200]",
              )}
            >
              <Italic className="size-3.5" />
            </button>
            {(["left", "center", "right"] as const).map((alignment) => {
              const Icon =
                alignment === "left"
                  ? AlignLeft
                  : alignment === "center"
                    ? AlignCenter
                    : AlignRight;
              return (
                <button
                  key={alignment}
                  type="button"
                  aria-label={`Alinhar ${alignment}`}
                  onClick={() => patchSelectedBlock({ alinhamento: alignment })}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-lg border border-zinc-800",
                    selectedBlock.alinhamento === alignment && "bg-zinc-800 text-white",
                  )}
                >
                  <Icon className="size-3.5" />
                </button>
              );
            })}
            <select
              aria-label="Tamanho do texto"
              value={selectedBlock.tamanhoFonte ?? 14}
              onChange={(event) => patchSelectedBlock({ tamanhoFonte: Number(event.target.value) })}
              className="h-8 rounded-lg border border-zinc-800 bg-[#141824] px-2 text-[11px]"
            >
              {[12, 14, 16, 18, 20, 24, 28, 32].map((size) => (
                <option key={size} value={size}>
                  {size}px
                </option>
              ))}
            </select>
            <label className="flex h-8 items-center gap-1 rounded-lg border border-zinc-800 px-2 text-[10px] text-zinc-400">
              Texto
              <input
                aria-label="Cor do texto"
                type="color"
                value={selectedBlock.corTexto?.startsWith("#") ? selectedBlock.corTexto : "#334155"}
                onChange={(event) => patchSelectedBlock({ corTexto: event.target.value })}
                className="size-5 bg-transparent"
              />
            </label>
            <label className="flex h-8 items-center gap-1 rounded-lg border border-zinc-800 px-2 text-[10px] text-zinc-400">
              Fundo
              <input
                aria-label="Cor de fundo"
                type="color"
                value={selectedBlock.corFundo?.startsWith("#") ? selectedBlock.corFundo : "#ffffff"}
                onChange={(event) => patchSelectedBlock({ corFundo: event.target.value })}
                className="size-5 bg-transparent"
              />
            </label>
          </div>

          {(selectedBlock.tipo === "titulo" || selectedBlock.tipo === "texto") && (
            <textarea
              aria-label="Conteudo do bloco"
              rows={selectedBlock.tipo === "titulo" ? 2 : 4}
              value={selectedBlock.conteudoTexto ?? ""}
              onChange={(event) => patchSelectedBlock({ conteudoTexto: event.target.value })}
              className="w-full resize-y rounded-xl border border-zinc-800 bg-[#141824] p-3 text-xs leading-relaxed text-white outline-none focus:border-[#ff6200]"
            />
          )}

          {selectedBlock.tipo === "botao" && (
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="text-[10px] text-zinc-400">
                Texto do botao
                <input
                  value={selectedBlock.ctaTexto ?? ""}
                  onChange={(event) => patchSelectedBlock({ ctaTexto: event.target.value })}
                  className="mt-1 h-9 w-full rounded-lg border border-zinc-800 bg-[#141824] px-3 text-xs text-white outline-none focus:border-[#ff6200]"
                />
              </label>
              <label className="text-[10px] text-zinc-400">
                URL do botao
                <span className="relative mt-1 block">
                  <LinkIcon className="absolute left-2.5 top-1/2 size-3 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="url"
                    value={selectedBlock.ctaUrl ?? ""}
                    onChange={(event) => patchSelectedBlock({ ctaUrl: event.target.value })}
                    className="h-9 w-full rounded-lg border border-zinc-800 bg-[#141824] pl-8 pr-3 text-xs text-white outline-none focus:border-[#ff6200]"
                  />
                </span>
              </label>
            </div>
          )}

          {selectedBlock.tipo === "imagem" && (
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="text-[10px] text-zinc-400 sm:col-span-2">
                URL publica HTTPS da imagem
                <input
                  type="url"
                  value={selectedBlock.imagemUrl ?? ""}
                  onChange={(event) => patchSelectedBlock({ imagemUrl: event.target.value })}
                  className="mt-1 h-9 w-full rounded-lg border border-zinc-800 bg-[#141824] px-3 text-xs text-white outline-none focus:border-[#ff6200]"
                />
              </label>
              <label className="text-[10px] text-zinc-400">
                Texto alternativo
                <input
                  value={selectedBlock.imagemAlt ?? ""}
                  onChange={(event) => patchSelectedBlock({ imagemAlt: event.target.value })}
                  className="mt-1 h-9 w-full rounded-lg border border-zinc-800 bg-[#141824] px-3 text-xs text-white outline-none focus:border-[#ff6200]"
                />
              </label>
              <label className="text-[10px] text-zinc-400">
                Largura: {selectedBlock.imagemLargura ?? 600}px
                <input
                  type="range"
                  min="120"
                  max="600"
                  value={selectedBlock.imagemLargura ?? 600}
                  onChange={(event) =>
                    patchSelectedBlock({ imagemLargura: Number(event.target.value) })
                  }
                  className="mt-2 w-full accent-[#ff6200]"
                />
              </label>
            </div>
          )}

          {selectedBlock.tipo === "duas_colunas" && (
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="text-[10px] text-zinc-400">
                Coluna esquerda
                <textarea
                  rows={3}
                  value={selectedBlock.colunaEsquerdaTexto ?? ""}
                  onChange={(event) =>
                    patchSelectedBlock({ colunaEsquerdaTexto: event.target.value })
                  }
                  className="mt-1 w-full resize-y rounded-lg border border-zinc-800 bg-[#141824] p-3 text-xs text-white outline-none focus:border-[#ff6200]"
                />
              </label>
              <label className="text-[10px] text-zinc-400">
                Coluna direita
                <textarea
                  rows={3}
                  value={selectedBlock.colunaDireitaTexto ?? ""}
                  onChange={(event) =>
                    patchSelectedBlock({ colunaDireitaTexto: event.target.value })
                  }
                  className="mt-1 w-full resize-y rounded-lg border border-zinc-800 bg-[#141824] p-3 text-xs text-white outline-none focus:border-[#ff6200]"
                />
              </label>
            </div>
          )}

          <label className="block text-[10px] text-zinc-400">
            {selectedBlock.tipo === "espacamento" ? "Altura do espaco" : "Espacamento interno"}:{" "}
            {selectedBlock.espacamento ?? (selectedBlock.tipo === "espacamento" ? 24 : 16)}px
            <input
              type="range"
              min={selectedBlock.tipo === "espacamento" ? 8 : 0}
              max={selectedBlock.tipo === "espacamento" ? 96 : 64}
              value={selectedBlock.espacamento ?? (selectedBlock.tipo === "espacamento" ? 24 : 16)}
              onChange={(event) => patchSelectedBlock({ espacamento: Number(event.target.value) })}
              className="mt-2 w-full accent-[#ff6200]"
            />
          </label>

          <div className="flex flex-wrap items-center gap-1.5 border-t border-zinc-800 pt-2">
            <span className="mr-1 text-[10px] text-zinc-500">Inserir variavel:</span>
            {CAMPAIGN_VARIABLES.map((variable) => (
              <button
                key={variable.key}
                type="button"
                title={variable.label}
                onClick={() => insertVariable(variable.token)}
                className="rounded-md border border-zinc-800 bg-[#141824] px-2 py-1 font-mono text-[9px] text-zinc-300 hover:border-[#ff6200]"
              >
                {variable.token}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-100 shadow-lg">
        <iframe
          title="Previa editavel do e-mail"
          sandbox=""
          srcDoc={previewHtml}
          className="h-[520px] w-full bg-white"
        />
      </div>

      <div className="mt-4 border-t border-zinc-800/60 pt-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-xs font-bold">Blocos e regioes editaveis</h4>
          <div className="flex flex-wrap gap-1">
            {ADDABLE_BLOCKS.map(({ tipo, label, icon: Icon }) => (
              <button
                key={tipo}
                type="button"
                onClick={() => handleAddBlock(tipo)}
                className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-[#0d1017] px-2 py-1 text-[10px] text-zinc-300 hover:border-[#ff6200]"
              >
                <Icon className="size-3" /> {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
          {draft.blocos.map((block) => (
            <button
              key={block.id}
              type="button"
              onClick={() => setSelectedBlockId(block.id)}
              className={cn(
                "min-w-36 rounded-xl border p-2 text-left transition-colors",
                selectedBlock?.id === block.id
                  ? "border-[#ff6200] bg-[#ff6200]/10"
                  : "border-zinc-800 bg-[#0d1017] hover:border-zinc-700",
              )}
            >
              <span className="block truncate text-[11px] font-bold">{block.titulo}</span>
              <span className="block truncate text-[9px] text-zinc-500">
                {block.origem === "personalizado" ? "Bloco adicionado" : "Regiao do template"}
              </span>
            </button>
          ))}
        </div>

        {selectedBlock ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleBlockAction("up")}
              className="rounded-lg border border-zinc-800 p-2"
              aria-label="Mover bloco para cima"
            >
              <ArrowUp className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleBlockAction("down")}
              className="rounded-lg border border-zinc-800 p-2"
              aria-label="Mover bloco para baixo"
            >
              <ArrowDown className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleBlockAction("duplicate")}
              className="rounded-lg border border-zinc-800 p-2"
              aria-label="Duplicar bloco"
            >
              <Copy className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleBlockAction("remove")}
              className="rounded-lg border border-rose-900/60 p-2 text-rose-400"
              aria-label="Remover bloco"
            >
              <Trash2 className="size-3.5" />
            </button>
            {selectedBlock.origem !== "personalizado" ? (
              <span className="text-[10px] text-zinc-500">
                Regioes originais podem ser editadas ou removidas; sua posicao preserva o design do
                template.
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-[10px] text-zinc-500">
        <Plus className="size-3" /> O HTML e os blocos sao salvos juntos no rascunho.
      </div>
    </section>
  );
}
