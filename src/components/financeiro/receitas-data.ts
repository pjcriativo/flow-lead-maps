// Catálogo e Modelagem de Dados da Tela 02: Receitas (Gestão → Financeiro → Receitas)
// Fiel aos registros, indicadores, categorias e painel lateral da imagem de referência.

export interface RecebimentoHistoricoItem {
  id: string;
  data: string;
  valor: number;
  formaPagamento: "PIX" | "Boleto" | "Cartão" | "Transferência";
  status: "confirmado" | "pendente";
}

export interface ParcelaReceitaItem {
  numero: string;
  vencimento: string;
  valor: number;
  status: "recebido" | "pendente" | "em_atraso";
}

export interface ReceitaItem {
  id: string;
  data: string;
  descricao: string;
  cliente: string;
  clienteSegmento: string;
  clienteLogoLetra: string;
  clienteLogoBg: string;
  categoria:
    | "Serviços"
    | "Marketing"
    | "Implantação"
    | "Consultoria"
    | "Suporte"
    | "Treinamento"
    | "Desenvolvimento"
    | "Ferramentas";
  categoriaBadge: string;
  tipo: "recorrente" | "unico";
  tipoRotulo: "Recorrente" | "Único";
  tipoBadge: string;
  valor: number;
  status: "recebido" | "pendente" | "em_atraso" | "cancelado";
  statusRotulo: "Recebido" | "Pendente" | "Em atraso" | "Cancelado";
  emissao: string;
  vencimento: string;
  contratoCodigo: string;
  responsavel: string;
  recebimentos: RecebimentoHistoricoItem[];
  parcelas: ParcelaReceitaItem[];
}

export const RECEITAS_CATALOGO_INICIAL: ReceitaItem[] = [
  {
    id: "rec-1",
    data: "01/10/2026",
    descricao: "Mensalidade outubro",
    cliente: "Clinica Sorriso Mais",
    clienteSegmento: "Clinica Odontológica • Curitiba - PR",
    clienteLogoLetra: "CS",
    clienteLogoBg: "bg-red-500/20 text-red-400 border border-red-500/30",
    categoria: "Serviços",
    categoriaBadge: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    tipo: "recorrente",
    tipoRotulo: "Recorrente",
    tipoBadge: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    valor: 4900,
    status: "recebido",
    statusRotulo: "Recebido",
    emissao: "01/10/2026",
    vencimento: "01/10/2026",
    contratoCodigo: "CT-2026-001",
    responsavel: "Marcos Gonçalves",
    recebimentos: [
      {
        id: "rc-1",
        data: "01/10/2026",
        valor: 4900,
        formaPagamento: "PIX",
        status: "confirmado",
      },
    ],
    parcelas: [
      { numero: "01/12", vencimento: "01/10/2026", valor: 4900, status: "recebido" },
      { numero: "02/12", vencimento: "01/11/2026", valor: 4900, status: "pendente" },
    ],
  },
  {
    id: "rec-2",
    data: "01/10/2026",
    descricao: "Gestão de tráfego",
    cliente: "Meta Platforms",
    clienteSegmento: "Tecnologia • São Paulo - SP",
    clienteLogoLetra: "MP",
    clienteLogoBg: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
    categoria: "Marketing",
    categoriaBadge: "bg-pink-500/20 text-pink-300 border-pink-500/30",
    tipo: "recorrente",
    tipoRotulo: "Recorrente",
    tipoBadge: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    valor: 1250,
    status: "recebido",
    statusRotulo: "Recebido",
    emissao: "01/10/2026",
    vencimento: "01/10/2026",
    contratoCodigo: "CT-2026-005",
    responsavel: "Marcos Gonçalves",
    recebimentos: [
      {
        id: "rc-2",
        data: "01/10/2026",
        valor: 1250,
        formaPagamento: "Boleto",
        status: "confirmado",
      },
    ],
    parcelas: [
      { numero: "01/06", vencimento: "01/10/2026", valor: 1250, status: "recebido" },
    ],
  },
  {
    id: "rec-3",
    data: "02/10/2026",
    descricao: "Implantação sistema",
    cliente: "Studio Caiobá",
    clienteSegmento: "Design e Arquitetura • Florianópolis - SC",
    clienteLogoLetra: "SC",
    clienteLogoBg: "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30",
    categoria: "Implantação",
    categoriaBadge: "bg-sky-500/20 text-sky-300 border-sky-500/30",
    tipo: "unico",
    tipoRotulo: "Único",
    tipoBadge: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    valor: 12500,
    status: "recebido",
    statusRotulo: "Recebido",
    emissao: "02/10/2026",
    vencimento: "07/10/2026",
    contratoCodigo: "CT-2026-002",
    responsavel: "Marcos Gonçalves",
    recebimentos: [
      {
        id: "rc-3",
        data: "02/10/2026",
        valor: 12500,
        formaPagamento: "Transferência",
        status: "confirmado",
      },
    ],
    parcelas: [
      { numero: "01/01", vencimento: "07/10/2026", valor: 12500, status: "recebido" },
    ],
  },
  {
    id: "rec-4",
    data: "03/10/2026",
    descricao: "Consultoria estratégica",
    cliente: "Parelheiros Advocacia",
    clienteSegmento: "Jurídico Empresarial • São Paulo - SP",
    clienteLogoLetra: "A",
    clienteLogoBg: "bg-neutral-800 text-neutral-200 border border-white/20",
    categoria: "Consultoria",
    categoriaBadge: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    tipo: "unico",
    tipoRotulo: "Único",
    tipoBadge: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    valor: 8900,
    status: "pendente",
    statusRotulo: "Pendente",
    emissao: "10/10/2026",
    vencimento: "01/10/2026",
    contratoCodigo: "CT-2026-003",
    responsavel: "Marcos Gonçalves",
    recebimentos: [],
    parcelas: [
      { numero: "01/02", vencimento: "10/10/2026", valor: 8900, status: "pendente" },
    ],
  },
  {
    id: "rec-5",
    data: "05/10/2026",
    descricao: "Suporte técnico",
    cliente: "Dra. Julia Lins",
    clienteSegmento: "Medicina Integrada • Rio de Janeiro - RJ",
    clienteLogoLetra: "JL",
    clienteLogoBg: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
    categoria: "Suporte",
    categoriaBadge: "bg-teal-500/20 text-teal-300 border-teal-500/30",
    tipo: "recorrente",
    tipoRotulo: "Recorrente",
    tipoBadge: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    valor: 2400,
    status: "recebido",
    statusRotulo: "Recebido",
    emissao: "05/10/2026",
    vencimento: "05/10/2026",
    contratoCodigo: "CT-2026-004",
    responsavel: "Marcos Gonçalves",
    recebimentos: [
      {
        id: "rc-5",
        data: "05/10/2026",
        valor: 2400,
        formaPagamento: "PIX",
        status: "confirmado",
      },
    ],
    parcelas: [
      { numero: "01/12", vencimento: "05/10/2026", valor: 2400, status: "recebido" },
    ],
  },
  {
    id: "rec-6",
    data: "07/10/2026",
    descricao: "Treinamento equipe",
    cliente: "Costa Advocacia",
    clienteSegmento: "Direito Trabalhista • Belo Horizonte - MG",
    clienteLogoLetra: "CA",
    clienteLogoBg: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
    categoria: "Treinamento",
    categoriaBadge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    tipo: "unico",
    tipoRotulo: "Único",
    tipoBadge: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    valor: 3800,
    status: "pendente",
    statusRotulo: "Pendente",
    emissao: "15/10/2026",
    vencimento: "15/10/2026",
    contratoCodigo: "CT-2026-006",
    responsavel: "Marcos Gonçalves",
    recebimentos: [],
    parcelas: [
      { numero: "01/01", vencimento: "15/10/2026", valor: 3800, status: "pendente" },
    ],
  },
  {
    id: "rec-7",
    data: "10/10/2026",
    descricao: "Desenvolvimento site",
    cliente: "Heliosa Barbosa",
    clienteSegmento: "Moda & Estilo • Salvador - BA",
    clienteLogoLetra: "HB",
    clienteLogoBg: "bg-purple-500/20 text-purple-400 border border-purple-500/30",
    categoria: "Desenvolvimento",
    categoriaBadge: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30",
    tipo: "unico",
    tipoRotulo: "Único",
    tipoBadge: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    valor: 7800,
    status: "recebido",
    statusRotulo: "Recebido",
    emissao: "10/10/2026",
    vencimento: "10/10/2026",
    contratoCodigo: "CT-2026-007",
    responsavel: "Marcos Gonçalves",
    recebimentos: [
      {
        id: "rc-7",
        data: "10/10/2026",
        valor: 7800,
        formaPagamento: "PIX",
        status: "confirmado",
      },
    ],
    parcelas: [
      { numero: "01/02", vencimento: "10/10/2026", valor: 7800, status: "recebido" },
    ],
  },
  {
    id: "rec-8",
    data: "12/10/2026",
    descricao: "Licenças de software",
    cliente: "Microsoft",
    clienteSegmento: "Enterprise Software • Redmond - WA",
    clienteLogoLetra: "VK",
    clienteLogoBg: "bg-slate-700 text-slate-200 border border-white/10",
    categoria: "Ferramentas",
    categoriaBadge: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    tipo: "recorrente",
    tipoRotulo: "Recorrente",
    tipoBadge: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    valor: 1200,
    status: "recebido",
    statusRotulo: "Recebido",
    emissao: "12/10/2026",
    vencimento: "12/10/2026",
    contratoCodigo: "-",
    responsavel: "Marcos Gonçalves",
    recebimentos: [
      {
        id: "rc-8",
        data: "12/10/2026",
        valor: 1200,
        formaPagamento: "Cartão",
        status: "confirmado",
      },
    ],
    parcelas: [
      { numero: "01/01", vencimento: "12/10/2026", valor: 1200, status: "recebido" },
    ],
  },
  {
    id: "rec-9",
    data: "15/10/2026",
    descricao: "Produção de conteúdo",
    cliente: "Studio Caiobá",
    clienteSegmento: "Design e Arquitetura • Florianópolis - SC",
    clienteLogoLetra: "SC",
    clienteLogoBg: "bg-pink-500/20 text-pink-400 border border-pink-500/30",
    categoria: "Marketing",
    categoriaBadge: "bg-pink-500/20 text-pink-300 border-pink-500/30",
    tipo: "recorrente",
    tipoRotulo: "Recorrente",
    tipoBadge: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    valor: 2100,
    status: "em_atraso",
    statusRotulo: "Em atraso",
    emissao: "10/10/2026",
    vencimento: "10/10/2026",
    contratoCodigo: "CT-2026-008",
    responsavel: "Marcos Gonçalves",
    recebimentos: [],
    parcelas: [
      { numero: "01/06", vencimento: "10/10/2026", valor: 2100, status: "em_atraso" },
    ],
  },
  {
    id: "rec-10",
    data: "18/10/2026",
    descricao: "Consultoria mensal",
    cliente: "VK Odontologia",
    clienteSegmento: "Odontologia Estética • Curitiba - PR",
    clienteLogoLetra: "VK",
    clienteLogoBg: "bg-blue-600/20 text-blue-300 border border-blue-500/30",
    categoria: "Consultoria",
    categoriaBadge: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    tipo: "recorrente",
    tipoRotulo: "Recorrente",
    tipoBadge: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    valor: 3500,
    status: "pendente",
    statusRotulo: "Pendente",
    emissao: "18/10/2026",
    vencimento: "18/10/2026",
    contratoCodigo: "CT-2026-009",
    responsavel: "Marcos Gonçalves",
    recebimentos: [],
    parcelas: [
      { numero: "01/12", vencimento: "18/10/2026", valor: 3500, status: "pendente" },
    ],
  },
];
