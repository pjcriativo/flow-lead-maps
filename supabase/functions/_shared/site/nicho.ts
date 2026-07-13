// Detecta o NICHO do lead (a partir da categoria + textos do site) e mapeia para
// um dos 3 templates premium. Determinístico — a IA não escolhe design.
import type { TemplateId } from "./tipos.ts";

const SAUDE = [
  "odonto",
  "dent",
  "dental",
  "estétic",
  "estetic",
  "clínic",
  "clinic",
  "saúde",
  "saude",
  "médic",
  "medic",
  "fisioterap",
  "dermato",
  "nutri",
  "psicó",
  "psico",
  "harmoniz",
  "spa",
  "hospital",
  "laborat",
  "vacin",
  "oftalm",
  "ortoped",
  "farmác",
  "farmac",
];
const PROFISSIONAL = [
  "advoca",
  "advogad",
  "jurídic",
  "juridic",
  "contábil",
  "contabil",
  "contador",
  "consultor",
  "arquitet",
  "engenhar",
  "imobiliár",
  "imobiliar",
  "corretor",
  "seguros",
  "financeir",
  "assessor",
  "auditor",
  "escritório",
  "escritorio",
];
const SERVICO_LOCAL = [
  "salão",
  "salao",
  "barbear",
  "cabelo",
  "beleza",
  "manicure",
  "estética automotiva",
  "oficina",
  "mecânic",
  "mecanic",
  "funilar",
  "auto",
  "pet",
  "veterin",
  "petshop",
  "restaurant",
  "lanchonet",
  "pizzar",
  "padar",
  "açaí",
  "acai",
  "bar",
  "buffet",
  "academ",
  "crossfit",
  "pilates",
  "tatua",
  "piercing",
  "lavagem",
  "borrachar",
  "loja",
  "moda",
  "vestuár",
  "vestuar",
  "calçad",
  "calcad",
  "floricultura",
];

function bater(texto: string, lista: string[]): boolean {
  return lista.some((t) => texto.includes(t));
}

export function detectarNicho(categoria: string | null, textos = ""): TemplateId {
  const t = `${categoria ?? ""} ${textos}`.toLowerCase();
  if (bater(t, SAUDE)) return "saude";
  if (bater(t, PROFISSIONAL)) return "profissional";
  if (bater(t, SERVICO_LOCAL)) return "servico-local";
  // fallback: serviço local é o mais genérico e vibrante
  return "servico-local";
}

/** Rótulo bonito da categoria (capitaliza, remove ruído). */
export function categoriaLabel(categoria: string | null, fallback = "Negócio local"): string {
  if (!categoria) return fallback;
  const c = categoria.trim();
  return c.charAt(0).toUpperCase() + c.slice(1);
}
