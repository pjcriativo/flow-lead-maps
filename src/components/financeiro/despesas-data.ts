// Catálogo e Modelagem de Dados da Tela 03: Despesas (Gestão → Financeiro → Despesas)
// Fiel aos registros, indicadores, categorias e painel lateral da imagem de referência aprovada.

export interface RecorrenciaFornecedorItem {
  id: string;
  nome: string;
  valorTexto: string;
  status: "ativo" | "inativo";
  tipoIcone: "server" | "globe" | "mail" | "app";
}

export interface FaturaFornecedorItem {
  id: string;
  data: string;
  valor: number;
  status: "pago" | "pendente" | "em_atraso";
  doc: string;
}

export interface DespesaItem {
  id: string;
  data: string;
  descricao: string;
  fornecedor: string;
  fornecedorLogoLetra: string;
  fornecedorLogoBg: string;
  fornecedorSub: string;
  categoria:
    | "Infraestrutura"
    | "Marketing"
    | "Ferramentas"
    | "Equipe"
    | "Administrativo"
    | "Serviços"
    | "Outros";
  categoriaBadge: string;
  tipo: "recorrente" | "fixo" | "variavel" | "unico";
  tipoRotulo: "Recorrente" | "Fixo" | "Variável" | "Único";
  tipoBadge: string;
  valor: number;
  status: "pago" | "pendente" | "em_atraso" | "cancelado";
  statusRotulo: "Pago" | "Pendente" | "Em atraso" | "Cancelado";
  vencimento: string;
  documentoCodigo: string;
  contratoCodigo: string;
  detalhesFornecedor: {
    cnpj: string;
    contatoFinanceiro: string;
    telefone: string;
    categoria: string;
    condicoes: string;
    prazo: string;
  };
  recorrenciasFornecedor: RecorrenciaFornecedorItem[];
  faturas: FaturaFornecedorItem[];
}

export const DESPESAS_CATALOGO_INICIAL: DespesaItem[] = [
  {
    id: "desp-1",
    data: "01/10/2026",
    descricao: "Plano de hospedagem - VPS",
    fornecedor: "Hostinger",
    fornecedorLogoLetra: "H",
    fornecedorLogoBg: "bg-purple-600 text-white font-bold",
    fornecedorSub: "Fornecedor de Hospedagem",
    categoria: "Infraestrutura",
    categoriaBadge: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    tipo: "recorrente",
    tipoRotulo: "Recorrente",
    tipoBadge: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    valor: 249.9,
    status: "pago",
    statusRotulo: "Pago",
    vencimento: "01/10/2026",
    documentoCodigo: "NF-45823",
    contratoCodigo: "-",
    detalhesFornecedor: {
      cnpj: "12.345.678/0001-90",
      contatoFinanceiro: "financeiro@hostinger.com",
      telefone: "+55 11 4003-6541",
      categoria: "Infraestrutura",
      condicoes: "Boleto / Cartão",
      prazo: "5 dias",
    },
    recorrenciasFornecedor: [
      {
        id: "rec-h1",
        nome: "VPS KVM 2",
        valorTexto: "R$ 249,90/mês",
        status: "ativo",
        tipoIcone: "server",
      },
      {
        id: "rec-h2",
        nome: "Domínio flowgenius.com.br",
        valorTexto: "R$ 39,90/ano",
        status: "ativo",
        tipoIcone: "globe",
      },
      {
        id: "rec-h3",
        nome: "Email Profissional",
        valorTexto: "R$ 29,90/mês",
        status: "ativo",
        tipoIcone: "mail",
      },
    ],
    faturas: [
      { id: "fat-1", data: "01/10/2026", valor: 249.9, status: "pago", doc: "NF-45823" },
      { id: "fat-2", data: "01/09/2026", valor: 249.9, status: "pago", doc: "NF-44102" },
      { id: "fat-3", data: "01/08/2026", valor: 249.9, status: "pago", doc: "NF-42991" },
    ],
  },
  {
    id: "desp-2",
    data: "01/10/2026",
    descricao: "Campanha Meta Ads",
    fornecedor: "Meta Platforms",
    fornecedorLogoLetra: "M",
    fornecedorLogoBg: "bg-blue-600 text-white font-bold",
    fornecedorSub: "Mídia & Tráfego Pago",
    categoria: "Marketing",
    categoriaBadge: "bg-pink-500/20 text-pink-300 border-pink-500/30",
    tipo: "recorrente",
    tipoRotulo: "Recorrente",
    tipoBadge: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    valor: 1250.0,
    status: "pago",
    statusRotulo: "Pago",
    vencimento: "01/10/2026",
    documentoCodigo: "NF-78452",
    contratoCodigo: "-",
    detalhesFornecedor: {
      cnpj: "07.463.811/0001-00",
      contatoFinanceiro: "billing@meta.com",
      telefone: "+55 11 3000-0000",
      categoria: "Marketing",
      condicoes: "Cartão de Crédito",
      prazo: "Imediato",
    },
    recorrenciasFornecedor: [
      {
        id: "rec-m1",
        nome: "Conta de Anúncios Principal",
        valorTexto: "R$ 1.250,00/mês",
        status: "ativo",
        tipoIcone: "app",
      },
    ],
    faturas: [
      { id: "fat-m1", data: "01/10/2026", valor: 1250.0, status: "pago", doc: "NF-78452" },
    ],
  },
  {
    id: "desp-3",
    data: "02/10/2026",
    descricao: "Assinatura Claude Pro",
    fornecedor: "Anthropic",
    fornecedorLogoLetra: "A",
    fornecedorLogoBg: "bg-amber-700 text-amber-100 font-bold",
    fornecedorSub: "Modelos de Inteligência Artificial",
    categoria: "Ferramentas",
    categoriaBadge: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    tipo: "recorrente",
    tipoRotulo: "Recorrente",
    tipoBadge: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    valor: 99.0,
    status: "pago",
    statusRotulo: "Pago",
    vencimento: "02/10/2026",
    documentoCodigo: "NF-11234",
    contratoCodigo: "-",
    detalhesFornecedor: {
      cnpj: "EUA-98.765.432",
      contatoFinanceiro: "support@anthropic.com",
      telefone: "+1 415 555-0199",
      categoria: "Ferramentas",
      condicoes: "Cartão Internacional",
      prazo: "Recorrente mensal",
    },
    recorrenciasFornecedor: [
      {
        id: "rec-a1",
        nome: "Claude 3.5 Sonnet Team",
        valorTexto: "R$ 99,00/mês",
        status: "ativo",
        tipoIcone: "app",
      },
    ],
    faturas: [
      { id: "fat-a1", data: "02/10/2026", valor: 99.0, status: "pago", doc: "NF-11234" },
    ],
  },
  {
    id: "desp-4",
    data: "03/10/2026",
    descricao: "Desenvolvimento - Equipe",
    fornecedor: "Equipe Interna",
    fornecedorLogoLetra: "A",
    fornecedorLogoBg: "bg-neutral-800 text-neutral-200 border border-white/20",
    fornecedorSub: "Folha & Prestadores Tech",
    categoria: "Equipe",
    categoriaBadge: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    tipo: "fixo",
    tipoRotulo: "Fixo",
    tipoBadge: "bg-blue-900/30 text-blue-300 border-blue-500/30",
    valor: 4800.0,
    status: "pago",
    statusRotulo: "Pago",
    vencimento: "03/10/2026",
    documentoCodigo: "FOL-2026-01",
    contratoCodigo: "-",
    detalhesFornecedor: {
      cnpj: "Interno",
      contatoFinanceiro: "rh@flowbusiness.com.br",
      telefone: "+55 11 98888-7777",
      categoria: "Equipe",
      condicoes: "PIX / Transferência",
      prazo: "5º dia útil",
    },
    recorrenciasFornecedor: [
      {
        id: "rec-eq1",
        nome: "Folha Desenvolvedores",
        valorTexto: "R$ 4.800,00/mês",
        status: "ativo",
        tipoIcone: "mail",
      },
    ],
    faturas: [
      { id: "fat-e1", data: "03/10/2026", valor: 4800.0, status: "pago", doc: "FOL-2026-01" },
    ],
  },
  {
    id: "desp-5",
    data: "05/10/2026",
    descricao: "API Apify - Pacote",
    fornecedor: "Apify",
    fornecedorLogoLetra: "a",
    fornecedorLogoBg: "bg-emerald-600 text-white font-bold",
    fornecedorSub: "Scraping & Automação Web",
    categoria: "Ferramentas",
    categoriaBadge: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    tipo: "recorrente",
    tipoRotulo: "Recorrente",
    tipoBadge: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    valor: 299.0,
    status: "pendente",
    statusRotulo: "Pendente",
    vencimento: "05/10/2026",
    documentoCodigo: "-",
    contratoCodigo: "-",
    detalhesFornecedor: {
      cnpj: "CZ-04781498",
      contatoFinanceiro: "billing@apify.com",
      telefone: "+420 226 258 400",
      categoria: "Ferramentas",
      condicoes: "Cartão",
      prazo: "Mensal",
    },
    recorrenciasFornecedor: [
      {
        id: "rec-ap1",
        nome: "Plano Creator (Scraping)",
        valorTexto: "R$ 299,00/mês",
        status: "ativo",
        tipoIcone: "app",
      },
    ],
    faturas: [],
  },
  {
    id: "desp-6",
    data: "07/10/2026",
    descricao: "Google Workspace",
    fornecedor: "Google",
    fornecedorLogoLetra: "G",
    fornecedorLogoBg: "bg-blue-500 text-white font-bold",
    fornecedorSub: "E-mails & Produtividade Cloud",
    categoria: "Ferramentas",
    categoriaBadge: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    tipo: "recorrente",
    tipoRotulo: "Recorrente",
    tipoBadge: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    valor: 159.9,
    status: "pago",
    statusRotulo: "Pago",
    vencimento: "07/10/2026",
    documentoCodigo: "NF-99614",
    contratoCodigo: "-",
    detalhesFornecedor: {
      cnpj: "06.990.590/0001-23",
      contatoFinanceiro: "payments-noreply@google.com",
      telefone: "0800 724 8154",
      categoria: "Ferramentas",
      condicoes: "Débito / Cartão",
      prazo: "Mensal",
    },
    recorrenciasFornecedor: [
      {
        id: "rec-g1",
        nome: "Business Starter (5 licenças)",
        valorTexto: "R$ 159,90/mês",
        status: "ativo",
        tipoIcone: "mail",
      },
    ],
    faturas: [
      { id: "fat-g1", data: "07/10/2026", valor: 159.9, status: "pago", doc: "NF-99614" },
    ],
  },
  {
    id: "desp-7",
    data: "10/10/2026",
    descricao: "Licenças Adobe",
    fornecedor: "Adobe",
    fornecedorLogoLetra: "A",
    fornecedorLogoBg: "bg-red-600 text-white font-bold",
    fornecedorSub: "Creative Cloud Design Suite",
    categoria: "Ferramentas",
    categoriaBadge: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    tipo: "recorrente",
    tipoRotulo: "Recorrente",
    tipoBadge: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    valor: 189.0,
    status: "em_atraso",
    statusRotulo: "Em atraso",
    vencimento: "10/10/2026",
    documentoCodigo: "-",
    contratoCodigo: "-",
    detalhesFornecedor: {
      cnpj: "01.401.999/0001-09",
      contatoFinanceiro: "billing@adobe.com",
      telefone: "0800 892 1045",
      categoria: "Ferramentas",
      condicoes: "Cartão de Crédito",
      prazo: "Vencido",
    },
    recorrenciasFornecedor: [
      {
        id: "rec-ad1",
        nome: "Creative Cloud Individual",
        valorTexto: "R$ 189,00/mês",
        status: "ativo",
        tipoIcone: "app",
      },
    ],
    faturas: [],
  },
  {
    id: "desp-8",
    data: "12/10/2026",
    descricao: "Serviços contábeis",
    fornecedor: "Contabilidade",
    fornecedorLogoLetra: "C",
    fornecedorLogoBg: "bg-slate-600 text-white font-bold",
    fornecedorSub: "Assessoria Fiscal & Contábil",
    categoria: "Administrativo",
    categoriaBadge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    tipo: "fixo",
    tipoRotulo: "Fixo",
    tipoBadge: "bg-blue-900/30 text-blue-300 border-blue-500/30",
    valor: 650.0,
    status: "pendente",
    statusRotulo: "Pendente",
    vencimento: "12/10/2026",
    documentoCodigo: "NF-66211",
    contratoCodigo: "-",
    detalhesFornecedor: {
      cnpj: "18.912.441/0001-55",
      contatoFinanceiro: "contato@contabilidade.com.br",
      telefone: "+55 11 3222-1111",
      categoria: "Administrativo",
      condicoes: "Boleto Bancário",
      prazo: "Dia 12",
    },
    recorrenciasFornecedor: [
      {
        id: "rec-ct1",
        nome: "Mensalidade Contábil PJ",
        valorTexto: "R$ 650,00/mês",
        status: "ativo",
        tipoIcone: "mail",
      },
    ],
    faturas: [],
  },
  {
    id: "desp-9",
    data: "15/10/2026",
    descricao: "Energia elétrica",
    fornecedor: "Copel",
    fornecedorLogoLetra: "C",
    fornecedorLogoBg: "bg-pink-600 text-white font-bold",
    fornecedorSub: "Concessionária de Energia",
    categoria: "Infraestrutura",
    categoriaBadge: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    tipo: "fixo",
    tipoRotulo: "Fixo",
    tipoBadge: "bg-blue-900/30 text-blue-300 border-blue-500/30",
    valor: 380.0,
    status: "pago",
    statusRotulo: "Pago",
    vencimento: "15/10/2026",
    documentoCodigo: "NF-88421",
    contratoCodigo: "-",
    detalhesFornecedor: {
      cnpj: "76.483.817/0001-20",
      contatoFinanceiro: "atendimento@copel.com",
      telefone: "0800 51 00 116",
      categoria: "Infraestrutura",
      condicoes: "Débito Automático",
      prazo: "Dia 15",
    },
    recorrenciasFornecedor: [
      {
        id: "rec-cp1",
        nome: "Fornecimento Sede",
        valorTexto: "R$ 380,00/mês",
        status: "ativo",
        tipoIcone: "server",
      },
    ],
    faturas: [
      { id: "fat-cp1", data: "15/10/2026", valor: 380.0, status: "pago", doc: "NF-88421" },
    ],
  },
  {
    id: "desp-10",
    data: "18/10/2026",
    descricao: "Ferramenta Kie.ai",
    fornecedor: "Kie.ai",
    fornecedorLogoLetra: "K",
    fornecedorLogoBg: "bg-indigo-600 text-white font-bold",
    fornecedorSub: "Agentes Autônomos de IA",
    categoria: "Ferramentas",
    categoriaBadge: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    tipo: "recorrente",
    tipoRotulo: "Recorrente",
    tipoBadge: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    valor: 199.0,
    status: "pendente",
    statusRotulo: "Pendente",
    vencimento: "18/10/2026",
    documentoCodigo: "-",
    contratoCodigo: "-",
    detalhesFornecedor: {
      cnpj: "Internacional",
      contatoFinanceiro: "support@kie.ai",
      telefone: "+1 800 555-0144",
      categoria: "Ferramentas",
      condicoes: "Cartão",
      prazo: "Mensal",
    },
    recorrenciasFornecedor: [
      {
        id: "rec-k1",
        nome: "Pro Plan (Agentes)",
        valorTexto: "R$ 199,00/mês",
        status: "ativo",
        tipoIcone: "app",
      },
    ],
    faturas: [],
  },
];
