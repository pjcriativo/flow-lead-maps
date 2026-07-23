import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Mail,
  Download,
  Zap,
  Search,
  Database,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { FlowLeadsLogo } from "@/components/FlowLeadsLogo";
import { SiteFooter } from "@/components/SiteFooter";
import { EstiloSitePublico } from "@/components/EstiloSitePublico";
import { supabase } from "@/integrations/supabase/client";

// ⚙️ CMS (admin → Conteúdos do site): cada campo abaixo cai no texto PADRÃO daqui se a
// linha/campo não existir em site_conteudo — "não construído" nunca vira tela em branco.
type SiteConteudo = {
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
};
function useConteudo() {
  const [c, setC] = useState<SiteConteudo | null>(null);
  useEffect(() => {
    supabase
      .from("site_conteudo")
      .select(
        "hero_badge, hero_titulo, hero_titulo_destaque, hero_subtitulo, hero_cta_primario, hero_cta_secundario, hero_disclaimer, features_titulo, features_subtitulo, cta_final_titulo, cta_final_subtitulo, cta_final_botao",
      )
      .eq("id", true)
      .maybeSingle()
      .then(({ data }) => setC(data ?? null));
  }, []);
  return c;
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Flow Leads — Descubra empresas locais na hora" },
      {
        name: "description",
        content:
          "Pesquise e descubra empresas locais no Google Maps em segundos. Nomes, telefones, e-mails e sites — exportados direto para Excel ou Google Sheets.",
      },
      { property: "og:title", content: "Flow Leads — Descubra empresas locais na hora" },
      {
        property: "og:description",
        content: "Pesquise e descubra empresas locais no Google Maps em um clique.",
      },
      { property: "og:url", content: "https://flowleads.com.br/" },
      {
        name: "twitter:title",
        content: "Flow Leads — Descubra empresas locais no Google Maps em segundos",
      },
      {
        name: "twitter:description",
        content:
          "Pesquise perfis de empresas locais verificados no Google Maps em segundos. Exporte para Excel ou Google Sheets na hora.",
      },
    ],
    links: [{ rel: "canonical", href: "https://flowleads.com.br/" }],
  }),
  component: Index,
});

const TITULO_PADRAO = "Descubra e pesquise empresas locais no {destaque} em segundos.";
const DESTAQUE_PADRAO = "Google Maps";

function renderHeroTitulo(titulo: string, destaque: string) {
  const partes = titulo.split("{destaque}");
  if (partes.length !== 2) return <>{titulo}</>;
  return (
    <>
      {partes[0]}
      <span className="text-primary">{destaque}</span>
      {partes[1]}
    </>
  );
}

function Index() {
  const conteudo = useConteudo();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <EstiloSitePublico />
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex h-full items-center">
            <FlowLeadsLogo className="h-9 w-auto" />
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">
              Recursos
            </a>
            <a href="#how" className="hover:text-foreground">
              Como funciona
            </a>
            <Link to="/pricing" className="hover:text-foreground">
              Preços
            </Link>
          </nav>
          <Link to="/dashboard" preload="render">
            <Button>
              Começar <ArrowRight />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {conteudo?.hero_badge ||
                "Inteligência de negócios para agências e profissionais modernos"}
            </div>
            <h1 className="text-balance text-5xl font-semibold tracking-tight md:text-6xl">
              {renderHeroTitulo(
                conteudo?.hero_titulo || TITULO_PADRAO,
                conteudo?.hero_titulo_destaque || DESTAQUE_PADRAO,
              )}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              {conteudo?.hero_subtitulo ||
                "Busque qualquer tipo de empresa em qualquer cidade. Tenha nomes, telefones, e-mails, sites e avaliações — exportados para Excel ou Google Sheets em um clique."}
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/dashboard" preload="render">
                <Button size="lg" className="h-12 px-8 text-base shadow-[var(--shadow-elegant)]">
                  {conteudo?.hero_cta_primario || "Começar grátis"} <ArrowRight />
                </Button>
              </Link>
              <a href="#features">
                <Button size="lg" variant="outline" className="h-12 px-8 text-base">
                  {conteudo?.hero_cta_secundario || "Ver como funciona"}
                </Button>
              </a>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              {conteudo?.hero_disclaimer ||
                "Sem cartão de crédito · Pesquise 50 empresas por nossa conta"}
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border bg-card/40 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              {conteudo?.features_titulo || "Tudo que você precisa para pesquisar mercados locais"}
            </h2>
            <p className="mt-3 text-muted-foreground">
              {conteudo?.features_subtitulo ||
                "Feito para agências, fundadores e consultores que precisam de inteligência de negócios rápido."}
            </p>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Search,
                title: "Busca ultra-segmentada",
                desc: "Filtre por tipo de empresa e cidade. Descubra de 10 a 500 perfis de empresas verificados por busca.",
              },
              {
                icon: Mail,
                title: "Localizador de contatos",
                desc: "Ative o localizador para trazer automaticamente e-mails e telefones de empresas listados publicamente.",
              },
              {
                icon: Database,
                title: "Acompanhamento em tempo real",
                desc: "Veja os perfis de empresas carregando em tempo real, com feed de atividade ao vivo e contador.",
              },
              {
                icon: Download,
                title: "Exportação para Excel",
                desc: "Exportação .xlsx em um clique, com todos os campos limpos e formatados para uso imediato.",
              },
              {
                icon: Zap,
                title: "Sincronização com Google Sheets",
                desc: "Envie os resultados direto para uma planilha do Google Sheets que sua equipe já usa — organizados e ordenados automaticamente.",
              },
              {
                icon: CheckCircle2,
                title: "Dados limpos e precisos",
                desc: "Deduplicação e validação inteligentes para manter sua pesquisa precisa e organizada.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-elegant)]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How */}
      <section id="how" className="py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid gap-10 md:grid-cols-3">
            {[
              {
                n: "01",
                t: "Defina sua busca",
                d: "Escolha um tipo de empresa e uma cidade — ex.: clínicas odontológicas em São Paulo ou agências de marketing no Rio de Janeiro.",
              },
              {
                n: "02",
                t: "Clique em Gerar",
                d: "Veja perfis de empresas verificados carregando em tempo real, com contatos, avaliações e sites.",
              },
              {
                n: "03",
                t: "Exporte para onde quiser",
                d: "Baixe como .xlsx ou sincronize direto com seu Google Sheets conectado em um clique.",
              },
            ].map((s) => (
              <div key={s.n}>
                <div className="text-sm font-mono text-primary">{s.n}</div>
                <h3 className="mt-2 text-xl font-semibold">{s.t}</h3>
                <p className="mt-2 text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="pricing" className="px-6 pb-24">
        <div className="mx-auto max-w-5xl rounded-2xl bg-[var(--navy)] p-12 text-center text-[var(--navy-foreground)] shadow-[var(--shadow-card)]">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            {conteudo?.cta_final_titulo || "Comece a descobrir empresas hoje"}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/70">
            {conteudo?.cta_final_subtitulo ||
              "Junte-se a milhares de agências e profissionais que pesquisam mercados locais com o Flow Leads."}
          </p>
          <div className="mt-8">
            <Link to="/dashboard" preload="render">
              <Button
                size="lg"
                className="h-12 bg-white px-8 text-base text-[var(--navy)] hover:bg-white/90"
              >
                {conteudo?.cta_final_botao || "Abrir Painel"} <ArrowRight />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
