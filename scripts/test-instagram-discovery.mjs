import assert from "node:assert/strict";
import {
  montarPlanoDescobertaInstagram,
  selecionarAteMeta,
} from "../src/lib/instagram-discovery.ts";

const plano = montarPlanoDescobertaInstagram({
  nicho: "Ortodontista",
  cidade: "Curitiba",
  metaQualificados: 50,
});

assert.equal(plano.metaQualificados, 50);
assert.ok(plano.maxCandidatos > 50, "meta qualificada precisa superdimensionar candidatos");
assert.ok(plano.maxCandidatos <= 250, "plano deve permanecer limitado pelo teto operacional");
assert.ok(plano.consultas.length >= 4, "uma única consulta não sustenta a meta qualificada");
assert.ok(plano.consultas.every((consulta) => consulta.includes("Curitiba")));
assert.equal(new Set(plano.consultas).size, plano.consultas.length, "consultas devem ser únicas");

const candidatos = Array.from({ length: 80 }, (_, indice) => ({
  id: indice,
  aprovado: indice % 2 === 0,
}));
const selecionados = selecionarAteMeta(candidatos, 25, (item) => item.aprovado);
assert.equal(selecionados.length, 25, "resultado deve parar exatamente na meta solicitada");
assert.ok(selecionados.every((item) => item.aprovado));

assert.throws(
  () => montarPlanoDescobertaInstagram({ nicho: "", cidade: "Curitiba", metaQualificados: 50 }),
  /nicho/i,
);

console.log("OK: plano iterativo e meta exata do Instagram validados.");
