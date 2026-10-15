import type { BlockType, StudioEmailBlock } from "../types/campaign-studio.ts";

export interface EditableEmailDocument {
  html: string;
  blocks: StudioEmailBlock[];
}

export const CAMPAIGN_VARIABLES = [
  { key: "nome", token: "{{nome}}", label: "Nome do contato", example: "[Exemplo: Ana]" },
  {
    key: "empresa",
    token: "{{empresa}}",
    label: "Nome da empresa",
    example: "[Exemplo: Empresa Aurora]",
  },
  { key: "cidade", token: "{{cidade}}", label: "Cidade", example: "[Exemplo: Curitiba]" },
  {
    key: "nome_remetente",
    token: "{{nome_remetente}}",
    label: "Nome do responsavel",
    example: "[Exemplo: Marina]",
  },
  {
    key: "empresa_remetente",
    token: "{{empresa_remetente}}",
    label: "Nome da organizacao",
    example: "[Exemplo: Flow Business]",
  },
  {
    key: "telefone_remetente",
    token: "{{telefone_remetente}}",
    label: "Telefone da organizacao",
    example: "[Exemplo: +55 41 99999-0000]",
  },
  {
    key: "site_remetente",
    token: "{{site_remetente}}",
    label: "Site da organizacao",
    example: "[Exemplo: https://empresa.com.br]",
  },
] as const;

export type CampaignVariableToken = (typeof CAMPAIGN_VARIABLES)[number]["token"];

export type EmailBlockPatch = Partial<
  Pick<
    StudioEmailBlock,
    | "conteudoTexto"
    | "ctaTexto"
    | "ctaUrl"
    | "imagemUrl"
    | "imagemAlt"
    | "imagemLargura"
    | "colunaEsquerdaTexto"
    | "colunaDireitaTexto"
    | "negrito"
    | "italico"
    | "alinhamento"
    | "tamanhoFonte"
    | "corTexto"
    | "corFundo"
    | "espacamento"
    | "ativo"
  >
>;

const SIGNATURE_PATTERN =
  /<!--\s*flow-signature:start\s*-->[\s\S]*?<!--\s*flow-signature:end\s*-->/gi;
const CUSTOM_BLOCK_PATTERN = (id: string) =>
  new RegExp(
    `<!--\\s*flow-block:${escapeRegExp(id)}:start\\s*-->[\\s\\S]*?<!--\\s*flow-block:${escapeRegExp(id)}:end\\s*-->`,
    "i",
  );

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

function stripHtml(value: string): string {
  return value
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .trim();
}

function readAttribute(attributes: string, name: string): string {
  const match = attributes.match(new RegExp(`\\b${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, "i"));
  return match?.[2] ?? "";
}

function setAttribute(attributes: string, name: string, value: string): string {
  const matcher = new RegExp(`\\s+${name}\\s*=\\s*(["'])[\\s\\S]*?\\1`, "i");
  const next = ` ${name}="${escapeAttribute(value)}"`;
  return matcher.test(attributes) ? attributes.replace(matcher, next) : `${attributes}${next}`;
}

function readStyle(attributes: string): Map<string, string> {
  const style = new Map<string, string>();
  for (const declaration of readAttribute(attributes, "style").split(";")) {
    const separator = declaration.indexOf(":");
    if (separator <= 0) continue;
    style.set(
      declaration.slice(0, separator).trim().toLowerCase(),
      declaration.slice(separator + 1).trim(),
    );
  }
  return style;
}

function writeStyle(attributes: string, style: Map<string, string>): string {
  const serialized = [...style.entries()].map(([name, value]) => `${name}: ${value}`).join("; ");
  return setAttribute(attributes, "style", serialized ? `${serialized};` : "");
}

function applyFormatting(attributes: string, block: StudioEmailBlock): string {
  const style = readStyle(attributes);
  if (block.negrito !== undefined) style.set("font-weight", block.negrito ? "700" : "400");
  if (block.italico !== undefined) style.set("font-style", block.italico ? "italic" : "normal");
  if (block.alinhamento) style.set("text-align", block.alinhamento);
  if (block.tamanhoFonte) style.set("font-size", `${block.tamanhoFonte}px`);
  if (block.corTexto) style.set("color", block.corTexto);
  if (block.corFundo) style.set("background-color", block.corFundo);
  if (block.espacamento !== undefined && block.tipo !== "espacamento")
    style.set("padding", `${block.espacamento}px`);
  if (block.ativo === false) style.set("display", "none");
  else if (style.get("display") === "none") style.delete("display");
  return writeStyle(attributes, style);
}

function nextBlockId(): string {
  return `flow-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function inferFormatting(attributes: string): EmailBlockPatch {
  const style = readStyle(attributes);
  const size = Number.parseInt(style.get("font-size") ?? "", 10);
  const padding = Number.parseInt(style.get("padding") ?? "", 10);
  const alignment = style.get("text-align");
  return {
    negrito: /^(?:bold|[6-9]00)$/.test(style.get("font-weight") ?? ""),
    italico: style.get("font-style") === "italic",
    alinhamento:
      alignment === "center" || alignment === "right" || alignment === "left" ? alignment : "left",
    tamanhoFonte: Number.isFinite(size) ? size : undefined,
    corTexto: style.get("color"),
    corFundo: style.get("background-color"),
    espacamento: Number.isFinite(padding) ? padding : undefined,
  };
}

function describeBlock(
  tipo: BlockType,
  index: number,
): Pick<StudioEmailBlock, "titulo" | "subtitulo"> {
  const labels: Partial<Record<BlockType, string>> = {
    titulo: "Titulo",
    texto: "Texto",
    botao: "Botao",
    imagem: "Imagem",
    separador: "Separador",
    espacamento: "Espacamento",
    duas_colunas: "Duas colunas",
    assinatura: "Assinatura",
  };
  const label = labels[tipo] ?? "Conteudo";
  return { titulo: `${label} ${index + 1}`, subtitulo: "Regiao editavel do e-mail" };
}

export function sanitizeEmailUrl(value: string, type: "link" | "image"): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("/")) return type === "image" ? trimmed : "";
  try {
    const parsed = new URL(trimmed);
    const allowed = type === "image" ? ["https:"] : ["https:", "http:", "mailto:", "tel:"];
    return allowed.includes(parsed.protocol) ? parsed.toString() : "";
  } catch {
    return "";
  }
}

export function sanitizeEmailHtml(html: string): string {
  return html
    .replace(/<(script|iframe|object|embed|form|meta|base)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<(script|iframe|object|embed|form|meta|base)\b[^>]*\/?>/gi, "")
    .replace(/\s+on[a-z0-9_-]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(
      /\s+(?:href|src)\s*=\s*(?:"\s*(?:javascript|data|vbscript|file):[^"]*"|'\s*(?:javascript|data|vbscript|file):[^']*'|(?:javascript|data|vbscript|file):[^\s>]+)/gi,
      "",
    )
    .replace(
      /\s+style\s*=\s*(?:"[^"]*(?:expression\s*\(|url\s*\(\s*['"]?\s*(?:javascript|data|vbscript|file):)[^"]*"|'[^']*(?:expression\s*\(|url\s*\(\s*["']?\s*(?:javascript|data|vbscript|file):)[^']*')/gi,
      "",
    );
}

export function renderEmailPreview(html: string): string {
  const examples = new Map<string, string>(
    CAMPAIGN_VARIABLES.map((item) => [item.key, item.example]),
  );
  return sanitizeEmailHtml(html).replace(/\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}/g, (token, key: string) =>
    escapeHtml(examples.get(key) ?? `[Variavel sem exemplo: ${key}]`),
  );
}

export function createEditableEmail(sourceHtml: string): EditableEmailDocument {
  const blocks: StudioEmailBlock[] = [];
  let sequence = 0;
  let html = sanitizeEmailHtml(removeSignatureFromEmail(sourceHtml));
  html = html.replace(
    /<(h[1-6]|p|a)\b([^>]*)>([\s\S]*?)<\/\1>/gi,
    (whole, rawTag: string, rawAttributes: string, innerHtml: string) => {
      const tag = rawTag.toLowerCase();
      const existingId = readAttribute(rawAttributes, "data-flow-block-id");
      const id = existingId || `flow-template-${sequence}`;
      const tipo: BlockType = tag.startsWith("h") ? "titulo" : tag === "a" ? "botao" : "texto";
      const description = describeBlock(tipo, sequence);
      const attributes = existingId
        ? rawAttributes
        : setAttribute(rawAttributes, "data-flow-block-id", id);
      blocks.push({
        id,
        tipo,
        ...description,
        ...(tipo === "botao"
          ? {
              ctaTexto: stripHtml(innerHtml),
              ctaUrl: sanitizeEmailUrl(readAttribute(attributes, "href"), "link"),
            }
          : { conteudoTexto: stripHtml(innerHtml) }),
        ...inferFormatting(attributes),
        origem: "template",
        tagHtml: tag,
        ativo: !/display\s*:\s*none/i.test(readAttribute(attributes, "style")),
      });
      sequence += 1;
      return `<${tag}${attributes}>${innerHtml}</${tag}>`;
    },
  );
  html = html.replace(/<img\b([^>]*?)\/?\s*>/gi, (whole, rawAttributes: string) => {
    const existingId = readAttribute(rawAttributes, "data-flow-block-id");
    const id = existingId || `flow-template-${sequence}`;
    const attributes = existingId
      ? rawAttributes
      : setAttribute(rawAttributes, "data-flow-block-id", id);
    const width = Number.parseInt(readAttribute(attributes, "width"), 10);
    blocks.push({
      id,
      tipo: "imagem",
      ...describeBlock("imagem", sequence),
      imagemUrl: sanitizeEmailUrl(readAttribute(attributes, "src"), "image"),
      imagemAlt: readAttribute(attributes, "alt"),
      imagemLargura: Number.isFinite(width) ? width : undefined,
      origem: "template",
      tagHtml: "img",
      ativo: true,
    });
    sequence += 1;
    return `<img${attributes}>`;
  });
  return { html, blocks };
}

function renderCustomBlock(block: StudioEmailBlock): string {
  const style = applyFormatting("", block);
  const attributes = `${setAttribute(style, "data-flow-block-id", block.id)} data-flow-custom-block="true"`;
  let content = "";
  switch (block.tipo) {
    case "titulo":
      content = `<h2 style="margin:0;">${escapeHtml(block.conteudoTexto ?? "Novo titulo")}</h2>`;
      break;
    case "botao": {
      const url = sanitizeEmailUrl(block.ctaUrl ?? "", "link");
      content = `<a${url ? ` href="${escapeAttribute(url)}"` : ""} style="display:inline-block;padding:12px 20px;border-radius:8px;background:#ff6200;color:#ffffff;text-decoration:none;font-weight:700;">${escapeHtml(block.ctaTexto ?? "Novo botao")}</a>`;
      break;
    }
    case "imagem": {
      const url = sanitizeEmailUrl(block.imagemUrl ?? "", "image");
      content = url
        ? `<img src="${escapeAttribute(url)}" alt="${escapeAttribute(block.imagemAlt ?? "")}" width="${Math.min(600, Math.max(40, block.imagemLargura ?? 600))}" style="display:block;max-width:100%;height:auto;">`
        : `<span style="color:#64748b;">Selecione uma imagem publica HTTPS</span>`;
      break;
    }
    case "separador":
      content = '<hr style="border:0;border-top:1px solid #e2e8f0;margin:0;">';
      break;
    case "espacamento":
      content = `<div style="height:${Math.min(96, Math.max(8, block.espacamento ?? 24))}px;line-height:1px;">&nbsp;</div>`;
      break;
    case "duas_colunas":
      content = `<table role="presentation" width="100%"><tr><td width="50%" style="padding:8px;">${escapeHtml(block.colunaEsquerdaTexto ?? "Coluna 1")}</td><td width="50%" style="padding:8px;">${escapeHtml(block.colunaDireitaTexto ?? "Coluna 2")}</td></tr></table>`;
      break;
    default:
      content = `<p style="margin:0;">${escapeHtml(block.conteudoTexto ?? "Novo texto")}</p>`;
  }
  return `<!-- flow-block:${block.id}:start --><div${attributes}>${content}</div><!-- flow-block:${block.id}:end -->`;
}

function insertBeforeBodyEnd(html: string, content: string): string {
  const signature = html.match(SIGNATURE_PATTERN)?.[0];
  if (signature) return html.replace(signature, `${content}${signature}`);
  return /<\/body\s*>/i.test(html)
    ? html.replace(/<\/body\s*>/i, `${content}</body>`)
    : `${html}${content}`;
}

export function updateEmailBlock(
  document: EditableEmailDocument,
  blockId: string,
  patch: EmailBlockPatch,
): EditableEmailDocument {
  const current = document.blocks.find((block) => block.id === blockId);
  if (!current) throw new Error("Bloco de e-mail nao encontrado.");
  const block = { ...current, ...patch };
  let html = document.html;
  if (block.origem === "personalizado") {
    html = html.replace(CUSTOM_BLOCK_PATTERN(block.id), renderCustomBlock(block));
  } else if (block.tipo === "imagem") {
    const matcher = new RegExp(
      `<img\\b([^>]*\\bdata-flow-block-id=(["'])${escapeRegExp(block.id)}\\2[^>]*)>`,
      "i",
    );
    html = html.replace(matcher, (whole, attributes: string) => {
      let next = attributes;
      if (patch.imagemUrl !== undefined) {
        const url = sanitizeEmailUrl(patch.imagemUrl, "image");
        next = setAttribute(next, "src", url);
      }
      if (patch.imagemAlt !== undefined) next = setAttribute(next, "alt", patch.imagemAlt);
      if (patch.imagemLargura !== undefined)
        next = setAttribute(
          next,
          "width",
          String(Math.min(600, Math.max(40, patch.imagemLargura))),
        );
      return `<img${applyFormatting(next, block)}>`;
    });
  } else {
    const matcher = new RegExp(
      `<([a-z][a-z0-9]*)\\b([^>]*\\bdata-flow-block-id=(["'])${escapeRegExp(block.id)}\\3[^>]*)>([\\s\\S]*?)<\\/\\1>`,
      "i",
    );
    html = html.replace(
      matcher,
      (whole, tag: string, attributes: string, quote: string, inner: string) => {
        let next = attributes;
        let content = inner;
        if (block.tipo === "botao") {
          if (patch.ctaUrl !== undefined) {
            const url = sanitizeEmailUrl(patch.ctaUrl, "link");
            next = setAttribute(next, "href", url);
          }
          if (patch.ctaTexto !== undefined) content = escapeHtml(patch.ctaTexto);
        } else if (patch.conteudoTexto !== undefined) {
          content = escapeHtml(patch.conteudoTexto);
        }
        return `<${tag}${applyFormatting(next, block)}>${content}</${tag}>`;
      },
    );
  }
  return {
    html: sanitizeEmailHtml(html),
    blocks: document.blocks.map((item) => (item.id === blockId ? block : item)),
  };
}

export function addEmailBlock(
  document: EditableEmailDocument,
  tipo: BlockType,
  initial: EmailBlockPatch = {},
): EditableEmailDocument {
  const id = nextBlockId();
  const block: StudioEmailBlock = {
    id,
    tipo,
    ...describeBlock(tipo, document.blocks.length),
    origem: "personalizado",
    ativo: true,
    alinhamento: "left",
    tamanhoFonte: tipo === "titulo" ? 24 : 14,
    espacamento: tipo === "espacamento" ? 24 : 16,
    ...(tipo === "duas_colunas"
      ? { colunaEsquerdaTexto: "Coluna 1", colunaDireitaTexto: "Coluna 2" }
      : {}),
    ...initial,
  };
  return {
    html: insertBeforeBodyEnd(document.html, renderCustomBlock(block)),
    blocks: [...document.blocks, block],
  };
}

export function duplicateEmailBlock(
  document: EditableEmailDocument,
  blockId: string,
): EditableEmailDocument {
  const index = document.blocks.findIndex((block) => block.id === blockId);
  const source = document.blocks[index];
  if (!source) throw new Error("Bloco de e-mail nao encontrado.");
  if (source.origem !== "personalizado")
    throw new Error(
      "Regioes originais do template nao podem ser duplicadas sem perder fidelidade.",
    );
  const duplicate = { ...source, id: nextBlockId(), titulo: `${source.titulo} - copia` };
  const sourceMarkup = document.html.match(CUSTOM_BLOCK_PATTERN(source.id))?.[0];
  if (!sourceMarkup) throw new Error("HTML do bloco personalizado nao encontrado.");
  const html = document.html.replace(
    sourceMarkup,
    `${sourceMarkup}${renderCustomBlock(duplicate)}`,
  );
  const blocks = [...document.blocks];
  blocks.splice(index + 1, 0, duplicate);
  return { html, blocks };
}

export function removeEmailBlock(
  document: EditableEmailDocument,
  blockId: string,
): EditableEmailDocument {
  const block = document.blocks.find((item) => item.id === blockId);
  if (!block) throw new Error("Bloco de e-mail nao encontrado.");
  let html = document.html;
  if (block.origem === "personalizado") {
    html = html.replace(CUSTOM_BLOCK_PATTERN(block.id), "");
  } else if (block.tipo === "imagem") {
    html = html.replace(
      new RegExp(`<img\\b[^>]*\\bdata-flow-block-id=(["'])${escapeRegExp(block.id)}\\1[^>]*>`, "i"),
      "",
    );
  } else {
    html = html.replace(
      new RegExp(
        `<([a-z][a-z0-9]*)\\b[^>]*\\bdata-flow-block-id=(["'])${escapeRegExp(block.id)}\\2[^>]*>[\\s\\S]*?<\\/\\1>`,
        "i",
      ),
      "",
    );
  }
  return { html, blocks: document.blocks.filter((item) => item.id !== blockId) };
}

export function moveEmailBlock(
  document: EditableEmailDocument,
  blockId: string,
  direction: "up" | "down",
): EditableEmailDocument {
  const index = document.blocks.findIndex((block) => block.id === blockId);
  const block = document.blocks[index];
  if (!block) throw new Error("Bloco de e-mail nao encontrado.");
  if (block.origem !== "personalizado")
    throw new Error("Regioes originais permanecem na posicao definida pelo template.");
  const customBlocks = document.blocks.filter((item) => item.origem === "personalizado");
  const customIndex = customBlocks.findIndex((item) => item.id === blockId);
  const target = customBlocks[customIndex + (direction === "up" ? -1 : 1)];
  if (!target) return document;
  const sourceMarkup = document.html.match(CUSTOM_BLOCK_PATTERN(block.id))?.[0];
  const targetMarkup = document.html.match(CUSTOM_BLOCK_PATTERN(target.id))?.[0];
  if (!sourceMarkup || !targetMarkup)
    throw new Error("HTML dos blocos personalizados nao encontrado.");
  const first = direction === "up" ? targetMarkup : sourceMarkup;
  const second = direction === "up" ? sourceMarkup : targetMarkup;
  const swapped = `${second}${first}`;
  const html = document.html.replace(`${first}${second}`, swapped);
  const blocks = [...document.blocks];
  const targetIndex = blocks.findIndex((item) => item.id === target.id);
  [blocks[index], blocks[targetIndex]] = [blocks[targetIndex], blocks[index]];
  return { html, blocks };
}

export function removeSignatureFromEmail(html: string): string {
  return html.replace(SIGNATURE_PATTERN, "");
}

export function applySignatureToEmail(html: string, signatureHtml: string): string {
  const withoutPrevious = removeSignatureFromEmail(html);
  if (!signatureHtml.trim()) return withoutPrevious;
  const safeSignature = sanitizeEmailHtml(signatureHtml);
  const markup = `<!-- flow-signature:start --><div data-flow-signature="true">${safeSignature}</div><!-- flow-signature:end -->`;
  return /<\/body\s*>/i.test(withoutPrevious)
    ? withoutPrevious.replace(/<\/body\s*>/i, `${markup}</body>`)
    : `${withoutPrevious}${markup}`;
}
