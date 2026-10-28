// Operações Comerciais por nicho/produto e memória da organização (CEO Mestre), encaixadas nas telas
// existentes: 02 (operações), 08 (memória) e 12 (desempenho por operação/nicho). Só aparece com a flag
// VITE_CEO_MESTRE e com a migration publicada; sem isso não renderiza nada (nenhum dado de exemplo).
// Toda escrita é RPC humana: pausar/encerrar operação, autorizar agente, registrar/arquivar memória.
import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatarUsd } from "@/lib/ceo-config";
import { META_PAPEL, PAPEIS, type Papel } from "@/lib/equipe-config";
import { ErroCeo } from "@/services/agente-ceo-admin";
import {
  arquivarMemoria,
  carregarMemoria,
  carregarOperacoes,
  definirEstadoOperacao,
  registrarMemoriaHumana,
  type CargaMemoria,
  type CargaOperacoes,
} from "@/services/agente-operacoes";

const CARD = "rounded-2xl border border-[#1e2638] bg-[#0c1017]/90 p-5 shadow-xl";
const BTN =
  "inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-[#121620] px-3 text-[11px] font-semibold text-neutral-200 transition-colors hover:bg-[#181e2b] hover:text-white disabled:cursor-not-allowed disabled:opacity-50";
const INPUT =
  "w-full rounded-xl border border-white/10 bg-[#101624] px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-[#f95d14] focus:outline-none";

const rotuloPapel = (p: string) =>
  PAPEIS.includes(p as Papel) ? META_PAPEL[p as Papel].rotulo : p;

const ROTULO_STATUS: Record<string, { rotulo: string; cls: string }> = {
  ativa: { rotulo: "Ativa", cls: "bg-emerald-500/15 text-emerald-300" },
  pausada: { rotulo: "Pausada", cls: "bg-amber-500/15 text-amber-300" },
  encerrada: { rotulo: "Encerrada", cls: "bg-neutral-500/15 text-neutral-400" },
};

function useCarga<T>(carregar: () => Promise<T>) {
  const [dados, setDados] = useState<T | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const recarregar = useCallback(async () => {
    setCarregando(true);
    try {
      setDados(await carregar());
      setErro(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Serviço indisponível.");
    } finally {
      setCarregando(false);
    }
  }, [carregar]);
  useEffect(() => {
    void recarregar();
  }, [recarregar]);
  return { dados, erro, carregando, recarregar };
}

// ───────────────────────────── Tela 02 / Tela 12 — operações ─────────────────────────────
export function OperacoesRealPanel({ modo = "gestao" }: { modo?: "gestao" | "resultados" }) {
  const { dados, erro, carregando, recarregar } = useCarga<CargaOperacoes>(carregarOperacoes);
  const [ocupado, setOcupado] = useState(false);
  const [msg, setMsg] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  if (carregando && !dados) {
    return (
      <section className={CARD}>
        <p className="flex items-center gap-2 text-[11px] text-neutral-400">
          <Loader2 className="size-3.5 animate-spin" /> Consultando operações…
        </p>
      </section>
    );
  }
  if (!erro && dados && !dados.disponivel) return null; // flag desligada ou migration não publicada
  if (erro || !dados || !dados.disponivel) {
    return (
      <section className={CARD}>
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-300">
          {erro ?? "Serviço indisponível."}
        </p>
      </section>
    );
  }

  const desempenhoDe = (id: string) => dados.desempenho.find((d) => d.operacao_id === id);
  const alterar = async (id: string, estado: "ativa" | "pausada" | "encerrada") => {
    setOcupado(true);
    setMsg(null);
    try {
      await definirEstadoOperacao(id, estado);
      await recarregar();
      setMsg({ tipo: "ok", texto: "Operação atualizada." });
    } catch (e) {
      setMsg({
        tipo: "erro",
        texto: e instanceof ErroCeo ? e.message : "Operação não concluída.",
      });
    } finally {
      setOcupado(false);
    }
  };

  return (
    <section
      className={cn(CARD, "space-y-4")}
      aria-label={modo === "gestao" ? "Operações comerciais" : "Desempenho por operação"}
    >
      <div>
        <h3 className="text-sm font-bold text-white">
          {modo === "gestao"
            ? "Operações comerciais por nicho e produto (reais)"
            : "Resultados por operação e nicho (reais)"}
        </h3>
        <p className="mt-0.5 text-[11px] text-neutral-400">
          {modo === "gestao"
            ? "Cada operação nasce de uma proposta do CEO aprovada por você, com equipe, orçamento e tarefas próprios."
            : "Tarefas e custo de cada operação, lidos do runtime. Nada é estimado."}
        </p>
      </div>
      {dados.operacoes.length === 0 ? (
        <p className="text-[11px] text-neutral-500">
          Nenhuma operação aprovada ainda. Peça ao CEO, no Copiloto, uma estratégia para um nicho e
          produto; a proposta aparece em Aprovações.
        </p>
      ) : (
        <ul className="space-y-3">
          {dados.operacoes.map((o) => {
            const d = desempenhoDe(o.id);
            const st = ROTULO_STATUS[o.status];
            return (
              <li key={o.id} className="rounded-xl border border-white/5 bg-[#101622] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-white">
                    {o.nome}{" "}
                    <span className={cn("ml-1 rounded-full px-2 py-0.5 text-[10px]", st.cls)}>
                      {st.rotulo}
                    </span>
                  </p>
                  {modo === "gestao" && o.status !== "encerrada" && (
                    <div className="flex gap-2">
                      {o.status === "ativa" ? (
                        <button
                          className={BTN}
                          disabled={ocupado}
                          onClick={() => void alterar(o.id, "pausada")}
                        >
                          Pausar
                        </button>
                      ) : (
                        <button
                          className={BTN}
                          disabled={ocupado}
                          onClick={() => void alterar(o.id, "ativa")}
                        >
                          Reativar
                        </button>
                      )}
                      <button
                        className={cn(BTN, "border-rose-500/30 text-rose-300")}
                        disabled={ocupado}
                        onClick={() => {
                          if (
                            confirm("Encerrar a operação? Tarefas ainda na fila serão canceladas.")
                          )
                            void alterar(o.id, "encerrada");
                        }}
                      >
                        Encerrar
                      </button>
                    </div>
                  )}
                </div>
                <p className="mt-1 text-[11px] text-neutral-400">
                  {o.nicho}
                  {o.subnicho ? ` / ${o.subnicho}` : ""} · {o.produto} · {o.regiao}
                </p>
                <p className="text-[11px] text-neutral-500">Público: {o.publico_alvo}</p>
                <p className="mt-1 text-[11px] text-neutral-400">
                  Equipe: {o.papeis.length ? o.papeis.map(rotuloPapel).join(", ") : "nenhum agente"}
                  {o.papeis_pendentes.length > 0 && (
                    <span className="text-amber-300">
                      {" "}
                      · faltam agentes: {o.papeis_pendentes.map(rotuloPapel).join(", ")} (proponha a
                      equipe ao CEO)
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-neutral-400">
                  Orçamento mensal: {formatarUsd(o.orcamento_usd_mes)}
                  {d && (
                    <>
                      {" "}
                      · gasto no mês {formatarUsd(d.custo_mes_usd)} · tarefas: {d.tarefas_abertas}{" "}
                      abertas, {d.tarefas_concluidas} concluídas, {d.tarefas_falhas} com falha
                    </>
                  )}
                </p>
                {modo === "gestao" && Object.keys(o.estrategia ?? {}).length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-[11px] font-semibold text-neutral-300">
                      Estratégia
                    </summary>
                    <dl className="mt-1 grid gap-1 text-[11px] text-neutral-300">
                      {Object.entries(o.estrategia).map(([k, v]) => (
                        <div key={k}>
                          <dt className="inline font-semibold capitalize">
                            {k.replace("_", " ")}:{" "}
                          </dt>
                          <dd className="inline">{v}</dd>
                        </div>
                      ))}
                    </dl>
                  </details>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {msg && (
        <p className={cn("text-[11px]", msg.tipo === "ok" ? "text-emerald-400" : "text-rose-300")}>
          {msg.texto}
        </p>
      )}
    </section>
  );
}

// ───────────────────────────── Tela 08 — memória ─────────────────────────────
const CATEGORIAS_HUMANAS = [
  ["feedback_humano", "Feedback"],
  ["preferencia_comercial", "Preferência comercial"],
  ["meta_aprovada", "Meta aprovada"],
  ["contexto_organizacao", "Contexto da empresa"],
] as const;

export function MemoriaRealPanel() {
  const { dados, erro, carregando, recarregar } = useCarga<CargaMemoria>(carregarMemoria);
  const [categoria, setCategoria] = useState<string>("feedback_humano");
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [msg, setMsg] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => {
    void import("@/lib/active-organization").then((m) =>
      m.getActiveOrganizationContext().then((c) => setOrgId(c.orgId)),
    );
  }, []);

  if (carregando && !dados) return null;
  if (!erro && dados && !dados.disponivel) return null;
  if (erro || !dados || !dados.disponivel) return null;

  const registrar = async () => {
    if (!orgId) return;
    setOcupado(true);
    setMsg(null);
    try {
      await registrarMemoriaHumana(orgId, categoria, titulo, conteudo);
      setTitulo("");
      setConteudo("");
      await recarregar();
      setMsg({ tipo: "ok", texto: "Registrado na memória." });
    } catch (e) {
      setMsg({
        tipo: "erro",
        texto:
          e instanceof Error && /sens/i.test(e.message)
            ? "Não registre chaves, senhas, e-mails ou telefones na memória."
            : "Não foi possível registrar (verifique título e conteúdo).",
      });
    } finally {
      setOcupado(false);
    }
  };

  return (
    <section className={cn(CARD, "space-y-4")} aria-label="Memória da organização">
      <div>
        <h3 className="text-sm font-bold text-white">Memória da organização (real)</h3>
        <p className="mt-0.5 text-[11px] text-neutral-400">
          Preferências, metas, decisões e feedback que o CEO consulta ao planejar. Isolada desta
          organização; não guarde chaves, senhas, e-mails nem telefones. É contexto salvo — não
          treina o modelo.
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-[180px_1fr]">
        <select
          className={INPUT}
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          aria-label="Categoria"
        >
          {CATEGORIAS_HUMANAS.map(([id, r]) => (
            <option key={id} value={id}>
              {r}
            </option>
          ))}
        </select>
        <input
          className={INPUT}
          value={titulo}
          maxLength={120}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Título (ex.: Priorizar clínicas em Curitiba)"
        />
        <textarea
          className={cn(INPUT, "sm:col-span-2")}
          rows={2}
          maxLength={1200}
          value={conteudo}
          onChange={(e) => setConteudo(e.target.value)}
          placeholder="Conteúdo"
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          className={BTN}
          disabled={ocupado || titulo.trim().length < 3 || conteudo.trim().length < 3}
          onClick={() => void registrar()}
        >
          {ocupado ? <Loader2 className="size-3.5 animate-spin" /> : "Registrar na memória"}
        </button>
        {msg && (
          <span
            className={cn("text-[11px]", msg.tipo === "ok" ? "text-emerald-400" : "text-rose-300")}
          >
            {msg.texto}
          </span>
        )}
      </div>
      {dados.itens.length === 0 ? (
        <p className="text-[11px] text-neutral-500">Memória vazia.</p>
      ) : (
        <ul className="space-y-2">
          {dados.itens.map((m) => (
            <li
              key={m.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-white/5 bg-[#101622] p-3"
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white">
                  {m.titulo}{" "}
                  <span className="ml-1 rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-normal text-neutral-400">
                    {m.categoria.replace("_", " ")} · {m.origem}
                  </span>
                </p>
                <p className="mt-1 whitespace-pre-wrap break-words text-[11px] text-neutral-300">
                  {m.conteudo}
                </p>
              </div>
              <button
                className={BTN}
                disabled={ocupado}
                onClick={async () => {
                  setOcupado(true);
                  try {
                    await arquivarMemoria(m.id);
                    await recarregar();
                  } finally {
                    setOcupado(false);
                  }
                }}
              >
                Arquivar
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
