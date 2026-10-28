// Operações Comerciais por Nicho e Produto — regras PURAS. O CEO só PROPÕE (aprovação humana cria a
// operação); aqui montamos e validamos a definição que vai para agent_propor_operacao. Os limites
// espelham agent_validar_def_operacao (migration 202610280001).
import { PAPEIS_SUBORDINADOS } from "./agent-tools.ts";
import { memoriaTextoSeguro } from "./agent-memory.ts";

export const CAMPOS_ESTRATEGIA = [
  "icp",
  "segmentacao",
  "canais",
  "proposta_valor",
  "abordagem",
  "objecoes",
  "funil",
  "metas",
  "indicadores",
  "calendario",
  "responsabilidades",
] as const;
export type CampoEstrategia = (typeof CAMPOS_ESTRATEGIA)[number];

export const LIMITES_OPERACAO = {
  nome: [3, 80],
  nicho: [2, 80],
  subnicho: [0, 80],
  produto: [2, 120],
  publico_alvo: [2, 400],
  regiao: [2, 120],
  campoEstrategia: 600,
  estrategiaTotal: 8000,
  orcamentoMesUsd: [0, 500],
  operacoesPorOrg: 10,
} as const;

export type DefOperacao = {
  nome: string;
  nicho: string;
  subnicho?: string;
  produto: string;
  publico_alvo: string;
  regiao: string;
  papeis: string[];
  orcamento_usd_mes: number;
  estrategia: Partial<Record<CampoEstrategia, string>>;
};

/**
 * Equipe dinâmica: o CEO escolhe os papéis; nunca há equipe fixa. Regras de hierarquia: especialistas
 * respondem ao Gerente Comercial, então ele entra junto. Remove duplicados e papéis desconhecidos.
 */
export function normalizarPapeis(
  csv: string,
): { ok: true; papeis: string[] } | { ok: false; motivo: "papeis_invalidos" | "sem_papeis" } {
  const lista = csv
    .split(/[,\s;]+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const validos = PAPEIS_SUBORDINADOS as readonly string[];
  if (lista.length === 0) return { ok: false, motivo: "sem_papeis" };
  if (lista.some((p) => !validos.includes(p))) return { ok: false, motivo: "papeis_invalidos" };
  const unicos = [...new Set(lista)];
  const comGerente = unicos.includes("gerente_comercial")
    ? unicos
    : ["gerente_comercial", ...unicos];
  return {
    ok: true,
    papeis: validos.filter((p) => comGerente.includes(p)),
  };
}

const dentro = (v: string, [min, max]: readonly [number, number] | readonly number[]) =>
  v.length >= min && v.length <= max;

export function montarDefOperacao(
  params: Record<string, unknown>,
): { ok: true; def: DefOperacao } | { ok: false; erros: string[] } {
  const erros: string[] = [];
  const txt = (k: string) => String(params[k] ?? "").trim();
  const L = LIMITES_OPERACAO;
  const nome = txt("nome");
  const nicho = txt("nicho");
  const subnicho = txt("subnicho");
  const produto = txt("produto");
  const publico = txt("publico_alvo");
  const regiao = txt("regiao");
  if (!dentro(nome, L.nome)) erros.push("nome");
  if (!dentro(nicho, L.nicho)) erros.push("nicho");
  if (subnicho && !dentro(subnicho, L.subnicho)) erros.push("subnicho");
  if (!dentro(produto, L.produto)) erros.push("produto");
  if (!dentro(publico, L.publico_alvo)) erros.push("publico_alvo");
  if (!dentro(regiao, L.regiao)) erros.push("regiao");

  const papeis = normalizarPapeis(txt("papeis"));
  if (!papeis.ok) erros.push(papeis.motivo);

  const orcamento = params.orcamento_usd_mes === undefined ? 0 : Number(params.orcamento_usd_mes);
  if (
    !Number.isFinite(orcamento) ||
    orcamento < L.orcamentoMesUsd[0] ||
    orcamento > L.orcamentoMesUsd[1]
  )
    erros.push("orcamento_usd_mes");

  const estrategia: Partial<Record<CampoEstrategia, string>> = {};
  for (const campo of CAMPOS_ESTRATEGIA) {
    const v = txt(campo);
    if (!v) continue;
    if (v.length > L.campoEstrategia) erros.push(campo);
    else estrategia[campo] = v;
  }
  if (JSON.stringify(estrategia).length > L.estrategiaTotal) erros.push("estrategia_grande");

  const conteudo = [
    nome,
    nicho,
    subnicho,
    produto,
    publico,
    regiao,
    ...Object.values(estrategia),
  ].join(" ");
  if (!memoriaTextoSeguro(conteudo)) erros.push("operacao_com_dado_sensivel");

  if (erros.length || !papeis.ok) return { ok: false, erros };
  return {
    ok: true,
    def: {
      nome,
      nicho,
      ...(subnicho ? { subnicho } : {}),
      produto,
      publico_alvo: publico,
      regiao,
      papeis: papeis.papeis,
      orcamento_usd_mes: orcamento,
      estrategia,
    },
  };
}
