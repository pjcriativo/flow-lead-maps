// Tela 10 — chat REAL com o CEO Mestre. Ocupa a área principal da tela (sem cards decorativos): conversa,
// contexto da operação, ações geradas (planos e tarefas) e histórico. Usa a Edge `agent-ceo` existente
// (runtime, ferramentas autorizadas, teto de custo, kill-switch) e o provedor definido no Super Admin.
// Nada aqui responde por conta própria: sem CEO ativo ou sem provedor, explica o motivo e mostra o caminho.
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  ChevronRight,
  Copy,
  Crown,
  History,
  Loader2,
  MessageSquarePlus,
  Send,
  Sparkles,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ATALHOS_INICIAIS,
  LIMITE_MENSAGEM,
  SUGESTOES_DE_CONTROLE,
  agruparPorData,
  blocosDeTexto,
  bloqueioDoChat,
  planoComoTexto,
  type Trecho,
} from "@/lib/ceo-chat";
import { ROTULO_FERRAMENTA, META_PAPEL, PAPEIS, type Papel } from "@/lib/equipe-config";
import { formatarUsd } from "@/lib/ceo-config";
import {
  CEO_CHAT_PERSISTENTE_HABILITADO,
  perguntarAoCeo,
  type AcaoChat,
} from "@/services/agente-ceo";
import {
  arquivarConversa,
  carregarMensagens,
  listarConversas,
  statusDasAprovacoes,
  vincularOperacao,
  type ConversaLinha,
} from "@/services/agente-conversas";
import {
  carregarOperacoes,
  decidirPropostaOperacao,
  type OperacaoLinha,
} from "@/services/agente-operacoes";
import { decidirPropostaEquipe } from "@/services/agente-equipe-admin";
import { ErroCeo } from "@/services/agente-ceo-admin";
import { CeoEstadoPill } from "./CeoRealUi";
import type { CeoReal } from "./useCeoReal";

type Msg = {
  id: string;
  papel: "user" | "assistant";
  conteudo: string;
  ferramentas: string[];
  acoes: AcaoChat[];
  criadoEm: string;
  /** Mensagem de erro do sistema (não é resposta do CEO). */
  erro?: { clientId: string; texto: string };
};

const rotuloPapel = (p: string) =>
  PAPEIS.includes(p as Papel) ? META_PAPEL[p as Papel].rotulo : p;
const hora = (iso: string) =>
  new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

function Texto({ trechos }: { trechos: Trecho[] }) {
  return (
    <>
      {trechos.map((t, i) =>
        t.negrito ? (
          <strong key={i} className="font-semibold text-white">
            {t.texto}
          </strong>
        ) : (
          <React.Fragment key={i}>{t.texto}</React.Fragment>
        ),
      )}
    </>
  );
}

function Conteudo({ texto }: { texto: string }) {
  const blocos = useMemo(() => blocosDeTexto(texto), [texto]);
  return (
    <div className="space-y-2.5 text-[13.5px] leading-relaxed text-neutral-200">
      {blocos.map((b, i) => {
        if (b.tipo === "titulo")
          return (
            <p key={i} className="pt-1 text-sm font-bold text-white">
              <Texto trechos={b.trechos} />
            </p>
          );
        if (b.tipo === "codigo")
          return (
            <pre
              key={i}
              className="overflow-x-auto rounded-lg bg-black/40 p-3 text-xs text-neutral-300"
            >
              {b.texto}
            </pre>
          );
        if (b.tipo === "lista") {
          const Tag = b.ordenada ? "ol" : "ul";
          return (
            <Tag
              key={i}
              className={cn("space-y-1 pl-5", b.ordenada ? "list-decimal" : "list-disc")}
            >
              {b.itens.map((it, j) => (
                <li key={j}>
                  <Texto trechos={it} />
                </li>
              ))}
            </Tag>
          );
        }
        return (
          <p key={i}>
            <Texto trechos={b.trechos} />
          </p>
        );
      })}
    </div>
  );
}

function BotaoCopiar({ texto, rotulo = "Copiar" }: { texto: string; rotulo?: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <button
      type="button"
      aria-label={rotulo}
      onClick={() => {
        void navigator.clipboard?.writeText(texto).then(() => {
          setCopiado(true);
          setTimeout(() => setCopiado(false), 1800);
        });
      }}
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-neutral-500 transition-colors hover:bg-white/5 hover:text-neutral-200"
    >
      {copiado ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
      {copiado ? "Copiado" : rotulo}
    </button>
  );
}

const ROTULO_STATUS: Record<string, { rotulo: string; cls: string }> = {
  pending: { rotulo: "Aguardando sua aprovação", cls: "bg-amber-500/15 text-amber-300" },
  approved: { rotulo: "Aprovado", cls: "bg-emerald-500/15 text-emerald-300" },
  rejected: { rotulo: "Rejeitado", cls: "bg-rose-500/15 text-rose-300" },
};

function CartaoAcao({
  acao,
  status,
  ocupado,
  onAprovar,
  onAjustar,
  onVerOperacao,
  onConsultarEquipe,
}: {
  acao: AcaoChat;
  status: string | undefined;
  ocupado: boolean;
  onAprovar: () => void;
  onAjustar: () => void;
  onVerOperacao: () => void;
  onConsultarEquipe: () => void;
}) {
  const BTN =
    "inline-flex h-8 items-center rounded-lg border border-white/10 bg-[#121620] px-3 text-[11px] font-semibold text-neutral-200 transition-colors hover:bg-[#181e2b] hover:text-white disabled:opacity-50";
  if (acao.tipo === "tarefa") {
    return (
      <p className="flex items-center gap-2 rounded-xl border border-white/5 bg-[#0f141f] px-3 py-2 text-[11px] text-neutral-300">
        <Wrench className="size-3.5 text-[#f95d14]" />
        Tarefa interna criada para <b>{rotuloPapel(acao.destinatario)}</b> — fica na fila e só roda
        quando um administrador processa a fila.
      </p>
    );
  }
  const st = status ? ROTULO_STATUS[status] : undefined;
  if (acao.tipo === "proposta_equipe") {
    return (
      <div className="rounded-xl border border-[#f95d14]/25 bg-[#f95d14]/5 p-3">
        <p className="text-xs font-bold text-white">Proposta de equipe</p>
        <p className="mt-1 text-[11px] text-neutral-300">
          Agentes: {acao.papeis.map(rotuloPapel).join(", ")}. Nenhum agente é criado sem sua
          aprovação e todos nascem inativos.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {st && (
            <span className={cn("rounded-full px-2 py-0.5 text-[10px]", st.cls)}>{st.rotulo}</span>
          )}
          {status === "pending" && (
            <button
              type="button"
              className={cn(BTN, "border-emerald-500/30 text-emerald-300")}
              disabled={ocupado}
              onClick={onAprovar}
            >
              Aprovar equipe
            </button>
          )}
          <button type="button" className={BTN} onClick={onConsultarEquipe}>
            Consultar equipe
          </button>
        </div>
      </div>
    );
  }
  const p = acao.plano;
  const estrategia = Object.entries(p.estrategia);
  return (
    <div className="rounded-xl border border-[#f95d14]/30 bg-[#f95d14]/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-bold text-white">
          <Crown className="size-4 text-[#f95d14]" /> Plano de Operação Comercial
        </p>
        <div className="flex items-center gap-1">
          {st && (
            <span className={cn("rounded-full px-2 py-0.5 text-[10px]", st.cls)}>{st.rotulo}</span>
          )}
          <BotaoCopiar texto={planoComoTexto(p)} rotulo="Copiar plano" />
        </div>
      </div>
      <dl className="mt-3 grid gap-x-6 gap-y-2 text-[12px] sm:grid-cols-2">
        {(
          [
            ["Operação", p.nome],
            ["Nicho", p.nicho + (p.subnicho ? ` / ${p.subnicho}` : "")],
            ["Produto", p.produto],
            ["Região", p.regiao],
            ["Público-alvo", p.publico_alvo],
            ["Agentes selecionados", p.papeis.map(rotuloPapel).join(", ") || "—"],
            ["Orçamento mensal", formatarUsd(p.orcamento_usd_mes)],
          ] as const
        ).map(([k, v]) => (
          <div key={k}>
            <dt className="text-[10px] uppercase tracking-wide text-neutral-500">{k}</dt>
            <dd className="text-neutral-100">{v}</dd>
          </div>
        ))}
      </dl>
      {estrategia.length > 0 && (
        <details className="mt-3" open>
          <summary className="cursor-pointer text-[11px] font-semibold text-neutral-300">
            Estratégia, metas e tarefas propostas
          </summary>
          <dl className="mt-2 space-y-1.5 text-[12px] text-neutral-300">
            {estrategia.map(([k, v]) => (
              <div key={k}>
                <dt className="inline font-semibold capitalize text-neutral-200">
                  {k.replace(/_/g, " ")}:{" "}
                </dt>
                <dd className="inline">{v}</dd>
              </div>
            ))}
          </dl>
        </details>
      )}
      <p className="mt-3 text-[10px] text-neutral-500">
        Aprovar cria a operação. Não cria agentes, não concede permissões e não executa nenhuma ação
        externa.
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {status === "pending" && (
          <button
            type="button"
            className={cn(BTN, "border-emerald-500/30 text-emerald-300")}
            disabled={ocupado}
            onClick={onAprovar}
          >
            Aprovar plano
          </button>
        )}
        <button type="button" className={BTN} onClick={onAjustar}>
          Ajustar estratégia
        </button>
        <button type="button" className={BTN} onClick={onVerOperacao}>
          Ver operação
        </button>
        <button type="button" className={BTN} onClick={onConsultarEquipe}>
          Consultar equipe
        </button>
      </div>
    </div>
  );
}

interface Props {
  ceo: CeoReal;
  onVoltar?: () => void;
  onNavegarPerfil?: () => void;
  onNavegarEquipe?: () => void;
  onNavegarAprovacoes?: () => void;
}

export function CeoChatReal({ ceo, onVoltar, onNavegarPerfil, onNavegarEquipe }: Props) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [conversaId, setConversaId] = useState<string | null>(null);
  const [conversas, setConversas] = useState<ConversaLinha[] | null>(null);
  const [historicoDisponivel, setHistoricoDisponivel] = useState(CEO_CHAT_PERSISTENTE_HABILITADO);
  const [historicoAberto, setHistoricoAberto] = useState(false);
  const [operacoes, setOperacoes] = useState<OperacaoLinha[]>([]);
  const [operacaoId, setOperacaoId] = useState<string>("");
  const [statusAprov, setStatusAprov] = useState<Record<string, string>>({});
  const [acaoOcupada, setAcaoOcupada] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const fimRef = useRef<HTMLDivElement>(null);
  const campoRef = useRef<HTMLTextAreaElement>(null);

  const provedorPronto = !ceo.catalogo.disponivel || ceo.catalogo.ceoPronto;
  const bloqueio = bloqueioDoChat({ estado: ceo.estado.id, provedorPronto });
  const podeConversar = bloqueio === null;

  const recarregarHistorico = useCallback(async () => {
    try {
      const r = await listarConversas();
      if (!r.disponivel) {
        setHistoricoDisponivel(false);
        return;
      }
      setConversas(r.itens);
    } catch {
      setConversas([]);
    }
  }, []);

  useEffect(() => {
    if (CEO_CHAT_PERSISTENTE_HABILITADO) void recarregarHistorico();
    void carregarOperacoes()
      .then((r) => {
        if (r.disponivel) setOperacoes(r.operacoes.filter((o) => o.status !== "encerrada"));
      })
      .catch(() => undefined);
  }, [recarregarHistorico]);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, enviando]);

  // situação atual das aprovações citadas nos cartões
  const idsAprov = useMemo(
    () => [
      ...new Set(
        msgs.flatMap((m) => m.acoes.flatMap((a) => (a.tipo === "tarefa" ? [] : [a.aprovacao_id]))),
      ),
    ],
    [msgs],
  );
  useEffect(() => {
    if (idsAprov.length) void statusDasAprovacoes(idsAprov).then(setStatusAprov);
  }, [idsAprov]);

  const ajustarAltura = () => {
    const c = campoRef.current;
    if (!c) return;
    c.style.height = "auto";
    c.style.height = `${Math.min(c.scrollHeight, 180)}px`;
  };
  useEffect(ajustarAltura, [texto]);

  const enviar = async (conteudo: string, reenvioClientId?: string) => {
    const t = conteudo.trim();
    if (!t || enviando || !podeConversar) return;
    if (t.length > LIMITE_MENSAGEM) {
      setAviso(`A mensagem passa de ${LIMITE_MENSAGEM} caracteres. Divida em partes menores.`);
      return;
    }
    setAviso(null);
    const clientId = reenvioClientId ?? crypto.randomUUID();
    const agora = new Date().toISOString();
    setMsgs((prev) => [
      ...prev.filter((m) => m.erro?.clientId !== clientId),
      ...(reenvioClientId
        ? []
        : [
            {
              id: `u-${clientId}`,
              papel: "user" as const,
              conteudo: t,
              ferramentas: [],
              acoes: [],
              criadoEm: agora,
            },
          ]),
    ]);
    setTexto("");
    setEnviando(true);
    const persistir = CEO_CHAT_PERSISTENTE_HABILITADO && historicoDisponivel;
    const historico = msgs
      .filter((m) => !m.erro)
      .slice(-10)
      .map((m) => ({ role: m.papel, content: m.conteudo }));
    try {
      const r = await perguntarAoCeo({
        mensagem: t,
        clientMessageId: clientId,
        historico,
        persistir,
        conversaId,
        operacaoId: operacaoId || null,
      });
      if (r.ok) {
        setMsgs((prev) => [
          ...prev,
          {
            id: `a-${clientId}`,
            papel: "assistant",
            conteudo: r.resposta,
            ferramentas: r.ferramentas,
            acoes: r.acoes,
            criadoEm: new Date().toISOString(),
          },
        ]);
        if (r.conversaId) {
          setConversaId(r.conversaId);
          if (!r.persistido)
            setAviso("Resposta recebida, mas não foi possível salvá-la no histórico.");
          void recarregarHistorico();
        } else if (persistir) {
          setHistoricoDisponivel(false); // backend do histórico ainda não publicado: segue só nesta sessão
        }
      } else {
        setMsgs((prev) => [
          ...prev,
          {
            id: `e-${clientId}`,
            papel: "assistant",
            conteudo: "",
            ferramentas: [],
            acoes: [],
            criadoEm: new Date().toISOString(),
            erro: { clientId, texto: r.mensagem },
          },
        ]);
        pendentes.current.set(clientId, t);
      }
    } catch {
      setMsgs((prev) => [
        ...prev,
        {
          id: `e-${clientId}`,
          papel: "assistant",
          conteudo: "",
          ferramentas: [],
          acoes: [],
          criadoEm: new Date().toISOString(),
          erro: { clientId, texto: "Não foi possível consultar o CEO agora." },
        },
      ]);
      pendentes.current.set(clientId, t);
    } finally {
      setEnviando(false);
      campoRef.current?.focus();
    }
  };
  const pendentes = useRef(new Map<string, string>());

  const novaConversa = () => {
    setMsgs([]);
    setConversaId(null);
    setTexto("");
    setAviso(null);
    setHistoricoAberto(false);
    campoRef.current?.focus();
  };

  const abrirConversa = async (c: ConversaLinha) => {
    setHistoricoAberto(false);
    try {
      const salvas = await carregarMensagens(c.id);
      setMsgs(
        salvas.map((m) => ({
          id: m.id,
          papel: m.papel,
          conteudo: m.conteudo,
          ferramentas: m.ferramentas ?? [],
          acoes: m.acoes ?? [],
          criadoEm: m.criado_em,
        })),
      );
      setConversaId(c.id);
      setOperacaoId(c.operacao_id ?? "");
      setAviso(null);
    } catch {
      setAviso("Não foi possível abrir essa conversa.");
    }
  };

  const trocarOperacao = async (id: string) => {
    setOperacaoId(id);
    if (conversaId) {
      try {
        await vincularOperacao(conversaId, id || null);
      } catch {
        setAviso("Não foi possível vincular a operação a esta conversa.");
      }
    }
  };

  const decidir = async (a: AcaoChat, aprovar: boolean) => {
    if (a.tipo === "tarefa") return;
    setAcaoOcupada(true);
    try {
      if (a.tipo === "proposta_operacao") await decidirPropostaOperacao(a.aprovacao_id, aprovar);
      else await decidirPropostaEquipe(a.aprovacao_id, aprovar);
      setStatusAprov(
        await statusDasAprovacoes([a.aprovacao_id]).then((s) => ({ ...statusAprov, ...s })),
      );
      void carregarOperacoes().then(
        (r) => r.disponivel && setOperacoes(r.operacoes.filter((o) => o.status !== "encerrada")),
      );
    } catch (e) {
      setAviso(e instanceof ErroCeo ? e.message : "Não foi possível registrar a decisão.");
    } finally {
      setAcaoOcupada(false);
    }
  };

  const onTecla = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void enviar(texto);
    }
  };

  const usarAtalho = (a: (typeof ATALHOS_INICIAIS)[number]) => {
    if (a.enviarAgora) void enviar(a.texto);
    else {
      setTexto(a.texto);
      campoRef.current?.focus();
    }
  };

  const grupos = useMemo(() => agruparPorData(conversas ?? []), [conversas]);
  const opAtual = operacoes.find((o) => o.id === operacaoId);

  return (
    <div className="flex h-[100dvh] min-h-[560px] flex-col bg-[#07090e] text-neutral-100">
      {/* topo enxuto */}
      <header className="flex flex-wrap items-center gap-3 border-b border-white/5 px-4 py-3 lg:px-6">
        <div className="min-w-0 flex-1">
          <nav
            className="flex items-center gap-1.5 text-[11px] text-neutral-500"
            aria-label="Navegação"
          >
            <button type="button" onClick={onVoltar} className="hover:text-white">
              Agentes & Automações
            </button>
            <ChevronRight className="size-3" />
            <span className="text-[#f95d14]">Copiloto de IA</span>
          </nav>
          <h1 className="flex items-center gap-2 text-lg font-bold text-white">
            <span className="flex size-8 items-center justify-center rounded-lg border border-orange-500/20 bg-orange-500/10 text-[#f95d14]">
              <Crown className="size-4" />
            </span>
            Conversar com o CEO
            <CeoEstadoPill estado={ceo.estado} />
          </h1>
        </div>
        {operacoes.length > 0 && (
          <label className="text-[11px] text-neutral-400">
            <span className="sr-only">Operação em foco</span>
            <select
              value={operacaoId}
              onChange={(e) => void trocarOperacao(e.target.value)}
              className="h-9 max-w-[220px] rounded-lg border border-white/10 bg-[#101624] px-2 text-xs text-white focus:border-[#f95d14] focus:outline-none"
            >
              <option value="">Operação: todas</option>
              {operacoes.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nome}
                </option>
              ))}
            </select>
          </label>
        )}
        <button
          type="button"
          onClick={() => setHistoricoAberto((v) => !v)}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-[#121722] px-3 text-xs font-semibold text-neutral-200 hover:bg-[#182030] lg:hidden"
        >
          <History className="size-3.5" /> Histórico
        </button>
        <button
          type="button"
          onClick={novaConversa}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#f95d14] px-3 text-xs font-semibold text-white shadow-md shadow-orange-500/20 hover:bg-[#ff6c26]"
        >
          <MessageSquarePlus className="size-3.5" /> Nova conversa
        </button>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* histórico */}
        <aside
          className={cn(
            "w-72 shrink-0 flex-col border-r border-white/5 bg-[#0a0d14] lg:flex",
            historicoAberto ? "fixed inset-y-0 left-0 z-30 flex shadow-2xl" : "hidden",
          )}
          aria-label="Histórico de conversas"
        >
          <p className="px-4 pt-4 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
            Conversas
          </p>
          <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
            {!historicoDisponivel && (
              <p className="px-2 text-[11px] leading-relaxed text-neutral-500">
                O histórico salvo ainda não está disponível neste ambiente. Esta conversa existe
                apenas nesta sessão.
              </p>
            )}
            {historicoDisponivel && conversas === null && (
              <p className="px-2 text-[11px] text-neutral-500">
                <Loader2 className="mr-1 inline size-3 animate-spin" /> Carregando…
              </p>
            )}
            {historicoDisponivel && conversas?.length === 0 && (
              <p className="px-2 text-[11px] text-neutral-500">Nenhuma conversa salva ainda.</p>
            )}
            {grupos.map((g) => (
              <div key={g.grupo} className="mb-3">
                <p className="px-2 pb-1 text-[10px] font-semibold uppercase text-neutral-600">
                  {g.grupo}
                </p>
                {g.itens.map((c) => (
                  <div
                    key={c.id}
                    className={cn(
                      "group flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs hover:bg-white/5",
                      c.id === conversaId && "bg-white/10",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => void abrirConversa(c)}
                      className="min-w-0 flex-1 truncate text-left text-neutral-300"
                      title={c.titulo}
                    >
                      {c.titulo}
                    </button>
                    <button
                      type="button"
                      aria-label="Arquivar conversa"
                      onClick={() =>
                        void arquivarConversa(c.id).then(() => {
                          if (c.id === conversaId) novaConversa();
                          return recarregarHistorico();
                        })
                      }
                      className="hidden text-[10px] text-neutral-500 hover:text-rose-300 group-hover:block"
                    >
                      arquivar
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </aside>
        {historicoAberto && (
          <button
            type="button"
            aria-label="Fechar histórico"
            className="fixed inset-0 z-20 bg-black/60 lg:hidden"
            onClick={() => setHistoricoAberto(false)}
          />
        )}

        {/* conversa */}
        <section className="flex min-w-0 flex-1 flex-col" aria-label="Conversa com o CEO">
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 lg:px-8" aria-live="polite">
            <div className="mx-auto w-full max-w-3xl space-y-6">
              {opAtual && (
                <p className="rounded-xl border border-white/5 bg-[#0f141f] px-3 py-2 text-[11px] text-neutral-400">
                  Operação em foco: <b className="text-neutral-200">{opAtual.nome}</b> —{" "}
                  {opAtual.nicho} · {opAtual.produto} · {opAtual.regiao}
                </p>
              )}

              {bloqueio && (
                <div
                  role="alert"
                  className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4"
                >
                  <p className="flex items-start gap-2 text-sm text-amber-100">
                    <AlertCircle className="mt-0.5 size-4 shrink-0" /> {bloqueio.motivo}
                  </p>
                  {!provedorPronto && (
                    <p className="mt-2 text-[11px] text-amber-200/80">
                      Caminho: Super Admin → Inteligência Artificial → Provedores & Modelos (apenas
                      o Super Admin altera).
                    </p>
                  )}
                  {bloqueio.acao === "configurar_ceo" && onNavegarPerfil && (
                    <button
                      type="button"
                      onClick={onNavegarPerfil}
                      className="mt-3 inline-flex h-9 items-center rounded-lg bg-[#f95d14] px-4 text-xs font-bold text-white hover:bg-[#ff6c26]"
                    >
                      {bloqueio.rotuloAcao}
                    </button>
                  )}
                  {bloqueio.acao === "tentar_novamente" && (
                    <button
                      type="button"
                      onClick={() => void ceo.recarregar()}
                      className="mt-3 inline-flex h-9 items-center rounded-lg border border-white/10 px-4 text-xs font-semibold text-white hover:bg-white/5"
                    >
                      {bloqueio.rotuloAcao}
                    </button>
                  )}
                </div>
              )}

              {msgs.length === 0 && podeConversar && (
                <div className="py-6 text-center">
                  <span className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-[#f95d14]">
                    <Sparkles className="size-6" />
                  </span>
                  <h2 className="mt-4 text-xl font-bold text-white">
                    Olá! Sou o CEO da sua operação comercial.
                  </h2>
                  <p className="mx-auto mt-2 max-w-xl text-sm text-neutral-400">
                    Diga o que você quer vender, para quem e onde. Eu consulto os dados reais, monto
                    a estratégia e a equipe, e peço sua aprovação antes de qualquer execução.
                  </p>
                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    {ATALHOS_INICIAIS.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => usarAtalho(a)}
                        disabled={enviando}
                        className="rounded-full border border-white/10 bg-[#121722] px-4 py-2 text-xs font-semibold text-neutral-200 transition-colors hover:border-[#f95d14]/40 hover:bg-[#182030] hover:text-white disabled:opacity-50"
                      >
                        {a.rotulo}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {msgs.map((m) =>
                m.erro ? (
                  <div
                    key={m.id}
                    role="alert"
                    className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-200"
                  >
                    <p className="flex items-start gap-2">
                      <AlertCircle className="mt-0.5 size-3.5 shrink-0" /> {m.erro.texto}
                    </p>
                    <button
                      type="button"
                      disabled={enviando}
                      onClick={() =>
                        void enviar(pendentes.current.get(m.erro!.clientId) ?? "", m.erro!.clientId)
                      }
                      className="mt-2 rounded-lg border border-rose-400/30 px-3 py-1 text-[11px] font-semibold hover:bg-rose-500/10 disabled:opacity-50"
                    >
                      Tentar de novo
                    </button>
                  </div>
                ) : m.papel === "user" ? (
                  <div key={m.id} className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[#f95d14] px-4 py-2.5 text-[13.5px] leading-relaxed text-white shadow-md">
                      <p className="whitespace-pre-wrap break-words">{m.conteudo}</p>
                      <p className="mt-1 text-right text-[10px] text-white/70">
                        {hora(m.criadoEm)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div key={m.id} className="flex gap-3">
                    <span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full border border-orange-500/30 bg-orange-500/10 text-[#f95d14]">
                      <Crown className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                        <b className="text-neutral-300">CEO</b> {hora(m.criadoEm)}
                      </div>
                      <Conteudo texto={m.conteudo} />
                      {m.ferramentas.length > 0 && (
                        <p className="flex flex-wrap items-center gap-1.5 text-[10px] text-neutral-500">
                          <Wrench className="size-3" /> Consultou:
                          {m.ferramentas.map((f) => (
                            <span
                              key={f}
                              className="rounded-full border border-white/10 px-2 py-0.5 text-neutral-400"
                            >
                              {ROTULO_FERRAMENTA[f]?.rotulo ?? f}
                            </span>
                          ))}
                        </p>
                      )}
                      {m.acoes.map((a, i) => (
                        <CartaoAcao
                          key={i}
                          acao={a}
                          status={a.tipo === "tarefa" ? undefined : statusAprov[a.aprovacao_id]}
                          ocupado={acaoOcupada}
                          onAprovar={() => void decidir(a, true)}
                          onAjustar={() => {
                            setTexto("CEO, quero ajustar a estratégia: ");
                            campoRef.current?.focus();
                          }}
                          onVerOperacao={() => onNavegarEquipe?.()}
                          onConsultarEquipe={() =>
                            void enviar("CEO, o que a equipe está fazendo agora?")
                          }
                        />
                      ))}
                      <BotaoCopiar texto={m.conteudo} />
                    </div>
                  </div>
                ),
              )}

              {enviando && (
                <div className="flex items-center gap-3 text-xs text-neutral-400" role="status">
                  <span className="flex size-8 items-center justify-center rounded-full border border-orange-500/30 bg-orange-500/10 text-[#f95d14]">
                    <Crown className="size-4" />
                  </span>
                  <span className="flex items-center gap-1" aria-label="O CEO está processando">
                    <span className="size-1.5 animate-bounce rounded-full bg-[#f95d14]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-[#f95d14] [animation-delay:150ms]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-[#f95d14] [animation-delay:300ms]" />
                    <span className="ml-2">Consultando dados e pensando…</span>
                  </span>
                </div>
              )}
              <div ref={fimRef} />
            </div>
          </div>

          {/* compositor sempre visível */}
          <div className="border-t border-white/5 bg-[#0a0d14] px-4 py-3 lg:px-8">
            <div className="mx-auto w-full max-w-3xl">
              {msgs.length > 0 && podeConversar && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {SUGESTOES_DE_CONTROLE.map((s) => (
                    <button
                      key={s}
                      type="button"
                      disabled={enviando}
                      onClick={() => void enviar(`CEO, ${s.charAt(0).toLowerCase()}${s.slice(1)}`)}
                      className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-neutral-400 hover:border-white/20 hover:text-white disabled:opacity-50"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
              {aviso && (
                <p role="status" className="mb-2 text-[11px] text-amber-300">
                  {aviso}
                </p>
              )}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void enviar(texto);
                }}
                className="flex items-end gap-2 rounded-2xl border border-white/10 bg-[#101624] p-2 focus-within:border-[#f95d14]/60"
              >
                <textarea
                  ref={campoRef}
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  onKeyDown={onTecla}
                  rows={1}
                  disabled={!podeConversar}
                  maxLength={LIMITE_MENSAGEM + 200}
                  placeholder={
                    podeConversar
                      ? "Converse com o CEO… (Enter envia, Shift+Enter quebra a linha)"
                      : "Indisponível — veja o aviso acima"
                  }
                  aria-label="Mensagem para o CEO"
                  className="max-h-[180px] min-h-[40px] flex-1 resize-none bg-transparent px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none disabled:cursor-not-allowed"
                />
                <button
                  type="submit"
                  disabled={!podeConversar || enviando || !texto.trim()}
                  aria-label="Enviar"
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f95d14] text-white transition-colors hover:bg-[#ff6c26] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {enviando ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                </button>
              </form>
              <p className="mt-1.5 text-center text-[10px] text-neutral-600">
                O CEO usa dados reais e pede aprovação humana. Não envia mensagens a leads nem gasta
                além do limite. Respostas podem conter erros: confira antes de agir.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
