// Formatação pt-BR compartilhada pelas telas.

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

// ⚙️ Configurações (admin → Configurações básicas → Fuso horário): override global de
// exibição de datas. Setado 1x no mount do painel (dashboard/admin) a partir de
// config_plataforma.fuso_horario; vazio/inválido = fuso do navegador (comportamento antigo).
let _fusoHorario: string | undefined;
export function setFusoHorario(tz: string | null | undefined): void {
  if (!tz) {
    _fusoHorario = undefined;
    return;
  }
  try {
    // valida — timeZone inválido lança; nesse caso ignora (mantém o do navegador)
    new Intl.DateTimeFormat("pt-BR", { timeZone: tz });
    _fusoHorario = tz;
  } catch {
    _fusoHorario = undefined;
  }
}

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
  return d.toLocaleDateString("pt-BR", { timeZone: _fusoHorario });
}

/** Data + hora curtas. */
export function formatDataHora(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: _fusoHorario,
  });
}
