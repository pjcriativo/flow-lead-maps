// Camada de serviço — Publicação de sites TEMPORÁRIOS (Fase 4).
// HOJE: dados mock em memória. DEPOIS: trocar SÓ o corpo destas funções pela
// Edge Function publish-site (grava no Supabase Storage e serve em
// flowleads.flowgenius.com.br/site/<slug>). As telas consomem ESTAS assinaturas
// e não mudam quando a API real entrar.
import type { SitePublicado, SitePublicadoStatus, LeadPublicavel } from "@/types";

const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms));

const BASE_URL = "https://flowleads.flowgenius.com.br/site";
const DIAS_VALIDADE = 15;

function slugify(nome: string): string {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function maisDias(base: Date, dias: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + dias);
  return d.toISOString();
}

// Sites já publicados (mock coerente: publicado, aprovado, reprovado, expirado).
let sites: SitePublicado[] = [
  {
    id: "site-1",
    lead_id: "lead-201",
    slug: "estetica-bella-pele",
    url_publica: `${BASE_URL}/estetica-bella-pele`,
    status: "publicado",
    publicado_em: "2026-07-08T11:00:00.000Z",
    expira_em: "2026-07-23T11:00:00.000Z",
    arquivos_removidos: false,
  },
  {
    id: "site-2",
    lead_id: "lead-202",
    slug: "pet-shop-amigo-fiel",
    url_publica: `${BASE_URL}/pet-shop-amigo-fiel`,
    status: "aprovado",
    publicado_em: "2026-07-10T09:00:00.000Z",
    expira_em: "2026-07-25T09:00:00.000Z",
    arquivos_removidos: false,
  },
  {
    id: "site-3",
    lead_id: "lead-206",
    slug: "barbearia-navalha-de-ouro",
    url_publica: `${BASE_URL}/barbearia-navalha-de-ouro`,
    status: "reprovado",
    publicado_em: "2026-07-05T14:00:00.000Z",
    expira_em: "2026-07-20T14:00:00.000Z",
    arquivos_removidos: false,
  },
  {
    id: "site-4",
    lead_id: "lead-203",
    slug: "oficina-turbo-mecanica",
    url_publica: `${BASE_URL}/oficina-turbo-mecanica`,
    status: "expirado",
    publicado_em: "2026-06-16T10:00:00.000Z",
    expira_em: "2026-07-01T10:00:00.000Z",
    arquivos_removidos: true,
  },
];

// Leads com redesign pronto e ainda sem site (candidatos a publicar).
let publicaveis: LeadPublicavel[] = [
  { lead_id: "lead-204", lead_nome: "Contabilidade Prisma" },
  { lead_id: "lead-205", lead_nome: "Studio Fotografia Luz" },
];

let seq = sites.length;

/**
 * Lista os sites ativos e os expirados (registro mantido). Sites explicitamente
 * despublicados/excluídos somem da lista, mas o registro permanece no banco.
 */
export async function listarSites(): Promise<SitePublicado[]> {
  // TODO: LIGAR API — GET sites do usuário/org no Supabase (RLS).
  await delay();
  return sites
    .filter((s) => !s.arquivos_removidos || s.status === "expirado")
    .map((s) => ({ ...s }));
}

/** Lista os leads com redesign pronto ainda sem site publicado. */
export async function listarLeadsPublicaveis(): Promise<LeadPublicavel[]> {
  // TODO: LIGAR API — leads com redesign 'pronto' e sem site publicado.
  await delay();
  return publicaveis.map((l) => ({ ...l }));
}

/** Publica o site de um lead (sobe no Storage, gera URL temporária de 15 dias). */
export async function publicarSite(leadId: string): Promise<SitePublicado> {
  // TODO: LIGAR API — Edge Function publish-site: grava arquivos no Storage e
  // devolve a URL pública (flowleads.flowgenius.com.br/site/<slug>).
  await delay(1200);
  const lead = publicaveis.find((l) => l.lead_id === leadId);
  const nome = lead?.lead_nome ?? leadId;
  const slug = slugify(nome);
  const agora = new Date();
  seq += 1;
  const novo: SitePublicado = {
    id: `site-${seq}`,
    lead_id: leadId,
    slug,
    url_publica: `${BASE_URL}/${slug}`,
    status: "publicado",
    publicado_em: agora.toISOString(),
    expira_em: maisDias(agora, DIAS_VALIDADE),
    arquivos_removidos: false,
  };
  sites = [novo, ...sites];
  publicaveis = publicaveis.filter((l) => l.lead_id !== leadId);
  return { ...novo };
}

/** Despublica/exclui: apaga os arquivos do Storage, MANTÉM o registro. */
export async function despublicarSite(id: string): Promise<void> {
  // TODO: LIGAR API — apaga os arquivos no Storage; mantém a linha no banco.
  await delay(600);
  sites = sites.map((s) => (s.id === id ? { ...s, arquivos_removidos: true } : s));
}

/** Marca o site como aprovado/reprovado/expirado/publicado. */
export async function marcarStatus(id: string, status: SitePublicadoStatus): Promise<SitePublicado> {
  // TODO: LIGAR API — UPDATE status no Supabase (aprovação do cliente).
  await delay(400);
  let atualizado: SitePublicado | undefined;
  sites = sites.map((s) => {
    if (s.id !== id) return s;
    // ao expirar, os arquivos são apagados
    const arquivos_removidos = status === "expirado" ? true : s.arquivos_removidos;
    atualizado = { ...s, status, arquivos_removidos };
    return atualizado;
  });
  if (!atualizado) throw new Error("Site não encontrado");
  return { ...atualizado };
}
