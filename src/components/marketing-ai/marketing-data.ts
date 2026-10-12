export type ProductStatus =
  | "ativo"
  | "em_analise"
  | "rascunho"
  | "pausado"
  | "arquivado"
  | "erro";

export type ProductCategory =
  | "Restaurante"
  | "Hotelaria"
  | "Saúde e Bem-estar"
  | "Imóveis"
  | "Consultoria"
  | "Beleza e Estética"
  | "Infoproduto"
  | "Software"
  | "Serviços Gerais";

export interface ProductItem {
  id: string;
  name: string;
  description: string;
  category: ProductCategory | string;
  type: "digital" | "fisico" | "servico";
  status: ProductStatus;
  imageUrl: string;
  salesPageUrl?: string;
  price?: number;
  currency?: string;
  targetAudience?: string;
  mainBenefits?: string;
  differentials?: string;
  commercialGoal?: string;
  metrics: {
    leads: number;
    proposals: number;
    sales: number;
  };
  primaryActionLabel: string;
  createdAt: string;
  updatedAt: string;
}

export interface MarketingKpiItem {
  id: string;
  label: string;
  value: string;
  change: string;
  trend: "up" | "down";
  color: "orange" | "purple" | "blue" | "teal" | "amber" | "rose";
  bars: number[];
}

export interface MarketingInsightItem {
  id: string;
  type: "opportunity" | "improvement" | "niche";
  badgeLabel: string;
  badgeColor: "green" | "blue" | "purple";
  description: string;
}

// 6 Indicadores Superiores Aprovados na Referência
export const MARKETING_KPIS: MarketingKpiItem[] = [
  {
    id: "produtos",
    label: "Produtos cadastrados",
    value: "8",
    change: "33%",
    trend: "up",
    color: "orange",
    bars: [30, 45, 55, 40, 70, 85, 95, 100],
  },
  {
    id: "campanhas",
    label: "Campanhas geradas",
    value: "12",
    change: "50%",
    trend: "up",
    color: "purple",
    bars: [25, 40, 50, 65, 75, 80, 90, 100],
  },
  {
    id: "leads",
    label: "Leads gerados",
    value: "486",
    change: "42%",
    trend: "up",
    color: "blue",
    bars: [35, 50, 60, 55, 75, 85, 95, 100],
  },
  {
    id: "propostas",
    label: "Propostas enviadas",
    value: "145",
    change: "28%",
    trend: "up",
    color: "teal",
    bars: [30, 45, 50, 60, 70, 80, 85, 95],
  },
  {
    id: "vendas",
    label: "Vendas realizadas",
    value: "18",
    change: "38%",
    trend: "up",
    color: "amber",
    bars: [20, 35, 45, 55, 65, 75, 85, 100],
  },
  {
    id: "receita",
    label: "Receita atribuída",
    value: "R$ 24.580",
    change: "61%",
    trend: "up",
    color: "rose",
    bars: [30, 45, 60, 70, 80, 85, 90, 100],
  },
];

// 6 Produtos Cadastrados Aprovados na Referência Visual
export const INITIAL_PRODUCTS: ProductItem[] = [
  {
    id: "prod-1",
    name: "Experiência Gastronômica Premium",
    description: "Menu degustação com ingredientes selecionados e ambiente exclusivo.",
    category: "Restaurante",
    type: "servico",
    status: "ativo",
    imageUrl:
      "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80",
    salesPageUrl: "https://restaurante-degustacao.flowgenius.com.br",
    price: 380,
    currency: "BRL",
    targetAudience: "Casais, amantes da alta gastronomia e comemorações exclusivas.",
    mainBenefits: "Menu autoral em 7 etapas harmonizado por sommeliers experientes.",
    differentials: "Atendimento restrito a 24 lugares por noite com vista panorâmica.",
    commercialGoal: "Aumentar reservas nas noites de quarta e quinta-feira.",
    metrics: {
      leads: 245,
      proposals: 32,
      sales: 8,
    },
    primaryActionLabel: "Criar campanha",
    createdAt: "2024-07-15T10:00:00Z",
    updatedAt: "2024-08-10T14:30:00Z",
  },
  {
    id: "prod-2",
    name: "Hospedagem Boutique",
    description: "Suítes temáticas com vista para o mar e serviço personalizado.",
    category: "Hotelaria",
    type: "servico",
    status: "ativo",
    imageUrl:
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop&q=80",
    salesPageUrl: "https://pousada-boutique.flowgenius.com.br",
    price: 1250,
    currency: "BRL",
    targetAudience: "Hóspedes que buscam refúgio sofisticado e descanso privativo.",
    mainBenefits: "Café da manhã artesanal servido no quarto e acesso exclusivo à praia.",
    differentials: "Design minimalista, roupas de cama em algodão egípcio e menu de travesseiros.",
    commercialGoal: "Ocupação média de 85% durante a baixa temporada.",
    metrics: {
      leads: 180,
      proposals: 28,
      sales: 6,
    },
    primaryActionLabel: "Criar campanha",
    createdAt: "2024-07-20T11:00:00Z",
    updatedAt: "2024-08-12T09:15:00Z",
  },
  {
    id: "prod-3",
    name: "Plano Fitness Premium",
    description: "Treinamento personalizado com acompanhamento profissional.",
    category: "Saúde e Bem-estar",
    type: "servico",
    status: "em_analise",
    imageUrl:
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80",
    salesPageUrl: "https://fitness-premium.flowgenius.com.br",
    price: 490,
    currency: "BRL",
    targetAudience: "Profissionais liberais e executivos focados em longevidade e performance.",
    mainBenefits: "Bioimpedância mensal, treino individualizado e suporte nutricional.",
    differentials: "Equipamentos biomecânicos de última geração e vestiários de alto padrão.",
    commercialGoal: "Matrícula de 50 novos membros trimestrais.",
    metrics: {
      leads: 98,
      proposals: 12,
      sales: 0,
    },
    primaryActionLabel: "Ver análise",
    createdAt: "2024-07-28T16:00:00Z",
    updatedAt: "2024-08-15T11:45:00Z",
  },
  {
    id: "prod-4",
    name: "Consultoria Imobiliária",
    description: "Assessoria completa para compra, venda e locação de imóveis de alto padrão.",
    category: "Imóveis",
    type: "servico",
    status: "ativo",
    imageUrl:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80",
    salesPageUrl: "https://imoveis-luxo.flowgenius.com.br",
    price: 25000,
    currency: "BRL",
    targetAudience: "Investidores e famílias buscando mansões e coberturas exclusivas.",
    mainBenefits: "Curadoria jurídica completa, avaliação precisa de patrimônio e discrição.",
    differentials: "Portfólio off-market não divulgado em portais convencionais.",
    commercialGoal: "Captação de 15 novas propriedades exclusivas no trimestre.",
    metrics: {
      leads: 120,
      proposals: 18,
      sales: 4,
    },
    primaryActionLabel: "Criar campanha",
    createdAt: "2024-06-10T14:00:00Z",
    updatedAt: "2024-08-01T17:20:00Z",
  },
  {
    id: "prod-5",
    name: "Consultoria Empresarial",
    description: "Estratégia e gestão para crescimento do seu negócio.",
    category: "Consultoria",
    type: "servico",
    status: "rascunho",
    imageUrl:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80",
    salesPageUrl: "",
    price: 8500,
    currency: "BRL",
    targetAudience: "PMEs faturando entre 500k e 5M anuais buscando escala operacional.",
    mainBenefits: "Reestruturação de processos comerciais, funil e planejamento de caixa.",
    differentials: "Metodologia prática com implantação guiada por consultores sêniores.",
    commercialGoal: "Geração de 10 diagnósticos estratégicos mensais.",
    metrics: {
      leads: 64,
      proposals: 8,
      sales: 0,
    },
    primaryActionLabel: "Continuar",
    createdAt: "2024-08-05T09:00:00Z",
    updatedAt: "2024-08-18T13:10:00Z",
  },
  {
    id: "prod-6",
    name: "Tratamento Estético Avançado",
    description: "Protocolos personalizados com tecnologia de ponta.",
    category: "Beleza e Estética",
    type: "servico",
    status: "pausado",
    imageUrl:
      "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&auto=format&fit=crop&q=80",
    salesPageUrl: "https://estetica-avancada.flowgenius.com.br",
    price: 1800,
    currency: "BRL",
    targetAudience: "Mulheres e homens buscando rejuvenescimento facial seguro e não invasivo.",
    mainBenefits: "Estímulo de colágeno, harmonização sutil e melhora da textura da pele.",
    differentials: "Aparelhos certificados pela Anvisa com aplicação por biomédicos estetas.",
    commercialGoal: "Venda de 30 pacotes de bioestimulador por mês.",
    metrics: {
      leads: 76,
      proposals: 10,
      sales: 2,
    },
    primaryActionLabel: "Reativar",
    createdAt: "2024-05-18T15:00:00Z",
    updatedAt: "2024-07-25T18:00:00Z",
  },
];

// Insights da IA Aprovados na Referência
export const MARKETING_INSIGHTS: MarketingInsightItem[] = [
  {
    id: "ins-1",
    type: "opportunity",
    badgeLabel: "Alta oportunidade",
    badgeColor: "green",
    description:
      "Seu produto 'Experiência Gastronômica' tem grande potencial para campanhas no Instagram.",
  },
  {
    id: "ins-2",
    type: "improvement",
    badgeLabel: "Sugestão de melhoria",
    badgeColor: "blue",
    description:
      "Considere criar uma oferta especial para o produto 'Hospedagem Boutique'.",
  },
  {
    id: "ins-3",
    type: "niche",
    badgeLabel: "Novo nicho identificado",
    badgeColor: "purple",
    description:
      "A IA identificou oportunidade no segmento de turismo de experiência na sua região.",
  },
];
