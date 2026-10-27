// Catálogo e Modelagem de Dados da Tela 06: Configurações Financeiras (Gestão → Financeiro → Configurações)
// Fiel aos registros, contas bancárias, categorias, formas de pagamento, regras, centros de custo, notificações e permissões da imagem aprovada.

export interface ContaFinanceiraConfig {
  id: string;
  nome: string;
  instituicao: string;
  codigoInstituicao: string;
  tipo: "Conta Corrente" | "Conta Poupança" | "Carteira Digital" | "Conta de Pagamentos";
  saldo: number;
  status: "ativa" | "inativa";
  contaPadrao: boolean;
  agencia: string;
  conta: string;
  limite?: number;
  bancoLogo: "inter" | "nubank" | "btg" | "mercadopago";
  extratoRecente: Array<{
    id: string;
    data: string;
    descricao: string;
    valor: number;
    tipo: "credito" | "debito";
  }>;
}

export const CONTAS_FINANCEIRAS_INICIAIS: ContaFinanceiraConfig[] = [
  {
    id: "cta-1",
    nome: "Conta Principal",
    instituicao: "Inter",
    codigoInstituicao: "341",
    tipo: "Conta Corrente",
    saldo: 28560.0,
    status: "ativa",
    contaPadrao: true,
    agencia: "0001",
    conta: "123456-7",
    limite: 50000.0,
    bancoLogo: "inter",
    extratoRecente: [
      { id: "ext-1", data: "26/10/2026", descricao: "Recebimento PIX - Clinica Sorriso Mais", valor: 4900.0, tipo: "credito" },
      { id: "ext-2", data: "25/10/2026", descricao: "Pagamento Fornecedor - Hostinger", valor: 380.0, tipo: "debito" },
      { id: "ext-3", data: "24/10/2026", descricao: "Recebimento Boleto - Studio Caiobá", valor: 12500.0, tipo: "credito" },
      { id: "ext-4", data: "22/10/2026", descricao: "Tarifa Manutenção de Conta", valor: 0.0, tipo: "debito" },
    ],
  },
  {
    id: "cta-2",
    nome: "Conta Operacional",
    instituicao: "Nubank",
    codigoInstituicao: "260",
    tipo: "Conta Corrente",
    saldo: 12430.0,
    status: "ativa",
    contaPadrao: false,
    agencia: "0001",
    conta: "987654-3",
    limite: 15000.0,
    bancoLogo: "nubank",
    extratoRecente: [
      { id: "ext-5", data: "26/10/2026", descricao: "Pagamento Meta Ads", valor: 1250.0, tipo: "debito" },
      { id: "ext-6", data: "24/10/2026", descricao: "Transferência Recebida - Consultoria", valor: 8900.0, tipo: "credito" },
    ],
  },
  {
    id: "cta-3",
    nome: "Conta Reserva",
    instituicao: "BTG Pactual",
    codigoInstituicao: "208",
    tipo: "Conta Corrente",
    saldo: 45890.0,
    status: "ativa",
    contaPadrao: false,
    agencia: "0050",
    conta: "442211-0",
    limite: 80000.0,
    bancoLogo: "btg",
    extratoRecente: [
      { id: "ext-7", data: "20/10/2026", descricao: "Aplicação CDB Liquidez Diária", valor: 10000.0, tipo: "debito" },
      { id: "ext-8", data: "15/10/2026", descricao: "Rendimento Mensal Fundos", valor: 450.0, tipo: "credito" },
    ],
  },
  {
    id: "cta-4",
    nome: "Carteira Digital",
    instituicao: "Mercado Pago",
    codigoInstituicao: "323",
    tipo: "Carteira Digital",
    saldo: 3240.0,
    status: "ativa",
    contaPadrao: false,
    agencia: "0001",
    conta: "554433-2",
    limite: 5000.0,
    bancoLogo: "mercadopago",
    extratoRecente: [
      { id: "ext-9", data: "26/10/2026", descricao: "Recebimento Checkout Digital", valor: 1540.0, tipo: "credito" },
      { id: "ext-10", data: "23/10/2026", descricao: "Taxa de Intermediação", valor: 46.2, tipo: "debito" },
    ],
  },
];

export interface CategoriaFinanceiraConfig {
  id: string;
  nome: string;
  tipo: "Receita" | "Despesa";
  cor: string; // hex
  status: "ativa" | "inativa";
  descricao: string;
  icone: string;
}

export const CATEGORIAS_FINANCEIRAS_INICIAIS: CategoriaFinanceiraConfig[] = [
  // Receitas (8)
  { id: "cat-r1", nome: "Serviços mensais", tipo: "Receita", cor: "#64748b", status: "ativa", descricao: "Contratos de recorrência e fee mensal", icone: "FileText" },
  { id: "cat-r2", nome: "Implantação", tipo: "Receita", cor: "#8b5cf6", status: "ativa", descricao: "Setup e configuração inicial de clientes", icone: "Folder" },
  { id: "cat-r3", nome: "Consultoria", tipo: "Receita", cor: "#3b82f6", status: "ativa", descricao: "Diagnósticos e assessorias estratégicas", icone: "Briefcase" },
  { id: "cat-r4", nome: "Suporte", tipo: "Receita", cor: "#06b6d4", status: "ativa", descricao: "Pacotes de suporte e SLA contratados", icone: "Headphones" },
  { id: "cat-r5", nome: "Treinamento", tipo: "Receita", cor: "#22c55e", status: "ativa", descricao: "Workshops e capacitação de equipes", icone: "GraduationCap" },
  { id: "cat-r6", nome: "Outros", tipo: "Receita", cor: "#10b981", status: "ativa", descricao: "Receitas operacionais esporádicas", icone: "MoreHorizontal" },
  { id: "cat-r7", nome: "Licenciamento", tipo: "Receita", cor: "#f59e0b", status: "ativa", descricao: "Subscrições e taxas de uso da plataforma", icone: "Layers" },
  { id: "cat-r8", nome: "Comissões", tipo: "Receita", cor: "#ec4899", status: "ativa", descricao: "Indicações e parcerias comerciais", icone: "Percent" },

  // Despesas (4)
  { id: "cat-d1", nome: "Marketing e Ads", tipo: "Despesa", cor: "#f43f5e", status: "ativa", descricao: "Tráfego pago, campanhas e anúncios", icone: "Megaphone" },
  { id: "cat-d2", nome: "Infraestrutura", tipo: "Despesa", cor: "#6366f1", status: "ativa", descricao: "Servidores em nuvem, bancos e domínios", icone: "Server" },
  { id: "cat-d3", nome: "Equipe interna", tipo: "Despesa", cor: "#f97316", status: "ativa", descricao: "Salários, bonificações e encargos", icone: "Users" },
  { id: "cat-d4", nome: "Ferramentas SaaS", tipo: "Despesa", cor: "#a855f7", status: "ativa", descricao: "Assinaturas de softwares e automações", icone: "Cpu" },
];

export interface FormaPagamentoConfig {
  id: string;
  nome: string;
  tipo: "Recebimento" | "Pagamento" | "Ambos";
  taxa: string;
  taxaFixa?: number;
  prazoCompensacao: string;
  status: "ativa" | "inativa";
  iconTipo: "pix" | "cartao_credito" | "boleto" | "transferencia" | "dinheiro" | "cartao_debito";
  descricao: string;
}

export const FORMAS_PAGAMENTO_INICIAIS: FormaPagamentoConfig[] = [
  { id: "fp-1", nome: "Pix", tipo: "Recebimento", taxa: "0%", taxaFixa: 0, prazoCompensacao: "Imediato", status: "ativa", iconTipo: "pix", descricao: "Liquidação instantânea 24/7 sem taxas bancárias" },
  { id: "fp-2", nome: "Cartão de Crédito", tipo: "Recebimento", taxa: "2,99%", taxaFixa: 0.49, prazoCompensacao: "D+30 ou D+2 antecipado", status: "ativa", iconTipo: "cartao_credito", descricao: "Checkout e faturamento recorrente em cartão" },
  { id: "fp-3", nome: "Boleto Bancário", tipo: "Recebimento", taxa: "2,49%", taxaFixa: 1.99, prazoCompensacao: "D+1 após compensação", status: "ativa", iconTipo: "boleto", descricao: "Emissão de boletos registrados com QR Code Pix" },
  { id: "fp-4", nome: "Transferência", tipo: "Recebimento", taxa: "0%", taxaFixa: 0, prazoCompensacao: "D+0 em horário comercial", status: "ativa", iconTipo: "transferencia", descricao: "TED / DOC entre contas bancárias corporativas" },
  { id: "fp-5", nome: "Dinheiro", tipo: "Recebimento", taxa: "0%", taxaFixa: 0, prazoCompensacao: "Imediato", status: "ativa", iconTipo: "dinheiro", descricao: "Recebimento em espécie com lançamento em caixa físico" },
  { id: "fp-6", nome: "Cartão de Débito", tipo: "Recebimento", taxa: "1,99%", taxaFixa: 0.25, prazoCompensacao: "D+1", status: "inativa", iconTipo: "cartao_debito", descricao: "Transações com cartão de débito presencial" },
];

export interface RegraCobrancaConfig {
  id: string;
  nome: string;
  descricao: string;
  evento: string;
  canal: string;
  status: "ativa" | "inativa";
  frequencia: string;
  horario: string;
  antecedencia: string;
}

export const REGRAS_COBRANCA_INICIAIS: RegraCobrancaConfig[] = [
  {
    id: "reg-1",
    nome: "Lembrete 3 dias",
    descricao: "Enviar lembrete 3 dias antes do vencimento com link de pagamento Pix e código de barras.",
    evento: "Cobrança próxima do vencimento",
    canal: "E-mail e WhatsApp",
    status: "ativa",
    frequencia: "Única",
    horario: "09:00",
    antecedencia: "3 dias antes",
  },
  {
    id: "reg-2",
    nome: "Lembrete 1 dia",
    descricao: "Enviar lembrete 1 dia antes do vencimento com resumo do contrato e chave Pix rápida.",
    evento: "Véspera de vencimento",
    canal: "WhatsApp",
    status: "ativa",
    frequencia: "Única",
    horario: "10:30",
    antecedencia: "1 dia antes",
  },
  {
    id: "reg-3",
    nome: "Após vencimento",
    descricao: "Notificar após 3 dias de inadimplência com segunda via atualizada sem juros adicionais.",
    evento: "Fatura em atraso",
    canal: "E-mail e Notificação interna",
    status: "ativa",
    frequencia: "A cada 3 dias",
    horario: "14:00",
    antecedencia: "3 dias após",
  },
];

export interface CentroCustoConfig {
  id: string;
  nome: string;
  descricao: string;
  tipo: "Departamento" | "Projeto" | "Unidade";
  departamento: string;
  responsavel: string;
  orcamentoPrevisto: number;
  gastosRealizados: number;
  limite: number;
  status: "ativa" | "inativa";
}

export const CENTROS_CUSTO_INICIAIS: CentroCustoConfig[] = [
  {
    id: "cc-1",
    nome: "Marketing",
    descricao: "Campanhas e anúncios",
    tipo: "Departamento",
    departamento: "Marketing",
    responsavel: "Marcos Gonçalves",
    orcamentoPrevisto: 15000,
    gastosRealizados: 8450,
    limite: 20000,
    status: "ativa",
  },
  {
    id: "cc-2",
    nome: "Vendas",
    descricao: "Comercial e prospecção",
    tipo: "Departamento",
    departamento: "Comercial",
    responsavel: "Equipe Comercial",
    orcamentoPrevisto: 12000,
    gastosRealizados: 6200,
    limite: 15000,
    status: "ativa",
  },
  {
    id: "cc-3",
    nome: "Operações",
    descricao: "Infraestrutura e ferramentas",
    tipo: "Departamento",
    departamento: "Operações",
    responsavel: "Equipe Financeiro",
    orcamentoPrevisto: 8000,
    gastosRealizados: 4380,
    limite: 10000,
    status: "ativa",
  },
  {
    id: "cc-4",
    nome: "Tecnologia",
    descricao: "Desenvolvimento e produtos",
    tipo: "Departamento",
    departamento: "TI & Engenharia",
    responsavel: "Marcos Gonçalves",
    orcamentoPrevisto: 25000,
    gastosRealizados: 18900,
    limite: 30000,
    status: "ativa",
  },
  {
    id: "cc-5",
    nome: "Administrativo",
    descricao: "Gestão interna e legal",
    tipo: "Departamento",
    departamento: "Administração",
    responsavel: "Equipe Financeiro",
    orcamentoPrevisto: 10000,
    gastosRealizados: 5400,
    limite: 12000,
    status: "ativa",
  },
  {
    id: "cc-6",
    nome: "Financeiro",
    descricao: "Controladoria e contabilidade",
    tipo: "Departamento",
    departamento: "Controladoria",
    responsavel: "Marcos Gonçalves",
    orcamentoPrevisto: 7000,
    gastosRealizados: 3100,
    limite: 9000,
    status: "ativa",
  },
];

export interface NotificacaoFinanceiraConfig {
  id: string;
  nome: string;
  duracao: string;
  evento: string;
  canal: string;
  status: "ativa" | "inativa";
  destinatarios: string;
  frequencia: string;
}

export const NOTIFICACOES_FINANCEIRAS_INICIAIS: NotificacaoFinanceiraConfig[] = [
  {
    id: "not-1",
    nome: "Vencimento de cobrança",
    duracao: "Notificar 3 dias antes",
    evento: "Alerta preventivo de cobrança a vencer",
    canal: "E-mail e Sistema",
    status: "ativa",
    destinatarios: "Administradores e Gestores Financeiros",
    frequencia: "Diária (matutino)",
  },
  {
    id: "not-2",
    nome: "Cobrança em atraso",
    duracao: "Notificar diariamente",
    evento: "Fatura com prazo de pagamento expirado",
    canal: "Notificação Interna",
    status: "ativa",
    destinatarios: "Equipe Financeira e Comercial",
    frequencia: "Diária às 08:30",
  },
  {
    id: "not-3",
    nome: "Pagamento recebido",
    duracao: "Notificar confirmação",
    evento: "Confirmação de recebimento PIX / TED",
    canal: "Sistema e WhatsApp",
    status: "ativa",
    destinatarios: "Gestor do Contrato e Admin",
    frequencia: "Tempo Real",
  },
  {
    id: "not-4",
    nome: "Despesa próxima do vencimento",
    duracao: "Notificar 2 dias antes",
    evento: "Contas a pagar agendadas",
    canal: "E-mail",
    status: "ativa",
    destinatarios: "Controladoria",
    frequencia: "Diária às 09:00",
  },
  {
    id: "not-5",
    nome: "Limite de centro de custo",
    duracao: "Notificar ao atingir 80%",
    evento: "Gasto departamental próximo ao teto orçamentário",
    canal: "Sistema",
    status: "ativa",
    destinatarios: "Líder de Departamento e Admin",
    frequencia: "Imediato",
  },
];

export interface PermissaoFinanceiraConfig {
  id: string;
  usuario: string;
  email: string;
  funcao: "Administrador" | "Financeiro" | "Comercial";
  acesso: "Total" | "Completo" | "Visualização";
  status: "ativa" | "inativa";
  avatar: string;
  permissoes: {
    visualizarFinanceiro: boolean;
    visualizarReceitas: boolean;
    visualizarDespesas: boolean;
    criarLancamentos: boolean;
    editarLancamentos: boolean;
    registrarPagamentos: boolean;
    configurarContas: boolean;
    exportarDados: boolean;
    gerenciarRegras: boolean;
    administrarIntegracoes: boolean;
  };
}

export const PERMISSOES_ACESSO_INICIAIS: PermissaoFinanceiraConfig[] = [
  {
    id: "perm-1",
    usuario: "Marcos Gonçalves",
    email: "marcos@flowgenius.com.br",
    funcao: "Administrador",
    acesso: "Total",
    status: "ativa",
    avatar: "MG",
    permissoes: {
      visualizarFinanceiro: true,
      visualizarReceitas: true,
      visualizarDespesas: true,
      criarLancamentos: true,
      editarLancamentos: true,
      registrarPagamentos: true,
      configurarContas: true,
      exportarDados: true,
      gerenciarRegras: true,
      administrarIntegracoes: true,
    },
  },
  {
    id: "perm-2",
    usuario: "Equipe Financeiro",
    email: "financeiro@flowgenius.com.br",
    funcao: "Financeiro",
    acesso: "Completo",
    status: "ativa",
    avatar: "EF",
    permissoes: {
      visualizarFinanceiro: true,
      visualizarReceitas: true,
      visualizarDespesas: true,
      criarLancamentos: true,
      editarLancamentos: true,
      registrarPagamentos: true,
      configurarContas: true,
      exportarDados: true,
      gerenciarRegras: false,
      administrarIntegracoes: false,
    },
  },
  {
    id: "perm-3",
    usuario: "Equipe Comercial",
    email: "comercial@flowgenius.com.br",
    funcao: "Comercial",
    acesso: "Visualização",
    status: "ativa",
    avatar: "EC",
    permissoes: {
      visualizarFinanceiro: true,
      visualizarReceitas: true,
      visualizarDespesas: false,
      criarLancamentos: false,
      editarLancamentos: false,
      registrarPagamentos: false,
      configurarContas: false,
      exportarDados: false,
      gerenciarRegras: false,
      administrarIntegracoes: false,
    },
  },
  {
    id: "perm-4",
    usuario: "Operações & Tech",
    email: "operacoes@flowgenius.com.br",
    funcao: "Administrador",
    acesso: "Visualização",
    status: "ativa",
    avatar: "OT",
    permissoes: {
      visualizarFinanceiro: true,
      visualizarReceitas: false,
      visualizarDespesas: true,
      criarLancamentos: false,
      editarLancamentos: false,
      registrarPagamentos: false,
      configurarContas: false,
      exportarDados: false,
      gerenciarRegras: false,
      administrarIntegracoes: false,
    },
  },
  {
    id: "perm-5",
    usuario: "Auditoria Externa",
    email: "auditoria@compliance.com.br",
    funcao: "Financeiro",
    acesso: "Visualização",
    status: "ativa",
    avatar: "AE",
    permissoes: {
      visualizarFinanceiro: true,
      visualizarReceitas: true,
      visualizarDespesas: true,
      criarLancamentos: false,
      editarLancamentos: false,
      registrarPagamentos: false,
      configurarContas: false,
      exportarDados: true,
      gerenciarRegras: false,
      administrarIntegracoes: false,
    },
  },
];

export interface IntegracaoFinanceiraItem {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  provedor: string;
  status: "conectado" | "disponivel" | "nao_configurado";
  icon: string;
  badgeCor: string;
}

export const INTEGRACOES_FINANCEIRAS_INICIAIS: IntegracaoFinanceiraItem[] = [
  {
    id: "int-1",
    nome: "Gateway de Pagamentos",
    descricao: "Processamento de cartões de crédito e Pix instantâneo com conciliação automática.",
    categoria: "Pagamentos",
    provedor: "Stripe & Asaas",
    status: "disponivel",
    icon: "CreditCard",
    badgeCor: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  },
  {
    id: "int-2",
    nome: "Open Finance Bancário",
    descricao: "Conexão direta de extratos e saldos em tempo real via Open Finance regulamentado.",
    categoria: "Bancos",
    provedor: "Banco Inter / Nubank / BTG",
    status: "disponivel",
    icon: "Landmark",
    badgeCor: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  },
  {
    id: "int-3",
    nome: "Emissão de Boletos",
    descricao: "Geração automática de boletos bancários com QR Code Pix embutido.",
    categoria: "Cobranças",
    provedor: "Asaas / Banco Inter",
    status: "disponivel",
    icon: "Receipt",
    badgeCor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  },
  {
    id: "int-4",
    nome: "Sistema Fiscal & NF-e",
    descricao: "Emissão e sincronização automática de Notas Fiscais de Serviços (NFS-e).",
    categoria: "Fiscal",
    provedor: "Focus NFe / PlugNotas",
    status: "nao_configurado",
    icon: "FileCheck",
    badgeCor: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  },
  {
    id: "int-5",
    nome: "CRM & Contratos",
    descricao: "Geração de lançamentos a receber a partir de propostas e contratos assinados.",
    categoria: "Vendas",
    provedor: "Flow Business Nativo",
    status: "conectado",
    icon: "FileSignature",
    badgeCor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  },
  {
    id: "int-6",
    nome: "CEO de IA & Automações",
    descricao: "Supervisão inteligente de fluxo de caixa, alertas de despesas e sugestões financeiras.",
    categoria: "Inteligência Artificial",
    provedor: "Flow Genius Agentes IA",
    status: "conectado",
    icon: "Bot",
    badgeCor: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  },
];

export interface LogAuditoriaItem {
  id: string;
  dataHora: string;
  usuario: string;
  acao: string;
  recurso: string;
  identificador: string;
  resultado: "Sucesso" | "Aviso" | "Falha";
  origem: string;
  detalhes: string;
}

export const LOGS_AUDITORIA_INICIAIS: LogAuditoriaItem[] = [
  {
    id: "log-1",
    dataHora: "27/10/2026 11:42",
    usuario: "Marcos Gonçalves",
    acao: "Conta principal alterada",
    recurso: "Contas Financeiras",
    identificador: "Banco Inter (341)",
    resultado: "Sucesso",
    origem: "Painel Desktop (189.40.22.10)",
    detalhes: "Definida Conta Principal como padrão da organização.",
  },
  {
    id: "log-2",
    dataHora: "27/10/2026 10:15",
    usuario: "Equipe Financeiro",
    acao: "Atualização de taxa",
    recurso: "Formas de Pagamento",
    identificador: "Boleto Bancário",
    resultado: "Sucesso",
    origem: "Painel Desktop (189.40.22.10)",
    detalhes: "Taxa operacional ajustada para 2,49%.",
  },
  {
    id: "log-3",
    dataHora: "26/10/2026 16:30",
    usuario: "Marcos Gonçalves",
    acao: "Regra de cobrança criada",
    recurso: "Regras de Cobrança",
    identificador: "Lembrete 3 dias",
    resultado: "Sucesso",
    origem: "Painel Desktop (189.40.22.10)",
    detalhes: "Ativação de lembrete com antecedência de 72 horas.",
  },
  {
    id: "log-4",
    dataHora: "25/10/2026 14:05",
    usuario: "Sistema Automático",
    acao: "Sincronização de saldo",
    recurso: "Contas Financeiras",
    identificador: "Mercado Pago",
    resultado: "Sucesso",
    origem: "Webhook Integrado",
    detalhes: "Saldo atualizado via conciliação diária.",
  },
  {
    id: "log-5",
    dataHora: "24/10/2026 09:20",
    usuario: "Marcos Gonçalves",
    acao: "Nova categoria registrada",
    recurso: "Categorias",
    identificador: "Treinamento",
    resultado: "Sucesso",
    origem: "Painel Desktop (189.40.22.10)",
    detalhes: "Categoria vinculada a receitas operacionais.",
  },
];
