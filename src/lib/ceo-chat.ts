// Lógica PURA do chat do CEO (Tela 10): atalhos de início, motivo de bloqueio com o caminho para resolver,
// leitura do texto da resposta em blocos (sem HTML injetado) e agrupamento do histórico. Sem I/O.
import type { EstadoCeoId } from "./ceo-config.ts";
import { MSG_CONFIGURAR_PROVEDOR } from "./ia-config.ts";

export const LIMITE_MENSAGEM = 2000;

export type AtalhoInicial = {
  id: string;
  rotulo: string;
  /** Texto enviado ou colocado no campo. */
  texto: string;
  /** true = envia agora (pergunta completa); false = só preenche para o usuário completar. */
  enviarAgora: boolean;
};

export const ATALHOS_INICIAIS: readonly AtalhoInicial[] = [
  {
    id: "estrategia",
    rotulo: "Criar estratégia de prospecção",
    texto: "CEO, hoje quero prospectar [nicho] em [cidade] para vender [produto ou serviço].",
    enviarAgora: false,
  },
  {
    id: "equipe",
    rotulo: "Montar equipe comercial",
    texto:
      "CEO, quais agentes minha operação precisa? Proponha a equipe comercial com responsabilidades e orçamento.",
    enviarAgora: true,
  },
  {
    id: "semana",
    rotulo: "Planejar a semana",
    texto:
      "CEO, prepare o planejamento comercial da próxima semana com base nos dados reais da operação.",
    enviarAgora: true,
  },
  {
    id: "resultados",
    rotulo: "Consultar resultados",
    texto:
      "CEO, o que a equipe está fazendo agora, quantos leads foram encontrados hoje e quais tarefas estão atrasadas?",
    enviarAgora: true,
  },
  {
    id: "crm",
    rotulo: "Analisar o CRM",
    texto: "CEO, analise nosso CRM e me diga onde estão as melhores oportunidades.",
    enviarAgora: true,
  },
];

export const SUGESTOES_DE_CONTROLE: readonly string[] = [
  "O que a equipe está fazendo?",
  "Quais ações precisam da minha aprovação?",
  "Qual nicho está performando melhor?",
  "Prepare o relatório de produtividade.",
];

export type BloqueioChat = {
  /** Mensagem em português explicando por que não dá para conversar agora. */
  motivo: string;
  /** Caminho direto para resolver (null = nada a fazer pelo usuário). */
  acao: "configurar_ceo" | "tentar_novamente" | null;
  rotuloAcao?: string;
};

/**
 * Por que o chat está indisponível e qual o caminho direto para destravar.
 * `provedorPronto` = o provedor de IA escolhido no Super Admin está conectado (false só com a Central publicada).
 */
export function bloqueioDoChat(input: {
  estado: EstadoCeoId;
  provedorPronto: boolean;
}): BloqueioChat | null {
  if (!input.provedorPronto) {
    return { motivo: MSG_CONFIGURAR_PROVEDOR, acao: null };
  }
  switch (input.estado) {
    case "ativo":
      return null;
    case "carregando":
      return { motivo: "Verificando o CEO desta organização…", acao: null };
    case "servico_indisponivel":
      return {
        motivo: "Não foi possível consultar o CEO agora.",
        acao: "tentar_novamente",
        rotuloAcao: "Tentar novamente",
      };
    case "nao_configurado":
      return {
        motivo: "Esta organização ainda não tem um CEO de IA. Crie e ative o CEO para conversar.",
        acao: "configurar_ceo",
        rotuloAcao: "Criar e ativar o CEO",
      };
    case "inativo":
    case "configurado":
      return {
        motivo: "O CEO está configurado, mas inativo. Um administrador precisa ativá-lo.",
        acao: "configurar_ceo",
        rotuloAcao: "Ativar o CEO",
      };
    case "pausado":
      return {
        motivo: "O CEO está pausado por um administrador.",
        acao: "configurar_ceo",
        rotuloAcao: "Abrir configuração",
      };
    case "bloqueado":
      return {
        motivo: "O CEO foi interrompido (kill-switch). Um administrador precisa liberá-lo.",
        acao: "configurar_ceo",
        rotuloAcao: "Abrir configuração",
      };
    case "limite_atingido":
      return {
        motivo:
          "O limite de uso de IA do CEO foi atingido (dia ou mês). Ajuste o limite ou aguarde.",
        acao: "configurar_ceo",
        rotuloAcao: "Abrir limites",
      };
    case "erro_configuracao":
    default:
      return {
        motivo: "A configuração do CEO está incompleta ou inválida.",
        acao: "configurar_ceo",
        rotuloAcao: "Corrigir configuração",
      };
  }
}

// ───────────────────────────── texto da resposta em blocos ─────────────────────────────
export type Trecho = { texto: string; negrito: boolean };
export type Bloco =
  | { tipo: "titulo"; trechos: Trecho[] }
  | { tipo: "paragrafo"; trechos: Trecho[] }
  | { tipo: "lista"; ordenada: boolean; itens: Trecho[][] }
  | { tipo: "codigo"; texto: string };

export function trechosDe(linha: string): Trecho[] {
  const partes = linha.split(/\*\*(.+?)\*\*/g);
  return partes
    .map((texto, i) => ({ texto, negrito: i % 2 === 1 }))
    .filter((t) => t.texto.length > 0);
}

/** Markdown básico → blocos. Nunca gera HTML: o React renderiza como texto. */
export function blocosDeTexto(entrada: string): Bloco[] {
  const linhas = entrada.replace(/\r\n/g, "\n").split("\n");
  const blocos: Bloco[] = [];
  let i = 0;
  while (i < linhas.length) {
    const l = linhas[i];
    if (l.trim().startsWith("```")) {
      const cod: string[] = [];
      i += 1;
      while (i < linhas.length && !linhas[i].trim().startsWith("```")) cod.push(linhas[i++]);
      i += 1;
      blocos.push({ tipo: "codigo", texto: cod.join("\n") });
      continue;
    }
    if (!l.trim()) {
      i += 1;
      continue;
    }
    const tit = l.match(/^\s{0,3}#{1,4}\s+(.*)$/);
    if (tit) {
      blocos.push({ tipo: "titulo", trechos: trechosDe(tit[1]) });
      i += 1;
      continue;
    }
    const item = (s: string) => s.match(/^\s*(?:([-*•])|(\d+)[.)])\s+(.*)$/);
    const primeiro = item(l);
    if (primeiro) {
      const ordenada = Boolean(primeiro[2]);
      const itens: Trecho[][] = [];
      while (i < linhas.length) {
        const m = item(linhas[i]);
        if (!m || Boolean(m[2]) !== ordenada) break;
        itens.push(trechosDe(m[3]));
        i += 1;
      }
      blocos.push({ tipo: "lista", ordenada, itens });
      continue;
    }
    const par: string[] = [];
    while (
      i < linhas.length &&
      linhas[i].trim() &&
      !item(linhas[i]) &&
      !/^\s{0,3}#{1,4}\s/.test(linhas[i]) &&
      !linhas[i].trim().startsWith("```")
    ) {
      par.push(linhas[i++].trim());
    }
    blocos.push({ tipo: "paragrafo", trechos: trechosDe(par.join(" ")) });
  }
  return blocos;
}

// ───────────────────────────── histórico ─────────────────────────────
export function grupoDaData(
  iso: string,
  agora: Date = new Date(),
): "Hoje" | "Ontem" | "Últimos 7 dias" | "Anteriores" {
  const d = new Date(iso);
  const dia = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((dia(agora) - dia(d)) / 86_400_000);
  if (diff <= 0) return "Hoje";
  if (diff === 1) return "Ontem";
  if (diff <= 7) return "Últimos 7 dias";
  return "Anteriores";
}

export function agruparPorData<T extends { atualizado_em: string }>(
  itens: readonly T[],
  agora: Date = new Date(),
): { grupo: string; itens: T[] }[] {
  const ordem = ["Hoje", "Ontem", "Últimos 7 dias", "Anteriores"];
  const mapa = new Map<string, T[]>();
  for (const it of itens) {
    const g = grupoDaData(it.atualizado_em, agora);
    mapa.set(g, [...(mapa.get(g) ?? []), it]);
  }
  return ordem.filter((g) => mapa.has(g)).map((g) => ({ grupo: g, itens: mapa.get(g)! }));
}

/** Texto copiado de um plano de operação (para colar em outro lugar), sem campos vazios. */
export function planoComoTexto(plano: {
  nome: string;
  nicho: string;
  subnicho?: string;
  produto: string;
  publico_alvo: string;
  regiao: string;
  papeis: string[];
  orcamento_usd_mes: number;
  estrategia: Record<string, string>;
}): string {
  const linhas = [
    `Plano de Operação Comercial — ${plano.nome}`,
    `Nicho: ${plano.nicho}${plano.subnicho ? ` / ${plano.subnicho}` : ""}`,
    `Produto: ${plano.produto}`,
    `Região: ${plano.regiao}`,
    `Público-alvo: ${plano.publico_alvo}`,
    `Agentes: ${plano.papeis.join(", ") || "—"}`,
    `Orçamento mensal (US$): ${plano.orcamento_usd_mes}`,
    ...Object.entries(plano.estrategia).map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`),
  ];
  return linhas.join("\n");
}
