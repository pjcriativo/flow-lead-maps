type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

function normalizarTexto(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function normalizarValor(valor: unknown): JsonValue {
  if (valor === null || typeof valor === "boolean") return valor;
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : String(valor);
  if (typeof valor === "string") return normalizarTexto(valor);
  if (Array.isArray(valor)) return valor.map(normalizarValor);
  if (typeof valor === "object") {
    return Object.fromEntries(
      Object.entries(valor)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([chave, item]) => [chave, normalizarValor(item)]),
    );
  }
  return String(valor);
}

/** Identidade do resultado bruto. Filtros locais e estratégia não entram para maximizar o reúso. */
export function criarChaveCacheRedes(ator: string, input: Record<string, unknown>): string {
  return `apify-redes-v1|${normalizarTexto(ator)}|${JSON.stringify(normalizarValor(input))}`;
}
