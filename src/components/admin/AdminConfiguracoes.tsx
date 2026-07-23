// Tela CONFIGURAÇÕES do painel admin — layout de referência (LeadzenAI): 3 colunas
// ("Navegue até" em caixas · conteúdo em cards · "Painel de controle" com toggles), com a
// identidade Flow Leads (navy/gold/Georgia). Cada campo controla algo REAL — o rastro de
// onde cada um é lido está no help text; o que não tem base ainda fica "Em breve" com o
// motivo, nunca decorativo. config_plataforma via config_ler/config_salvar; chaves de API
// via cofre cifrado (chave_salvar — escrita-apenas, o valor nunca volta).
import { useEffect, useState } from "react";
import {
  Settings2,
  ImageIcon,
  Mail,
  KeyRound,
  Target,
  ShieldCheck,
  FileCode2,
  Wrench,
  Puzzle,
  Languages,
  Share2,
  Loader2,
  Save,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { adminAcao } from "@/services/admin";

/* ─────────────────────────────── modelo ─────────────────────────────── */

type Config = {
  // Controle básico
  nome_plataforma: string | null;
  moeda: string | null;
  simbolo_moeda: string | null;
  fuso_horario: string | null;
  cor_base: string | null;
  cor_secundaria: string | null;
  modelo_openai: string | null;
  modelo_ia: string | null;
  max_leads_busca: number | null;
  fonte_leads_padrao: string | null;
  // Limites e operação
  teto_rodada_usd: number | null;
  teto_mes_usd: number | null;
  dias_validade_site: number | null;
  intervalo_disparo_min_seg: number | null;
  intervalo_disparo_max_seg: number | null;
  // Logotipo e Favicon
  logo_url: string | null;
  favicon_url: string | null;
  // E-mail
  remetente_nome_padrao: string | null;
  remetente_email_padrao: string | null;
  // SEO / LGPD / CSS
  seo_titulo: string | null;
  seo_descricao: string | null;
  gdpr_texto: string | null;
  css_personalizado: string | null;
  // Painel de controle
  cadastro_usuario_ativo: boolean;
  termos_condicoes_ativo: boolean;
  modo_manutencao_ativo: boolean;
};

const VAZIA: Config = {
  nome_plataforma: null,
  moeda: null,
  simbolo_moeda: null,
  fuso_horario: null,
  cor_base: null,
  cor_secundaria: null,
  modelo_openai: null,
  modelo_ia: null,
  max_leads_busca: null,
  fonte_leads_padrao: null,
  teto_rodada_usd: null,
  teto_mes_usd: null,
  dias_validade_site: null,
  intervalo_disparo_min_seg: null,
  intervalo_disparo_max_seg: null,
  logo_url: null,
  favicon_url: null,
  remetente_nome_padrao: null,
  remetente_email_padrao: null,
  seo_titulo: null,
  seo_descricao: null,
  gdpr_texto: null,
  css_personalizado: null,
  cadastro_usuario_ativo: true,
  termos_condicoes_ativo: false,
  modo_manutencao_ativo: false,
};

type Secao =
  | "basicas"
  | "logo"
  | "email"
  | "chaves"
  | "seo"
  | "lgpd"
  | "css"
  | "manutencao"
  | "plugins"
  | "idioma"
  | "sociais";

const NAV: { id: Secao; rotulo: string; Icon: typeof Settings2; emBreve?: boolean }[] = [
  { id: "basicas", rotulo: "Configurações básicas", Icon: Settings2 },
  { id: "logo", rotulo: "Logotipo e Favicon", Icon: ImageIcon },
  { id: "email", rotulo: "E-mail e Notificação", Icon: Mail },
  { id: "chaves", rotulo: "Chaves e integrações", Icon: KeyRound },
  { id: "seo", rotulo: "SEO", Icon: Target },
  { id: "lgpd", rotulo: "Política de LGPD", Icon: ShieldCheck },
  { id: "css", rotulo: "CSS personalizado", Icon: FileCode2 },
  { id: "manutencao", rotulo: "Manutenção", Icon: Wrench },
  { id: "plugins", rotulo: "Plugins", Icon: Puzzle, emBreve: true },
  { id: "idioma", rotulo: "Linguagem", Icon: Languages },
  { id: "sociais", rotulo: "Credenciais sociais", Icon: Share2, emBreve: true },
];

const FUSOS = [
  "America/Sao_Paulo",
  "America/Fortaleza",
  "America/Recife",
  "America/Bahia",
  "America/Manaus",
  "America/Cuiaba",
  "America/Rio_Branco",
  "UTC",
];

/* ──────────────────────────── componentes ──────────────────────────── */

function Campo({
  rotulo,
  fonte,
  valor,
  onChange,
  placeholder,
  type = "text",
  obrigatorio,
}: {
  rotulo: string;
  fonte?: string;
  valor: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  obrigatorio?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-medium text-foreground">
        {rotulo}
        {obrigatorio && <span className="ml-0.5 text-gold">*</span>}
      </label>
      <input
        type={type}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-lg border border-input bg-background px-3.5 text-sm shadow-sm transition-all placeholder:text-muted-foreground/60 hover:border-gold/40 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
      />
      {fonte && <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">{fonte}</p>}
    </div>
  );
}

function CampoCor({
  rotulo,
  fonte,
  valor,
  onChange,
}: {
  rotulo: string;
  fonte?: string;
  valor: string;
  onChange: (v: string) => void;
}) {
  const hex = /^#?[0-9a-fA-F]{6}$/.test(valor)
    ? valor.startsWith("#")
      ? valor
      : `#${valor}`
    : "#000000";
  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-medium text-foreground">{rotulo}</label>
      <div className="flex h-11 items-stretch overflow-hidden rounded-lg border border-input bg-background shadow-sm transition-all focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/25 hover:border-gold/40">
        <input
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          placeholder="ex.: 2563EB"
          className="min-w-0 flex-1 bg-transparent px-3.5 text-sm outline-none placeholder:text-muted-foreground/60"
        />
        <label className="relative w-16 shrink-0 cursor-pointer" style={{ backgroundColor: hex }}>
          <input
            type="color"
            value={hex}
            onChange={(e) => onChange(e.target.value.replace("#", ""))}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label={`Escolher ${rotulo}`}
          />
        </label>
      </div>
      {fonte && <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">{fonte}</p>}
    </div>
  );
}

function CampoSelect({
  rotulo,
  fonte,
  valor,
  onChange,
  children,
  obrigatorio,
}: {
  rotulo: string;
  fonte?: string;
  valor: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  obrigatorio?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-medium text-foreground">
        {rotulo}
        {obrigatorio && <span className="ml-0.5 text-gold">*</span>}
      </label>
      <select
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full cursor-pointer rounded-lg border border-input bg-background px-3 text-sm shadow-sm transition-all hover:border-gold/40 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
      >
        {children}
      </select>
      {fonte && <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">{fonte}</p>}
    </div>
  );
}

function CampoArea({
  rotulo,
  fonte,
  valor,
  onChange,
  placeholder,
  linhas = 6,
  mono,
}: {
  rotulo: string;
  fonte?: string;
  valor: string;
  onChange: (v: string) => void;
  placeholder: string;
  linhas?: number;
  mono?: boolean;
}) {
  return (
    <div className="sm:col-span-2">
      <label className="mb-1.5 block text-[13px] font-medium text-foreground">{rotulo}</label>
      <textarea
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={linhas}
        className={`w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm shadow-sm transition-all placeholder:text-muted-foreground/60 hover:border-gold/40 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25 ${mono ? "font-mono text-xs" : ""}`}
      />
      {fonte && <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">{fonte}</p>}
    </div>
  );
}

/** Campo de CHAVE escrita-apenas (cofre): mostra o status mascarado e aceita um valor novo. */
function CampoChaveCofre({
  rotulo,
  fonte,
  status,
  valor,
  onChange,
}: {
  rotulo: string;
  fonte?: string;
  status: { configurada: boolean; ultimos4: string | null } | null;
  valor: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-medium text-foreground">{rotulo}</label>
      <input
        type="password"
        autoComplete="off"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder={
          status?.configurada
            ? `••••••••••••${status.ultimos4 ?? ""} — cole outra para trocar`
            : "cole a chave para configurar"
        }
        className="h-11 w-full rounded-lg border border-input bg-background px-3.5 font-mono text-sm shadow-sm transition-all placeholder:font-sans placeholder:text-muted-foreground/60 hover:border-gold/40 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
      />
      <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
        {status?.configurada ? "Configurada ✓ · " : "Não configurada ✗ · "}
        {fonte}
      </p>
    </div>
  );
}

function CardSecao({
  titulo,
  Icon,
  descricao,
  children,
}: {
  titulo: string;
  Icon: typeof Settings2;
  descricao?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] transition-shadow hover:shadow-lg">
      <div className="flex items-center gap-3 border-b border-border/70 px-6 py-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold/10 text-gold">
          <Icon className="h-4.5 w-4.5" />
        </span>
        <div>
          <h3 className="font-serif text-lg leading-tight">{titulo}</h3>
          {descricao && <p className="text-[11px] text-muted-foreground">{descricao}</p>}
        </div>
      </div>
      <div className="grid gap-5 p-6 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function CardEmBreve({
  titulo,
  Icon,
  motivo,
}: {
  titulo: string;
  Icon: typeof Settings2;
  motivo: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-secondary/20 p-8 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
        <Icon className="h-5 w-5" />
      </span>
      <div className="mt-3 flex items-center justify-center gap-2">
        <h3 className="font-serif text-lg text-muted-foreground">{titulo}</h3>
        <span className="rounded-full border border-gold/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gold">
          Em breve
        </span>
      </div>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        {motivo}
      </p>
    </div>
  );
}

function Toggle({
  rotulo,
  checked,
  onChange,
  disabled,
  motivo,
}: {
  rotulo: string;
  checked: boolean;
  onChange?: (v: boolean) => void;
  disabled?: boolean;
  motivo?: string;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 py-3 ${disabled ? "opacity-45" : ""}`}
      title={motivo}
    >
      <span className="text-sm">{rotulo}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
          checked ? "bg-gold" : "bg-input"
        } ${disabled ? "cursor-not-allowed" : "cursor-pointer hover:opacity-90"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
            checked ? "translate-x-[22px]" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

/* ─────────────── Pool de chaves Apify (rodízio por esgotamento) ─────────────── */

type ChavePoolApify = {
  id: string;
  apelido: string;
  ultimos4: string;
  ordem: number;
  status: "ativa" | "esgotada" | "invalida" | "desativada";
  esgotada_em: string | null;
  ultimo_uso: string | null;
  credito_estimado: number | null;
  gasto_acumulado: number;
};
type AuditoriaPool = { apelido: string; acao: string; alterado_em: string };

const STATUS_POOL: Record<string, { rotulo: string; cls: string }> = {
  ativa: { rotulo: "Ativa", cls: "bg-[#16A34A]/10 text-[#15803D] border-[#16A34A]/30" },
  esgotada: { rotulo: "Esgotada", cls: "bg-gold/10 text-gold border-gold/40" },
  invalida: { rotulo: "Inválida", cls: "bg-destructive/10 text-destructive border-destructive/30" },
  desativada: { rotulo: "Desativada", cls: "bg-secondary text-muted-foreground border-border" },
};

function SecaoPoolApify() {
  const [chaves, setChaves] = useState<ChavePoolApify[] | null>(null);
  const [ativas, setAtivas] = useState(0);
  const [auditoria, setAuditoria] = useState<AuditoriaPool[]>([]);
  const [apelido, setApelido] = useState("");
  const [valor, setValor] = useState("");
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [teste, setTeste] = useState<Record<string, string>>({});

  const carregar = () =>
    adminAcao("apify_pool_listar").then((r) => {
      if (!r.ok) return setChaves([]);
      setChaves((r.chaves as ChavePoolApify[]) ?? []);
      setAtivas(Number(r.ativas ?? 0));
      setAuditoria((r.auditoria as AuditoriaPool[]) ?? []);
    });
  useEffect(() => {
    carregar();
  }, []);

  const acao = async (nome: string, payload: Record<string, unknown>, okMsg?: string) => {
    setOcupado(nome + JSON.stringify(payload));
    try {
      const r = await adminAcao(nome as Parameters<typeof adminAcao>[0], payload);
      if (r.ok) {
        if (okMsg) toast.success(okMsg);
        carregar();
      } else toast.error(`Falha: ${r.reason}`);
      return r;
    } finally {
      setOcupado(null);
    }
  };

  const adicionar = async () => {
    if (!apelido.trim() || valor.trim().length < 8) {
      toast.error("Informe apelido e a chave completa.");
      return;
    }
    const r = await acao(
      "apify_chave_add",
      { apelido: apelido.trim(), valor: valor.trim() },
      "Chave adicionada ao pool.",
    );
    if (r?.ok) {
      setApelido("");
      setValor("");
    }
  };

  const testar = async (c: ChavePoolApify) => {
    setOcupado("testar" + c.id);
    try {
      const r = await adminAcao("apify_chave_testar", { id: c.id });
      if (!r.ok) {
        setTeste((t) => ({ ...t, [c.id]: `falha: ${r.reason}` }));
        return;
      }
      if (r.situacao === "invalida") {
        setTeste((t) => ({ ...t, [c.id]: "chave INVÁLIDA (401) — marcada" }));
      } else {
        setTeste((t) => ({
          ...t,
          [c.id]: `US$ ${Number(r.restante).toFixed(2)} restantes de US$ ${Number(r.max).toFixed(2)} (teste grátis)`,
        }));
      }
      carregar();
    } finally {
      setOcupado(null);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] transition-shadow hover:shadow-lg">
      <div className="flex items-center gap-3 border-b border-border/70 px-6 py-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold/10 text-gold">
          <KeyRound className="h-4.5 w-4.5" />
        </span>
        <div>
          <h3 className="font-serif text-lg leading-tight">Pool de chaves Apify</h3>
          <p className="text-[11px] text-muted-foreground">
            Rodízio automático: esgotou o crédito → a próxima assume na hora, inclusive no meio de
            uma busca. Valores cifrados; esgotada só volta quando você reativar.
          </p>
        </div>
      </div>

      {chaves !== null && chaves.length > 0 && ativas <= 1 && (
        <p className="mx-6 mt-4 flex items-center gap-2 rounded-xl border border-gold/40 bg-gold/10 p-3 text-sm text-foreground">
          <AlertTriangle className="h-4 w-4 shrink-0 text-gold" />
          {ativas === 0
            ? "NENHUMA chave ativa — as buscas via Apify estão PARADAS até cadastrar/reativar uma chave."
            : "Resta apenas 1 chave ativa no pool — cadastre a próxima para o rodízio não parar."}
        </p>
      )}
      {chaves !== null && chaves.length === 0 && (
        <p className="mx-6 mt-4 rounded-xl border border-border bg-secondary/30 p-3 text-[12px] leading-relaxed text-muted-foreground">
          Pool vazio — o sistema usa a chave única do cofre (APIFY_API_TOKEN), sem rodízio. Cadastre
          2+ chaves abaixo para ligar a troca automática por esgotamento.
        </p>
      )}

      <div className="divide-y divide-border/70 px-6">
        {chaves === null && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Carregando…
          </p>
        )}
        {chaves?.map((c, i) => {
          const st = STATUS_POOL[c.status];
          return (
            <div key={c.id} className="py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => acao("apify_chave_ordem", { id: c.id, direcao: "subir" })}
                      disabled={i === 0 || !!ocupado}
                      className="rounded border border-border px-1.5 text-[10px] leading-4 hover:bg-secondary disabled:opacity-30"
                      title="Subir na ordem do rodízio"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => acao("apify_chave_ordem", { id: c.id, direcao: "descer" })}
                      disabled={i === (chaves?.length ?? 0) - 1 || !!ocupado}
                      className="rounded border border-border px-1.5 text-[10px] leading-4 hover:bg-secondary disabled:opacity-30"
                      title="Descer na ordem do rodízio"
                    >
                      ▼
                    </button>
                  </div>
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      <span className="text-muted-foreground">#{i + 1}</span> {c.apelido}
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${st.cls}`}
                      >
                        {st.rotulo}
                      </span>
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      ••••••••{c.ultimos4}
                      {c.credito_estimado != null &&
                        ` · crédito ~US$ ${Number(c.credito_estimado).toFixed(2)}`}
                      {` · gasto acumulado US$ ${Number(c.gasto_acumulado).toFixed(2)}`}
                      {c.ultimo_uso &&
                        ` · último uso ${new Date(c.ultimo_uso).toLocaleDateString("pt-BR")}`}
                      {c.esgotada_em &&
                        ` · esgotou em ${new Date(c.esgotada_em).toLocaleDateString("pt-BR")}`}
                    </p>
                    {teste[c.id] && (
                      <p className="mt-0.5 text-[11px] font-medium text-gold">{teste[c.id]}</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => testar(c)}
                    disabled={!!ocupado}
                    className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:border-gold/50 hover:bg-gold/5 disabled:opacity-50"
                  >
                    {ocupado === "testar" + c.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      "Testar"
                    )}
                  </button>
                  {c.status === "ativa" ? (
                    <>
                      <button
                        onClick={() =>
                          acao(
                            "apify_chave_status",
                            { id: c.id, status: "esgotada" },
                            "Marcada como esgotada.",
                          )
                        }
                        disabled={!!ocupado}
                        className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-secondary disabled:opacity-50"
                      >
                        Marcar esgotada
                      </button>
                      <button
                        onClick={() =>
                          acao(
                            "apify_chave_status",
                            { id: c.id, status: "desativada" },
                            "Desativada.",
                          )
                        }
                        disabled={!!ocupado}
                        className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-secondary disabled:opacity-50"
                      >
                        Desativar
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() =>
                        acao("apify_chave_status", { id: c.id, status: "ativa" }, "Reativada.")
                      }
                      disabled={!!ocupado}
                      className="rounded-lg bg-gold px-2.5 py-1.5 text-xs font-semibold text-navy shadow-sm hover:shadow-md disabled:opacity-50"
                    >
                      Reativar
                    </button>
                  )}
                  <button
                    onClick={() => acao("apify_chave_remove", { id: c.id }, "Removida do pool.")}
                    disabled={!!ocupado}
                    className="rounded-lg border border-destructive/30 px-2.5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/5 disabled:opacity-50"
                  >
                    Remover
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-border/70 p-6 pt-4">
        <p className="mb-2 text-[13px] font-medium">Adicionar chave ao pool</p>
        <div className="flex flex-wrap gap-2">
          <input
            value={apelido}
            onChange={(e) => setApelido(e.target.value)}
            placeholder="Apelido (ex.: conta-bonus-2)"
            className="h-10 min-w-40 flex-1 rounded-lg border border-input bg-background px-3 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
          />
          <input
            type="password"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="Cole a chave (apify_api_…)"
            autoComplete="off"
            className="h-10 min-w-52 flex-[2] rounded-lg border border-input bg-background px-3 font-mono text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
          />
          <button
            onClick={adicionar}
            disabled={!!ocupado || !apelido.trim() || valor.trim().length < 8}
            className="rounded-lg bg-gold px-4 text-xs font-semibold text-navy shadow-sm transition-all hover:shadow-md disabled:opacity-60"
          >
            + Adicionar
          </button>
        </div>
        <button
          onClick={() =>
            acao(
              "apify_chave_importar_secret",
              { apelido: "principal" },
              "Chave do cofre importada pro pool.",
            )
          }
          disabled={!!ocupado}
          className="mt-2 text-[11px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline disabled:opacity-50"
          title="Copia a chave única atual (cofre/secret APIFY_API_TOKEN) para o pool — o valor nunca sai do servidor."
        >
          Importar a chave única atual (cofre) para o pool
        </button>
      </div>

      {auditoria.length > 0 && (
        <div className="border-t border-border/70">
          <p className="px-6 pt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Auditoria do pool
          </p>
          <div className="divide-y divide-border/50 pb-2">
            {auditoria.slice(0, 8).map((a, i) => (
              <div key={i} className="flex items-center justify-between px-6 py-1.5 text-[11px]">
                <span className="font-mono">{a.apelido}</span>
                <span className="text-muted-foreground">
                  {a.acao} · {new Date(a.alterado_em).toLocaleString("pt-BR")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────── Chaves e integrações ─────────────────────── */

type ChaveInfo = {
  nome: string;
  configurada: boolean;
  ultimos4: string | null;
  atualizado_em: string | null;
  atualizado_por: string | null;
};
type AuditoriaItem = { nome: string; alterado_em: string; email: string };

function SecaoChaves({ aoMudar }: { aoMudar: () => void }) {
  const [chaves, setChaves] = useState<ChaveInfo[] | null>(null);
  const [auditoria, setAuditoria] = useState<AuditoriaItem[] | null>(null);
  const [editando, setEditando] = useState<string | null>(null);
  const [valor, setValor] = useState("");
  const [novoNome, setNovoNome] = useState("");
  const [salvando, setSalvando] = useState(false);

  const carregar = () => {
    adminAcao("chaves_listar").then((r) =>
      setChaves(r.ok ? ((r.chaves as ChaveInfo[]) ?? []) : []),
    );
    adminAcao("chaves_auditoria_listar").then((r) =>
      setAuditoria(r.ok ? ((r.auditoria as AuditoriaItem[]) ?? []) : []),
    );
  };
  useEffect(() => {
    carregar();
  }, []);

  const salvar = async (nome: string) => {
    if (!valor.trim()) return;
    setSalvando(true);
    try {
      const r = await adminAcao("chave_salvar", { nome, valor: valor.trim() });
      if (r.ok) {
        toast.success(`Chave ${nome} salva.`);
        setEditando(null);
        setValor("");
        setNovoNome("");
        carregar();
        aoMudar();
      } else toast.error(`Falha ao salvar: ${r.reason}`);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] transition-shadow hover:shadow-lg">
        <div className="flex items-center gap-3 border-b border-border/70 px-6 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold/10 text-gold">
            <KeyRound className="h-4.5 w-4.5" />
          </span>
          <div>
            <h3 className="font-serif text-lg leading-tight">Chaves e integrações</h3>
            <p className="text-[11px] text-muted-foreground">
              Escrita-apenas: o valor completo nunca volta pro navegador. Gravado cifrado (AES-256)
              — trocar = colar outra por cima.
            </p>
          </div>
        </div>
        <div className="divide-y divide-border/70 px-6">
          {chaves === null && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Carregando…
            </p>
          )}
          {chaves?.map((c) => (
            <div key={c.nome} className="py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-sm font-semibold">{c.nome}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {c.configurada ? (
                      <>
                        <span className="font-medium text-[#15803D]">Configurada ✓</span>
                        {" · "}••••••••{c.ultimos4}
                        {c.atualizado_por && ` · por ${c.atualizado_por}`}
                        {c.atualizado_em &&
                          ` em ${new Date(c.atualizado_em).toLocaleDateString("pt-BR")}`}
                      </>
                    ) : (
                      <span className="text-muted-foreground">Não configurada ✗</span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditando(editando === c.nome ? null : c.nome);
                    setValor("");
                  }}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:border-gold/50 hover:bg-gold/5"
                >
                  {c.configurada ? "Trocar" : "Configurar"}
                </button>
              </div>
              {editando === c.nome && (
                <div className="mt-3 flex gap-2">
                  <input
                    type="password"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    placeholder="Cole o novo valor"
                    autoComplete="off"
                    className="h-10 flex-1 rounded-lg border border-input bg-background px-3 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
                  />
                  <button
                    onClick={() => salvar(c.nome)}
                    disabled={salvando || !valor.trim()}
                    className="rounded-lg bg-gold px-4 text-xs font-semibold text-navy shadow-sm transition-all hover:shadow-md disabled:opacity-60"
                  >
                    {salvando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Salvar"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-border/70 p-6 pt-4">
          <div className="flex gap-2">
            <input
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
              placeholder="NOME_DA_NOVA_CHAVE"
              className="h-10 flex-1 rounded-lg border border-input bg-background px-3 font-mono text-xs uppercase focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
            />
            <button
              onClick={() => setEditando(novoNome.trim() ? novoNome.trim().toUpperCase() : null)}
              disabled={!novoNome.trim()}
              className="rounded-lg border border-border px-4 text-xs font-medium transition-colors hover:border-gold/50 hover:bg-gold/5 disabled:opacity-60"
            >
              + Nova chave
            </button>
          </div>
          {editando && !chaves?.some((c) => c.nome === editando) && (
            <div className="mt-2 flex gap-2">
              <input
                type="password"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder={`Valor de ${editando}`}
                autoComplete="off"
                className="h-10 flex-1 rounded-lg border border-input bg-background px-3 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
              />
              <button
                onClick={() => salvar(editando)}
                disabled={salvando || !valor.trim()}
                className="rounded-lg bg-gold px-4 text-xs font-semibold text-navy shadow-sm transition-all hover:shadow-md disabled:opacity-60"
              >
                Salvar
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <h3 className="border-b border-border/70 px-6 py-4 font-serif text-lg">
          Auditoria de troca
        </h3>
        <div className="divide-y divide-border/70">
          {auditoria === null && (
            <p className="p-5 text-center text-sm text-muted-foreground">Carregando…</p>
          )}
          {auditoria?.length === 0 && (
            <p className="p-5 text-center text-sm text-muted-foreground">
              Nenhuma troca registrada ainda.
            </p>
          )}
          {auditoria?.map((a, i) => (
            <div key={i} className="flex items-center justify-between px-6 py-2.5 text-xs">
              <span className="font-mono font-medium">{a.nome}</span>
              <span className="text-muted-foreground">
                {a.email} · {new Date(a.alterado_em).toLocaleString("pt-BR")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────── página ────────────────────────────── */

export function AdminConfiguracoes() {
  const [secao, setSecao] = useState<Secao>("basicas");
  const [cfg, setCfg] = useState<Config>(VAZIA);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  // chaves inline do Controle básico (cofre — escrita-apenas)
  const [statusChaves, setStatusChaves] = useState<Record<string, ChaveInfo>>({});
  const [chaveOpenAi, setChaveOpenAi] = useState("");
  const [chaveApify, setChaveApify] = useState("");
  const [chaveAnthropic, setChaveAnthropic] = useState("");

  const carregarChaves = () => {
    adminAcao("chaves_listar").then((r) => {
      if (!r.ok) return;
      const mapa: Record<string, ChaveInfo> = {};
      for (const c of (r.chaves as ChaveInfo[]) ?? []) mapa[c.nome] = c;
      setStatusChaves(mapa);
    });
  };

  useEffect(() => {
    adminAcao("config_ler")
      .then((r) => {
        if (r.ok) setCfg({ ...VAZIA, ...(r.config as Partial<Config>) });
        else setErro(String(r.reason ?? "falha ao carregar"));
      })
      .catch((e) => setErro(e instanceof Error ? e.message : "erro"))
      .finally(() => setCarregando(false));
    carregarChaves();
  }, []);

  const campo = (k: keyof Config) =>
    typeof cfg[k] === "string" ? (cfg[k] as string) : cfg[k] == null ? "" : String(cfg[k]);
  const set = (k: keyof Config) => (v: string) => setCfg((c) => ({ ...c, [k]: v }));
  const setBool = (k: keyof Config) => (v: boolean) => setCfg((c) => ({ ...c, [k]: v }));

  const salvar = async () => {
    setSalvando(true);
    setErro(null);
    try {
      const r = await adminAcao("config_salvar", cfg as unknown as Record<string, unknown>);
      if (!r.ok) {
        setErro(String(r.detalhe ?? r.reason ?? "falha ao salvar"));
        toast.error("Falha ao salvar as configurações.");
        return;
      }
      // chaves digitadas inline (cofre) — salvas junto no mesmo clique
      const pendentes: [string, string, (v: string) => void][] = [
        ["OPENAI_API_KEY", chaveOpenAi, setChaveOpenAi],
        ["APIFY_API_TOKEN", chaveApify, setChaveApify],
        ["ANTHROPIC_API_KEY", chaveAnthropic, setChaveAnthropic],
      ];
      for (const [nome, valor, limpar] of pendentes) {
        if (valor.trim()) {
          const rc = await adminAcao("chave_salvar", { nome, valor: valor.trim() });
          if (rc.ok) limpar("");
          else toast.error(`Falha ao salvar a chave ${nome}.`);
        }
      }
      carregarChaves();
      toast.success("Alterações salvas.");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "erro");
    } finally {
      setSalvando(false);
    }
  };

  if (carregando) {
    return (
      <p className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
      </p>
    );
  }

  const BotaoSalvar = (
    <button
      onClick={salvar}
      disabled={salvando}
      className="inline-flex h-11 items-center gap-2 rounded-lg bg-gold px-5 text-sm font-semibold text-navy shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:translate-y-0 disabled:opacity-60"
    >
      {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      Salvar alterações
    </button>
  );

  return (
    <div className="space-y-4">
      {/* breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <span>Painel</span>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-semibold text-foreground">Configurações globais</span>
      </nav>

      {erro && (
        <p className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4" /> {erro}
        </p>
      )}

      <div className="grid items-start gap-5 xl:grid-cols-[280px_minmax(0,1fr)_300px]">
        {/* ── Col 1: Navegue até ── */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
          <h2 className="mb-3 px-1 font-serif text-lg">Navegue até</h2>
          <nav className="space-y-2">
            {NAV.map((item) => {
              const ativo = secao === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSecao(item.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm transition-all duration-150 ${
                    ativo
                      ? "border-gold/60 bg-gold/10 font-semibold text-foreground shadow-sm"
                      : "border-border/70 text-foreground/80 hover:border-gold/40 hover:bg-secondary/60 hover:shadow-sm"
                  }`}
                >
                  <item.Icon
                    className={`h-4 w-4 shrink-0 ${ativo ? "text-gold" : "text-muted-foreground"}`}
                  />
                  <span className="flex-1">{item.rotulo}</span>
                  {item.emBreve && (
                    <span className="rounded-full border border-gold/40 px-1.5 py-0.5 text-[9px] font-medium uppercase text-gold">
                      breve
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* ── Col 2: conteúdo da seção ── */}
        <div className="space-y-5">
          {secao === "basicas" && (
            <>
              <CardSecao
                titulo="Controle básico"
                Icon={Settings2}
                descricao="Identidade, moeda, fuso, cores e IA — cada campo diz onde é usado."
              >
                <Campo
                  rotulo="Título do site"
                  obrigatorio
                  fonte='Marca exibida no logo e nas telas — hoje: "Flow Leads"'
                  valor={campo("nome_plataforma")}
                  onChange={set("nome_plataforma")}
                  placeholder="Flow Leads"
                />
                <CampoSelect
                  rotulo="Moeda"
                  obrigatorio
                  fonte="Moeda de referência dos planos"
                  valor={campo("moeda")}
                  onChange={set("moeda")}
                >
                  <option value="">BRL (padrão)</option>
                  <option value="BRL">BRL — Real</option>
                  <option value="USD">USD — Dólar</option>
                  <option value="EUR">EUR — Euro</option>
                </CampoSelect>
                <Campo
                  rotulo="Símbolo da moeda"
                  obrigatorio
                  fonte="Exibido nos preços de /pricing (página pública de planos)"
                  valor={campo("simbolo_moeda")}
                  onChange={set("simbolo_moeda")}
                  placeholder="R$"
                />
                <CampoSelect
                  rotulo="Fuso horário"
                  fonte="Exibição de datas do painel (formatData/formatDataHora)"
                  valor={campo("fuso_horario")}
                  onChange={set("fuso_horario")}
                >
                  <option value="">fuso do navegador (padrão)</option>
                  {FUSOS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </CampoSelect>
                <CampoCor
                  rotulo="Cor base do site"
                  fonte="Vira a variável --primary nas páginas públicas (landing e /pricing)"
                  valor={campo("cor_base")}
                  onChange={set("cor_base")}
                />
                <CampoCor
                  rotulo="Cor secundária do site"
                  fonte="Vira a variável --gold nas páginas públicas"
                  valor={campo("cor_secundaria")}
                  onChange={set("cor_secundaria")}
                />
                <CampoChaveCofre
                  rotulo="Chave da API Anthropic (gerador de sites com IA)"
                  fonte="Cofre cifrado — usada por redesign-site/melhorar-proposta/SDR"
                  status={statusChaves["ANTHROPIC_API_KEY"] ?? null}
                  valor={chaveAnthropic}
                  onChange={setChaveAnthropic}
                />
                <Campo
                  rotulo="Modelo de IA (Anthropic)"
                  fonte="redesign-site — override de ANTHROPIC_MODEL"
                  valor={campo("modelo_ia")}
                  onChange={set("modelo_ia")}
                  placeholder="claude-opus-4-8 (padrão)"
                />
                <CampoChaveCofre
                  rotulo="Chave da API OpenAI (fallback do gerador de IA)"
                  fonte="Cofre cifrado — 2º provedor da cadeia de IA"
                  status={statusChaves["OPENAI_API_KEY"] ?? null}
                  valor={chaveOpenAi}
                  onChange={setChaveOpenAi}
                />
                <Campo
                  rotulo="Modelo OpenAI"
                  fonte="Override de OPENAI_MODEL no fallback de IA"
                  valor={campo("modelo_openai")}
                  onChange={set("modelo_openai")}
                  placeholder="gpt-4o (padrão)"
                />
                <Campo
                  rotulo="Contagem máxima de leads"
                  obrigatorio
                  fonte="search-leads — teto rígido por busca"
                  valor={campo("max_leads_busca")}
                  onChange={set("max_leads_busca")}
                  placeholder="1000 (padrão)"
                  type="number"
                />
                <CampoSelect
                  rotulo="Fonte de leads"
                  fonte="Fonte pré-selecionada ao abrir a tela Buscar"
                  valor={campo("fonte_leads_padrao")}
                  onChange={set("fonte_leads_padrao")}
                >
                  <option value="">OSM (padrão do sistema)</option>
                  <option value="osm">OSM (grátis)</option>
                  <option value="geoapify">Geoapify (grátis)</option>
                  <option value="apify">Apify (pago)</option>
                </CampoSelect>
                <CampoChaveCofre
                  rotulo="Chave Apify (coleta de leads)"
                  fonte="Cofre cifrado — Maps/Instagram/LinkedIn via Apify"
                  status={statusChaves["APIFY_API_TOKEN"] ?? null}
                  valor={chaveApify}
                  onChange={setChaveApify}
                />
              </CardSecao>

              <CardSecao
                titulo="Limites e operação"
                Icon={Wrench}
                descricao="Tetos de gasto e prazos operacionais — todos aplicados no servidor."
              >
                <Campo
                  rotulo="Teto de gasto por rodada (US$)"
                  fonte="buscar-redes / redesign-site — trava a rodada acima disso"
                  valor={campo("teto_rodada_usd")}
                  onChange={set("teto_rodada_usd")}
                  placeholder="padrão do sistema"
                  type="number"
                />
                <Campo
                  rotulo="Teto de gasto por mês (US$)"
                  fonte="buscar-redes / redesign-site — trava novas buscas no mês"
                  valor={campo("teto_mes_usd")}
                  onChange={set("teto_mes_usd")}
                  placeholder="padrão do sistema"
                  type="number"
                />
                <Campo
                  rotulo="Validade do site publicado (dias)"
                  fonte="publicacao.core.ts — prazo até o site expirar"
                  valor={campo("dias_validade_site")}
                  onChange={set("dias_validade_site")}
                  placeholder="15 (padrão)"
                  type="number"
                />
                <Campo
                  rotulo="Intervalo mínimo de disparo (s)"
                  fonte="WaCampanhas — valor inicial do slider de disparo"
                  valor={campo("intervalo_disparo_min_seg")}
                  onChange={set("intervalo_disparo_min_seg")}
                  placeholder="35 (padrão)"
                  type="number"
                />
              </CardSecao>
            </>
          )}

          {secao === "logo" && (
            <CardSecao
              titulo="Logotipo e Favicon"
              Icon={ImageIcon}
              descricao="Troca a marca em todas as telas e o ícone da aba do navegador."
            >
              <Campo
                rotulo="URL do logotipo"
                fonte="FlowLeadsLogo — substitui o SVG padrão por uma imagem"
                valor={campo("logo_url")}
                onChange={set("logo_url")}
                placeholder="https://…/logo.png"
              />
              <Campo
                rotulo="URL do favicon"
                fonte="Ícone da aba do navegador"
                valor={campo("favicon_url")}
                onChange={set("favicon_url")}
                placeholder="https://…/favicon.png"
              />
              {campo("logo_url") && (
                <div className="sm:col-span-2">
                  <p className="mb-2 text-[13px] font-medium">Pré-visualização</p>
                  <div className="flex items-center gap-6 rounded-xl border border-border bg-background p-4">
                    <img
                      src={campo("logo_url")}
                      alt="Pré-visualização do logo"
                      className="h-10 w-auto object-contain"
                    />
                    <div className="rounded-lg bg-navy p-3">
                      <img
                        src={campo("logo_url")}
                        alt="Pré-visualização em fundo escuro"
                        className="h-10 w-auto object-contain"
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardSecao>
          )}

          {secao === "email" && (
            <CardSecao
              titulo="E-mail e Notificação"
              Icon={Mail}
              descricao="Remetente padrão dos envios da plataforma (Resend)."
            >
              <Campo
                rotulo="Nome padrão do remetente"
                fonte='send-proposal / follow-up-cron — quando a org não cadastrou "Seu nome"'
                valor={campo("remetente_nome_padrao")}
                onChange={set("remetente_nome_padrao")}
                placeholder="Flow Leads"
              />
              <Campo
                rotulo="E-mail padrão do remetente"
                fonte="send-proposal / follow-up-cron — quando não há EMAIL_FROM"
                valor={campo("remetente_email_padrao")}
                onChange={set("remetente_email_padrao")}
                placeholder="onboarding@resend.dev"
              />
            </CardSecao>
          )}

          {secao === "chaves" && (
            <div className="space-y-5">
              <SecaoPoolApify />
              <SecaoChaves aoMudar={carregarChaves} />
            </div>
          )}

          {secao === "seo" && (
            <CardSecao
              titulo="SEO"
              Icon={Target}
              descricao="Título e descrição aplicados na landing pública (/)."
            >
              <Campo
                rotulo="Título da página (title)"
                fonte="document.title da landing — o que aparece na aba e no Google"
                valor={campo("seo_titulo")}
                onChange={set("seo_titulo")}
                placeholder="Flow Leads — Encontre leads no Google Maps em segundos"
              />
              <div className="hidden sm:block" />
              <CampoArea
                rotulo="Meta descrição"
                fonte="meta[name=description] da landing — o resumo exibido nos buscadores"
                valor={campo("seo_descricao")}
                onChange={set("seo_descricao")}
                placeholder="Encontre leads de empresas qualificados no Google Maps em segundos…"
                linhas={3}
              />
            </CardSecao>
          )}

          {secao === "lgpd" && (
            <CardSecao
              titulo="Política de LGPD"
              Icon={ShieldCheck}
              descricao="Texto customizado da página pública /privacy — vazio = mantém a política padrão."
            >
              <CampoArea
                rotulo="Texto da política de privacidade"
                fonte="Substitui o corpo padrão de /privacy quando preenchido (texto puro, quebras preservadas)"
                valor={campo("gdpr_texto")}
                onChange={set("gdpr_texto")}
                placeholder="Cole aqui a sua política de privacidade completa…"
                linhas={14}
              />
            </CardSecao>
          )}

          {secao === "css" && (
            <CardSecao
              titulo="CSS personalizado"
              Icon={FileCode2}
              descricao="Injetado como <style> nas páginas públicas (landing e /pricing)."
            >
              <CampoArea
                rotulo="CSS"
                fonte="Aplicado só no site público — o painel mantém a identidade padrão"
                valor={campo("css_personalizado")}
                onChange={set("css_personalizado")}
                placeholder={`/* exemplo */\n.hero-titulo { letter-spacing: -0.02em; }`}
                linhas={12}
                mono
              />
            </CardSecao>
          )}

          {secao === "manutencao" && (
            <CardSecao
              titulo="Manutenção"
              Icon={Wrench}
              descricao="Bloqueia o painel para quem não é super admin — o super admin sempre atravessa."
            >
              <div className="sm:col-span-2">
                <Toggle
                  rotulo="Modo manutenção ativo"
                  checked={cfg.modo_manutencao_ativo}
                  onChange={setBool("modo_manutencao_ativo")}
                />
                <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                  Com o modo ativo, usuários comuns são redirecionados para /manutencao ao acessar
                  qualquer rota autenticada. Lembre de SALVAR para aplicar.
                </p>
              </div>
            </CardSecao>
          )}

          {secao === "plugins" && (
            <CardEmBreve
              titulo="Plugins"
              Icon={Puzzle}
              motivo="O produto ainda não tem arquitetura de extensões/plugins — nenhum plugin existiria de verdade aqui. Esta seção nasce junto com o primeiro plugin real."
            />
          )}

          {secao === "idioma" && (
            <CardSecao titulo="Linguagem" Icon={Languages} descricao="Idioma da plataforma.">
              <CampoSelect rotulo="Idioma ativo" fonte="" valor="pt-BR" onChange={() => {}}>
                <option value="pt-BR">Português (Brasil) — ativo</option>
              </CampoSelect>
              <div className="flex items-end pb-6 text-[11px] leading-snug text-muted-foreground">
                Outros idiomas chegam junto com a infraestrutura de tradução (i18n) — hoje o produto
                é 100% pt-BR, então um seletor com mais opções seria decorativo.
              </div>
            </CardSecao>
          )}

          {secao === "sociais" && (
            <CardEmBreve
              titulo="Credenciais sociais"
              Icon={Share2}
              motivo="Login social (Google/Facebook) não está configurado no projeto — guardar credenciais aqui não ligaria nada. A seção ativa junto com o OAuth social no Supabase Auth."
            />
          )}

          {/* Salvar — fora das seções "Em breve" e Chaves (que salvam na hora) */}
          {secao !== "chaves" && secao !== "plugins" && secao !== "sociais" && (
            <div className="flex justify-end">{BotaoSalvar}</div>
          )}
        </div>

        {/* ── Col 3: Painel de controle ── */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] xl:sticky xl:top-4">
          <h2 className="mb-1 font-serif text-lg">Painel de controle</h2>
          <p className="mb-2 text-[11px] text-muted-foreground">
            Interruptores globais — salvam junto no "Salvar alterações".
          </p>
          <div className="divide-y divide-border/70">
            <Toggle
              rotulo="Cadastro de usuário"
              checked={cfg.cadastro_usuario_ativo}
              onChange={setBool("cadastro_usuario_ativo")}
              motivo="/auth — libera ou esconde o Cadastre-se"
            />
            <Toggle
              rotulo="Verificação de e-mail"
              checked={false}
              disabled
              motivo="Em breve — controlado no projeto Supabase Auth, ainda sem ponte por aqui"
            />
            <Toggle
              rotulo="Notificação por e-mail"
              checked={false}
              disabled
              motivo="Em breve — não há evento transacional que dispare notificação por e-mail hoje"
            />
            <Toggle
              rotulo="Verificação móvel"
              checked={false}
              disabled
              motivo="Em breve — login por telefone não está habilitado no projeto"
            />
            <Toggle
              rotulo="Notificação por SMS"
              checked={false}
              disabled
              motivo="Em breve — nenhum provedor de SMS integrado"
            />
            <Toggle
              rotulo="Termos e Condições"
              checked={cfg.termos_condicoes_ativo}
              onChange={setBool("termos_condicoes_ativo")}
              motivo="/auth — exige aceite antes de criar conta"
            />
            <Toggle
              rotulo="Forçar SSL"
              checked
              disabled
              motivo="Sempre ativo — a Vercel força HTTPS em todo o tráfego (não é desligável)"
            />
            <Toggle
              rotulo="Modo manutenção"
              checked={cfg.modo_manutencao_ativo}
              onChange={setBool("modo_manutencao_ativo")}
              motivo="Bloqueia quem não é super_admin nas rotas autenticadas"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
