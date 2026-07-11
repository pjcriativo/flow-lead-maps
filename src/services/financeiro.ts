// Camada de serviço — Financeiro (Fase 2).
// HOJE: dados mock em memória. DEPOIS: trocar SÓ o corpo destas funções pelas
// consultas ao Supabase (cobranças/parcelas por org). As telas consomem ESTAS
// assinaturas e não mudam quando a API real entrar.
import type { RegistroFinanceiro } from "@/types";

const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms));

let store: RegistroFinanceiro[] = [
  {
    id: "fin-1",
    lead_id: "lead-201",
    lead_nome: "Estética Bella Pele",
    contrato_id: "cont-1",
    descricao: "Redesign do site — entrada (50%)",
    valor: 1250,
    status: "pago",
    vencimento: "2026-06-20",
    pago_em: "2026-06-19T13:00:00.000Z",
  },
  {
    id: "fin-2",
    lead_id: "lead-201",
    lead_nome: "Estética Bella Pele",
    contrato_id: "cont-1",
    descricao: "Redesign do site — saldo (50%)",
    valor: 1250,
    status: "pendente",
    vencimento: "2026-07-20",
    pago_em: null,
  },
  {
    id: "fin-3",
    lead_id: "lead-202",
    lead_nome: "Pet Shop Amigo Fiel",
    contrato_id: "cont-2",
    descricao: "Novo site + publicação",
    valor: 1800,
    status: "atrasado",
    vencimento: "2026-07-05",
    pago_em: null,
  },
  {
    id: "fin-4",
    lead_id: "lead-204",
    lead_nome: "Contabilidade Prisma",
    contrato_id: null,
    descricao: "Manutenção mensal — julho",
    valor: 350,
    status: "pendente",
    vencimento: "2026-07-28",
    pago_em: null,
  },
  {
    id: "fin-5",
    lead_id: "lead-205",
    lead_nome: "Studio Fotografia Luz",
    contrato_id: null,
    descricao: "Projeto cancelado pelo cliente",
    valor: 900,
    status: "cancelado",
    vencimento: "2026-06-30",
    pago_em: null,
  },
];

/** Lista todos os registros financeiros do usuário. */
export async function listarFinanceiro(): Promise<RegistroFinanceiro[]> {
  // TODO: LIGAR API — GET cobranças/parcelas do usuário/org no Supabase (RLS).
  await delay();
  return store.map((r) => ({ ...r }));
}

/** Marca um registro como pago. */
export async function marcarComoPago(id: string): Promise<RegistroFinanceiro> {
  // TODO: LIGAR API — UPDATE status='pago' + pago_em no Supabase (e conciliar
  // com o provedor de pagamento quando houver).
  await delay(400);
  let atualizado: RegistroFinanceiro | undefined;
  store = store.map((r) => {
    if (r.id !== id) return r;
    atualizado = { ...r, status: "pago" as const, pago_em: new Date().toISOString() };
    return atualizado;
  });
  if (!atualizado) throw new Error("Registro não encontrado");
  return { ...atualizado };
}
