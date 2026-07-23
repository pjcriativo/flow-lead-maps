// Tela CONFIGURAÇÕES do painel admin. Só campos que CONTROLAM algo real — cada um lido por
// uma edge/serviço de verdade como override do valor padrão (config_ler/config_salvar em
// admin-acoes, tabela config_plataforma):
//   teto_rodada_usd / teto_mes_usd     ← buscar-redes, redesign-site (teto de gasto de API)
//   dias_validade_site                 ← publicacao.core.ts (validade do site publicado)
//   remetente_nome_padrao/email_padrao ← send-proposal (remetente quando a org não tem o próprio)
//   intervalo_disparo_min/max_seg      ← WaCampanhas.tsx (intervalo padrão entre disparos)
import { useEffect, useState } from "react";
import { Loader2, Save, Settings } from "lucide-react";
import { adminAcao } from "@/services/admin";

type Config = {
  teto_rodada_usd: number | null;
  teto_mes_usd: number | null;
  dias_validade_site: number | null;
  remetente_nome_padrao: string | null;
  remetente_email_padrao: string | null;
  intervalo_disparo_min_seg: number | null;
  intervalo_disparo_max_seg: number | null;
};

const VAZIA: Config = {
  teto_rodada_usd: null,
  teto_mes_usd: null,
  dias_validade_site: null,
  remetente_nome_padrao: null,
  remetente_email_padrao: null,
  intervalo_disparo_min_seg: null,
  intervalo_disparo_max_seg: null,
};

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

export function AdminConfiguracoes() {
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
    cfg[k] === null || cfg[k] === undefined ? "" : String(cfg[k]);
  const set = (k: keyof Config) => (v: string) => {
    setOk(false);
    setCfg((c) => ({ ...c, [k]: v }));
  };

  const salvar = async () => {
    setSalvando(true);
    setErro(null);
    setOk(false);
    try {
      const r = await adminAcao("config_salvar", cfg as Record<string, unknown>);
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
        <div>
          <h2 className="flex items-center gap-2 font-serif text-xl">
            <Settings className="h-5 w-5 text-gold" /> Configurações
          </h2>
          <p className="text-xs text-muted-foreground">
            Só o que controla algo de verdade — vazio = usa o padrão do sistema.
          </p>
        </div>
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
          Salvar
        </button>
      </div>

      {erro && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          Falha: {erro}
        </p>
      )}
      {ok && (
        <p className="rounded-lg border border-green-600/30 bg-green-600/5 p-3 text-sm text-green-700">
          Salvo. Os próximos disparos/rodadas já usam os novos valores.
        </p>
      )}

      <Bloco titulo="Teto de gasto de API">
        <Campo
          rotulo="Teto por rodada (US$)"
          fonte="buscar-redes / redesign-site — trava a rodada se o custo estimado passar disso"
          valor={campo("teto_rodada_usd")}
          onChange={set("teto_rodada_usd")}
          placeholder="padrão do sistema"
          type="number"
        />
        <Campo
          rotulo="Teto por mês (US$)"
          fonte="buscar-redes / redesign-site — trava novas buscas no mês se estourar"
          valor={campo("teto_mes_usd")}
          onChange={set("teto_mes_usd")}
          placeholder="padrão do sistema"
          type="number"
        />
      </Bloco>

      <Bloco titulo="Site publicado">
        <Campo
          rotulo="Validade do site (dias)"
          fonte="publicacao.core.ts — prazo até o site expirar após publicado"
          valor={campo("dias_validade_site")}
          onChange={set("dias_validade_site")}
          placeholder="15 (padrão)"
          type="number"
        />
      </Bloco>

      <Bloco titulo="Remetente padrão de e-mail">
        <Campo
          rotulo="Nome padrão"
          fonte='send-proposal — usado quando a org não cadastrou "Seu nome"'
          valor={campo("remetente_nome_padrao")}
          onChange={set("remetente_nome_padrao")}
          placeholder="Flow Leads"
        />
        <Campo
          rotulo="E-mail padrão"
          fonte="send-proposal — usado quando não há EMAIL_FROM configurado"
          valor={campo("remetente_email_padrao")}
          onChange={set("remetente_email_padrao")}
          placeholder="onboarding@resend.dev"
        />
      </Bloco>

      <Bloco titulo="Intervalo de disparo do WhatsApp">
        <Campo
          rotulo="Intervalo mínimo padrão (segundos)"
          fonte="WaCampanhas.tsx — valor inicial do slider ao abrir uma campanha nova"
          valor={campo("intervalo_disparo_min_seg")}
          onChange={set("intervalo_disparo_min_seg")}
          placeholder="35 (padrão)"
          type="number"
        />
        <Campo
          rotulo="Intervalo máximo absoluto (segundos)"
          fonte="WA_INTERVALO_MAX_ABS — teto que a variação nunca ultrapassa"
          valor={campo("intervalo_disparo_max_seg")}
          onChange={set("intervalo_disparo_max_seg")}
          placeholder="usa o teto do sistema"
          type="number"
        />
      </Bloco>
    </div>
  );
}
