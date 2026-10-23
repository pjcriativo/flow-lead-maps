// Catálogo de Contratos Comerciais (Gestão → Contratos)
// Fiel aos números, gráficos, tabelas e proporções do layout final aprovado.

export interface ContratoItem {
  id: string;
  identificador: string; // Ex: 'CT-2026-001'
  empresa: string;
  empresaIniciais: string;
  avatarBg: string;
  segmento: string;
  localizacao: string;
  tipo: "Serviços mensais" | "Implantação" | "Consultoria" | "Suporte" | "Outros";
  valorMensal: number;
  valorMensalFormatado: string;
  valorTotal: number;
  valorTotalFormatado: string;
  status: "ativo" | "em_assinatura" | "vencendo" | "renovado" | "cancelado" | "vencido" | "rascunho";
  statusRotulo: string;
  dataAssinatura: string;
  dataInicio: string;
  dataVencimento: string;
  vencendoAlerta?: boolean;
  responsavelNome: string;
  responsavelCompleto: string;
  responsavelAvatar: string;
  documentos: {
    nome: string;
    tipo: string;
    tamanho: string;
    data: string;
  }[];
  servicos: {
    nome: string;
    valor: string;
  }[];
  faturamento: {
    ciclo: string;
    diaVencimento: number;
    metodo: string;
    status: string;
  };
  historico: {
    data: string;
    evento: string;
  }[];
  observacoes?: string;
}

export const CONTRATOS_CATALOGO_INICIAL: ContratoItem[] = [
  {
    id: "ct_1",
    identificador: "CT-2026-001",
    empresa: "Clinica Sorriso Mais",
    empresaIniciais: "CS",
    avatarBg: "bg-red-500/20 text-red-400 border border-red-500/30",
    segmento: "Odontologia",
    localizacao: "Curitiba - PR",
    tipo: "Serviços mensais",
    valorMensal: 4900,
    valorMensalFormatado: "R$ 4.900,00",
    valorTotal: 58800,
    valorTotalFormatado: "R$ 58.800,00",
    status: "ativo",
    statusRotulo: "Ativo",
    dataAssinatura: "01/10/2026",
    dataInicio: "01/10/2026",
    dataVencimento: "01/10/2027",
    responsavelNome: "Marcos",
    responsavelCompleto: "Marcos Gonçalves",
    responsavelAvatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    documentos: [
      { nome: "Contrato assinado.pdf", tipo: "PDF", tamanho: "2.4 MB", data: "01/10/2026" },
      { nome: "Termos e condições.pdf", tipo: "PDF", tamanho: "1.1 MB", data: "01/10/2026" },
      { nome: "Proposta comercial.pdf", tipo: "PDF", tamanho: "1.8 MB", data: "28/09/2026" },
    ],
    servicos: [
      { nome: "Gestão de Tráfego e Mídia Paga", valor: "R$ 2.400,00 / mês" },
      { nome: "Automação Comercial WhatsApp", valor: "R$ 1.500,00 / mês" },
      { nome: "Suporte e Treinamento Contínuo", valor: "R$ 1.000,00 / mês" },
    ],
    faturamento: {
      ciclo: "Mensal recorrente",
      diaVencimento: 10,
      metodo: "Boleto bancário / Pix",
      status: "Em dia",
    },
    historico: [
      { data: "01/10/2026 às 14:00", evento: "Contrato assinado digitalmente pelas partes" },
      { data: "30/09/2026 às 11:20", evento: "Minuta aprovada pelo departamento jurídico" },
      { data: "28/09/2026 às 16:45", evento: "Contrato gerado a partir da Proposta #PRP-001" },
    ],
    observacoes: "Contrato anual com renovação tácita automática caso não haja aviso prévio de 30 dias.",
  },
  {
    id: "ct_2",
    identificador: "CT-2026-002",
    empresa: "Studio Caiobá",
    empresaIniciais: "SC",
    avatarBg: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
    segmento: "Barbearia",
    localizacao: "Matinhos - PR",
    tipo: "Implantação",
    valorMensal: 0,
    valorMensalFormatado: "R$ 12.500,00",
    valorTotal: 12500,
    valorTotalFormatado: "R$ 12.500,00",
    status: "em_assinatura",
    statusRotulo: "Em assinatura",
    dataAssinatura: "--",
    dataInicio: "06/10/2026",
    dataVencimento: "--",
    responsavelNome: "Ana",
    responsavelCompleto: "Ana Costa",
    responsavelAvatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    documentos: [
      { nome: "Minuta_StudioCaioba_v1.pdf", tipo: "PDF", tamanho: "1.4 MB", data: "06/10/2026" },
    ],
    servicos: [
      { nome: "Implantação de Totem e Sistema de Agendamento", valor: "R$ 12.500,00" },
    ],
    faturamento: {
      ciclo: "Parcelado em 3x",
      diaVencimento: 15,
      metodo: "Cartão de Crédito",
      status: "Aguardando assinatura",
    },
    historico: [
      { data: "06/10/2026 às 16:40", evento: "Minuta enviada para assinatura via ZapSign" },
      { data: "06/10/2026 às 14:10", evento: "Rascunho gerado pela equipe comercial" },
    ],
    observacoes: "Aguardando assinatura do sócio-administrador.",
  },
  {
    id: "ct_3",
    identificador: "CT-2026-003",
    empresa: "Parelheiros Advocacia",
    empresaIniciais: "PA",
    avatarBg: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
    segmento: "Escritório Jurídico",
    localizacao: "São Paulo - SP",
    tipo: "Consultoria",
    valorMensal: 8900,
    valorMensalFormatado: "R$ 8.900,00",
    valorTotal: 26700,
    valorTotalFormatado: "R$ 26.700,00",
    status: "vencendo",
    statusRotulo: "Vencendo",
    dataAssinatura: "01/10/2025",
    dataInicio: "01/10/2025",
    dataVencimento: "01/11/2025",
    vencendoAlerta: true,
    responsavelNome: "Carlos",
    responsavelCompleto: "Carlos Mendes",
    responsavelAvatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    documentos: [
      { nome: "Contrato_ParelheirosAdv.pdf", tipo: "PDF", tamanho: "3.1 MB", data: "01/10/2025" },
      { nome: "Aditivo_Escopo_2026.pdf", tipo: "PDF", tamanho: "850 KB", data: "15/03/2026" },
    ],
    servicos: [
      { nome: "Consultoria de Captação e Estruturação de Funil", valor: "R$ 8.900,00 / mês" },
    ],
    faturamento: {
      ciclo: "Mensal",
      diaVencimento: 5,
      metodo: "Boleto bancário",
      status: "Em dia",
    },
    historico: [
      { data: "10/10/2026 às 09:30", evento: "Alerta de renovação em 30 dias disparado" },
      { data: "01/10/2025 às 10:00", evento: "Contrato assinado" },
    ],
    observacoes: "Contrato próximo ao fim da vigência. Programar proposta de renovação.",
  },
  {
    id: "ct_4",
    identificador: "CT-2026-004",
    empresa: "Costa Advocacia",
    empresaIniciais: "CA",
    avatarBg: "bg-sky-500/20 text-sky-400 border border-sky-500/30",
    segmento: "Advocacia",
    localizacao: "Curitiba - PR",
    tipo: "Serviços mensais",
    valorMensal: 3800,
    valorMensalFormatado: "R$ 3.800,00",
    valorTotal: 45600,
    valorTotalFormatado: "R$ 45.600,00",
    status: "ativo",
    statusRotulo: "Ativo",
    dataAssinatura: "15/09/2026",
    dataInicio: "15/09/2026",
    dataVencimento: "15/09/2027",
    responsavelNome: "Juliana",
    responsavelCompleto: "Juliana Souza",
    responsavelAvatar:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    documentos: [
      { nome: "Contrato_CostaAdvocacia.pdf", tipo: "PDF", tamanho: "1.9 MB", data: "15/09/2026" },
    ],
    servicos: [
      { nome: "Gestão de Presença Digital e Google Ads", valor: "R$ 3.800,00 / mês" },
    ],
    faturamento: {
      ciclo: "Mensal",
      diaVencimento: 20,
      metodo: "Pix automático",
      status: "Em dia",
    },
    historico: [{ data: "15/09/2026 às 11:00", evento: "Contrato assinado digitalmente" }],
    observacoes: "Cliente solicitou relatórios quinzenais de desempenho.",
  },
  {
    id: "ct_5",
    identificador: "CT-2026-005",
    empresa: "Dra. Julia Lins",
    empresaIniciais: "JL",
    avatarBg: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
    segmento: "Odontologia",
    localizacao: "Florianópolis - SC",
    tipo: "Suporte",
    valorMensal: 2400,
    valorMensalFormatado: "R$ 2.400,00",
    valorTotal: 28800,
    valorTotalFormatado: "R$ 28.800,00",
    status: "ativo",
    statusRotulo: "Ativo",
    dataAssinatura: "10/09/2026",
    dataInicio: "10/09/2026",
    dataVencimento: "10/09/2027",
    responsavelNome: "Marcos",
    responsavelCompleto: "Marcos Gonçalves",
    responsavelAvatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    documentos: [
      { nome: "Contrato_Suporte_DraJulia.pdf", tipo: "PDF", tamanho: "1.7 MB", data: "10/09/2026" },
    ],
    servicos: [
      { nome: "SLA de Suporte Prioritário e Manutenção", valor: "R$ 2.400,00 / mês" },
    ],
    faturamento: {
      ciclo: "Mensal",
      diaVencimento: 10,
      metodo: "Boleto bancário",
      status: "Em dia",
    },
    historico: [{ data: "10/09/2026 às 15:30", evento: "Assinatura confirmada" }],
    observacoes: "Inclui 10 horas mensais de atendimento dedicado.",
  },
  {
    id: "ct_6",
    identificador: "CT-2026-006",
    empresa: "Conrad Marcel",
    empresaIniciais: "CM",
    avatarBg: "bg-red-500/20 text-red-400 border border-red-500/30",
    segmento: "Consultório Odontológico",
    localizacao: "São Paulo - SP",
    tipo: "Implantação",
    valorMensal: 0,
    valorMensalFormatado: "R$ 15.600,00",
    valorTotal: 15600,
    valorTotalFormatado: "R$ 15.600,00",
    status: "em_assinatura",
    statusRotulo: "Em assinatura",
    dataAssinatura: "--",
    dataInicio: "08/09/2026",
    dataVencimento: "--",
    responsavelNome: "Ana",
    responsavelCompleto: "Ana Costa",
    responsavelAvatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    documentos: [
      { nome: "Minuta_ConradMarcel.pdf", tipo: "PDF", tamanho: "2.1 MB", data: "08/09/2026" },
    ],
    servicos: [
      { nome: "Setup Completo de CRM e Agendamento", valor: "R$ 15.600,00" },
    ],
    faturamento: {
      ciclo: "Entrada + 2 parcelas",
      diaVencimento: 25,
      metodo: "Boleto bancário",
      status: "Pendente assinatura",
    },
    historico: [{ data: "08/09/2026 às 14:00", evento: "Enviado link para assinatura" }],
    observacoes: "Em validação com o departamento financeiro do cliente.",
  },
  {
    id: "ct_7",
    identificador: "CT-2026-007",
    empresa: "VK Odontologia",
    empresaIniciais: "VK",
    avatarBg: "bg-purple-500/20 text-purple-400 border border-purple-500/30",
    segmento: "Odontologia",
    localizacao: "Belo Horizonte - MG",
    tipo: "Serviços mensais",
    valorMensal: 5900,
    valorMensalFormatado: "R$ 5.900,00",
    valorTotal: 70800,
    valorTotalFormatado: "R$ 70.800,00",
    status: "renovado",
    statusRotulo: "Renovado",
    dataAssinatura: "20/08/2026",
    dataInicio: "20/08/2026",
    dataVencimento: "20/08/2027",
    responsavelNome: "Carlos",
    responsavelCompleto: "Carlos Mendes",
    responsavelAvatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    documentos: [
      { nome: "Termo_Renovacao_VKOdonto.pdf", tipo: "PDF", tamanho: "2.6 MB", data: "20/08/2026" },
    ],
    servicos: [
      { nome: "Plano Growth com Tráfego e Redes Sociais", valor: "R$ 5.900,00 / mês" },
    ],
    faturamento: {
      ciclo: "Mensal",
      diaVencimento: 10,
      metodo: "Boleto bancário",
      status: "Em dia",
    },
    historico: [{ data: "20/08/2026 às 16:10", evento: "Renovação anual confirmada" }],
    observacoes: "Segundo ano consecutivo de parceria comercial.",
  },
  {
    id: "ct_8",
    identificador: "CT-2026-008",
    empresa: "Heloisa Barbosa",
    empresaIniciais: "HB",
    avatarBg: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
    segmento: "Consultório Odontológico",
    localizacao: "Rio de Janeiro - RJ",
    tipo: "Consultoria",
    valorMensal: 7800,
    valorMensalFormatado: "R$ 7.800,00",
    valorTotal: 23400,
    valorTotalFormatado: "R$ 23.400,00",
    status: "ativo",
    statusRotulo: "Ativo",
    dataAssinatura: "12/07/2026",
    dataInicio: "12/07/2026",
    dataVencimento: "12/07/2027",
    responsavelNome: "Juliana",
    responsavelCompleto: "Juliana Souza",
    responsavelAvatar:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    documentos: [
      { nome: "Contrato_HeloisaBarbosa.pdf", tipo: "PDF", tamanho: "1.5 MB", data: "12/07/2026" },
    ],
    servicos: [{ nome: "Consultoria de Expansão de Unidades", valor: "R$ 7.800,00 / mês" }],
    faturamento: {
      ciclo: "Mensal",
      diaVencimento: 15,
      metodo: "Pix automático",
      status: "Em dia",
    },
    historico: [{ data: "12/07/2026 às 10:20", evento: "Assinatura realizada" }],
    observacoes: "Encontros estratégicos quinzenais com sócios.",
  },
  {
    id: "ct_9",
    identificador: "CT-2026-009",
    empresa: "Clínica COST",
    empresaIniciais: "CC",
    avatarBg: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
    segmento: "Odontologia",
    localizacao: "Porto Alegre - RS",
    tipo: "Serviços mensais",
    valorMensal: 4200,
    valorMensalFormatado: "R$ 4.200,00",
    valorTotal: 50400,
    valorTotalFormatado: "R$ 50.400,00",
    status: "ativo",
    statusRotulo: "Ativo",
    dataAssinatura: "05/06/2026",
    dataInicio: "05/06/2026",
    dataVencimento: "05/06/2027",
    responsavelNome: "Marcos",
    responsavelCompleto: "Marcos Gonçalves",
    responsavelAvatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    documentos: [
      { nome: "Contrato_ClinicaCOST.pdf", tipo: "PDF", tamanho: "2.3 MB", data: "05/06/2026" },
    ],
    servicos: [{ nome: "Gestão de Captação e Redes Sociais", valor: "R$ 4.200,00 / mês" }],
    faturamento: {
      ciclo: "Mensal",
      diaVencimento: 5,
      metodo: "Boleto bancário",
      status: "Em dia",
    },
    historico: [{ data: "05/06/2026 às 09:00", evento: "Contrato assinado" }],
    observacoes: "Foco principal em alinhadores invisíveis e estética dental.",
  },
  {
    id: "ct_10",
    identificador: "CT-2026-010",
    empresa: "Dourados Odontologia",
    empresaIniciais: "DO",
    avatarBg: "bg-slate-500/20 text-slate-400 border border-slate-500/30",
    segmento: "Odontologia",
    localizacao: "Dourados - MS",
    tipo: "Implantação",
    valorMensal: 0,
    valorMensalFormatado: "R$ 18.900,00",
    valorTotal: 18900,
    valorTotalFormatado: "R$ 18.900,00",
    status: "vencido",
    statusRotulo: "Vencido",
    dataAssinatura: "01/05/2026",
    dataInicio: "01/05/2026",
    dataVencimento: "01/05/2027",
    responsavelNome: "Ana",
    responsavelCompleto: "Ana Costa",
    responsavelAvatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    documentos: [
      { nome: "Contrato_DouradosOdonto.pdf", tipo: "PDF", tamanho: "1.8 MB", data: "01/05/2026" },
    ],
    servicos: [{ nome: "Desenvolvimento de Portal Clínico e CRM", valor: "R$ 18.900,00" }],
    faturamento: {
      ciclo: "Pagamento único concluído",
      diaVencimento: 1,
      metodo: "Pix",
      status: "Concluído",
    },
    historico: [{ data: "01/05/2026 às 11:30", evento: "Entrega e encerramento de vigência" }],
    observacoes: "Projeto concluído com sucesso.",
  },
];
