// Suite: modelo editavel do Estudio de Campanhas
// Invariant: toda edicao altera o HTML final sem destruir o template ou aceitar conteudo perigoso.
// Boundary IN: transformacoes puras de HTML e blocos do editor.
// Boundary OUT: React e Supabase, cobertos pelas suites de integracao do Estudio.

import assert from "node:assert/strict";
import test from "node:test";

import {
  addEmailBlock,
  applySignatureToEmail,
  createEditableEmail,
  duplicateEmailBlock,
  moveEmailBlock,
  removeEmailBlock,
  sanitizeEmailUrl,
  updateEmailBlock,
} from "../src/lib/campaign-email-editor.ts";

test("editor transforma regioes reais do template sem substituir seu layout", () => {
  const source = `<!doctype html><html><body><table><tr><td><h1 style="color:#fff">Titulo original</h1><p>Texto original</p><a href="https://example.com">Acao</a></td></tr></table></body></html>`;
  const initialized = createEditableEmail(source);
  const heading = initialized.blocks.find((block) => block.tipo === "titulo");
  const paragraph = initialized.blocks.find((block) => block.tipo === "texto");
  const button = initialized.blocks.find((block) => block.tipo === "botao");

  assert.ok(heading);
  assert.ok(paragraph);
  assert.ok(button);
  assert.match(initialized.html, /<table>/);

  const withHeading = updateEmailBlock(initialized, heading.id, { conteudoTexto: "Novo titulo" });
  const withParagraph = updateEmailBlock(withHeading, paragraph.id, {
    conteudoTexto: "Novo texto para {{nome}}",
  });
  const withButton = updateEmailBlock(withParagraph, button.id, {
    ctaTexto: "Conhecer proposta",
    ctaUrl: "https://flowbusiness.com.br/proposta",
  });

  assert.match(withButton.html, />Novo titulo<\/h1>/);
  assert.match(withButton.html, />Novo texto para \{\{nome\}\}<\/p>/);
  assert.match(withButton.html, /href="https:\/\/flowbusiness\.com\.br\/proposta"/);
  assert.match(withButton.html, />Conhecer proposta<\/a>/);
  assert.match(withButton.html, /<table>/);
});

test("formatacao do bloco e persistida no HTML real", () => {
  const initialized = createEditableEmail("<html><body><p>Conteudo</p></body></html>");
  const block = initialized.blocks[0];
  const updated = updateEmailBlock(initialized, block.id, {
    negrito: true,
    italico: true,
    alinhamento: "center",
    tamanhoFonte: 18,
    corTexto: "#112233",
    corFundo: "#f4f4f5",
    espacamento: 24,
  });

  assert.match(updated.html, /font-weight:\s*700/);
  assert.match(updated.html, /font-style:\s*italic/);
  assert.match(updated.html, /text-align:\s*center/);
  assert.match(updated.html, /font-size:\s*18px/);
  assert.match(updated.html, /color:\s*#112233/);
  assert.match(updated.html, /background-color:\s*#f4f4f5/);
  assert.match(updated.html, /padding:\s*24px/);
});

test("blocos adicionados, duplicados, removidos e reordenados seguem o HTML", () => {
  let document = createEditableEmail("<html><body><main><p>Base</p></main></body></html>");
  document = addEmailBlock(document, "texto", { conteudoTexto: "Primeiro bloco" });
  document = addEmailBlock(document, "botao", {
    ctaTexto: "Segundo bloco",
    ctaUrl: "https://example.com/segundo",
  });
  const firstCustom = document.blocks.find((block) => block.conteudoTexto === "Primeiro bloco");
  const secondCustom = document.blocks.find((block) => block.ctaTexto === "Segundo bloco");
  assert.ok(firstCustom);
  assert.ok(secondCustom);

  document = moveEmailBlock(document, secondCustom.id, "up");
  assert.ok(document.html.indexOf("Segundo bloco") < document.html.indexOf("Primeiro bloco"));

  document = duplicateEmailBlock(document, firstCustom.id);
  assert.equal(
    document.blocks.filter((block) => block.conteudoTexto === "Primeiro bloco").length,
    2,
  );

  document = removeEmailBlock(document, firstCustom.id);
  assert.equal(document.blocks.filter((block) => block.id === firstCustom.id).length, 0);
  assert.doesNotMatch(document.html, new RegExp(`data-flow-block-id="${firstCustom.id}"`));
});

test("URLs perigosas sao recusadas e links apropriados sao preservados", () => {
  for (const dangerous of [
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:msgbox(1)",
    "file:///etc/passwd",
  ]) {
    assert.equal(sanitizeEmailUrl(dangerous, "link"), "");
  }
  assert.equal(sanitizeEmailUrl("https://example.com/path", "link"), "https://example.com/path");
  assert.equal(
    sanitizeEmailUrl("mailto:contato@example.com", "link"),
    "mailto:contato@example.com",
  );
  assert.equal(sanitizeEmailUrl("tel:+5511999999999", "link"), "tel:+5511999999999");
  assert.equal(
    sanitizeEmailUrl("https://cdn.example.com/banner.png", "image"),
    "https://cdn.example.com/banner.png",
  );
  assert.equal(sanitizeEmailUrl("mailto:contato@example.com", "image"), "");
});

test("assinatura substitui snapshot anterior e nunca e duplicada", () => {
  const html = "<html><body><p>Mensagem</p></body></html>";
  const first = applySignatureToEmail(html, "<table><tr><td>Assinatura A</td></tr></table>");
  const second = applySignatureToEmail(first, "<table><tr><td>Assinatura B</td></tr></table>");

  assert.doesNotMatch(second, /Assinatura A/);
  assert.equal(second.match(/flow-signature:start/g)?.length, 1);
  assert.equal(second.match(/Assinatura B/g)?.length, 1);
});
