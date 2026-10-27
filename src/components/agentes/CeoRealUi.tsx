// Blocos de interface do CEO de IA REAL, reutilizados nas Telas 02, 03 e 10 (nenhuma tela nova).
// Mostra o estado verdadeiro do backend; nunca exibe "online" se o CEO está inativo ou se o
// serviço não responde. Ações usam só as RPCs de governança (sessão humana) e só atualizam a
// tela depois da confirmação do banco.
import React, { useState } from "react";
import {
  AlertTriangle,
  Crown,
  Loader2,
  Pause,
  Play,
  Power,
  ShieldAlert,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AVATARES_CEO,
  FERRAMENTA_RESUMO_COMERCIAL,
  MODELOS_CEO,
  TETOS_CEO,
  estimarCustoPerguntaUsd,
  formatarUsd,
  permissoesEfetivas,
  type EstadoCeo,
  type TomEstado,
} from "@/lib/ceo-config";
import {
  definirEstadoCeo,
  definirKillSwitch,
  definirLimitesCeo,
  ErroCeo,
} from "@/services/agente-ceo-admin";
import type { CeoReal } from "./useCeoReal";

const TOM: Record<TomEstado, string> = {
  ok: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  aviso: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  erro: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  neutro: "border-white/10 bg-white/5 text-neutral-300",
};

export function CeoEstadoPill({ estado }: { estado: EstadoCeo }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold",
        TOM[estado.tom],
      )}
    >
      <span
        className={cn("size-1.5 rounded-full bg-current", estado.id === "ativo" && "animate-pulse")}
      />
      {estado.rotulo}
    </span>
  );
}

/** Executa uma ação de governança e só recarrega o estado depois que o banco confirmou. */
function useAcaoCeo(ceo: CeoReal) {
  const [ocupado, setOcupado] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);
  const executar = async (acao: () => Promise<unknown>, sucesso: string) => {
    setOcupado(true);
    setMensagem(null);
    try {
      await acao();
      await ceo.recarregar();
      setMensagem({ tipo: "ok", texto: sucesso });
    } catch (e) {
      setMensagem({
        tipo: "erro",
        texto: e instanceof ErroCeo ? e.message : "Operação não concluída.",
      });
    } finally {
      setOcupado(false);
    }
  };
  return { ocupado, mensagem, executar };
}

const BTN =
  "inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-[#121620] px-3 text-[11px] font-semibold text-neutral-200 transition-colors hover:bg-[#181e2b] hover:text-white disabled:cursor-not-allowed disabled:opacity-50";

/** Botões de estado (ativar, pausar, kill-switch). */
function AcoesEstado({ ceo, onConfigurar }: { ceo: CeoReal; onConfigurar?: () => void }) {
  const { ocupado, mensagem, executar } = useAcaoCeo(ceo);
  const agente = ceo.carga?.agente ?? null;
  const id = ceo.estado.id;
  if (!agente || !ceo.orgId) {
    return onConfigurar && id === "nao_configurado" ? (
      <button type="button" onClick={onConfigurar} className={BTN}>
        <Crown className="size-3.5 text-amber-400" />
        Configurar CEO
      </button>
    ) : null;
  }
  const orgId = ceo.orgId;
  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap justify-end gap-2">
        {onConfigurar && (
          <button type="button" onClick={onConfigurar} className={BTN}>
            <Wrench className="size-3.5" />
            Configurar
          </button>
        )}
        {agente.estado !== "ativo" && !agente.killSwitch && (
          <button
            type="button"
            disabled={ocupado}
            onClick={() => executar(() => definirEstadoCeo(agente.id, "ativo"), "CEO ativado.")}
            className={cn(BTN, "border-emerald-500/30 text-emerald-300")}
          >
            <Play className="size-3.5" />
            Ativar
          </button>
        )}
        {agente.estado === "ativo" && (
          <button
            type="button"
            disabled={ocupado}
            onClick={() => executar(() => definirEstadoCeo(agente.id, "pausado"), "CEO pausado.")}
            className={BTN}
          >
            <Pause className="size-3.5" />
            Pausar
          </button>
        )}
        {agente.killSwitch ? (
          <button
            type="button"
            disabled={ocupado}
            onClick={() =>
              executar(() => definirKillSwitch(orgId, false), "Kill-switch desligado.")
            }
            className={BTN}
          >
            <Power className="size-3.5" />
            Retomar
          </button>
        ) : (
          <button
            type="button"
            disabled={ocupado}
            onClick={() => {
              if (
                window.confirm(
                  "Ligar o kill-switch cancela as tarefas na fila e bloqueia o CEO. Continuar?",
                )
              ) {
                void executar(() => definirKillSwitch(orgId, true), "Kill-switch ligado.");
              }
            }}
            className={cn(BTN, "border-rose-500/30 text-rose-300")}
          >
            <ShieldAlert className="size-3.5" />
            Kill-switch
          </button>
        )}
        {ocupado && <Loader2 className="size-4 animate-spin text-neutral-400" />}
      </div>
      {mensagem && (
        <p
          className={cn(
            "text-[11px]",
            mensagem.tipo === "ok" ? "text-emerald-400" : "text-rose-300",
          )}
        >
          {mensagem.texto}
        </p>
      )}
    </div>
  );
}

/** Tela 02 — faixa com o estado verdadeiro do CEO, acima das abas (layout existente intacto). */
export function CeoRealStatusCard({
  ceo,
  onConfigurar,
}: {
  ceo: CeoReal;
  onConfigurar: () => void;
}) {
  const agente = ceo.carga?.agente ?? null;
  return (
    <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#1e2638] bg-[#0c1017]/90 p-4 shadow-xl">
      <div className="flex min-w-0 items-center gap-3.5">
        <div className="relative size-12 shrink-0 overflow-hidden rounded-xl border border-orange-500/40">
          <img
            src={agente?.avatarUrl ?? AVATARES_CEO[0]}
            alt=""
            className={cn("size-full object-cover object-top", !agente && "opacity-40 grayscale")}
          />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-bold text-white">{agente?.nome ?? "CEO de IA"}</h3>
            <CeoEstadoPill estado={ceo.estado} />
          </div>
          <p className="mt-0.5 text-[11px] text-neutral-400">{ceo.erro ?? ceo.estado.descricao}</p>
        </div>
      </div>
      <AcoesEstado ceo={ceo} onConfigurar={onConfigurar} />
    </section>
  );
}

/** Tela 10 — aviso do estado real; deixa claro quando o chat ainda é demonstrativo. */
export function CeoCopilotoBanner({ ceo, flagLigada }: { ceo: CeoReal; flagLigada: boolean }) {
  const demonstrativo = !flagLigada;
  const aviso = demonstrativo
    ? "Copiloto em demonstração: o CEO real ainda não foi habilitado neste ambiente. As respostas abaixo não vêm da IA."
    : ceo.estado.id === "ativo"
      ? "CEO de IA ativo: responde com dados reais da sua organização (somente leitura, execução manual)."
      : ceo.estado.descricao;
  const tom: TomEstado = demonstrativo ? "aviso" : ceo.estado.tom;
  return (
    <div className={cn("flex items-start gap-2 rounded-xl border px-3 py-2 text-[11px]", TOM[tom])}>
      <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
      <div className="flex flex-wrap items-center gap-2">
        {!demonstrativo && <CeoEstadoPill estado={ceo.estado} />}
        <span>{aviso}</span>
      </div>
    </div>
  );
}

const FUTURAS = [
  "Treinamento e conhecimento",
  "Memória e RAG",
  "Voz",
  "Skills adicionais",
  "Enxames e departamentos",
];

/** Tela 03 — configuração real do CEO (identidade, modelo, limites, ferramenta, estado). */
export function CeoRealConfigPanel({
  ceo,
  onConfigurar,
  titulo = "Configuração real do CEO de IA",
  extra,
}: {
  ceo: CeoReal;
  /** Só o CEO tem o assistente de configuração; subordinados são ajustados no painel. */
  onConfigurar?: () => void;
  titulo?: string;
  /** Conteúdo adicional (ex.: permissões do papel) dentro do mesmo painel. */
  extra?: React.ReactNode;
}) {
  const { ocupado, mensagem, executar } = useAcaoCeo(ceo);
  const agente = ceo.carga?.agente ?? null;
  const [editando, setEditando] = useState(false);
  const [dia, setDia] = useState("");
  const [mes, setMes] = useState("");
  const [modelo, setModelo] = useState("");

  const abrirEdicao = () => {
    if (!agente) return;
    setDia(String(agente.tetoDiaUsd));
    setMes(String(agente.tetoMesUsd));
    setModelo(agente.modelo);
    setEditando(true);
  };
  const diaN = Number(dia.replace(",", "."));
  const mesN = Number(mes.replace(",", "."));
  const limitesOk =
    diaN > 0 &&
    mesN > 0 &&
    diaN <= TETOS_CEO.diaMaxUsd &&
    mesN <= TETOS_CEO.mesMaxUsd &&
    diaN <= mesN;

  return (
    <section className="space-y-4 rounded-2xl border border-orange-500/30 bg-[#0c1017] p-5 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Crown className="size-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white">{titulo}</h3>
          <CeoEstadoPill estado={ceo.estado} />
        </div>
        <AcoesEstado ceo={ceo} onConfigurar={onConfigurar} />
      </div>
      <p className="text-[11px] text-neutral-400">{ceo.erro ?? ceo.estado.descricao}</p>

      {agente && (
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-white/5 bg-[#121620]/90 p-3">
            <p className="text-[10px] font-medium text-neutral-400">Identidade</p>
            <p className="mt-1 text-xs font-bold text-white">{agente.nome}</p>
            <p className="text-[11px] text-neutral-400">
              {[agente.cargo, agente.departamento].filter(Boolean).join(" · ") ||
                "Identidade não salva"}
            </p>
            {agente.especialidade && (
              <p className="text-[11px] text-neutral-500">{agente.especialidade}</p>
            )}
          </div>
          <div className="rounded-xl border border-white/5 bg-[#121620]/90 p-3">
            <p className="text-[10px] font-medium text-neutral-400">Modelo e limites</p>
            <p className="mt-1 text-xs font-bold text-white">
              {MODELOS_CEO.find((m) => m.id === agente.modelo)?.rotulo ?? agente.modelo}
            </p>
            <p className="text-[11px] text-neutral-400">
              {formatarUsd(agente.tetoDiaUsd)}/dia · {formatarUsd(agente.tetoMesUsd)}/mês
            </p>
            <p className="text-[11px] text-neutral-500">
              Usado: {formatarUsd(ceo.carga?.gastoDiaUsd ?? 0)} hoje ·{" "}
              {formatarUsd(ceo.carga?.gastoMesUsd ?? 0)} no mês
            </p>
          </div>
          <div className="rounded-xl border border-white/5 bg-[#121620]/90 p-3">
            <p className="text-[10px] font-medium text-neutral-400">Ferramentas autorizadas</p>
            {(ceo.carga?.ferramentasConcedidas.length ?? 0) > 0 ? (
              <p className="mt-1 break-words text-xs font-bold text-white">
                {ceo.carga?.ferramentasConcedidas.join(", ")}
              </p>
            ) : (
              <p className="mt-1 text-xs text-neutral-400">Nenhuma ferramenta concedida.</p>
            )}
            <p className="text-[11px] text-neutral-500">
              Concedidas por um administrador · nenhuma envia nada externo
            </p>
          </div>
        </div>
      )}

      {agente && !editando && (
        <button type="button" onClick={abrirEdicao} className={BTN}>
          Editar modelo e limites
        </button>
      )}
      {agente && editando && (
        <div className="grid items-end gap-3 rounded-xl border border-white/10 bg-[#101622] p-3 sm:grid-cols-4">
          <label className="text-[11px] text-neutral-400">
            Modelo
            <select
              value={modelo}
              onChange={(e) => setModelo(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-[#0c1017] px-2 py-1.5 text-xs text-white"
            >
              {MODELOS_CEO.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.rotulo}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[11px] text-neutral-400">
            Limite diário (US$, máx. {TETOS_CEO.diaMaxUsd})
            <input
              value={dia}
              onChange={(e) => setDia(e.target.value)}
              inputMode="decimal"
              className="mt-1 w-full rounded-lg border border-white/10 bg-[#0c1017] px-2 py-1.5 text-xs text-white"
            />
          </label>
          <label className="text-[11px] text-neutral-400">
            Limite mensal (US$, máx. {TETOS_CEO.mesMaxUsd})
            <input
              value={mes}
              onChange={(e) => setMes(e.target.value)}
              inputMode="decimal"
              className="mt-1 w-full rounded-lg border border-white/10 bg-[#0c1017] px-2 py-1.5 text-xs text-white"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!limitesOk || ocupado}
              onClick={() =>
                executar(
                  () => definirLimitesCeo(agente, diaN, mesN, modelo),
                  "Limites salvos.",
                ).then(() => setEditando(false))
              }
              className={cn(BTN, "border-orange-500/40 text-orange-300")}
            >
              Salvar
            </button>
            <button type="button" onClick={() => setEditando(false)} className={BTN}>
              Cancelar
            </button>
          </div>
          {!limitesOk && (
            <p className="text-[11px] text-rose-300 sm:col-span-4">
              Valores fora dos tetos do backend (diário ≤ mensal, máx. US$ {TETOS_CEO.diaMaxUsd}/dia
              e US$ {TETOS_CEO.mesMaxUsd}/mês).
            </p>
          )}
          <p className="text-[11px] text-neutral-500 sm:col-span-4">
            Estimativa por pergunta: {formatarUsd(estimarCustoPerguntaUsd(modelo) ?? 0)}
          </p>
        </div>
      )}
      {mensagem && (
        <p
          className={cn(
            "text-[11px]",
            mensagem.tipo === "ok" ? "text-emerald-400" : "text-rose-300",
          )}
        >
          {mensagem.texto}
        </p>
      )}

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {permissoesEfetivas().map((p) => (
          <div key={p.rotulo} className="rounded-lg border border-white/5 bg-[#101622] px-3 py-2">
            <p className="text-[10px] text-neutral-500">{p.rotulo}</p>
            <p className="text-[11px] font-semibold text-neutral-200">{p.valor}</p>
          </div>
        ))}
      </div>

      {extra}

      <div className="flex flex-wrap items-center gap-2 border-t border-white/5 pt-3">
        <span className="text-[10px] font-medium text-neutral-500">
          Em breve (ainda não operacionais):
        </span>
        {FUTURAS.map((f) => (
          <span
            key={f}
            className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] text-neutral-400"
          >
            {f}
          </span>
        ))}
      </div>
      <p className="text-[10px] text-neutral-500">
        Os indicadores, abas e metas exibidos abaixo nesta tela são demonstrativos e não vêm do
        backend.
      </p>
    </section>
  );
}
