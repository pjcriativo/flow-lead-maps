// Suite: ajuda "?" do WhatsApp. Invariante: a ajuda existe nas telas principais, descreve passos de
// configuração e não promete rodízio/envio que o sistema não faz.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p: string) => readFileSync(p, "utf8");
const catalogo = read("src/components/whatsapp/ajuda-whatsapp.ts");
const telas = [
  "WaPainel",
  "WaCampanhas",
  "WaAutomacao",
  "WaScripts",
  "WaNumeros",
  "WaRelatorios",
  "WaConversas",
];

test("every main WhatsApp screen renders at least one help tip", () => {
  for (const tela of telas) {
    assert.match(read(`src/components/whatsapp/${tela}.tsx`), /<AjudaTip id="[\w-]+"/, tela);
  }
});

test("every tip id used on screens exists in the catalog", () => {
  for (const tela of telas) {
    const usados = [
      ...read(`src/components/whatsapp/${tela}.tsx`).matchAll(/<AjudaTip id="([\w-]+)"/g),
    ];
    for (const [, id] of usados) assert.ok(catalogo.includes(`"${id}": {`), `${tela}: ${id}`);
  }
});

test("rotation help is honest: campaigns only, manual replies never rotate, cap documented", () => {
  assert.match(catalogo, /Respostas manuais em Conversas NUNCA trocam de número/);
  assert.match(catalogo, /40 mensagens por número por dia/);
  const numeros = read("src/components/whatsapp/WaNumeros.tsx");
  assert.doesNotMatch(numeros, /não há rodízio automático ativo/);
});

test("the settings help explains how to configure, not only what it is", () => {
  for (const id of ["numeros-rotacao", "numeros-conectar", "campanhas-lista", "campanhas-criar"]) {
    const bloco = catalogo.slice(catalogo.indexOf(`"${id}": {`));
    assert.match(bloco.slice(0, bloco.indexOf('},\n  "')), /comoConfigurar/, id);
  }
});
