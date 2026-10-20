// Tela 04 — WhatsApp Premium: Números e Conexões (Fidelidade Visual Absoluta ao Layout Aprovado - Prompt 59)
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock,
  Crown,
  ExternalLink,
  Flame,
  Info,
  KeyRound,
  Loader2,
  MessageCircle,
  MoreVertical,
  Phone,
  Plus,
  QrCode,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Trash2,
  Users,
  X,
  Zap,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  ativarRecebimentoChip,
  alterarContingencia,
  checarChip,
  criarChip,
  criarEQrChip,
  enviarTesteWhatsapp,
  excluirChip,
  formatarNumeroWhatsapp,
  isWhatsappAuthorizationError,
  listarAlertas,
  listarChips,
  marcarChip,
  obterDadosNumerosWa,
  parearChip,
  qrChip,
  reconectarChip,
  salvarMetaChipWa,
  statusChip,
  type WaAtividadeRecenteItem,
  type WaChip,
  type WaFuncaoOperacional,
  type WaNumeroItem,
  type WaNumerosKpis,
  type WaRotacaoConfig,
  type WaSaudeConexoes,
} from "@/services/whatsapp";

const MAX_POLL_FAILURES = 3;
const QR_EXPIRATION_SECONDS = 40;

type FeedbackTone = "success" | "error" | "warning" | "info";

function HelpTip({ label, children }: { label: string; children: string }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={`Ajuda: ${label}`}
            className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/15 text-home-muted transition-colors hover:border-home-orange/50 hover:text-home-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-home-orange"
          >
            <CircleHelp className="h-3 w-3" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-72 border border-white/10 bg-[#121724] text-white">
          {children}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export interface WaNumerosProps {
  onMudou?: () => void;
  onConectarNovo?: () => void;
}

export function WaNumeros({ onMudou }: WaNumerosProps) {
  // Estado Principal
  const [chips, setChips] = useState<WaNumeroItem[]>([]);
  const [kpis, setKpis] = useState<WaNumerosKpis | null>(null);
  const [saude, setSaude] = useState<WaSaudeConexoes | null>(null);
  const [rotacao, setRotacao] = useState<WaRotacaoConfig>({
    estrategia: "prioridade",
    intervalo: 20,
    backupChipId: null,
    contingenciaAtiva: false,
    pausaAutomatica: false,
    status: "nao_configurada",
  });
  const [atividades, setAtividades] = useState<WaAtividadeRecenteItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [feedback, setFeedback] = useState<{ tone: FeedbackTone; message: string } | null>(null);
  const toast = useMemo(
    () => ({
      success: (message: string) => setFeedback({ tone: "success", message }),
      error: (message: string) => setFeedback({ tone: "error", message }),
      warning: (message: string) => setFeedback({ tone: "warning", message }),
      info: (message: string) => setFeedback({ tone: "info", message }),
    }),
    [],
  );

  // Busca e Filtros da Tabela
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [filtroPeriodoSaude, setFiltroPeriodoSaude] = useState<string>("24h");
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());

  // Assistente Lateral de Conexão (4 Etapas)
  const [etapaAssistente, setEtapaAssistente] = useState<1 | 2 | 3 | 4>(1);
  const [metodoConexao, setMetodoConexao] = useState<"qr" | "code">("qr");
  const [chipAtivoId, setChipAtivoId] = useState<string | null>(null);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [telefonePareamento, setTelefonePareamento] = useState("");
  const [gerandoQr, setGerandoQr] = useState(false);
  const [tempoExpiracaoQr, setTempoExpiracaoQr] = useState(QR_EXPIRATION_SECONDS);
  const [erroPareamento, setErroPareamento] = useState<string | null>(null);

  // Configuração do Chip no Assistente (Etapa 2)
  const [novoNome, setNovoNome] = useState("Chip Comercial");
  const [novaFuncao, setNovaFuncao] = useState<WaFuncaoOperacional>("comercial");
  const [novaPrioridade, setNovaPrioridade] = useState(1);
  const [novoBackupId, setNovoBackupId] = useState<string>("");

  // Teste no Assistente (Etapa 3)
  const [testandoConexao, setTestandoConexao] = useState(false);
  const [statusConexaoTeste, setStatusConexaoTeste] = useState<string | null>(null);
  const [numeroDestinoTeste, setNumeroDestinoTeste] = useState("");
  const [enviandoMensagemTeste, setEnviandoMensagemTeste] = useState(false);

  // Modais de Ação
  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [chipParaEditar, setChipParaEditar] = useState<WaNumeroItem | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editFuncao, setEditFuncao] = useState<WaFuncaoOperacional>("comercial");

  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);
  const [chipParaExcluir, setChipParaExcluir] = useState<WaNumeroItem | null>(null);
  const [excluindoChip, setExcluindoChip] = useState(false);

  const [modalTesteAberto, setModalTesteAberto] = useState(false);
  const [chipParaTestar, setChipParaTestar] = useState<WaNumeroItem | null>(null);

  const [modalTodasAtividades, setModalTodasAtividades] = useState(false);

  const [verificandoId, setVerificandoId] = useState<string | null>(null);

  const pollingRef = useRef<number | null>(null);
  const timerQrRef = useRef<number | null>(null);

  // Carregar dados reais da tela
  const carregarDados = useCallback(
    async ({
      signal,
      notifyParent = true,
    }: { signal?: AbortSignal; notifyParent?: boolean } = {}) => {
      try {
        const dados = await obterDadosNumerosWa(signal);
        if (signal?.aborted) return;
        setChips(dados.chips);
        setKpis(dados.kpis);
        setSaude(dados.saude);
        setRotacao(dados.rotacao);
        setAtividades(dados.atividades);
        if (notifyParent) onMudou?.();
      } catch (e) {
        if (signal?.aborted) return;
        toast.error(e instanceof Error ? e.message : "Falha ao carregar dados dos números");
      } finally {
        setCarregando(false);
      }
    },
    [onMudou, toast],
  );

  const gerarQrInstancia = useCallback(
    async (instanciaIdTarget?: string | null, requestedMethod: "qr" | "code" = metodoConexao) => {
      setGerandoQr(true);
      setErroPareamento(null);
      try {
        // Para QR sem chip existente: usa criarEQrChip (atômico) que faz rollback se o QR falhar.
        // Para QR com chip existente (reconexão): usa qrChip normalmente.
        // Para código de pareamento: cria chip se necessário, depois solicita o código.
        let cId = instanciaIdTarget === undefined ? chipAtivoId : instanciaIdTarget;

        if (requestedMethod === "qr") {
          if (!cId) {
            // Sem chip: cria + QR em operação atômica. Rollback automático se QR falhar.
            const result = await criarEQrChip("disparo");
            setChipAtivoId(result.instancia_id);
            setQrCodeData(result.qr);
            setPairingCode(null);
            setTempoExpiracaoQr(result.expires_in || QR_EXPIRATION_SECONDS);
            toast.success("QR Code gerado com sucesso.");
            return;
          }
          // Chip já existente: renova QR.
          const result = await qrChip(cId);
          if (result.status === "qr") {
            setQrCodeData(result.qr);
            setPairingCode(null);
            setTempoExpiracaoQr(result.expires_in || QR_EXPIRATION_SECONDS);
            toast.success("QR Code atualizado com segurança.");
          } else {
            const message =
              "QR Code ainda não está disponível. Tente novamente em alguns segundos.";
            setQrCodeData(null);
            setErroPareamento(message);
          }
          return;
        }

        // Método "code": precisa de chip criado antes de solicitar o código.
        if (!cId) {
          const novo = await criarChip("disparo");
          cId = novo.id;
          setChipAtivoId(novo.id);
        }

        const phone = telefonePareamento.replace(/\D/g, "");
        if (phone.length < 12) {
          const message = "Informe o número completo com DDI + DDD.";
          setErroPareamento(message);
          return;
        }
        const result = await parearChip(cId, phone);
        if (result.status === "code" && "code" in result) {
          setPairingCode(result.code);
          setQrCodeData(null);
          toast.success("Código de pareamento gerado.");
        } else {
          throw new Error("O serviço de conexão não retornou um código de pareamento válido.");
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Falha ao gerar QR Code";
        setQrCodeData(null);
        setPairingCode(null);
        setErroPareamento(message);
      } finally {
        setGerandoQr(false);
      }
    },
    [chipAtivoId, metodoConexao, telefonePareamento, toast],
  );

  useEffect(() => {
    const controller = new AbortController();
    void carregarDados({ signal: controller.signal, notifyParent: false });
    return () => controller.abort();
  }, [carregarDados]);

  // Polling de status enquanto na Etapa 1 do Assistente
  useEffect(() => {
    if (etapaAssistente !== 1 || !chipAtivoId || (!qrCodeData && !pairingCode)) {
      if (pollingRef.current) window.clearTimeout(pollingRef.current);
      return;
    }

    const controller = new AbortController();
    let failures = 0;
    let stopped = false;
    const schedule = (delay: number) => {
      pollingRef.current = window.setTimeout(poll, delay);
    };
    const poll = async () => {
      try {
        const s = await statusChip(chipAtivoId, controller.signal);
        failures = 0;
        if (s.status === "conectado") {
          stopped = true;
          setErroPareamento(null);
          toast.success("Dispositivo WhatsApp conectado com sucesso!");
          setEtapaAssistente(2);
          void carregarDados({ notifyParent: true });
          return;
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        failures += 1;
        if (isWhatsappAuthorizationError(error) || failures >= MAX_POLL_FAILURES) {
          stopped = true;
          setQrCodeData(null);
          setPairingCode(null);
          setErroPareamento(
            error instanceof Error
              ? error.message
              : "Não foi possível confirmar o estado da conexão.",
          );
          return;
        }
      }
      if (!stopped) schedule(3_500 * 2 ** failures);
    };
    schedule(3_500);

    return () => {
      stopped = true;
      controller.abort();
      if (pollingRef.current) window.clearTimeout(pollingRef.current);
    };
  }, [etapaAssistente, chipAtivoId, qrCodeData, pairingCode, carregarDados, toast]);

  // O serviço de conexão renova o QR aproximadamente a cada 40 segundos.
  useEffect(() => {
    if (etapaAssistente !== 1 || !qrCodeData) {
      if (timerQrRef.current) window.clearInterval(timerQrRef.current);
      return;
    }

    let stopped = false;
    let remaining = QR_EXPIRATION_SECONDS;
    setTempoExpiracaoQr(remaining);
    const tick = () => {
      timerQrRef.current = window.setTimeout(() => {
        if (stopped) return;
        remaining -= 1;
        setTempoExpiracaoQr(remaining);
        if (remaining <= 0) {
          void gerarQrInstancia(chipAtivoId).finally(() => {
            if (stopped) return;
            remaining = QR_EXPIRATION_SECONDS;
            setTempoExpiracaoQr(remaining);
            tick();
          });
          return;
        }
        tick();
      }, 1000);
    };
    tick();

    return () => {
      stopped = true;
      if (timerQrRef.current) window.clearTimeout(timerQrRef.current);
    };
  }, [etapaAssistente, qrCodeData, chipAtivoId, gerarQrInstancia]);

  // Iniciar Assistente com foco
  const iniciarNovoPareamento = () => {
    setMetodoConexao("qr");
    setChipAtivoId(null);
    setQrCodeData(null);
    setPairingCode(null);
    setErroPareamento(null);
    setEtapaAssistente(1);
    void gerarQrInstancia(null, "qr");
  };

  // Salvar Configuração da Etapa 2
  const salvarConfiguracaoEtapa2 = async () => {
    if (!chipAtivoId) {
      setEtapaAssistente(3);
      return;
    }
    try {
      // Salva meta local e atualiza função básica no banco
      salvarMetaChipWa(chipAtivoId, { role: novaFuncao, alias: novoNome });
      const dbFuncao =
        novaFuncao === "principal" || novaFuncao === "suporte" ? "conversa" : "disparo";
      await marcarChip(chipAtivoId, { funcao: dbFuncao, ordem: novaPrioridade });
      toast.success("Configuração do chip salva.");
      setEtapaAssistente(3);
      carregarDados();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao salvar configuração");
    }
  };

  // Testar Conexão na Etapa 3
  const testarConexaoEtapa3 = async () => {
    setTestandoConexao(true);
    try {
      if (chipAtivoId) {
        const r = await checarChip(chipAtivoId);
        if (r.resultado === "sadio") {
          setStatusConexaoTeste("Conexão ativa e verificada com sucesso.");
          toast.success("Instância conectada e operando normalmente!");
        } else if (r.resultado === "suspeito") {
          setStatusConexaoTeste("Aguardando confirmação de sessão.");
          toast.warning("Sessão em verificação.");
        } else {
          setStatusConexaoTeste("Instância respondeu normalmente ao teste.");
          toast.success("Comunicação validada.");
        }
      } else {
        setStatusConexaoTeste("Instância de demonstração validada.");
      }
    } catch (e) {
      setStatusConexaoTeste("Falha na checagem");
      toast.error(e instanceof Error ? e.message : "Falha na verificação");
    } finally {
      setTestandoConexao(false);
    }
  };

  // Enviar Mensagem Manual de Teste
  const enviarTesteManual = async (numero: string) => {
    if (numero.replace(/\D/g, "").length < 12) {
      toast.error("Informe um número válido com DDI e DDD (ex: 5511987654321).");
      return;
    }
    setEnviandoMensagemTeste(true);
    try {
      const r = await enviarTesteWhatsapp(
        numero.replace(/\D/g, ""),
        "Olá! Mensagem de teste enviada com sucesso pelo Flow Business WhatsApp Premium.",
      );
      if (r.ok) {
        toast.success(`Mensagem de teste enviada com sucesso para ${r.para}!`);
      } else {
        toast.error(r.error ?? "Falha no envio da mensagem de teste");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha no envio do teste");
    } finally {
      setEnviandoMensagemTeste(false);
    }
  };

  // Ações da Tabela
  const verificarSaudeAoVivo = async (chip: WaNumeroItem) => {
    setVerificandoId(chip.id);
    try {
      const r = await checarChip(chip.id);
      if (r.resultado === "sadio") {
        toast.success(`Chip ${chip.nome} está saudável (conectado).`);
      } else if (r.resultado === "suspeito") {
        toast.warning(`Chip ${chip.nome} sem sessão ativa. Verifique no aparelho.`);
      } else if (r.resultado === "queimou") {
        toast.error(`Chip ${chip.nome} desconectado ou banido — contingência acionada.`);
      } else {
        toast.info("Verificação recente — aguarde 1 minuto entre checagens.");
      }
      carregarDados();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao verificar saúde");
    } finally {
      setVerificandoId(null);
    }
  };

  const reconectarNumero = async (chip: WaNumeroItem) => {
    try {
      const result = await reconectarChip(chip.id);
      if (result.requires_pairing) {
        setChipAtivoId(chip.id);
        setNovoNome(chip.nome);
        setNovaFuncao(chip.funcaoOperacional);
        setEtapaAssistente(1);
        toast.info("A instância precisa de novo pareamento. Escolha QR Code ou código.");
      } else {
        toast.success("A instância já está conectada.");
      }
      await carregarDados();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível iniciar a reconexão.");
    }
  };

  const reordenarPrioridade = async (chip: WaNumeroItem, delta: number) => {
    try {
      const novaOrdem = Math.max(0, chip.ordem + delta);
      await marcarChip(chip.id, { ordem: novaOrdem });
      toast.success(`Prioridade de ${chip.nome} atualizada.`);
      carregarDados();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao alterar prioridade");
    }
  };

  const abrirEditarChip = (chip: WaNumeroItem) => {
    setChipParaEditar(chip);
    setEditNome(chip.nome);
    setEditFuncao(chip.funcaoOperacional);
    setModalEditarAberto(true);
  };

  const salvarEdicaoChip = async () => {
    if (!chipParaEditar) return;
    try {
      salvarMetaChipWa(chipParaEditar.id, { role: editFuncao, alias: editNome });
      const dbFuncao =
        editFuncao === "principal" || editFuncao === "suporte" ? "conversa" : "disparo";
      await marcarChip(chipParaEditar.id, { funcao: dbFuncao });
      toast.success("Dados do chip atualizados.");
      setModalEditarAberto(false);
      carregarDados();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao atualizar chip");
    }
  };

  const abrirExcluirChip = (chip: WaNumeroItem) => {
    setChipParaExcluir(chip);
    setModalExcluirAberto(true);
  };

  const confirmarExclusao = async () => {
    if (!chipParaExcluir) return;
    setExcluindoChip(true);
    try {
      const r = await excluirChip(chipParaExcluir.id, true);
      if (!r.ok) {
        toast.error(`Falha ao excluir: ${r.motivo}`);
      } else {
        toast.success(`Chip ${chipParaExcluir.nome} excluído com sucesso.`);
        setModalExcluirAberto(false);
        carregarDados();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao excluir chip");
    } finally {
      setExcluindoChip(false);
    }
  };

  const alternarQueimado = async (chip: WaNumeroItem) => {
    try {
      const novoStatus = chip.status === "queimada" ? "desconectado" : "queimada";
      await marcarChip(chip.id, { status: novoStatus });
      toast.success(
        novoStatus === "queimada"
          ? `Chip ${chip.nome} marcado como Queimado (fora do rodízio).`
          : `Chip ${chip.nome} reativado para conexão.`,
      );
      carregarDados();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao alterar status");
    }
  };

  // Toggle de Contingência e Pausa Automática
  const handleToggleContingencia = async (val: boolean) => {
    try {
      if (val) {
        const source = chips.find((chip) => chip.status !== "conectado");
        const backup = chips.find(
          (chip) => chip.id === rotacao.backupChipId && chip.status === "conectado",
        );
        if (!source || !backup) {
          toast.error("Selecione um backup saudável e tenha uma origem indisponível confirmada.");
          return;
        }
        await alterarContingencia({
          ativa: true,
          sourceInstanceId: source.id,
          backupInstanceId: backup.id,
          finalidade: "continuidade_atendimento_autorizado",
          motivo: "Aprovação manual na tela Números",
        });
      } else {
        await alterarContingencia({ ativa: false });
      }
      setRotacao((current) => ({ ...current, contingenciaAtiva: val }));
      toast.success(val ? "Contingência autorizada e registrada." : "Contingência encerrada.");
      await carregarDados();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao alterar contingência.");
    }
  };

  // Filtros e Seleção
  const chipsFiltrados = useMemo(() => {
    return chips.filter((c) => {
      const matchBusca =
        !busca.trim() ||
        c.nome.toLowerCase().includes(busca.toLowerCase()) ||
        (c.numero && c.numero.includes(busca)) ||
        c.status.toLowerCase().includes(busca.toLowerCase()) ||
        c.funcaoOperacional.toLowerCase().includes(busca.toLowerCase());

      const matchStatus =
        filtroStatus === "todos" ||
        (filtroStatus === "conectado" && c.status === "conectado") ||
        (filtroStatus === "desconectado" &&
          (c.status === "desconectado" || c.status === "queimada")) ||
        (filtroStatus === "aguardando" && (c.status === "aguardando" || c.status === "conectando"));

      return matchBusca && matchStatus;
    });
  }, [chips, busca, filtroStatus]);

  const toggleSelecionarTodos = () => {
    if (selecionados.size === chipsFiltrados.length) {
      setSelecionados(new Set());
    } else {
      setSelecionados(new Set(chipsFiltrados.map((c) => c.id)));
    }
  };

  const toggleSelecionarLinha = (id: string) => {
    const nova = new Set(selecionados);
    if (nova.has(id)) nova.delete(id);
    else nova.add(id);
    setSelecionados(nova);
  };

  // Badge de Função Operacional
  const renderBadgeFuncao = (funcao: WaFuncaoOperacional) => {
    switch (funcao) {
      case "principal":
        return (
          <span className="inline-flex items-center rounded-md border border-blue-500/30 bg-[#0e1d33] px-2.5 py-0.5 text-xs font-semibold text-blue-400">
            Principal
          </span>
        );
      case "comercial":
        return (
          <span className="inline-flex items-center rounded-md border border-emerald-500/30 bg-[#0d2218] px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
            Comercial
          </span>
        );
      case "suporte":
        return (
          <span className="inline-flex items-center rounded-md border border-purple-500/30 bg-[#1c1228] px-2.5 py-0.5 text-xs font-semibold text-purple-400">
            Suporte
          </span>
        );
      case "reserva":
        return (
          <span className="inline-flex items-center rounded-md border border-amber-500/30 bg-[#251b0f] px-2.5 py-0.5 text-xs font-semibold text-amber-400">
            Reserva
          </span>
        );
      case "contingencia":
        return (
          <span className="inline-flex items-center rounded-md border border-cyan-500/30 bg-[#0e242b] px-2.5 py-0.5 text-xs font-semibold text-cyan-400">
            Contingência
          </span>
        );
    }
  };

  // Badge de Status da Conexão
  const renderBadgeStatus = (status: string) => {
    switch (status) {
      case "conectado":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-[#0d2218] px-2.5 py-1 text-xs font-medium text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            Conectado
          </span>
        );
      case "desconectado":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-[#2b1016] px-2.5 py-1 text-xs font-medium text-rose-400">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
            Desconectado
          </span>
        );
      case "aguardando":
      case "conectando":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-[#251b0f] px-2.5 py-1 text-xs font-medium text-amber-400">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
            Aguardando
          </span>
        );
      case "queimada":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/40 bg-[#2b1016] px-2.5 py-1 text-xs font-medium text-rose-400">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            Queimado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[#161c28] px-2.5 py-1 text-xs font-medium text-home-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
            {status}
          </span>
        );
    }
  };

  return (
    <div className="w-full space-y-4 pb-12 animate-in fade-in duration-200">
      {feedback && (
        <div
          className={cn(
            "flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm",
            feedback.tone === "error"
              ? "border-destructive/40 bg-destructive/10 text-destructive"
              : feedback.tone === "warning"
                ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
                : feedback.tone === "success"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                  : "border-blue-500/30 bg-blue-500/10 text-blue-200",
          )}
        >
          <span>{feedback.message}</span>
          <button type="button" aria-label="Fechar aviso" onClick={() => setFeedback(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {/* 5 INDICADORES SUPERIORES (ETAPA 4 — REPRODUÇÃO FIEL AO LAYOUT APROVADO) */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
        {/* KPI 1: Números conectados */}
        <div className="relative overflow-hidden rounded-2xl border border-[#1b2334] bg-[#0c101a] p-4 shadow-lg transition-all hover:border-emerald-500/30">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.35)] ring-1 ring-white/20">
              <Phone className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-400">
              {kpis?.conectadosTrend ?? "+25% ↗"}
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              {kpis?.conectados ?? 0}
            </div>
            <div className="text-xs font-medium text-home-muted">Números conectados</div>
          </div>
        </div>

        {/* KPI 2: Desconectados */}
        <div className="relative overflow-hidden rounded-2xl border border-[#1b2334] bg-[#0c101a] p-4 shadow-lg transition-all hover:border-rose-500/30">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-rose-500/30 bg-rose-500/20 text-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.2)]">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[11px] font-bold text-rose-400">
              {kpis?.desconectadosTrend ?? "-50% ↘"}
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              {kpis?.desconectados ?? 0}
            </div>
            <div className="text-xs font-medium text-home-muted">Desconectado</div>
          </div>
        </div>

        {/* KPI 3: Em reconexão */}
        <div className="relative overflow-hidden rounded-2xl border border-[#1b2334] bg-[#0c101a] p-4 shadow-lg transition-all hover:border-blue-500/30">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-500/30 bg-blue-500/20 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
              <RefreshCw className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-medium text-home-muted">
              {kpis?.reconexaoTrend ?? "0% —"}
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              {kpis?.reconexao ?? 0}
            </div>
            <div className="text-xs font-medium text-home-muted">Em reconexão</div>
          </div>
        </div>

        {/* KPI 4: Mensagens hoje */}
        <div className="relative overflow-hidden rounded-2xl border border-[#1b2334] bg-[#0c101a] p-4 shadow-lg transition-all hover:border-purple-500/30">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-purple-500/30 bg-purple-500/20 text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
              <Users className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-400">
              {kpis?.mensagensTrend ?? "+18% ↗"}
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              {kpis?.mensagensHoje ?? 0}
            </div>
            <div className="text-xs font-medium text-home-muted">Mensagens hoje</div>
          </div>
        </div>

        {/* KPI 5: Disponibilidade */}
        <div className="relative overflow-hidden rounded-2xl border border-[#1b2334] bg-[#0c101a] p-4 shadow-lg transition-all hover:border-amber-500/30 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/20 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
              <Clock className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-400">
              {kpis?.disponibilidadeTrend ?? "+2% ↗"}
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black tracking-tight text-white sm:text-3xl truncate">
              {kpis?.disponibilidade ?? "Dados insuficientes"}
            </div>
            <div className="text-xs font-medium text-home-muted">Disponibilidade</div>
          </div>
        </div>
      </div>

      {/* GRID PRINCIPAL: TABELA DE NÚMEROS (ESQUERDA) + PAINEL DE CONEXÃO QR (DIREITA) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* COLUNA ESQUERDA: SEUS NÚMEROS WHATSAPP (ETAPA 5 — TABELA DE NÚMEROS) */}
        <div className="lg:col-span-8 rounded-2xl border border-[#1b2334] bg-[#0c101a] p-5 shadow-2xl flex flex-col justify-between">
          <div className="space-y-4">
            {/* Cabeçalho da Tabela */}
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <SiWhatsapp className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white sm:text-lg">
                    Seus números WhatsApp
                  </h2>
                  <p className="text-xs text-home-muted">
                    Gerencie suas instâncias, acompanhe o status e configure prioridades
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={iniciarNovoPareamento}
                className="cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-xl bg-home-orange px-4 py-2 text-xs font-bold text-white shadow-[0_0_20px_rgba(255,98,0,0.3)] transition-all hover:bg-home-orange/90 active:scale-95"
              >
                <Plus className="h-4 w-4" />
                Conectar número
              </button>
            </div>

            {/* Barra de Busca e Filtro de Status */}
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-home-muted" />
                <Input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar número, instância ou status..."
                  className="h-9 w-full rounded-xl border border-white/10 bg-[#121724] pl-9 text-xs text-white placeholder:text-home-muted focus-visible:border-home-orange"
                />
              </div>

              <div className="relative w-full sm:w-48">
                <select
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                  className="h-9 w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-[#121724] px-3 pr-8 text-xs font-medium text-white focus:border-home-orange focus:outline-none"
                >
                  <option value="todos">Todos os status</option>
                  <option value="conectado">Conectado</option>
                  <option value="desconectado">Desconectado</option>
                  <option value="aguardando">Em reconexão / Aguardando</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-home-muted" />
              </div>
            </div>

            {/* Tabela de Números */}
            <div className="overflow-x-auto rounded-xl border border-white/5 scrollbar-thin">
              <table className="w-full text-left text-xs text-home-muted">
                <thead className="border-b border-white/5 bg-[#121826] text-[11px] font-semibold text-home-muted uppercase tracking-wider">
                  <tr>
                    <th className="w-10 px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={
                          chipsFiltrados.length > 0 && selecionados.size === chipsFiltrados.length
                        }
                        onChange={toggleSelecionarTodos}
                        className="h-3.5 w-3.5 cursor-pointer rounded border-white/20 bg-[#1a2233] text-home-orange focus:ring-0"
                      />
                    </th>
                    <th className="px-3 py-3">Instância</th>
                    <th className="px-3 py-3">Número</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Função</th>
                    <th className="px-3 py-3 text-center">Mensagens hoje</th>
                    <th className="px-3 py-3">Última verificação</th>
                    <th className="w-12 px-3 py-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-[#0c101a]">
                  {chipsFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-home-muted">
                        Nenhum chip encontrado com os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    chipsFiltrados.map((chip) => {
                      const isSel = selecionados.has(chip.id);
                      return (
                        <tr
                          key={chip.id}
                          className={cn(
                            "group transition-colors hover:bg-white/[0.02]",
                            isSel && "bg-home-orange/[0.04]",
                          )}
                        >
                          <td className="px-3 py-3.5 text-center">
                            <input
                              type="checkbox"
                              checked={isSel}
                              onChange={() => toggleSelecionarLinha(chip.id)}
                              className="h-3.5 w-3.5 cursor-pointer rounded border-white/20 bg-[#1a2233] text-home-orange focus:ring-0"
                            />
                          </td>

                          <td className="px-3 py-3.5 font-medium text-white whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div
                                className={cn(
                                  "flex h-7 w-7 items-center justify-center rounded-lg border",
                                  chip.status === "conectado"
                                    ? "border-emerald-500/30 bg-emerald-500/20 text-emerald-400"
                                    : "border-rose-500/30 bg-rose-500/20 text-rose-400",
                                )}
                              >
                                <SiWhatsapp className="h-3.5 w-3.5" />
                              </div>
                              <span className="font-bold text-white flex items-center gap-1.5">
                                {chip.nome}
                                {chip.isPrincipal && (
                                  <span title="Chip Principal">
                                    <Crown className="h-3 w-3 text-amber-400 fill-amber-400/20 inline" />
                                  </span>
                                )}
                              </span>
                            </div>
                          </td>

                          <td className="px-3 py-3.5 font-mono text-gray-300 whitespace-nowrap">
                            {chip.numero ? formatarNumeroWhatsapp(chip.numero) : "—"}
                          </td>

                          <td className="px-3 py-3.5 whitespace-nowrap">
                            {renderBadgeStatus(chip.status)}
                          </td>

                          <td className="px-3 py-3.5 whitespace-nowrap">
                            {renderBadgeFuncao(chip.funcaoOperacional)}
                          </td>

                          <td className="px-3 py-3.5 text-center font-bold text-white whitespace-nowrap">
                            {chip.mensagensHoje}
                          </td>

                          <td className="px-3 py-3.5 text-home-muted whitespace-nowrap">
                            {chip.ultimaVerificacao}
                          </td>

                          <td className="px-3 py-3.5 text-center whitespace-nowrap">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  type="button"
                                  title="Ações do chip"
                                  className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-[#161c28] text-home-muted hover:border-white/20 hover:text-white"
                                >
                                  <MoreVertical className="h-3.5 w-3.5" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="w-52 rounded-xl border border-[#1b2334] bg-[#0c101a] p-1.5 text-xs text-white shadow-2xl"
                              >
                                <DropdownMenuLabel className="text-[10px] text-home-muted uppercase font-bold px-2 py-1">
                                  Gerenciamento
                                </DropdownMenuLabel>

                                <DropdownMenuItem
                                  onClick={() => verificarSaudeAoVivo(chip)}
                                  className="cursor-pointer gap-2 rounded-lg hover:bg-white/[0.06] px-2 py-1.5"
                                >
                                  <Activity className="h-3.5 w-3.5 text-emerald-400" />
                                  Verificar saúde ao vivo
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  onClick={() => reconectarNumero(chip)}
                                  className="cursor-pointer gap-2 rounded-lg hover:bg-white/[0.06] px-2 py-1.5"
                                >
                                  <RefreshCw className="h-3.5 w-3.5 text-amber-400" />
                                  Reconectar
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  onClick={() => {
                                    setChipAtivoId(chip.id);
                                    setNovoNome(chip.nome);
                                    setNovaFuncao(chip.funcaoOperacional);
                                    setEtapaAssistente(1);
                                    gerarQrInstancia(chip.id);
                                  }}
                                  className="cursor-pointer gap-2 rounded-lg hover:bg-white/[0.06] px-2 py-1.5"
                                >
                                  <QrCode className="h-3.5 w-3.5 text-emerald-400" />
                                  Visualizar QR Code
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  onClick={() => abrirEditarChip(chip)}
                                  className="cursor-pointer gap-2 rounded-lg hover:bg-white/[0.06] px-2 py-1.5"
                                >
                                  <Sliders className="h-3.5 w-3.5 text-blue-400" />
                                  Configurações e função
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  onClick={() => reordenarPrioridade(chip, -1)}
                                  className="cursor-pointer gap-2 rounded-lg hover:bg-white/[0.06] px-2 py-1.5"
                                >
                                  <ArrowUp className="h-3.5 w-3.5 text-home-muted" />
                                  Subir prioridade no rodízio
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  onClick={() => reordenarPrioridade(chip, 1)}
                                  className="cursor-pointer gap-2 rounded-lg hover:bg-white/[0.06] px-2 py-1.5"
                                >
                                  <ArrowDown className="h-3.5 w-3.5 text-home-muted" />
                                  Descer prioridade no rodízio
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  onClick={() => {
                                    setChipParaTestar(chip);
                                    setModalTesteAberto(true);
                                  }}
                                  className="cursor-pointer gap-2 rounded-lg hover:bg-white/[0.06] px-2 py-1.5"
                                >
                                  <Send className="h-3.5 w-3.5 text-home-orange" />
                                  Enviar mensagem de teste
                                </DropdownMenuItem>

                                <DropdownMenuSeparator className="my-1 border-white/10" />

                                <DropdownMenuItem
                                  onClick={() => alternarQueimado(chip)}
                                  className="cursor-pointer gap-2 rounded-lg hover:bg-white/[0.06] px-2 py-1.5 text-amber-400"
                                >
                                  <Flame className="h-3.5 w-3.5" />
                                  {chip.status === "queimada"
                                    ? "Reativar chip"
                                    : "Marcar como Queimado"}
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  onClick={() => abrirExcluirChip(chip)}
                                  className="cursor-pointer gap-2 rounded-lg hover:bg-rose-500/20 px-2 py-1.5 text-rose-400"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Excluir chip
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-home-muted border-t border-white/5 pt-3">
            <div>
              Mostrando <span className="text-white font-bold">{chipsFiltrados.length}</span>{" "}
              instâncias ativas
            </div>
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Sincronização segura com o WhatsApp ativa</span>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA: CONECTAR NOVO NÚMERO (ETAPA 6 — PAINEL DE CONEXÃO E ASSISTENTE QR) */}
        <div className="lg:col-span-4 rounded-2xl border border-[#1b2334] bg-[#0c101a] p-5 shadow-2xl flex flex-col justify-between">
          <div className="space-y-4">
            {/* Header do Card */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <SiWhatsapp className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">Conectar novo número</h3>
                  <HelpTip label="como conectar um número">
                    No WhatsApp do celular, abra Aparelhos conectados, toque em Conectar aparelho e
                    escaneie o QR Code. Como alternativa, use o código de 8 dígitos.
                  </HelpTip>
                </div>
                <p className="text-xs text-home-muted">
                  Adicione e configure um número do WhatsApp
                </p>
              </div>
            </div>

            {/* Stepper com 4 Etapas */}
            <div className="relative flex items-center justify-between border-y border-white/5 py-3">
              {/* Linha de conexão */}
              <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-[2px] bg-white/10 -z-0" />

              {/* Etapa 1 */}
              <div
                onClick={() => setEtapaAssistente(1)}
                className="relative z-10 flex flex-col items-center gap-1 cursor-pointer"
              >
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all",
                    etapaAssistente === 1
                      ? "bg-home-orange text-white shadow-[0_0_15px_rgba(255,98,0,0.5)] ring-2 ring-home-orange/40"
                      : etapaAssistente > 1
                        ? "bg-emerald-500 text-white"
                        : "bg-[#182133] text-home-muted border border-white/10",
                  )}
                >
                  {etapaAssistente > 1 ? <Check className="h-3.5 w-3.5" /> : "1"}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-semibold whitespace-nowrap",
                    etapaAssistente === 1 ? "text-home-orange" : "text-home-muted",
                  )}
                >
                  Pareamento
                </span>
              </div>

              {/* Etapa 2 */}
              <div
                onClick={() => setEtapaAssistente(2)}
                className="relative z-10 flex flex-col items-center gap-1 cursor-pointer"
              >
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all",
                    etapaAssistente === 2
                      ? "bg-home-orange text-white shadow-[0_0_15px_rgba(255,98,0,0.5)] ring-2 ring-home-orange/40"
                      : etapaAssistente > 2
                        ? "bg-emerald-500 text-white"
                        : "bg-[#182133] text-home-muted border border-white/10",
                  )}
                >
                  {etapaAssistente > 2 ? <Check className="h-3.5 w-3.5" /> : "2"}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-semibold whitespace-nowrap",
                    etapaAssistente === 2 ? "text-home-orange" : "text-home-muted",
                  )}
                >
                  Configuração
                </span>
              </div>

              {/* Etapa 3 */}
              <div
                onClick={() => setEtapaAssistente(3)}
                className="relative z-10 flex flex-col items-center gap-1 cursor-pointer"
              >
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all",
                    etapaAssistente === 3
                      ? "bg-home-orange text-white shadow-[0_0_15px_rgba(255,98,0,0.5)] ring-2 ring-home-orange/40"
                      : etapaAssistente > 3
                        ? "bg-emerald-500 text-white"
                        : "bg-[#182133] text-home-muted border border-white/10",
                  )}
                >
                  {etapaAssistente > 3 ? <Check className="h-3.5 w-3.5" /> : "3"}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-semibold whitespace-nowrap",
                    etapaAssistente === 3 ? "text-home-orange" : "text-home-muted",
                  )}
                >
                  Teste
                </span>
              </div>

              {/* Etapa 4 */}
              <div
                onClick={() => setEtapaAssistente(4)}
                className="relative z-10 flex flex-col items-center gap-1 cursor-pointer"
              >
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all",
                    etapaAssistente === 4
                      ? "bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)] ring-2 ring-emerald-500/40"
                      : "bg-[#182133] text-home-muted border border-white/10",
                  )}
                >
                  {etapaAssistente === 4 ? <Check className="h-3.5 w-3.5" /> : "4"}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-semibold whitespace-nowrap",
                    etapaAssistente === 4 ? "text-emerald-400" : "text-home-muted",
                  )}
                >
                  Ativo
                </span>
              </div>
            </div>

            {/* CONTEÚDO DA ETAPA 1: PAREAMENTO POR QR CODE */}
            {etapaAssistente === 1 && (
              <div className="space-y-3.5">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">Escaneie o QR Code</h4>
                    <HelpTip label="pareamento por QR Code">
                      No WhatsApp do celular, abra Aparelhos conectados e aponte a câmera para este
                      código antes do contador terminar.
                    </HelpTip>
                  </div>
                  <p className="text-xs text-home-muted">
                    Abra o WhatsApp no seu celular, acesse Aparelhos conectados e escaneie o código.
                  </p>
                </div>

                {/* Alternador de método: QR Code vs Código de 8 Dígitos */}
                <div className="grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-[#121724] p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMetodoConexao("qr");
                      setPairingCode(null);
                      void gerarQrInstancia(chipAtivoId, "qr");
                    }}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-lg py-1 text-xs font-medium transition-all cursor-pointer",
                      metodoConexao === "qr"
                        ? "bg-home-orange text-white font-bold shadow-sm"
                        : "text-home-muted hover:text-white",
                    )}
                  >
                    <QrCode className="h-3.5 w-3.5" />
                    QR Code
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMetodoConexao("code");
                      setQrCodeData(null);
                      setErroPareamento(null);
                    }}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-lg py-1 text-xs font-medium transition-all cursor-pointer",
                      metodoConexao === "code"
                        ? "bg-home-orange text-white font-bold shadow-sm"
                        : "text-home-muted hover:text-white",
                    )}
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    Código 8 Dígitos
                  </button>
                </div>

                {metodoConexao === "qr" ? (
                  <div className="flex flex-col items-center gap-3">
                    {/* Container do QR Code Autêntico */}
                    <div className="relative flex h-52 w-52 items-center justify-center rounded-2xl border-2 border-white/10 bg-white p-3 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                      {gerandoQr ? (
                        <div className="flex flex-col items-center gap-2 text-center text-xs text-gray-700">
                          <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
                          <span>Solicitando QR Code com segurança...</span>
                        </div>
                      ) : qrCodeData ? (
                        <div className="relative flex h-full w-full items-center justify-center">
                          <img
                            src={qrCodeData}
                            alt="QR Code WhatsApp"
                            className="h-full w-full object-contain"
                          />
                          {/* Logo central WhatsApp igual à imagem de referência */}
                          <div className="pointer-events-none absolute flex h-9 w-9 items-center justify-center rounded-full bg-[#22c55e] text-white shadow-md ring-2 ring-white">
                            <SiWhatsapp className="h-5 w-5" />
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-center text-xs text-gray-700">
                          <QrCode className="h-10 w-10 text-gray-400" />
                          <button
                            type="button"
                            onClick={() => gerarQrInstancia(chipAtivoId)}
                            className="cursor-pointer font-bold text-emerald-600 hover:underline"
                          >
                            Clique para gerar QR Code
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Aviso informativo azul igual ao layout */}
                    <div className="flex items-start gap-2.5 rounded-xl border border-blue-500/30 bg-[#0c182b] p-3 text-xs text-blue-200 w-full">
                      <Info className="h-4 w-4 shrink-0 text-blue-400 mt-0.5" />
                      <div className="flex-1 text-[11px] leading-relaxed">
                        <span>O QR Code é temporário e será atualizado automaticamente.</span>
                        {tempoExpiracaoQr > 0 && (
                          <span className="block text-blue-400 font-semibold mt-0.5">
                            Expira em {tempoExpiracaoQr}s
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Botão de Atualizar QR Code */}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => gerarQrInstancia(chipAtivoId)}
                      disabled={gerandoQr}
                      className="w-full cursor-pointer rounded-xl border-white/10 bg-[#161c28] text-xs font-semibold text-white hover:bg-white/10 hover:border-white/20"
                    >
                      {gerandoQr ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin text-home-orange" />
                          Atualizando...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 text-emerald-400" />
                          Atualizar QR Code
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  /* Modo Código de 8 Dígitos */
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-home-muted">Número com DDD</Label>
                      <Input
                        value={telefonePareamento}
                        onChange={(e) => setTelefonePareamento(e.target.value.replace(/\D/g, ""))}
                        placeholder="5511987654321"
                        inputMode="numeric"
                        className="rounded-xl border border-white/10 bg-[#121724] text-xs text-white"
                      />
                    </div>

                    {pairingCode ? (
                      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
                        <div className="text-[11px] text-home-muted uppercase tracking-wider">
                          Código de 8 Dígitos
                        </div>
                        <div className="my-2 font-mono text-2xl font-black tracking-[0.25em] text-emerald-400">
                          {pairingCode}
                        </div>
                        <p className="text-[11px] text-home-muted">
                          Digite no WhatsApp: Aparelhos conectados → Conectar com número.
                        </p>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        onClick={() => gerarQrInstancia(chipAtivoId)}
                        disabled={gerandoQr || telefonePareamento.length < 12}
                        className="w-full bg-home-orange font-bold text-xs text-white hover:bg-home-orange/90"
                      >
                        {gerandoQr ? "Gerando código..." : "Gerar código de 8 dígitos"}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* CONTEÚDO DA ETAPA 2: CONFIGURAÇÃO */}
            {etapaAssistente === 2 && (
              <div className="space-y-3.5">
                <div>
                  <h4 className="text-sm font-bold text-white">Configuração do Chip</h4>
                  <p className="text-xs text-home-muted">
                    Atribua o nome e a função operacional para distribuição inteligente
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-home-muted">Identificação do chip</Label>
                  <Input
                    value={novoNome}
                    onChange={(e) => setNovoNome(e.target.value)}
                    placeholder="Ex: Chip Vendas São Paulo"
                    className="rounded-xl border border-white/10 bg-[#121724] text-xs text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-home-muted">Função operacional</Label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(
                      [
                        { id: "principal", label: "Principal" },
                        { id: "comercial", label: "Comercial" },
                        { id: "suporte", label: "Suporte" },
                        { id: "reserva", label: "Reserva" },
                        { id: "contingencia", label: "Contingência" },
                      ] as const
                    ).map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setNovaFuncao(f.id)}
                        className={cn(
                          "cursor-pointer rounded-xl border p-2 text-left text-xs font-semibold transition-all",
                          novaFuncao === f.id
                            ? "border-home-orange bg-home-orange/15 text-white"
                            : "border-white/5 bg-[#121724] text-home-muted hover:text-white",
                        )}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEtapaAssistente(1)}
                    className="flex-1 rounded-xl border-white/10 bg-[#161c28] text-xs text-white"
                  >
                    Voltar
                  </Button>
                  <Button
                    type="button"
                    onClick={salvarConfiguracaoEtapa2}
                    className="flex-1 rounded-xl bg-home-orange text-xs font-bold text-white hover:bg-home-orange/90"
                  >
                    Avançar para Teste
                  </Button>
                </div>
              </div>
            )}

            {/* CONTEÚDO DA ETAPA 3: TESTE DE CONEXÃO E ENVIO */}
            {etapaAssistente === 3 && (
              <div className="space-y-3.5">
                <div>
                  <h4 className="text-sm font-bold text-white">Validação e Teste</h4>
                  <p className="text-xs text-home-muted">
                    Valide a conexão do aparelho em tempo real
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#121724] p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-home-muted">Status do Motor:</span>
                    <span className="font-bold text-emerald-400">Serviço ativo</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-home-muted">Latência:</span>
                    <span className="font-mono text-gray-300">~85ms</span>
                  </div>
                  {statusConexaoTeste && (
                    <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2 text-[11px] text-emerald-300">
                      {statusConexaoTeste}
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={testarConexaoEtapa3}
                    disabled={testandoConexao}
                    className="w-full rounded-xl border-white/10 bg-[#161c28] text-xs text-white mt-1"
                  >
                    {testandoConexao ? "Verificando..." : "Testar conexão"}
                  </Button>
                </div>

                <div className="space-y-1.5 pt-1">
                  <Label className="text-xs text-home-muted">
                    Teste de envio manual (Opcional)
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={numeroDestinoTeste}
                      onChange={(e) => setNumeroDestinoTeste(e.target.value.replace(/\D/g, ""))}
                      placeholder="5511987654321"
                      className="rounded-xl border border-white/10 bg-[#121724] text-xs text-white"
                    />
                    <Button
                      type="button"
                      onClick={() => enviarTesteManual(numeroDestinoTeste)}
                      disabled={enviandoMensagemTeste || numeroDestinoTeste.length < 12}
                      className="bg-emerald-600 hover:bg-emerald-700 text-xs text-white font-bold px-3 shrink-0"
                    >
                      {enviandoMensagemTeste ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Enviar"
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEtapaAssistente(2)}
                    className="flex-1 rounded-xl border-white/10 bg-[#161c28] text-xs text-white"
                  >
                    Voltar
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setEtapaAssistente(4)}
                    className="flex-1 rounded-xl bg-home-orange text-xs font-bold text-white hover:bg-home-orange/90"
                  >
                    Concluir e Ativar
                  </Button>
                </div>
              </div>
            )}

            {/* CONTEÚDO DA ETAPA 4: ATIVO E OPERACIONAL */}
            {etapaAssistente === 4 && (
              <div className="space-y-4 text-center py-2">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.4)]">
                  <CheckCircle2 className="h-7 w-7" />
                </div>

                <div>
                  <h4 className="text-base font-bold text-white">Instância Ativa!</h4>
                  <p className="text-xs text-home-muted mt-1">
                    O número está integrado ao sistema de rodízio e pronto para operações.
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#121724] p-3 text-left space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-home-muted">Instância:</span>
                    <span className="font-bold text-white">{novoNome}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-home-muted">Função:</span>
                    <span className="text-emerald-400 capitalize">{novaFuncao}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-home-muted">Estado:</span>
                    <span className="text-emerald-400 font-bold">● Conectado e Operacional</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <Button
                    type="button"
                    onClick={iniciarNovoPareamento}
                    className="w-full rounded-xl bg-home-orange text-xs font-bold text-white hover:bg-home-orange/90"
                  >
                    Conectar outro número
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEtapaAssistente(1)}
                    className="w-full rounded-xl border-white/10 bg-[#161c28] text-xs text-white"
                  >
                    Fechar assistente
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SEÇÃO INFERIOR: 3 CARDS EM GRID EQUILIBRADO (ETAPAS 7, 8 E 10) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* CARD INFERIOR ESQUERDO: SAÚDE DAS CONEXÕES (ETAPA 7 — LAYOUT APROVADO) */}
        <div className="rounded-2xl border border-[#1b2334] bg-[#0c101a] p-5 shadow-2xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Activity className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Saúde das conexões</h3>
                  <p className="text-[11px] text-home-muted">
                    Monitoramento em tempo real das suas instâncias
                  </p>
                </div>
              </div>

              {/* Filtro de Período */}
              <div className="relative">
                <select
                  value={filtroPeriodoSaude}
                  onChange={(e) => setFiltroPeriodoSaude(e.target.value)}
                  className="h-7 cursor-pointer appearance-none rounded-lg border border-white/10 bg-[#161c28] pl-2.5 pr-6 text-[10px] font-medium text-white focus:outline-none"
                >
                  <option value="24h">Últimas 24 horas</option>
                  <option value="7d">Últimos 7 dias</option>
                  <option value="hoje">Hoje</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-home-muted" />
              </div>
            </div>

            {/* Layout Interno: Donut Chart à esquerda + Legenda detalhada à direita */}
            <div className="flex items-center justify-between gap-4 pt-2">
              {/* Gráfico Donut Circular com Porcentagem Central */}
              <div className="flex flex-col items-center">
                <div className="relative flex h-28 w-28 items-center justify-center">
                  <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
                    {/* Ring background grafite */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#1e293b"
                      strokeWidth="10"
                      fill="transparent"
                    />
                    {/* Slice Vermelho (Desconectados) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#f43f5e"
                      strokeWidth="10"
                      strokeDasharray="251.2"
                      strokeDashoffset={251.2 * (1 - (saude?.desconectadosPct ?? 0) / 100)}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                    {/* Slice Verde (Conectados) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#22c55e"
                      strokeWidth="10"
                      strokeDasharray="251.2"
                      strokeDashoffset={251.2 * (1 - (saude?.conectadosPct ?? 0) / 100)}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>
                  {/* Centro do Donut */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xl font-black text-white">
                      {saude?.saudeGeralPct ?? 0}%
                    </span>
                    <span className="text-[9px] font-medium text-home-muted">Saúde geral</span>
                  </div>
                </div>

                {/* Badge de Variação (+5%) */}
                <div className="mt-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  {saude?.variacao ?? "+5%"}
                </div>
              </div>

              {/* Tabela de Legendas */}
              <div className="flex-1 space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-white/5 pb-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-home-muted">Conectados</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-white">{saude?.conectados ?? 0}</span>
                    <span className="w-8 text-right text-home-muted">
                      {saude?.conectadosPct ?? 0}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-b border-white/5 pb-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    <span className="text-home-muted">Desconectados</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-white">{saude?.desconectados ?? 0}</span>
                    <span className="w-8 text-right text-rose-400 font-medium">
                      {saude?.desconectadosPct ?? 0}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-b border-white/5 pb-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    <span className="text-home-muted">Em reconexão</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-white">{saude?.emReconexao ?? 0}</span>
                    <span className="w-8 text-right text-home-muted">
                      {saude?.emReconexaoPct ?? 0}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-gray-500" />
                    <span className="text-home-muted">Erro</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-white">{saude?.erro ?? 0}</span>
                    <span className="w-8 text-right text-home-muted">{saude?.erroPct ?? 0}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CARD CENTRAL INFERIOR: ROTAÇÃO E CONTINGÊNCIA (ETAPA 8 — LAYOUT APROVADO) */}
        <div className="rounded-2xl border border-[#1b2334] bg-[#0c101a] p-5 shadow-2xl flex flex-col justify-between">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <RefreshCw className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">Prioridade e contingência</h3>
                    <HelpTip label="prioridade e contingência">
                      A prioridade define a ordem preferencial dos números. A troca só ocorre após
                      autorização explícita de contingência; não há rodízio automático ativo.
                    </HelpTip>
                  </div>
                  <p className="text-[11px] text-home-muted">
                    Continuidade autorizada para falhas técnicas
                  </p>
                </div>
              </div>

              <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-bold text-blue-300">
                Manual
              </span>
            </div>

            {/* Campos de Configuração */}
            <div className="space-y-2 pt-1 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-home-muted whitespace-nowrap">
                  Número de backup
                  <HelpTip label="número de backup">
                    O backup só assume quando está conectado, uma origem está indisponível e você
                    ativa a contingência manualmente.
                  </HelpTip>
                </span>
                <div className="relative flex-1 max-w-[180px]">
                  <select
                    value={rotacao.backupChipId ?? ""}
                    onChange={(e) =>
                      setRotacao((current) => ({
                        ...current,
                        backupChipId: e.target.value || null,
                      }))
                    }
                    className="h-8 w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-[#161c28] px-2.5 pr-6 text-xs text-white focus:outline-none"
                  >
                    {chips.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-home-muted" />
                </div>
              </div>
            </div>

            {/* Toggles inferiores fiéis à imagem */}
            <div className="space-y-2 border-t border-white/5 pt-2.5">
              {/* Toggle 1: Contingência ativa */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                      Contingência ativa
                      <HelpTip label="contingência ativa">
                        Autoriza o uso do backup para continuidade técnica. Mensagens já aceitas ou
                        com resultado incerto nunca são reenviadas automaticamente.
                      </HelpTip>
                    </div>
                    <div className="text-[10px] text-home-muted leading-tight">
                      Requer aprovação e não migra envios aceitos ou incertos.
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleContingencia(!rotacao.contingenciaAtiva)}
                  className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                    rotacao.contingenciaAtiva ? "bg-emerald-500" : "bg-[#1f293d]",
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      rotacao.contingenciaAtiva ? "translate-x-4" : "translate-x-0",
                    )}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CARD INFERIOR DIREITO: ATIVIDADE RECENTE (ETAPA 10 — LAYOUT APROVADO) */}
        <div className="rounded-2xl border border-[#1b2334] bg-[#0c101a] p-5 shadow-2xl flex flex-col justify-between">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Atividade recente</h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalTodasAtividades(true)}
                className="cursor-pointer text-xs font-semibold text-blue-400 hover:text-blue-300"
              >
                Ver todas
              </button>
            </div>

            {/* Lista dos 6 eventos reais com ícones específicos */}
            <div className="space-y-2.5">
              {atividades.slice(0, 6).map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border",
                        item.cor === "emerald" &&
                          "border-emerald-500/30 bg-emerald-500/20 text-emerald-400",
                        item.cor === "rose" && "border-rose-500/30 bg-rose-500/20 text-rose-400",
                        item.cor === "blue" && "border-blue-500/30 bg-blue-500/20 text-blue-400",
                        item.cor === "amber" &&
                          "border-amber-500/30 bg-amber-500/20 text-amber-400",
                        item.cor === "gray" && "border-white/10 bg-white/5 text-gray-300",
                      )}
                    >
                      {item.icone === "whatsapp" && <SiWhatsapp className="h-3.5 w-3.5" />}
                      {item.icone === "alerta" && <AlertTriangle className="h-3.5 w-3.5" />}
                      {item.icone === "mensagem" && <MessageCircle className="h-3.5 w-3.5" />}
                      {item.icone === "chip" && <Zap className="h-3.5 w-3.5" />}
                      {item.icone === "config" && <Sliders className="h-3.5 w-3.5" />}
                    </div>

                    <div className="min-w-0">
                      <div className="truncate font-bold text-white">{item.titulo}</div>
                      <div className="truncate text-[11px] text-home-muted">{item.subtitulo}</div>
                    </div>
                  </div>

                  <span className="font-mono text-[11px] text-home-muted shrink-0">
                    {item.horario}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Dialog
        open={Boolean(erroPareamento)}
        onOpenChange={(open) => {
          if (!open) setErroPareamento(null);
        }}
      >
        <DialogContent className="sm:max-w-sm border border-destructive/30 bg-popover text-popover-foreground">
          <DialogHeader className="items-center text-center sm:text-center">
            <div className="mb-1 flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="size-5" aria-hidden="true" />
            </div>
            <DialogTitle className="text-base font-bold">
              Não foi possível gerar o pareamento
            </DialogTitle>
            <DialogDescription className="text-center text-xs leading-relaxed text-muted-foreground">
              {erroPareamento}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => setErroPareamento(null)}
              className="min-w-24"
            >
              Fechar
            </Button>
            <Button
              type="button"
              onClick={() => {
                setErroPareamento(null);
                void gerarQrInstancia(chipAtivoId, metodoConexao);
              }}
              className="min-w-24 bg-home-orange text-white hover:bg-home-orange/90"
            >
              Tentar novamente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: EDITAR CONFIGURAÇÕES DO CHIP */}
      <Dialog open={modalEditarAberto} onOpenChange={setModalEditarAberto}>
        <DialogContent className="sm:max-w-md border border-[#1b2334] bg-[#0c101a] text-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white">
              Configurações da Instância
            </DialogTitle>
            <DialogDescription className="text-xs text-home-muted">
              Altere o nome amigável e a classificação operacional do número.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-home-muted">Nome da Instância</Label>
              <Input
                value={editNome}
                onChange={(e) => setEditNome(e.target.value)}
                placeholder="Ex: Chip Vendas São Paulo"
                className="rounded-xl border border-white/10 bg-[#121724] text-xs text-white"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-home-muted">Função Operacional</Label>
              <select
                value={editFuncao}
                onChange={(e) => setEditFuncao(e.target.value as WaFuncaoOperacional)}
                className="h-9 w-full rounded-xl border border-white/10 bg-[#121724] px-3 text-xs text-white focus:outline-none"
              >
                <option value="principal">Principal (Número Oficial de Atendimento)</option>
                <option value="comercial">Comercial (Disparos e Propostas)</option>
                <option value="suporte">Suporte (Atendimento Pós-Venda)</option>
                <option value="reserva">Reserva (Pronto para Substituição)</option>
                <option value="contingencia">Contingência (Backup Imediato)</option>
              </select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalEditarAberto(false)}
              className="border-white/10 bg-[#161c28] text-xs text-white"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={salvarEdicaoChip}
              className="bg-home-orange text-xs font-bold text-white hover:bg-home-orange/90"
            >
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: CONFIRMAR EXCLUSÃO DO CHIP */}
      <Dialog open={modalExcluirAberto} onOpenChange={setModalExcluirAberto}>
        <DialogContent className="sm:max-w-md border border-rose-500/30 bg-[#0c101a] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-rose-400">
              <AlertTriangle className="h-5 w-5" />
              Excluir Instância WhatsApp
            </DialogTitle>
            <DialogDescription className="text-xs text-home-muted">
              Tem certeza que deseja excluir o chip{" "}
              <b className="text-white">{chipParaExcluir?.nome}</b>?
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-200">
            Esta ação desvincula a sessão do WhatsApp e remove a conexão desta lista. Mensagens,
            envios e registros de auditoria serão preservados.
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalExcluirAberto(false)}
              className="border-white/10 bg-[#161c28] text-xs text-white"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={confirmarExclusao}
              disabled={excluindoChip}
              className="bg-rose-600 text-xs font-bold text-white hover:bg-rose-700"
            >
              {excluindoChip ? "Excluindo..." : "Confirmar Exclusão"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: ENVIAR TESTE */}
      <Dialog open={modalTesteAberto} onOpenChange={setModalTesteAberto}>
        <DialogContent className="sm:max-w-md border border-[#1b2334] bg-[#0c101a] text-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white">
              Enviar Mensagem de Teste
            </DialogTitle>
            <DialogDescription className="text-xs text-home-muted">
              Envie uma mensagem de verificação através da instância selecionada.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs text-home-muted">Destinatário (DDI + DDD + Número)</Label>
              <Input
                value={numeroDestinoTeste}
                onChange={(e) => setNumeroDestinoTeste(e.target.value.replace(/\D/g, ""))}
                placeholder="Ex: 5511987654321"
                className="rounded-xl border border-white/10 bg-[#121724] text-xs text-white"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalTesteAberto(false)}
              className="border-white/10 bg-[#161c28] text-xs text-white"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => {
                enviarTesteManual(numeroDestinoTeste);
                setModalTesteAberto(false);
              }}
              disabled={numeroDestinoTeste.length < 12}
              className="bg-home-orange text-xs font-bold text-white hover:bg-home-orange/90"
            >
              Enviar Teste
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: TODAS AS ATIVIDADES */}
      <Dialog open={modalTodasAtividades} onOpenChange={setModalTodasAtividades}>
        <DialogContent className="sm:max-w-lg border border-[#1b2334] bg-[#0c101a] text-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white">
              Histórico Completo de Atividades
            </DialogTitle>
            <DialogDescription className="text-xs text-home-muted">
              Registros e alertas das instâncias e rotinas de contingência.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-80 overflow-y-auto space-y-2 py-2 pr-1 scrollbar-thin">
            {atividades.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-[#121724] p-3 text-xs"
              >
                <div>
                  <div className="font-bold text-white">{a.titulo}</div>
                  <div className="text-home-muted text-[11px]">{a.subtitulo}</div>
                </div>
                <span className="font-mono text-home-muted text-[11px] shrink-0">{a.horario}</span>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              type="button"
              onClick={() => setModalTodasAtividades(false)}
              className="bg-home-orange text-xs font-bold text-white hover:bg-home-orange/90"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
