// COPY APROVADA PELO DONO (proposta de 1ª abordagem). Template + variáveis — nada de IA aqui.
// Tom consultivo/direto, escassez honesta, saída fácil. Sem preço, 1 link só.
//
// REGRA QUE MANDA EM TUDO: nunca inventar dado.
// - Abertura A (com nota) só entra se houver nota E avaliações reais. Sem nota → abertura B,
//   sem exceção — não existe caminho que escreva uma nota que o lead não tem.
// - {motivo} sai do score_breakdown (Fase 1). Se as flags não permitirem classificar, NÃO há
//   proposta: quem chama trata o null (o lead vira "sem motivo claro" na revisão da campanha).
// Funções puras de propósito: dá pra provar cada caso sem banco e sem rede.

/** Chave do motivo — o que o score_breakdown diz que está errado na presença digital. */
export type MotivoChave = "sem_site" | "so_instagram" | "site_fora_do_ar" | "site_fraco";

export type Motivo = { chave: MotivoChave; texto: string };

/** Textos aprovados, um por caso. Não parafrasear em runtime. */
const MOTIVOS: Record<MotivoChave, string> = {
  sem_site: "Vocês não têm site. Quem acha vocês no Google não tem pra onde ir depois.",
  so_instagram:
    "O link de vocês leva pro Instagram. Instagram funciona pra quem já conhece — quem está decidindo agora quer ver serviço, endereço e um botão de contato.",
  site_fora_do_ar: "O site que está no perfil de vocês no Google não abre. Quem clica, some.",
  site_fraco: "O site atual não abre bem no celular — e é lá que a maioria das buscas acontece.",
};

/**
 * Classifica o motivo A PARTIR das flags do score_breakdown (Fase 1) — nunca do texto livre
 * `motivo`, que é prosa da Fase 1 e não é confiável como classificador.
 *
 * Devolve null quando não dá pra classificar, e isso é um resultado legítimo, não um erro:
 * - breakdown LEGADO (sem as flags booleanas) — leads antigos;
 * - lead com site que está no ar e não é fraco → simplesmente não há motivo honesto a alegar.
 * Nos dois casos o lead NÃO recebe proposta; o dono decide na revisão.
 */
export function classificarMotivo(scoreBreakdown: unknown): Motivo | null {
  const bd = scoreBreakdown as Record<string, unknown> | null;
  // Guarda do shape moderno: sem as flags, qualquer classificação seria chute.
  if (!bd || typeof bd !== "object" || typeof bd.has_website !== "boolean") return null;

  const temSite = bd.has_website === true;
  const foraDoAr = bd.site_fora_do_ar === true;
  const siteFraco = bd.bad_site === true;
  const temInsta = bd.has_instagram === true;

  // ATENÇÃO à semântica de score.ts: `has_website: input.hasWebsite && !siteMorto`. Ou seja,
  // site MORTO zera has_website — "fora do ar" convive com has_website=false, não com true.
  // Testar `temSite && foraDoAr` seria código morto e mandaria "vocês não têm site" pra quem
  // TEM site no perfil do Google (só não abre). Por isso foraDoAr vem primeiro e sozinho.
  if (foraDoAr) return { chave: "site_fora_do_ar", texto: MOTIVOS.site_fora_do_ar };
  if (temSite && siteFraco) return { chave: "site_fraco", texto: MOTIVOS.site_fraco };
  if (!temSite && temInsta) return { chave: "so_instagram", texto: MOTIVOS.so_instagram };
  if (!temSite) return { chave: "sem_site", texto: MOTIVOS.sem_site };
  return null; // site no ar e ok → sem motivo claro
}

/** Rótulo curto do motivo, pra revisão/telemetria (não vai no e-mail). */
export const MOTIVO_LABEL: Record<MotivoChave, string> = {
  sem_site: "Sem site",
  so_instagram: "Só Instagram",
  site_fora_do_ar: "Site fora do ar",
  site_fraco: "Site fraco no celular",
};

export const ASSUNTO_PROPOSTA = "O site de vocês não mostra o que o Google já mostra";

export type DadosCopy = {
  nome_negocio: string;
  /** null quando a fonte não tem nota (OSM/Geoapify) → força a abertura B. */
  nota: number | null;
  /** null/0 = sem avaliações reais → não afirma "as avaliações provam isso". */
  n_avaliacoes: number | null;
  categoria: string | null;
  cidade: string | null;
  link: string;
  /** Nome pessoal do dono (profiles.full_name). Nunca hardcoded. */
  remetente: string;
};

/** "4,8" — vírgula decimal. Só chamado quando a nota existe de verdade. */
function fmtNota(n: number): string {
  return n.toFixed(1).replace(".", ",");
}

/**
 * As fontes gravam `category` em dois formatos: pt-BR do Google Places ("Salão de Beleza",
 * "Clínica odontológica") e SLUG EM INGLÊS do OSM/Geoapify ("dentist", "beauty"). Escrever
 * "quem procura lawyer em São Paulo" pro dono de um escritório é vexame.
 *
 * Traduzimos só o que mapeia 1:1 pra uma profissão. Genéricos (`beauty` pode ser barbearia,
 * `healthcare` pode ser hospital) e slugs desconhecidos → null: a frase degrada pra "um
 * serviço como o de vocês", que é honesto. Chutar a categoria é inventar dado do lead.
 */
const CATEGORIA_PT: Record<string, string> = {
  dentist: "dentista",
  lawyer: "advogado",
  veterinary: "veterinário",
  pet: "pet shop",
};

/** Slug de fonte = uma palavra, minúscula, sem acento/espaço (ex.: "beauty", "healthcare"). */
function ehSlugDeFonte(c: string): boolean {
  return /^[a-z][a-z_]*$/.test(c);
}

export function normalizarCategoria(categoria: string | null): string | null {
  const c = (categoria ?? "").trim();
  if (!c) return null;
  const slug = c.toLowerCase();
  if (CATEGORIA_PT[slug]) return CATEGORIA_PT[slug];
  if (ehSlugDeFonte(c)) return null; // slug desconhecido/genérico → omite, não traduz no chute
  return c.toLowerCase(); // já é pt-BR ("Salão de Beleza" → "salão de beleza")
}

/**
 * A cidade vem como o usuário digitou: "Curitiba" ou "SÃO PAULO". Caixa alta no meio da frase
 * parece grito — vira "São Paulo". Só mexe quando está TODA em maiúsculas; não toca no resto.
 */
export function normalizarCidade(cidade: string | null): string | null {
  const c = (cidade ?? "").trim();
  if (!c) return null;
  if (c !== c.toUpperCase()) return c; // já tem minúsculas → respeita como está
  return c
    .toLowerCase()
    .split(/\s+/)
    .map((p) =>
      ["de", "da", "do", "das", "dos", "e"].includes(p)
        ? p
        : p.charAt(0).toUpperCase() + p.slice(1),
    )
    .join(" ");
}

/**
 * Piso da abertura A. O dono definiu "tem nota e avaliações → A; sem nota → B", mas não previu
 * NOTA RUIM: a abertura A afirma "em {categoria}, isso é raro" e "quem chega até vocês sai
 * satisfeito, e as avaliações provam isso". Com 3,7 as avaliações provam o CONTRÁRIO — seria
 * lisonja que o próprio dado desmente, e o dono do negócio sabe a nota dele melhor que nós.
 *
 * 4,5 é o piso onde as duas frases se sustentam. Abaixo disso cai na abertura B, que não faz
 * afirmação nenhuma sobre reputação (nunca mente, só não elogia). Nos dados reais isso afeta
 * 16 de 173 leads com nota — 91% estão em 4,8+ e seguem na abertura A.
 */
export const NOTA_MINIMA_ABERTURA_A = 4.5;

/** Abertura A exige nota BOA E avaliações: é o que as frases dela afirmam. */
export function usaAberturaA(d: Pick<DadosCopy, "nota" | "n_avaliacoes">): boolean {
  return d.nota != null && d.nota >= NOTA_MINIMA_ABERTURA_A && (d.n_avaliacoes ?? 0) > 0;
}

/** "em {categoria}" — omite o trecho se a categoria faltar, em vez de inventar uma. */
function emCategoria(categoria: string | null): string {
  const c = normalizarCategoria(categoria);
  return c ? ` — em ${c}, isso é raro` : " — isso é raro";
}

/** "quem procura {categoria} em {cidade}" — degrada sem mentir se faltar dado. */
function quemProcura(categoria: string | null, cidade: string | null): string {
  const c = normalizarCategoria(categoria);
  const ci = normalizarCidade(cidade);
  if (c && ci) return `quem procura ${c} em ${ci}`;
  if (c) return `quem procura ${c} na região`;
  if (ci) return `quem procura um serviço como o de vocês em ${ci}`;
  return "quem procura um serviço como o de vocês";
}

/** Abertura A — lead COM nota e avaliações reais. */
function aberturaA(d: DadosCopy, motivo: string): string {
  const avaliacoes = (d.n_avaliacoes ?? 0).toLocaleString("pt-BR");
  return [
    `${d.nome_negocio}, vocês têm ${fmtNota(d.nota!)} no Google com ${avaliacoes} avaliações${emCategoria(d.categoria)}. Quem chega até vocês sai satisfeito, e as avaliações provam isso.`,
    "",
    `O problema está no caminho até vocês. ${motivo}`,
  ].join("\n");
}

/** Abertura B — lead SEM nota (OSM/Geoapify). Não cita nota nem avaliações. */
function aberturaB(d: DadosCopy, motivo: string): string {
  return `${d.nome_negocio}, ${quemProcura(d.categoria, d.cidade)} encontra vocês no Google. O que acontece depois é o problema. ${motivo}`;
}

/** Corpo comum às duas aberturas. */
function corpoComum(d: DadosCopy): string {
  return [
    // Antes esta frase repetia "quem procura {categoria} em {cidade}", que a abertura B já
    // diz na linha anterior — duas vezes seguidas. Como o corpo é COMUM às duas aberturas,
    // a frase agora não depende de categoria/cidade: serve às duas sem repetir nada.
    `A decisão acontece em poucos segundos, no celular, olhando o que aparece. Se o que aparece não passa a mesma impressão que o trabalho de vocês passa, vocês perdem o contato antes de qualquer conversa — e nem ficam sabendo que perderam.`,
    "",
    "Peguei o que já é público de vocês (fotos, avaliações reais, endereço, WhatsApp) e refiz a página. Não é maquete nem apresentação: está no ar, abre no celular agora.",
    "",
    d.link,
    "",
    "Se fizer sentido, responde este e-mail que eu explico como funciona. Se não for o momento, sem problema — não insisto.",
    "",
    d.remetente,
  ].join("\n");
}

/**
 * Monta o corpo final da proposta. `motivo` vem de classificarMotivo() — quem chama garante
 * que não é null (sem motivo → não existe proposta).
 */
export function montarCorpoProposta(d: DadosCopy, motivo: Motivo): string {
  const abertura = usaAberturaA(d) ? aberturaA(d, motivo.texto) : aberturaB(d, motivo.texto);
  return [abertura, "", corpoComum(d)].join("\n");
}

/* ------------------------------- FOLLOW-UP (D+3) ------------------------------- */

/** "Re: " + assunto original — mantém a thread. Não duplica o "Re:" se já houver. */
export function assuntoFollowUp(assuntoOriginal: string): string {
  const a = (assuntoOriginal || ASSUNTO_PROPOSTA).trim();
  return /^re:/i.test(a) ? a : `Re: ${a}`;
}

/**
 * Prazo da retirada do ar. `dias` null → a frase vira "em alguns dias": NUNCA chutar número.
 */
export function frasePrazo(dias: number | null): string {
  const quando =
    dias != null && dias > 0 ? `em ${dias} ${dias === 1 ? "dia" : "dias"}` : "em alguns dias";
  return `Um aviso prático: eu tiro essa página do ar ${quando}. Não é pressão de venda — é que eu não deixo prévia hospedada por tempo indeterminado.`;
}

export type DadosFollowUp = {
  nome_negocio: string;
  link: string;
  /** Calculado do expira_em; null quando não dá pra calcular → "em alguns dias". */
  dias_restantes: number | null;
  remetente: string;
};

export function montarCorpoFollowUp(d: DadosFollowUp): string {
  return [
    `${d.nome_negocio}, imagino que a rotina não deixe muito tempo pra e-mail.`,
    "",
    "Deixo o link de novo, caso tenha passado batido — é a página de vocês refeita, no ar:",
    "",
    d.link,
    "",
    frasePrazo(d.dias_restantes),
    "",
    'Se não for o momento, responde só "não" que eu não escrevo mais.',
    "",
    d.remetente,
  ].join("\n");
}

/** Dias inteiros até `expiraEm` (arredonda pra cima: "falta 1 dia" até virar 0). */
export function diasAte(expiraEm: string | null | undefined, agora = new Date()): number | null {
  if (!expiraEm) return null;
  const t = Date.parse(expiraEm);
  if (Number.isNaN(t)) return null;
  const dias = Math.ceil((t - agora.getTime()) / 86400000);
  return dias > 0 ? dias : null;
}
