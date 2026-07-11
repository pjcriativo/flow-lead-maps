// Camada de serviço — Publicação (Fase 4).
// HOJE: dados mock em memória. DEPOIS: trocar SÓ o corpo destas funções pela
// Edge Function publish-site (grava no Supabase Storage + subdomínio próprio e
// devolve a URL pública). As telas consomem ESTAS assinaturas e não mudam.
import type { Publicacao } from "@/types";

const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms));

// slug a partir do nome do negócio (ex.: "Bella Pele" -> "bella-pele")
function slug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

let store: Publicacao[] = [
  {
    id: "pub-1",
    redesign_id: "rd-1",
    lead_id: "lead-201",
    lead_nome: "Estética Bella Pele",
    url_publica: "https://lead.flowleads.com.br/bella-pele",
    status: "publicado",
    publicado_em: "2026-07-06T11:00:00.000Z",
  },
  {
    id: "pub-2",
    redesign_id: "rd-3",
    lead_id: "lead-206",
    lead_nome: "Barbearia Navalha de Ouro",
    url_publica: null,
    status: "nao_publicado",
    publicado_em: null,
  },
];

/** Lista os sites gerados e seu estado de publicação. */
export async function listarPublicacoes(): Promise<Publicacao[]> {
  // TODO: LIGAR API — GET publicações do usuário/org no Supabase (RLS).
  await delay();
  return store.map((p) => ({ ...p }));
}

/** Publica (ou republica) o site gerado; devolve a URL pública. */
export async function publicar(id: string): Promise<Publicacao> {
  // TODO: LIGAR API — Edge Function publish-site: sobe os arquivos no Storage /
  // subdomínio do Flow Leads e devolve a URL pública (HTTPS automático).
  await delay(1400);
  let atualizado: Publicacao | undefined;
  store = store.map((p) => {
    if (p.id !== id) return p;
    atualizado = {
      ...p,
      status: "publicado" as const,
      url_publica: p.url_publica ?? `https://lead.flowleads.com.br/${slug(p.lead_nome)}`,
      publicado_em: new Date().toISOString(),
    };
    return atualizado;
  });
  if (!atualizado) throw new Error("Publicação não encontrada");
  return { ...atualizado };
}
