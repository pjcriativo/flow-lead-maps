// Catálogo e Estruturas de Dados do Módulo Propostas Comerciais
// Fiel aos números, gráficos, tabelas e proporções do layout final aprovado.

export interface PropostaComercialItem {
  id: string;
  identificador: string; // Ex: '#PRP-2026-023'
  lead_id?: string;
  lead_nome: string;
  segmento: string; // Ex: 'Jurídico', 'Beleza e Estética', 'Saúde'
  assunto: string;
  valor: number;
  valorFormatado: string;
  status:
    | "rascunho"
    | "em_revisao"
    | "aprovada"
    | "enviada"
    | "visualizada"
    | "aceita"
    | "rejeitada"
    | "expirada";
  statusRotulo: string;
  data: string;
  responsavelNome: string;
  responsavelAvatar: string;
  origem: string;
  resumoComercial: string;
  validade: string;
  diasRestantes: number;
  servicos: {
    nome: string;
    descricao: string;
    valor: string;
  }[];
  historico: {
    data: string;
    hora: string;
    evento: string;
    usuario: string;
  }[];
  arquivos: {
    nome: string;
    tamanho: string;
    tipo: string;
  }[];
}

export const PROPOSTAS_CATALOGO_INICIAL: PropostaComercialItem[] = [
  {
    id: "prop_1",
    identificador: "#PRP-2026-024",
    lead_nome: "Barbearia Studio Calebe",
    segmento: "Beleza e Estética",
    assunto: "Implantação de Site Profissional",
    valor: 2500,
    valorFormatado: "R$ 2.500,00",
    status: "aprovada",
    statusRotulo: "Aprovada",
    data: "07/09/2026",
    responsavelNome: "Marcos",
    responsavelAvatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    origem: "Google Maps",
    resumoComercial:
      "Criação de site institucional de alta conversão integrado com agendamento online e catálogo de serviços da barbearia.",
    validade: "15/09/2026",
    diasRestantes: 22,
    servicos: [
      { nome: "Landing Page Premium", descricao: "Design exclusivo e responsivo", valor: "R$ 1.800,00" },
      { nome: "Sistema de Agendamento", descricao: "Integração direta com WhatsApp", valor: "R$ 700,00" },
    ],
    historico: [
      { data: "07/09/2026", hora: "14:20", evento: "Proposta aprovada pelo gestor", usuario: "Marcos" },
      { data: "07/09/2026", hora: "11:05", evento: "Proposta criada a partir do lead", usuario: "Marcos" },
    ],
    arquivos: [
      { nome: "Proposta_StudioCalebe_v1.pdf", tamanho: "1.4 MB", tipo: "PDF" },
    ],
  },
  {
    id: "prop_2",
    identificador: "#PRP-2026-023",
    lead_nome: "Escritório Parelheiros",
    segmento: "Jurídico",
    assunto: "Identidade Visual + Site Institucional",
    valor: 4800,
    valorFormatado: "R$ 4.800,00",
    status: "em_revisao",
    statusRotulo: "Em revisão",
    data: "23/07/2026",
    responsavelNome: "Marcos",
    responsavelAvatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    origem: "Site / Formulário",
    resumoComercial:
      "Desenvolvimento de identidade visual completa e site institucional para fortalecer a presença digital do escritório, com foco em captação de novos clientes.",
    validade: "30/08/2026",
    diasRestantes: 37,
    servicos: [
      { nome: "Identidade Visual Completa", descricao: "Logotipo, paleta e manual de marca", valor: "R$ 2.200,00" },
      { nome: "Site Institucional Multipage", descricao: "5 páginas com blog e SEO jurídico", valor: "R$ 2.600,00" },
      { nome: "Otimização de Carregamento", descricao: "Score 95+ no Google PageSpeed", valor: "Incluso" },
      { nome: "Formulários de Captação LGPD", descricao: "Adequação completa às normas", valor: "Incluso" },
    ],
    historico: [
      { data: "23/07/2026", hora: "16:45", evento: "Enviado para revisão interna", usuario: "Marcos" },
      { data: "23/07/2026", hora: "14:10", evento: "Valores ajustados e serviços adicionados", usuario: "Marcos" },
      { data: "23/07/2026", hora: "10:30", evento: "Proposta gerada via oportunidade", usuario: "Marcos" },
    ],
    arquivos: [
      { nome: "Proposta_Comercial_Parelheiros.pdf", tamanho: "2.1 MB", tipo: "PDF" },
      { nome: "Briefing_Identidade_Visual.pdf", tamanho: "850 KB", tipo: "PDF" },
    ],
  },
  {
    id: "prop_3",
    identificador: "#PRP-2026-022",
    lead_nome: "Pileggi Costa Advocacia",
    segmento: "Jurídico",
    assunto: "Site Institucional + SEO",
    valor: 3200,
    valorFormatado: "R$ 3.200,00",
    status: "enviada",
    statusRotulo: "Enviada",
    data: "18/07/2026",
    responsavelNome: "Camila",
    responsavelAvatar:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    origem: "LinkedIn",
    resumoComercial:
      "Reestruturação de portal jurídico com estratégia avançada de SEO local para captação de causas cíveis e tributárias.",
    validade: "18/08/2026",
    diasRestantes: 25,
    servicos: [
      { nome: "Desenvolvimento Web", descricao: "Portal institucional responsivo", valor: "R$ 2.400,00" },
      { nome: "Setup Inicial de SEO", descricao: "Palavras-chave jurídicas e Google Meu Negócio", valor: "R$ 800,00" },
    ],
    historico: [
      { data: "18/07/2026", hora: "15:30", evento: "Proposta enviada por e-mail", usuario: "Camila" },
      { data: "18/07/2026", hora: "11:15", evento: "Aprovada para envio", usuario: "Camila" },
    ],
    arquivos: [
      { nome: "Proposta_PileggiCosta.pdf", tamanho: "1.8 MB", tipo: "PDF" },
    ],
  },
  {
    id: "prop_4",
    identificador: "#PRP-2026-021",
    lead_nome: "Dra. Julia Lins | Odontologia",
    segmento: "Saúde",
    assunto: "Site + Gestão de Redes Sociais",
    valor: 2950,
    valorFormatado: "R$ 2.950,00",
    status: "aprovada",
    statusRotulo: "Aprovada",
    data: "17/07/2026",
    responsavelNome: "Marcos",
    responsavelAvatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    origem: "Instagram",
    resumoComercial:
      "Landing page odontológica com botão de WhatsApp direto e 3 meses de acompanhamento de mídias para atração de implantes e estética dental.",
    validade: "17/08/2026",
    diasRestantes: 24,
    servicos: [
      { nome: "Landing Page Odonto", descricao: "Design limpo e focado em estética", valor: "R$ 1.950,00" },
      { nome: "Gestão Inicial de Redes", descricao: "12 posts estratégicos", valor: "R$ 1.000,00" },
    ],
    historico: [
      { data: "17/07/2026", hora: "17:00", evento: "Aprovada pelo responsável", usuario: "Marcos" },
    ],
    arquivos: [
      { nome: "Proposta_JuliaLins_Odonto.pdf", tamanho: "1.6 MB", tipo: "PDF" },
    ],
  },
  {
    id: "prop_5",
    identificador: "#PRP-2026-020",
    lead_nome: "Dr. Conrad Marcel",
    segmento: "Saúde",
    assunto: "Landing Page + Tráfego Pago",
    valor: 1850,
    valorFormatado: "R$ 1.850,00",
    status: "enviada",
    statusRotulo: "Enviada",
    data: "17/07/2026",
    responsavelNome: "João",
    responsavelAvatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    origem: "WhatsApp",
    resumoComercial:
      "Landing page médica focada em consultas particulares com integração direta ao prontuário e Google Ads.",
    validade: "17/08/2026",
    diasRestantes: 24,
    servicos: [
      { nome: "Landing Page Médica", descricao: "Conformidade CFM", valor: "R$ 1.850,00" },
    ],
    historico: [
      { data: "17/07/2026", hora: "14:50", evento: "Disparo realizado para o WhatsApp", usuario: "João" },
    ],
    arquivos: [
      { nome: "Proposta_DrConrad_Marcel.pdf", tamanho: "1.2 MB", tipo: "PDF" },
    ],
  },
  {
    id: "prop_6",
    identificador: "#PRP-2026-019",
    lead_nome: "VK Odontologia",
    segmento: "Saúde",
    assunto: "Site Institucional",
    valor: 2400,
    valorFormatado: "R$ 2.400,00",
    status: "rascunho",
    statusRotulo: "Rascunho",
    data: "17/07/2026",
    responsavelNome: "Camila",
    responsavelAvatar:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    origem: "Google Maps",
    resumoComercial:
      "Site institucional com catálogo de tratamentos, apresentação do corpo clínico e integração com convênios.",
    validade: "17/08/2026",
    diasRestantes: 24,
    servicos: [
      { nome: "Site Clínico", descricao: "6 páginas informativas", valor: "R$ 2.400,00" },
    ],
    historico: [
      { data: "17/07/2026", hora: "11:20", evento: "Rascunho criado", usuario: "Camila" },
    ],
    arquivos: [],
  },
  {
    id: "prop_7",
    identificador: "#PRP-2026-018",
    lead_nome: "Clínica COST Odontologia",
    segmento: "Saúde",
    assunto: "Proposta de Marketing Digital",
    valor: 3600,
    valorFormatado: "R$ 3.600,00",
    status: "aprovada",
    statusRotulo: "Aprovada",
    data: "17/07/2026",
    responsavelNome: "João",
    responsavelAvatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    origem: "Indicação",
    resumoComercial:
      "Planejamento de captação digital e renovação do portal institucional para ortodontia e harmonização facial.",
    validade: "17/08/2026",
    diasRestantes: 24,
    servicos: [
      { nome: "Consultoria & Portal", descricao: "Redesign completo", valor: "R$ 3.600,00" },
    ],
    historico: [
      { data: "17/07/2026", hora: "10:05", evento: "Proposta aprovada", usuario: "João" },
    ],
    arquivos: [
      { nome: "Proposta_ClinicaCOST.pdf", tamanho: "2.0 MB", tipo: "PDF" },
    ],
  },
  {
    id: "prop_8",
    identificador: "#PRP-2026-017",
    lead_nome: "Dourados Odontologia",
    segmento: "Saúde",
    assunto: "Site + SEO Local",
    valor: 2100,
    valorFormatado: "R$ 2.100,00",
    status: "rascunho",
    statusRotulo: "Rascunho",
    data: "17/07/2026",
    responsavelNome: "Marcos",
    responsavelAvatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    origem: "Google Maps",
    resumoComercial:
      "Site leve e otimizado com cadastro de serviços para impulsionamento orgânico na região central de Dourados.",
    validade: "17/08/2026",
    diasRestantes: 24,
    servicos: [
      { nome: "Site Básico + SEO", descricao: "Página rápida e indexada", valor: "R$ 2.100,00" },
    ],
    historico: [
      { data: "17/07/2026", hora: "09:30", evento: "Rascunho inicial criado", usuario: "Marcos" },
    ],
    arquivos: [],
  },
];

// Dados dos Indicadores Comerciais Superiores (Fiel à Imagem)
export interface IndicadorPropostas {
  id: string;
  nome: string;
  valor: string;
  subtexto?: string;
  variacao?: string;
  tipoVariacao?: "positivo" | "negativo";
  iconeNome:
    | "FileText"
    | "File"
    | "CheckCircle2"
    | "Send"
    | "Target"
    | "DollarSign";
  bgIcone: string;
  bordaIcone: string;
  corIcone: string;
}

export const INDICADORES_PROPOSTAS_PADRAO: IndicadorPropostas[] = [
  {
    id: "total_propostas",
    nome: "Total de propostas",
    valor: "29",
    variacao: "+12%",
    tipoVariacao: "positivo",
    subtexto: "vs. mês anterior",
    iconeNome: "FileText",
    bgIcone: "bg-white/10",
    bordaIcone: "border-white/15",
    corIcone: "text-white",
  },
  {
    id: "rascunhos",
    nome: "Rascunhos",
    valor: "8",
    subtexto: "28%",
    iconeNome: "File",
    bgIcone: "bg-white/5",
    bordaIcone: "border-white/10",
    corIcone: "text-neutral-400",
  },
  {
    id: "aprovadas",
    nome: "Aprovadas",
    valor: "13",
    subtexto: "45%",
    iconeNome: "CheckCircle2",
    bgIcone: "bg-amber-500/15",
    bordaIcone: "border-amber-500/25",
    corIcone: "text-amber-400",
  },
  {
    id: "enviadas",
    nome: "Enviadas",
    valor: "6",
    subtexto: "21%",
    iconeNome: "Send",
    bgIcone: "bg-blue-500/15",
    bordaIcone: "border-blue-500/25",
    corIcone: "text-blue-400",
  },
  {
    id: "taxa_aceite",
    nome: "Taxa de aceite",
    valor: "72%",
    variacao: "+18%",
    tipoVariacao: "positivo",
    subtexto: "vs. mês anterior",
    iconeNome: "CheckCircle2",
    bgIcone: "bg-emerald-500/15",
    bordaIcone: "border-emerald-500/25",
    corIcone: "text-emerald-400",
  },
  {
    id: "valor_negociacao",
    nome: "Valor em negociação",
    valor: "R$ 48.750",
    variacao: "+27%",
    tipoVariacao: "positivo",
    subtexto: "em 9 propostas",
    iconeNome: "DollarSign",
    bgIcone: "bg-purple-500/15",
    bordaIcone: "border-purple-500/25",
    corIcone: "text-purple-400",
  },
];

// Dados dos 3 Gráficos Inferiores
export interface EtapaFunilPropostas {
  nome: string;
  quantidade: number;
  percentual: number;
  corBg: string;
  corTexto: string;
}

export const FUNIL_PROPOSTAS_PADRAO: EtapaFunilPropostas[] = [
  { nome: "Total", quantidade: 29, percentual: 100, corBg: "bg-[#f97316]", corTexto: "text-white" },
  { nome: "Rascunhos", quantidade: 8, percentual: 28, corBg: "bg-[#181e2b]", corTexto: "text-neutral-300" },
  { nome: "Enviadas", quantidade: 6, percentual: 21, corBg: "bg-[#2563eb]", corTexto: "text-white" },
  { nome: "Aprovadas", quantidade: 13, percentual: 45, corBg: "bg-[#10b981]", corTexto: "text-white" },
  { nome: "Aceitas", quantidade: 9, percentual: 72, corBg: "bg-[#06b6d4]", corTexto: "text-white" },
];

export interface EvolucaoMes {
  mes: string;
  quantidade: number;
}

export const EVOLUCAO_PROPOSTAS_PADRAO: EvolucaoMes[] = [
  { mes: "Jan", quantidade: 2 },
  { mes: "Fev", quantidade: 4 },
  { mes: "Mar", quantidade: 3 },
  { mes: "Abr", quantidade: 2 },
  { mes: "Mai", quantidade: 4 },
  { mes: "Jun", quantidade: 4 },
  { mes: "Jul", quantidade: 7 },
];

export interface OrigemProposta {
  origem: string;
  percentual: number;
  cor: string;
  fillHex: string;
}

export const ORIGENS_PROPOSTAS_PADRAO: OrigemProposta[] = [
  { origem: "Site / Formulário", percentual: 38, cor: "text-amber-400", fillHex: "#f59e0b" },
  { origem: "WhatsApp", percentual: 24, cor: "text-cyan-400", fillHex: "#06b6d4" },
  { origem: "Google Maps", percentual: 17, cor: "text-blue-400", fillHex: "#3b82f6" },
  { origem: "Indicação", percentual: 14, cor: "text-purple-400", fillHex: "#a855f7" },
  { origem: "Instagram", percentual: 7, cor: "text-pink-400", fillHex: "#ec4899" },
];

// Sugestões da IA do painel lateral
export interface SugestaoIaProposta {
  id: string;
  titulo: string;
  descricao: string;
  iconeNome: "Sparkles" | "Users" | "CheckCircle2";
}

export const SUGESTOES_IA_PADRAO: SugestaoIaProposta[] = [
  {
    id: "sug_1",
    titulo: "Melhorar copy da introdução",
    descricao: "Deixe a proposta mais persuasiva e focada em resultados.",
    iconeNome: "Sparkles",
  },
  {
    id: "sug_2",
    titulo: "Incluir prova social",
    descricao: "Adicione cases ou depoimentos de clientes semelhantes.",
    iconeNome: "Users",
  },
  {
    id: "sug_3",
    titulo: "Destacar ROI",
    descricao: "Mostre o retorno sobre o investimento de forma clara.",
    iconeNome: "CheckCircle2",
  },
];
