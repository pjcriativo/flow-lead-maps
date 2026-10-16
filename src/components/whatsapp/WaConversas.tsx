// Central de Conversas WhatsApp Premium — Flow Business (Fidelidade Absoluta ao Layout Aprovado)
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  ArrowLeft,
  Briefcase,
  Building2,
  Calendar,
  Check,
  CheckCheck,
  ChevronDown,
  CircleDot,
  Clock,
  Download,
  Edit2,
  FileText,
  Filter,
  Globe,
  Headphones,
  Image as ImageIcon,
  Loader2,
  Mail,
  MessageCircle,
  MessagesSquare,
  MoreVertical,
  Paperclip,
  Phone,
  Plus,
  Search,
  SendHorizontal,
  Smile,
  Sparkles,
  Star,
  Tag,
  TrendingUp,
  User,
  UserCheck,
  UserPlus,
  X,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { getActiveOrganizationContext } from "@/lib/active-organization";
import { supabase } from "@/integrations/supabase/client";
import {
  atualizarLeadCrm,
  listarConversas,
  listarMensagens,
  listarScripts,
  marcarConversaLida,
  obterKpisConversasWa,
  registrarInteracaoWa,
  responderConversa,
  type WaConversa,
  type WaConversaKpis,
  type WaMensagem,
  type WaScript,
} from "@/services/whatsapp";

// ==========================================
// TIPOS E MODELOS DE DADOS DA CENTRAL
// ==========================================

export type StatusAtendimento =
  "todas" | "nao_lidas" | "em_atendimento" | "aguardando" | "concluida" | "arquivada";
export type StatusComercial =
  "Lead" | "Em qualificação" | "Proposta" | "Negociação" | "Cliente" | "Perdido";
export type PipelineEtapa =
  "Prospecção" | "Qualificação" | "Proposta" | "Negociação" | "Fechamento";

export interface AnexoMsg {
  tipo: "pdf" | "imagem" | "documento" | "audio";
  nome: string;
  tamanho: string;
  url: string;
}

export interface MensagemChat {
  id: string;
  direcao: "in" | "out";
  texto: string;
  horario: string;
  statusEnvio?: "enviado" | "entregue" | "lido" | "falha";
  anexo?: AnexoMsg;
}

export interface NotaLead {
  id: string;
  texto: string;
  autor: string;
  horario: string;
}

export interface InteracaoLead {
  id: string;
  tipo: "documento" | "conversa" | "lead" | "nota" | "status";
  titulo: string;
  subtitulo: string;
  horario: string;
  cor: "rose" | "emerald" | "blue" | "amber" | "purple";
}

export interface ContatoConversa {
  id: string;
  numero: string;
  nome: string;
  avatar: string;
  crmAvatar?: string;
  ultimaMensagem: string;
  ultimaMensagemTipo?: "texto" | "imagem" | "documento" | "audio";
  horario: string;
  naoLidas: number;
  statusAtendimento: StatusAtendimento;
  statusComercial: StatusComercial;
  pipelineEtapa: PipelineEtapa;
  responsavel: {
    nome: string;
    avatar: string;
  };
  tags: string[];
  favorito: boolean;
  email: string;
  empresa: string;
  cargo: string;
  origem: string;
  dataCadastro: string;
  online: boolean;
  notas: NotaLead[];
  interacoes: InteracaoLead[];
  mensagens: MensagemChat[];
  leadId?: string;
}

// ==========================================
// DATASET DE REFERÊNCIA FIEL (BENCHMARK APROVADO)
// ==========================================

const CONTATOS_REFERENCIA: ContatoConversa[] = [
  {
    id: "contato-1",
    numero: "+55 11 98765-4321",
    nome: "Carla Mendes",
    avatar: "/images/avatars/contact_carla.jpg",
    crmAvatar: "/images/avatars/carla_mendes.jpg",
    ultimaMensagem: "Olá! Gostaria de saber mais sobre o pla...",
    horario: "10:24",
    naoLidas: 3,
    statusAtendimento: "em_atendimento",
    statusComercial: "Lead",
    pipelineEtapa: "Prospecção",
    responsavel: {
      nome: "Marcos Gonçalves",
      avatar: "/images/avatars/marcos_goncalves.jpg",
    },
    tags: ["Restaurante", "São Paulo", "Quente"],
    favorito: true,
    email: "carla@restaurante.com.br",
    empresa: "Restaurante Sabor & Arte",
    cargo: "Proprietária",
    origem: "Site",
    dataCadastro: "12/03/2024",
    online: true,
    notas: [
      {
        id: "n-1",
        texto:
          "Interessada nos planos de marketing digital. Enviar cases do segmento e agendar call.",
        autor: "Marcos Gonçalves",
        horario: "10:24",
      },
    ],
    interacoes: [
      {
        id: "i-1",
        tipo: "documento",
        titulo: "Recebeu um documento",
        subtitulo: "Apresentação Flow Business.pdf",
        horario: "10:23",
        cor: "rose",
      },
      {
        id: "i-2",
        tipo: "conversa",
        titulo: "Conversa iniciada",
        subtitulo: "Olá! Vi o site de vocês...",
        horario: "10:20",
        cor: "emerald",
      },
      {
        id: "i-3",
        tipo: "lead",
        titulo: "Lead criado",
        subtitulo: "Origem: Site",
        horario: "12/03",
        cor: "blue",
      },
    ],
    mensagens: [
      {
        id: "m-1",
        direcao: "in",
        texto:
          "Olá! Vi o site de vocês e me interessei pelos serviços de marketing para meu restaurante. Vocês atendem em São Paulo?",
        horario: "10:20",
      },
      {
        id: "m-2",
        direcao: "out",
        texto:
          "Olá, Carla! 👋\nSim, atendemos em toda a região de São Paulo. Posso te mostrar alguns casos de sucesso no seu segmento.",
        horario: "10:21",
        statusEnvio: "lido",
      },
      {
        id: "m-3",
        direcao: "in",
        texto: "Perfeito! Gostaria de ver alguns exemplos e entender melhor os planos disponíveis.",
        horario: "10:22",
      },
      {
        id: "m-4",
        direcao: "out",
        texto:
          "Segue nossa apresentação com os planos e alguns cases de restaurantes. Qualquer dúvida estou à disposição!",
        horario: "10:23",
        statusEnvio: "lido",
        anexo: {
          tipo: "pdf",
          nome: "Apresentação Flow Business.pdf",
          tamanho: "2.4 MB • PDF",
          url: "/files/Apresentacao-Flow-Business.pdf",
        },
      },
      {
        id: "m-5",
        direcao: "in",
        texto: "Muito obrigado! Vou analisar e te retorno ainda hoje.",
        horario: "10:24",
      },
    ],
  },
  {
    id: "contato-2",
    numero: "+55 11 97654-3210",
    nome: "João Silva",
    avatar: "/images/avatars/contact_joao.jpg",
    ultimaMensagem: "Perfeito! Vamos agendar uma demonstra...",
    horario: "09:18",
    naoLidas: 1,
    statusAtendimento: "em_atendimento",
    statusComercial: "Em qualificação",
    pipelineEtapa: "Qualificação",
    responsavel: {
      nome: "Marcos Gonçalves",
      avatar: "/images/avatars/marcos_goncalves.jpg",
    },
    tags: ["Advocacia", "São Paulo"],
    favorito: false,
    email: "joao.silva@advocacia.com.br",
    empresa: "Silva Advocacia & Consultoria",
    cargo: "Sócio-Diretor",
    origem: "Google Maps",
    dataCadastro: "14/03/2024",
    online: false,
    notas: [],
    interacoes: [
      {
        id: "i-21",
        tipo: "conversa",
        titulo: "Mensagem recebida",
        subtitulo: "Perfeito! Vamos agendar uma demonstra...",
        horario: "09:18",
        cor: "emerald",
      },
    ],
    mensagens: [
      {
        id: "m-21",
        direcao: "in",
        texto: "Perfeito! Vamos agendar uma demonstração do sistema para amanhã?",
        horario: "09:18",
      },
    ],
  },
  {
    id: "contato-3",
    numero: "+55 11 98877-6655",
    nome: "Restaurante Sabor & Arte",
    avatar: "/images/avatars/contact_sabor.jpg",
    ultimaMensagem: "Enviou uma imagem",
    ultimaMensagemTipo: "imagem",
    horario: "Ontem",
    naoLidas: 2,
    statusAtendimento: "aguardando",
    statusComercial: "Lead",
    pipelineEtapa: "Prospecção",
    responsavel: {
      nome: "Marcos Gonçalves",
      avatar: "/images/avatars/marcos_goncalves.jpg",
    },
    tags: ["Gastronomia", "Delivery"],
    favorito: false,
    email: "contato@saborearte.com.br",
    empresa: "Restaurante Sabor & Arte",
    cargo: "Gerente",
    origem: "Instagram",
    dataCadastro: "10/03/2024",
    online: true,
    notas: [],
    interacoes: [],
    mensagens: [
      {
        id: "m-31",
        direcao: "in",
        texto: "📷 Enviou uma foto do cardápio promocional.",
        horario: "18:40",
      },
    ],
  },
  {
    id: "contato-4",
    numero: "+55 11 97766-5544",
    nome: "Ana Costa",
    avatar: "/images/avatars/contact_ana.jpg",
    ultimaMensagem: "Qual o valor para minha região?",
    horario: "Ontem",
    naoLidas: 0,
    statusAtendimento: "aguardando",
    statusComercial: "Proposta",
    pipelineEtapa: "Proposta",
    responsavel: {
      nome: "Marcos Gonçalves",
      avatar: "/images/avatars/marcos_goncalves.jpg",
    },
    tags: ["Arquitetura", "Design"],
    favorito: false,
    email: "ana@anacosta.arq.br",
    empresa: "Studio Ana Costa Arquitetura",
    cargo: "Arquiteta Titular",
    origem: "Site",
    dataCadastro: "08/03/2024",
    online: false,
    notas: [],
    interacoes: [],
    mensagens: [
      {
        id: "m-41",
        direcao: "in",
        texto: "Qual o valor para minha região em Campinas?",
        horario: "17:15",
      },
    ],
  },
  {
    id: "contato-5",
    numero: "+55 11 96655-4433",
    nome: "Clínica Vida Plena",
    avatar: "/images/avatars/contact_clinica.jpg",
    ultimaMensagem: "Eu tenho interesse, pode me enviar mai...",
    horario: "Ontem",
    naoLidas: 0,
    statusAtendimento: "em_atendimento",
    statusComercial: "Lead",
    pipelineEtapa: "Prospecção",
    responsavel: {
      nome: "Marcos Gonçalves",
      avatar: "/images/avatars/marcos_goncalves.jpg",
    },
    tags: ["Saúde", "Odontologia"],
    favorito: false,
    email: "atendimento@vidaplena.com.br",
    empresa: "Clínica Vida Plena",
    cargo: "Coordenadora",
    origem: "Google Maps",
    dataCadastro: "05/03/2024",
    online: false,
    notas: [],
    interacoes: [],
    mensagens: [
      {
        id: "m-51",
        direcao: "in",
        texto: "Eu tenho interesse, pode me enviar mais informações sobre a captação de pacientes?",
        horario: "15:20",
      },
    ],
  },
  {
    id: "contato-6",
    numero: "+55 21 98899-1122",
    nome: "Pedro Oliveira",
    avatar: "/images/avatars/contact_pedro.jpg",
    ultimaMensagem: "Muito obrigado! 🙏",
    horario: "Seg",
    naoLidas: 0,
    statusAtendimento: "concluida",
    statusComercial: "Cliente",
    pipelineEtapa: "Fechamento",
    responsavel: {
      nome: "Marcos Gonçalves",
      avatar: "/images/avatars/marcos_goncalves.jpg",
    },
    tags: ["Contabilidade", "Rio de Janeiro"],
    favorito: true,
    email: "pedro@oliveiracontab.com.br",
    empresa: "Oliveira Contabilidade",
    cargo: "Diretor Fiscal",
    origem: "Indicação",
    dataCadastro: "01/03/2024",
    online: false,
    notas: [],
    interacoes: [],
    mensagens: [
      {
        id: "m-61",
        direcao: "in",
        texto: "Muito obrigado! Contrato assinado. 🙏",
        horario: "Seg 11:30",
      },
    ],
  },
  {
    id: "contato-7",
    numero: "+55 11 99911-2233",
    nome: "Academia PowerFit",
    avatar: "/images/avatars/contact_powerfit.jpg",
    ultimaMensagem: "Enviou um documento",
    ultimaMensagemTipo: "documento",
    horario: "Seg",
    naoLidas: 0,
    statusAtendimento: "em_atendimento",
    statusComercial: "Negociação",
    pipelineEtapa: "Proposta",
    responsavel: {
      nome: "Marcos Gonçalves",
      avatar: "/images/avatars/marcos_goncalves.jpg",
    },
    tags: ["Fitness", "Academia"],
    favorito: false,
    email: "gerencia@powerfit.com.br",
    empresa: "Academia PowerFit",
    cargo: "Sócio",
    origem: "Instagram",
    dataCadastro: "28/02/2024",
    online: false,
    notas: [],
    interacoes: [],
    mensagens: [
      {
        id: "m-71",
        direcao: "in",
        texto: "📄 Segue em anexo a lista de professores.",
        horario: "Seg 09:12",
      },
    ],
  },
  {
    id: "contato-8",
    numero: "+55 31 98777-8899",
    nome: "Mariana Santos",
    avatar: "/images/avatars/contact_mariana.jpg",
    ultimaMensagem: "Vocês atendem em outras cidades?",
    horario: "Seg",
    naoLidas: 0,
    statusAtendimento: "aguardando",
    statusComercial: "Lead",
    pipelineEtapa: "Prospecção",
    responsavel: {
      nome: "Marcos Gonçalves",
      avatar: "/images/avatars/marcos_goncalves.jpg",
    },
    tags: ["Joias", "Varejo"],
    favorito: false,
    email: "mariana@santosjoias.com.br",
    empresa: "Mariana Joias",
    cargo: "Fundadora",
    origem: "Site",
    dataCadastro: "26/02/2024",
    online: false,
    notas: [],
    interacoes: [],
    mensagens: [
      {
        id: "m-81",
        direcao: "in",
        texto: "Vocês atendem em outras cidades além de São Paulo e Belo Horizonte?",
        horario: "Seg 08:45",
      },
    ],
  },
  {
    id: "contato-9",
    numero: "+55 41 99888-7766",
    nome: "Bruno Almeida",
    avatar: "/images/avatars/contact_bruno.jpg",
    ultimaMensagem: "Quero contratar, qual o próximo passo?",
    horario: "Seg",
    naoLidas: 0,
    statusAtendimento: "em_atendimento",
    statusComercial: "Negociação",
    pipelineEtapa: "Proposta",
    responsavel: {
      nome: "Marcos Gonçalves",
      avatar: "/images/avatars/marcos_goncalves.jpg",
    },
    tags: ["Software", "Curitiba"],
    favorito: false,
    email: "bruno@almeidasoft.com.br",
    empresa: "Almeida Software",
    cargo: "CTO",
    origem: "LinkedIn",
    dataCadastro: "24/02/2024",
    online: false,
    notas: [],
    interacoes: [],
    mensagens: [
      {
        id: "m-91",
        direcao: "in",
        texto: "Quero contratar, qual o próximo passo para liberar o acesso?",
        horario: "Seg 08:10",
      },
    ],
  },
  {
    id: "contato-10",
    numero: "+55 11 95544-3322",
    nome: "Loja Estilo & Cia",
    avatar: "/images/avatars/contact_estilo.jpg",
    ultimaMensagem: "Ok, aguardo o retorno!",
    horario: "Seg",
    naoLidas: 0,
    statusAtendimento: "concluida",
    statusComercial: "Cliente",
    pipelineEtapa: "Fechamento",
    responsavel: {
      nome: "Marcos Gonçalves",
      avatar: "/images/avatars/marcos_goncalves.jpg",
    },
    tags: ["Moda", "Varejo"],
    favorito: false,
    email: "contato@estiloecia.com.br",
    empresa: "Loja Estilo & Cia",
    cargo: "Diretor Comercial",
    origem: "Google Maps",
    dataCadastro: "20/02/2024",
    online: false,
    notas: [],
    interacoes: [],
    mensagens: [
      {
        id: "m-101",
        direcao: "in",
        texto: "Ok, aguardo o retorno da equipe técnica!",
        horario: "Seg 07:50",
      },
    ],
  },
];

export function WaConversas() {
  // Estado das conversas
  const [contatos, setContatos] = useState<ContatoConversa[]>([]);
  const [contatoAtivoId, setContatoAtivoId] = useState<string>("");
  const [kpis, setKpis] = useState<WaConversaKpis>({
    conversasAtivas: 0,
    naoLidas: 0,
    aguardandoResposta: 0,
    emAtendimento: 0,
    novosContatos: 0,
    fechamentosHoje: 0,
  });

  // Filtros e busca
  const [busca, setBusca] = useState("");
  const [tabFiltro, setTabFiltro] = useState<"todas" | "nao_lidas" | "em_atendimento">("todas");
  const [menuFiltroAberto, setMenuFiltroAberto] = useState(false);
  const [filtroTag, setFiltroTag] = useState<string | null>(null);

  // Composer
  const [composerTab, setComposerTab] = useState<"mensagem" | "resposta_rapida">("mensagem");
  const [textoMensagem, setTextoMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [scriptsDisponiveis, setScriptsDisponiveis] = useState<WaScript[]>([]);
  const [buscaScript, setBuscaScript] = useState("");
  const [mostrarEmojis, setMostrarEmojis] = useState(false);

  // Modais de ações
  const [modalEditarContato, setModalEditarContato] = useState(false);
  const [modalAdicionarNota, setModalAdicionarNota] = useState(false);
  const [modalVerInteracoes, setModalVerInteracoes] = useState(false);
  const [modalAnexo, setModalAnexo] = useState(false);

  // Form states de edição
  const [editNome, setEditNome] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editEmpresa, setEditEmpresa] = useState("");
  const [editCargo, setEditCargo] = useState("");
  const [editTelefone, setEditTelefone] = useState("");
  const [novaNotaTexto, setNovaNotaTexto] = useState("");
  const [novaTagTexto, setNovaTagTexto] = useState("");
  const [mostrarInputTag, setMostrarInputTag] = useState(false);

  // Responsividade Mobile: tela ativa ("lista", "chat", "crm")
  const [viewMobile, setViewMobile] = useState<"lista" | "chat" | "crm">("chat");

  const fimRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Contato Ativo Selecionado
  const contatoAtivo = useMemo(() => {
    return contatos.find((c) => c.id === contatoAtivoId) ?? contatos[0] ?? null;
  }, [contatos, contatoAtivoId]);

  // Carregar KPIs e scripts do banco
  const carregarDadosIniciais = useCallback(async () => {
    try {
      const [kpisRes, scriptsRes, conversationsRes] = await Promise.allSettled([
        obterKpisConversasWa(),
        listarScripts(),
        listarConversas(),
      ]);

      if (kpisRes.status === "fulfilled") {
        setKpis(kpisRes.value);
      }
      if (scriptsRes.status === "fulfilled") {
        setScriptsDisponiveis(scriptsRes.value);
      }
      if (conversationsRes.status === "fulfilled") {
        const mapped = await Promise.all(
          conversationsRes.value.map(async (conversation: WaConversa): Promise<ContatoConversa> => {
            const messages = await listarMensagens(conversation.numero);
            return {
              id: conversation.id,
              numero: conversation.numero,
              nome: conversation.nome_contato || conversation.numero,
              avatar: "/placeholder.svg",
              ultimaMensagem: conversation.ultima || "",
              horario: new Date(conversation.ultima_em).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              naoLidas: conversation.nao_lidas,
              statusAtendimento: conversation.nao_lidas > 0 ? "em_atendimento" : "todas",
              statusComercial: "Lead",
              pipelineEtapa: "Prospecção",
              responsavel: { nome: "Equipe", avatar: "/placeholder.svg" },
              tags: [],
              favorito: false,
              email: "",
              empresa: "",
              cargo: "",
              origem: "WhatsApp",
              dataCadastro: new Date(conversation.ultima_em).toLocaleDateString("pt-BR"),
              online: false,
              notas: [],
              interacoes: [],
              mensagens: messages.map((message: WaMensagem) => ({
                id: message.id,
                direcao: message.direcao === "out" ? "out" : "in",
                texto: message.texto || "",
                horario: new Date(message.criado_em).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                statusEnvio: message.lida ? "lido" : "entregue",
              })),
              leadId: conversation.lead_id ?? undefined,
            };
          }),
        );
        setContatos(mapped);
        setContatoAtivoId((current) => current || mapped[0]?.id || "");
      }
    } catch (error) {
      console.error("Falha ao carregar conversas WhatsApp", error);
    }
  }, []);

  useEffect(() => {
    carregarDadosIniciais();
  }, [carregarDadosIniciais]);

  // Scroll automático ao fim do chat
  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [contatoAtivo?.mensagens]);

  // Supabase Realtime Subscription para novas mensagens recebidas
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;
    void getActiveOrganizationContext().then((context) => {
      if (cancelled) return;
      channel = supabase
        .channel(`wa_inbox_realtime:${context.orgId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "wa_mensagens",
            filter: `org_id=eq.${context.orgId}`,
          },
          (payload) => {
            const nova = payload.new as {
              numero: string;
              texto: string | null;
              direcao: string;
              nome_contato: string | null;
              criado_em: string;
            };

            if (nova && nova.numero) {
              setContatos((prev) => {
                const idx = prev.findIndex(
                  (c) => c.numero.replace(/\D/g, "") === nova.numero.replace(/\D/g, ""),
                );

                const horaFormatada = new Date(nova.criado_em || Date.now()).toLocaleTimeString(
                  "pt-BR",
                  { hour: "2-digit", minute: "2-digit" },
                );

                if (idx >= 0) {
                  const copia = [...prev];
                  const target = { ...copia[idx] };
                  target.ultimaMensagem = nova.texto || "Mensagem recebida";
                  target.horario = horaFormatada;
                  if (nova.direcao === "in") {
                    target.naoLidas += 1;
                  }
                  target.mensagens = [
                    ...target.mensagens,
                    {
                      id: `rt-${Date.now()}`,
                      direcao: nova.direcao === "out" ? "out" : "in",
                      texto: nova.texto || "",
                      horario: horaFormatada,
                      statusEnvio: "lido",
                    },
                  ];
                  copia[idx] = target;
                  return copia;
                }
                return prev;
              });
            }
          },
        )
        .subscribe();
    });

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  // Selecionar conversa
  const selecionarContato = useCallback((c: ContatoConversa) => {
    setContatoAtivoId(c.id);
    setViewMobile("chat");

    // Zera contador de não lidas localmente e no banco
    if (c.naoLidas > 0) {
      setContatos((prev) =>
        prev.map((item) => (item.id === c.id ? { ...item, naoLidas: 0 } : item)),
      );
      marcarConversaLida(c.numero.replace(/\D/g, "")).catch(() => {});
    }
  }, []);

  // Enviar Mensagem
  const enviarMensagem = async () => {
    if (!contatoAtivo || !textoMensagem.trim() || enviando) return;

    const texto = textoMensagem.trim();
    const numeroLimpo = contatoAtivo.numero.replace(/\D/g, "");
    setEnviando(true);
    setTextoMensagem("");

    const horaAtual = new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Atualização otimista imediata na thread
    const novaMensagemId = `msg-out-${Date.now()}`;
    setContatos((prev) =>
      prev.map((c) => {
        if (c.id === contatoAtivo.id) {
          return {
            ...c,
            ultimaMensagem: texto,
            horario: horaAtual,
            mensagens: [
              ...c.mensagens,
              {
                id: novaMensagemId,
                direcao: "out",
                texto,
                horario: horaAtual,
                statusEnvio: "enviado",
              },
            ],
          };
        }
        return c;
      }),
    );

    try {
      const resp = await responderConversa(contatoAtivo.id, texto);
      if (!resp.ok) {
        toast.info(resp.error || "Mensagem registrada no histórico da conversa.");
      } else {
        toast.success("Mensagem enviada com sucesso.");
      }
      registrarInteracaoWa(contatoAtivo.leadId ?? null, "mensagem_enviada", {
        numero: numeroLimpo,
        texto,
      });
    } catch {
      toast.info("Mensagem registrada e armazenada na conversa.");
    } finally {
      setEnviando(false);
      textareaRef.current?.focus();
    }
  };

  // Resposta Rápida (Script)
  const aplicarScript = (script: WaScript) => {
    if (!contatoAtivo || !script.mensagem) return;
    // Substitui variáveis do template: {nome}, {empresa}
    const primeiroNome = contatoAtivo.nome.split(" ")[0];
    const textoResolvido = script.mensagem
      .replace(/{nome}/gi, primeiroNome)
      .replace(/{empresa}/gi, contatoAtivo.empresa || "sua empresa");

    setTextoMensagem(textoResolvido);
    setComposerTab("mensagem");
    textareaRef.current?.focus();
    toast.success(`Script "${script.nome}" carregado na composição.`);
  };

  // Alternar Favorito
  const alternarFavorito = () => {
    if (!contatoAtivo) return;
    const novoValor = !contatoAtivo.favorito;
    setContatos((prev) =>
      prev.map((c) => (c.id === contatoAtivo.id ? { ...c, favorito: novoValor } : c)),
    );
    toast.success(novoValor ? "Conversa favoritada." : "Removida dos favoritos.");
  };

  // Marcar como Cliente
  const marcarComoCliente = async () => {
    if (!contatoAtivo) return;
    const horaAtual = new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    setContatos((prev) =>
      prev.map((c) => {
        if (c.id === contatoAtivo.id) {
          return {
            ...c,
            statusComercial: "Cliente",
            pipelineEtapa: "Fechamento",
            interacoes: [
              {
                id: `int-${Date.now()}`,
                tipo: "status",
                titulo: "Lead convertido em Cliente",
                subtitulo: "Etapa alterada para Fechamento",
                horario: horaAtual,
                cor: "emerald",
              },
              ...c.interacoes,
            ],
          };
        }
        return c;
      }),
    );

    if (contatoAtivo.leadId) {
      await atualizarLeadCrm(contatoAtivo.leadId, { status: "Ganho" });
    }
    registrarInteracaoWa(contatoAtivo.leadId ?? null, "marcar_cliente", {
      nome: contatoAtivo.nome,
    });
    toast.success(`🎉 ${contatoAtivo.nome} marcado como Cliente!`);
  };

  // Arquivar Conversa
  const arquivarConversa = () => {
    if (!contatoAtivo) return;
    setContatos((prev) =>
      prev.map((c) => (c.id === contatoAtivo.id ? { ...c, statusAtendimento: "arquivada" } : c)),
    );
    toast.success(`Conversa de ${contatoAtivo.nome} arquivada.`);
  };

  // Abrir modal de edição de contato
  const abrirModalEditar = () => {
    if (!contatoAtivo) return;
    setEditNome(contatoAtivo.nome);
    setEditEmail(contatoAtivo.email);
    setEditEmpresa(contatoAtivo.empresa);
    setEditCargo(contatoAtivo.cargo);
    setEditTelefone(contatoAtivo.numero);
    setModalEditarContato(true);
  };

  // Salvar Edição do Contato
  const salvarEdicaoContato = async () => {
    if (!contatoAtivo) return;
    setContatos((prev) =>
      prev.map((c) => {
        if (c.id === contatoAtivo.id) {
          return {
            ...c,
            nome: editNome.trim() || c.nome,
            email: editEmail.trim() || c.email,
            empresa: editEmpresa.trim() || c.empresa,
            cargo: editCargo.trim() || c.cargo,
            numero: editTelefone.trim() || c.numero,
          };
        }
        return c;
      }),
    );

    if (contatoAtivo.leadId) {
      await atualizarLeadCrm(contatoAtivo.leadId, {
        owner_name: editNome,
        email: editEmail,
        business_name: editEmpresa,
        cargo: editCargo,
        phone: editTelefone,
      });
    }

    setModalEditarContato(false);
    toast.success("Dados do contato atualizados com sucesso.");
  };

  // Adicionar Nota
  const salvarNovaNota = async () => {
    if (!contatoAtivo || !novaNotaTexto.trim()) return;
    const horaAtual = new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const novaNota: NotaLead = {
      id: `nota-${Date.now()}`,
      texto: novaNotaTexto.trim(),
      autor: "Marcos Gonçalves",
      horario: horaAtual,
    };

    setContatos((prev) =>
      prev.map((c) => {
        if (c.id === contatoAtivo.id) {
          return {
            ...c,
            notas: [novaNota, ...c.notas],
            interacoes: [
              {
                id: `int-${Date.now()}`,
                tipo: "nota",
                titulo: "Nota adicionada",
                subtitulo: novaNota.texto.substring(0, 45) + "...",
                horario: horaAtual,
                cor: "amber",
              },
              ...c.interacoes,
            ],
          };
        }
        return c;
      }),
    );

    if (contatoAtivo.leadId) {
      await atualizarLeadCrm(contatoAtivo.leadId, { notes: novaNotaTexto });
    }

    setNovaNotaTexto("");
    setModalAdicionarNota(false);
    toast.success("Nota salva com sucesso.");
  };

  // Adicionar Tag
  const adicionarTag = () => {
    if (!contatoAtivo || !novaTagTexto.trim()) return;
    const tagFormatada = novaTagTexto.trim();
    if (contatoAtivo.tags.includes(tagFormatada)) {
      toast.info("Esta etiqueta já existe no contato.");
      return;
    }
    setContatos((prev) =>
      prev.map((c) => (c.id === contatoAtivo.id ? { ...c, tags: [...c.tags, tagFormatada] } : c)),
    );
    setNovaTagTexto("");
    setMostrarInputTag(false);
    toast.success(`Etiqueta "${tagFormatada}" aplicada.`);
  };

  // Remover Tag
  const removerTag = (tagParaRemover: string) => {
    if (!contatoAtivo) return;
    setContatos((prev) =>
      prev.map((c) =>
        c.id === contatoAtivo.id ? { ...c, tags: c.tags.filter((t) => t !== tagParaRemover) } : c,
      ),
    );
    toast.success(`Etiqueta "${tagParaRemover}" removida.`);
  };

  // Alterar Status Comercial (Lead, Em qualificação, etc.)
  const alterarStatusComercial = async (novoStatus: StatusComercial) => {
    if (!contatoAtivo) return;
    setContatos((prev) =>
      prev.map((c) => (c.id === contatoAtivo.id ? { ...c, statusComercial: novoStatus } : c)),
    );
    if (contatoAtivo.leadId) {
      await atualizarLeadCrm(contatoAtivo.leadId, { status: novoStatus });
    }
    toast.success(`Status comercial alterado para "${novoStatus}".`);
  };

  // Alterar Pipeline Etapa
  const alterarPipelineEtapa = async (novaEtapa: PipelineEtapa) => {
    if (!contatoAtivo) return;
    setContatos((prev) =>
      prev.map((c) => (c.id === contatoAtivo.id ? { ...c, pipelineEtapa: novaEtapa } : c)),
    );
    toast.success(`Pipeline atualizado para "${novaEtapa}".`);
  };

  // Inserir Emoji rápido
  const inserirEmoji = (emoji: string) => {
    setTextoMensagem((prev) => prev + emoji);
    setMostrarEmojis(false);
    textareaRef.current?.focus();
  };

  // Enviar anexo simulado seguro
  const enviarAnexoSimulado = (nome: string, tamanho: string) => {
    if (!contatoAtivo) return;
    const horaAtual = new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    setContatos((prev) =>
      prev.map((c) => {
        if (c.id === contatoAtivo.id) {
          return {
            ...c,
            ultimaMensagem: `Enviou ${nome}`,
            horario: horaAtual,
            mensagens: [
              ...c.mensagens,
              {
                id: `msg-doc-${Date.now()}`,
                direcao: "out",
                texto: `Arquivo anexado: ${nome}`,
                horario: horaAtual,
                statusEnvio: "lido",
                anexo: {
                  tipo: "pdf",
                  nome,
                  tamanho,
                  url: "#",
                },
              },
            ],
          };
        }
        return c;
      }),
    );
    setModalAnexo(false);
    toast.success(`Documento "${nome}" anexado à conversa.`);
  };

  // Filtragem da Lista de Conversas
  const contatosFiltrados = useMemo(() => {
    return contatos.filter((c) => {
      // Filtro de Tabs
      if (tabFiltro === "nao_lidas" && c.naoLidas === 0) return false;
      if (tabFiltro === "em_atendimento" && c.statusAtendimento !== "em_atendimento") return false;

      // Filtro de Tag
      if (filtroTag && !c.tags.includes(filtroTag)) return false;

      // Filtro de Busca
      if (busca.trim()) {
        const termo = busca.toLowerCase();
        const matchNome = c.nome.toLowerCase().includes(termo);
        const matchNumero = c.numero.toLowerCase().includes(termo);
        const matchEmpresa = c.empresa.toLowerCase().includes(termo);
        const matchMensagem = c.ultimaMensagem.toLowerCase().includes(termo);
        return matchNome || matchNumero || matchEmpresa || matchMensagem;
      }

      return true;
    });
  }, [contatos, tabFiltro, filtroTag, busca]);

  return (
    <div className="w-full space-y-4 animate-in fade-in duration-200">
      {/* ======================================================== */}
      {/* 1. SEIS CARDS DE INDICADORES / KPIS (ETAPA 4 DO PROMPT)  */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {/* KPI 1: Conversas ativas */}
        <div className="flex items-center gap-3.5 rounded-xl border border-[#1b2334] bg-[#0c101a]/95 p-3.5 shadow-sm transition-all hover:border-emerald-500/30">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xl font-bold tracking-tight text-white">
              {kpis.conversasAtivas}
            </div>
            <div className="truncate text-xs font-medium text-home-muted">Conversas ativas</div>
          </div>
        </div>

        {/* KPI 2: Não lidas */}
        <div className="flex items-center gap-3.5 rounded-xl border border-[#1b2334] bg-[#0c101a]/95 p-3.5 shadow-sm transition-all hover:border-rose-500/30">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400">
            <CircleDot className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xl font-bold tracking-tight text-white">{kpis.naoLidas}</div>
            <div className="truncate text-xs font-medium text-home-muted">Não lidas</div>
          </div>
        </div>

        {/* KPI 3: Aguardando resposta */}
        <div className="flex items-center gap-3.5 rounded-xl border border-[#1b2334] bg-[#0c101a]/95 p-3.5 shadow-sm transition-all hover:border-amber-500/30">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
            <Clock className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xl font-bold tracking-tight text-white">
              {kpis.aguardandoResposta}
            </div>
            <div className="truncate text-xs font-medium text-home-muted">Aguardando resposta</div>
          </div>
        </div>

        {/* KPI 4: Em atendimento */}
        <div className="flex items-center gap-3.5 rounded-xl border border-[#1b2334] bg-[#0c101a]/95 p-3.5 shadow-sm transition-all hover:border-blue-500/30">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
            <UserCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xl font-bold tracking-tight text-white">{kpis.emAtendimento}</div>
            <div className="truncate text-xs font-medium text-home-muted">Em atendimento</div>
          </div>
        </div>

        {/* KPI 5: Novos contatos */}
        <div className="flex items-center gap-3.5 rounded-xl border border-[#1b2334] bg-[#0c101a]/95 p-3.5 shadow-sm transition-all hover:border-emerald-500/30">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
            <UserPlus className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xl font-bold tracking-tight text-white">{kpis.novosContatos}</div>
            <div className="truncate text-xs font-medium text-home-muted">Novos contatos</div>
          </div>
        </div>

        {/* KPI 6: Fechamentos hoje */}
        <div className="flex items-center gap-3.5 rounded-xl border border-[#1b2334] bg-[#0c101a]/95 p-3.5 shadow-sm transition-all hover:border-emerald-500/30">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xl font-bold tracking-tight text-white">
              {kpis.fechamentosHoje}
            </div>
            <div className="truncate text-xs font-medium text-home-muted">Fechamentos hoje</div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. LAYOUT PRINCIPAL DE 3 COLUNAS (ETAPAS 5, 6 E 11)       */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 h-[calc(100vh-270px)] min-h-[660px]">
        {/* ======================================================== */}
        {/* COLUNA ESQUERDA: LISTA DE CONVERSAS (Lg: col-span-3)     */}
        {/* ======================================================== */}
        <div
          className={cn(
            "flex flex-col rounded-2xl border border-[#1b2334] bg-[#0c101a] overflow-hidden shadow-xl lg:col-span-3 xl:col-span-3",
            viewMobile !== "lista" && "hidden lg:flex",
          )}
        >
          {/* Top Bar: Busca e Filtro */}
          <div className="p-3.5 border-b border-[#1b2334] space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-home-muted" />
                <Input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar conversas, contatos ou mensagens..."
                  className="h-9 w-full rounded-xl border-[#1b2334] bg-[#111723] pl-9 pr-7 text-xs text-white placeholder:text-home-muted/60 focus-visible:ring-1 focus-visible:ring-home-orange"
                />
                {busca && (
                  <button
                    onClick={() => setBusca("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-home-muted hover:text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Botão de Filtro */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuFiltroAberto(!menuFiltroAberto)}
                  title="Filtros"
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl border border-[#1b2334] bg-[#111723] text-home-muted transition-all hover:border-white/20 hover:text-white",
                    filtroTag && "border-home-orange text-home-orange",
                  )}
                >
                  <Filter className="h-4 w-4" />
                </button>

                {/* Popover de Filtros */}
                {menuFiltroAberto && (
                  <div className="absolute right-0 top-11 z-50 w-52 rounded-xl border border-[#1b2334] bg-[#111723] p-2 shadow-2xl animate-in fade-in zoom-in-95">
                    <div className="px-2 py-1 text-[11px] font-bold text-home-muted uppercase tracking-wider">
                      Filtrar por etiqueta
                    </div>
                    <button
                      onClick={() => {
                        setFiltroTag(null);
                        setMenuFiltroAberto(false);
                      }}
                      className={cn(
                        "w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors",
                        filtroTag === null
                          ? "text-home-orange font-bold bg-white/5"
                          : "text-white hover:bg-white/5",
                      )}
                    >
                      Todas as etiquetas
                    </button>
                    {["Restaurante", "São Paulo", "Quente", "Advocacia", "Saúde"].map((tag) => (
                      <button
                        key={tag}
                        onClick={() => {
                          setFiltroTag(tag);
                          setMenuFiltroAberto(false);
                        }}
                        className={cn(
                          "w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors",
                          filtroTag === tag
                            ? "text-home-orange font-bold bg-white/5"
                            : "text-white hover:bg-white/5",
                        )}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Status Pills / Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setTabFiltro("todas")}
                className={cn(
                  "rounded-xl px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap",
                  tabFiltro === "todas"
                    ? "border border-home-orange text-home-orange bg-home-orange/10 shadow-[0_0_12px_rgba(255,98,0,0.2)]"
                    : "border border-transparent bg-[#111723] text-home-muted hover:text-white",
                )}
              >
                Todas ({contatos.length})
              </button>
              <button
                type="button"
                onClick={() => setTabFiltro("nao_lidas")}
                className={cn(
                  "rounded-xl px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap",
                  tabFiltro === "nao_lidas"
                    ? "border border-home-orange text-home-orange bg-home-orange/10 shadow-[0_0_12px_rgba(255,98,0,0.2)]"
                    : "border border-transparent bg-[#111723] text-home-muted hover:text-white",
                )}
              >
                Não lidas ({contatos.filter((c) => c.naoLidas > 0).length})
              </button>
              <button
                type="button"
                onClick={() => setTabFiltro("em_atendimento")}
                className={cn(
                  "rounded-xl px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap",
                  tabFiltro === "em_atendimento"
                    ? "border border-home-orange text-home-orange bg-home-orange/10 shadow-[0_0_12px_rgba(255,98,0,0.2)]"
                    : "border border-transparent bg-[#111723] text-home-muted hover:text-white",
                )}
              >
                Em atendimento (
                {contatos.filter((c) => c.statusAtendimento === "em_atendimento").length})
              </button>
            </div>
          </div>

          {/* Lista Rolável de Contatos */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-white/10">
            {contatosFiltrados.length === 0 ? (
              <div className="p-8 text-center text-xs text-home-muted">
                Nenhuma conversa encontrada para o filtro atual.
              </div>
            ) : (
              contatosFiltrados.map((c) => {
                const ativo = c.id === contatoAtivoId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => selecionarContato(c)}
                    className={cn(
                      "group relative flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-all",
                      ativo
                        ? "border border-home-orange bg-[#131926] shadow-sm"
                        : "border border-transparent hover:border-white/5 hover:bg-white/[0.03]",
                    )}
                  >
                    {/* Avatar com badge WhatsApp verde oficial */}
                    <div className="relative shrink-0">
                      <img
                        src={c.avatar}
                        alt={c.nome}
                        onError={(e) => {
                          // Fallback gracioso
                          (e.target as HTMLImageElement).src = "/images/avatars/carla_mendes.jpg";
                        }}
                        className="h-10 w-10 rounded-full object-cover ring-1 ring-white/10"
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#22c55e] text-white ring-2 ring-[#0c101a]">
                        <SiWhatsapp className="h-2 w-2" />
                      </span>
                    </div>

                    {/* Informações centrais */}
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1 min-w-0">
                          <span
                            className={cn(
                              "truncate text-xs font-bold",
                              ativo ? "text-white" : "text-white group-hover:text-white",
                            )}
                          >
                            {c.nome}
                          </span>
                          <span className="text-[#22c55e]">
                            <SiWhatsapp className="h-2.5 w-2.5" />
                          </span>
                        </div>
                        <span className="shrink-0 text-[10px] text-home-muted font-medium">
                          {c.horario}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-xs text-home-muted group-hover:text-slate-300">
                          {c.ultimaMensagemTipo === "imagem" && "📷 "}
                          {c.ultimaMensagemTipo === "documento" && "📄 "}
                          {c.ultimaMensagem}
                        </p>

                        {/* Badge de não lidas laranja oficial */}
                        {c.naoLidas > 0 && (
                          <span className="flex h-4 min-w-[16px] shrink-0 items-center justify-center rounded-full bg-home-orange px-1 text-[10px] font-bold text-white shadow-[0_0_8px_rgba(255,98,0,0.6)]">
                            {c.naoLidas}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* COLUNA CENTRAL: CHAT / THREAD DA CONVERSA (Lg: col-span-5) */}
        {/* ======================================================== */}
        <div
          className={cn(
            "flex flex-col rounded-2xl border border-[#1b2334] bg-[#0c101a] overflow-hidden shadow-xl lg:col-span-5 xl:col-span-6",
            viewMobile !== "chat" && "hidden lg:flex",
          )}
        >
          {contatoAtivo ? (
            <>
              {/* Header do Chat Central */}
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-[#1b2334] bg-[#0c101a] px-4">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Botão Voltar no Mobile */}
                  <button
                    onClick={() => setViewMobile("lista")}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 lg:hidden text-home-muted hover:text-white"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>

                  {/* Avatar do Contato */}
                  <div className="relative shrink-0">
                    <img
                      src={contatoAtivo.avatar}
                      alt={contatoAtivo.nome}
                      className="h-10 w-10 rounded-full object-cover ring-1 ring-white/10"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#22c55e] text-white ring-2 ring-[#0c101a]">
                      <SiWhatsapp className="h-2 w-2" />
                    </span>
                  </div>

                  {/* Nome e Telefone */}
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-extrabold text-white">
                        {contatoAtivo.nome}
                      </span>
                      {/* Pill de Status Comercial (Lead v) */}
                      <div className="relative group/status">
                        <button
                          type="button"
                          className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-[#0d2218] px-2 py-0.5 text-[10px] font-semibold text-emerald-400 hover:border-emerald-500/60 transition-all"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          <span>{contatoAtivo.statusComercial}</span>
                          <ChevronDown className="h-2.5 w-2.5 text-emerald-400/80" />
                        </button>
                        <div className="absolute left-0 top-6 z-50 hidden group-hover/status:block w-36 rounded-xl border border-[#1b2334] bg-[#111723] p-1.5 shadow-xl">
                          {(
                            [
                              "Lead",
                              "Em qualificação",
                              "Proposta",
                              "Negociação",
                              "Cliente",
                              "Perdido",
                            ] as StatusComercial[]
                          ).map((st) => (
                            <button
                              key={st}
                              onClick={() => alterarStatusComercial(st)}
                              className="w-full text-left px-2 py-1 text-xs text-white hover:bg-white/5 rounded-lg"
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-home-muted">{contatoAtivo.numero}</div>
                  </div>
                </div>

                {/* Ações do Header: Favorito, Tags, 3 Pontos */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={alternarFavorito}
                    title={contatoAtivo.favorito ? "Remover dos favoritos" : "Favoritar"}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-[#141a26] transition-all hover:border-white/20",
                      contatoAtivo.favorito
                        ? "text-amber-400 border-amber-500/30"
                        : "text-home-muted hover:text-white",
                    )}
                  >
                    <Star className={cn("h-4 w-4", contatoAtivo.favorito && "fill-amber-400")} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setMostrarInputTag(!mostrarInputTag)}
                    title="Etiquetas"
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-[#141a26] text-home-muted transition-all hover:border-white/20 hover:text-white"
                  >
                    <Tag className="h-4 w-4" />
                  </button>

                  {/* Mais opções */}
                  <div className="relative group/more">
                    <button
                      type="button"
                      title="Mais opções"
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-[#141a26] text-home-muted transition-all hover:border-white/20 hover:text-white"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    <div className="absolute right-0 top-10 z-50 hidden group-hover/more:block w-44 rounded-xl border border-[#1b2334] bg-[#111723] p-1.5 shadow-xl">
                      <button
                        onClick={marcarComoCliente}
                        className="w-full text-left px-2.5 py-1.5 text-xs text-white hover:bg-white/5 rounded-lg flex items-center gap-2"
                      >
                        <UserCheck className="h-3.5 w-3.5 text-home-orange" /> Marcar como cliente
                      </button>
                      <button
                        onClick={arquivarConversa}
                        className="w-full text-left px-2.5 py-1.5 text-xs text-white hover:bg-white/5 rounded-lg flex items-center gap-2"
                      >
                        <Archive className="h-3.5 w-3.5 text-home-muted" /> Arquivar conversa
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(contatoAtivo.numero);
                          toast.success("Telefone copiado para a área de transferência.");
                        }}
                        className="w-full text-left px-2.5 py-1.5 text-xs text-white hover:bg-white/5 rounded-lg flex items-center gap-2"
                      >
                        <Phone className="h-3.5 w-3.5 text-home-muted" /> Copiar telefone
                      </button>
                    </div>
                  </div>

                  {/* Botão Ver CRM no Mobile */}
                  <button
                    onClick={() => setViewMobile("crm")}
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-[#141a26] text-home-muted lg:hidden hover:text-white"
                  >
                    <User className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Input Rápido de Tag no topo se ativado */}
              {mostrarInputTag && (
                <div className="flex items-center gap-2 border-b border-[#1b2334] bg-[#111723] px-4 py-2 animate-in fade-in">
                  <Tag className="h-3.5 w-3.5 text-home-orange" />
                  <Input
                    value={novaTagTexto}
                    onChange={(e) => setNovaTagTexto(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && adicionarTag()}
                    placeholder="Adicionar nova etiqueta (ex: Quente, Restaurante)..."
                    className="h-7 text-xs bg-[#161d2b] border-[#1b2334] text-white"
                  />
                  <Button
                    size="sm"
                    onClick={adicionarTag}
                    className="h-7 px-2.5 text-xs bg-home-orange text-white"
                  >
                    Adicionar
                  </Button>
                </div>
              )}

              {/* Área Rolável de Mensagens (Thread) */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#080b12] scrollbar-thin scrollbar-thumb-white/10">
                {/* Separador de Data: "Hoje" */}
                <div className="flex items-center justify-center my-2">
                  <span className="rounded-full border border-white/5 bg-[#141a26] px-3.5 py-1 text-[11px] font-medium text-home-muted shadow-sm">
                    Hoje
                  </span>
                </div>

                {/* Balões de Mensagem */}
                {contatoAtivo.mensagens.map((m) => {
                  const ehSaida = m.direcao === "out";
                  return (
                    <div
                      key={m.id}
                      className={cn("flex w-full", ehSaida ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={cn(
                          "relative max-w-[85%] rounded-2xl p-3.5 shadow-md leading-relaxed text-sm",
                          ehSaida
                            ? "rounded-tr-xs bg-[#0e3b2e] border border-emerald-500/20 text-[#e6f4ee]"
                            : "rounded-tl-xs bg-[#151c2a] border border-white/5 text-[#e1e7f0]",
                        )}
                      >
                        {/* Se houver documento/anexo */}
                        {m.anexo && (
                          <div className="mb-2.5 flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-[#09261d] p-3 shadow-inner">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-600 text-white font-black text-xs uppercase shadow-sm">
                              PDF
                            </div>
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <div className="truncate text-xs font-bold text-white">
                                {m.anexo.nome}
                              </div>
                              <div className="text-[11px] text-emerald-300/80">
                                {m.anexo.tamanho}
                              </div>
                            </div>
                            <button
                              onClick={() => toast.success(`Abrindo ${m.anexo?.nome}...`)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}

                        {/* Texto da mensagem */}
                        <div className="whitespace-pre-wrap break-words">{m.texto}</div>

                        {/* Horário e confirmação de entrega */}
                        <div className="mt-1.5 flex items-center justify-end gap-1 text-[10px] text-home-muted/80">
                          <span>{m.horario}</span>
                          {ehSaida && (
                            <span className="text-emerald-400">
                              <CheckCheck className="h-3 w-3 inline" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div ref={fimRef} />
              </div>

              {/* ======================================================== */}
              {/* COMPOSER INFERIOR (TABS: MENSAGEM / RESPOSTA RÁPIDA)     */}
              {/* ======================================================== */}
              <div className="border-t border-[#1b2334] bg-[#0c101a] p-3 space-y-2.5">
                {/* Tabs do Composer */}
                <div className="flex items-center gap-4 px-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setComposerTab("mensagem")}
                    className={cn(
                      "font-bold transition-colors pb-0.5",
                      composerTab === "mensagem"
                        ? "text-home-orange border-b-2 border-home-orange"
                        : "text-home-muted hover:text-white",
                    )}
                  >
                    Mensagem
                  </button>
                  <button
                    type="button"
                    onClick={() => setComposerTab("resposta_rapida")}
                    className={cn(
                      "font-bold transition-colors pb-0.5 flex items-center gap-1",
                      composerTab === "resposta_rapida"
                        ? "text-home-orange border-b-2 border-home-orange"
                        : "text-home-muted hover:text-white",
                    )}
                  >
                    <Sparkles className="h-3 w-3" />
                    Resposta rápida
                  </button>
                </div>

                {/* Gaveta de Respostas Rápidas */}
                {composerTab === "resposta_rapida" && (
                  <div className="rounded-xl border border-[#1b2334] bg-[#111723] p-3 space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">
                        Escolha um script autorizado
                      </span>
                      <Input
                        value={buscaScript}
                        onChange={(e) => setBuscaScript(e.target.value)}
                        placeholder="Buscar script..."
                        className="h-6 w-36 text-[11px] bg-[#161d2b] border-[#1b2334]"
                      />
                    </div>
                    <div className="max-h-36 overflow-y-auto space-y-1.5 scrollbar-thin">
                      {scriptsDisponiveis.length === 0 ? (
                        <div className="text-xs text-home-muted py-2">
                          Nenhum script customizado salvo. Usando scripts padrão do SDR:
                        </div>
                      ) : null}

                      {/* Scripts Padrão + Customizados */}
                      {[
                        {
                          id: "s-1",
                          nome: "Apresentação e Cases de Restaurante",
                          mensagem:
                            "Olá, {nome}! Tudo bem? Segue nossa apresentação oficial com cases de sucesso para restaurantes em São Paulo.",
                        },
                        {
                          id: "s-2",
                          nome: "Agendamento de Demonstração",
                          mensagem:
                            "Olá, {nome}! Conseguimos agendar uma breve demonstração de 15 minutos amanhã às 14h?",
                        },
                        {
                          id: "s-3",
                          nome: "Envio de Proposta Comercial",
                          mensagem:
                            "Prezada {nome}, elaborei a proposta personalizada com as melhores condições para o {empresa}. Quando puder conversar?",
                        },
                        ...scriptsDisponiveis,
                      ]
                        .filter(
                          (s) =>
                            !buscaScript ||
                            s.nome.toLowerCase().includes(buscaScript.toLowerCase()),
                        )
                        .map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => aplicarScript(s as WaScript)}
                            className="w-full text-left p-2 rounded-lg border border-white/5 bg-[#161d2b] hover:border-home-orange/40 hover:bg-[#1a2233] transition-all"
                          >
                            <div className="text-xs font-bold text-white">{s.nome}</div>
                            <div className="truncate text-[11px] text-home-muted">{s.mensagem}</div>
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                {/* Popover de Emojis Rápidos */}
                {mostrarEmojis && (
                  <div className="flex items-center gap-2 p-2 rounded-xl border border-[#1b2334] bg-[#111723] animate-in fade-in">
                    {["👋", "😊", "👍", "🙏", "🚀", "💼", "📊", "🤝", "🎯", "✅"].map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => inserirEmoji(em)}
                        className="text-lg hover:scale-125 transition-transform"
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                )}

                {/* Textarea e Toolbar */}
                <div className="relative rounded-xl border border-[#1b2334] bg-[#111723] p-2.5 focus-within:border-home-orange/60 transition-all">
                  <Textarea
                    ref={textareaRef}
                    value={textoMensagem}
                    onChange={(e) => setTextoMensagem(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        enviarMensagem();
                      }
                    }}
                    placeholder="Digite uma mensagem..."
                    rows={2}
                    className="w-full resize-none border-none bg-transparent p-0 text-xs text-white placeholder:text-home-muted/50 focus-visible:ring-0 leading-relaxed"
                  />

                  {/* Toolbar Inferior: Emojis, Clips, Imagens, Documentos e Botão Enviar Laranja */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5 text-home-muted">
                      <button
                        type="button"
                        onClick={() => setMostrarEmojis(!mostrarEmojis)}
                        title="Inserir emoji"
                        className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/10 hover:text-white transition-all"
                      >
                        <Smile className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setModalAnexo(true)}
                        title="Anexar arquivo"
                        className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/10 hover:text-white transition-all"
                      >
                        <Paperclip className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setModalAnexo(true)}
                        title="Enviar imagem"
                        className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/10 hover:text-white transition-all"
                      >
                        <ImageIcon className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setModalAnexo(true)}
                        title="Enviar documento"
                        className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/10 hover:text-white transition-all"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Botão de Envio Laranja Vibrante Flow Business */}
                    <button
                      type="button"
                      onClick={enviarMensagem}
                      disabled={enviando || !textoMensagem.trim()}
                      title="Enviar mensagem (Enter)"
                      className="flex h-8 w-8 items-center justify-center rounded-xl bg-home-orange text-white shadow-[0_0_15px_rgba(255,98,0,0.5)] transition-all hover:bg-orange-600 active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
                    >
                      {enviando ? (
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                      ) : (
                        <SendHorizontal className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-8 text-center text-home-muted">
              Selecione uma conversa ao lado para iniciar o atendimento.
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* COLUNA DIREITA: PAINEL CRM DO LEAD (Lg: col-span-4)       */}
        {/* ======================================================== */}
        <div
          className={cn(
            "flex flex-col rounded-2xl border border-[#1b2334] bg-[#0c101a] p-4 overflow-y-auto space-y-4 shadow-xl scrollbar-thin scrollbar-thumb-white/10 lg:col-span-4 xl:col-span-3",
            viewMobile !== "crm" && "hidden lg:flex",
          )}
        >
          {contatoAtivo ? (
            <>
              {/* Botão Voltar no Mobile */}
              <button
                onClick={() => setViewMobile("chat")}
                className="flex items-center gap-1.5 text-xs text-home-muted lg:hidden hover:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Voltar para o chat
              </button>

              {/* Header do Contato */}
              <div className="flex items-center justify-between gap-3 border-b border-[#1b2334] pb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={contatoAtivo.crmAvatar || contatoAtivo.avatar}
                      alt={contatoAtivo.nome}
                      className="h-12 w-12 rounded-full object-cover ring-2 ring-emerald-500/30"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#22c55e] text-white ring-2 ring-[#0c101a]">
                      <SiWhatsapp className="h-2.5 w-2.5" />
                    </span>
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <div className="truncate text-sm font-extrabold text-white">
                      {contatoAtivo.nome}
                    </div>
                    <div className="truncate text-xs text-home-muted">{contatoAtivo.numero}</div>
                    <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      <span>Online</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  title="Opções do contato"
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-[#141a26] text-home-muted hover:text-white"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>

              {/* Botões de Ação Principais: Marcar como cliente & Arquivar */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={marcarComoCliente}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-home-orange px-3 py-2 text-xs font-bold text-white shadow-[0_0_12px_rgba(255,98,0,0.3)] transition-all hover:bg-orange-600 active:scale-95"
                >
                  <Check className="h-3.5 w-3.5" />
                  Marcar como cliente
                </button>

                <button
                  type="button"
                  onClick={arquivarConversa}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-[#141a26] px-3 py-2 text-xs font-semibold text-white transition-all hover:bg-white/10 active:scale-95"
                >
                  <Archive className="h-3.5 w-3.5 text-home-muted" />
                  Arquivar
                </button>
              </div>

              {/* Seção 1: Informações do contato */}
              <div className="space-y-2.5 rounded-xl border border-[#1b2334] bg-[#0e131f] p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Informações do contato
                  </span>
                  <button
                    type="button"
                    onClick={abrirModalEditar}
                    className="flex items-center gap-1 text-xs text-home-muted hover:text-white transition-colors"
                  >
                    <Edit2 className="h-3 w-3" /> Editar
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-home-muted">
                    <span className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" /> Nome
                    </span>
                    <span className="font-semibold text-white">{contatoAtivo.nome}</span>
                  </div>

                  <div className="flex items-center justify-between text-home-muted">
                    <span className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" /> Telefone
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-white">
                      {contatoAtivo.numero}
                      <SiWhatsapp className="h-3 w-3 text-[#22c55e]" />
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-home-muted">
                    <span className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" /> E-mail
                    </span>
                    <span className="font-semibold text-white truncate max-w-[150px]">
                      {contatoAtivo.email}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-home-muted">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5" /> Empresa
                    </span>
                    <span className="font-semibold text-white truncate max-w-[150px]">
                      {contatoAtivo.empresa}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-home-muted">
                    <span className="flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5" /> Cargo
                    </span>
                    <span className="font-semibold text-white">{contatoAtivo.cargo}</span>
                  </div>

                  <div className="flex items-center justify-between text-home-muted">
                    <span className="flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5" /> Origem
                    </span>
                    <span className="font-semibold text-white">{contatoAtivo.origem}</span>
                  </div>

                  <div className="flex items-center justify-between text-home-muted">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" /> Data de cadastro
                    </span>
                    <span className="font-semibold text-white">{contatoAtivo.dataCadastro}</span>
                  </div>
                </div>
              </div>

              {/* Seção 2: Status no CRM */}
              <div className="space-y-2.5 rounded-xl border border-[#1b2334] bg-[#0e131f] p-3.5">
                <div className="text-xs font-bold text-white uppercase tracking-wider">
                  Status no CRM
                </div>

                <div className="space-y-2.5 text-xs">
                  {/* Status Dropdown */}
                  <div className="flex items-center justify-between">
                    <span className="text-home-muted">Status</span>
                    <select
                      value={contatoAtivo.statusComercial}
                      onChange={(e) => alterarStatusComercial(e.target.value as StatusComercial)}
                      className="rounded-lg border border-emerald-500/30 bg-[#0d2218] px-2.5 py-1 text-xs font-semibold text-emerald-400 focus:outline-none"
                    >
                      <option value="Lead">Lead</option>
                      <option value="Em qualificação">Em qualificação</option>
                      <option value="Proposta">Proposta</option>
                      <option value="Negociação">Negociação</option>
                      <option value="Cliente">Cliente</option>
                      <option value="Perdido">Perdido</option>
                    </select>
                  </div>

                  {/* Pipeline Dropdown (Azul Oficial) */}
                  <div className="flex items-center justify-between">
                    <span className="text-home-muted">Pipeline</span>
                    <select
                      value={contatoAtivo.pipelineEtapa}
                      onChange={(e) => alterarPipelineEtapa(e.target.value as PipelineEtapa)}
                      className="rounded-lg border border-blue-500/40 bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white focus:outline-none shadow-sm"
                    >
                      <option value="Prospecção">Prospecção</option>
                      <option value="Qualificação">Qualificação</option>
                      <option value="Proposta">Proposta</option>
                      <option value="Negociação">Negociação</option>
                      <option value="Fechamento">Fechamento</option>
                    </select>
                  </div>

                  {/* Responsável */}
                  <div className="flex items-center justify-between">
                    <span className="text-home-muted">Responsável</span>
                    <div className="flex items-center gap-2">
                      <img
                        src={contatoAtivo.responsavel.avatar}
                        alt={contatoAtivo.responsavel.nome}
                        className="h-5 w-5 rounded-full object-cover ring-1 ring-white/20"
                      />
                      <span className="font-semibold text-white">
                        {contatoAtivo.responsavel.nome}
                      </span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-home-muted">Tags</span>
                      <button
                        type="button"
                        onClick={() => setMostrarInputTag(true)}
                        className="text-[11px] text-home-orange hover:text-orange-400 font-semibold"
                      >
                        + Adicionar
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {contatoAtivo.tags.map((t) => {
                        const ehQuente = t.toLowerCase() === "quente";
                        return (
                          <span
                            key={t}
                            className={cn(
                              "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold border",
                              ehQuente
                                ? "border-rose-500/40 bg-rose-500/15 text-rose-300"
                                : "border-white/10 bg-[#162030] text-slate-300",
                            )}
                          >
                            <span>{t}</span>
                            <button
                              type="button"
                              onClick={() => removerTag(t)}
                              className="text-home-muted hover:text-white"
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção 3: Notas */}
              <div className="space-y-2.5 rounded-xl border border-[#1b2334] bg-[#0e131f] p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Notas
                  </span>
                  <button
                    type="button"
                    onClick={() => setModalAdicionarNota(true)}
                    className="flex items-center gap-1 text-xs font-semibold text-home-orange hover:text-orange-400 transition-colors"
                  >
                    <Plus className="h-3 w-3" /> Adicionar nota
                  </button>
                </div>

                {contatoAtivo.notas.length === 0 ? (
                  <div className="text-xs text-home-muted py-1">Nenhuma nota adicionada ainda.</div>
                ) : (
                  contatoAtivo.notas.map((n) => (
                    <div
                      key={n.id}
                      className="rounded-xl border border-[#1b2334] bg-[#121724] p-3 space-y-1.5 shadow-sm"
                    >
                      <p className="text-xs text-slate-200 leading-relaxed">{n.texto}</p>
                      <div className="text-[10px] text-home-muted">
                        {n.autor} • {n.horario}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Seção 4: Últimas interações */}
              <div className="space-y-2.5 rounded-xl border border-[#1b2334] bg-[#0e131f] p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Últimas interações
                  </span>
                  <button
                    type="button"
                    onClick={() => setModalVerInteracoes(true)}
                    className="text-xs font-semibold text-home-orange hover:text-orange-400 transition-colors"
                  >
                    Ver todas
                  </button>
                </div>

                <div className="space-y-3">
                  {contatoAtivo.interacoes.slice(0, 3).map((it) => (
                    <div key={it.id} className="flex items-start gap-2.5 text-xs">
                      <div
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg p-1.5",
                          it.cor === "rose" && "bg-rose-500/15 text-rose-400",
                          it.cor === "emerald" && "bg-emerald-500/15 text-emerald-400",
                          it.cor === "blue" && "bg-blue-500/15 text-blue-400",
                          it.cor === "amber" && "bg-amber-500/15 text-amber-400",
                        )}
                      >
                        {it.tipo === "documento" && <FileText className="h-3.5 w-3.5" />}
                        {it.tipo === "conversa" && <MessageCircle className="h-3.5 w-3.5" />}
                        {it.tipo === "lead" && <User className="h-3.5 w-3.5" />}
                        {it.tipo === "nota" && <Edit2 className="h-3.5 w-3.5" />}
                        {it.tipo === "status" && <Check className="h-3.5 w-3.5" />}
                      </div>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="truncate font-semibold text-white">{it.titulo}</div>
                        <div className="truncate text-[11px] text-home-muted">{it.subtitulo}</div>
                      </div>
                      <span className="shrink-0 text-[10px] text-home-muted font-medium">
                        {it.horario}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-xs text-home-muted">
              Selecione um contato para consultar o CRM.
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. MODAIS E DIÁLOGOS DE AÇÃO                            */}
      {/* ======================================================== */}

      {/* Modal 1: Editar Contato */}
      {modalEditarContato && contatoAtivo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-[#1b2334] bg-[#0c101a] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1b2334] pb-3">
              <h3 className="text-base font-extrabold text-white">Editar Informações do Contato</h3>
              <button
                onClick={() => setModalEditarContato(false)}
                className="text-home-muted hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <Label className="text-home-muted">Nome Completo</Label>
                <Input
                  value={editNome}
                  onChange={(e) => setEditNome(e.target.value)}
                  className="mt-1 bg-[#111723] border-[#1b2334] text-white"
                />
              </div>

              <div>
                <Label className="text-home-muted">Telefone / WhatsApp</Label>
                <Input
                  value={editTelefone}
                  onChange={(e) => setEditTelefone(e.target.value)}
                  className="mt-1 bg-[#111723] border-[#1b2334] text-white"
                />
              </div>

              <div>
                <Label className="text-home-muted">E-mail</Label>
                <Input
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="mt-1 bg-[#111723] border-[#1b2334] text-white"
                />
              </div>

              <div>
                <Label className="text-home-muted">Empresa</Label>
                <Input
                  value={editEmpresa}
                  onChange={(e) => setEditEmpresa(e.target.value)}
                  className="mt-1 bg-[#111723] border-[#1b2334] text-white"
                />
              </div>

              <div>
                <Label className="text-home-muted">Cargo</Label>
                <Input
                  value={editCargo}
                  onChange={(e) => setEditCargo(e.target.value)}
                  className="mt-1 bg-[#111723] border-[#1b2334] text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setModalEditarContato(false)}
                className="border-[#1b2334] text-home-muted"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={salvarEdicaoContato}
                className="bg-home-orange text-white hover:bg-orange-600"
              >
                Salvar Alterações
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Adicionar Nota */}
      {modalAdicionarNota && contatoAtivo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-[#1b2334] bg-[#0c101a] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1b2334] pb-3">
              <h3 className="text-base font-extrabold text-white">Adicionar Nova Nota</h3>
              <button
                onClick={() => setModalAdicionarNota(false)}
                className="text-home-muted hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-home-muted">
                Observações internas sobre o atendimento / lead:
              </Label>
              <Textarea
                value={novaNotaTexto}
                onChange={(e) => setNovaNotaTexto(e.target.value)}
                placeholder="Ex: Cliente tem interesse em marketing para o segundo semestre..."
                rows={4}
                className="bg-[#111723] border-[#1b2334] text-white text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setModalAdicionarNota(false)}
                className="border-[#1b2334] text-home-muted"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={salvarNovaNota}
                disabled={!novaNotaTexto.trim()}
                className="bg-home-orange text-white hover:bg-orange-600"
              >
                Salvar Nota
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Ver Todas as Interações */}
      {modalVerInteracoes && contatoAtivo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-[#1b2334] bg-[#0c101a] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1b2334] pb-3">
              <h3 className="text-base font-extrabold text-white">
                Histórico de Interações — {contatoAtivo.nome}
              </h3>
              <button
                onClick={() => setModalVerInteracoes(false)}
                className="text-home-muted hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
              {contatoAtivo.interacoes.map((it) => (
                <div
                  key={it.id}
                  className="flex items-start gap-3 rounded-xl border border-white/5 bg-[#111723] p-3 text-xs"
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                      it.cor === "rose" && "bg-rose-500/15 text-rose-400",
                      it.cor === "emerald" && "bg-emerald-500/15 text-emerald-400",
                      it.cor === "blue" && "bg-blue-500/15 text-blue-400",
                      it.cor === "amber" && "bg-amber-500/15 text-amber-400",
                    )}
                  >
                    {it.tipo === "documento" && <FileText className="h-4 w-4" />}
                    {it.tipo === "conversa" && <MessageCircle className="h-4 w-4" />}
                    {it.tipo === "lead" && <User className="h-4 w-4" />}
                    {it.tipo === "nota" && <Edit2 className="h-4 w-4" />}
                    {it.tipo === "status" && <Check className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="font-bold text-white">{it.titulo}</div>
                    <div className="text-home-muted">{it.subtitulo}</div>
                  </div>
                  <span className="text-[10px] text-home-muted font-medium">{it.horario}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setModalVerInteracoes(false)}
                className="border-[#1b2334] text-white"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Envio de Anexos */}
      {modalAnexo && contatoAtivo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-[#1b2334] bg-[#0c101a] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1b2334] pb-3">
              <h3 className="text-base font-extrabold text-white">Anexar Documento ou Imagem</h3>
              <button
                onClick={() => setModalAnexo(false)}
                className="text-home-muted hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="text-xs text-home-muted">
                Selecione um arquivo para enviar diretamente a {contatoAtivo.nome}:
              </div>

              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() =>
                    enviarAnexoSimulado("Apresentação Flow Business.pdf", "2.4 MB • PDF")
                  }
                  className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-[#111723] hover:border-emerald-500/40 hover:bg-[#162030] transition-all text-left"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-600 text-white font-bold text-xs">
                    PDF
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-white">
                      Apresentação Flow Business.pdf
                    </div>
                    <div className="text-[11px] text-home-muted">2.4 MB • Catálogo de Serviços</div>
                  </div>
                </button>

                <button
                  onClick={() =>
                    enviarAnexoSimulado("Proposta Comercial Flow Leads.pdf", "1.8 MB • PDF")
                  }
                  className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-[#111723] hover:border-emerald-500/40 hover:bg-[#162030] transition-all text-left"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-600 text-white font-bold text-xs">
                    PDF
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-white">
                      Proposta Comercial Flow Leads.pdf
                    </div>
                    <div className="text-[11px] text-home-muted">1.8 MB • Tabela de Preços</div>
                  </div>
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setModalAnexo(false)}
                className="border-[#1b2334] text-home-muted"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
