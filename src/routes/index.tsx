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
  MousePointerClick,
  Activity,
  BarChart3,
  Briefcase
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
      { title: "Flow Leads — Plataforma de Prospecção B2B" },
      {
        name: "description",
        content:
          "Encontre leads qualificados, gerencie seu pipeline e automatize vendas com a plataforma B2B mais completa do mercado.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const conteudo = useConteudo();
  
  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-primary/20 overflow-x-hidden font-sans">
      <EstiloSitePublico />
      
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex h-full items-center">
            <FlowLeadsLogo className="h-8 w-auto text-primary" />
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a href="#solucao" className="hover:text-primary transition-colors">Plataforma</a>
            <a href="#recursos" className="hover:text-primary transition-colors">Recursos</a>
            <a href="#roi" className="hover:text-primary transition-colors">Retorno (ROI)</a>
            <Link to="/pricing" className="hover:text-primary transition-colors">Planos</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link to="/auth" search={{ mode: "signin" }} preload="render" className="hidden text-sm font-medium text-slate-600 hover:text-primary sm:block">
              Entrar
            </Link>
            <Link to="/auth" search={{ mode: "signup" }} preload="render">
              <Button className="rounded-md h-10 px-6 font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all">
                Começar Grátis
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 1. Hero Section Institucional */}
      <section className="relative pt-24 pb-20 md:pt-32 md:pb-32 bg-slate-50 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-30" />
        
        <div className="mx-auto max-w-7xl px-6 relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary uppercase tracking-wide">
              <Briefcase className="h-3.5 w-3.5" />
              Para Agências e Equipes de Vendas
            </div>
            
            <h1 className="text-balance text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl leading-tight">
              Acelere suas vendas B2B com <br className="hidden md:block"/>
              <span className="text-primary">
                inteligência e automação.
              </span>
            </h1>
            
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
              Pare de gastar horas caçando contatos na internet. Descubra decisores qualificados, gerencie seu pipeline e feche mais negócios utilizando uma plataforma unificada.
            </p>
            
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/auth" search={{ mode: "signup" }} preload="render" className="w-full sm:w-auto">
                <Button size="lg" className="w-full h-12 px-8 text-base font-medium shadow-sm transition-transform hover:scale-105">
                  Iniciar Teste Gratuito
                </Button>
              </Link>
              <a href="#solucao" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full h-12 px-8 text-base font-medium border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition-colors">
                  Conhecer a Plataforma
                </Button>
              </a>
            </div>
            
            <p className="mt-6 text-sm text-slate-500 flex items-center justify-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" /> Sem cartão de crédito · Cancelamento fácil
            </p>
          </div>
        </div>
      </section>

      {/* 2. O Problema (Transição Limpa) */}
      <section className="py-20 bg-white border-y border-slate-100">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 leading-tight">
                A prospecção manual está custando caro para o seu negócio.
              </h2>
              <p className="mt-6 text-lg text-slate-600 leading-relaxed">
                Manter sua equipe de vendas (ou você mesmo) preenchendo planilhas e buscando emails desatualizados no Google reduz drasticamente seu tempo de fechamento e sua lucratividade.
              </p>
              
              <div className="mt-8 space-y-6">
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 border border-red-100">
                    <Search className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900">Listas desatualizadas</h4>
                    <p className="mt-1 text-slate-600">Comprar dados defasados resulta em altas taxas de bounce e prejudica a reputação do seu domínio.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600 border border-orange-100">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900">Follow-ups esquecidos</h4>
                    <p className="mt-1 text-slate-600">Sem um pipeline visual automatizado, leads quentes são esquecidos e vendas são perdidas diariamente.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative rounded-2xl bg-slate-50 border border-slate-200 p-8 shadow-sm">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">A Solução B2B Integrada</h3>
              <p className="mt-2 text-slate-600 text-sm">Otimize todo o fluxo de receita.</p>
              <ul className="mt-6 space-y-4">
                {[
                  "Extração de Leads B2B em Tempo Real.",
                  "Enriquecimento de Dados (Email e Telefones).",
                  "CRM Visual com Kanban e Lead Scoring.",
                  "Automação de Contatos e Contratos PDF."
                ].map((sol, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-slate-700 font-medium text-sm">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                    <span>{sol}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Recursos (O Arsenal Limpo) */}
      <section id="recursos" className="py-24 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900">Tudo o que sua equipe precisa</h2>
            <p className="mt-4 text-lg text-slate-600">
              Unificamos as ferramentas essenciais de prospecção, qualificação e fechamento em um único ambiente seguro e performático.
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Linkedin,
                title: "Extrator Avançado (LinkedIn/Insta)",
                desc: "Localize decisores com filtros precisos. Obtenha contatos qualificados diretamente das maiores redes corporativas.",
                color: "text-blue-600",
                bg: "bg-blue-50 border-blue-100"
              },
              {
                icon: MapPin,
                title: "Google Maps Intelligence",
                desc: "Faça varreduras por nicho e região. Capture negócios locais com números de telefone reais para sua equipe de SDR.",
                color: "text-indigo-600",
                bg: "bg-indigo-50 border-indigo-100"
              },
              {
                icon: LayoutTemplate,
                title: "Construtor de Landing Pages",
                desc: "Publique páginas de alta conversão sem código. Capture inbound leads integrados diretamente ao seu CRM.",
                color: "text-emerald-600",
                bg: "bg-emerald-50 border-emerald-100"
              },
              {
                icon: Target,
                title: "Pipeline e Lead Score",
                desc: "Classifique automaticamente o potencial de cada lead. Gerencie o fluxo em um quadro Kanban colaborativo.",
                color: "text-purple-600",
                bg: "bg-purple-50 border-purple-100"
              },
              {
                icon: Bot,
                title: "Automação de WhatsApp",
                desc: "Configure cadências e disparos em massa para reativar contatos frios ou engajar novas listas instantaneamente.",
                color: "text-green-600",
                bg: "bg-green-50 border-green-100"
              },
              {
                icon: FileText,
                title: "Gestão de Propostas e Contratos",
                desc: "Gere documentos em PDF com layout profissional e faça o controle financeiro dos contratos assinados.",
                color: "text-amber-600",
                bg: "bg-amber-50 border-amber-100"
              }
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg border ${f.bg} ${f.color} mb-5`}>
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. O Caminho do ROI */}
      <section id="roi" className="py-24 bg-white border-t border-slate-100">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">Previsibilidade de Receita</h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              Implemente um processo de vendas escalável. Mostramos como profissionais independentes faturam mais de R$ 3.500 mensais otimizando o funil.
            </p>
          </div>

          <div className="grid gap-12 md:grid-cols-3 relative">
            {/* Conector sutil desktop */}
            <div className="hidden md:block absolute top-10 left-[15%] right-[15%] h-[1px] bg-slate-200 -z-10" />
            
            {[
              {
                step: "01",
                title: "Geração de Listas",
                desc: "Extraia e segmente 200 contatos altamente qualificados (B2B local) em menos de 15 minutos.",
                icon: BarChart3
              },
              {
                step: "02",
                title: "Cadência e Engajamento",
                desc: "Utilize o CRM para importar os leads e a automação de WhatsApp para obter uma taxa de resposta de 10 a 15%.",
                icon: Zap
              },
              {
                step: "03",
                title: "Fechamento de Contrato",
                desc: "Converta as reuniões em contratos. Com um ticket médio de R$ 1.800, dois fechamentos geram R$ 3.600 líquidos.",
                icon: CheckCircle2
              }
            ].map((s) => (
               <div key={s.step} className="flex flex-col items-center text-center">
                 <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-slate-50 text-primary shadow-sm">
                   <s.icon className="h-8 w-8" />
                 </div>
                 <div className="mt-6 inline-flex items-center rounded bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500 uppercase tracking-wider">Passo {s.step}</div>
                 <h3 className="mt-3 text-xl font-bold text-slate-900">{s.title}</h3>
                 <p className="mt-2 text-sm text-slate-600 leading-relaxed max-w-[280px]">{s.desc}</p>
               </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. CTA Final */}
      <section className="py-24 relative bg-primary">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/10 to-transparent" />
        
        <div className="mx-auto max-w-4xl px-6 text-center relative z-10">
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-5xl leading-tight">
            Pronto para escalar sua prospecção?
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-primary-foreground/90">
            Junte-se a profissionais e empresas que já modernizaram seus processos comerciais com o Flow Leads. Crie sua conta gratuitamente em segundos.
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/auth" search={{ mode: "signup" }} preload="render">
              <Button
                size="lg"
                className="w-full sm:w-auto h-14 px-8 text-base font-bold bg-white text-primary hover:bg-slate-50 shadow-md transition-transform"
              >
                Criar Conta Gratuita
              </Button>
            </Link>
            <Link to="/pricing" preload="render">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto h-14 px-8 text-base font-medium border-primary-foreground/30 text-white bg-transparent hover:bg-primary-foreground/10"
              >
                Ver Planos Completos
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
