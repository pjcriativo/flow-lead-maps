// Monta o SiteData (o que o template renderiza) a partir da matéria-prima real
// + do conteúdo da IA. Aqui é onde os DADOS REAIS viram uso concreto: WhatsApp
// vira wa.me com mensagem, endereço vira link+mapa, fotos ganham fallback, cores
// são resolvidas. Nada sai com placeholder cru.
import type { MateriaPrima, ConteudoIA } from "../ai/types.ts";
import type { SiteData, Cores, TemplateId, Servico, Depoimento } from "./tipos.ts";
import { firstBrWhatsapp } from "../phone.ts";
import { resolverFotoSet } from "./imagens.ts";
import { categoriaLabel } from "./nicho.ts";

/** Escapa texto para inserir com segurança no HTML. */
export function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* --------------------------------- cores --------------------------------- */

const PALETA_PADRAO: Record<TemplateId, Cores> = {
  saude: {
    primaria: "#0e9aa7",
    secundaria: "#7c6ff0",
    escura: "#0f2942",
    clara: "#f0fbfd",
    contraste: "#ffffff",
  },
  "servico-local": {
    primaria: "#f4364c",
    secundaria: "#f59e0b",
    escura: "#1a1420",
    clara: "#fff7f2",
    contraste: "#ffffff",
  },
  profissional: {
    primaria: "#1e3a5f",
    secundaria: "#b08d57",
    escura: "#0f1a2b",
    clara: "#f7f9fc",
    contraste: "#ffffff",
  },
};

function hexOk(c: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(c);
}
function luminancia(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrasteDe(hex: string): string {
  return luminancia(hex) > 0.6 ? "#0f172a" : "#ffffff";
}

/** Usa a cor real do site quando existir e for utilizável; senão, a paleta do nicho. */
function resolverCores(coresReais: string[], nicho: TemplateId): Cores {
  const padrao = PALETA_PADRAO[nicho];
  const boas = coresReais.filter(hexOk).filter((c) => {
    const l = luminancia(c);
    return l > 0.08 && l < 0.9; // evita quase-preto e quase-branco
  });
  if (!boas.length) return padrao;
  const primaria = boas[0];
  const secundaria = boas[1] && boas[1] !== primaria ? boas[1] : padrao.secundaria;
  return {
    primaria,
    secundaria,
    escura: padrao.escura,
    clara: padrao.clara,
    contraste: contrasteDe(primaria),
  };
}

/* ------------------------------- contato --------------------------------- */

function mensagemWhatsapp(nome: string, nicho: TemplateId): string {
  const acao =
    nicho === "saude"
      ? "gostaria de agendar uma avaliação"
      : nicho === "profissional"
        ? "gostaria de uma consulta"
        : "gostaria de mais informações";
  return `Olá! Vim pelo site da ${nome} e ${acao}.`;
}

function mapEmbed(lat: number | null, lng: number | null, endereco: string | null): string | null {
  if (lat != null && lng != null)
    return `https://www.google.com/maps?q=${lat},${lng}&z=16&output=embed`;
  if (endereco)
    return `https://www.google.com/maps?q=${encodeURIComponent(endereco)}&z=16&output=embed`;
  return null;
}
function mapsLink(lat: number | null, lng: number | null, endereco: string | null): string | null {
  if (endereco)
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`;
  if (lat != null && lng != null)
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  return null;
}

/* -------------------------------- montar --------------------------------- */

const mapServico = (s: { titulo: string; descricao?: string; icone?: string }): Servico => ({
  titulo: s.titulo,
  descricao: s.descricao ?? "",
  icone: s.icone ?? "check-circle",
});

export function montarSiteData(
  mp: MateriaPrima,
  conteudo: ConteudoIA,
  nicho: TemplateId,
  depoimentos: Depoimento[] = [],
): SiteData {
  const whatsapp = firstBrWhatsapp(mp.whatsapp) ?? firstBrWhatsapp(mp.telefone);
  const whatsappUrl = whatsapp
    ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(mensagemWhatsapp(mp.nome, nicho))}`
    : null;
  const telDigitsRaw = (mp.telefone ?? "").replace(/[^\d+]/g, "");
  const telUrl = telDigitsRaw
    ? `tel:${telDigitsRaw.startsWith("+") ? telDigitsRaw : "+55" + telDigitsRaw.replace(/^55/, "")}`
    : null;

  const fotos = resolverFotoSet(mp.imagens, nicho);

  const servicos = (conteudo.servicos ?? [])
    .filter((s) => s && s.titulo)
    .slice(0, 6)
    .map(mapServico);
  const diferenciais = (conteudo.diferenciais ?? [])
    .filter((s) => s && s.titulo)
    .slice(0, 4)
    .map(mapServico);

  return {
    nome: mp.nome,
    categoriaLabel: categoriaLabel(mp.categoria),
    cidade: mp.cidade,
    estado: mp.estado,
    rating: typeof mp.rating === "number" ? mp.rating : mp.rating ? Number(mp.rating) : null,
    reviews: mp.reviews ?? null,
    whatsapp,
    whatsappUrl,
    telefone: mp.telefone,
    telUrl,
    endereco: mp.endereco,
    mapsUrl: mapsLink(mp.latitude, mp.longitude, mp.endereco),
    mapEmbedUrl: mapEmbed(mp.latitude, mp.longitude, mp.endereco),
    fotoHero: fotos.hero,
    fotoSobre: fotos.sobre,
    fotoCta: fotos.cta,
    fotos: fotos.galeria,
    logo: mp.logo,
    cores: resolverCores(mp.cores, nicho),
    instagram: mp.instagram,
    facebook: mp.facebook,
    headline: conteudo.headline,
    subheadline: conteudo.subheadline,
    servicos,
    diferenciais,
    sobre: conteudo.sobre,
    faq: (conteudo.faq ?? []).filter((f) => f.pergunta && f.resposta).slice(0, 6),
    cta: conteudo.cta || "Fale conosco",
    depoimentos: (depoimentos ?? []).filter((d) => d.text && d.text.length >= 15).slice(0, 6),
  };
}
