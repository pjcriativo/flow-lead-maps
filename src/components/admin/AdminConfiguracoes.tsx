// Tela CONFIGURAÇÕES do painel admin — layout 3 colunas (Navegue até / conteúdo / Painel de
// controle), igual ao print de referência. Só campos que controlam algo real — vazio/"Em
// breve" nunca vira decorativo. config_plataforma (singleton) via config_ler/config_salvar;
// chaves de API via chaves_listar/chave_salvar/chaves_auditoria_listar (cofre cifrado).
import { useEffect, useState } from "react";
import {
  Settings2,
  ImageIcon,
  Mail,
  KeyRound,
  Search as SearchIcon,
  ShieldCheck,
  Wrench,
  Languages,
  Loader2,
  Save,
} from "lucide-react";
import { adminAcao } from "@/services/admin";

type Config = {
  // Configurações básicas
  nome_plataforma: string | null;
  max_leads_busca: number | null;
  fonte_leads_padrao: string | null;
  modelo_ia: string | null;
  teto_rodada_usd: number | null;
  teto_mes_usd: number | null;
  dias_validade_site: number | null;
  intervalo_disparo_min_seg: number | null;
  intervalo_disparo_max_seg: number | null;
  // Logotipo e Favicon
  logo_url: string | null;
  favicon_url: string | null;
  // E-mail e Notificação
  remetente_nome_padrao: string | null;
  remetente_email_padrao: string | null;
  // Painel de controle
  cadastro_usuario_ativo: boolean;
  termos_condicoes_ativo: boolean;
  modo_manutencao_ativo: boolean;
};

const VAZIA: Config = {
  nome_plataforma: null,
  max_leads_busca: null,
  fonte_leads_padrao: null,
  modelo_ia: null,
  teto_rodada_usd: null,
  teto_mes_usd: null,
  dias_validade_site: null,
  intervalo_disparo_min_seg: null,
  intervalo_disparo_max_seg: null,
  logo_url: null,
  favicon_url: null,
  remetente_nome_padrao: null,
  remetente_email_padrao: null,
  cadastro_usuario_ativo: true,
  termos_condicoes_ativo: false,
  modo_manutencao_ativo: false,
};

type Secao = "basicas" | "logo" | "email" | "chaves" | "seo" | "lgpd" | "manutencao" | "idioma";

const NAV: { id: Secao; rotulo: string; Icon: typeof Settings2 }[] = [
  { id: "basicas", rotulo: "Configurações básicas", Icon: Settings2 },
  { id: "logo", rotulo: "Logotipo e Favicon", Icon: ImageIcon },
  { id: "email", rotulo: "E-mail e Notificação", Icon: Mail },
  { id: "chaves", rotulo: "Chaves e integrações", Icon: KeyRound },
  { id: "seo", rotulo: "SEO", Icon: SearchIcon },
  { id: "lgpd", rotulo: "LGPD", Icon: ShieldCheck },
  { id: "manutencao", rotulo: "Manutenção", Icon: Wrench },
  { id: "idioma", rotulo: "Idioma", Icon: Languages },
];

function Campo({
  rotulo,
  fonte,
  valor,
  onChange,
  placeholder,
  type = "text",
}: {
  rotulo: string;
  fonte: string;
  valor: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium">{rotulo}</label>
      <input
        type={type}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-md border border-input bg-card px-2 text-sm"
      />
      <p className="mt-1 text-[11px] text-muted-foreground">{fonte}</p>
    </div>
  );
}

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <h3 className="mb-3 font-serif text-lg">{titulo}</h3>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function EmBreve({ titulo, motivo }: { titulo: string; motivo: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-secondary/20 p-4">
      <div className="flex items-center gap-2">
        <h3 className="font-serif text-lg text-muted-foreground">{titulo}</h3>
        <span className="rounded-full border border-gold/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gold">
          Em breve
        </span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{motivo}</p>
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
    <label
      className={`flex items-center justify-between gap-2 py-2 text-sm ${disabled ? "opacity-50" : ""}`}
      title={motivo}
    >
      <span>{rotulo}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
          checked ? "bg-gold" : "bg-secondary"
        } ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
    </label>
  );
}

// ═══ Chaves e integrações ═══
type ChaveInfo = {
  nome: string;
  configurada: boolean;
  ultimos4: string | null;
  atualizado_em: string | null;
  atualizado_por: string | null;
};
type AuditoriaItem = { nome: string; alterado_em: string; email: string };

function SecaoChaves() {
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
        setEditando(null);
        setValor("");
        setNovoNome("");
        carregar();
      }
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
        <h3 className="mb-1 font-serif text-lg">Chaves e integrações</h3>
        <p className="mb-3 text-[11px] text-muted-foreground">
          Escrita-apenas: o valor completo nunca volta pro navegador. Trocar = colar outra por cima.
          Gravado cifrado (AES-256) — nem o banco guarda o texto puro.
        </p>
        <div className="divide-y divide-border">
          {chaves === null && (
            <p className="py-4 text-center text-sm text-muted-foreground">Carregando…</p>
          )}
          {chaves?.map((c) => (
            <div key={c.nome} className="py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-mono text-sm font-medium">{c.nome}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {c.configurada ? (
                      <>
                        Configurada ✓ — ••••••••{c.ultimos4}
                        {c.atualizado_por && ` · atualizada por ${c.atualizado_por}`}
                        {c.atualizado_em &&
                          ` em ${new Date(c.atualizado_em).toLocaleDateString("pt-BR")}`}
                      </>
                    ) : (
                      "Não configurada ✗"
                    )}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditando(editando === c.nome ? null : c.nome);
                    setValor("");
                  }}
                  className="rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:bg-secondary"
                >
                  {c.configurada ? "Trocar" : "Configurar"}
                </button>
              </div>
              {editando === c.nome && (
                <div className="mt-2 flex gap-2">
                  <input
                    type="password"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    placeholder="Cole o novo valor"
                    autoComplete="off"
                    className="h-9 flex-1 rounded-md border border-input bg-background px-2 text-sm"
                  />
                  <button
                    onClick={() => salvar(c.nome)}
                    disabled={salvando || !valor.trim()}
                    className="rounded-md bg-navy px-3 text-xs font-semibold text-navy-foreground hover:bg-navy/90 disabled:opacity-60"
                  >
                    {salvando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Salvar"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-3 flex gap-2 border-t border-border pt-3">
          <input
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            placeholder="NOME_DA_NOVA_CHAVE"
            className="h-9 flex-1 rounded-md border border-input bg-background px-2 font-mono text-xs uppercase"
          />
          <button
            onClick={() => setEditando(novoNome.trim() ? novoNome.trim().toUpperCase() : null)}
            disabled={!novoNome.trim()}
            className="rounded-md border border-border px-3 text-xs font-medium hover:bg-secondary disabled:opacity-60"
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
              placeholder="Valor da chave"
              autoComplete="off"
              className="h-9 flex-1 rounded-md border border-input bg-background px-2 text-sm"
            />
            <button
              onClick={() => salvar(editando)}
              disabled={salvando || !valor.trim()}
              className="rounded-md bg-navy px-3 text-xs font-semibold text-navy-foreground hover:bg-navy/90 disabled:opacity-60"
            >
              Salvar
            </button>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
        <h3 className="border-b border-border px-4 py-3 font-serif text-lg">Auditoria de troca</h3>
        <div className="divide-y divide-border">
          {auditoria === null && (
            <p className="p-4 text-center text-sm text-muted-foreground">Carregando…</p>
          )}
          {auditoria?.length === 0 && (
            <p className="p-4 text-center text-sm text-muted-foreground">
              Nenhuma troca registrada ainda.
            </p>
          )}
          {auditoria?.map((a, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-2 text-xs">
              <span className="font-mono">{a.nome}</span>
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

export function AdminConfiguracoes() {
  const [secao, setSecao] = useState<Secao>("basicas");
  const [cfg, setCfg] = useState<Config>(VAZIA);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    adminAcao("config_ler")
      .then((r) => {
        if (r.ok) setCfg({ ...VAZIA, ...(r.config as Partial<Config>) });
        else setErro(String(r.reason ?? "falha ao carregar"));
      })
      .catch((e) => setErro(e instanceof Error ? e.message : "erro"))
      .finally(() => setCarregando(false));
  }, []);

  const campo = (k: keyof Config) =>
    typeof cfg[k] === "string" ? (cfg[k] as string) : cfg[k] == null ? "" : String(cfg[k]);
  const set = (k: keyof Config) => (v: string) => {
    setOk(false);
    setCfg((c) => ({ ...c, [k]: v }));
  };
  const setBool = (k: keyof Config) => (v: boolean) => {
    setOk(false);
    setCfg((c) => ({ ...c, [k]: v }));
  };

  const salvar = async () => {
    setSalvando(true);
    setErro(null);
    setOk(false);
    try {
      const r = await adminAcao("config_salvar", cfg as unknown as Record<string, unknown>);
      if (!r.ok) {
        setErro(String(r.detalhe ?? r.reason ?? "falha ao salvar"));
        return;
      }
      setOk(true);
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

  return (
    <div className="grid gap-4 lg:grid-cols-[220px_1fr_260px]">
      {/* Col 1 — Navegue até */}
      <div className="rounded-xl border border-border bg-card p-2 shadow-[var(--shadow-card)]">
        <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Navegue até
        </p>
        <nav className="space-y-0.5">
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => setSecao(item.id)}
              className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors ${
                secao === item.id
                  ? "bg-navy text-navy-foreground"
                  : "text-foreground hover:bg-secondary"
              }`}
            >
              <item.Icon className="h-3.5 w-3.5 shrink-0" />
              {item.rotulo}
            </button>
          ))}
        </nav>
      </div>

      {/* Col 2/3 — conteúdo da seção */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl">Configurações</h2>
          {secao !== "chaves" && (
            <button
              onClick={salvar}
              disabled={salvando}
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-navy px-3 text-xs font-semibold text-navy-foreground hover:bg-navy/90 disabled:opacity-60"
            >
              {salvando ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              Salvar alterações
            </button>
          )}
        </div>

        {erro && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            Falha: {erro}
          </p>
        )}
        {ok && (
          <p className="rounded-lg border border-green-600/30 bg-green-600/5 p-3 text-sm text-green-700">
            Salvo.
          </p>
        )}

        {secao === "basicas" && (
          <div className="space-y-4">
            <Bloco titulo="Identidade">
              <Campo
                rotulo="Nome da plataforma"
                fonte='marca exibida no logo (FlowLeadsLogo) — hoje: "Flow Leads"'
                valor={campo("nome_plataforma")}
                onChange={set("nome_plataforma")}
                placeholder="Flow Leads"
              />
              <Campo
                rotulo="Modelo de IA"
                fonte='redesign-site — override de ANTHROPIC_MODEL (ex.: "claude-sonnet-5")'
                valor={campo("modelo_ia")}
                onChange={set("modelo_ia")}
                placeholder="claude-opus-4-8 (padrão)"
              />
            </Bloco>
            <Bloco titulo="Busca de leads">
              <Campo
                rotulo="Máximo de leads por busca"
                fonte="search-leads — teto rígido no limite pedido pelo usuário"
                valor={campo("max_leads_busca")}
                onChange={set("max_leads_busca")}
                placeholder="1000 (padrão)"
                type="number"
              />
              <div>
                <label className="mb-1 block text-xs font-medium">Fonte de leads padrão</label>
                <select
                  value={campo("fonte_leads_padrao")}
                  onChange={(e) => set("fonte_leads_padrao")(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-card px-2 text-sm"
                >
                  <option value="">padrão do sistema (OSM)</option>
                  <option value="osm">OSM (grátis)</option>
                  <option value="geoapify">Geoapify (grátis)</option>
                  <option value="apify">Apify (pago)</option>
                </select>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  SearchSection — fonte pré-selecionada ao abrir a tela Buscar
                </p>
              </div>
            </Bloco>
            <Bloco titulo="Teto de gasto de API">
              <Campo
                rotulo="Teto por rodada (US$)"
                fonte="buscar-redes / redesign-site"
                valor={campo("teto_rodada_usd")}
                onChange={set("teto_rodada_usd")}
                placeholder="padrão do sistema"
                type="number"
              />
              <Campo
                rotulo="Teto por mês (US$)"
                fonte="buscar-redes / redesign-site"
                valor={campo("teto_mes_usd")}
                onChange={set("teto_mes_usd")}
                placeholder="padrão do sistema"
                type="number"
              />
            </Bloco>
            <Bloco titulo="Site publicado e disparo">
              <Campo
                rotulo="Validade do site (dias)"
                fonte="publicacao.core.ts"
                valor={campo("dias_validade_site")}
                onChange={set("dias_validade_site")}
                placeholder="15 (padrão)"
                type="number"
              />
              <Campo
                rotulo="Intervalo mínimo de disparo (s)"
                fonte="WaCampanhas.tsx"
                valor={campo("intervalo_disparo_min_seg")}
                onChange={set("intervalo_disparo_min_seg")}
                placeholder="35 (padrão)"
                type="number"
              />
            </Bloco>
          </div>
        )}

        {secao === "logo" && (
          <Bloco titulo="Logotipo e Favicon">
            <Campo
              rotulo="URL do logotipo"
              fonte="FlowLeadsLogo — substitui o SVG padrão por uma imagem (todas as telas)"
              valor={campo("logo_url")}
              onChange={set("logo_url")}
              placeholder="https://…/logo.png"
            />
            <Campo
              rotulo="URL do favicon"
              fonte="ícone da aba do navegador"
              valor={campo("favicon_url")}
              onChange={set("favicon_url")}
              placeholder="https://…/favicon.png"
            />
          </Bloco>
        )}

        {secao === "email" && (
          <Bloco titulo="Remetente padrão de e-mail">
            <Campo
              rotulo="Nome padrão"
              fonte='send-proposal / follow-up-cron — usado quando a org não cadastrou "Seu nome"'
              valor={campo("remetente_nome_padrao")}
              onChange={set("remetente_nome_padrao")}
              placeholder="Flow Leads"
            />
            <Campo
              rotulo="E-mail padrão"
              fonte="send-proposal / follow-up-cron — usado quando não há EMAIL_FROM configurado"
              valor={campo("remetente_email_padrao")}
              onChange={set("remetente_email_padrao")}
              placeholder="onboarding@resend.dev"
            />
          </Bloco>
        )}

        {secao === "chaves" && <SecaoChaves />}

        {secao === "seo" && (
          <EmBreve
            titulo="SEO"
            motivo="Os textos de SEO (title/description/og:*) da landing são fixos no código hoje (src/routes/__root.tsx). Editá-los pelo painel exige uma etapa própria de CMS de metadados — nada aqui até essa etapa existir."
          />
        )}

        {secao === "lgpd" && (
          <EmBreve
            titulo="LGPD"
            motivo="A política de privacidade já existe como página pública fixa (/privacy). Um editor de LGPD pelo painel entra junto do CMS de conteúdo estático — não construído ainda."
          />
        )}

        {secao === "manutencao" && (
          <div className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
            <h3 className="mb-2 font-serif text-lg">Modo manutenção</h3>
            <p className="mb-3 text-sm text-muted-foreground">
              Controlado pelo toggle "Modo manutenção" no Painel de controle (coluna à direita).
              Quando ativo, todo usuário que NÃO é super admin é redirecionado para uma tela de
              manutenção ao tentar acessar o painel (/dashboard e rotas autenticadas) — o super
              admin sempre atravessa, para poder desligar de volta.
            </p>
            <Toggle
              rotulo="Modo manutenção ativo"
              checked={cfg.modo_manutencao_ativo}
              onChange={setBool("modo_manutencao_ativo")}
            />
          </div>
        )}

        {secao === "idioma" && (
          <EmBreve
            titulo="Idioma"
            motivo="O produto é 100% pt-BR hoje, sem infraestrutura de tradução (i18n). Um seletor de idioma aqui não mudaria nada de verdade até essa infraestrutura existir — por isso não foi criado."
          />
        )}
      </div>

      {/* Col 4 — Painel de controle */}
      <div className="h-fit rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
        <h3 className="mb-2 font-serif text-lg">Painel de controle</h3>
        <div className="divide-y divide-border">
          <Toggle
            rotulo="Cadastro de usuário"
            checked={cfg.cadastro_usuario_ativo}
            onChange={setBool("cadastro_usuario_ativo")}
            motivo="/auth — libera ou esconde o modo Cadastre-se"
          />
          <Toggle
            rotulo="Verificação de e-mail"
            checked={false}
            disabled
            motivo="Em breve — depende de configuração no projeto Supabase Auth, não deste painel"
          />
          <Toggle
            rotulo="Notificação por e-mail"
            checked={false}
            disabled
            motivo="Em breve — ainda não há um evento transacional que dispare notificação"
          />
          <Toggle
            rotulo="Termos e Condições"
            checked={cfg.termos_condicoes_ativo}
            onChange={setBool("termos_condicoes_ativo")}
            motivo="/auth — exige aceite da checkbox antes de criar conta"
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
  );
}
