#!/usr/bin/env node
// Suite: economia de buscas Apify
// Invariant: nenhuma busca paga repete uma profundidade fresca nem excede o que o plano entrega.
// Boundary IN: chave de cache e planejamento puro da coleta Google Maps.
// Boundary OUT: banco, rede e Actor Apify (verificados pelas Edge Functions e pelo ledger real).
import assert from "node:assert/strict";
import {
  criarChaveCacheApify,
  planejarColetaApify,
} from "../supabase/functions/_shared/apify-economy.ts";

assert.equal(
  criarChaveCacheApify({
    nicho: "  Clínica   Veterinária ",
    cidade: "São Paulo",
    uf: "sp",
    lat: null,
    lng: null,
    raioKm: 10,
  }),
  criarChaveCacheApify({
    nicho: "clinica veterinaria",
    cidade: "sao paulo",
    uf: "SP",
    lat: null,
    lng: null,
    raioKm: 10,
  }),
  "acentos, caixa e espaços não podem gerar uma nova cobrança para a mesma consulta",
);

assert.deepEqual(
  planejarColetaApify({ solicitado: 50, restantePlano: 5, profundidadeCache: 0 }),
  { limiteEfetivo: 5, limiteApify: 5, servidoDoCache: false },
  "a Apify deve receber somente o que ainda cabe no plano",
);

assert.deepEqual(
  planejarColetaApify({ solicitado: 50, restantePlano: 50, profundidadeCache: 50 }),
  { limiteEfetivo: 50, limiteApify: 0, servidoDoCache: true },
  "uma consulta já coberta pelo cache não pode iniciar outro run pago",
);

assert.deepEqual(
  planejarColetaApify({ solicitado: 100, restantePlano: null, profundidadeCache: 50 }),
  { limiteEfetivo: 100, limiteApify: 100, servidoDoCache: false },
  "para aumentar a profundidade, o Actor precisa alcançar a nova posição do ranking",
);

console.log("OK: cache e limite do plano impedem cobranças Apify sem utilidade.");
