// Lógica PURA da Central de IA (Super Admin → Inteligência Artificial → Provedores & Modelos). Sem I/O.
// O backend (Edge admin-acoes + migration 202610280001) é a autoridade; aqui só se valida cedo e se
// formata o que o navegador pode mostrar. A chave NUNCA é guardada aqui: só viaja uma vez, no envio.
export const MSG_CONFIGURAR_PROVEDOR =
  "Configure um provedor de IA no Super Admin para ativar o CEO.";

export const PROVEDORES_UI = [
  { id: "openai", rotulo: "OpenAI", chave: "OPENAI_API_KEY" },
  { id: "anthropic", rotulo: "Anthropic (Claude)", chave: "ANTHROPIC_API_KEY" },
] as const;
export type ProvedorId = (typeof PROVEDORES_UI)[number]["id"];

export type StatusConexao = "nao_configurado" | "ok" | "falha" | "revogada";
export const ROTULO_CONEXAO: Record<
  StatusConexao,
  { rotulo: string; tom: "ok" | "aviso" | "erro" | "neutro" }
> = {
  nao_configurado: { rotulo: "Não configurado", tom: "neutro" },
  ok: { rotulo: "Conectado", tom: "ok" },
  falha: { rotulo: "Falha na conexão", tom: "erro" },
  revogada: { rotulo: "Chave revogada", tom: "aviso" },
};

/** Mesma regra do backend (validarFormatoChaveOpenAI): confere o formato ANTES de enviar, nunca guarda. */
export function validarChaveOpenAI(valor: string): { ok: true } | { ok: false; erro: string } {
  const v = valor.trim();
  if (!v) return { ok: false, erro: "Cole a chave da OpenAI." };
  if (/\s/.test(v)) return { ok: false, erro: "A chave não pode conter espaços." };
  if (!/^sk-[A-Za-z0-9_-]{20,300}$/.test(v))
    return { ok: false, erro: "Isto não parece uma chave da OpenAI (começa com “sk-”)." };
  return { ok: true };
}

const MOTIVOS: Record<string, string> = {
  chave_vazia: "Cole a chave da OpenAI.",
  chave_espacos: "A chave não pode conter espaços.",
  chave_formato: "Isto não parece uma chave da OpenAI (começa com “sk-”).",
  chave_invalida_ou_revogada: "A OpenAI recusou a chave (inválida ou revogada). Nada foi salvo.",
  chave_sem_permissao: "A chave não tem permissão para listar modelos. Nada foi salvo.",
  limite_do_provedor: "A OpenAI limitou as requisições agora. Tente de novo em instantes.",
  erro_do_provedor: "A OpenAI respondeu com erro. Tente de novo.",
  sem_resposta_do_provedor: "Sem resposta da OpenAI (rede). Nada foi salvo.",
  chave_nao_configurada: "Configure a chave da OpenAI primeiro.",
  conexao_nao_verificada: "Verifique a conexão antes de ativar o provedor.",
  provedor_em_uso_pelo_ceo: "O CEO usa este provedor. Troque o provedor do CEO antes de desativar.",
  provedor_em_uso_como_fallback: "Este provedor é o fallback autorizado. Remova o fallback antes.",
  preco_obrigatorio_para_ativar: "Informe os dois preços (entrada e saída) para ativar o modelo.",
  preco_invalido: "Preço inválido (use valores entre 0 e 1000 por 1M de tokens).",
  modelo_em_uso_na_configuracao:
    "O modelo está em uso na configuração. Troque-o antes de desativar.",
  modelo_incompativel:
    "Este modelo não atende ao que o CEO exige (texto + chamada de ferramentas).",
  modelo_nao_permitido: "Modelo não permitido: ative-o e informe os preços primeiro.",
  modelo_ceo_deve_ser_openai: "Com provedor OpenAI, o modelo do CEO precisa ser da OpenAI.",
  modelo_ceo_deve_ser_anthropic: "Com provedor Anthropic, o modelo do CEO precisa ser Claude.",
  provedor_desativado: "Ative o provedor antes de usá-lo.",
  fallback_invalido: "O fallback precisa ser de outro provedor.",
  fallback_modelo_invalido: "Escolha um modelo permitido do provedor de fallback.",
  tetos_invalidos: "Tetos inválidos: o diário não pode passar do mensal.",
  migration_pendente: "A Central de IA ainda não foi publicada no banco.",
  migration_catalogo_pendente:
    "O catálogo completo ainda não foi publicado no banco (migration pendente de autorização). Nada foi alterado.",
  acao_desconhecida:
    "O servidor ainda não tem esta função publicada (Edge pendente de autorização). Nada foi alterado.",
  lista_de_modelos_vazia:
    "A OpenAI respondeu sem nenhum modelo: a chave/projeto pode não ter permissão de modelos. O catálogo foi preservado.",
  confirmacao_preco_necessaria: "Este modelo já tem preço: confirme a alteração para sobrescrever.",
  modelo_indisponivel: "A OpenAI não lista mais este modelo para esta chave.",
  modelo_incompativel_com_capacidade: "Este modelo não pertence à categoria desta capacidade.",
  capacidade_invalida: "Capacidade desconhecida.",
  categorias_invalidas: "Escolha ao menos uma categoria válida.",
  limite_invalido: "Contexto/saída devem ser inteiros positivos.",
  preco_item_invalido: "Item de preço inválido.",
  preco_unidade_invalida: "Unidade de cobrança inválida.",
  preco_modo_invalido: "Modalidade de processamento inválida.",
  preco_duplicado: "Há dois preços iguais (item, unidade e modalidade).",
  precos_extra_invalido: "Lista de preços adicionais inválida.",
};
export const traduzirMotivoIa = (reason: string | undefined): string =>
  (reason && MOTIVOS[reason]) || "Operação não concluída.";

export type ModeloLinha = {
  id: string;
  provider: ProvedorId;
  rotulo: string | null;
  usd_in_mtok: number | null;
  usd_out_mtok: number | null;
  ativo: boolean;
};

export function validarPrecos(
  entrada: string,
  saida: string,
): { ok: true; usdIn: number; usdOut: number } | { ok: false; erro: string } {
  const n = (v: string) => (v.trim() === "" ? NaN : Number(v.replace(",", ".")));
  const a = n(entrada);
  const b = n(saida);
  if (!Number.isFinite(a) || !Number.isFinite(b))
    return { ok: false, erro: "Informe os dois preços." };
  if (a < 0 || b < 0 || a > 1000 || b > 1000) return { ok: false, erro: "Preço fora de 0–1000." };
  return { ok: true, usdIn: a, usdOut: b };
}

/** Agrupa por provedor: ativos primeiro. */
export function ordenarModelos(lista: readonly ModeloLinha[]): ModeloLinha[] {
  return [...lista].sort(
    (x, y) =>
      x.provider.localeCompare(y.provider) ||
      Number(y.ativo) - Number(x.ativo) ||
      x.id.localeCompare(y.id),
  );
}

export const formatarUsdCurto = (v: number | null | undefined): string =>
  v === null || v === undefined || !Number.isFinite(Number(v))
    ? "—"
    : `US$ ${Number(v).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: Number(v) < 1 ? 4 : 2,
      })}`;

export type VisaoOrg = {
  org_id: string;
  org_nome: string | null;
  ceo_estado: string | null;
  ceo_modelo: string | null;
  ceo_kill_switch: boolean;
  agentes: number;
  agentes_ativos: number;
  agentes_pausados: number;
  ferramentas_habilitadas: number;
  operacoes_ativas: number;
  execucoes_7d: number;
  falhas_7d: number;
  custo_dia_usd: number;
  custo_mes_usd: number;
  teto_dia_usd: number;
  teto_mes_usd: number;
  aprovacoes_pendentes: number;
  aprovacoes_decididas: number;
};

/** Percentual de uso de um teto (0 quando o teto é 0, para não dividir por zero nem inventar alerta). */
export const percentualDoTeto = (gasto: number, teto: number): number =>
  teto > 0 ? Math.min(100, Math.round((gasto / teto) * 100)) : 0;

/** Alerta de consumo: ≥80% aviso, ≥100% bloqueado (o backend impõe o bloqueio; isto só informa). */
export function alertaDeConsumo(gasto: number, teto: number): "ok" | "aviso" | "bloqueado" {
  const p = percentualDoTeto(gasto, teto);
  return p >= 100 ? "bloqueado" : p >= 80 ? "aviso" : "ok";
}
