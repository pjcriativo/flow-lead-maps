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
  Linkedin,
  LayoutTemplate,
  Bot,
  Target,
  FileText,
  Zap,
  Activity,
  BarChart3,
  AlertTriangle
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
    <div className="min-h-screen bg-white text-slate-900 selection:bg-primary/20 overflow-x-hidden font-sans">
      <EstiloSitePublico />
      
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex h-full items-center">
            <FlowLeadsLogo className="h-8 w-auto text-primary" />
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a href="#dor" className="hover:text-primary transition-colors">A Realidade</a>
            <a href="#solucao" className="hover:text-primary transition-colors">A Solução</a>
            <a href="#recursos" className="hover:text-primary transition-colors">Arsenal Técnico</a>
            <Link to="/pricing" className="hover:text-primary transition-colors">Planos</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link to="/auth" search={{ mode: "signin" }} preload="render" className="hidden text-sm font-medium text-slate-600 hover:text-primary sm:block">
              Acessar Painel
            </Link>
            <Link to="/pricing" preload="render">
              <Button className="rounded-md h-10 px-6 font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all">
                Ver Planos
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 1. ATENÇÃO: Hero Section (Agressiva B2B) */}
      <section className="relative pt-24 pb-20 md:pt-32 md:pb-32 bg-slate-50 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />
        
        <div className="mx-auto max-w-7xl px-6 relative z-10">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-1.5 text-xs font-bold text-red-600 uppercase tracking-wide">
              <AlertTriangle className="h-4 w-4" />
              Alerta: O amadorismo acabou
            </div>
            
            <h1 className="text-balance text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl leading-tight">
              Se você continua caçando leads na mão, seu negócio está com os <br className="hidden md:block"/>
              <span className="text-primary">
                dias contados.
              </span>
            </h1>
            
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 font-medium">
              O mercado engoliu quem perde 80% do dia copiando e colando e-mails frios. 
              Extraia, qualifique e feche negócios automaticamente com a única ferramenta desenhada para faturar <strong className="text-slate-900">R$ 3.500+ líquidos</strong> sem depender da sorte.
            </p>
            
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/pricing" preload="render" className="w-full sm:w-auto">
                <Button size="lg" className="w-full h-14 px-8 text-base font-bold shadow-md transition-transform hover:scale-105">
                  Quero Escalar Minhas Vendas <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a href="#solucao" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full h-14 px-8 text-base font-medium border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition-colors">
                  Entender a Máquina
                </Button>
              </a>
            </div>
            
            <p className="mt-6 text-sm text-slate-500 flex items-center justify-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" /> Setup Imediato · Escalabilidade Absoluta
            </p>
          </div>
        </div>
      </section>

      {/* 2. INTERESSE: A Dor (Sem imagens falsas, pura copy lógica) */}
      <section id="dor" className="py-24 bg-white border-y border-slate-100">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-sm font-bold text-red-600 mb-4">
                A Realidade
              </div>
              <h2 className="text-3xl font-bold text-slate-900 md:text-4xl leading-tight">
                Home Office não deveria ser sinônimo de escravidão em planilhas.
              </h2>
              <p className="mt-6 text-lg text-slate-600 leading-relaxed font-medium">
                Você vende a ideia de liberdade corporativa, mas passa 12 horas por dia com os olhos vermelhos rastreando o LinkedIn e o Google Maps em busca de decisores que nunca te respondem.
              </p>
              
              <div className="mt-8 space-y-6">
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 border border-red-100">
                    <Search className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-900">Leads frios e desqualificados</h4>
                    <p className="mt-1 text-slate-600">Comprar listas de emails vazados só serve para destruir a reputação do seu domínio. Seus e-mails caem direto no SPAM.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 border border-orange-100">
                    <Activity className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-900">Gestão amadora e perda de dinheiro</h4>
                    <p className="mt-1 text-slate-600">Esquecer de fazer o follow-up porque anotou o número do cliente num bloco de notas. O dinheiro escapa pelos seus dedos.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative rounded-2xl bg-slate-50 border border-slate-200 p-8 md:p-10 shadow-sm">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">A Solução Flow Leads</h3>
              <p className="mt-2 text-slate-600 font-medium">O antídoto definitivo para a falência B2B.</p>
              <ul className="mt-8 space-y-5">
                {[
                  "Extração de Leads B2B frescos em Tempo Real.",
                  "Encontre o contato direto do Decisor instantaneamente.",
                  "Qualificação Automática com Lead Scoring inteligente.",
                  "Automação total: do WhatsApp até a emissão do PDF."
                ].map((sol, idx) => (
                  <li key={idx} className="flex items-start gap-4 text-slate-700 font-medium text-base">
                    <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-500" />
                    <span className="leading-snug">{sol}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 3. DESEJO: O Arsenal Técnico (Design B2B, Copy Matadora) */}
      <section id="recursos" className="py-24 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl font-extrabold text-slate-900 md:text-5xl">O Arsenal Completo</h2>
            <p className="mt-6 text-lg text-slate-600 font-medium">
              Transformamos prospecção em engenharia reversa. O Flow Leads não é apenas um extrator, é o ecossistema que agências de elite usam para triturar a concorrência. E o melhor: você para de pagar mensalidade pra 5 ferramentas diferentes.
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Linkedin,
                title: "Modo LinkedIn & Insta",
                desc: "Invada a rede social mais lucrativa do mundo. Extraia contatos B2B de alto calão e chegue direto na caixa do decisor.",
                color: "text-blue-600",
                bg: "bg-blue-50 border-blue-100"
              },
              {
                icon: MapPin,
                title: "Google Maps Max",
                desc: "Vire o dono da sua cidade. Liste todas as empresas de um nicho local com telefones reais em apenas 10 segundos.",
                color: "text-red-600",
                bg: "bg-red-50 border-red-100"
              },
              {
                icon: LayoutTemplate,
                title: "Construtor de Landing Pages",
                desc: "Crie páginas absurdas para capturar clientes rapidamente, sem depender de WordPress, plugins quebrados ou desenvolvedores caros.",
                color: "text-emerald-600",
                bg: "bg-emerald-50 border-emerald-100"
              },
              {
                icon: Target,
                title: "Pipeline e Lead Score",
                desc: "Pare de adivinhar quem vai comprar. O sistema pontua os melhores leads num Kanban visual claro e sem ruídos.",
                color: "text-purple-600",
                bg: "bg-purple-50 border-purple-100"
              },
              {
                icon: Bot,
                title: "Robô de WhatsApp",
                desc: "Campanhas que rodam enquanto você dorme. Dispare em massa para prospectos e recupere contatos frios automaticamente.",
                color: "text-green-600",
                bg: "bg-green-50 border-green-100"
              },
              {
                icon: FileText,
                title: "Contratos Automáticos",
                desc: "Do pitch ao PIX na conta. Gere documentos profissionais em PDF e faça o controle financeiro diretamente na mesma plataforma.",
                color: "text-amber-600",
                bg: "bg-amber-50 border-amber-100"
              }
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1"
              >
                <div className={`flex h-14 w-14 items-center justify-center rounded-xl border ${f.bg} ${f.color} mb-6`}>
                  <f.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">{f.title}</h3>
                <p className="mt-3 text-slate-600 leading-relaxed font-medium">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. O Caminho do ROI */}
      <section id="roi" className="py-24 bg-white border-y border-slate-100">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl font-extrabold text-slate-900 md:text-5xl">Previsibilidade de Receita</h2>
            <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto font-medium">
              A matemática é inegável. Se você fechar 2 clientes usando o Flow Leads, a plataforma já se paga por anos. Veja como faturar seus primeiros R$ 3.500:
            </p>
          </div>

          <div className="grid gap-16 md:grid-cols-3 relative">
            {/* Conector sutil desktop */}
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-[2px] bg-slate-100 -z-10" />
            
            {[
              {
                step: "01",
                title: "Extraia o Ouro",
                desc: "Use o extrator (Maps/LinkedIn) para pegar o contato direto dos donos de 200 clínicas da sua região.",
                icon: Search
              },
              {
                step: "02",
                title: "Abordagem Massiva",
                desc: "Jogue todos no Kanban e inicie uma campanha de WhatsApp. Em média, 20 vão responder interessados.",
                icon: Zap
              },
              {
                step: "03",
                title: "Contrato Fechado",
                desc: "Envie a proposta em PDF pela plataforma. Feche 2 contratos de R$ 1.800. Boom: R$ 3.600 no seu caixa.",
                icon: CheckCircle2
              }
            ].map((s) => (
               <div key={s.step} className="flex flex-col items-center text-center">
                 <div className="flex h-24 w-24 items-center justify-center rounded-full border-8 border-white bg-slate-50 text-primary shadow-sm">
                   <s.icon className="h-10 w-10" />
                 </div>
                 <div className="mt-8 inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500 uppercase tracking-widest">
                   Passo {s.step}
                 </div>
                 <h3 className="mt-4 text-2xl font-bold text-slate-900">{s.title}</h3>
                 <p className="mt-3 text-base text-slate-600 leading-relaxed max-w-[280px] font-medium">{s.desc}</p>
               </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. AÇÃO: CTA Final Agressivo (Estilo Institucional) */}
      <section className="py-32 relative bg-primary overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/10 to-transparent" />
        
        <div className="mx-auto max-w-4xl px-6 text-center relative z-10">
          <h2 className="text-4xl font-extrabold tracking-tight text-white md:text-6xl leading-tight text-balance">
            O custo da sua indecisão é continuar quebrado.
          </h2>
          <p className="mx-auto mt-8 max-w-3xl text-xl text-primary-foreground/90 font-medium leading-relaxed">
            Agências e SDRs de elite já abandonaram o amadorismo. Quem não tem uma máquina de prospecção hoje, amanhã estará pedindo emprego no LinkedIn. Você vai agir ou vai ser engolido?
          </p>
          
          <div className="mt-12 flex justify-center">
            <Link to="/pricing" preload="render">
              <Button
                size="lg"
                className="h-16 px-12 text-xl font-bold bg-white text-primary hover:bg-slate-50 shadow-xl hover:scale-105 transition-transform rounded-full"
              >
                Garantir Minha Vantagem Injusta
              </Button>
            </Link>
          </div>
          
          <div className="mt-8 flex justify-center gap-8 text-sm font-bold text-primary-foreground/80">
            <span className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5" /> Setup imediato</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5" /> Cancele quando quiser</span>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
