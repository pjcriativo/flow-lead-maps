// Assistente de configuração inicial do CEO de IA (Tela 02 — botão "Montar minha equipe com CEO de
// IA"). Cinco etapas: identidade, modelo, ferramentas, autonomia e revisão/ativação.
// Salvar e Ativar passam SEMPRE pelas RPCs de governança (sessão humana); se o backend estiver
// indisponível, o erro é mostrado e nada é dado como feito.
import React, { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Crown, Loader2, Save, ShieldCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AVATARES_CEO,
  CONFIG_CEO_PADRAO,
  FERRAMENTA_RESUMO_COMERCIAL,
  MODELOS_CEO,
  TETOS_CEO,
  estimarCustoPerguntaUsd,
  formatarUsd,
  permissoesEfetivas,
  validarConfigCeo,
  type ConfigCeoForm,
  type ErrosConfigCeo,
} from "@/lib/ceo-config";
import { MSG_CONFIGURAR_PROVEDOR } from "@/lib/ia-config";
import { definirEstadoCeo, ErroCeo, salvarConfigCeo } from "@/services/agente-ceo-admin";
import { CeoEstadoPill } from "./CeoRealUi";
import type { CeoReal } from "./useCeoReal";

const ETAPAS = [
  "Identidade",
  "Modelo de IA",
  "Ferramentas",
  "Autonomia e segurança",
  "Revisão e ativação",
];
const CAMPOS_POR_ETAPA: (keyof ConfigCeoForm)[][] = [
  ["nome", "cargo", "departamento", "descricao", "especialidade", "avatarUrl"],
  ["modelo", "tetoDiaUsd", "tetoMesUsd"],
  ["ferramentas"],
  [],
  [],
];

const INPUT =
  "mt-1 w-full rounded-xl border border-white/10 bg-[#101624] px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-[#f95d14] focus:outline-none";

interface Props {
  aberto: boolean;
  onFechar: () => void;
  ceo: CeoReal;
  /** Abre a montagem completa da equipe (funcionalidade futura, mantida no layout original). */
  onAbrirMontagemCompleta?: () => void;
}

export function CeoConfigWizard({ aberto, onFechar, ceo, onAbrirMontagemCompleta }: Props) {
  const [etapa, setEtapa] = useState(0);
  const [form, setForm] = useState<ConfigCeoForm>(CONFIG_CEO_PADRAO);
  const [ocupado, setOcupado] = useState(false);
  const [resultado, setResultado] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);
  const agente = ceo.carga?.agente ?? null;

  // Ao abrir, parte do que já está salvo (reconfigurar) ou do padrão da fundação.
  useEffect(() => {
    if (!aberto) return;
    setEtapa(0);
    setResultado(null);
    setForm(
      agente
        ? {
            nome: agente.nome,
            cargo: agente.cargo ?? CONFIG_CEO_PADRAO.cargo,
            departamento: agente.departamento ?? CONFIG_CEO_PADRAO.departamento,
            descricao: agente.descricao ?? CONFIG_CEO_PADRAO.descricao,
            especialidade: agente.especialidade ?? CONFIG_CEO_PADRAO.especialidade,
            avatarUrl: agente.avatarUrl ?? CONFIG_CEO_PADRAO.avatarUrl,
            modelo: agente.modelo,
            tetoDiaUsd: agente.tetoDiaUsd,
            tetoMesUsd: agente.tetoMesUsd,
            ferramentas: ceo.carga?.ferramentasConcedidas ?? [],
          }
        : {
            ...CONFIG_CEO_PADRAO,
            // Central de IA publicada: o modelo inicial é o escolhido pelo Super Admin para o CEO.
            modelo:
              ceo.catalogo.disponivel && ceo.catalogo.modeloCeo
                ? ceo.catalogo.modeloCeo
                : CONFIG_CEO_PADRAO.modelo,
          },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto]);

  if (!aberto) return null;

  const { ok: formValido, erros } = validarConfigCeo(form);
  const errosEtapa: ErrosConfigCeo = Object.fromEntries(
    Object.entries(erros).filter(([k]) =>
      CAMPOS_POR_ETAPA[etapa].includes(k as keyof ConfigCeoForm),
    ),
  );
  const etapaValida = Object.keys(errosEtapa).length === 0;
  const catalogo = ceo.catalogo;
  // Com a Central de IA publicada: só os modelos liberados pelo Super Admin (e conectados) aparecem.
  const opcoesModelo: {
    id: string;
    rotulo: string;
    usdEntrada: number;
    usdSaida: number;
    padrao: boolean;
  }[] = catalogo.disponivel
    ? catalogo.modelos.map((m) => ({ ...m, padrao: m.id === catalogo.modeloCeo }))
    : MODELOS_CEO.map((m) => ({ ...m }));
  // Provedor do CEO sem conexão válida (ou sem modelo liberado): não dá para ativar.
  const bloqueadoPorProvedor =
    catalogo.disponivel && (!catalogo.ceoPronto || opcoesModelo.length === 0);
  const servicoOk =
    ceo.orgId !== null && ceo.estado.id !== "servico_indisponivel" && !bloqueadoPorProvedor;
  const set = <K extends keyof ConfigCeoForm>(k: K, v: ConfigCeoForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));
  const custo = estimarCustoPerguntaUsd(form.modelo);

  const salvar = async (ativar: boolean) => {
    if (!ceo.orgId || !formValido) return;
    setOcupado(true);
    setResultado(null);
    try {
      const salvo = await salvarConfigCeo(ceo.orgId, form);
      if (ativar) await definirEstadoCeo(salvo.id, "ativo");
      await ceo.recarregar();
      setResultado({
        tipo: "ok",
        texto: ativar
          ? "CEO configurado e ativado."
          : "Configuração salva. O CEO continua inativo até ser ativado.",
      });
    } catch (e) {
      setResultado({
        tipo: "erro",
        texto: e instanceof ErroCeo ? e.message : "Operação não concluída.",
      });
    } finally {
      setOcupado(false);
    }
  };

  const campo = (k: keyof ConfigCeoForm, rotulo: string, input: React.ReactNode) => (
    <label className="block text-[11px] font-medium text-neutral-300">
      {rotulo}
      {input}
      {erros[k] && <span className="mt-1 block text-[10px] text-rose-300">{erros[k]}</span>}
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={onFechar} />
      <div
        role="dialog"
        aria-label="Configurar CEO de IA"
        className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[#1e2638] bg-[#0c1017] shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/5 p-5">
          <div>
            <div className="flex items-center gap-2">
              <Crown className="size-4 text-amber-400" />
              <h2 className="text-base font-bold text-white">Configurar o CEO de IA</h2>
              <CeoEstadoPill estado={ceo.estado} />
            </div>
            <p className="mt-1 text-[11px] text-neutral-400">
              Etapa {etapa + 1} de {ETAPAS.length} · {ETAPAS[etapa]}
            </p>
          </div>
          <button
            type="button"
            onClick={onFechar}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-white/10 hover:text-white"
            aria-label="Fechar"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex gap-1 px-5 pt-3">
          {ETAPAS.map((n, i) => (
            <div
              key={n}
              className={cn("h-1 flex-1 rounded-full", i <= etapa ? "bg-[#f95d14]" : "bg-white/10")}
            />
          ))}
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {!servicoOk && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-300">
              {ceo.erro ?? ceo.estado.descricao} Você pode preencher a configuração, mas salvar e
              ativar só funcionam com o backend disponível.
            </div>
          )}

          {etapa === 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {campo(
                "nome",
                "Nome do CEO",
                <input
                  className={INPUT}
                  value={form.nome}
                  maxLength={80}
                  onChange={(e) => set("nome", e.target.value)}
                />,
              )}
              {campo(
                "cargo",
                "Cargo",
                <input
                  className={INPUT}
                  value={form.cargo}
                  maxLength={80}
                  onChange={(e) => set("cargo", e.target.value)}
                />,
              )}
              {campo(
                "departamento",
                "Departamento",
                <input
                  className={INPUT}
                  value={form.departamento}
                  maxLength={80}
                  onChange={(e) => set("departamento", e.target.value)}
                />,
              )}
              {campo(
                "especialidade",
                "Especialidade",
                <input
                  className={INPUT}
                  value={form.especialidade}
                  maxLength={120}
                  onChange={(e) => set("especialidade", e.target.value)}
                />,
              )}
              <div className="sm:col-span-2">
                {campo(
                  "descricao",
                  "Descrição",
                  <textarea
                    className={cn(INPUT, "min-h-20")}
                    value={form.descricao}
                    maxLength={500}
                    onChange={(e) => set("descricao", e.target.value)}
                  />,
                )}
              </div>
              <div className="sm:col-span-2">
                <p className="text-[11px] font-medium text-neutral-300">Avatar</p>
                <div className="mt-2 flex gap-3">
                  {AVATARES_CEO.map((url) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => set("avatarUrl", url)}
                      aria-pressed={form.avatarUrl === url}
                      className={cn(
                        "size-14 overflow-hidden rounded-xl border-2",
                        form.avatarUrl === url
                          ? "border-[#f95d14]"
                          : "border-white/10 opacity-70 hover:opacity-100",
                      )}
                    >
                      <img src={url} alt="" className="size-full object-cover object-top" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {etapa === 1 && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <p className="text-[11px] font-medium text-neutral-300">Provedor de IA</p>
                <p className="mt-1 text-xs text-white">
                  {catalogo.disponivel
                    ? `${catalogo.provedorCeo === "openai" ? "OpenAI" : "Anthropic (Claude)"} — definido pelo Super Admin`
                    : "Anthropic (Claude) — único provedor configurado no backend"}
                </p>
                {bloqueadoPorProvedor && (
                  <p
                    role="alert"
                    className="mt-2 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-[11px] text-amber-200"
                  >
                    {MSG_CONFIGURAR_PROVEDOR}
                  </p>
                )}
              </div>
              <div className="sm:col-span-2">
                {campo(
                  "modelo",
                  "Modelo",
                  <select
                    className={INPUT}
                    value={form.modelo}
                    onChange={(e) => set("modelo", e.target.value)}
                  >
                    {opcoesModelo.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.rotulo}
                        {m.padrao ? " (padrão, mais econômico)" : ""} — US$ {m.usdEntrada}/
                        {m.usdSaida} por 1M tokens
                      </option>
                    ))}
                  </select>,
                )}
              </div>
              {campo(
                "tetoDiaUsd",
                `Limite diário (US$, máx. ${TETOS_CEO.diaMaxUsd})`,
                <input
                  className={INPUT}
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={TETOS_CEO.diaMaxUsd}
                  value={form.tetoDiaUsd}
                  onChange={(e) => set("tetoDiaUsd", Number(e.target.value))}
                />,
              )}
              {campo(
                "tetoMesUsd",
                `Limite mensal (US$, máx. ${TETOS_CEO.mesMaxUsd})`,
                <input
                  className={INPUT}
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={TETOS_CEO.mesMaxUsd}
                  value={form.tetoMesUsd}
                  onChange={(e) => set("tetoMesUsd", Number(e.target.value))}
                />,
              )}
              <p className="text-[11px] text-neutral-400 sm:col-span-2">
                Estimativa por pergunta: {custo === null ? "indisponível" : formatarUsd(custo)}{" "}
                (consulta + resposta). Os tetos acima são os máximos do backend; ele recusa valores
                maiores.
              </p>
            </div>
          )}

          {etapa === 2 && (
            <div className="space-y-3">
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-[#101622] p-4">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={form.ferramentas.includes(FERRAMENTA_RESUMO_COMERCIAL)}
                  onChange={(e) =>
                    set("ferramentas", e.target.checked ? [FERRAMENTA_RESUMO_COMERCIAL] : [])
                  }
                />
                <span>
                  <span className="block text-xs font-bold text-white">
                    {FERRAMENTA_RESUMO_COMERCIAL}
                  </span>
                  <span className="mt-1 block text-[11px] text-neutral-400">
                    Consulta leads, indicadores e informações comerciais da organização, sem
                    modificar dados.
                  </span>
                </span>
              </label>
              {erros.ferramentas && (
                <p className="text-[11px] text-rose-300">{erros.ferramentas}</p>
              )}
              <p className="text-[11px] text-neutral-500">
                Esta é a única ferramenta operacional nesta fase. Prospecção, SDR, propostas e
                envios chegam em fases futuras.
              </p>
            </div>
          )}

          {etapa === 3 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <ShieldCheck className="size-4" /> Regras efetivas aplicadas pelo backend
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {permissoesEfetivas().map((p) => (
                  <div
                    key={p.rotulo}
                    className="rounded-lg border border-white/5 bg-[#101622] px-3 py-2"
                  >
                    <p className="text-[10px] text-neutral-500">{p.rotulo}</p>
                    <p className="text-xs font-semibold text-neutral-200">{p.valor}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {etapa === 4 && (
            <div className="space-y-3 text-xs">
              <dl className="grid gap-2 sm:grid-cols-2">
                {[
                  ["Organização", ceo.orgId ?? "indisponível"],
                  ["Identidade", `${form.nome} · ${form.cargo} · ${form.departamento}`],
                  ["Especialidade", form.especialidade],
                  ["Modelo", opcoesModelo.find((m) => m.id === form.modelo)?.rotulo ?? form.modelo],
                  [
                    "Ferramenta",
                    form.ferramentas.join(", ") || "Nenhuma (não será possível ativar)",
                  ],
                  [
                    "Orçamento",
                    `${formatarUsd(form.tetoDiaUsd)}/dia · ${formatarUsd(form.tetoMesUsd)}/mês`,
                  ],
                  ["Permissões", "Somente leitura · sem envio externo · execução manual"],
                  ["Estado após salvar", "Inativo (ativar é uma ação explícita sua)"],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-lg border border-white/5 bg-[#101622] px-3 py-2">
                    <dt className="text-[10px] text-neutral-500">{k}</dt>
                    <dd className="break-words font-semibold text-neutral-200">{v}</dd>
                  </div>
                ))}
              </dl>
              {!formValido && (
                <p className="text-[11px] text-rose-300">
                  Corrija os campos destacados nas etapas anteriores.
                </p>
              )}
              {resultado && (
                <p
                  className={cn(
                    "text-[11px]",
                    resultado.tipo === "ok" ? "text-emerald-400" : "text-rose-300",
                  )}
                >
                  {resultado.texto}
                </p>
              )}
              {onAbrirMontagemCompleta && (
                <button
                  type="button"
                  onClick={onAbrirMontagemCompleta}
                  className="text-[11px] text-neutral-400 underline hover:text-white"
                >
                  Montagem completa da equipe (funcionalidade futura — ainda não operacional)
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/5 p-4">
          <button
            type="button"
            onClick={() => setEtapa((e) => Math.max(0, e - 1))}
            disabled={etapa === 0 || ocupado}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#121620] px-4 py-2 text-xs font-semibold text-neutral-200 disabled:opacity-40"
          >
            <ArrowLeft className="size-3.5" /> Voltar
          </button>
          {etapa < ETAPAS.length - 1 ? (
            <button
              type="button"
              disabled={!etapaValida}
              onClick={() => setEtapa((e) => e + 1)}
              className="flex items-center gap-1.5 rounded-xl bg-[#f95d14] px-5 py-2 text-xs font-bold text-white disabled:opacity-40"
            >
              Avançar <ArrowRight className="size-3.5" />
            </button>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!servicoOk || !formValido || ocupado}
                onClick={() => salvar(false)}
                className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#121620] px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
              >
                {ocupado ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Save className="size-3.5" />
                )}{" "}
                Salvar configuração
              </button>
              <button
                type="button"
                disabled={!servicoOk || !formValido || ocupado || form.ferramentas.length === 0}
                onClick={() => salvar(true)}
                className="flex items-center gap-1.5 rounded-xl bg-[#f95d14] px-5 py-2 text-xs font-bold text-white shadow-lg shadow-orange-500/25 disabled:opacity-40"
              >
                <Check className="size-3.5" /> Ativar CEO
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
