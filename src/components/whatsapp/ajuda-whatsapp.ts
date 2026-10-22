// Catálogo de ajuda do módulo WhatsApp. Cada texto descreve o comportamento REAL do sistema hoje;
// se uma regra mudar (limite, trava, cron), o texto muda junto — há teste de contrato para isso.
export interface AjudaWa {
  titulo: string;
  comoFunciona: string;
  comoConfigurar?: string[];
  atencao?: string;
}

export const AJUDA_WA = {
  "painel-campanhas": {
    titulo: "Campanhas recentes",
    comoFunciona:
      "Mostra as últimas campanhas e quantas mensagens cada uma enviou. “Entregues” só conta mensagens que o WhatsApp confirmou como entregues (ou lidas).",
    comoConfigurar: ["Abra a aba Campanhas para criar ou acompanhar uma campanha."],
  },
  "painel-conversas": {
    titulo: "Conversas recentes",
    comoFunciona:
      "As últimas conversas recebidas nos seus números. O contador mostra apenas conversas com mensagens que ninguém abriu ainda.",
    comoConfigurar: ["Clique em uma conversa para responder na aba Conversas."],
  },
  "painel-atividade": {
    titulo: "Atividade recente",
    comoFunciona:
      "Registro dos últimos eventos do módulo: envios, respostas, conexões e alterações.",
  },
  "painel-saude": {
    titulo: "Sistema saudável",
    comoFunciona:
      "Resume se seus números estão conectados e respondendo. A saúde é conferida automaticamente a cada 2 minutos.",
    atencao:
      "Se um número aparecer desconectado, reconecte-o na aba Números; ele não envia nem recebe até voltar.",
  },
  "painel-numeros": {
    titulo: "Números ativos",
    comoFunciona:
      "Lista os números conectados e o estado de cada um (conectado, instável ou desconectado).",
    comoConfigurar: ["Para adicionar ou remover números, use a aba Números."],
  },
  "campanhas-lista": {
    titulo: "Campanhas WhatsApp",
    comoFunciona:
      "Uma campanha envia a mesma mensagem para uma lista de leads com consentimento. Ela só envia depois de ter a fila preparada e o disparo liberado.",
    comoConfigurar: [
      "Crie a campanha como rascunho.",
      "Use “Preparar fila” para montar os destinatários (contatos que pediram para sair ficam de fora).",
      "Use “Liberar disparo” quando tudo estiver revisado.",
    ],
    atencao:
      "Liberar o disparo não envia nada se o envio automático ainda não tiver sido ativado para a sua conta.",
  },
  "campanhas-criar": {
    titulo: "Criar nova campanha",
    comoFunciona:
      "Defina nome, mensagem e público. A campanha nasce como rascunho e nada é enviado até você liberar.",
    comoConfigurar: [
      "Escreva a mensagem; use {nome} e {empresa} para personalizar.",
      "Escolha o público e salve o rascunho.",
      "Prepare a fila e libere o disparo.",
    ],
  },
  "campanhas-desempenho": {
    titulo: "Desempenho das campanhas",
    comoFunciona:
      "Enviadas, entregues e respostas por campanha. Entregue = confirmado pelo WhatsApp. Respostas contam mensagens recebidas dos contatos da campanha.",
  },
  "campanhas-numeros": {
    titulo: "Mensagens por número",
    comoFunciona:
      "Mostra como as mensagens da campanha foram divididas entre seus números de disparo (rodízio). Cada número envia no máximo 40 mensagens por dia.",
    comoConfigurar: ["Defina quais números disparam na aba Números (função Comercial/Disparo)."],
  },
  "campanhas-atividade": {
    titulo: "Atividade recente",
    comoFunciona: "Últimas ações nas campanhas: criação, preparo da fila, liberação e envios.",
  },
  "automacao-lista": {
    titulo: "Minhas automações",
    comoFunciona:
      "Automações respondem ou acionam ações quando um evento acontece. Hoje você pode criar e SIMULAR; o envio real fica travado até a liberação da sua conta.",
    comoConfigurar: [
      "Crie a automação escolhendo o gatilho e a ação.",
      "Use “Simular” para ver o que ela faria.",
    ],
    atencao: "Nenhuma automação envia mensagem de verdade enquanto a execução estiver travada.",
  },
  "automacao-criar": {
    titulo: "Criar nova automação",
    comoFunciona: "Escolha o gatilho (o que dispara), as condições e a ação (o que acontece).",
    comoConfigurar: [
      "Dê um nome claro.",
      "Escolha o gatilho e a ação.",
      "Salve e simule antes de ativar.",
    ],
  },
  "automacao-desempenho": {
    titulo: "Desempenho das automações",
    comoFunciona: "Quantas vezes cada automação foi executada ou simulada e com qual resultado.",
  },
  "scripts-lista": {
    titulo: "Meus scripts",
    comoFunciona:
      "Scripts são mensagens prontas para reutilizar em conversas e campanhas. O uso é contado quando você aplica o script.",
    comoConfigurar: ["Crie um script e use {nome} e {empresa} para personalizar a mensagem."],
  },
  "scripts-novo": {
    titulo: "Novo script",
    comoFunciona:
      "Escreva a mensagem uma vez e reutilize. As variáveis {nome} e {empresa} são trocadas pelos dados do lead.",
    comoConfigurar: ["Dê um título.", "Escreva o texto com as variáveis.", "Salve."],
  },
  "scripts-desempenho": {
    titulo: "Desempenho dos scripts",
    comoFunciona: "Quantas vezes cada script foi usado, para você saber quais mensagens funcionam.",
  },
  "numeros-lista": {
    titulo: "Seus números WhatsApp",
    comoFunciona:
      "Cada número conectado atende conversas e/ou dispara campanhas, conforme a função definida.",
    comoConfigurar: [
      "Conecte o número por QR Code.",
      "Defina a função: Principal/Suporte (conversas) ou Comercial/Disparo (campanhas).",
      "Ajuste a prioridade e o número de backup se quiser contingência.",
    ],
  },
  "numeros-conectar": {
    titulo: "Conectar novo número",
    comoFunciona: "O pareamento é feito por QR Code, como no WhatsApp Web.",
    comoConfigurar: [
      "Clique em conectar e aguarde o QR Code.",
      "No celular: WhatsApp > Aparelhos conectados > Conectar aparelho.",
      "Escaneie o código dentro de 40 segundos.",
    ],
    atencao: "Se o QR expirar, gere outro. Não gere vários ao mesmo tempo.",
  },
  "numeros-saude": {
    titulo: "Saúde das conexões",
    comoFunciona:
      "O sistema confere cada número conectado a cada 2 minutos. Um número sem confirmação recente não é usado em disparos.",
  },
  "numeros-rotacao": {
    titulo: "Rodízio e contingência",
    comoFunciona:
      "Nas CAMPANHAS, o sistema reparte os envios entre seus números de disparo saudáveis, priorizando o menos usado, com teto de 40 mensagens por número por dia. Se um número cair, o backup (com Contingência ativa) assume. Respostas manuais em Conversas NUNCA trocam de número: saem sempre pelo número da conversa.",
    comoConfigurar: [
      "Marque os números de envio como Comercial/Disparo.",
      "Use as setas de prioridade para definir a ordem.",
      "Escolha um número de backup e ligue “Contingência ativa”.",
    ],
    atencao:
      "Sem campanha liberada não há envio, então o rodízio só aparece em uso depois do primeiro disparo real.",
  },
  "numeros-atividade": {
    titulo: "Atividade recente",
    comoFunciona: "Eventos dos seus números: conexões, quedas, trocas e verificações.",
  },
  "relatorios-visao": {
    titulo: "Visão geral do desempenho",
    comoFunciona:
      "Enviadas = mensagens de campanha. Entregues = confirmadas pelo WhatsApp (entregue ou lida). Respostas = mensagens recebidas dos contatos. Leads = pessoas diferentes que escreveram.",
    atencao: "Os relatórios consideram até as 5.000 últimas mensagens de campanha.",
  },
  "relatorios-canal": {
    titulo: "Distribuição por canal",
    comoFunciona: "Como o volume se divide entre os canais que você usa.",
  },
  "relatorios-numero": {
    titulo: "Desempenho por número",
    comoFunciona:
      "Enviadas, entregues, respostas e leads de cada número, para comparar a qualidade de cada chip.",
  },
  "relatorios-conversas": {
    titulo: "Status das conversas",
    comoFunciona: "Quantas conversas estão abertas, em atendimento ou finalizadas.",
  },
  "relatorios-vendas": {
    titulo: "Conversões em vendas",
    comoFunciona:
      "Conta propostas aprovadas ou ganhas de campanhas que tiveram envios. Só aparece valor quando há vendas registradas.",
  },
  "relatorios-filtros": {
    titulo: "Filtros de relatório",
    comoFunciona: "Escolha o período, número e campanha para recalcular os indicadores da tela.",
  },
  "conversas-lista": {
    titulo: "Conversas",
    comoFunciona:
      "A bolinha de não lidas mostra só conversas com mensagens que ninguém abriu. Ao abrir uma conversa visível, ela é marcada como lida. Cada conversa mostra por qual número está sendo atendida.",
    comoConfigurar: [
      "Clique na conversa para abrir o histórico.",
      "Digite e envie: o status aparece ali mesmo na mensagem (relógio, ✓ enviado, ✓✓ entregue, azul lido).",
    ],
    atencao:
      "Se o número da conversa foi removido, escolha outro número conectado e clique em “Continuar por este número”.",
  },
} satisfies Record<string, AjudaWa>;

export type AjudaWaId = keyof typeof AJUDA_WA;
