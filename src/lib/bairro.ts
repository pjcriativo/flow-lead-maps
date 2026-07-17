// Extrai o BAIRRO do endereço. Cobre os DOIS formatos que aparecem nos leads reais:
//   (A) Google Places completo: "<logradouro>, <nº> - <BAIRRO>, <Cidade> - <UF>[, <CEP>]"
//       ex.: "Av. Guilherme Giorgi, 410 - Vila Carrao, São Paulo - SP, 03426-000" -> "Vila Carrao"
//   (B) curto: "<logradouro>, <nº> — <BAIRRO>"  (sem cidade/UF)
//       ex.: "Rua Barão do Serro Azul, 525 — Centro" -> "Centro"
// Traços podem vir como hífen (-), en-dash (–) ou em-dash (—) — normalizamos todos.
// Função PURA. Endereço fora do padrão -> null (NUNCA inventa bairro).
export function extrairBairro(endereco: string | null | undefined): string | null {
  if (!endereco || typeof endereco !== "string") return null;
  let s = endereco.replace(/[—–]/g, "-").trim(); // normaliza traços
  s = s.replace(/,\s*(brasil|brazil)\s*$/i, "").trim(); // tira país
  s = s.replace(/,?\s*\d{5}-?\d{3}\s*$/, "").trim(); // tira CEP
  s = s.replace(/[,\s]+$/, "").trim(); // tira vírgula/espaço soltos no fim

  // (A) termina em " - <UF>" -> remove a cidade (última vírgula antes do UF)
  let core = s;
  const mUf = s.match(/^(.*?)\s-\s([A-Z]{2})$/);
  if (mUf) {
    const semUf = mUf[1].trim();
    const partes = semUf.split(",").map((x) => x.trim());
    if (partes.length < 2) return null; // "São Paulo - SP" (sem logradouro/bairro)
    core = partes.slice(0, -1).join(", "); // remove a cidade
  }

  // bairro = trecho após o ÚLTIMO " - "
  const idx = core.lastIndexOf(" - ");
  if (idx < 0) return null;
  const bairro = core.slice(idx + 3).trim();
  if (!bairro || /^\d+$/.test(bairro) || bairro.length > 60) return null;
  return bairro;
}
