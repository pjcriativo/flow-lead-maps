export function nomeAutoLista(niche: string, city: string, uf: string): string {
  const local = [city.trim(), uf.trim()].filter(Boolean).join("/");
  return [niche.trim() || "Busca", local].filter(Boolean).join(" — ");
}

export function resolveListName(
  customName: string,
  niche: string,
  city: string,
  uf: string,
): string {
  return customName.trim() || nomeAutoLista(niche, city, uf);
}
