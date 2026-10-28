// Lógica PURA da configuração do CEO de IA (Telas 02, 03 e 10). Sem I/O: o que vale é o backend
// (migrations 202610270001/2); aqui só espelhamos os tetos para validar cedo e derivar os estados
// que a interface mostra. Nenhum valor daqui concede permissão — o banco recusa o que excede.
import { modelosExtras } from "./modelos-ia.ts";

export const FERRAMENTA_RESUMO_COMERCIAL = "consultar_resumo_comercial";

/** Tetos absolutos do banco (CHECK em agents) e padrões da fundação. */
export const TETOS_CEO = {
  diaMaxUsd: 5,
  mesMaxUsd: 50,
  diaPadraoUsd: 0.5,
  mesPadraoUsd: 5,
} as const;

/** Mesma tabela de preços do runtime (_shared/agent-runtime.ts); um teste garante a paridade. */
export const MODELOS_CEO = [
  { id: "claude-haiku-4-5", rotulo: "Claude Haiku 4.5", usdEntrada: 1, usdSaida: 5, padrao: true },
  {
    id: "claude-sonnet-4-5",
    rotulo: "Claude Sonnet 4.5",
    usdEntrada: 3,
    usdSaida: 15,
    padrao: false,
  },
  { id: "claude-sonnet-5", rotulo: "Claude Sonnet 5", usdEntrada: 3, usdSaida: 15, padrao: false },
  { id: "claude-opus-4-7", rotulo: "Claude Opus 4.7", usdEntrada: 5, usdSaida: 25, padrao: false },
  { id: "claude-opus-4-8", rotulo: "Claude Opus 4.8", usdEntrada: 5, usdSaida: 25, padrao: false },
] as const;
export const MODELO_PADRAO_CEO = "claude-haiku-4-5";

/** Base estática (Claude) + catálogo da Central de IA, quando carregado (ver modelos-ia.ts). */
export function modelosConhecidos(): { id: string; usdEntrada: number; usdSaida: number }[] {
  const base: { id: string; usdEntrada: number; usdSaida: number }[] = MODELOS_CEO.map((m) => ({
    id: m.id,
    usdEntrada: m.usdEntrada,
    usdSaida: m.usdSaida,
  }));
  for (const m of modelosExtras()) if (!base.some((b) => b.id === m.id)) base.push(m);
  return base;
}

/** Avatares profissionais que já existem no catálogo da Tela 02 (o banco só aceita esta origem). */
export const AVATARES_CEO = [
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80",
] as const;

export type ConfigCeoForm = {
  nome: string;
  cargo: string;
  departamento: string;
  descricao: string;
  especialidade: string;
  avatarUrl: string;
  modelo: string;
  tetoDiaUsd: number;
  tetoMesUsd: number;
  ferramentas: string[];
};

export const CONFIG_CEO_PADRAO: ConfigCeoForm = {
  nome: "CEO de IA",
  cargo: "Diretor Comercial de IA",
  departamento: "Comercial",
  descricao: "Analisa o funil comercial da organização e responde com dados reais.",
  especialidade: "Estratégia comercial",
  avatarUrl: AVATARES_CEO[0],
  modelo: MODELO_PADRAO_CEO,
  tetoDiaUsd: TETOS_CEO.diaPadraoUsd,
  tetoMesUsd: TETOS_CEO.mesPadraoUsd,
  ferramentas: [FERRAMENTA_RESUMO_COMERCIAL],
};

export type ErrosConfigCeo = Partial<Record<keyof ConfigCeoForm, string>>;

export function validarConfigCeo(f: ConfigCeoForm): { ok: boolean; erros: ErrosConfigCeo } {
  const erros: ErrosConfigCeo = {};
  const tam = (v: string, min: number, max: number) =>
    v.trim().length >= min && v.trim().length <= max;
  if (!tam(f.nome, 1, 80)) erros.nome = "Informe o nome (até 80 caracteres).";
  if (!tam(f.cargo, 1, 80)) erros.cargo = "Informe o cargo (até 80 caracteres).";
  if (!tam(f.departamento, 1, 80))
    erros.departamento = "Informe o departamento (até 80 caracteres).";
  if (!tam(f.especialidade, 1, 120))
    erros.especialidade = "Informe a especialidade (até 120 caracteres).";
  if (f.descricao.length > 500) erros.descricao = "A descrição aceita até 500 caracteres.";
  if (!(AVATARES_CEO as readonly string[]).includes(f.avatarUrl))
    erros.avatarUrl = "Escolha um avatar da lista.";
  if (!modelosConhecidos().some((m) => m.id === f.modelo))
    erros.modelo = "Modelo indisponível no backend.";
  if (!Number.isFinite(f.tetoDiaUsd) || f.tetoDiaUsd <= 0 || f.tetoDiaUsd > TETOS_CEO.diaMaxUsd) {
    erros.tetoDiaUsd = `O limite diário vai de US$ 0,01 a US$ ${TETOS_CEO.diaMaxUsd}.`;
  }
  if (!Number.isFinite(f.tetoMesUsd) || f.tetoMesUsd <= 0 || f.tetoMesUsd > TETOS_CEO.mesMaxUsd) {
    erros.tetoMesUsd = `O limite mensal vai de US$ 0,01 a US$ ${TETOS_CEO.mesMaxUsd}.`;
  } else if (!erros.tetoDiaUsd && f.tetoDiaUsd > f.tetoMesUsd) {
    erros.tetoMesUsd = "O limite mensal não pode ser menor que o diário.";
  }
  if (f.ferramentas.some((t) => t !== FERRAMENTA_RESUMO_COMERCIAL)) {
    erros.ferramentas = "Somente consultar_resumo_comercial está disponível.";
  }
  return { ok: Object.keys(erros).length === 0, erros };
}

/** Custo típico de UMA pergunta (2 chamadas ao modelo, ~3 mil tokens de entrada e ~600 de saída). */
export function estimarCustoPerguntaUsd(modeloId: string): number | null {
  const m = modelosConhecidos().find((x) => x.id === modeloId);
  if (!m) return null;
  return (3000 * m.usdEntrada + 600 * m.usdSaida) / 1_000_000;
}

export function formatarUsd(v: number): string {
  return `US$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: v < 0.1 ? 4 : 2 })}`;
}

// ───────────────────────────── estados operacionais ─────────────────────────────
export type EstadoCeoId =
  | "carregando"
  | "servico_indisponivel"
  | "nao_configurado"
  | "erro_configuracao"
  | "bloqueado"
  | "limite_atingido"
  | "pausado"
  | "ativo"
  | "configurado"
  | "inativo";

export type TomEstado = "neutro" | "ok" | "aviso" | "erro";

export type AgenteCeoRow = {
  id: string;
  orgId: string;
  nome: string;
  cargo: string | null;
  departamento: string | null;
  descricao: string | null;
  especialidade: string | null;
  avatarUrl: string | null;
  modelo: string;
  estado: "inativo" | "ativo" | "pausado";
  killSwitch: boolean;
  tetoDiaUsd: number;
  tetoMesUsd: number;
  maxPassos: number;
  /** Equipe comercial (migration 003). Ausentes nos dados antigos do CEO. */
  papel?: string;
  autonomia?: "somente_leitura" | "interna_supervisionada";
  reportsTo?: string | null;
};

export type CargaCeo = {
  agente: AgenteCeoRow | null;
  ferramentasConcedidas: string[];
  gastoDiaUsd: number;
  gastoMesUsd: number;
};

export type EstadoCeo = { id: EstadoCeoId; rotulo: string; descricao: string; tom: TomEstado };

const ESTADOS: Record<EstadoCeoId, Omit<EstadoCeo, "id">> = {
  carregando: {
    rotulo: "Verificando…",
    descricao: "Consultando o estado real do CEO de IA.",
    tom: "neutro",
  },
  servico_indisponivel: {
    rotulo: "Serviço indisponível",
    descricao:
      "O backend do CEO de IA não respondeu ou ainda não foi implantado. Nada foi ativado.",
    tom: "erro",
  },
  nao_configurado: {
    rotulo: "Não configurado",
    descricao: "Esta organização ainda não tem um CEO de IA.",
    tom: "neutro",
  },
  erro_configuracao: {
    rotulo: "Erro de configuração",
    descricao:
      "A configuração está incoerente (modelo, limites ou ferramenta). Revise e salve de novo.",
    tom: "erro",
  },
  bloqueado: {
    rotulo: "Bloqueado",
    descricao: "Kill-switch ligado: o CEO não executa nada até um administrador retomar.",
    tom: "erro",
  },
  limite_atingido: {
    rotulo: "Limite atingido",
    descricao: "O teto de custo de IA do CEO foi atingido (dia ou mês).",
    tom: "aviso",
  },
  pausado: {
    rotulo: "Pausado",
    descricao: "O CEO está pausado e não responde até ser reativado.",
    tom: "aviso",
  },
  ativo: {
    rotulo: "Ativo",
    descricao: "O CEO responde no Copiloto, somente leitura e com execução manual.",
    tom: "ok",
  },
  configurado: {
    rotulo: "Configurado",
    descricao: "Configuração salva. Falta ativar o CEO.",
    tom: "aviso",
  },
  inativo: {
    rotulo: "Inativo",
    descricao: "O CEO existe, mas a configuração está incompleta e ele não responde.",
    tom: "neutro",
  },
};

export function infoEstado(id: EstadoCeoId): EstadoCeo {
  return { id, ...ESTADOS[id] };
}

/** Precedência: o pior problema vence. `erroServico` = a leitura do backend falhou. */
export function derivarEstadoCeo(input: {
  carregando: boolean;
  erroServico: boolean;
  carga: CargaCeo | null;
  /** Subordinados não usam a ferramenta do CEO: basta ter ALGUMA ferramenta concedida. */
  qualquerFerramenta?: boolean;
}): EstadoCeo {
  if (input.carregando) return infoEstado("carregando");
  if (input.erroServico || !input.carga) return infoEstado("servico_indisponivel");
  const { agente, ferramentasConcedidas, gastoDiaUsd, gastoMesUsd } = input.carga;
  if (!agente) return infoEstado("nao_configurado");
  if (agente.killSwitch) return infoEstado("bloqueado");

  const modeloValido = modelosConhecidos().some((m) => m.id === agente.modelo);
  const limitesValidos =
    agente.tetoDiaUsd > 0 &&
    agente.tetoMesUsd > 0 &&
    agente.tetoDiaUsd <= agente.tetoMesUsd &&
    agente.tetoDiaUsd <= TETOS_CEO.diaMaxUsd &&
    agente.tetoMesUsd <= TETOS_CEO.mesMaxUsd;
  const temFerramenta = input.qualquerFerramenta
    ? ferramentasConcedidas.length > 0
    : ferramentasConcedidas.includes(FERRAMENTA_RESUMO_COMERCIAL);
  const identidadeSalva = Boolean(agente.cargo);
  // Ativo sem ferramenta/identidade é incoerência que o banco já impede; se aparecer, é erro.
  if (
    !modeloValido ||
    !limitesValidos ||
    (agente.estado === "ativo" && (!temFerramenta || !identidadeSalva))
  ) {
    return infoEstado("erro_configuracao");
  }
  if (
    agente.estado === "ativo" &&
    (gastoDiaUsd >= agente.tetoDiaUsd || gastoMesUsd >= agente.tetoMesUsd)
  ) {
    return infoEstado("limite_atingido");
  }
  if (agente.estado === "pausado") return infoEstado("pausado");
  if (agente.estado === "ativo") return infoEstado("ativo");
  return infoEstado(temFerramenta && identidadeSalva ? "configurado" : "inativo");
}

/** O Copiloto só conversa com o CEO real quando a flag está ligada E o estado é Ativo. */
export function copilotoRealPronto(flagLigada: boolean, estado: EstadoCeo): boolean {
  return flagLigada && estado.id === "ativo";
}

export function permissoesEfetivas(): { rotulo: string; valor: string }[] {
  return [
    { rotulo: "Acesso aos dados", valor: "Somente leitura" },
    { rotulo: "Envio externo (WhatsApp/e-mail)", valor: "Nenhum" },
    { rotulo: "Prospecção automática", valor: "Nenhuma" },
    { rotulo: "Alteração de leads", valor: "Nenhuma" },
    { rotulo: "Gasto externo", valor: "Somente IA, dentro do limite" },
    { rotulo: "Execução", valor: "Manual (a cada pergunta)" },
    { rotulo: "Kill-switch", valor: "Disponível para administradores" },
    { rotulo: "Registro de atividades", valor: "Cada passo é gravado" },
  ];
}

const ERROS_RPC: Record<string, string> = {
  governanca_exige_sessao_humana: "Esta ação exige uma sessão humana autenticada.",
  sem_permissao_na_organizacao:
    "Somente administradores e gerentes da organização podem fazer isso.",
  modelo_nao_permitido: "Modelo de IA não permitido no backend.",
  limites_incoerentes: "Os limites são incoerentes (o diário não pode passar do mensal).",
  nome_invalido: "Nome inválido.",
  ferramenta_inexistente_ou_inativa: "Ferramenta inexistente ou inativa.",
  ferramenta_acima_da_autonomia: "Esta ferramenta excede a autonomia somente leitura.",
  ceo_ativo_exige_ferramenta: "Um CEO ativo precisa manter ao menos uma ferramenta.",
  ceo_sem_ferramenta: "Conceda a ferramenta de consulta antes de ativar.",
  ceo_sem_identidade: "Salve a identidade do CEO antes de ativar.",
  kill_switch_ligado: "O kill-switch está ligado. Retome antes de ativar.",
  agente_inexistente: "CEO não encontrado.",
  superior_inativo: "Ative primeiro o superior na hierarquia (CEO e depois Gerente).",
  ceo_inexistente: "Configure o CEO de IA antes de criar a equipe.",
  equipe_invalida: "Estrutura de equipe inválida.",
  papel_invalido: "Papel inválido na estrutura da equipe.",
  papel_duplicado: "Papel repetido na estrutura da equipe.",
  agente_ja_existe: "Um dos agentes já existe nesta organização.",
  gerente_ausente: "Os especialistas exigem o Gerente Comercial na equipe.",
  proposta_pendente: "Já existe uma proposta de equipe aguardando decisão.",
  aprovacao_ja_decidida: "Esta aprovação já foi decidida.",
  aprovacao_nao_e_de_equipe: "Esta aprovação não é uma proposta de equipe.",
  delegacao_nao_habilitada: "A delegação interna não está habilitada para este agente.",
  papel_nao_delega: "Este papel não pode receber delegação interna.",
  ferramenta_fora_do_papel: "Esta ferramenta não pertence ao papel deste agente.",
  hierarquia_imutavel: "A hierarquia não pode ser alterada depois da criação.",
};

/** Traduz erro de RPC/PostgREST em mensagem do usuário; `indisponivel` = backend ausente/sem rede. */
export function traduzirErroCeo(err: unknown): { mensagem: string; indisponivel: boolean } {
  const e = (err ?? {}) as { message?: string; code?: string; details?: string };
  // Erro já legível vindo da Edge de processamento (código sintético WORKER).
  if (e.code === "WORKER" && e.message) {
    return {
      mensagem: e.message,
      indisponivel: /failed to fetch|network|non-2xx/i.test(e.message),
    };
  }
  const texto = `${e.message ?? ""} ${e.details ?? ""}`;
  const ausente =
    ["42P01", "42883", "PGRST202", "PGRST205"].includes(e.code ?? "") ||
    /schema cache|does not exist|Could not find the (table|function)/i.test(texto);
  const rede = /failed to fetch|networkerror|load failed/i.test(texto);
  if (ausente || rede) {
    return { mensagem: ESTADOS.servico_indisponivel.descricao, indisponivel: true };
  }
  if (/check constraint|violates check/i.test(texto)) {
    return { mensagem: "Valor fora dos limites permitidos pelo backend.", indisponivel: false };
  }
  const chave = Object.keys(ERROS_RPC).find((k) => texto.includes(k));
  return {
    mensagem: chave ? ERROS_RPC[chave] : "Não foi possível concluir a operação.",
    indisponivel: false,
  };
}
