import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Search,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  Minus,
  Linkedin,
  LayoutTemplate,
  Bot,
  Target,
  FileText,
  Zap,
} from "lucide-react";
import { FlowLeadsLogo } from "@/components/FlowLeadsLogo";
import { SiteFooter } from "@/components/SiteFooter";
import { EstiloSitePublico } from "@/components/EstiloSitePublico";
import { supabase } from "@/integrations/supabase/client";

// ⚙️ CMS (admin → Conteúdos do site)
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
      { title: "Flow Leads — A Máquina Definitiva de Prospecção" },
      {
        name: "description",
        content:
          "Transforme sua prospecção com automação no LinkedIn, Instagram, Google Maps e CRM integrado. Construa sites e fature muito mais.",
      },
      { property: "og:title", content: "Flow Leads — Prospecção Automática" },
      {
        property: "og:description",
        content: "Extraia leads, automatize o WhatsApp e feche contratos em uma única plataforma.",
      },
      { property: "og:url", content: "https://flowleads.com.br/" },
    ],
    links: [{ rel: "canonical", href: "https://flowleads.com.br/" }],
  }),
  component: Index,
});

function renderHeroTitulo(titulo: string, destaque: string) {
  const partes = titulo.split("{destaque}");
  if (partes.length !== 2) {
    return (
      <>
        {titulo} <br className="hidden md:block" />
        <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
          {destaque}
        </span>
      </>
    );
  }
  return (
    <>
      {partes[0]}
      <br className="hidden md:block" />
      <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
        {destaque}
      </span>
      {partes[1]}
    </>
  );
}

function Index() {
  const conteudo = useConteudo();
  
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      <EstiloSitePublico />
      
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex h-full items-center">
            <FlowLeadsLogo className="h-9 w-auto" />
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground transition-colors">
              Recursos
            </a>
            <a href="#how" className="hover:text-foreground transition-colors">
              Como funciona
            </a>
            <Link to="/pricing" className="hover:text-foreground transition-colors">
              Preços
            </Link>
          </nav>
          <Link to="/auth" search={{ mode: "signup" }} preload="render">
            <Button className="rounded-full shadow-md font-semibold">
              Começar Agora <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-20 md:pt-32 md:pb-32">
        <div className="absolute inset-0 bg-gradient-to-b from-background to-secondary/30 -z-10" />
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[600px] w-full max-w-[800px] -translate-x-1/2 rounded-full bg-primary/20 opacity-60 blur-[120px]" />
        
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
              <TrendingUp className="h-4 w-4" />
              {conteudo?.hero_badge || "Acelere suas vendas B2B. Gere no mínimo R$ 3.500/mês."}
            </div>
            
            <h1 className="text-balance text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl animate-in fade-in slide-in-from-bottom-6 duration-1000">
              {renderHeroTitulo(
                conteudo?.hero_titulo || "Transforme seu LinkedIn e Maps em uma",
                conteudo?.hero_titulo_destaque || "Máquina de Dinheiro"
              )}
            </h1>
            
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150 fill-mode-both">
              {conteudo?.hero_subtitulo ||
                "Chega de prospecção manual fria e sem respostas. Extraia leads qualificados, crie sites e feche contratos automáticos usando o Flow Leads."}
            </p>
            
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300 fill-mode-both">
              <Link to="/auth" search={{ mode: "signup" }} preload="render" className="w-full sm:w-auto">
                <Button size="lg" className="w-full h-14 px-8 text-lg font-bold shadow-xl shadow-primary/25 transition-transform hover:scale-105 active:scale-95 rounded-full">
                  {conteudo?.hero_cta_primario || "Começar a Faturar Agora"} <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a href="#how" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full h-14 px-8 text-lg bg-background/50 backdrop-blur rounded-full transition-all hover:bg-secondary">
                  {conteudo?.hero_cta_secundario || "Entender o Processo"}
                </Button>
              </a>
            </div>
            
            <p className="mt-8 text-sm text-muted-foreground flex items-center justify-center gap-2 animate-in fade-in duration-1000 delay-500 fill-mode-both">
              <ShieldCheck className="h-4 w-4" /> {conteudo?.hero_disclaimer || "Garantia de eficiência. Teste sem compromisso e sem burocracia."}
            </p>
          </div>
        </div>
      </section>

      {/* Dores & Agitação */}
      <section className="border-y border-border/50 bg-card py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="inline-block rounded-lg bg-destructive/10 px-3 py-1 text-sm font-semibold text-destructive mb-4">
                O Problema
              </div>
              <h2 className="text-3xl font-bold md:text-4xl leading-tight text-balance">
                Ainda perdendo 4 horas por dia caçando clientes manualmente?
              </h2>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                Copiar e colar contatos do Google ou mandar DMs genéricas no Instagram não funciona mais. Você está esgotando sua energia onde não dá lucro.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "Ficar implorando por respostas no LinkedIn e Instagram.",
                  "Não ter previsibilidade de vendas ou fluxo constante de leads.",
                  "Pagar caro em listas de e-mails vazados e totalmente desatualizados."
                ].map((pain, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-muted-foreground">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive mt-0.5">
                      <Minus className="h-4 w-4" />
                    </span>
                    <span className="leading-snug">{pain}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 to-card p-8 md:p-12 shadow-2xl">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg rotate-12">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">A Solução Flow Leads</h3>
              <p className="mt-2 text-muted-foreground">Automatize o trabalho chato e foque em fechar vendas.</p>
              <ul className="mt-8 space-y-5">
                {[
                  "Leads fresquinhos extraídos em tempo real.",
                  "Encontre o decisor direto (LinkedIn/Instagram) com 1 clique.",
                  "Automação completa: do primeiro 'Oi' no Whats até o Pix."
                ].map((sol, idx) => (
                  <li key={idx} className="flex items-start gap-3 font-medium">
                    <CheckCircle2 className="h-6 w-6 shrink-0 text-primary" />
                    <span className="leading-snug">{sol}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Grade de Recursos 3D */}
      <section id="features" className="py-24 relative overflow-hidden bg-background">
        <div className="mx-auto max-w-7xl px-6 perspective-[2000px]">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="text-3xl font-bold md:text-5xl text-balance">
              {conteudo?.features_titulo || "Um arsenal completo para você dominar o mercado"}
            </h2>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              {conteudo?.features_subtitulo || "Tudo que uma agência gasta R$ 2.000/mês para ter, unificado em uma única plataforma inteligente e acessível."}
            </p>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Linkedin,
                title: "Modo LinkedIn & Insta",
                desc: "Invada a rede social mais lucrativa. Extraia contatos B2B de alto calão automaticamente do LinkedIn e Instagram.",
                color: "text-blue-500",
                bg: "bg-blue-500/10",
                borderHover: "hover:border-blue-500/50"
              },
              {
                icon: MapPin,
                title: "Google Maps Extractor",
                desc: "Vire o dono da sua cidade. Liste todas as empresas de um nicho local com telefones reais em apenas 10 segundos.",
                color: "text-red-500",
                bg: "bg-red-500/10",
                borderHover: "hover:border-red-500/50"
              },
              {
                icon: LayoutTemplate,
                title: "Construtor de Sites (PRO)",
                desc: "Crie Landing Pages absurdamente rápidas para capturar clientes, sem depender de WordPress, plugins ou programadores.",
                color: "text-emerald-500",
                bg: "bg-emerald-500/10",
                borderHover: "hover:border-emerald-500/50"
              },
              {
                icon: Bot,
                title: "Automação de WhatsApp",
                desc: "Campanhas em massa. Dispare 500 mensagens de prospecção fria diretamente pro bolso do seu lead e aguarde as respostas.",
                color: "text-green-500",
                bg: "bg-green-500/10",
                borderHover: "hover:border-green-500/50"
              },
              {
                icon: Target,
                title: "CRM e Kanban Visual",
                desc: "Nunca mais esqueça de retornar um lead quente. Arraste e solte seus contatos no pipeline até o fechamento.",
                color: "text-purple-500",
                bg: "bg-purple-500/10",
                borderHover: "hover:border-purple-500/50"
              },
              {
                icon: FileText,
                title: "Contratos Automáticos",
                desc: "Do pitch ao Pix. Gere PDFs de propostas profissionais e contratos com acompanhamento e cobrança financeira.",
                color: "text-amber-500",
                bg: "bg-amber-500/10",
                borderHover: "hover:border-amber-500/50"
              },
            ].map((f) => (
              <div
                key={f.title}
                className={`group relative rounded-3xl border border-border bg-card p-8 shadow-sm transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02] ${f.borderHover} hover:shadow-2xl hover:shadow-primary/10 transform-gpu cursor-default`}
              >
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none" />
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${f.bg} ${f.color} mb-6 transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                  <f.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold tracking-tight">{f.title}</h3>
                <p className="mt-3 text-muted-foreground leading-relaxed relative z-10">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* O Caminho dos R$ 3500 */}
      <section id="how" className="bg-secondary/30 py-24 border-y border-border overflow-hidden">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl font-bold md:text-5xl tracking-tight">Como faturar seus primeiros <span className="text-primary">R$ 3.500?</span></h2>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              A matemática é simples. Se você vender apenas 2 sites ou gerenciar 2 campanhas locais usando o Flow Leads, a ferramenta já se paga por dezenas de meses.
            </p>
          </div>

          <div className="grid gap-16 md:grid-cols-3 relative">
            {/* Linha conectora desktop */}
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-primary/10 via-primary to-primary/10 -z-10" />
            
            {[
              {
                step: "01",
                title: "Extraia o Ouro",
                desc: "Use o extrator de Maps ou LinkedIn para pegar os contatos dos donos de 200 clínicas odontológicas da sua região.",
                icon: Search
              },
              {
                step: "02",
                title: "Abordagem Massiva",
                desc: "Jogue todos no CRM e inicie uma campanha de WhatsApp. Em média, 20 vão responder interessados no seu serviço.",
                icon: Zap
              },
              {
                step: "03",
                title: "Contrato Fechado",
                desc: "Envie a Proposta em PDF direto pela ferramenta. Feche 2 contratos de R$ 1.800. Boom: R$ 3.600 de lucro líquido.",
                icon: CheckCircle2
              }
            ].map((s) => (
               <div key={s.step} className="flex flex-col items-center text-center group">
                 <div className="flex h-24 w-24 items-center justify-center rounded-full border-8 border-background bg-card text-primary shadow-xl transition-all duration-500 group-hover:scale-110 group-hover:shadow-primary/30 group-hover:bg-primary group-hover:text-primary-foreground">
                   <s.icon className="h-10 w-10 transition-transform group-hover:scale-90" />
                 </div>
                 <div className="mt-8 inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-black tracking-widest text-primary">PASSO {s.step}</div>
                 <h3 className="mt-4 text-2xl font-bold">{s.title}</h3>
                 <p className="mt-3 text-muted-foreground leading-relaxed max-w-xs">{s.desc}</p>
               </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 -z-10" />
        <div className="pointer-events-none absolute left-1/2 bottom-0 -z-10 h-[400px] w-full max-w-[800px] -translate-x-1/2 rounded-full bg-primary/20 opacity-40 blur-[100px]" />
        
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-4xl font-black tracking-tight md:text-5xl lg:text-6xl text-balance leading-tight">
            {conteudo?.cta_final_titulo || "O custo da indecisão é continuar quebrado."}
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg md:text-xl text-muted-foreground leading-relaxed">
            {conteudo?.cta_final_subtitulo ||
              "Assuma o controle da sua prospecção hoje. Seus futuros clientes estão a apenas 1 clique de distância."}
          </p>
          <div className="mt-12 flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/auth" search={{ mode: "signup" }} preload="render">
              <Button
                size="lg"
                className="w-full sm:w-auto h-16 px-10 text-xl font-bold shadow-2xl shadow-primary/30 hover:scale-105 transition-transform rounded-full"
              >
                {conteudo?.cta_final_botao || "Quero Acessar Agora"} <ArrowRight className="ml-2 h-6 w-6" />
              </Button>
            </Link>
          </div>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm text-muted-foreground font-medium">
            <span className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-primary" /> Setup imediato</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-primary" /> Cancele quando quiser</span>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
