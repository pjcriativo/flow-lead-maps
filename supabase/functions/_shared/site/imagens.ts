// Imagens de fallback por nicho (Unsplash CDN, URLs estáveis e verificadas).
// Só entram quando o site atual do lead NÃO tem fotos usáveis — nunca deixar
// o hero/galeria quebrados. Sempre coerentes com o nicho.
import type { TemplateId } from "./tipos.ts";

function u(id: string, w = 1400): string {
  return `https://images.unsplash.com/photo-${id}?w=${w}&q=80&auto=format&fit=crop`;
}

const BANCO: Record<TemplateId, string[]> = {
  saude: [
    "1629909613654-28e377c37b09", // consultório odontológico moderno
    "1588776814546-1ffcf47267a5", // instrumentos / detalhe clínico
    "1606811841689-23dfddce3e95", // dentista + paciente
    "1609840114035-3c981b782dfe", // sorriso saudável
    "1622253692010-333f2da6031d", // clínica
    "1598256989800-fe5f95da9787", // atendimento
  ],
  "servico-local": [
    "1585747860715-2ba37e788b70", // salão/barbearia
    "1503951914875-452162b0f3f1", // barbearia detalhe
    "1622287162716-f311baa1a2b8", // beleza/cabelo
    "1560066984-138dadb4c035", // salão atendimento
    "1521590832167-7bcbfaa6381f", // ambiente
    "1487754180451-c456f719a1fc", // oficina/auto
  ],
  profissional: [
    "1521737604893-d14cc237f11d", // escritório / equipe
    "1454165804606-c3d57bc86b40", // reunião
    "1589829545856-d10d557cf95f", // ambiente corporativo
    "1507003211169-0a1dd7228f2d", // profissional
    "1552664730-d307ca884978", // mesa de reunião
    "1600880292203-757bb62b4baf", // escritório moderno
  ],
};

export function imagensFallback(nicho: TemplateId, w = 1400): string[] {
  return (BANCO[nicho] ?? BANCO["servico-local"]).map((id) => u(id, w));
}

/** Escolhe hero + galeria: usa as fotos REAIS do lead; completa com fallback. */
export function resolverFotos(
  reais: string[],
  nicho: TemplateId,
): { hero: string; galeria: string[] } {
  const limpas = reais.filter((x) => /^https?:\/\//i.test(x));
  const fb = imagensFallback(nicho);
  const hero = limpas[0] ?? fb[0];
  // galeria: fotos reais restantes + fallback até ter pelo menos 3
  const galeria = [...limpas.slice(1), ...fb].filter((v, i, a) => a.indexOf(v) === i).slice(0, 6);
  return { hero, galeria: galeria.length ? galeria : fb.slice(0, 4) };
}
