// Camada de serviço — Contratos (Fase 2).
// HOJE: dados mock em memória. DEPOIS: trocar SÓ o corpo destas funções pela
// geração real (template → HTML/PDF/DOCX) e persistência no Supabase. As telas
// consomem ESTAS assinaturas e não mudam quando a API real entrar.
import type { Contrato } from "@/types";

const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms));

// Modelos de exemplo (mock) para gerar contratos enquanto não há API.
const MODELOS = [
  {
    lead_id: "lead-202",
    nome: "Pet Shop Amigo Fiel",
    proposta_id: "prop-2",
    titulo: "Redesign de site — Amigo Fiel",
    valor: 1800,
  },
  {
    lead_id: "lead-204",
    nome: "Contabilidade Prisma",
    proposta_id: null,
    titulo: "Site institucional — Prisma",
    valor: 2400,
  },
  {
    lead_id: "lead-206",
    nome: "Barbearia Navalha de Ouro",
    proposta_id: null,
    titulo: "Landing page + agendamento",
    valor: 1500,
  },
];

// Monta o HTML do contrato (template simples pt-BR). DEPOIS pode virar IA/DOCX.
function montarContratoHtml(nome: string, valor: number, data: string): string {
  const valorFmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    valor,
  );
  return `
    <h2>Contrato de Prestação de Serviços</h2>
    <p><strong>CONTRATADA:</strong> Flow Leads — desenvolvimento e reformulação de sites.</p>
    <p><strong>CONTRATANTE:</strong> ${nome}.</p>
    <h3>1. Objeto</h3>
    <p>Desenvolvimento de um novo site responsivo para a CONTRATANTE, com foco em
    captação de contatos (WhatsApp/formulário), incluindo layout moderno, textos e
    otimização básica para dispositivos móveis.</p>
    <h3>2. Valor e pagamento</h3>
    <p>O valor total dos serviços é de <strong>${valorFmt}</strong>, pago em duas
    parcelas: 50% na assinatura e 50% na entrega/publicação.</p>
    <h3>3. Prazo</h3>
    <p>A entrega da primeira versão ocorrerá em até 10 (dez) dias úteis após a
    assinatura e o envio do material pela CONTRATANTE.</p>
    <h3>4. Direitos sobre o conteúdo</h3>
    <p>As imagens, logotipo e textos fornecidos pela CONTRATANTE permanecem de sua
    propriedade. O site entregue é de uso exclusivo da CONTRATANTE.</p>
    <p style="margin-top:24px">Data: ${data}</p>
    <p style="margin-top:32px">__________________________________<br/>CONTRATANTE — ${nome}</p>
    <p style="margin-top:16px">__________________________________<br/>CONTRATADA — Flow Leads</p>
  `;
}

let seq = 2;
let store: Contrato[] = [
  {
    id: "cont-1",
    lead_id: "lead-201",
    lead_nome: "Estética Bella Pele",
    proposta_id: "prop-1",
    titulo: "Redesign do site — Bella Pele",
    valor: 2500,
    status: "assinado",
    criado_em: "2026-06-15T10:00:00.000Z",
    assinado_em: "2026-06-18T15:30:00.000Z",
    conteudo_html: montarContratoHtml("Estética Bella Pele", 2500, "15/06/2026"),
  },
  {
    id: "cont-2",
    lead_id: "lead-202",
    lead_nome: "Pet Shop Amigo Fiel",
    proposta_id: "prop-2",
    titulo: "Novo site + publicação — Amigo Fiel",
    valor: 1800,
    status: "gerado",
    criado_em: "2026-07-08T12:00:00.000Z",
    assinado_em: null,
    conteudo_html: montarContratoHtml("Pet Shop Amigo Fiel", 1800, "08/07/2026"),
  },
];

/** Lista todos os contratos do usuário. */
export async function listarContratos(): Promise<Contrato[]> {
  // TODO: LIGAR API — GET contratos do usuário/org no Supabase (RLS).
  await delay();
  return store.map((c) => ({ ...c }));
}

/** Gera um novo contrato (status: gerado) a partir de um modelo/proposta. */
export async function gerarContrato(): Promise<Contrato> {
  // TODO: LIGAR API — geração real do contrato (template/IA → HTML/PDF/DOCX) e
  // INSERT no Supabase. Recebe a proposta aceita + dados do lead.
  await delay(600);
  const m = MODELOS[seq % MODELOS.length];
  seq += 1;
  const hoje = new Date();
  const novo: Contrato = {
    id: `cont-${seq}`,
    lead_id: m.lead_id,
    lead_nome: m.nome,
    proposta_id: m.proposta_id,
    titulo: m.titulo,
    valor: m.valor,
    status: "gerado",
    criado_em: hoje.toISOString(),
    assinado_em: null,
    conteudo_html: montarContratoHtml(m.nome, m.valor, hoje.toLocaleDateString("pt-BR")),
  };
  store = [novo, ...store];
  return { ...novo };
}

/** Marca um contrato como assinado. */
export async function marcarComoAssinado(id: string): Promise<Contrato> {
  // TODO: LIGAR API — UPDATE status='assinado' + assinado_em (e integrar com
  // assinatura eletrônica quando houver).
  await delay(400);
  let atualizado: Contrato | undefined;
  store = store.map((c) => {
    if (c.id !== id) return c;
    atualizado = { ...c, status: "assinado" as const, assinado_em: new Date().toISOString() };
    return atualizado;
  });
  if (!atualizado) throw new Error("Contrato não encontrado");
  return { ...atualizado };
}
