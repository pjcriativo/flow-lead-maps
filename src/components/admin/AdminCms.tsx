// Tela CONTEÚDOS DO SITE (CMS da landing) — edita só os campos que REALMENTE aparecem em
// / e /pricing hoje (site_conteudo). Vazio = usa o padrão hardcoded no componente.
import { useEffect, useState } from "react";
import { Globe, Loader2, Save } from "lucide-react";
import { adminAcao } from "@/services/admin";

type Conteudo = {
  hero_badge: string | null;
  hero_titulo: string | null;
  hero_titulo_destaque: string | null;
  hero_subtitulo: string | null;
  hero_cta_primario: string | null;
  hero_cta_secundario: string | null;
  hero_disclaimer: string | null;
  features_titulo: string | null;
  features_subtitulo: string | null;
  cta_final_titulo: string | null;
  cta_final_subtitulo: string | null;
  cta_final_botao: string | null;
  planos_json: unknown[] | null;
  footer_texto: string | null;
};

const VAZIA: Conteudo = {
  hero_badge: null,
  hero_titulo: null,
  hero_titulo_destaque: null,
  hero_subtitulo: null,
  hero_cta_primario: null,
  hero_cta_secundario: null,
  hero_disclaimer: null,
  features_titulo: null,
  features_subtitulo: null,
  cta_final_titulo: null,
  cta_final_subtitulo: null,
  cta_final_botao: null,
  planos_json: null,
  footer_texto: null,
};

function Campo({
  rotulo,
  fonte,
  valor,
  onChange,
  area,
}: {
  rotulo: string;
  fonte: string;
  valor: string;
  onChange: (v: string) => void;
  area?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium">{rotulo}</label>
      {area ? (
        <textarea
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          placeholder="usa o texto padrão do site"
          rows={2}
          className="w-full rounded-md border border-input bg-card px-2 py-1.5 text-sm"
        />
      ) : (
        <input
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          placeholder="usa o texto padrão do site"
          className="h-9 w-full rounded-md border border-input bg-card px-2 text-sm"
        />
      )}
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

export function AdminCms() {
  const [c, setC] = useState<Conteudo>(VAZIA);
  const [planosTexto, setPlanosTexto] = useState("");
  const [erroPlanos, setErroPlanos] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    adminAcao("cms_ler")
      .then((r) => {
        if (r.ok) {
          const conteudo = { ...VAZIA, ...(r.conteudo as Partial<Conteudo>) };
          setC(conteudo);
          setPlanosTexto(conteudo.planos_json ? JSON.stringify(conteudo.planos_json, null, 2) : "");
        } else setErro(String(r.reason ?? "falha ao carregar"));
      })
      .catch((e) => setErro(e instanceof Error ? e.message : "erro"))
      .finally(() => setCarregando(false));
  }, []);

  const campo = (k: keyof Conteudo) => (typeof c[k] === "string" ? (c[k] as string) : "");
  const set = (k: keyof Conteudo) => (v: string) => {
    setOk(false);
    setC((atual) => ({ ...atual, [k]: v }));
  };

  const salvar = async () => {
    setErroPlanos(null);
    let planosParaSalvar: unknown = null;
    if (planosTexto.trim()) {
      try {
        const parsed = JSON.parse(planosTexto);
        if (!Array.isArray(parsed)) throw new Error("precisa ser uma lista (array) de planos");
        planosParaSalvar = parsed;
      } catch (e) {
        setErroPlanos(e instanceof Error ? e.message : "JSON inválido");
        return;
      }
    }
    setSalvando(true);
    setErro(null);
    setOk(false);
    try {
      const r = await adminAcao("cms_salvar", { ...c, planos_json: planosParaSalvar });
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
            <Globe className="h-5 w-5 text-gold" /> Conteúdos do site
          </h2>
          <p className="text-xs text-muted-foreground">
            Textos da landing pública (/) e de preços (/pricing) — vazio = usa o padrão do site.
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
          Salvo. A landing já mostra os novos textos no próximo carregamento.
        </p>
      )}

      <Bloco titulo="Hero (topo da página inicial)">
        <Campo
          rotulo="Selo (badge acima do título)"
          fonte='hoje: "Inteligência de negócios para agências e profissionais modernos"'
          valor={campo("hero_badge")}
          onChange={set("hero_badge")}
        />
        <Campo
          rotulo="Palavra em destaque no título"
          fonte='hoje: "Google Maps"'
          valor={campo("hero_titulo_destaque")}
          onChange={set("hero_titulo_destaque")}
        />
        <div className="sm:col-span-2">
          <Campo
            rotulo="Título"
            fonte="a palavra em destaque acima entra no lugar de {destaque} dentro deste texto"
            valor={campo("hero_titulo")}
            onChange={set("hero_titulo")}
            area
          />
        </div>
        <div className="sm:col-span-2">
          <Campo
            rotulo="Subtítulo"
            fonte="parágrafo logo abaixo do título"
            valor={campo("hero_subtitulo")}
            onChange={set("hero_subtitulo")}
            area
          />
        </div>
        <Campo
          rotulo="Botão principal"
          fonte='hoje: "Começar grátis"'
          valor={campo("hero_cta_primario")}
          onChange={set("hero_cta_primario")}
        />
        <Campo
          rotulo="Botão secundário"
          fonte='hoje: "Ver como funciona"'
          valor={campo("hero_cta_secundario")}
          onChange={set("hero_cta_secundario")}
        />
        <div className="sm:col-span-2">
          <Campo
            rotulo="Texto pequeno abaixo dos botões"
            fonte='hoje: "Sem cartão de crédito · Pesquise 50 empresas por nossa conta"'
            valor={campo("hero_disclaimer")}
            onChange={set("hero_disclaimer")}
          />
        </div>
      </Bloco>

      <Bloco titulo="Seção de benefícios">
        <Campo
          rotulo="Título da seção"
          fonte='hoje: "Tudo que você precisa para pesquisar mercados locais"'
          valor={campo("features_titulo")}
          onChange={set("features_titulo")}
        />
        <Campo
          rotulo="Subtítulo da seção"
          fonte="os 6 cards de benefício (ícone+texto) continuam fixos no código"
          valor={campo("features_subtitulo")}
          onChange={set("features_subtitulo")}
        />
      </Bloco>

      <Bloco titulo="Chamada final (antes do rodapé)">
        <Campo
          rotulo="Título"
          fonte='hoje: "Comece a descobrir empresas hoje"'
          valor={campo("cta_final_titulo")}
          onChange={set("cta_final_titulo")}
        />
        <Campo
          rotulo="Botão"
          fonte='hoje: "Abrir Painel"'
          valor={campo("cta_final_botao")}
          onChange={set("cta_final_botao")}
        />
        <div className="sm:col-span-2">
          <Campo
            rotulo="Subtítulo"
            fonte="texto abaixo do título, acima do botão"
            valor={campo("cta_final_subtitulo")}
            onChange={set("cta_final_subtitulo")}
          />
        </div>
      </Bloco>

      <Bloco titulo="Rodapé">
        <Campo
          rotulo="Texto de copyright"
          fonte='hoje: "© {ano} Flow Leads" — o ano é sempre automático'
          valor={campo("footer_texto")}
          onChange={set("footer_texto")}
        />
      </Bloco>

      <div className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
        <h3 className="mb-1 font-serif text-lg">Planos exibidos em /pricing</h3>
        <p className="mb-3 text-[11px] text-muted-foreground">
          Lista (JSON) dos 4 cards de plano mostrados na página de preços — mesmo formato usado no
          código. Deixe em branco para manter os planos padrão do site.
        </p>
        <textarea
          value={planosTexto}
          onChange={(e) => setPlanosTexto(e.target.value)}
          placeholder='[{"name":"Básico","monthly":19,"yearly":182,"yearlyMonthly":"15,16","blurb":"...","cta":"Começar","features":["300 leads/mês"]}]'
          rows={8}
          className="w-full rounded-md border border-input bg-card px-2 py-1.5 font-mono text-xs"
        />
        {erroPlanos && <p className="mt-1 text-xs text-destructive">JSON inválido: {erroPlanos}</p>}
      </div>
    </div>
  );
}
