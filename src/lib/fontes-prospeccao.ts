// FONTES DE PROSPECÇÃO — de ONDE o lead vem (Google Maps · Instagram · LinkedIn) e, dentro de
// cada rede, POR QUAL ESTRATÉGIA ele foi encontrado.
//
// Eixo DIFERENTE de `FonteBusca` (osm/geoapify/apify/places), que é o PROVEDOR dos dados de
// lugares. Aqui é o canal de origem: o Maps busca NEGÓCIO por lugar, o Instagram busca PERFIL
// por descoberta, o LinkedIn busca PESSOA por filtro profissional.
//
// ⚠️ Instagram e LinkedIn ainda NÃO coletam nada. Este módulo define as estratégias, os campos
// que cada uma exige, valida o formulário e monta o "pedido de busca" — para que, quando a
// coleta entrar (Apify), o lead caia no MESMO pipeline (mesma tabela `leads` → score → redesign
// → campanha). NÃO existe pipeline paralelo: veja `perfilParaLead`/`pessoaParaLead`.
//
// Cada estratégia declara `pluga`: onde o ator da Apify entra quando for ligar.

import type { Lead } from "@/lib/leads-api";

export type FonteProspeccao = "google_maps" | "instagram" | "linkedin";

/** 'ativa' = coleta ligada de verdade. 'em_breve' = interface pronta, coleta ainda não. */
export type EstadoFonte = "ativa" | "em_breve";

export type MetaFonte = {
  id: FonteProspeccao;
  label: string;
  resumo: string;
  /** unidade de prospecção — deixa claro que os campos mudam por um motivo */
  busca: string;
  estado: EstadoFonte;
  extrai: string[];
  encaixe: string;
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

/* ─────────────────────────── CAMPOS (peças reusáveis) ───────────────────────────
 * Cada estratégia declara QUAIS campos precisa; a tela se monta a partir disso.
 * Assim não existem 20 formulários hardcoded — existe 1 motor. */

export type CampoId =
  | "termo"
  | "cidade"
  | "bairro"
  | "nicho"
  | "categoria"
  | "perfilConcorrente"
  | "perfilCliente"
  | "minSeguidores"
  | "soComerciais"
  | "cargo"
  | "setor"
  | "regiao"
  | "porte"
  | "tema"
  | "concorrente";

export type TipoCampo = "texto" | "numero" | "booleano" | "select";

export type MetaCampo = {
  id: CampoId;
  label: string;
  tipo: TipoCampo;
  placeholder?: string;
  ajuda?: string;
  opcoes?: { id: string; label: string }[];
  /** campo obrigatório para a estratégia que o pede */
  obrigatorio?: boolean;
};

export const TAMANHOS_EMPRESA = [
  { id: "1-10", label: "1–10 (micro)" },
  { id: "11-50", label: "11–50 (pequena)" },
  { id: "51-200", label: "51–200 (média)" },
  { id: "201-1000", label: "201–1.000 (grande)" },
  { id: "1000+", label: "1.000+ (corporação)" },
];

export const CAMPOS: Record<CampoId, MetaCampo> = {
  termo: {
    id: "termo",
    label: "Hashtag ou termo",
    tipo: "texto",
    placeholder: "ex.: odontologiacuritiba",
    ajuda: "Sem o #. É por onde a descoberta começa.",
    obrigatorio: true,
  },
  cidade: {
    id: "cidade",
    label: "Cidade",
    tipo: "texto",
    placeholder: "ex.: Curitiba",
    obrigatorio: true,
  },
  bairro: {
    id: "bairro",
    label: "Local ou bairro",
    tipo: "texto",
    placeholder: "ex.: Batel, Água Verde",
    ajuda: "O lugar marcado nos posts.",
    obrigatorio: true,
  },
  nicho: {
    id: "nicho",
    label: "Nicho",
    tipo: "texto",
    placeholder: "ex.: clínica odontológica",
    obrigatorio: true,
  },
  categoria: {
    id: "categoria",
    label: "Categoria do perfil",
    tipo: "texto",
    placeholder: "ex.: Serviço de saúde",
    ajuda: "A categoria que a conta comercial declara no Instagram.",
    obrigatorio: true,
  },
  perfilConcorrente: {
    id: "perfilConcorrente",
    label: "@ do concorrente",
    tipo: "texto",
    placeholder: "ex.: @clinicaconcorrente",
    ajuda: "Um perfil que já fala com o público que você quer.",
    obrigatorio: true,
  },
  perfilCliente: {
    id: "perfilCliente",
    label: "@ de um cliente que fechou",
    tipo: "texto",
    placeholder: "ex.: @clienteboa",
    ajuda: "Serve de molde: procuramos perfis parecidos com esse.",
    obrigatorio: true,
  },
  minSeguidores: {
    id: "minSeguidores",
    label: "Seguidores (mínimo)",
    tipo: "numero",
    ajuda: "Corta perfil pessoal e conta parada. Muito alto = poucos resultados.",
  },
  soComerciais: {
    id: "soComerciais",
    label: "Só contas comerciais",
    tipo: "booleano",
    ajuda: "Conta comercial tem categoria e botão de contato.",
  },
  cargo: {
    id: "cargo",
    label: "Cargo do decisor",
    tipo: "texto",
    placeholder: "ex.: Proprietário, Gerente de Marketing",
    obrigatorio: true,
  },
  setor: {
    id: "setor",
    label: "Setor",
    tipo: "texto",
    placeholder: "ex.: Odontologia, Advocacia",
    obrigatorio: true,
  },
  regiao: {
    id: "regiao",
    label: "Região",
    tipo: "texto",
    placeholder: "ex.: Curitiba e região",
    obrigatorio: true,
  },
  porte: {
    id: "porte",
    label: "Tamanho da empresa",
    tipo: "select",
    opcoes: TAMANHOS_EMPRESA,
    obrigatorio: true,
  },
  tema: {
    id: "tema",
    label: "Tema do conteúdo",
    tipo: "texto",
    placeholder: "ex.: marketing odontológico",
    ajuda: "Quem comentou/curtiu post sobre esse assunto.",
    obrigatorio: true,
  },
  concorrente: {
    id: "concorrente",
    label: "Concorrente ou agência",
    tipo: "texto",
    placeholder: "ex.: Agência XYZ",
    ajuda: "Quem já vendeu para esse público antes de você.",
    obrigatorio: true,
  },
};

/** Atalhos de decisor — quem realmente assina o contrato. */
export const CARGOS_SUGERIDOS = [
  "Proprietário",
  "Sócio",
  "CEO / Diretor",
  "Gerente de Marketing",
  "Head de Vendas",
  "Gerente Comercial",
];

/* ─────────────────────────── ESTRATÉGIAS ───────────────────────────
 * viabilidade — HONESTIDADE sobre o que dá para raspar de verdade:
 *   'viavel'    → o scraper resolve (dentro dos limites da plataforma)
 *   'fragil'    → funciona, mas com volume baixo / quebra quando a plataforma muda
 *   'planejado' → NÃO existe fonte confiável hoje; vai depender de trabalho manual
 *                 ou de outra abordagem. Fica na tela declarado como tal, não escondido.
 */

export type Viabilidade = "viavel" | "fragil" | "planejado";

export const VIABILIDADE_UI: Record<Viabilidade, { label: string; dica: string }> = {
  viavel: { label: "Viável", dica: "O scraper dá conta, dentro dos limites da plataforma." },
  fragil: {
    label: "Frágil",
    dica: "Funciona, mas com pouco volume e quebra quando a plataforma muda.",
  },
  planejado: {
    label: "Planejado",
    dica: "Sem fonte confiável para raspar hoje — vai exigir passo manual ou outra abordagem.",
  },
};

export type Estrategia = {
  id: string;
  fonte: Exclude<FonteProspeccao, "google_maps">;
  titulo: string;
  descricao: string;
  campos: CampoId[];
  viabilidade: Viabilidade;
  /** por que é frágil/planejado — só quando não é 'viavel' */
  nota?: string;
  /** onde a coleta (Apify) vai plugar quando ligarmos */
  pluga: string;
};

export const ESTRATEGIAS: Estrategia[] = [
  // ───────────── INSTAGRAM ─────────────
  {
    id: "IG-1",
    fonte: "instagram",
    titulo: "Hashtag local",
    descricao: "Quem publica com a hashtag do nicho naquela cidade.",
    campos: ["termo", "cidade", "minSeguidores", "soComerciais"],
    viabilidade: "fragil",
    nota: "O Instagram limita bastante o resultado de hashtag — vem menos gente do que parece.",
    pluga: "Apify: ator de hashtag scraper → lista de posts → autores → perfis.",
  },
  {
    id: "IG-2",
    fonte: "instagram",
    titulo: "Geolocalização",
    descricao: "Quem marca lugares daquele bairro/cidade nos posts.",
    campos: ["bairro", "minSeguidores", "soComerciais"],
    viabilidade: "fragil",
    nota: "Páginas de local ainda existem, mas o volume por página é baixo.",
    pluga: "Apify: ator de location scraper (ID do lugar) → posts → autores.",
  },
  {
    id: "IG-3",
    fonte: "instagram",
    titulo: "Seguidores de concorrente",
    descricao: "Quem segue um concorrente — público já aquecido para o nicho.",
    campos: ["perfilConcorrente", "minSeguidores", "soComerciais"],
    viabilidade: "fragil",
    nota: "Lista de seguidores é o que o Instagram mais limita. Em perfil grande, vira inviável.",
    pluga: "Apify: ator de followers scraper (limite baixo por rodada).",
  },
  {
    id: "IG-4",
    fonte: "instagram",
    titulo: "Engajamento de concorrente",
    descricao: "Quem curte e comenta no concorrente — sinal mais forte que só seguir.",
    campos: ["perfilConcorrente", "soComerciais"],
    viabilidade: "fragil",
    nota: "Curtidas costumam estar ocultas; na prática sobram os comentaristas.",
    pluga: "Apify: ator de post/comment scraper → autores dos comentários.",
  },
  {
    id: "IG-5",
    fonte: "instagram",
    titulo: "Sem site na bio",
    descricao: "Perfil comercial que não tem link de site — o alvo perfeito do nosso produto.",
    campos: ["nicho", "cidade", "minSeguidores", "soComerciais"],
    viabilidade: "viavel",
    pluga: "Filtro NOSSO sobre os perfis coletados (bio sem link, ou link que não é site próprio).",
  },
  {
    id: "IG-6",
    fonte: "instagram",
    titulo: "Conta comercial nova",
    descricao: "Negócio que acabou de abrir — ainda está montando a presença digital.",
    campos: ["nicho", "cidade", "soComerciais"],
    viabilidade: "planejado",
    nota: "O Instagram não expõe data de criação da conta. Só dá para estimar por sinais fracos (poucos posts).",
    pluga: "Sem fonte direta: dependeria de heurística (nº de posts / data do 1º post).",
  },
  {
    id: "IG-7",
    fonte: "instagram",
    titulo: "Alto engajamento, baixa presença",
    descricao: "Muita interação para poucos seguidores — negócio bom que ninguém achou ainda.",
    campos: ["nicho", "cidade", "minSeguidores"],
    viabilidade: "viavel",
    pluga: "Cálculo NOSSO (curtidas+comentários ÷ seguidores) sobre os posts já coletados.",
  },
  {
    id: "IG-8",
    fonte: "instagram",
    titulo: "Localização + categoria",
    descricao: "Cruza a cidade com a categoria que a conta comercial declara.",
    campos: ["cidade", "categoria", "soComerciais"],
    viabilidade: "viavel",
    pluga: "Filtro NOSSO por categoria do perfil comercial, sobre a coleta por local.",
  },
  {
    id: "IG-9",
    fonte: "instagram",
    titulo: "Anunciantes do nicho",
    descricao: "Quem já paga anúncio — tem verba e prova que investe em marketing.",
    campos: ["nicho", "cidade"],
    viabilidade: "viavel",
    pluga:
      "Biblioteca de Anúncios da Meta (pública) — fonte separada e mais estável que o scraper.",
  },
  {
    id: "IG-10",
    fonte: "instagram",
    titulo: "Lookalike manual",
    descricao: "Procura perfis parecidos com um cliente que já fechou com você.",
    campos: ["perfilCliente", "minSeguidores", "soComerciais"],
    viabilidade: "fragil",
    nota: 'Usa as "contas semelhantes" que o Instagram sugere — a lista é curta e muda sozinha.',
    pluga: "Apify: perfil → sugestões de contas semelhantes → repete 1 nível.",
  },

  // ───────────── LINKEDIN ─────────────
  {
    id: "LI-1",
    fonte: "linkedin",
    titulo: "Cargo decisor + setor",
    descricao: "O básico bem feito: quem decide, no setor e na região que você atende.",
    campos: ["cargo", "setor", "regiao"],
    viabilidade: "fragil",
    nota: "A busca do LinkedIn exige sessão logada e limita resultados por conta.",
    pluga: "Apify: ator de people search (consome conta logada; volume baixo por dia).",
  },
  {
    id: "LI-2",
    fonte: "linkedin",
    titulo: "Tamanho da empresa",
    descricao: "Filtra pelo porte — evita gastar tempo com quem é grande demais ou pequeno demais.",
    campos: ["porte", "setor", "regiao"],
    viabilidade: "fragil",
    nota: "Mesmo limite da busca: depende de sessão logada.",
    pluga: "Apify: people search com filtro de company size.",
  },
  {
    id: "LI-3",
    fonte: "linkedin",
    titulo: "Troca de cargo recente",
    descricao: "Quem acabou de assumir quer mostrar serviço — janela boa para propor algo novo.",
    campos: ["cargo", "setor"],
    viabilidade: "planejado",
    nota: "Exigiria acompanhar perfis ao longo do tempo para detectar a mudança. Não temos essa base.",
    pluga: "Sem fonte hoje: dependeria de monitoramento contínuo (histórico de perfis).",
  },
  {
    id: "LI-4",
    fonte: "linkedin",
    titulo: "Empresa sem site decente",
    descricao: "Acha a empresa no LinkedIn e checa o site dela — se for ruim, é nosso cliente.",
    campos: ["setor", "regiao"],
    viabilidade: "viavel",
    pluga: "Empresa → site → o NOSSO enrich/score já existente decide se o site é ruim.",
  },
  {
    id: "LI-5",
    fonte: "linkedin",
    titulo: "Setor + cidade",
    descricao: "Varredura por setor numa cidade — bom para montar base do zero.",
    campos: ["setor", "cidade"],
    viabilidade: "fragil",
    nota: "Mesma limitação da busca logada.",
    pluga: "Apify: people/company search por setor + localidade.",
  },
  {
    id: "LI-6",
    fonte: "linkedin",
    titulo: "Conexões de 2º grau",
    descricao: "Quem está a um conhecido de distância — a abordagem esquenta muito.",
    campos: [],
    viabilidade: "planejado",
    nota: "O grau de conexão é relativo à SUA conta: só existe dentro da sua sessão. Não dá para o servidor coletar por você — vira lista para abordagem manual.",
    pluga: "Sem coleta automática: exportação manual a partir da sua própria conta.",
  },
  {
    id: "LI-7",
    fonte: "linkedin",
    titulo: "Engajou com conteúdo do nicho",
    descricao: "Quem comentou post sobre o assunto — já demonstrou interesse no tema.",
    campos: ["tema"],
    viabilidade: "fragil",
    nota: "Dá para ler comentários de posts públicos, mas o volume é pequeno e exige sessão.",
    pluga: "Apify: post scraper → autores dos comentários.",
  },
  {
    id: "LI-8",
    fonte: "linkedin",
    titulo: "Empresa em crescimento",
    descricao: "Quem está contratando tem verba e pressa — momento certo para vender.",
    campos: ["setor", "regiao"],
    viabilidade: "fragil",
    nota: "Inferido pelas vagas publicadas; é sinal indireto, não um filtro oficial.",
    pluga: "Apify: jobs scraper por setor/região → empresas que estão contratando.",
  },
  {
    id: "LI-9",
    fonte: "linkedin",
    titulo: "Ex-clientes de concorrentes",
    descricao: "Quem já contratou agência antes — entende o valor e não precisa ser educado.",
    campos: ["concorrente"],
    viabilidade: "planejado",
    nota: "Não existe campo público dizendo quem foi cliente de quem. Só por pista solta (depoimento, post marcado).",
    pluga: "Sem fonte estruturada: dependeria de garimpo manual em posts/depoimentos.",
  },
  {
    id: "LI-10",
    fonte: "linkedin",
    titulo: "Decisor de franquia/rede",
    descricao: "Rede com várias unidades: um contrato só já vale por muitos clientes.",
    campos: ["setor", "regiao"],
    viabilidade: "fragil",
    nota: "Identificar que é franquia depende do texto do perfil/empresa — dá falso positivo.",
    pluga: "Apify: company search + heurística de nome/descrição (rede, franquia, unidades).",
  },
];

export const estrategiasDe = (f: FonteProspeccao) => ESTRATEGIAS.filter((e) => e.fonte === f);
export const estrategiaPorId = (id: string) => ESTRATEGIAS.find((e) => e.id === id) ?? null;

/* ─────────────────────────── VALORES / VALIDAÇÃO ─────────────────────────── */

export type ValoresBusca = Partial<Record<CampoId, string | number | boolean>> & {
  limite?: number;
};

export function valoresPadrao(): ValoresBusca {
  return { minSeguidores: 500, soComerciais: true, limite: 50 };
}

export type Validacao = { ok: boolean; erros: string[] };

const vazio = (v: unknown) => v === undefined || v === null || String(v).trim() === "";

export function validarEstrategia(e: Estrategia, v: ValoresBusca): Validacao {
  const erros: string[] = [];
  for (const id of e.campos) {
    const c = CAMPOS[id];
    if (c.obrigatorio && vazio(v[id])) erros.push(`Informe ${c.label.toLowerCase()}.`);
  }
  // @ de perfil precisa parecer um @ de verdade (não inventa nada depois).
  for (const id of ["perfilConcorrente", "perfilCliente"] as CampoId[]) {
    if (e.campos.includes(id) && !vazio(v[id])) {
      const u = String(v[id]).trim().replace(/^@/, "");
      if (!/^[\w.]{1,30}$/.test(u))
        erros.push(
          `O ${CAMPOS[id].label.toLowerCase()} parece inválido (letras, números, ponto e _).`,
        );
    }
  }
  const min = Number(v.minSeguidores ?? 0);
  if (e.campos.includes("minSeguidores") && min < 0)
    erros.push("Seguidores mínimos não pode ser negativo.");
  return { ok: erros.length === 0, erros };
}

/** O que seria enviado ao coletor quando a Apify entrar (hoje só é exibido). */
export type PedidoBusca = {
  fonte: FonteProspeccao;
  estrategia: string;
  titulo: string;
  limite: number;
  campos: Record<string, string | number | boolean>;
};

export function montarPedido(e: Estrategia, v: ValoresBusca): PedidoBusca {
  const campos: Record<string, string | number | boolean> = {};
  for (const id of e.campos) {
    let val = v[id];
    if (vazio(val)) continue;
    if (typeof val === "string") {
      val = val.trim();
      if (id === "termo") val = val.replace(/^#/, "");
      if (id === "perfilConcorrente" || id === "perfilCliente") val = val.replace(/^@/, "");
    }
    campos[id] = val as string | number | boolean;
  }
  return {
    fonte: e.fonte,
    estrategia: e.id,
    titulo: e.titulo,
    limite: Number(v.limite ?? 50),
    campos,
  };
}

/* ─────────── MESMO PIPELINE: como cada fonte vira um `leads` row ───────────
 * Nada de tabela nova. O `place_id` já usa prefixo por origem ("osm:node/123"),
 * então Instagram vira "ig:<user>" e LinkedIn "li:<slug>" — a mesma chave de
 * deduplicação por dono (user_id, place_id) continua valendo.
 *
 * RASTREABILIDADE: origem_fonte + origem_estrategia gravados no próprio lead,
 * para depois medir QUAL ESTRATÉGIA converte mais (migration 037).
 */

/** Campos extras que a migration 037 adicionou em `leads` para as redes sociais. */
export type LeadExtras = {
  origem_fonte: FonteProspeccao | null;
  origem_estrategia: string | null;
  cargo: string | null;
  seguidores: number | null;
};

export type PerfilInstagram = {
  username: string;
  nome?: string | null;
  bio?: string | null;
  linkBio?: string | null;
  email?: string | null;
  whatsapp?: string | null;
  categoria?: string | null;
  cidade?: string | null;
  seguidores?: number | null;
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
export function perfilParaLead(p: PerfilInstagram, estrategia: string): Partial<Lead> & LeadExtras {
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
    origem_fonte: "instagram",
    origem_estrategia: estrategia,
    cargo: null,
    seguidores: p.seguidores ?? null,
  };
}

/** Pessoa do LinkedIn → linha de `leads`. É B2B: a PESSOA é o lead, a empresa vira o negócio. */
export function pessoaParaLead(p: PessoaLinkedIn, estrategia: string): Partial<Lead> & LeadExtras {
  const slug = p.slug.trim().replace(/^\//, "");
  return {
    place_id: `li:${slug}`,
    business_name: (p.empresa || p.nome).trim(),
    owner_name: p.nome.trim(),
    linkedin_url: `https://linkedin.com/in/${slug}`,
    category: p.setor ?? null,
    city: p.regiao ?? null,
    status: "new",
    origem_fonte: "linkedin",
    origem_estrategia: estrategia,
    cargo: p.cargo ?? null,
    seguidores: null,
  };
}
