// Lógica PURA da equipe comercial de IA (Telas 02, 03, 07, 08, 11 e 12). Sem I/O. O que vale é o
// backend (migration 202610270003); aqui só espelhamos papéis, ferramentas e tipos de tarefa para
// exibir e validar cedo — um teste garante a paridade com o runtime. Nada daqui concede permissão.
import {
  derivarEstadoCeo,
  type AgenteCeoRow,
  type CargaCeo,
  type EstadoCeo,
} from "./ceo-config.ts";

export const PAPEIS = [
  "ceo",
  "gerente_comercial",
  "prospeccao",
  "sdr",
  "vendedor",
  "estrategista",
  "seo_geral",
] as const;
export type Papel = (typeof PAPEIS)[number];
export const PAPEIS_SUBORDINADOS = PAPEIS.filter((p) => p !== "ceo") as Exclude<Papel, "ceo">[];

export type MetaPapel = {
  rotulo: string;
  funcao: string;
  /** Ferramentas permitidas ao papel (espelha agent_ferramentas_do_papel). */
  ferramentas: readonly string[];
  /** Tipos de tarefa que o papel executa (espelha agent_tipos_do_papel). */
  tipos: readonly string[];
  superior: Papel | null;
  /** Só estes papéis podem receber delegação interna. */
  podeDelegar: boolean;
};

export const META_PAPEL: Record<Papel, MetaPapel> = {
  ceo: {
    rotulo: "CEO de IA",
    funcao: "Orquestra a operação comercial, delega tarefas e acompanha resultados.",
    ferramentas: [
      "consultar_resumo_comercial",
      "consultar_pipeline",
      "consultar_oportunidades",
      "consultar_execucoes_equipe",
      "consultar_memoria",
      "delegar_tarefa",
      "propor_estrutura_equipe",
      "registrar_memoria",
      "propor_operacao",
    ],
    tipos: ["copiloto_conversa", "analise_comercial"],
    superior: null,
    podeDelegar: true,
  },
  gerente_comercial: {
    rotulo: "Gerente Comercial",
    funcao: "Supervisiona o pipeline, acompanha metas e distribui oportunidades.",
    ferramentas: [
      "consultar_resumo_comercial",
      "consultar_pipeline",
      "consultar_oportunidades",
      "consultar_lead",
      "consultar_execucoes_equipe",
      "consultar_memoria",
      "delegar_tarefa",
    ],
    tipos: ["analise_comercial", "priorizar_oportunidades", "supervisao_comercial"],
    superior: "ceo",
    podeDelegar: true,
  },
  prospeccao: {
    rotulo: "Prospecção",
    funcao: "Planeja a descoberta e a organização de leads. Buscas pagas exigem sua autorização.",
    ferramentas: ["consultar_resumo_comercial", "consultar_oportunidades"],
    tipos: ["plano_prospeccao"],
    superior: "gerente_comercial",
    podeDelegar: false,
  },
  sdr: {
    rotulo: "SDR",
    funcao: "Qualifica oportunidades e prepara rascunhos de abordagem. Não envia nada.",
    ferramentas: ["consultar_oportunidades", "consultar_lead"],
    tipos: ["preparar_abordagem"],
    superior: "gerente_comercial",
    podeDelegar: false,
  },
  vendedor: {
    rotulo: "Vendedor",
    funcao: "Conduz oportunidades e prepara rascunhos de proposta. Preço é definido por pessoas.",
    ferramentas: ["consultar_oportunidades", "consultar_lead", "consultar_pipeline"],
    tipos: ["preparar_proposta"],
    superior: "gerente_comercial",
    podeDelegar: false,
  },
  estrategista: {
    rotulo: "Estrategista",
    funcao: "Analisa o negócio e propõe estratégias comerciais com base nos dados reais.",
    ferramentas: ["consultar_resumo_comercial", "consultar_pipeline"],
    tipos: ["plano_estrategia"],
    superior: "gerente_comercial",
    podeDelegar: false,
  },
  seo_geral: {
    rotulo: "SEO Geral",
    funcao: "Propõe estratégias de crescimento orgânico (sem acesso à web nesta fase).",
    ferramentas: ["consultar_resumo_comercial"],
    tipos: ["plano_seo"],
    superior: "gerente_comercial",
    podeDelegar: false,
  },
};

export const ROTULO_FERRAMENTA: Record<
  string,
  { rotulo: string; risco: "leitura" | "coordenação interna" }
> = {
  consultar_resumo_comercial: { rotulo: "Resumo comercial", risco: "leitura" },
  consultar_pipeline: { rotulo: "Pipeline por etapa", risco: "leitura" },
  consultar_oportunidades: { rotulo: "Oportunidades", risco: "leitura" },
  consultar_lead: { rotulo: "Ficha de lead", risco: "leitura" },
  consultar_execucoes_equipe: { rotulo: "Execuções da equipe", risco: "leitura" },
  delegar_tarefa: { rotulo: "Delegar tarefa interna", risco: "coordenação interna" },
  propor_estrutura_equipe: { rotulo: "Propor estrutura da equipe", risco: "coordenação interna" },
  consultar_memoria: { rotulo: "Memória da organização", risco: "leitura" },
  registrar_memoria: { rotulo: "Registrar memória", risco: "coordenação interna" },
  propor_operacao: { rotulo: "Propor operação comercial", risco: "coordenação interna" },
};

export const ROTULO_TIPO_TAREFA: Record<string, string> = {
  copiloto_conversa: "Conversa do Copiloto",
  analise_comercial: "Análise comercial",
  priorizar_oportunidades: "Priorização de oportunidades",
  supervisao_comercial: "Supervisão comercial",
  plano_prospeccao: "Plano de prospecção",
  preparar_abordagem: "Rascunho de abordagem",
  preparar_proposta: "Rascunho de proposta",
  plano_estrategia: "Plano de estratégia",
  plano_seo: "Plano de SEO",
};
export const TIPOS_DE_PLANEJAMENTO = [
  "analise_comercial",
  "priorizar_oportunidades",
  "plano_prospeccao",
  "plano_estrategia",
  "plano_seo",
] as const;

export const ROTULO_STATUS_TAREFA: Record<string, string> = {
  queued: "Na fila",
  processing: "Em execução",
  awaiting_approval: "Aguardando aprovação",
  succeeded: "Concluída",
  failed: "Falhou",
  cancelled: "Cancelada",
  blocked: "Bloqueada",
};

export function ehPapel(v: unknown): v is Papel {
  return typeof v === "string" && (PAPEIS as readonly string[]).includes(v);
}

/** Definição da equipe padrão: os 6 subordinados, na ordem em que o banco os cria (gerente primeiro). */
export function equipePadrao(): { papel: Exclude<Papel, "ceo"> }[] {
  return PAPEIS_SUBORDINADOS.map((papel) => ({ papel }));
}

/** Papéis que ainda não existem na organização (candidatos a "criar equipe"). */
export function papeisFaltantes(existentes: readonly string[]): Exclude<Papel, "ceo">[] {
  return PAPEIS_SUBORDINADOS.filter((p) => !existentes.includes(p));
}

/** Ordem de exibição: CEO, Gerente e depois os especialistas. */
export function ordenarEquipe<T extends { papel?: string }>(agentes: readonly T[]): T[] {
  const ordem = (a: T) => PAPEIS.indexOf((a.papel ?? "") as Papel);
  return [...agentes].sort((x, y) => ordem(x) - ordem(y));
}

/** Estado operacional de qualquer agente (para o CEO, derivarEstadoCeo continua sendo usado direto). */
export function derivarEstadoAgente(input: {
  carregando: boolean;
  erroServico: boolean;
  carga: CargaCeo | null;
}): EstadoCeo {
  return derivarEstadoCeo({ ...input, qualquerFerramenta: true });
}

// ───────────────────────────── relatórios (Tela 12) ─────────────────────────────
export type RunLinha = {
  agentId: string;
  status: string;
  custoUsd: number;
  passos: number;
  iniciadoEm: string;
  finalizadoEm: string | null;
};
export type TarefaLinha = {
  id: string;
  agentId: string;
  tipo: string;
  status: string;
  delegadoPor: string | null;
  criadoEm: string;
  concluidoEm: string | null;
  ultimoErro: string | null;
  resultado: { texto?: string; rascunho?: boolean; custo_usd?: number } | null;
};

export type ResumoAgente = {
  agentId: string;
  execucoes: number;
  concluidas: number;
  falhas: number;
  canceladas: number;
  custoUsd: number;
  passos: number;
  duracaoMediaS: number | null;
  tarefasAbertas: number;
};

/** Agrega execuções e fila por agente na janela (só dados recebidos; nada é estimado). */
export function resumirPorAgente(
  runs: readonly RunLinha[],
  tarefas: readonly TarefaLinha[],
  agentIds: readonly string[],
  agora: Date,
  janelaDias = 30,
): { porAgente: ResumoAgente[]; total: Omit<ResumoAgente, "agentId"> } {
  const desde = agora.getTime() - janelaDias * 86_400_000;
  const porAgente = agentIds.map((agentId): ResumoAgente => {
    const rs = runs.filter((r) => r.agentId === agentId && Date.parse(r.iniciadoEm) >= desde);
    const duracoes = rs
      .filter((r) => r.finalizadoEm)
      .map((r) => (Date.parse(r.finalizadoEm!) - Date.parse(r.iniciadoEm)) / 1000)
      .filter((d) => Number.isFinite(d) && d >= 0);
    return {
      agentId,
      execucoes: rs.length,
      concluidas: rs.filter((r) => r.status === "succeeded").length,
      falhas: rs.filter((r) => r.status === "failed").length,
      canceladas: rs.filter((r) => r.status === "cancelled").length,
      custoUsd: rs.reduce((a, r) => a + r.custoUsd, 0),
      passos: rs.reduce((a, r) => a + r.passos, 0),
      duracaoMediaS: duracoes.length ? duracoes.reduce((a, b) => a + b, 0) / duracoes.length : null,
      tarefasAbertas: tarefas.filter(
        (t) => t.agentId === agentId && (t.status === "queued" || t.status === "processing"),
      ).length,
    };
  });
  const soma = (f: (r: ResumoAgente) => number) => porAgente.reduce((a, r) => a + f(r), 0);
  const duracoes = porAgente.filter((r) => r.duracaoMediaS !== null);
  return {
    porAgente,
    total: {
      execucoes: soma((r) => r.execucoes),
      concluidas: soma((r) => r.concluidas),
      falhas: soma((r) => r.falhas),
      canceladas: soma((r) => r.canceladas),
      custoUsd: soma((r) => r.custoUsd),
      passos: soma((r) => r.passos),
      duracaoMediaS: duracoes.length
        ? duracoes.reduce((a, r) => a + r.duracaoMediaS!, 0) / duracoes.length
        : null,
      tarefasAbertas: soma((r) => r.tarefasAbertas),
    },
  };
}

export type AprovacaoLinha = {
  id: string;
  agentId: string;
  tipo: string;
  resumo: string;
  status: string;
  payload: { equipe?: { papel: string }[]; operacao?: { nome?: string } } | null;
  criadoEm: string;
  decididoEm: string | null;
  motivo: string | null;
};

/** Proposta de estrutura de equipe (a única aprovação que materializa agentes). */
export function ehPropostaDeEquipe(a: Pick<AprovacaoLinha, "tipo" | "payload">): boolean {
  return a.tipo === "mudanca_configuracao" && Array.isArray(a.payload?.equipe);
}

/** Proposta de OPERAÇÃO comercial do CEO: aprovar cria a operação (nunca agentes nem permissões). */
export function ehPropostaDeOperacao(a: Pick<AprovacaoLinha, "tipo" | "payload">): boolean {
  return (
    a.tipo === "mudanca_configuracao" &&
    typeof a.payload?.operacao === "object" &&
    a.payload?.operacao !== null
  );
}

export const ROTULO_TIPO_APROVACAO: Record<string, string> = {
  mudanca_configuracao: "Mudança de configuração",
  acao_externa: "Ação externa",
  gasto: "Gasto",
};

export type RotuloStatusAprovacao = "Pendente" | "Aprovada" | "Rejeitada" | "Expirada";
export function rotuloStatusAprovacao(status: string): RotuloStatusAprovacao {
  return (
    (
      {
        pending: "Pendente",
        approved: "Aprovada",
        rejected: "Rejeitada",
        expired: "Expirada",
      } as Record<string, RotuloStatusAprovacao>
    )[status] ?? "Pendente"
  );
}

export function formatarDuracao(segundos: number | null): string {
  if (segundos === null) return "—";
  if (segundos < 60) return `${segundos.toFixed(1).replace(".", ",")} s`;
  return `${Math.floor(segundos / 60)} min ${Math.round(segundos % 60)} s`;
}

export type AgenteEquipeRow = AgenteCeoRow & { papel: Papel };
