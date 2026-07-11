// Formatação pt-BR compartilhada pelas telas.

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** Valor em Reais. `null`/`undefined` vira "—". */
export function formatBRL(v: number | null | undefined): string {
  if (v == null) return "—";
  return BRL.format(v);
}

/** Data curta (dd/mm/aaaa). `null`/`undefined` vira "—". */
export function formatData(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR");
}

/** Data + hora curtas. */
export function formatDataHora(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}
