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
  AlertTriangle,
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
      { title: "Flow Leads — O Fim da Prospecção Manual" },
      {
        name: "description",
        content:
          "Pare de caçar leads na mão. Tenha uma máquina automática de prospecção, Lead Scoring, WhatsApp e CRM.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const conteudo = useConteudo();
  
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-foreground selection:bg-primary/20 overflow-x-hidden">
      <EstiloSitePublico />
      
      {/* Estilos customizados para 3D e Animações agressivas */}
      <style dangerouslySetInnerHTML={{__html: `
        .preserve-3d { transform-style: preserve-3d; }
        .perspective-1000 { perspective: 1000px; }
        .tilt-card { transition: transform 0.5s cubic-bezier(0.23, 1, 0.32, 1); }
        .tilt-card:hover { transform: rotateX(8deg) rotateY(-8deg) scale(1.05); }
        .tilt-card-reverse:hover { transform: rotateX(-8deg) rotateY(8deg) scale(1.05); }
        
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
          100% { transform: translateY(0px); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        
        .text-glow { text-shadow: 0 0 20px rgba(99, 102, 241, 0.5); }
        .box-glow { box-shadow: 0 0 60px -15px rgba(99, 102, 241, 0.6); }
      `}} />

      {/* Nav */}
      <header className="fixed w-full top-0 z-50 border-b border-white/5 bg-[#0A0A0A]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex h-full items-center">
            <FlowLeadsLogo className="h-10 w-auto" />
          </Link>
          <nav className="hidden items-center gap-10 text-sm font-semibold text-zinc-400 md:flex">
            <a href="#dor" className="hover:text-white transition-colors">A Realidade</a>
            <a href="#solucao" className="hover:text-white transition-colors">A Solução</a>
            <a href="#recursos" className="hover:text-white transition-colors">Arsenal Técnico</a>
            <Link to="/pricing" className="hover:text-white transition-colors">Planos</Link>
          </nav>
          <Link to="/auth" search={{ mode: "signup" }} preload="render">
            <Button className="rounded-full h-12 px-8 font-bold bg-white text-black hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 transition-all duration-300">
              Acessar Máquina
            </Button>
          </Link>
        </div>
      </header>

      {/* 1. ATENÇÃO: Hero Section */}
      <section className="relative pt-40 pb-20 md:pt-48 md:pb-32 flex flex-col items-center justify-center min-h-[90vh]">
        {/* Fundo Cibernético */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-[#0A0A0A] to-[#0A0A0A] -z-10" />
        <div className="absolute top-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
        
        <div className="mx-auto max-w-7xl px-6 relative z-10">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-5 py-2 text-sm font-bold text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-pulse">
              <AlertTriangle className="h-4 w-4" />
              Alerta para Agências e Home Office: O amadorismo acabou.
            </div>
            
            <h1 className="text-balance text-5xl font-black tracking-tighter text-white sm:text-6xl md:text-7xl lg:text-8xl leading-[1.1]">
              Se você continua caçando leads na mão, seu negócio está com os <br className="hidden lg:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 text-glow">
                dias contados.
              </span>
            </h1>
            
            <p className="mx-auto mt-8 max-w-3xl text-xl font-medium leading-relaxed text-zinc-400">
              O mercado engoliu quem perde 80% do dia copiando e colando e-mails frios. 
              Extraia, qualifique e feche negócios automaticamente com a única ferramenta desenhada para SDRs, Freelancers e Agências que desejam faturar <strong className="text-white">R$ 3.500+ líquidos</strong> sem depender da sorte.
            </p>
            
            <div className="mt-12 flex flex-col items-center justify-center gap-6 sm:flex-row">
              <Link to="/auth" search={{ mode: "signup" }} preload="render" className="w-full sm:w-auto">
                <Button size="lg" className="w-full h-16 px-10 text-xl font-black bg-gradient-to-r from-primary to-violet-600 text-white border-0 shadow-[0_0_40px_rgba(99,102,241,0.5)] transition-all duration-300 hover:scale-110 hover:shadow-[0_0_60px_rgba(99,102,241,0.7)] rounded-full">
                  Construir Minha Máquina Agora <Zap className="ml-3 h-6 w-6" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. INTERESSE: A Dor Extrema (Freelancer Pain) */}
      <section id="dor" className="py-24 relative overflow-hidden bg-zinc-950 border-t border-white/5">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <div className="order-2 lg:order-1 relative perspective-1000">
              <div className="absolute inset-0 bg-red-500/20 blur-[100px] rounded-full" />
              <img 
                src="/images/freelancer_pain.png" 
                alt="Freelancer Frustrado e Exausto" 
                className="relative z-10 w-full rounded-2xl shadow-2xl border border-white/10 tilt-card animate-float"
              />
            </div>
            
            <div className="order-1 lg:order-2">
              <h2 className="text-4xl font-black text-white md:text-5xl leading-tight">
                Home Office não deveria ser sinônimo de <span className="text-red-500">escravidão em planilhas.</span>
              </h2>
              <p className="mt-6 text-xl text-zinc-400 leading-relaxed font-medium">
                Você vende a ideia de "liberdade geográfica", mas passa 12 horas por dia com os olhos vermelhos rastreando o LinkedIn e o Instagram em busca de decisores que nunca te respondem.
              </p>
              
              <div className="mt-10 space-y-6">
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
                    <Search className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white">Leads frios e desqualificados</h4>
                    <p className="mt-2 text-zinc-500">Comprar listas de emails vazados na internet só serve para destruir a reputação do seu domínio. Seus e-mails caem no SPAM.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
                    <Activity className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white">Gestão amadora que te faz perder dinheiro</h4>
                    <p className="mt-2 text-zinc-500">Esquecer de fazer o follow-up porque anotou o número do cliente em um bloco de notas perdido. O dinheiro escapa pelos seus dedos.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. DESEJO: A Solução Suprema (Dashboard & Rocket) */}
      <section id="solucao" className="py-32 relative bg-[#0A0A0A]">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl font-black text-white md:text-5xl lg:text-6xl text-glow">
              O antídoto definitivo para a falência B2B.
            </h2>
            <p className="mt-6 text-xl text-zinc-400">
              Transformamos prospecção em engenharia reversa. O Flow Leads não é apenas um extrator, é o ecossistema completo que grandes agências usam para triturar a concorrência.
            </p>
          </div>

          {/* Funcionalidade: Insights e Dashboard */}
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center mb-32">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-bold text-primary mb-6">
                <Target className="h-4 w-4" /> Inteligência Artificial & Dados
              </div>
              <h3 className="text-3xl font-black text-white md:text-4xl">
                Lead Score e Insights Vivos. Pare de adivinhar quem vai comprar.
              </h3>
              <p className="mt-6 text-lg text-zinc-400 leading-relaxed">
                Nossa plataforma pontua cada contato extraído do Google Maps, LinkedIn ou Instagram. Você saberá exatamente qual empresa tem a maior urgência e o maior orçamento. Tudo gerido em um <strong>Pipeline Kanban Visual</strong>. Você não precisa mais assinar Pipefy, Trello ou Pipedrive.
              </p>
              <ul className="mt-8 space-y-4">
                <li className="flex items-center gap-3 text-zinc-300 font-medium"><CheckCircle2 className="h-5 w-5 text-primary" /> Qualificação automática de Leads.</li>
                <li className="flex items-center gap-3 text-zinc-300 font-medium"><CheckCircle2 className="h-5 w-5 text-primary" /> Dashboard executivo com métricas financeiras.</li>
                <li className="flex items-center gap-3 text-zinc-300 font-medium"><CheckCircle2 className="h-5 w-5 text-primary" /> Visualização de funil clara e sem ruídos.</li>
              </ul>
            </div>
            <div className="relative perspective-1000">
              <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full" />
              <img 
                src="/images/dashboard_solution.png" 
                alt="Dashboard Kanban 3D CRM Flow Leads" 
                className="relative z-10 w-full rounded-2xl shadow-[0_0_50px_rgba(99,102,241,0.3)] border border-white/10 tilt-card-reverse"
              />
            </div>
          </div>

          {/* Funcionalidade: Automação Total */}
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <div className="order-2 lg:order-1 relative perspective-1000">
              <div className="absolute inset-0 bg-emerald-500/20 blur-[100px] rounded-full" />
              <img 
                src="/images/automation_rocket.png" 
                alt="Automação Rocket Flow Leads" 
                className="relative z-10 w-full rounded-2xl shadow-[0_0_50px_rgba(16,185,129,0.2)] border border-white/10 tilt-card animate-float"
              />
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm font-bold text-emerald-500 mb-6">
                <Bot className="h-4 w-4" /> Disparos e Conversão
              </div>
              <h3 className="text-3xl font-black text-white md:text-4xl">
                Campanhas que rodam enquanto você dorme. Do 1º contato ao PIX na conta.
              </h3>
              <p className="mt-6 text-lg text-zinc-400 leading-relaxed">
                Você encontrou os contatos perfeitos. E agora? Dispare centenas de mensagens via WhatsApp com um clique. Envie propostas comerciais em PDF geradas dinamicamente dentro da plataforma e faça a cobrança de contratos sem sair da cadeira.
              </p>
              <ul className="mt-8 space-y-4">
                <li className="flex items-center gap-3 text-zinc-300 font-medium"><CheckCircle2 className="h-5 w-5 text-emerald-500" /> Disparos em Massa no WhatsApp.</li>
                <li className="flex items-center gap-3 text-zinc-300 font-medium"><CheckCircle2 className="h-5 w-5 text-emerald-500" /> Geração de Propostas PDF customizadas.</li>
                <li className="flex items-center gap-3 text-zinc-300 font-medium"><CheckCircle2 className="h-5 w-5 text-emerald-500" /> Construtor de Sites Integrado para Landing Pages.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Grade de Recursos Técnica 3D */}
      <section id="recursos" className="py-24 bg-zinc-950 border-y border-white/5">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-white md:text-5xl">O Arsenal Completo</h2>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 perspective-1000">
            {[
              {
                icon: Linkedin,
                title: "Modo LinkedIn & Insta",
                desc: "Invada a rede social mais lucrativa. Extraia decisores B2B de alto calão.",
                color: "text-blue-500",
                bg: "bg-blue-500/10"
              },
              {
                icon: MapPin,
                title: "Google Maps Max",
                desc: "Liste todas as empresas locais e triture a concorrência.",
                color: "text-red-500",
                bg: "bg-red-500/10"
              },
              {
                icon: LayoutTemplate,
                title: "Construtor Web",
                desc: "Crie Landing Pages absurdas para captura sem depender de devs.",
                color: "text-emerald-500",
                bg: "bg-emerald-500/10"
              },
              {
                icon: Target,
                title: "Pipeline CRM",
                desc: "Kanban visual inteligente com scoring. Saiba quem vai fechar hoje.",
                color: "text-purple-500",
                bg: "bg-purple-500/10"
              },
              {
                icon: Bot,
                title: "Automação WhatsApp",
                desc: "Robô de disparos para derreter as objeções e agendar reuniões.",
                color: "text-green-500",
                bg: "bg-green-500/10"
              },
              {
                icon: FileText,
                title: "Contratos Automáticos",
                desc: "Emissão de propostas e controle financeiro integrado num só lugar.",
                color: "text-amber-500",
                bg: "bg-amber-500/10"
              }
            ].map((f) => (
              <div
                key={f.title}
                className="group relative rounded-3xl border border-white/10 bg-[#111] p-8 transition-all duration-500 tilt-card preserve-3d cursor-crosshair hover:border-primary/50 box-glow"
              >
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none" />
                
                <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${f.bg} ${f.color} mb-6 transition-transform duration-500 group-hover:translate-z-10 group-hover:scale-110`} style={{ transform: 'translateZ(30px)' }}>
                  <f.icon className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold text-white transition-all duration-500 group-hover:translate-x-2" style={{ transform: 'translateZ(20px)' }}>{f.title}</h3>
                <p className="mt-3 text-zinc-400 font-medium leading-relaxed transition-all duration-500" style={{ transform: 'translateZ(10px)' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. AÇÃO: CTA Final Agressivo */}
      <section className="py-40 relative flex items-center justify-center overflow-hidden bg-[#0A0A0A]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/30 via-[#0A0A0A] to-[#0A0A0A] -z-10" />
        
        <div className="mx-auto max-w-5xl px-6 text-center relative z-10">
          <h2 className="text-5xl font-black text-white md:text-7xl leading-[1.1] tracking-tighter text-glow">
            O custo da sua indecisão <br/> é continuar quebrado.
          </h2>
          <p className="mx-auto mt-8 max-w-3xl text-2xl text-zinc-400 font-medium">
            Agências e SDRs de elite já abandonaram o amadorismo. Quem não tem uma máquina de prospecção hoje, amanhã estará pedindo emprego no LinkedIn. 
            Você vai agir ou vai ser engolido?
          </p>
          
          <div className="mt-14 flex justify-center">
            <Link to="/auth" search={{ mode: "signup" }} preload="render">
              <Button
                size="lg"
                className="h-20 px-14 text-2xl font-black bg-white text-black hover:bg-zinc-200 border-0 shadow-[0_0_50px_rgba(255,255,255,0.4)] hover:scale-110 transition-all duration-300 rounded-full"
              >
                Eu Quero Faturar Agora <MousePointerClick className="ml-4 h-8 w-8" />
              </Button>
            </Link>
          </div>
          <div className="mt-8 flex justify-center gap-8 text-sm font-bold text-zinc-500">
            <span className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-primary" /> Setup imediato</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-primary" /> Sem taxas ocultas</span>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
