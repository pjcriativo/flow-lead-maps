// Normalização de telefone/WhatsApp para o padrão brasileiro.
// WhatsApp só faz sentido em CELULAR (9º dígito). Fixo não vira WhatsApp.

export function onlyDigits(s: string | null | undefined): string {
  return (s ?? "").replace(/\D+/g, "");
}

/**
 * Retorna o WhatsApp no formato internacional BR "55DDDNÚMERO"
 * (ex.: "5541999990000"), pronto para wa.me — ou null se não for celular.
 */
export function toBrWhatsapp(phone: string | null | undefined): string | null {
  let d = onlyDigits(phone);
  if (!d) return null;
  // remove código do país se presente
  if (d.startsWith("55") && (d.length === 12 || d.length === 13)) {
    d = d.slice(2);
  }
  // d agora deve ser DDD (2) + número local
  if (d.length === 11) {
    // DDD + 9 dígitos: celular se o 3º dígito é 9
    if (d[2] === "9") return "55" + d;
    return null;
  }
  // 10 dígitos = fixo (DDD + 8) → não é WhatsApp
  return null;
}

/** Extrai um número de WhatsApp de um link wa.me / api.whatsapp.com. */
export function whatsappFromLink(href: string): string | null {
  const m = href.match(
    /(?:wa\.me\/|api\.whatsapp\.com\/send\?phone=|whatsapp\.com\/send\?phone=)(\+?\d[\d\s-]{7,})/i,
  );
  if (!m) return null;
  let d = onlyDigits(m[1]);
  if (!d) return null;
  // já vem com 55? valida tamanho
  if (d.startsWith("55") && (d.length === 12 || d.length === 13)) return d;
  // sem país mas parece BR (DDD + celular)
  if (d.length === 11 && d[2] === "9") return "55" + d;
  if (d.length === 13 && d.startsWith("55")) return d;
  return d.length >= 12 ? d : null;
}
