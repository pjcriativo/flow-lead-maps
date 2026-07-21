// FONTES DE PROSPECÇÃO — de ONDE o lead vem (Google Maps · Instagram · LinkedIn).
//
// Eixo DIFERENTE de `FonteBusca` (osm/geoapify/apify/places), que é o PROVEDOR dos dados de
// lugares. Aqui é o canal de origem do lead, e cada um prospecta de um jeito: o Maps busca
// NEGÓCIO por lugar, o Instagram busca PERFIL por descoberta, o LinkedIn busca PESSOA por cargo.
//
// ⚠️ Instagram e LinkedIn ainda NÃO coletam nada. Este módulo define os campos, valida o
// formulário e monta o "pedido de busca" — para que, quando a coleta entrar (scraper Apify),
// o lead caia no MESMO pipeline (mesma tabela `leads` → score → redesign → campanha).
// NÃO existe pipeline paralelo: veja `instagramParaLead`/`linkedinParaLead`.

import type { Lead } from "@/lib/leads-api";

export type FonteProspeccao = "google_maps" | "instagram" | "linkedin";

/** 'ativa' = coleta ligada de verdade. 'em_breve' = interface pronta, coleta ainda não. */
export type EstadoFonte = "ativa" | "em_breve";

export type MetaFonte = {
  id: FonteProspeccao;
  label: string;
  /** o que ela prospecta, em uma linha */
  resumo: string;
  /** unidade de prospecção — deixa claro que os campos mudam por um motivo */
  busca: string;
  estado: EstadoFonte;
  /** o que a coleta promete trazer (some na UI para o dono saber o que esperar) */
  extrai: string[];
  /** por que esse lead vale no nosso score */
  encaixe: string;
  /** aviso honesto sobre fragilidade da coleta (só nas fontes não-oficiais) */
  aviso?: string;
};

export const FONTES: Record<FonteProspeccao, MetaFonte> = {
  google_maps: {
    id: "google_maps",
    label: "Google Maps",
    resumo: "Negócios com endereço, telefone e nota — a base mais completa e estável.",
    busca: "busca NEGÓCIO por lugar",
    estado: "ativa",
    extrai: ["nome", "endereço", "telefone", "site", "nota e avaliações", "categoria"],
    encaixe: "O clássico: nota alta + site ruim (ou sem site) = cliente-ouro.",
  },
  instagram: {
    id: "instagram",
    label: "Instagram",
    resumo: "Perfis comerciais por descoberta — quem vive de rede social e não tem site.",
    busca: "busca PERFIL por descoberta",
    estado: "em_breve",
    extrai: [
      "@ do perfil",
      "bio",
      "link da bio",
      "e-mail/WhatsApp da bio",
      "seguidores",
      "categoria",
    ],
    encaixe: 'Acha quem "só tem Instagram, sem site" — a dor que o nosso site resolve.',
    aviso:
      "O Instagram não tem API aberta para isso: a coleta usa scraper não-oficial (Apify). É mais lenta, traz menos por busca e pode falhar quando a plataforma muda.",
  },
  linkedin: {
    id: "linkedin",
    label: "LinkedIn",
    resumo: "Pessoas por cargo — fala direto com quem decide, não com o balcão.",
    busca: "busca PESSOA por filtro profissional",
    estado: "em_breve",
    extrai: ["nome", "cargo", "empresa", "setor", "perfil"],
    encaixe: 'B2B: mata a objeção "não sou eu quem decide" — já chega no decisor.',
    aviso:
      "O LinkedIn é hostil a coleta automatizada e limita volume por conta. A coleta usa scraper não-oficial (Apify): menor volume, mais lenta e sujeita a bloqueio.",
  },
};

export const ORDEM_FONTES: FonteProspeccao[] = ["google_maps", "instagram", "linkedin"];

export const fonteAtiva = (f: FonteProspeccao) => FONTES[f].estado === "ativa";

/* ─────────────────────────── INSTAGRAM ─────────────────────────── */

/** Três jeitos de descobrir perfis — cada um pede um termo diferente. */
export type ModoInstagram = "hashtag" | "localizacao" | "seguidores";

export const MODOS_INSTAGRAM: {
  id: ModoInstagram;
  label: string;
  dica: string;
  rotuloTermo: string;
  placeholder: string;
}[] = [
  {
    id: "hashtag",
    label: "Por hashtag",
    dica: "Quem publica com a hashtag do nicho.",
    rotuloTermo: "Hashtag",
    placeholder: "ex.: odontologiacuritiba",
  },
  {
    id: "localizacao",
    label: "Por localização",
    dica: "Quem marca lugares da cidade nos posts.",
    rotuloTermo: "Lugar ou termo",
    placeholder: "ex.: Curitiba, Batel",
  },
  {
    id: "seguidores",
    label: "Seguidores de um perfil",
    dica: "Quem segue um concorrente — público já aquecido.",
    rotuloTermo: "@ do concorrente",
    placeholder: "ex.: @clinicaconcorrente",
  },
];

export type BuscaInstagram = {
  modo: ModoInstagram;
  termo: string;
  cidade: string;
  minSeguidores: number;
  soComerciais: boolean;
  limite: number;
};

export function buscaInstagramPadrao(): BuscaInstagram {
  return {
    modo: "hashtag",
    termo: "",
    cidade: "",
    minSeguidores: 500,
    soComerciais: true,
    limite: 50,
  };
}

/* ─────────────────────────── LINKEDIN ─────────────────────────── */

export const TAMANHOS_EMPRESA = [
  { id: "1-10", label: "1–10 (micro)" },
  { id: "11-50", label: "11–50 (pequena)" },
  { id: "51-200", label: "51–200 (média)" },
  { id: "201-1000", label: "201–1.000 (grande)" },
  { id: "1000+", label: "1.000+ (corporação)" },
] as const;

/** Atalhos de decisor — quem realmente assina o contrato. */
export const CARGOS_SUGERIDOS = [
  "Proprietário",
  "Sócio",
  "CEO / Diretor",
  "Gerente de Marketing",
  "Head de Vendas",
  "Gerente Comercial",
];

export type BuscaLinkedIn = {
  cargo: string;
  setor: string;
  regiao: string;
  tamanhoEmpresa: string;
  limite: number;
};

export function buscaLinkedInPadrao(): BuscaLinkedIn {
  return { cargo: "", setor: "", regiao: "", tamanhoEmpresa: "", limite: 50 };
}

/* ─────────────────────────── VALIDAÇÃO ─────────────────────────── */

export type Validacao = { ok: boolean; erros: string[] };

export function validarInstagram(f: BuscaInstagram): Validacao {
  const erros: string[] = [];
  if (!f.termo.trim())
    erros.push(
      `Informe ${MODOS_INSTAGRAM.find((m) => m.id === f.modo)!.rotuloTermo.toLowerCase()}.`,
    );
  if (f.modo === "seguidores" && !/^@?[\w.]{1,30}$/.test(f.termo.trim()))
    erros.push("O @ do concorrente parece inválido (só letras, números, ponto e _).");
  if (f.minSeguidores < 0) erros.push("Seguidores mínimos não pode ser negativo.");
  return { ok: erros.length === 0, erros };
}

export function validarLinkedIn(f: BuscaLinkedIn): Validacao {
  const erros: string[] = [];
  if (!f.cargo.trim()) erros.push("Informe o cargo do decisor.");
  if (!f.setor.trim() && !f.regiao.trim())
    erros.push("Informe ao menos o setor ou a região (senão a busca fica ampla demais).");
  return { ok: erros.length === 0, erros };
}

/* ─────────────────── PEDIDO DE BUSCA (o que irá ao scraper) ─────────────────── */

export type PedidoBusca =
  ({ fonte: "instagram" } & BuscaInstagram) | ({ fonte: "linkedin" } & BuscaLinkedIn);

export const pedidoInstagram = (f: BuscaInstagram): PedidoBusca => ({
  fonte: "instagram",
  ...f,
  termo: f.termo.trim().replace(/^[#@]/, ""),
  cidade: f.cidade.trim(),
});

export const pedidoLinkedIn = (f: BuscaLinkedIn): PedidoBusca => ({
  fonte: "linkedin",
  ...f,
  cargo: f.cargo.trim(),
  setor: f.setor.trim(),
  regiao: f.regiao.trim(),
});

/* ─────────── MESMO PIPELINE: como cada fonte vira um `leads` row ───────────
 * Nada de tabela nova. O `place_id` já usa prefixo por origem ("osm:node/123"),
 * então Instagram vira "ig:<user>" e LinkedIn "li:<slug>" — a mesma chave de
 * deduplicação por dono (user_id, place_id) continua valendo.
 */

/** Campos que a nossa tabela `leads` AINDA não tem coluna para guardar.
 *  Declarado aqui para não fingir que o modelo está 100% pronto: quando a coleta
 *  entrar, estes dois precisam de uma migration. */
export const CAMPOS_SEM_COLUNA: { fonte: FonteProspeccao; campo: string; obs: string }[] = [
  {
    fonte: "instagram",
    campo: "seguidores",
    obs: "não cabe em review_count (isso é avaliação do Google) — precisa de coluna própria",
  },
  {
    fonte: "linkedin",
    campo: "cargo",
    obs: "owner_name guarda o nome da pessoa; o cargo precisa de coluna própria",
  },
];

export type PerfilInstagram = {
  username: string;
  nome?: string | null;
  bio?: string | null;
  linkBio?: string | null;
  email?: string | null;
  whatsapp?: string | null;
  categoria?: string | null;
  cidade?: string | null;
};

export type PessoaLinkedIn = {
  slug: string;
  nome: string;
  cargo?: string | null;
  empresa?: string | null;
  setor?: string | null;
  regiao?: string | null;
};

/** Perfil do Instagram → linha de `leads` (mesmo pipeline: score → redesign → campanha). */
export function instagramParaLead(p: PerfilInstagram): Partial<Lead> {
  const user = p.username.trim().replace(/^@/, "");
  return {
    place_id: `ig:${user}`,
    business_name: (p.nome || user).trim(),
    instagram_url: `https://instagram.com/${user}`,
    website: p.linkBio ?? null,
    email: p.email ?? null,
    whatsapp: p.whatsapp ?? null,
    category: p.categoria ?? null,
    city: p.cidade ?? null,
    notes: p.bio ?? null,
    status: "new",
  };
}

/** Pessoa do LinkedIn → linha de `leads`. É B2B: a PESSOA é o lead, a empresa vira o negócio. */
export function linkedinParaLead(p: PessoaLinkedIn): Partial<Lead> {
  const slug = p.slug.trim().replace(/^\//, "");
  return {
    place_id: `li:${slug}`,
    business_name: (p.empresa || p.nome).trim(),
    owner_name: p.nome.trim(),
    linkedin_url: `https://linkedin.com/in/${slug}`,
    category: p.setor ?? null,
    city: p.regiao ?? null,
    status: "new",
  };
}
