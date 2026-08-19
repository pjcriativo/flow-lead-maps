// Suite: ranking de leads vindos de comentarios do Instagram
// Invariant: intencao comercial real sempre supera elogio generico e spam nunca vira candidato
// Boundary IN: classificacao, deduplicacao e score puro do Comments Hunter
// Boundary OUT: Apify, banco e interface (cobertos por smoke tests da Edge e do build)
import assert from "node:assert/strict";
import {
  calcularScoreLeadComentario,
  classificarIntencaoComentario,
  estimarCustoCommentsHunter,
  selecionarComentaristasUnicos,
} from "../src/lib/instagram-comments.ts";

const casos = [
  {
    nome: "pedido de preco tem alta intencao",
    texto: "Qual o valor e como faco para agendar?",
    rotulo: "compra",
    minimo: 75,
  },
  {
    nome: "duvida sobre atendimento tem intencao",
    texto: "Vocês atendem em Curitiba?",
    rotulo: "duvida",
    minimo: 50,
  },
  {
    nome: "elogio curto nao e tratado como compra",
    texto: "Amei o resultado!",
    rotulo: "elogio",
    maximo: 35,
  },
  {
    nome: "oferta de divulgacao e spam",
    texto: "DM for promotion, gain 10k followers fast",
    rotulo: "spam",
    maximo: 5,
  },
];

for (const caso of casos) {
  const resultado = classificarIntencaoComentario(caso.texto);
  assert.equal(resultado.rotulo, caso.rotulo, caso.nome);
  if (caso.minimo != null) assert.ok(resultado.score >= caso.minimo, caso.nome);
  if (caso.maximo != null) assert.ok(resultado.score <= caso.maximo, caso.nome);
}

const unicos = selecionarComentaristasUnicos([
  {
    username: "cliente_curitiba",
    texto: "Lindo!",
    likes: 5,
    ocorridoEm: "2026-08-15T10:00:00.000Z",
  },
  {
    username: "@Cliente_Curitiba",
    texto: "Qual o preco para agendar?",
    likes: 1,
    ocorridoEm: "2026-08-16T10:00:00.000Z",
  },
  {
    username: "outro_cliente",
    texto: "Tem horario essa semana?",
    likes: 0,
    ocorridoEm: "2026-08-14T10:00:00.000Z",
  },
]);

assert.equal(unicos.length, 2, "um usuario deve aparecer apenas uma vez");
assert.equal(unicos[0].username, "cliente_curitiba");
assert.match(unicos[0].texto, /preco/i, "a melhor evidencia do usuario deve ser preservada");

const scoreQualificado = calcularScoreLeadComentario({
  intencao: 90,
  profissional: true,
  aderenciaNicho: 85,
  aderenciaLocalidade: 100,
  atividade: 80,
  temContato: true,
  seguidores: 3200,
});
const scoreFraco = calcularScoreLeadComentario({
  intencao: 20,
  profissional: false,
  aderenciaNicho: 10,
  aderenciaLocalidade: 0,
  atividade: 20,
  temContato: false,
  seguidores: 12,
});

assert.ok(scoreQualificado >= 80, "perfil profissional com intencao deve ser priorizado");
assert.ok(scoreFraco < 30, "perfil pessoal sem aderencia deve ficar fora da fila");
assert.ok(scoreQualificado > scoreFraco);

assert.equal(
  estimarCustoCommentsHunter({
    sourceType: "profile",
    maxPosts: 3,
    postUrls: [],
    commentsPerPost: 30,
    targetLeads: 15,
  }),
  0.327,
  "frontend e Edge devem compartilhar a mesma estimativa",
);

console.log("OK: intencao, deduplicacao e score do Comments Hunter validados.");
