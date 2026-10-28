// Super Admin → Inteligência Artificial → Provedores & Modelos.
// Central única da infraestrutura de IA: provedores (OpenAI operacional para o CEO; Anthropic preservada),
// modelos e preços, limites, fallback autorizado, consumo, organizações e logs. Acesso exclusivo do super
// admin (a Edge admin-acoes revalida no servidor). A chave da OpenAI é escrita-apenas: vai uma vez por
// POST autenticado, é validada antes de gravar (chamada gratuita) e fica cifrada no cofre; aqui só se
// vê o estado e a máscara. Conversas e memória dos clientes NUNCA aparecem nesta tela.
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Building2,
  Cpu,
  KeyRound,
  Loader2,
  PlugZap,
  RefreshCw,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { PAPEIS } from "@/lib/equipe-config";
import {
  ROTULO_CONEXAO,
  alertaDeConsumo,
  formatarUsdCurto,
  ordenarModelos,
  percentualDoTeto,
  traduzirMotivoIa,
  validarChaveOpenAI,
  validarPrecos,
  type ModeloLinha,
  type ProvedorId,
} from "@/lib/ia-config";
import {
  ativarProvedor,
  conectarOpenAI,
  lerCentralIa,
  revogarOpenAI,
  salvarConfigIa,
  salvarModeloIa,
  salvarOrcamentoOrg,
  testarOpenAI,
  type CentralIa,
  type ConfigIa,
  type ProvedorEstado,
  type ResultadoIa,
} from "@/services/ia-admin";

type Aba = "provedores" | "modelos" | "limites" | "consumo" | "orgs" | "logs";
const ABAS: { id: Aba; rotulo: string; Icon: typeof Cpu }[] = [
  { id: "provedores", rotulo: "Provedores", Icon: KeyRound },
  { id: "modelos", rotulo: "Modelos & preços", Icon: Cpu },
  { id: "limites", rotulo: "Limites & fallback", Icon: ShieldCheck },
  { id: "consumo", rotulo: "Consumo", Icon: Activity },
  { id: "orgs", rotulo: "Organizações", Icon: Building2 },
  { id: "logs", rotulo: "Erros & logs", Icon: ScrollText },
];

const CARD =
  "rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] transition-shadow hover:shadow-lg";
const INPUT =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25";
const BTN =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:border-gold/50 hover:bg-gold/5 disabled:opacity-50";
const BTN_GOLD =
  "inline-flex items-center justify-center gap-1.5 rounded-lg bg-gold px-4 py-2 text-xs font-semibold text-navy shadow-sm transition-all hover:shadow-md disabled:opacity-60";

const TOM: Record<string, string> = {
  ok: "bg-[#16A34A]/10 text-[#15803D] border-[#16A34A]/30",
  aviso: "bg-gold/10 text-gold border-gold/40",
  erro: "bg-destructive/10 text-destructive border-destructive/30",
  neutro: "bg-secondary text-muted-foreground border-border",
};
const Pilula = ({ tom, children }: { tom: keyof typeof TOM; children: React.ReactNode }) => (
  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${TOM[tom]}`}>
    {children}
  </span>
);

const ROTULO_PAPEL: Record<string, string> = {
  ceo: "CEO Mestre",
  gerente_comercial: "Gerente Comercial",
  prospeccao: "Prospecção",
  sdr: "SDR",
  vendedor: "Vendedor",
  estrategista: "Estrategista",
  seo_geral: "SEO Geral",
};

export function AdminIaProvedores() {
  const [central, setCentral] = useState<CentralIa | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aba, setAba] = useState<Aba>("provedores");

  const carregar = useCallback(async () => {
    setErro(null);
    try {
      setCentral(await lerCentralIa());
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao ler a Central de IA.");
    }
  }, []);
  useEffect(() => {
    void carregar();
  }, [carregar]);

  return (
    <div className="space-y-5">
      <div className={`${CARD} p-6`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 text-gold">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-serif text-xl leading-tight">Provedores & Modelos</h2>
              <p className="text-[11px] text-muted-foreground">
                Infraestrutura de IA do CEO Mestre e dos agentes. Exclusivo do Super Admin; você não
                vê conversas nem memória dos clientes.
              </p>
            </div>
          </div>
          <button onClick={() => void carregar()} className={BTN}>
            <RefreshCw className="h-3.5 w-3.5" /> Atualizar
          </button>
        </div>
        <nav className="mt-4 flex flex-wrap gap-1.5" aria-label="Seções da Central de IA">
          {ABAS.map(({ id, rotulo, Icon }) => (
            <button
              key={id}
              onClick={() => setAba(id)}
              aria-current={aba === id ? "page" : undefined}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                aba === id
                  ? "border-gold bg-gold/10 text-foreground"
                  : "border-border text-muted-foreground hover:border-gold/40"
              }`}
            >
              <Icon className="h-3.5 w-3.5" /> {rotulo}
            </button>
          ))}
        </nav>
      </div>

      {erro && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {erro}
        </p>
      )}
      {!central && !erro && (
        <p className="p-6 text-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Carregando…
        </p>
      )}
      {central && !central.disponivel && (
        <p className="rounded-xl border border-gold/40 bg-gold/10 p-4 text-sm">
          A Central de IA ainda não foi publicada no banco ({traduzirMotivoIa(central.motivo)}).
          Nada aqui está ativo — o CEO continua com o provedor atual.
        </p>
      )}
      {central?.disponivel && (
        <>
          {aba === "provedores" && <AbaProvedores central={central} aoMudar={carregar} />}
          {aba === "modelos" && <AbaModelos central={central} aoMudar={carregar} />}
          {aba === "limites" && <AbaLimites central={central} aoMudar={carregar} />}
          {aba === "consumo" && <AbaConsumo central={central} />}
          {aba === "orgs" && <AbaOrgs central={central} aoMudar={carregar} />}
          {aba === "logs" && <AbaLogs central={central} />}
        </>
      )}
    </div>
  );
}

type Disponivel = Extract<CentralIa, { disponivel: true }>;

async function executar(
  fn: () => Promise<ResultadoIa>,
  sucesso: string,
  aoMudar: () => Promise<void> | void,
): Promise<ResultadoIa | null> {
  try {
    const r = await fn();
    if (r.ok) {
      toast.success(sucesso);
      await aoMudar();
    } else toast.error(traduzirMotivoIa(r.reason));
    return r;
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "Operação não concluída.");
    return null;
  }
}

/* ───────────────────────────── Provedores ───────────────────────────── */

function AbaProvedores({
  central,
  aoMudar,
}: {
  central: Disponivel;
  aoMudar: () => Promise<void>;
}) {
  const [chave, setChave] = useState("");
  const [ocupado, setOcupado] = useState<string | null>(null);
  const openai = central.provedores.find((p) => p.provider === "openai");
  const claude = central.provedores.find((p) => p.provider === "anthropic");
  const formato = chave.trim() ? validarChaveOpenAI(chave) : null;

  const rodar = async (
    id: string,
    fn: () => Promise<ResultadoIa>,
    sucesso: string,
    limpar = false,
  ) => {
    setOcupado(id);
    const r = await executar(fn, sucesso, aoMudar);
    if (limpar) setChave(""); // a chave nunca fica no estado depois do envio
    setOcupado(null);
    return r;
  };

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className={CARD} aria-label="OpenAI">
        <CabecalhoProvedor
          titulo="OpenAI"
          subtitulo="Provedor operacional do CEO Mestre (Responses API)."
          p={openai}
        />
        <div className="space-y-4 p-6">
          <dl className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <dt className="text-muted-foreground">Chave</dt>
              <dd className="font-mono">
                {openai?.chave.configurada
                  ? (openai.chave.mascarada ?? `definida via ${openai.chave.origem}`)
                  : "Não configurada"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Última verificação</dt>
              <dd>
                {openai?.conexao_verificada_em
                  ? new Date(openai.conexao_verificada_em).toLocaleString("pt-BR")
                  : "—"}
              </dd>
            </div>
          </dl>
          {openai?.conexao_detalhe && (
            <p className="text-[11px] text-muted-foreground">{openai.conexao_detalhe}</p>
          )}

          <div>
            <label htmlFor="ia-chave-openai" className="mb-1.5 block text-[13px] font-medium">
              {openai?.chave.configurada ? "Substituir chave" : "Chave da API da OpenAI"}
            </label>
            <input
              id="ia-chave-openai"
              type="password"
              autoComplete="off"
              spellCheck={false}
              value={chave}
              onChange={(e) => setChave(e.target.value)}
              placeholder="sk-…"
              className={`${INPUT} font-mono`}
            />
            <p
              className={`mt-1.5 text-[11px] leading-snug ${formato && !formato.ok ? "font-medium text-destructive" : "text-muted-foreground"}`}
            >
              {formato && !formato.ok
                ? formato.erro
                : "Enviada por canal autenticado, validada na OpenAI (chamada gratuita) e cifrada no servidor (AES-256-GCM). Nunca volta ao navegador nem fica guardada no código ou no armazenamento local."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              className={BTN_GOLD}
              disabled={!!ocupado || !formato?.ok}
              onClick={() =>
                void rodar(
                  "conectar",
                  () => conectarOpenAI(chave.trim()),
                  "Chave validada e salva.",
                  true,
                )
              }
            >
              {ocupado === "conectar" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <PlugZap className="h-3.5 w-3.5" />
              )}
              Validar e salvar
            </button>
            <button
              className={BTN}
              disabled={!!ocupado || !openai?.chave.configurada}
              onClick={() => void rodar("testar", testarOpenAI, "Conexão verificada.")}
            >
              {ocupado === "testar" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Verificar conexão
            </button>
            <button
              className={`${BTN} border-destructive/30 text-destructive hover:bg-destructive/5`}
              disabled={!!ocupado || !openai?.chave.configurada}
              onClick={() => {
                if (
                  !confirm(
                    "Revogar a chave da OpenAI? O provedor será desativado e o CEO que a usa deixa de responder.",
                  )
                )
                  return;
                void rodar("revogar", revogarOpenAI, "Chave revogada e provedor desativado.");
              }}
            >
              <Trash2 className="h-3.5 w-3.5" /> Revogar
            </button>
          </div>

          <div className="flex items-center justify-between border-t border-border/70 pt-4">
            <div>
              <p className="text-sm font-medium">Provedor ativo</p>
              <p className="text-[11px] text-muted-foreground">
                Só ativa com chave salva e conexão verificada. Desativar não apaga a chave.
              </p>
            </div>
            <Interruptor
              marcado={openai?.ativo === true}
              desabilitado={!!ocupado || (!openai?.ativo && openai?.conexao_status !== "ok")}
              aoMudar={(v) =>
                void rodar(
                  "ativar-openai",
                  () => ativarProvedor("openai", v),
                  v ? "OpenAI ativada." : "OpenAI desativada.",
                )
              }
              rotulo="Ativar OpenAI"
            />
          </div>
        </div>
      </section>

      <section className={CARD} aria-label="Anthropic">
        <CabecalhoProvedor
          titulo="Anthropic (Claude)"
          subtitulo="Integração existente — preservada."
          p={claude}
        />
        <div className="space-y-4 p-6">
          <dl className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <dt className="text-muted-foreground">Chave</dt>
              <dd className="font-mono">
                {claude?.chave.configurada
                  ? (claude.chave.mascarada ?? `definida via ${claude.chave.origem}`)
                  : "Não configurada"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Gerenciamento da chave</dt>
              <dd>Chaves e integrações (Configurações)</dd>
            </div>
          </dl>
          <div className="flex items-center justify-between border-t border-border/70 pt-4">
            <div>
              <p className="text-sm font-medium">Provedor ativo</p>
              <p className="text-[11px] text-muted-foreground">
                Não pode ser desativado enquanto for o provedor do CEO ou o fallback.
              </p>
            </div>
            <Interruptor
              marcado={claude?.ativo === true}
              desabilitado={!!ocupado}
              aoMudar={(v) =>
                void rodar(
                  "ativar-anthropic",
                  () => ativarProvedor("anthropic", v),
                  v ? "Anthropic ativada." : "Anthropic desativada.",
                )
              }
              rotulo="Ativar Anthropic"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function CabecalhoProvedor({
  titulo,
  subtitulo,
  p,
}: {
  titulo: string;
  subtitulo: string;
  p: ProvedorEstado | undefined;
}) {
  const st = ROTULO_CONEXAO[p?.conexao_status ?? "nao_configurado"];
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/70 px-6 py-4">
      <div>
        <h3 className="font-serif text-lg leading-tight">{titulo}</h3>
        <p className="text-[11px] text-muted-foreground">{subtitulo}</p>
      </div>
      <div className="flex items-center gap-1.5">
        <Pilula tom={st.tom}>{st.rotulo}</Pilula>
        <Pilula tom={p?.ativo ? "ok" : "neutro"}>{p?.ativo ? "Ativo" : "Desativado"}</Pilula>
      </div>
    </div>
  );
}

function Interruptor({
  marcado,
  aoMudar,
  desabilitado,
  rotulo,
}: {
  marcado: boolean;
  aoMudar: (v: boolean) => void;
  desabilitado?: boolean;
  rotulo: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={marcado}
      aria-label={rotulo}
      disabled={desabilitado}
      onClick={() => aoMudar(!marcado)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${marcado ? "bg-gold" : "bg-input"} ${desabilitado ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform ${marcado ? "translate-x-[22px]" : "translate-x-0.5"}`}
      />
    </button>
  );
}

/* ───────────────────────────── Modelos ───────────────────────────── */

function AbaModelos({ central, aoMudar }: { central: Disponivel; aoMudar: () => Promise<void> }) {
  const modelos = useMemo(() => ordenarModelos(central.modelos), [central.modelos]);
  const emUso = useMemo(() => {
    const c = central.config;
    return new Set<string>(
      [
        c.modelo_ceo,
        c.modelo_padrao,
        c.fallback_modelo,
        ...Object.values(c.modelos_por_papel ?? {}),
      ].filter((x): x is string => !!x),
    );
  }, [central.config]);

  if (modelos.length === 0)
    return (
      <p className={`${CARD} p-6 text-sm text-muted-foreground`}>
        Nenhum modelo cadastrado. Valide a chave da OpenAI para listar os modelos compatíveis.
      </p>
    );
  return (
    <div className={CARD}>
      <div className="border-b border-border/70 px-6 py-4">
        <h3 className="font-serif text-lg">Modelos & preços</h3>
        <p className="text-[11px] text-muted-foreground">
          A lista vem do provedor (validada por capacidade: texto + chamada de ferramentas). Os
          preços por 1M de tokens são informados por você — sem preço, o modelo não roda (o teto não
          poderia ser respeitado).
        </p>
      </div>
      <div className="divide-y divide-border/70">
        {modelos.map((m) => (
          <LinhaModelo key={m.id} m={m} emUso={emUso.has(m.id)} aoMudar={aoMudar} />
        ))}
      </div>
    </div>
  );
}

function LinhaModelo({
  m,
  emUso,
  aoMudar,
}: {
  m: ModeloLinha;
  emUso: boolean;
  aoMudar: () => Promise<void>;
}) {
  const [entrada, setEntrada] = useState(m.usd_in_mtok === null ? "" : String(m.usd_in_mtok));
  const [saida, setSaida] = useState(m.usd_out_mtok === null ? "" : String(m.usd_out_mtok));
  const [ocupado, setOcupado] = useState(false);
  const precos = validarPrecos(entrada, saida);

  const salvar = async (ativo: boolean) => {
    if (ativo && !precos.ok) return toast.error(precos.erro);
    setOcupado(true);
    await executar(
      () =>
        salvarModeloIa({
          id: m.id,
          ativo,
          usd_in_mtok: precos.ok ? precos.usdIn : null,
          usd_out_mtok: precos.ok ? precos.usdOut : null,
        }),
      ativo ? "Modelo ativado." : "Modelo salvo.",
      aoMudar,
    );
    setOcupado(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 px-6 py-3">
      <div className="min-w-[200px] flex-1">
        <p className="flex items-center gap-2 font-mono text-sm font-semibold">
          {m.id}
          <Pilula tom="neutro">{m.provider === "openai" ? "OpenAI" : "Claude"}</Pilula>
          {m.ativo && <Pilula tom="ok">Ativo</Pilula>}
          {emUso && <Pilula tom="aviso">Em uso</Pilula>}
        </p>
      </div>
      <label className="text-[11px] text-muted-foreground">
        Entrada US$/1M
        <input
          className={`${INPUT} mt-1 w-28`}
          inputMode="decimal"
          value={entrada}
          onChange={(e) => setEntrada(e.target.value)}
        />
      </label>
      <label className="text-[11px] text-muted-foreground">
        Saída US$/1M
        <input
          className={`${INPUT} mt-1 w-28`}
          inputMode="decimal"
          value={saida}
          onChange={(e) => setSaida(e.target.value)}
        />
      </label>
      <div className="flex items-center gap-2">
        <button className={BTN} disabled={ocupado} onClick={() => void salvar(m.ativo)}>
          {ocupado ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Salvar preço"}
        </button>
        <Interruptor
          marcado={m.ativo}
          desabilitado={ocupado || (!m.ativo && !precos.ok)}
          aoMudar={(v) => void salvar(v)}
          rotulo={`Ativar ${m.id}`}
        />
      </div>
    </div>
  );
}

/* ───────────────────────────── Limites & fallback ───────────────────────────── */

function AbaLimites({ central, aoMudar }: { central: Disponivel; aoMudar: () => Promise<void> }) {
  const c = central.config;
  const permitidos = central.modelos.filter((m) => central.modelos_permitidos.includes(m.id));
  const [f, setF] = useState<ConfigIa>({
    ...c,
    modelos_por_papel: { ...(c.modelos_por_papel ?? {}) },
  });
  const [ocupado, setOcupado] = useState(false);
  const doProvedor = (p: ProvedorId | null) => permitidos.filter((m) => m.provider === p);

  const salvar = async () => {
    setOcupado(true);
    await executar(
      () =>
        salvarConfigIa({
          provedor_ceo: f.provedor_ceo,
          modelo_ceo: f.modelo_ceo,
          modelo_padrao: f.modelo_padrao,
          modelos_por_papel: f.modelos_por_papel,
          fallback_provider: f.fallback_provider,
          fallback_modelo: f.fallback_modelo,
          teto_org_dia_usd: Number(f.teto_org_dia_usd),
          teto_org_mes_usd: Number(f.teto_org_mes_usd),
        }),
      "Configuração salva.",
      aoMudar,
    );
    setOcupado(false);
  };

  const Opcoes = ({ lista }: { lista: ModeloLinha[] }) => (
    <>
      <option value="">— nenhum —</option>
      {lista.map((m) => (
        <option key={m.id} value={m.id}>
          {m.id} ({formatarUsdCurto(m.usd_in_mtok)}/{formatarUsdCurto(m.usd_out_mtok)})
        </option>
      ))}
    </>
  );

  return (
    <div className="space-y-5">
      <div className={`${CARD} grid gap-5 p-6 sm:grid-cols-2`}>
        <h3 className="font-serif text-lg sm:col-span-2">CEO Mestre e modelos</h3>
        <label className="text-[13px] font-medium">
          Provedor do CEO
          <select
            className={`${INPUT} mt-1.5`}
            value={f.provedor_ceo}
            onChange={(e) =>
              setF({ ...f, provedor_ceo: e.target.value as ProvedorId, modelo_ceo: null })
            }
          >
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic (Claude)</option>
          </select>
        </label>
        <label className="text-[13px] font-medium">
          Modelo do CEO Mestre (mais potente)
          <select
            className={`${INPUT} mt-1.5`}
            value={f.modelo_ceo ?? ""}
            onChange={(e) => setF({ ...f, modelo_ceo: e.target.value || null })}
          >
            <Opcoes lista={doProvedor(f.provedor_ceo)} />
          </select>
        </label>
        <label className="text-[13px] font-medium sm:col-span-2">
          Modelo padrão (tarefas simples e econômicas)
          <select
            className={`${INPUT} mt-1.5`}
            value={f.modelo_padrao ?? ""}
            onChange={(e) => setF({ ...f, modelo_padrao: e.target.value || null })}
          >
            <Opcoes lista={permitidos} />
          </select>
        </label>
        <div className="sm:col-span-2">
          <p className="mb-2 text-[13px] font-medium">Modelo por tipo de agente</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {PAPEIS.map((papel) => (
              <label key={papel} className="text-[11px] text-muted-foreground">
                {ROTULO_PAPEL[papel]}
                <select
                  className={`${INPUT} mt-1`}
                  value={f.modelos_por_papel[papel] ?? ""}
                  onChange={(e) => {
                    const novo = { ...f.modelos_por_papel };
                    if (e.target.value) novo[papel] = e.target.value;
                    else delete novo[papel];
                    setF({ ...f, modelos_por_papel: novo });
                  }}
                >
                  <Opcoes lista={permitidos} />
                </select>
              </label>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Vale para agentes criados DEPOIS desta configuração; agentes existentes mantêm o modelo
            que o administrador da organização escolheu.
          </p>
        </div>
      </div>

      <div className={`${CARD} grid gap-5 p-6 sm:grid-cols-2`}>
        <h3 className="font-serif text-lg sm:col-span-2">Fallback autorizado</h3>
        <label className="text-[13px] font-medium">
          Provedor de fallback
          <select
            className={`${INPUT} mt-1.5`}
            value={f.fallback_provider ?? ""}
            onChange={(e) =>
              setF({
                ...f,
                fallback_provider: (e.target.value || null) as ProvedorId | null,
                fallback_modelo: null,
              })
            }
          >
            <option value="">— sem fallback —</option>
            {(["openai", "anthropic"] as const)
              .filter((p) => p !== f.provedor_ceo)
              .map((p) => (
                <option key={p} value={p}>
                  {p === "openai" ? "OpenAI" : "Anthropic (Claude)"}
                </option>
              ))}
          </select>
        </label>
        <label className="text-[13px] font-medium">
          Modelo de fallback
          <select
            className={`${INPUT} mt-1.5`}
            disabled={!f.fallback_provider}
            value={f.fallback_modelo ?? ""}
            onChange={(e) => setF({ ...f, fallback_modelo: e.target.value || null })}
          >
            <Opcoes lista={doProvedor(f.fallback_provider)} />
          </select>
        </label>
        <p className="text-[11px] leading-snug text-muted-foreground sm:col-span-2">
          O fallback só entra em falha transitória (rede, 429, 5xx), nunca em erro de configuração,
          e só se o custo máximo do modelo alternativo não exceder o do principal. Cada uso fica no
          log.
        </p>
      </div>

      <div className={`${CARD} grid gap-5 p-6 sm:grid-cols-2`}>
        <h3 className="font-serif text-lg sm:col-span-2">Teto agregado por organização (padrão)</h3>
        <label className="text-[13px] font-medium">
          Por dia (US$)
          <input
            className={`${INPUT} mt-1.5`}
            inputMode="decimal"
            value={String(f.teto_org_dia_usd)}
            onChange={(e) => setF({ ...f, teto_org_dia_usd: e.target.value as unknown as number })}
          />
        </label>
        <label className="text-[13px] font-medium">
          Por mês (US$)
          <input
            className={`${INPUT} mt-1.5`}
            inputMode="decimal"
            value={String(f.teto_org_mes_usd)}
            onChange={(e) => setF({ ...f, teto_org_mes_usd: e.target.value as unknown as number })}
          />
        </label>
        <p className="text-[11px] leading-snug text-muted-foreground sm:col-span-2">
          Soma de todos os agentes e operações da organização, imposta no backend além do teto por
          agente (que permanece: até US$ 0,50/dia e US$ 5/mês por padrão). Nenhum teto por agente é
          alterado aqui.
        </p>
      </div>

      <div className="flex justify-end">
        <button className={BTN_GOLD} disabled={ocupado} onClick={() => void salvar()}>
          {ocupado ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Salvar configuração"}
        </button>
      </div>
    </div>
  );
}

/* ───────────────────────────── Consumo ───────────────────────────── */

function AbaConsumo({ central }: { central: Disponivel }) {
  const total = central.consumo.reduce((a, c) => a + Number(c.custo_usd), 0);
  return (
    <div className={CARD}>
      <div className="border-b border-border/70 px-6 py-4">
        <h3 className="font-serif text-lg">Consumo por modelo — últimos 30 dias</h3>
        <p className="text-[11px] text-muted-foreground">
          Execuções registradas dos agentes (tokens e custo calculados com os preços acima). Total:{" "}
          <strong className="text-foreground">{formatarUsdCurto(total)}</strong>
        </p>
      </div>
      {central.consumo.length === 0 ? (
        <p className="p-6 text-sm text-muted-foreground">Nenhuma execução registrada no período.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] uppercase tracking-wide text-muted-foreground">
              <tr>
                {["Modelo", "Execuções", "Falhas", "Tokens entrada", "Tokens saída", "Custo"].map(
                  (h) => (
                    <th key={h} className="px-6 py-2 font-medium">
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {central.consumo.map((c) => (
                <tr key={c.modelo}>
                  <td className="px-6 py-2 font-mono">{c.modelo}</td>
                  <td className="px-6 py-2">{c.execucoes}</td>
                  <td className={`px-6 py-2 ${c.falhas > 0 ? "text-destructive" : ""}`}>
                    {c.falhas}
                  </td>
                  <td className="px-6 py-2">{Number(c.tokens_in).toLocaleString("pt-BR")}</td>
                  <td className="px-6 py-2">{Number(c.tokens_out).toLocaleString("pt-BR")}</td>
                  <td className="px-6 py-2 font-semibold">{formatarUsdCurto(c.custo_usd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────────── Organizações ───────────────────────────── */

function AbaOrgs({ central, aoMudar }: { central: Disponivel; aoMudar: () => Promise<void> }) {
  const [edicao, setEdicao] = useState<{ id: string; dia: string; mes: string } | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const orgs = central.visao_orgs;

  const salvar = async (id: string, dia: number | null, mes: number | null) => {
    setOcupado(true);
    await executar(() => salvarOrcamentoOrg(id, dia, mes), "Teto da organização salvo.", aoMudar);
    setOcupado(false);
    setEdicao(null);
  };

  return (
    <div className={CARD}>
      <div className="border-b border-border/70 px-6 py-4">
        <h3 className="font-serif text-lg">Organizações com agentes</h3>
        <p className="text-[11px] text-muted-foreground">
          Estado, consumo, falhas e limites. Somente metadados operacionais — sem conversas, memória
          ou conteúdo de tarefas.
        </p>
      </div>
      {orgs.length === 0 ? (
        <p className="p-6 text-sm text-muted-foreground">
          Nenhuma organização criou agentes ainda.
        </p>
      ) : (
        <div className="divide-y divide-border/70">
          {orgs.map((o) => {
            const alerta = alertaDeConsumo(o.custo_dia_usd, o.teto_dia_usd);
            const alertaMes = alertaDeConsumo(o.custo_mes_usd, o.teto_mes_usd);
            const pior =
              alerta === "bloqueado" || alertaMes === "bloqueado"
                ? "bloqueado"
                : alerta === "aviso" || alertaMes === "aviso"
                  ? "aviso"
                  : "ok";
            const ed = edicao?.id === o.org_id ? edicao : null;
            return (
              <div key={o.org_id} className="space-y-2 px-6 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                    {o.org_nome ?? o.org_id.slice(0, 8)}
                    <Pilula tom={o.ceo_estado === "ativo" ? "ok" : "neutro"}>
                      CEO: {o.ceo_estado ?? "não criado"}
                    </Pilula>
                    {o.ceo_kill_switch && <Pilula tom="erro">Kill-switch</Pilula>}
                    {pior === "aviso" && <Pilula tom="aviso">≥ 80% do teto</Pilula>}
                    {pior === "bloqueado" && <Pilula tom="erro">Teto atingido</Pilula>}
                  </p>
                  <button
                    className={BTN}
                    onClick={() =>
                      setEdicao(
                        ed
                          ? null
                          : {
                              id: o.org_id,
                              dia: String(o.teto_dia_usd),
                              mes: String(o.teto_mes_usd),
                            },
                      )
                    }
                  >
                    Ajustar teto
                  </button>
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-muted-foreground sm:grid-cols-4">
                  <div>
                    Modelo do CEO:{" "}
                    <b className="font-mono text-foreground">{o.ceo_modelo ?? "—"}</b>
                  </div>
                  <div>
                    Agentes:{" "}
                    <b className="text-foreground">
                      {o.agentes_ativos} ativos / {o.agentes_pausados} pausados / {o.agentes} total
                    </b>
                  </div>
                  <div>
                    Ferramentas habilitadas:{" "}
                    <b className="text-foreground">{o.ferramentas_habilitadas}</b>
                  </div>
                  <div>
                    Operações ativas: <b className="text-foreground">{o.operacoes_ativas}</b>
                  </div>
                  <div>
                    Execuções 7d: <b className="text-foreground">{o.execucoes_7d}</b>
                  </div>
                  <div>
                    Falhas 7d:{" "}
                    <b className={o.falhas_7d > 0 ? "text-destructive" : "text-foreground"}>
                      {o.falhas_7d}
                    </b>
                  </div>
                  <div>
                    Aprovações:{" "}
                    <b className="text-foreground">
                      {o.aprovacoes_pendentes} pendentes / {o.aprovacoes_decididas} decididas
                    </b>
                  </div>
                </dl>
                <Barra rotulo="Dia" gasto={o.custo_dia_usd} teto={o.teto_dia_usd} />
                <Barra rotulo="Mês" gasto={o.custo_mes_usd} teto={o.teto_mes_usd} />
                {ed && (
                  <div className="flex flex-wrap items-end gap-2 rounded-xl border border-border bg-secondary/30 p-3">
                    <label className="text-[11px] text-muted-foreground">
                      Dia (US$)
                      <input
                        className={`${INPUT} mt-1 w-28`}
                        inputMode="decimal"
                        value={ed.dia}
                        onChange={(e) => setEdicao({ ...ed, dia: e.target.value })}
                      />
                    </label>
                    <label className="text-[11px] text-muted-foreground">
                      Mês (US$)
                      <input
                        className={`${INPUT} mt-1 w-28`}
                        inputMode="decimal"
                        value={ed.mes}
                        onChange={(e) => setEdicao({ ...ed, mes: e.target.value })}
                      />
                    </label>
                    <button
                      className={BTN_GOLD}
                      disabled={ocupado}
                      onClick={() =>
                        void salvar(
                          o.org_id,
                          Number(ed.dia.replace(",", ".")),
                          Number(ed.mes.replace(",", ".")),
                        )
                      }
                    >
                      Salvar
                    </button>
                    <button
                      className={BTN}
                      disabled={ocupado}
                      onClick={() => void salvar(o.org_id, null, null)}
                    >
                      Voltar ao padrão
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Barra({ rotulo, gasto, teto }: { rotulo: string; gasto: number; teto: number }) {
  const pct = percentualDoTeto(gasto, teto);
  const a = alertaDeConsumo(gasto, teto);
  return (
    <div className="flex items-center gap-3 text-[11px]">
      <span className="w-8 text-muted-foreground">{rotulo}</span>
      <div
        className="h-2 flex-1 overflow-hidden rounded-full bg-secondary"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Consumo ${rotulo}`}
      >
        <div
          className={`h-full ${a === "bloqueado" ? "bg-destructive" : a === "aviso" ? "bg-gold" : "bg-[#16A34A]"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-44 text-right text-muted-foreground">
        {formatarUsdCurto(gasto)} de {formatarUsdCurto(teto)}
      </span>
    </div>
  );
}

/* ───────────────────────────── Logs ───────────────────────────── */

const TIPO_EVENTO: Record<string, string> = {
  chave_configurada: "Chave configurada",
  chave_revogada: "Chave revogada",
  conexao_testada: "Conexão testada",
  modelos_sincronizados: "Modelos sincronizados",
  config_alterada: "Configuração alterada",
  chamada_falhou: "Chamada falhou",
  fallback_usado: "Fallback usado",
  limite_atingido: "Limite atingido",
};

function AbaLogs({ central }: { central: Disponivel }) {
  return (
    <div className={CARD}>
      <div className="border-b border-border/70 px-6 py-4">
        <h3 className="font-serif text-lg">Erros & logs</h3>
        <p className="text-[11px] text-muted-foreground">
          Eventos da infraestrutura de IA (últimos 50). Mensagens passam por remoção de segredos
          antes de serem gravadas.
        </p>
      </div>
      {central.eventos.length === 0 ? (
        <p className="p-6 text-sm text-muted-foreground">Nenhum evento registrado.</p>
      ) : (
        <div className="divide-y divide-border/70">
          {central.eventos.map((e) => (
            <div
              key={e.id}
              className="flex flex-wrap items-center justify-between gap-2 px-6 py-2.5 text-xs"
            >
              <span className="flex flex-wrap items-center gap-2">
                <Pilula
                  tom={
                    e.tipo === "chamada_falhou" || e.tipo === "limite_atingido"
                      ? "erro"
                      : e.tipo === "fallback_usado"
                        ? "aviso"
                        : "neutro"
                  }
                >
                  {TIPO_EVENTO[e.tipo] ?? e.tipo}
                </Pilula>
                {e.provider && <span className="font-mono">{e.provider}</span>}
                {e.modelo && <span className="font-mono text-muted-foreground">{e.modelo}</span>}
                {e.detalhe && <span className="text-muted-foreground">{e.detalhe}</span>}
              </span>
              <span className="text-muted-foreground">
                {new Date(e.criado_em).toLocaleString("pt-BR")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
