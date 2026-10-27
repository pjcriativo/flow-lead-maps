// Painéis da equipe comercial de IA REAL, encaixados nas telas existentes de Agentes & Automações
// (02 Equipe, 03 Perfil, 07 Fluxos, 08 Planejamento, 11 Aprovações, 12 Relatórios). Nenhuma tela nova:
// cada painel mostra dados do runtime (agentes, fila, execuções, aprovações) e nunca inventa número.
// Escritas só por RPC de governança (sessão humana); o processamento da fila é MANUAL.
import React, { useState } from "react";
import { Loader2, Play, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatarUsd, type EstadoCeo } from "@/lib/ceo-config";
import {
  META_PAPEL,
  PAPEIS,
  ROTULO_FERRAMENTA,
  ROTULO_STATUS_TAREFA,
  ROTULO_TIPO_APROVACAO,
  ROTULO_TIPO_TAREFA,
  TIPOS_DE_PLANEJAMENTO,
  ehPropostaDeEquipe,
  formatarDuracao,
  ordenarEquipe,
  papeisFaltantes,
  resumirPorAgente,
  rotuloStatusAprovacao,
  type Papel,
} from "@/lib/equipe-config";
import { definirEstadoCeo, ErroCeo } from "@/services/agente-ceo-admin";
import {
  concederFerramenta,
  criarEquipe,
  decidirAprovacao,
  decidirPropostaEquipe,
  desabilitarDelegacao,
  habilitarDelegacao,
  processarFila,
  revogarFerramenta,
} from "@/services/agente-equipe-admin";
import { CeoEstadoPill } from "./CeoRealUi";
import { estadoDoAgente, type EquipeReal } from "./useEquipeReal";
import type { CeoReal } from "./useCeoReal";

const CARD = "rounded-2xl border border-[#1e2638] bg-[#0c1017]/90 p-5 shadow-xl";
const BTN =
  "inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-[#121620] px-3 text-[11px] font-semibold text-neutral-200 transition-colors hover:bg-[#181e2b] hover:text-white disabled:cursor-not-allowed disabled:opacity-50";
const BTN_OK = cn(BTN, "border-emerald-500/30 text-emerald-300");
const BTN_NO = cn(BTN, "border-rose-500/30 text-rose-300");
const TH =
  "px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wide text-neutral-500";
const TD = "px-2 py-1.5 text-[11px] text-neutral-200";

const rotuloPapel = (p: string) =>
  PAPEIS.includes(p as Papel) ? META_PAPEL[p as Papel].rotulo : p;
const dataCurta = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

/** Executa uma ação humana e só recarrega depois que o banco confirmou. */
function useAcao(eq: EquipeReal) {
  const [ocupado, setOcupado] = useState(false);
  const [msg, setMsg] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);
  const executar = async (
    acao: () => Promise<unknown>,
    sucesso: string | ((r: unknown) => string),
  ) => {
    setOcupado(true);
    setMsg(null);
    try {
      const r = await acao();
      await eq.recarregar();
      setMsg({ tipo: "ok", texto: typeof sucesso === "function" ? sucesso(r) : sucesso });
    } catch (e) {
      setMsg({ tipo: "erro", texto: e instanceof ErroCeo ? e.message : "Operação não concluída." });
    } finally {
      setOcupado(false);
    }
  };
  return { ocupado, msg, executar };
}

function Mensagem({ msg }: { msg: { tipo: "ok" | "erro"; texto: string } | null }) {
  if (!msg) return null;
  return (
    <p className={cn("text-[11px]", msg.tipo === "ok" ? "text-emerald-400" : "text-rose-300")}>
      {msg.texto}
    </p>
  );
}

/** Cabeçalho + estados de carga/erro comuns a todos os painéis. Devolve null quando há dados. */
function Moldura({
  titulo,
  subtitulo,
  eq,
  children,
}: {
  titulo: string;
  subtitulo: string;
  eq: EquipeReal;
  children: React.ReactNode;
}) {
  return (
    <section className={cn(CARD, "space-y-4")} aria-label={titulo}>
      <div>
        <h3 className="text-sm font-bold text-white">{titulo}</h3>
        <p className="mt-0.5 text-[11px] text-neutral-400">{subtitulo}</p>
      </div>
      {eq.carregando && !eq.equipe ? (
        <p className="flex items-center gap-2 text-[11px] text-neutral-400">
          <Loader2 className="size-3.5 animate-spin" /> Consultando o runtime…
        </p>
      ) : eq.erro || !eq.equipe ? (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-300">
          {eq.erro ?? "Serviço indisponível."} Nenhum dado é exibido enquanto o backend não
          responder.
        </p>
      ) : (
        children
      )}
    </section>
  );
}

// ───────────────────────────── Tela 02 — Equipe & Enxames ─────────────────────────────
export function EquipeRealPanel({
  eq,
  onVerPerfil,
}: {
  eq: EquipeReal;
  onVerPerfil: (agenteId: string) => void;
}) {
  const { ocupado, msg, executar } = useAcao(eq);
  const e = eq.equipe;
  const ceo = e?.agentes.find((a) => a.papel === "ceo") ?? null;
  const faltam = e ? papeisFaltantes(e.agentes.map((a) => a.papel)) : [];
  const propostas = (e?.aprovacoes ?? []).filter(
    (a) => a.status === "pending" && ehPropostaDeEquipe(a),
  );

  return (
    <Moldura
      titulo="Equipe comercial de IA"
      subtitulo="Hierarquia real: Administrador → CEO → Gerente Comercial → especialistas. Agentes nascem inativos; você aprova, ativa e define as permissões."
      eq={eq}
    >
      {propostas.map((p) => (
        <div
          key={p.id}
          className="space-y-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3"
        >
          <p className="text-xs font-semibold text-amber-200">
            O CEO propôs criar: {p.payload?.equipe?.map((x) => rotuloPapel(x.papel)).join(", ")}
          </p>
          <p className="text-[11px] text-amber-100/80">
            Aprovar cria os agentes INATIVOS com as permissões padrão do papel (somente leitura; só
            o Gerente herda a delegação interna). Nada é enviado nem executado.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={ocupado}
              className={BTN_OK}
              onClick={() =>
                executar(
                  () => decidirPropostaEquipe(p.id, true),
                  (n) => `${n} agente(s) criado(s), inativos.`,
                )
              }
            >
              Aprovar e criar
            </button>
            <button
              type="button"
              disabled={ocupado}
              className={BTN_NO}
              onClick={() =>
                executar(() => decidirPropostaEquipe(p.id, false), "Proposta rejeitada.")
              }
            >
              Rejeitar
            </button>
          </div>
        </div>
      ))}

      {!ceo ? (
        <p className="text-[11px] text-neutral-400">
          Configure e ative o CEO de IA (faixa acima) antes de criar a equipe.
        </p>
      ) : faltam.length > 0 ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-[#101622] p-3">
          <p className="min-w-0 flex-1 text-[11px] text-neutral-300">
            Faltam {faltam.length} agente(s): {faltam.map(rotuloPapel).join(", ")}.
          </p>
          <button
            type="button"
            disabled={ocupado}
            className={BTN_OK}
            onClick={() => {
              if (
                window.confirm(
                  `Criar ${faltam.length} agente(s) INATIVOS com as permissões padrão do papel (somente leitura)?`,
                )
              ) {
                void executar(
                  () => criarEquipe(e!.orgId, faltam),
                  (n) => `${n} agente(s) criado(s), inativos.`,
                );
              }
            }}
          >
            <Users className="size-3.5" /> Criar equipe ({faltam.length})
          </button>
        </div>
      ) : null}

      <ul className="space-y-2">
        {ordenarEquipe(e?.agentes ?? []).map((a) => {
          const estado: EstadoCeo = estadoDoAgente(e!, a);
          const meta = META_PAPEL[a.papel];
          const nivel = a.papel === "ceo" ? 0 : a.papel === "gerente_comercial" ? 1 : 2;
          const abertas = e!.tarefas.filter(
            (t) => t.agentId === a.id && (t.status === "queued" || t.status === "processing"),
          ).length;
          return (
            <li
              key={a.id}
              className={cn(
                "flex flex-wrap items-center gap-3 rounded-xl border border-white/5 bg-[#101622] p-3",
                nivel === 1 && "ml-4",
                nivel === 2 && "ml-8",
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-white">{a.nome}</span>
                  <CeoEstadoPill estado={estado} />
                </div>
                <p className="text-[11px] text-neutral-400">{meta.funcao}</p>
                <p className="text-[10px] text-neutral-500">
                  {a.modelo} · {formatarUsd(a.tetoDiaUsd)}/dia · {formatarUsd(a.tetoMesUsd)}/mês ·{" "}
                  {(e!.permissoes[a.id] ?? []).length} ferramenta(s) · fila: {abertas}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={BTN}
                  onClick={() => onVerPerfil(`real:${a.papel}`)}
                >
                  Perfil
                </button>
                {a.papel !== "ceo" && a.estado !== "ativo" && !a.killSwitch && (
                  <button
                    type="button"
                    disabled={ocupado}
                    className={BTN_OK}
                    onClick={() =>
                      executar(() => definirEstadoCeo(a.id, "ativo"), `${a.nome} ativado.`)
                    }
                  >
                    Ativar
                  </button>
                )}
                {a.papel !== "ceo" && a.estado === "ativo" && (
                  <button
                    type="button"
                    disabled={ocupado}
                    className={BTN}
                    onClick={() =>
                      executar(() => definirEstadoCeo(a.id, "pausado"), `${a.nome} pausado.`)
                    }
                  >
                    Pausar
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <Mensagem msg={msg} />
    </Moldura>
  );
}

// ───────────────────────────── Tela 03 — permissões do papel ─────────────────────────────
export function PermissoesDoPapel({ agente, papel }: { agente: CeoReal; papel: Papel }) {
  const [ocupado, setOcupado] = useState(false);
  const [msg, setMsg] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);
  const a = agente.carga?.agente ?? null;
  if (!a) return null;
  const concedidas = agente.carga?.ferramentasConcedidas ?? [];
  const interna = a.autonomia === "interna_supervisionada";
  const meta = META_PAPEL[papel];

  const agir = async (acao: () => Promise<void>, ok: string) => {
    setOcupado(true);
    setMsg(null);
    try {
      await acao();
      await agente.recarregar();
      setMsg({ tipo: "ok", texto: ok });
    } catch (e) {
      setMsg({ tipo: "erro", texto: e instanceof ErroCeo ? e.message : "Operação não concluída." });
    } finally {
      setOcupado(false);
    }
  };

  return (
    <div className="space-y-3 border-t border-white/5 pt-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-semibold text-neutral-300">
          Ferramentas do papel ({meta.rotulo})
        </p>
        {meta.podeDelegar && (
          <button
            type="button"
            disabled={ocupado}
            className={BTN}
            onClick={() =>
              agir(
                () => (interna ? desabilitarDelegacao(a.id) : habilitarDelegacao(a.id)),
                interna ? "Delegação interna desabilitada." : "Delegação interna habilitada.",
              )
            }
          >
            {interna ? "Desabilitar delegação interna" : "Habilitar delegação interna"}
          </button>
        )}
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {meta.ferramentas.map((f) => {
          const info = ROTULO_FERRAMENTA[f];
          const ativa = concedidas.includes(f);
          const interno = info?.risco === "coordenação interna";
          return (
            <li
              key={f}
              className="flex items-center justify-between gap-2 rounded-lg border border-white/5 bg-[#101622] px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-[11px] font-semibold text-neutral-200">
                  {info?.rotulo ?? f}
                </p>
                <p className="text-[10px] text-neutral-500">{info?.risco ?? "—"}</p>
              </div>
              {interno ? (
                <span className="text-[10px] text-neutral-400">
                  {ativa ? "Concedida" : "Via delegação interna"}
                </span>
              ) : (
                <button
                  type="button"
                  disabled={ocupado}
                  className={ativa ? BTN_NO : BTN_OK}
                  onClick={() =>
                    agir(
                      () => (ativa ? revogarFerramenta(a.id, f) : concederFerramenta(a.id, f)),
                      ativa ? "Permissão revogada." : "Permissão concedida.",
                    )
                  }
                >
                  {ativa ? "Revogar" : "Conceder"}
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <p className="text-[10px] text-neutral-500">
        Somente você (administrador logado) concede ou revoga. Nenhuma ferramenta envia mensagem,
        faz busca paga ou altera contratos.
      </p>
      <Mensagem msg={msg} />
    </div>
  );
}

// ───────────────────────────── Tela 07 — Fluxos & Automações (fila) ─────────────────────────────
export function FilaRealPanel({ eq }: { eq: EquipeReal }) {
  const { ocupado, msg, executar } = useAcao(eq);
  const e = eq.equipe;
  const nome = (id: string | null) =>
    id ? rotuloPapel(e?.agentes.find((a) => a.id === id)?.papel ?? "—") : "Administrador/Copiloto";
  const tarefas = (e?.tarefas ?? []).filter((t) => t.tipo !== "copiloto_conversa");
  const contagem = (s: string) => tarefas.filter((t) => t.status === s).length;
  const naFila = contagem("queued");

  return (
    <Moldura
      titulo="Fila de tarefas dos agentes"
      subtitulo="Delegações reais do CEO e do Gerente. Nada roda sozinho: você dispara o processamento. Os fluxos desenhados abaixo são demonstrativos."
      eq={eq}
    >
      <div className="flex flex-wrap items-center gap-2 text-[11px]">
        {["queued", "processing", "succeeded", "failed", "cancelled"].map((s) => (
          <span
            key={s}
            className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-neutral-300"
          >
            {ROTULO_STATUS_TAREFA[s]}: {contagem(s)}
          </span>
        ))}
        <button
          type="button"
          disabled={ocupado || naFila === 0}
          className={cn(BTN_OK, "ml-auto")}
          onClick={() => {
            if (
              window.confirm(
                "Processar a fila agora? Cada tarefa usa IA do próprio agente, dentro do teto diário e mensal dele, e não envia nada externo.",
              )
            ) {
              void executar(
                () => processarFila(e!.orgId, 2),
                (r) => {
                  const x = r as { processadas: number; resultados: { ok: boolean }[] };
                  return `${x.processadas} tarefa(s) processada(s); ${x.resultados.filter((i) => i.ok).length} concluída(s).`;
                },
              );
            }
          }}
        >
          {ocupado ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}{" "}
          Processar fila agora
        </button>
      </div>
      {tarefas.length === 0 ? (
        <p className="text-[11px] text-neutral-400">
          Nenhuma tarefa delegada ainda. Peça ao CEO, no Copiloto, para delegar uma análise.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr>
                <th className={TH}>Tarefa</th>
                <th className={TH}>De</th>
                <th className={TH}>Para</th>
                <th className={TH}>Status</th>
                <th className={TH}>Criada</th>
              </tr>
            </thead>
            <tbody>
              {tarefas.slice(0, 12).map((t) => (
                <tr key={t.id} className="border-t border-white/5">
                  <td className={TD}>{ROTULO_TIPO_TAREFA[t.tipo] ?? t.tipo}</td>
                  <td className={TD}>{nome(t.delegadoPor)}</td>
                  <td className={TD}>{nome(t.agentId)}</td>
                  <td className={cn(TD, t.status === "failed" && "text-rose-300")}>
                    {ROTULO_STATUS_TAREFA[t.status] ?? t.status}
                    {t.ultimoErro ? ` · ${t.ultimoErro.slice(0, 40)}` : ""}
                  </td>
                  <td className={TD}>{dataCurta(t.criadoEm)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Mensagem msg={msg} />
    </Moldura>
  );
}

// ───────────────────────────── Tela 08 — Planejamento & Metas (entregáveis) ─────────────────────────────
export function PlanosRealPanel({ eq }: { eq: EquipeReal }) {
  const e = eq.equipe;
  const itens = (e?.tarefas ?? []).filter(
    (t) =>
      t.status === "succeeded" &&
      t.resultado?.texto &&
      (TIPOS_DE_PLANEJAMENTO as readonly string[]).includes(t.tipo),
  );
  return (
    <Moldura
      titulo="Planos e análises dos agentes"
      subtitulo="Entregáveis reais gerados pelos agentes (rascunhos para revisão humana). Metas numéricas ainda não têm backend: os indicadores desta tela são demonstrativos."
      eq={eq}
    >
      {itens.length === 0 ? (
        <p className="text-[11px] text-neutral-400">
          Nenhum plano gerado ainda. Delegue uma análise ao Gerente ou um plano ao Estrategista e
          processe a fila.
        </p>
      ) : (
        <ul className="space-y-2">
          {itens.slice(0, 8).map((t) => (
            <li key={t.id}>
              <details className="rounded-xl border border-white/5 bg-[#101622] p-3">
                <summary className="cursor-pointer text-xs font-semibold text-neutral-200">
                  {ROTULO_TIPO_TAREFA[t.tipo] ?? t.tipo} ·{" "}
                  {rotuloPapel(e!.agentes.find((a) => a.id === t.agentId)?.papel ?? "—")} ·{" "}
                  {dataCurta(t.concluidoEm)}
                </summary>
                <pre className="mt-2 whitespace-pre-wrap break-words font-sans text-[11px] leading-relaxed text-neutral-300">
                  {t.resultado!.texto}
                </pre>
                <p className="mt-2 text-[10px] text-amber-300">Rascunho — requer revisão humana.</p>
              </details>
            </li>
          ))}
        </ul>
      )}
    </Moldura>
  );
}

// ───────────────────────────── Tela 11 — Aprovações & Histórico ─────────────────────────────
export function AprovacoesRealPanel({ eq }: { eq: EquipeReal }) {
  const { ocupado, msg, executar } = useAcao(eq);
  const e = eq.equipe;
  const pendentes = (e?.aprovacoes ?? []).filter((a) => a.status === "pending");
  const decididas = (e?.aprovacoes ?? []).filter((a) => a.status !== "pending").slice(0, 6);
  const papelDe = (id: string) => rotuloPapel(e?.agentes.find((a) => a.id === id)?.papel ?? "—");
  const decidir = (a: (typeof pendentes)[number], aprovar: boolean) =>
    executar(
      () =>
        ehPropostaDeEquipe(a)
          ? decidirPropostaEquipe(a.id, aprovar)
          : decidirAprovacao(a.id, aprovar),
      aprovar ? "Aprovada." : "Rejeitada.",
    );

  return (
    <Moldura
      titulo="Aprovações e histórico de execuções (reais)"
      subtitulo="Pedidos dos agentes que dependem de você e o registro de cada execução. As solicitações de exemplo abaixo são demonstrativas."
      eq={eq}
    >
      <div className="space-y-2">
        <p className="text-[11px] font-semibold text-neutral-300">Pendentes ({pendentes.length})</p>
        {pendentes.length === 0 && (
          <p className="text-[11px] text-neutral-500">Nenhuma aprovação pendente.</p>
        )}
        {pendentes.map((a) => (
          <div
            key={a.id}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3"
          >
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-amber-100">{a.resumo}</p>
              <p className="text-[10px] text-amber-200/70">
                {ROTULO_TIPO_APROVACAO[a.tipo] ?? a.tipo} · solicitada por {papelDe(a.agentId)} ·{" "}
                {dataCurta(a.criadoEm)}
              </p>
            </div>
            <button
              type="button"
              disabled={ocupado}
              className={BTN_OK}
              onClick={() => decidir(a, true)}
            >
              Aprovar
            </button>
            <button
              type="button"
              disabled={ocupado}
              className={BTN_NO}
              onClick={() => decidir(a, false)}
            >
              Rejeitar
            </button>
          </div>
        ))}
        {decididas.length > 0 && (
          <ul className="space-y-1">
            {decididas.map((a) => (
              <li key={a.id} className="text-[11px] text-neutral-400">
                {rotuloStatusAprovacao(a.status)} · {a.resumo} · {dataCurta(a.decididoEm)}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="space-y-2">
        <p className="text-[11px] font-semibold text-neutral-300">Execuções recentes</p>
        {(e?.runs.length ?? 0) === 0 ? (
          <p className="text-[11px] text-neutral-500">Nenhuma execução registrada.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px]">
              <thead>
                <tr>
                  <th className={TH}>Agente</th>
                  <th className={TH}>Status</th>
                  <th className={TH}>Passos</th>
                  <th className={TH}>Custo</th>
                  <th className={TH}>Duração</th>
                  <th className={TH}>Início</th>
                </tr>
              </thead>
              <tbody>
                {e!.runs.slice(0, 12).map((r, i) => (
                  <tr key={i} className="border-t border-white/5">
                    <td className={TD}>{papelDe(r.agentId)}</td>
                    <td className={cn(TD, r.status === "failed" && "text-rose-300")}>
                      {r.status === "succeeded"
                        ? "Concluída"
                        : r.status === "failed"
                          ? "Falhou"
                          : r.status === "cancelled"
                            ? "Cancelada"
                            : "Em execução"}
                    </td>
                    <td className={TD}>{r.passos}</td>
                    <td className={TD}>{formatarUsd(r.custoUsd)}</td>
                    <td className={TD}>
                      {r.finalizadoEm
                        ? formatarDuracao(
                            (Date.parse(r.finalizadoEm) - Date.parse(r.iniciadoEm)) / 1000,
                          )
                        : "—"}
                    </td>
                    <td className={TD}>{dataCurta(r.iniciadoEm)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Mensagem msg={msg} />
    </Moldura>
  );
}

// ───────────────────────────── Tela 12 — Relatórios & Resultados ─────────────────────────────
export function RelatorioRealPanel({ eq }: { eq: EquipeReal }) {
  const e = eq.equipe;
  const resumo = e
    ? resumirPorAgente(
        e.runs,
        e.tarefas,
        e.agentes.map((a) => a.id),
        new Date(),
      )
    : null;
  return (
    <Moldura
      titulo="Resultados reais dos agentes (30 dias)"
      subtitulo="Execuções, falhas, custo de IA e fila lidos do runtime. Indicadores de vendas e funil comercial não são calculados aqui; os gráficos abaixo são demonstrativos."
      eq={eq}
    >
      {e && resumo && (
        <>
          <div className="flex flex-wrap gap-2 text-[11px]">
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-neutral-300">
              Execuções: {resumo.total.execucoes}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-neutral-300">
              Concluídas: {resumo.total.concluidas}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-neutral-300">
              Falhas: {resumo.total.falhas}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-neutral-300">
              Custo no mês: {formatarUsd(e.gastoMesUsd)}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-neutral-300">
              Hoje: {formatarUsd(e.gastoDiaUsd)}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px]">
              <thead>
                <tr>
                  <th className={TH}>Agente</th>
                  <th className={TH}>Execuções</th>
                  <th className={TH}>Concluídas</th>
                  <th className={TH}>Falhas</th>
                  <th className={TH}>Custo</th>
                  <th className={TH}>Duração média</th>
                  <th className={TH}>Fila</th>
                </tr>
              </thead>
              <tbody>
                {ordenarEquipe(e.agentes).map((a) => {
                  const r = resumo.porAgente.find((x) => x.agentId === a.id)!;
                  return (
                    <tr key={a.id} className="border-t border-white/5">
                      <td className={TD}>{META_PAPEL[a.papel].rotulo}</td>
                      <td className={TD}>{r.execucoes}</td>
                      <td className={TD}>{r.concluidas}</td>
                      <td className={cn(TD, r.falhas > 0 && "text-rose-300")}>{r.falhas}</td>
                      <td className={TD}>{formatarUsd(r.custoUsd)}</td>
                      <td className={TD}>{formatarDuracao(r.duracaoMediaS)}</td>
                      <td className={TD}>{r.tarefasAbertas}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {e.agentes.length === 0 && (
            <p className="text-[11px] text-neutral-500">Nenhum agente configurado ainda.</p>
          )}
        </>
      )}
    </Moldura>
  );
}
