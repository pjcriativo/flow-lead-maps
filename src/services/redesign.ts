// Camada de serviço — Redesign (Fase 3).
// HOJE: dados mock em memória. DEPOIS: trocar SÓ o corpo destas funções pela
// Edge Function redesign-site (API Anthropic gera o site). As telas consomem
// ESTAS assinaturas e não mudam quando a API real entrar.
import type { Redesign } from "@/types";

const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms));

// Leads de exemplo (mock) para gerar redesigns enquanto não há API.
const ALVOS = [
  { lead_id: "lead-202", nome: "Pet Shop Amigo Fiel", site: "https://petamigofiel.com.br" },
  { lead_id: "lead-206", nome: "Barbearia Navalha de Ouro", site: "https://navalhadeouro.com" },
  { lead_id: "lead-204", nome: "Contabilidade Prisma", site: "https://prismacontabil.com.br" },
];

let seq = 1;
let store: Redesign[] = [
  {
    id: "rd-1",
    lead_id: "lead-201",
    lead_nome: "Estética Bella Pele",
    site_original_url: "https://bellapele.com.br",
    preview_url: "https://preview.flowleads.com.br/bella-pele",
    status: "pronto",
    criado_em: "2026-07-06T10:00:00.000Z",
    gerado_em: "2026-07-06T10:03:00.000Z",
    observacoes: "Nova home com hero, CTA de WhatsApp fixo e seção de depoimentos.",
  },
  {
    id: "rd-2",
    lead_id: "lead-203",
    lead_nome: "Oficina Turbo Mecânica",
    site_original_url: "https://turbomecanica.com.br",
    preview_url: null,
    status: "pendente",
    criado_em: "2026-07-10T09:00:00.000Z",
    gerado_em: null,
    observacoes: null,
  },
];

/** Lista todos os redesigns do usuário. */
export async function listarRedesigns(): Promise<Redesign[]> {
  // TODO: LIGAR API — GET redesigns do usuário/org no Supabase (RLS).
  await delay();
  return store.map((r) => ({ ...r }));
}

/**
 * Gera (ou regenera) o redesign de um lead. `base` = redesign existente a
 * regenerar; sem `base`, cria um novo a partir de um lead de exemplo.
 * Resolve com status "pronto" (mock). A geração real é assíncrona e paga.
 */
export async function gerarRedesign(base?: Redesign): Promise<Redesign> {
  // TODO: LIGAR API — Edge Function redesign-site (API Anthropic). Consome
  // tokens (custo por geração) e usa progresso ao vivo; aqui só simula.
  await delay(1600);
  const agora = new Date().toISOString();
  if (base) {
    const atualizado: Redesign = {
      ...base,
      status: "pronto",
      preview_url: base.preview_url ?? `https://preview.flowleads.com.br/${base.lead_id}`,
      gerado_em: agora,
    };
    store = store.map((r) => (r.id === base.id ? atualizado : r));
    return { ...atualizado };
  }
  const alvo = ALVOS[seq % ALVOS.length];
  seq += 1;
  const novo: Redesign = {
    id: `rd-${seq}`,
    lead_id: alvo.lead_id,
    lead_nome: alvo.nome,
    site_original_url: alvo.site,
    preview_url: `https://preview.flowleads.com.br/${alvo.lead_id}`,
    status: "pronto",
    criado_em: agora,
    gerado_em: agora,
    observacoes: "Layout moderno, responsivo, com CTA de contato/WhatsApp.",
  };
  store = [novo, ...store];
  return { ...novo };
}
