// Ícones SVG (linha, currentColor) para os cards de serviço. A IA devolve uma
// palavra-chave (ex.: "tooth") e o template converte no SVG — nunca renderiza
// texto cru de ícone. Chave desconhecida cai no default ("check").
const P: Record<string, string> = {
  tooth:
    '<path d="M12 5.5c-1.5-1.5-3-2-4.5-1.5C5.5 4.7 4.5 6.5 5 9c.3 1.7.5 3 1 5 .4 1.6 1 3.5 2 3.5s1-2 1.5-3.5S11 15 12 15s1 .5 1.5 2 .5 3.5 1.5 3.5 1.6-1.9 2-3.5c.5-2 .7-3.3 1-5 .5-2.5-.5-4.3-2.5-5C15 3.5 13.5 4 12 5.5Z"/>',
  sparkles:
    '<path d="M12 3l1.9 4.6L18.5 9.5 13.9 11.4 12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3Z"/><path d="M19 15l.8 2 2 .8-2 .8L19 21l-.8-2-2-.8 2-.8L19 15Z"/>',
  shield: '<path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z"/><path d="M9 12l2 2 4-4"/>',
  heart:
    '<path d="M12 20s-7-4.5-9.3-9C1.2 8 2.5 5 5.5 5c2 0 3.2 1.3 3.5 2 .3-.7 1.5-2 3.5-2 3 0 4.3 3 2.8 6C19 15.5 12 20 12 20Z"/>',
  smile:
    '<circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M9 9h.01M15 9h.01"/>',
  stethoscope:
    '<path d="M6 3v6a4 4 0 0 0 8 0V3"/><path d="M6 3H4M14 3h-2M10 17a4 4 0 0 0 8 0v-2"/><circle cx="19" cy="13" r="2"/>',
  star: '<path d="M12 3l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 18.8 6.2 21l1.1-6.5L2.6 9.8l6.5-.9L12 3Z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  phone:
    '<path d="M6 3h3l1.5 5-2 1.5a12 12 0 0 0 6 6l1.5-2 5 1.5V19a2 2 0 0 1-2 2A16 16 0 0 1 5 5a2 2 0 0 1 1-2Z"/>',
  "map-pin":
    '<path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  "check-circle": '<circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/>',
  scissors:
    '<circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><path d="M8 8l12 8M8 16L20 8"/>',
  wrench: '<path d="M15 5a4 4 0 0 0-5 5L4 16l4 4 6-6a4 4 0 0 0 5-5l-2.5 2.5L14 5.5 15 5Z"/>',
  car: '<path d="M5 13l1.5-4.5A2 2 0 0 1 8.4 7h7.2a2 2 0 0 1 1.9 1.5L19 13v5h-2v-2H7v2H5v-5Z"/><circle cx="8" cy="16" r="0"/>',
  paw: '<circle cx="8" cy="9" r="1.6"/><circle cx="16" cy="9" r="1.6"/><circle cx="6" cy="13" r="1.4"/><circle cx="18" cy="13" r="1.4"/><path d="M12 12c-2.5 0-4 2-4 3.5S9.5 18 12 18s4-1 4-2.5S14.5 12 12 12Z"/>',
  scale: '<path d="M12 3v18M7 7h10M7 7L4 14h6L7 7Zm10 0l-3 7h6l-3-7ZM6 21h12"/>',
  calculator:
    '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15v3M8 18h4"/>',
  briefcase:
    '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 12h18"/>',
  users:
    '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3 2.7-5 6-5s6 2 6 5"/><path d="M16 6a3 3 0 0 1 0 6M21 20c0-2.5-1.5-4-3.5-4.5"/>',
  award: '<circle cx="12" cy="9" r="5"/><path d="M8.5 13L7 21l5-2.5L17 21l-1.5-8"/>',
  leaf: '<path d="M4 20C4 11 11 4 20 4c0 9-7 16-16 16Z"/><path d="M4 20c4-6 8-8 12-9"/>',
  home: '<path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-9Z"/>',
  camera:
    '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7l1.5-2h5L16 7"/><circle cx="12" cy="13" r="3.2"/>',
  calendar:
    '<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 9h16M8 3v4M16 3v4M9 14l2 2 4-4"/>',
  "message-circle": '<path d="M21 12a8 8 0 0 1-11.5 7.2L4 21l1.8-5.5A8 8 0 1 1 21 12Z"/>',
  gem: '<path d="M6 4h12l3 5-9 11L3 9l3-5Z"/><path d="M3 9h18M9 4l3 16 3-16"/>',
  crown: '<path d="M4 18h16M4 18l-1-9 5 4 4-7 4 7 5-4-1 9"/>',
  droplet: '<path d="M12 3s6 6 6 10a6 6 0 0 1-12 0c0-4 6-10 6-10Z"/>',
};

/**
 * Devolve o SVG (stroke currentColor) da palavra-chave dada. Tamanho DEFAULT 1em
 * (acompanha o texto) — contêineres com `.ic svg{width:..}` sobrescrevem. Isso
 * evita SVG gigante quando o ícone fica solto em texto (ex.: kicker, .mini).
 */
export function icone(nome: string | undefined): string {
  const path = P[(nome ?? "").toLowerCase().trim()] ?? P["check-circle"];
  return `<svg viewBox="0 0 24 24" width="1em" height="1em" style="flex:none;vertical-align:-.15em" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
}
