// Dados e Catálogo da Tela 01 — Painel Financeiro
// Fiel às informações, categorias, métricas e transações da imagem aprovada.

export interface TransacaoFinanceiraItem {
  id: string;
  data: string;
  descricao: string;
  clienteFornecedor: string;
  categoria:
    | "Serviços"
    | "Marketing"
    | "Implantação"
    | "Infraestrutura"
    | "Consultoria"
    | "Equipe"
    | "Suporte"
    | "Ferramentas"
    | "Outros";
  categoriaBadgeCor: string;
  tipo: "receita" | "despesa";
  valor: number;
  status: "recebido" | "pago" | "pendente" | "em_atraso" | "cancelado";
  statusRotulo: string;
  documentoCodigo: string;
}

export const TRANSACOES_INICIAIS: TransacaoFinanceiraItem[] = [
  {
    id: "tx-1",
    data: "01/10/2026",
    descricao: "Mensalidade outubro",
    clienteFornecedor: "Clinica Sorriso Mais",
    categoria: "Serviços",
    categoriaBadgeCor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    tipo: "receita",
    valor: 4900,
    status: "recebido",
    statusRotulo: "Recebido",
    documentoCodigo: "CT-2026-001",
  },
  {
    id: "tx-2",
    data: "01/10/2026",
    descricao: "Meta Ads",
    clienteFornecedor: "Meta Platforms",
    categoria: "Marketing",
    categoriaBadgeCor: "bg-pink-500/20 text-pink-300 border-pink-500/30",
    tipo: "despesa",
    valor: 1250,
    status: "pago",
    statusRotulo: "Pago",
    documentoCodigo: "NF-45823",
  },
  {
    id: "tx-3",
    data: "02/10/2026",
    descricao: "Implantação sistema",
    clienteFornecedor: "Studio Caiobá",
    categoria: "Implantação",
    categoriaBadgeCor: "bg-sky-500/20 text-sky-300 border-sky-500/30",
    tipo: "receita",
    valor: 12500,
    status: "recebido",
    statusRotulo: "Recebido",
    documentoCodigo: "CT-2026-002",
  },
  {
    id: "tx-4",
    data: "03/10/2026",
    descricao: "Servidor VPS",
    clienteFornecedor: "Hostinger",
    categoria: "Infraestrutura",
    categoriaBadgeCor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    tipo: "despesa",
    valor: 380,
    status: "pago",
    statusRotulo: "Pago",
    documentoCodigo: "NF-78452",
  },
  {
    id: "tx-5",
    data: "05/10/2026",
    descricao: "Consultoria mensal",
    clienteFornecedor: "Parelheiros Advocacia",
    categoria: "Consultoria",
    categoriaBadgeCor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    tipo: "receita",
    valor: 8900,
    status: "pendente",
    statusRotulo: "Pendente",
    documentoCodigo: "CT-2026-003",
  },
  {
    id: "tx-6",
    data: "07/10/2026",
    descricao: "Salário equipe",
    clienteFornecedor: "Equipe interna",
    categoria: "Equipe",
    categoriaBadgeCor: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    tipo: "despesa",
    valor: 6800,
    status: "pago",
    statusRotulo: "Pago",
    documentoCodigo: "FOL-2026-10",
  },
  {
    id: "tx-7",
    data: "10/10/2026",
    descricao: "Suporte técnico",
    clienteFornecedor: "Dra. Julia Lins",
    categoria: "Suporte",
    categoriaBadgeCor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    tipo: "receita",
    valor: 2400,
    status: "recebido",
    statusRotulo: "Recebido",
    documentoCodigo: "CT-2026-005",
  },
  {
    id: "tx-8",
    data: "12/10/2026",
    descricao: "Ferramenta AISA",
    clienteFornecedor: "AISA",
    categoria: "Ferramentas",
    categoriaBadgeCor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    tipo: "despesa",
    valor: 540,
    status: "pago",
    statusRotulo: "Pago",
    documentoCodigo: "NF-66211",
  },
  {
    id: "tx-9",
    data: "15/10/2026",
    descricao: "Produção de conteúdo",
    clienteFornecedor: "Heloisa Barbosa",
    categoria: "Marketing",
    categoriaBadgeCor: "bg-pink-500/20 text-pink-300 border-pink-500/30",
    tipo: "receita",
    valor: 7800,
    status: "pendente",
    statusRotulo: "Pendente",
    documentoCodigo: "CT-2026-008",
  },
  {
    id: "tx-10",
    data: "18/10/2026",
    descricao: "Licenças de software",
    clienteFornecedor: "Microsoft",
    categoria: "Ferramentas",
    categoriaBadgeCor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    tipo: "despesa",
    valor: 1200,
    status: "pago",
    statusRotulo: "Pago",
    documentoCodigo: "NF-99842",
  },
];

export interface ContaBancariaItem {
  id: string;
  nome: string;
  saldo: number;
  tipo?: string;
}

export const CONTAS_BANCARIAS: ContaBancariaItem[] = [
  { id: "c1", nome: "Banco Principal", saldo: 22400, tipo: "corrente" },
  { id: "c2", nome: "Banco Secundário", saldo: 8350, tipo: "investimento" },
  { id: "c3", nome: "Conta de Pagamentos", saldo: 6000, tipo: "pagamentos" },
];
export const CONTAS_BANCARIAS_INICIAIS = CONTAS_BANCARIAS;

export interface CobrancaResumoItem {
  rotulo: string;
  etapa?: string;
  quantidade: number;
  valor: number;
  valorTotal?: number;
  cor?: string;
  corTexto: string;
  corBadge: string;
}

export const COBRANCAS_RESUMO: CobrancaResumoItem[] = [
  { rotulo: "Vencendo hoje", etapa: "Vencendo hoje", quantidade: 3, valor: 5600, valorTotal: 5600, cor: "bg-neutral-400", corTexto: "text-neutral-300", corBadge: "bg-neutral-500/10 text-neutral-400" },
  { rotulo: "Vencendo em 7 dias", etapa: "Vencendo em 7 dias", quantidade: 5, valor: 8400, valorTotal: 8400, cor: "bg-amber-400", corTexto: "text-amber-400", corBadge: "bg-amber-500/10 text-amber-400" },
  { rotulo: "Vencendo em 15 dias", etapa: "Vencendo em 15 dias", quantidade: 4, valor: 6500, valorTotal: 6500, cor: "bg-orange-400", corTexto: "text-orange-400", corBadge: "bg-orange-500/10 text-orange-400" },
  { rotulo: "Em atraso", etapa: "Em atraso", quantidade: 5, valor: 8900, valorTotal: 8900, cor: "bg-red-400", corTexto: "text-rose-400", corBadge: "bg-rose-500/10 text-rose-400" },
];
export const COBRANCAS_RESUMO_INICIAIS = COBRANCAS_RESUMO;

export interface ProximoVencimentoItem {
  id: string;
  cliente: string;
  clienteNome?: string;
  contratoCodigo: string;
  data: string;
  vencimento?: string;
  valor: number;
  avatarBg: string;
  avatarLetra?: string;
}

export const PROXIMOS_VENCIMENTOS: ProximoVencimentoItem[] = [
  { id: "v1", cliente: "Clinica Sorriso Mais", clienteNome: "Clinica Sorriso Mais", contratoCodigo: "CT-2026-001", data: "01/10/2026", vencimento: "01/10/2026", valor: 4900, avatarBg: "bg-red-500/20 text-red-400", avatarLetra: "CS" },
  { id: "v2", cliente: "Studio Caiobá", clienteNome: "Studio Caiobá", contratoCodigo: "CT-2026-002", data: "05/10/2026", vencimento: "05/10/2026", valor: 12500, avatarBg: "bg-blue-500/20 text-blue-400", avatarLetra: "SC" },
  { id: "v3", cliente: "Parelheiros Advocacia", clienteNome: "Parelheiros Advocacia", contratoCodigo: "CT-2026-003", data: "10/10/2026", vencimento: "10/10/2026", valor: 8900, avatarBg: "bg-slate-500/20 text-slate-300", avatarLetra: "PA" },
  { id: "v4", cliente: "Dra. Julia Lins", clienteNome: "Dra. Julia Lins", contratoCodigo: "CT-2026-005", data: "15/10/2026", vencimento: "15/10/2026", valor: 2400, avatarBg: "bg-emerald-500/20 text-emerald-400", avatarLetra: "JL" },
];
export const PROXIMOS_VENCIMENTOS_INICIAIS = PROXIMOS_VENCIMENTOS;

