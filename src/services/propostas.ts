// Camada de serviço — Propostas (Fase 2).
// HOJE: dados mock em memória. DEPOIS: trocar SÓ o corpo destas funções pelas
// chamadas às Edge Functions (generate-proposal / send-proposal). As telas
// consomem ESTAS assinaturas e não mudam quando a API real entrar.
import type { Proposta } from "@/types";

const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms));

// Negócios de exemplo (mock) para gerar propostas enquanto não há API.
const NEGOCIOS_EXEMPLO = [
  { id: "lead-101", nome: "Clínica Odontológica Sorriso Real", motivo: "site sem versão mobile e sem botão de WhatsApp na primeira dobra" },
  { id: "lead-102", nome: "Advocacia Menezes & Costa", motivo: "domínio em Google Sites gratuito, layout datado e sem prova social" },
  { id: "lead-103", nome: "Academia Corpo em Foco", motivo: "site não responsivo e sem CTA de agendamento visível" },
  { id: "lead-104", nome: "Restaurante Sabor da Serra", motivo: "cardápio escondido, sem depoimentos e sem link de reserva" },
];

// Monta o texto da proposta no tom do plugin: rapport real, cita o motivo do
// site ruim, SEM preço na primeira abordagem.
function montarCorpo(nome: string, motivo: string): string {
  return [
    `Olá, tudo bem? Encontrei a ${nome} no Google e reparei que vocês têm ótima reputação — nota alta e muitas avaliações de clientes reais.`,
    "",
    `Justamente por isso me chamou atenção que o site atual ${motivo}. Hoje boa parte dos clientes decide pelo celular, e um site assim faz perder contato que já estava quase fechado.`,
    "",
    "Eu trabalho refazendo sites desse tipo com foco em agendamento/contato pelo WhatsApp e visual moderno. Posso te mostrar, sem compromisso, uma prévia de como ficaria a nova versão da sua página?",
    "",
    "Um abraço,",
    "Equipe Flow Leads",
  ].join("\n");
}

// Store mutável em memória (persiste durante a sessão do navegador).
let seq = 3;
let store: Proposta[] = [
  {
    id: "prop-1",
    lead_id: "lead-201",
    lead_nome: "Estética Bella Pele",
    assunto: "Uma versão muito melhor do site da Bella Pele",
    corpo: montarCorpo("Estética Bella Pele", "não abre direito no celular e não tem botão de WhatsApp"),
    valor: null,
    status: "respondida",
    criada_em: "2026-07-02T14:10:00.000Z",
    enviada_em: "2026-07-02T14:25:00.000Z",
    respondida_em: "2026-07-04T09:05:00.000Z",
  },
  {
    id: "prop-2",
    lead_id: "lead-202",
    lead_nome: "Pet Shop Amigo Fiel",
    assunto: "Reparei no site do Amigo Fiel — dá pra melhorar muito",
    corpo: montarCorpo("Pet Shop Amigo Fiel", "usa um template antigo e não mostra os serviços com clareza"),
    valor: 1800,
    status: "enviada",
    criada_em: "2026-07-08T11:00:00.000Z",
    enviada_em: "2026-07-08T11:20:00.000Z",
    respondida_em: null,
  },
  {
    id: "prop-3",
    lead_id: "lead-203",
    lead_nome: "Oficina Turbo Mecânica",
    assunto: "Rascunho — proposta Turbo Mecânica",
    corpo: montarCorpo("Oficina Turbo Mecânica", "não é responsivo e não tem nenhuma chamada para contato"),
    valor: null,
    status: "rascunho",
    criada_em: "2026-07-10T16:40:00.000Z",
    enviada_em: null,
    respondida_em: null,
  },
];

/** Lista todas as propostas do usuário. */
export async function listarPropostas(): Promise<Proposta[]> {
  // TODO: LIGAR API — GET propostas do usuário/org no Supabase (RLS).
  await delay();
  return store.map((p) => ({ ...p }));
}

/** Lista as propostas de um lead específico. */
export async function listarPropostasPorLead(leadId: string): Promise<Proposta[]> {
  // TODO: LIGAR API — GET propostas filtradas por lead_id.
  await delay();
  return store.filter((p) => p.lead_id === leadId).map((p) => ({ ...p }));
}

/** Gera uma nova proposta (rascunho) a partir de um lead. */
export async function gerarProposta(): Promise<Proposta> {
  // TODO: LIGAR API — Edge Function generate-proposal (template com variáveis
  // ou IA). Recebe o lead + o motivo do site ruim (score_breakdown da Fase 1).
  await delay(600);
  const alvo = NEGOCIOS_EXEMPLO[seq % NEGOCIOS_EXEMPLO.length];
  seq += 1;
  const nova: Proposta = {
    id: `prop-${seq}`,
    lead_id: alvo.id,
    lead_nome: alvo.nome,
    assunto: `Uma versão muito melhor do site — ${alvo.nome}`,
    corpo: montarCorpo(alvo.nome, alvo.motivo),
    valor: null,
    status: "rascunho",
    criada_em: new Date().toISOString(),
    enviada_em: null,
    respondida_em: null,
  };
  store = [nova, ...store];
  return { ...nova };
}

/** Salva a edição de uma proposta (assunto, corpo, valor). */
export async function salvarProposta(proposta: Proposta): Promise<Proposta> {
  // TODO: LIGAR API — UPDATE da proposta no Supabase.
  await delay();
  store = store.map((p) => (p.id === proposta.id ? { ...proposta } : p));
  return { ...proposta };
}

/** Envia a proposta por e-mail (marca como enviada). */
export async function enviarProposta(id: string): Promise<Proposta> {
  // TODO: LIGAR API — Edge Function send-proposal (Resend/SES por org, com
  // SPF/DKIM). Aqui apenas simula a mudança de status.
  await delay(600);
  let atualizada: Proposta | undefined;
  store = store.map((p) => {
    if (p.id !== id) return p;
    atualizada = { ...p, status: "enviada" as const, enviada_em: new Date().toISOString() };
    return atualizada;
  });
  if (!atualizada) throw new Error("Proposta não encontrada");
  return { ...atualizada };
}
