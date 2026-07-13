// Imagens de fallback por nicho (Unsplash CDN, URLs estáveis e verificadas).
// Só entram quando o site atual/Google do lead NÃO tem fotos usáveis — nunca
// deixar seções quebradas. Sempre coerentes com o nicho e SEM repetir a mesma
// foto em seções diferentes.
import type { TemplateId } from "./tipos.ts";

function u(id: string, w = 1400): string {
  return `https://images.unsplash.com/photo-${id}?w=${w}&q=80&auto=format&fit=crop`;
}

const BANCO: Record<TemplateId, string[]> = {
  saude: [
    "1629909613654-28e377c37b09", // consultório odontológico moderno
    "1606811841689-23dfddce3e95", // dentista + paciente
    "1588776814546-1ffcf47267a5", // instrumentos / detalhe clínico
    "1609840114035-3c981b782dfe", // sorriso saudável
    "1622253692010-333f2da6031d", // clínica
    "1598256989800-fe5f95da9787", // atendimento
    "1612349317150-e413f6a5b16d", // equipe/consultório
    "1631549916768-4119b2e5f926", // cadeira odontológica
    "1579684385127-1ef15d508118", // detalhe cuidado
    "1519494026892-80bbd2d6fd0d", // recepção/ambiente
  ],
  "servico-local": [
    "1585747860715-2ba37e788b70",
    "1503951914875-452162b0f3f1",
    "1622287162716-f311baa1a2b8",
    "1560066984-138dadb4c035",
    "1521590832167-7bcbfaa6381f",
    "1487754180451-c456f719a1fc",
  ],
  profissional: [
    "1521737604893-d14cc237f11d",
    "1454165804606-c3d57bc86b40",
    "1589829545856-d10d557cf95f",
    "1507003211169-0a1dd7228f2d",
    "1552664730-d307ca884978",
    "1600880292203-757bb62b4baf",
  ],
};

export function imagensFallback(nicho: TemplateId, w = 1400): string[] {
  return (BANCO[nicho] ?? BANCO["servico-local"]).map((id) => u(id, w));
}

export type FotoSet = {
  hero: string;
  sobre: string;
  cta: string;
  galeria: string[];
};

/**
 * Distribui fotos DISTINTAS por seção: prioriza as fotos REAIS do lead
 * (site/Google) e completa com o banco do nicho. Nunca repete a mesma foto.
 */
export function resolverFotoSet(reais: string[], nicho: TemplateId): FotoSet {
  const limpas = reais.filter((x) => /^https?:\/\//i.test(x));
  const pool = [...limpas, ...imagensFallback(nicho)].filter((v, i, a) => a.indexOf(v) === i);
  const get = (i: number) => pool[i % pool.length];
  return {
    hero: get(0),
    sobre: get(1),
    cta: get(2),
    galeria: [get(3), get(4), get(5), get(6)].filter((v, i, a) => a.indexOf(v) === i),
  };
}
