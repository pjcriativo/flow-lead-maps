// Modelos de IA conhecidos pela interface. A lista estática (MODELOS_CEO, Claude) é a base; quando a
// Central de IA do Super Admin está publicada, o catálogo vindo do backend (ia_modelos_disponiveis)
// acrescenta os modelos de outros provedores (ex.: OpenAI) com o preço informado pelo Super Admin.
// Registro de módulo (não estado React) para que validações puras — validarConfigCeo, derivarEstadoCeo,
// estimarCustoPerguntaUsd — enxerguem o mesmo catálogo sem precisar atravessar todos os componentes.
// O backend continua sendo a autoridade: aqui só se evita exibir "erro de configuração" falso.
export type ModeloCatalogo = {
  id: string;
  provider: string;
  rotulo: string;
  usdEntrada: number;
  usdSaida: number;
};

let extras: ModeloCatalogo[] = [];

export function definirModelosExtras(lista: readonly ModeloCatalogo[]): void {
  extras = lista.filter((m) => m && typeof m.id === "string" && m.id.length > 0);
}

export const modelosExtras = (): readonly ModeloCatalogo[] => extras;
