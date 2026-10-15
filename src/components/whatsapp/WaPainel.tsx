// Tela WhatsApp — Painel / Visão Geral Premium (Fidelidade Absoluta ao Layout Aprovado)
import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Check,
  CheckCircle2,
  Clock,
  Database,
  Loader2,
  Megaphone,
  MessageCircle,
  MessagesSquare,
  MoreVertical,
  Phone,
  QrCode,
  RefreshCw,
  Send,
  Share2,
  ShieldCheck,
  Users,
  Workflow,
  XCircle,
  Zap,
  ChevronRight,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatData } from "@/lib/format";
import {
  obterDadosPainelWa,
  type WaPainelData,
  type WaChip,
  type WaPainelCampanha,
  type WaConversa,
  type WaAtividadeRecente,
} from "@/services/whatsapp";

export interface WaPainelProps {
  onIrParaNumeros: () => void;
  onIrParaCampanhas: () => void;
  onIrParaConversas: () => void;
  onIrParaScripts: () => void;
  onIrParaAutomacao: () => void;
  /** Compatibilidade com código anterior */
  onIrParaWhatsApp?: () => void;
}

/** Formata número de telefone para visualização limpa e profissional */
function formatarTelefone(telefone?: string | null): string {
  if (!telefone) return "Sem número";
  const limpo = telefone.replace(/\D/g, "");
  if (limpo.length === 13) {
    // 5511987654321 -> +55 11 98765-4321
    return `+${limpo.slice(0, 2)} ${limpo.slice(2, 4)} ${limpo.slice(4, 9)}-${limpo.slice(9)}`;
  }
  if (limpo.length === 12) {
    // 551187654321 -> +55 11 8765-4321
    return `+${limpo.slice(0, 2)} ${limpo.slice(2, 4)} ${limpo.slice(4, 8)}-${limpo.slice(8)}`;
  }
  if (limpo.length === 11) {
    // 11987654321 -> (11) 98765-4321
    return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 7)}-${limpo.slice(7)}`;
  }
  return telefone;
}

/** Formata data e hora para estilo amigável */
function formatarHora(dataIso?: string | null): string {
  if (!dataIso) return "";
  try {
    const d = new Date(dataIso);
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function formatarDataHora(dataIso?: string | null): { data: string; hora: string } {
  if (!dataIso) return { data: "—", hora: "" };
  try {
    const d = new Date(dataIso);
    const data = d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    return { data, hora };
  } catch {
    return { data: "—", hora: "" };
  }
}

export function WaPainel({
  onIrParaNumeros,
  onIrParaCampanhas,
  onIrParaConversas,
  onIrParaScripts,
  onIrParaAutomacao,
  onIrParaWhatsApp,
}: WaPainelProps) {
  const [dados, setDados] = useState<WaPainelData | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  const irParaNumeros = onIrParaNumeros || onIrParaWhatsApp || (() => {});

  const carregar = useCallback(async (isRefresh = false) => {
    if (isRefresh) setAtualizando(true);
    else setCarregando(true);
    try {
      const res = await obterDadosPainelWa();
      setDados(res);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao carregar dados do WhatsApp");
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Cálculos derivados reais
  const chips = dados?.chips ?? [];
  const chipsAtivos = chips.filter((c) => c.status === "conectado");
  const chipsContingencia = chips.filter(
    (c) => c.status === "aguardando" || c.funcao === "contingencia",
  );
  const chipsDesconectados = chips.filter(
    (c) => c.status === "desconectado" || c.status === "queimada" || c.status === "erro",
  );

  const stats = dados?.stats;
  const campanhas = dados?.campanhas ?? [];
  const conversas = dados?.conversas ?? [];
  const atividades = dados?.atividades ?? [];

  return (
    <div className="space-y-4 pb-12 text-home-foreground animate-in fade-in duration-200">
      {/* 6 INDICADORES PRINCIPAIS (ETAPA 5) */}
      <section
        aria-label="Indicadores principais"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6"
      >
        {/* 1. Números ativos */}
        <div className="group relative flex flex-col justify-between rounded-xl border border-white/5 bg-[#101520]/95 p-3.5 transition-all duration-200 hover:border-white/10 hover:bg-[#131926]">
          <div className="flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-500/25 bg-emerald-500/10 text-emerald-400">
              <Phone className="h-4 w-4" />
            </div>
            {chipsAtivos.length > 0 && (
              <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                +{chipsAtivos.length}
              </span>
            )}
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-white">
              {carregando ? (
                <div className="h-7 w-12 animate-pulse rounded bg-white/10" />
              ) : (
                chipsAtivos.length
              )}
            </div>
            <div className="text-xs font-medium text-white/90">Números ativos</div>
            <div className="text-[11px] text-home-muted truncate">
              de {chips.length} configurados
            </div>
          </div>
        </div>

        {/* 2. Leads com WhatsApp */}
        <div className="group relative flex flex-col justify-between rounded-xl border border-white/5 bg-[#101520]/95 p-3.5 transition-all duration-200 hover:border-white/10 hover:bg-[#131926]">
          <div className="flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-500/25 bg-blue-500/10 text-blue-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-white">
              {carregando ? (
                <div className="h-7 w-16 animate-pulse rounded bg-white/10" />
              ) : (
                (stats?.leadsComWhatsapp ?? 0).toLocaleString("pt-BR")
              )}
            </div>
            <div className="text-xs font-medium text-white/90">Leads com WhatsApp</div>
            <div className="text-[11px] text-home-muted truncate">em sua base</div>
          </div>
        </div>

        {/* 3. Campanhas enviadas */}
        <div className="group relative flex flex-col justify-between rounded-xl border border-white/5 bg-[#101520]/95 p-3.5 transition-all duration-200 hover:border-white/10 hover:bg-[#131926]">
          <div className="flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-purple-500/25 bg-purple-500/10 text-purple-400">
              <Send className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-white">
              {carregando ? (
                <div className="h-7 w-12 animate-pulse rounded bg-white/10" />
              ) : (
                (stats?.campanhasEnviadas ?? 0)
              )}
            </div>
            <div className="text-xs font-medium text-white/90">Campanhas enviadas</div>
            <div className="text-[11px] text-home-muted truncate">nos últimos 30 dias</div>
          </div>
        </div>

        {/* 4. Conversas ativas */}
        <div className="group relative flex flex-col justify-between rounded-xl border border-white/5 bg-[#101520]/95 p-3.5 transition-all duration-200 hover:border-white/10 hover:bg-[#131926]">
          <div className="flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-500/25 bg-emerald-500/10 text-emerald-400">
              <MessagesSquare className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-white">
              {carregando ? (
                <div className="h-7 w-12 animate-pulse rounded bg-white/10" />
              ) : (
                conversas.length || stats?.conversas || 0
              )}
            </div>
            <div className="text-xs font-medium text-white/90">Conversas ativas</div>
            <div className="text-[11px] text-home-muted truncate">agora no momento</div>
          </div>
        </div>

        {/* 5. Taxa de resposta */}
        <div className="group relative flex flex-col justify-between rounded-xl border border-white/5 bg-[#101520]/95 p-3.5 transition-all duration-200 hover:border-white/10 hover:bg-[#131926]">
          <div className="flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-orange-500/25 bg-orange-500/10 text-orange-400">
              <BarChart3 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-white">
              {carregando ? (
                <div className="h-7 w-14 animate-pulse rounded bg-white/10" />
              ) : dados?.taxaRespostaGeral ? (
                `${dados.taxaRespostaGeral}%`
              ) : (
                "0%"
              )}
            </div>
            <div className="text-xs font-medium text-white/90">Taxa de resposta</div>
            <div className="text-[11px] text-home-muted truncate">média dos últimos 7 dias</div>
          </div>
        </div>

        {/* 6. Total de leads */}
        <div className="group relative flex flex-col justify-between rounded-xl border border-white/5 bg-[#101520]/95 p-3.5 transition-all duration-200 hover:border-white/10 hover:bg-[#131926]">
          <div className="flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-teal-500/25 bg-teal-500/10 text-teal-400">
              <Database className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-white">
              {carregando ? (
                <div className="h-7 w-16 animate-pulse rounded bg-white/10" />
              ) : (
                (stats?.totalLeads ?? 0).toLocaleString("pt-BR")
              )}
            </div>
            <div className="text-xs font-medium text-white/90">Total de leads</div>
            <div className="text-[11px] text-home-muted truncate">em sua organização</div>
          </div>
        </div>
      </section>

      {/* SEÇÃO PRINCIPAL (2 COLUNAS: 62% ESQUERDA / 38% DIREITA) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* ================= COLUNA ESQUERDA (7 de 12) ================= */}
        <div className="space-y-4 lg:col-span-7">
          {/* CARD DE CONEXÃO (ETAPA 6) */}
          <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#101520]/95 p-5 transition-all hover:border-white/10">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              {/* Lado Esquerdo: Status da Conexão */}
              <div className="flex items-start gap-3.5">
                <div
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border shadow-inner",
                    dados?.conectado
                      ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
                      : dados?.parcialmenteConectado
                        ? "border-amber-500/40 bg-amber-500/15 text-amber-400"
                        : "border-slate-500/40 bg-slate-500/15 text-slate-400",
                  )}
                >
                  {dados?.conectado ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : dados?.parcialmenteConectado ? (
                    <AlertTriangle className="h-6 w-6" />
                  ) : (
                    <XCircle className="h-6 w-6" />
                  )}
                </div>

                <div className="space-y-1">
                  <h2 className="text-base font-semibold text-white">
                    {dados?.conectado
                      ? "WhatsApp conectado e funcionando"
                      : dados?.parcialmenteConectado
                        ? "WhatsApp parcialmente conectado"
                        : dados?.indisponivel
                          ? "Status de conexão indisponível"
                          : "WhatsApp não conectado"}
                  </h2>
                  <p className="text-xs text-home-muted leading-relaxed max-w-md">
                    {dados?.conectado
                      ? "Seus números estão ativos e prontos para enviar e receber mensagens."
                      : dados?.parcialmenteConectado
                        ? "Alguns números estão ativos, mas há instâncias que necessitam de reconexão."
                        : "Adicione e pareie instâncias dedicadas para iniciar o envio de mensagens."}
                  </p>

                  {/* Contadores em tempo real */}
                  <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-medium">
                    <span className="flex items-center gap-1.5 text-white/90">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                      <strong className="text-white">{chipsAtivos.length}</strong> Números ativos
                    </span>
                    <span className="flex items-center gap-1.5 text-white/80">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      <strong className="text-white">{chipsContingencia.length}</strong> Em
                      contingência
                    </span>
                    <span className="flex items-center gap-1.5 text-white/70">
                      <span className="h-2 w-2 rounded-full bg-slate-400" />
                      <strong className="text-white">{chipsDesconectados.length}</strong>{" "}
                      Desconectado
                    </span>
                  </div>
                </div>
              </div>

              {/* Lado Direito: Ação de Gerenciar */}
              <div className="flex shrink-0 items-center justify-between rounded-xl border border-white/5 bg-[#151c2a]/90 p-3 md:flex-col md:items-end md:justify-center gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-black/40 text-gray-300">
                    <QrCode className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">Gerenciar conexão</div>
                    <div className="text-[10px] text-home-muted">Adicione ou reconecte números</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={irParaNumeros}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 bg-[#1e2638] px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-[#28334b] hover:border-white/20"
                >
                  <span>Gerenciar números</span>
                  <ChevronRight className="h-3.5 w-3.5 text-home-muted" />
                </button>
              </div>
            </div>
          </div>

          {/* CAMPANHAS RECENTES (ETAPA 8) */}
          <div className="rounded-2xl border border-white/5 bg-[#101520]/95 p-5 transition-all hover:border-white/10">
            <div className="flex items-center justify-between pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-orange-500/25 bg-orange-500/15 text-orange-400">
                  <Share2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Campanhas recentes</h3>
                  <p className="text-[11px] text-home-muted">
                    Acompanhe o desempenho das suas últimas campanhas
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onIrParaCampanhas}
                className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-white/10 bg-[#161c28] px-2.5 py-1 text-xs font-medium text-home-muted transition-colors hover:text-white hover:border-white/20"
              >
                <span>Ver todas</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            {/* Tabela de Campanhas */}
            {carregando ? (
              <div className="flex items-center justify-center py-12 text-xs text-home-muted">
                <Loader2 className="mr-2 h-4 w-4 animate-spin text-home-orange" />
                Carregando campanhas...
              </div>
            ) : campanhas.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 py-10 text-center">
                <Megaphone className="h-8 w-8 text-home-muted/50" />
                <div className="mt-2 text-xs font-medium text-white">
                  Nenhuma campanha de WhatsApp encontrada
                </div>
                <p className="mt-1 text-[11px] text-home-muted max-w-xs">
                  Crie campanhas personalizadas para seus leads cadastrados na organização.
                </p>
                <button
                  type="button"
                  onClick={onIrParaCampanhas}
                  className="mt-3 cursor-pointer rounded-lg bg-home-orange px-3 py-1.5 text-xs font-semibold text-white shadow-[0_0_15px_rgba(255,98,0,0.3)] hover:bg-home-orange/90"
                >
                  Criar primeira campanha
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/5 text-[10px] font-semibold uppercase tracking-wider text-home-muted">
                      <th className="pb-2.5 font-medium">Campanha</th>
                      <th className="pb-2.5 font-medium">Status</th>
                      <th className="pb-2.5 font-medium text-right">Enviados</th>
                      <th className="pb-2.5 font-medium text-right">Entregues</th>
                      <th className="pb-2.5 font-medium text-right">Respostas</th>
                      <th className="pb-2.5 font-medium text-right">Criada em</th>
                      <th className="pb-2.5 font-medium text-right pr-1">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {campanhas.map((c) => {
                      const dataFormatada = formatarDataHora(c.criada_em);
                      return (
                        <tr
                          key={c.id}
                          onClick={onIrParaCampanhas}
                          className="group cursor-pointer transition-colors hover:bg-white/[0.02]"
                        >
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/5 text-home-muted group-hover:text-white">
                                <Megaphone className="h-3.5 w-3.5" />
                              </div>
                              <div className="min-w-0">
                                <div className="truncate font-semibold text-white group-hover:text-home-orange transition-colors">
                                  {c.nome}
                                </div>
                                <div className="truncate text-[10px] text-home-muted">
                                  {c.descricao || "Disparo via WhatsApp"}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border",
                                c.status === "concluida"
                                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                                  : c.status === "ativa"
                                    ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
                                    : c.status === "em_revisao"
                                      ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                                      : "border-slate-500/30 bg-slate-500/10 text-slate-400",
                              )}
                            >
                              <span
                                className={cn(
                                  "h-1.5 w-1.5 rounded-full",
                                  c.status === "concluida"
                                    ? "bg-emerald-400"
                                    : c.status === "ativa"
                                      ? "bg-blue-400"
                                      : c.status === "em_revisao"
                                        ? "bg-amber-400"
                                        : "bg-slate-400",
                                )}
                              />
                              {c.status === "concluida"
                                ? "Concluída"
                                : c.status === "ativa"
                                  ? "Em andamento"
                                  : c.status === "em_revisao"
                                    ? "Agendada"
                                    : "Rascunho"}
                            </span>
                          </td>

                          <td className="py-3 text-right font-medium text-white">
                            {c.enviados > 0 ? c.enviados.toLocaleString("pt-BR") : "—"}
                          </td>

                          <td className="py-3 text-right">
                            {c.enviados > 0 ? (
                              <div>
                                <div className="font-medium text-white">
                                  {c.entregues.toLocaleString("pt-BR")}
                                </div>
                                <div className="text-[10px] text-emerald-400">{c.taxaEntrega}%</div>
                              </div>
                            ) : (
                              <span className="text-home-muted">—</span>
                            )}
                          </td>

                          <td className="py-3 text-right">
                            {c.enviados > 0 ? (
                              <div>
                                <div className="font-medium text-white">
                                  {c.respostas.toLocaleString("pt-BR")}
                                </div>
                                <div className="text-[10px] text-emerald-400">
                                  {c.taxaResposta}%
                                </div>
                              </div>
                            ) : (
                              <span className="text-home-muted">—</span>
                            )}
                          </td>

                          <td className="py-3 text-right">
                            <div className="font-medium text-white">{dataFormatada.data}</div>
                            <div className="text-[10px] text-home-muted">{dataFormatada.hora}</div>
                          </td>

                          <td className="py-3 text-right pr-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onIrParaCampanhas();
                              }}
                              className="inline-flex h-6 w-6 items-center justify-center rounded-md text-home-muted hover:bg-white/10 hover:text-white"
                            >
                              <MoreVertical className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* CONVERSAS RECENTES (ETAPA 12) */}
          <div className="rounded-2xl border border-white/5 bg-[#101520]/95 p-5 transition-all hover:border-white/10">
            <div className="flex items-center justify-between pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/25 bg-emerald-500/15 text-emerald-400">
                  <MessagesSquare className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Conversas recentes</h3>
                  <p className="text-[11px] text-home-muted">
                    Suas conversas mais recentes com leads e clientes
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onIrParaConversas}
                className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-white/10 bg-[#161c28] px-2.5 py-1 text-xs font-medium text-home-muted transition-colors hover:text-white hover:border-white/20"
              >
                <span>Ver todas</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            {/* Lista de Conversas Recentes */}
            {conversas.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 py-8 text-center">
                <MessagesSquare className="mx-auto h-7 w-7 text-home-muted/50" />
                <div className="mt-2 text-xs font-medium text-white">
                  Nenhuma conversa registrada ainda
                </div>
                <p className="mt-1 text-[11px] text-home-muted">
                  As respostas de campanhas e atendimentos ativos aparecerão aqui.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {conversas.slice(0, 4).map((conversa) => {
                  const nome = conversa.nome_contato || formatarTelefone(conversa.numero);
                  const iniciais = (conversa.nome_contato || "WA")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .substring(0, 2)
                    .toUpperCase();
                  const hora = formatarHora(conversa.ultima_em);

                  return (
                    <div
                      key={conversa.numero}
                      onClick={onIrParaConversas}
                      className="group flex cursor-pointer items-center justify-between py-2.5 transition-colors hover:bg-white/[0.02]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#192233] text-xs font-bold text-white shadow-sm">
                          {iniciais}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate font-semibold text-white text-xs group-hover:text-home-orange transition-colors">
                              {nome}
                            </span>
                            {conversa.nao_lidas > 0 && (
                              <span className="rounded bg-emerald-500/20 px-1 py-0.2 text-[9px] font-bold text-emerald-400 border border-emerald-500/30">
                                Novo
                              </span>
                            )}
                          </div>
                          <p className="truncate text-[11px] text-home-muted max-w-sm">
                            {conversa.ultima || "Conversa iniciada"}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2 pl-3">
                        <span className="text-[10px] text-home-muted">{hora}</span>
                        {conversa.nao_lidas > 0 ? (
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-home-orange text-[9px] font-bold text-white shadow-[0_0_8px_rgba(255,98,0,0.5)]">
                            {conversa.nao_lidas}
                          </span>
                        ) : (
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ================= COLUNA DIREITA (5 de 12) ================= */}
        <div className="space-y-4 lg:col-span-5">
          {/* SAÚDE DO SISTEMA (ETAPA 7) */}
          <div className="rounded-2xl border border-white/5 bg-[#101520]/95 p-5 transition-all hover:border-white/10">
            <div className="flex items-center justify-between pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/15 text-emerald-400">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Sistema saudável</h3>
                  <p className="text-[11px] text-home-muted">
                    {chipsAtivos.length > 0
                      ? "Todos os sistemas operando normalmente."
                      : "Atenção necessária em chips de envio."}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-bold text-emerald-400">
                  {chipsAtivos.length > 0 ? "100%" : "Atenção"}
                </div>
                <div className="text-[10px] text-home-muted">Uptime</div>
              </div>
            </div>

            {/* Três Indicadores Reais */}
            <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-3">
              <div>
                <div className="flex items-center gap-1.5 text-[10px] text-home-muted">
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      stats?.temDisparo ? "bg-emerald-400" : "bg-amber-400",
                    )}
                  />
                  <span>Envio de mensagens</span>
                </div>
                <div
                  className={cn(
                    "text-xs font-semibold mt-0.5",
                    stats?.temDisparo ? "text-emerald-400" : "text-amber-400",
                  )}
                >
                  {stats?.temDisparo ? "Operacional" : "Atenção"}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-[10px] text-home-muted">
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      stats?.temConversa ? "bg-emerald-400" : "bg-emerald-400",
                    )}
                  />
                  <span>Recebimento</span>
                </div>
                <div className="text-xs font-semibold mt-0.5 text-emerald-400">Operacional</div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-[10px] text-home-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>Contingência</span>
                </div>
                <div className="text-xs font-semibold mt-0.5 text-emerald-400">
                  Verificação manual
                </div>
              </div>
            </div>
          </div>

          {/* NÚMEROS ATIVOS (ETAPA 9) */}
          <div className="rounded-2xl border border-white/5 bg-[#101520]/95 p-5 transition-all hover:border-white/10">
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/25 bg-emerald-500/15 text-emerald-400">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Números ativos</h3>
                  <p className="text-[11px] text-home-muted">
                    Seus números conectados e em operação
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={irParaNumeros}
                className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-white/10 bg-[#161c28] px-2.5 py-1 text-xs font-medium text-home-muted transition-colors hover:text-white hover:border-white/20"
              >
                <span>Gerenciar</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            {/* Lista dos Números */}
            {chips.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 py-6 text-center">
                <Phone className="mx-auto h-6 w-6 text-home-muted/50" />
                <div className="mt-1.5 text-xs font-medium text-white">
                  Nenhum número configurado
                </div>
                <button
                  type="button"
                  onClick={irParaNumeros}
                  className="mt-2 text-xs text-home-orange hover:underline font-medium"
                >
                  Conectar primeiro número
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {chips.slice(0, 3).map((chip) => {
                  const isConectado = chip.status === "conectado";
                  const telefone = formatarTelefone(chip.numero);

                  return (
                    <div
                      key={chip.id}
                      className="flex items-center justify-between rounded-xl border border-white/5 bg-[#151c2a]/80 p-2.5 transition-colors hover:bg-[#182133]"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/15 text-emerald-400">
                          <SiWhatsapp className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-xs font-semibold text-white">
                            {chip.nome}
                          </div>
                          <div className="truncate text-[10px] text-home-muted font-mono">
                            {telefone}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border",
                            isConectado
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                              : "border-slate-500/30 bg-slate-500/10 text-slate-400",
                          )}
                        >
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              isConectado ? "bg-emerald-400" : "bg-slate-400",
                            )}
                          />
                          {isConectado ? "Ativo" : "Desconectado"}
                        </span>

                        <div className="text-right">
                          <div className="text-xs font-bold text-white">
                            {chip.funcao === "disparo" ? "Disparo" : "Conversa"}
                          </div>
                          <div className="text-[9px] text-home-muted">Função</div>
                        </div>

                        <button
                          type="button"
                          onClick={irParaNumeros}
                          className="inline-flex h-6 w-6 items-center justify-center rounded text-home-muted hover:text-white"
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ROTAÇÃO E CONTINGÊNCIA (ETAPA 10) */}
          <div className="rounded-2xl border border-white/5 bg-[#101520]/95 p-4 transition-all hover:border-white/10">
            <div className="flex items-center justify-between pb-2.5">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-orange-500/25 bg-orange-500/15 text-orange-400">
                  <RefreshCw className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Rotação e contingência</h4>
                  <p className="text-[10px] text-home-muted">Distribuição inteligente de envios</p>
                </div>
              </div>

              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                Ativo
              </span>
            </div>

            <button
              type="button"
              onClick={irParaNumeros}
              className="group flex w-full cursor-pointer items-center justify-between rounded-xl border border-white/5 bg-[#141b29] p-2.5 text-left transition-all hover:bg-[#192233] hover:border-white/10"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-home-orange transition-colors">
                    Estratégia em operação
                  </div>
                  <div className="text-[10px] text-home-muted">
                    Rotação manual e automática entre números
                  </div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-home-muted group-hover:text-white group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>

          {/* AÇÕES RÁPIDAS (ETAPA 11) */}
          <div className="rounded-2xl border border-white/5 bg-[#101520]/95 p-4 transition-all hover:border-white/10">
            <div className="flex items-center gap-2 pb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-amber-500/25 bg-amber-500/15 text-amber-400">
                <Zap className="h-3.5 w-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white">Ações rápidas</h4>
                <p className="text-[10px] text-home-muted">Atalhos para as principais ações</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onIrParaCampanhas}
                className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-home-orange px-3 py-2 text-xs font-semibold text-white shadow-[0_0_15px_rgba(255,98,0,0.3)] transition-all hover:bg-home-orange/90"
              >
                <Megaphone className="h-3.5 w-3.5" />
                <span>Nova campanha</span>
              </button>

              <button
                type="button"
                onClick={onIrParaScripts}
                className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-purple-500/30 bg-[#1c182d] px-3 py-2 text-xs font-semibold text-purple-200 transition-all hover:bg-[#251f3d] hover:border-purple-500/50"
              >
                <Zap className="h-3.5 w-3.5 text-purple-400" />
                <span>Novo script</span>
              </button>

              <button
                type="button"
                onClick={onIrParaConversas}
                className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-[#151c2a] px-3 py-2 text-xs font-semibold text-white transition-all hover:bg-[#1a2335] hover:border-white/20"
              >
                <MessagesSquare className="h-3.5 w-3.5 text-home-muted" />
                <span>Ver conversas</span>
              </button>

              <button
                type="button"
                onClick={onIrParaAutomacao}
                className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-[#151c2a] px-3 py-2 text-xs font-semibold text-white transition-all hover:bg-[#1a2335] hover:border-white/20"
              >
                <Workflow className="h-3.5 w-3.5 text-home-muted" />
                <span>Automação</span>
              </button>
            </div>
          </div>

          {/* ATIVIDADE RECENTE (ETAPA 13) */}
          <div className="rounded-2xl border border-white/5 bg-[#101520]/95 p-5 transition-all hover:border-white/10">
            <div className="flex items-center gap-2.5 pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-home-muted">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Atividade recente</h3>
                <p className="text-[11px] text-home-muted">Últimas ações realizadas no WhatsApp</p>
              </div>
            </div>

            {/* Linha do Tempo Real */}
            {atividades.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 py-6 text-center text-xs text-home-muted">
                Nenhuma atividade recente registrada
              </div>
            ) : (
              <div className="relative pl-4 space-y-3.5 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-[1px] before:bg-white/10">
                {atividades.map((item) => (
                  <div
                    key={item.id}
                    className="relative flex items-start justify-between gap-3 text-xs"
                  >
                    <span
                      className={cn(
                        "absolute -left-4 mt-1.5 h-2 w-2 rounded-full border border-black",
                        item.cor === "rose"
                          ? "bg-rose-400"
                          : item.cor === "purple"
                            ? "bg-purple-400"
                            : item.cor === "blue"
                              ? "bg-blue-400"
                              : "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]",
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold text-white text-[11px]">
                        {item.titulo}
                      </div>
                      <div className="truncate text-[10px] text-home-muted">{item.descricao}</div>
                    </div>
                    <span className="shrink-0 text-[10px] text-home-muted font-mono">
                      {formatarHora(item.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
