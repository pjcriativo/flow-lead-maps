import { Link } from "@tanstack/react-router";
import { ArrowRight, Search, MessageSquare, DollarSign, FileText, Megaphone, BarChart3, Crown } from "lucide-react";

interface AgenteItem {
  id: string;
  nome: string;
  papel: string;
  descricao: string;
  imagem: string;
  icone: any;
  corIcone: string;
}

const AGENTES_LISTA: AgenteItem[] = [
  {
    id: "ceo",
    nome: "CEO Mestre",
    papel: "Estratégia e coordenação",
    descricao: "Coordena a equipe e direciona a operação de vendas.",
    imagem: "/images/agentes/agente-ceo.webp",
    icone: Crown,
    corIcone: "text-[#ff6200] bg-[#ff6200]/15",
  },
  {
    id: "prospeccao",
    nome: "Prospecção",
    papel: "Descoberta de oportunidades",
    descricao: "Novos clientes qualificados todos os dias.",
    imagem: "/images/agentes/agente-prospeccao.webp",
    icone: Search,
    corIcone: "text-amber-400 bg-amber-400/15",
  },
  {
    id: "sdr",
    nome: "SDR",
    papel: "Qualificação e agendamento",
    descricao: "Agendamento rápido de reuniões comerciais.",
    imagem: "/images/agentes/agente-sdr.webp",
    icone: MessageSquare,
    corIcone: "text-orange-400 bg-orange-400/15",
  },
  {
    id: "vendas",
    nome: "Vendas",
    papel: "Negociações e propostas",
    descricao: "Negociações consultivas que convertem mais.",
    imagem: "/images/agentes/agente-vendas.webp",
    icone: DollarSign,
    corIcone: "text-emerald-400 bg-emerald-400/15",
  },
  {
    id: "conteudo",
    nome: "Conteúdo",
    papel: "Produção de conteúdo",
    descricao: "Posts, roteiros e vídeos para atrair clientes.",
    imagem: "/images/agentes/agente-conteudo.webp",
    icone: FileText,
    corIcone: "text-rose-400 bg-rose-400/15",
  },
  {
    id: "trafego",
    nome: "Tráfego",
    papel: "Gestão de campanhas",
    descricao: "Anúncios e campanhas que geram mais clientes.",
    imagem: "/images/agentes/agente-trafego.webp",
    icone: Megaphone,
    corIcone: "text-purple-400 bg-purple-400/15",
  },
  {
    id: "seo",
    nome: "SEO",
    papel: "Crescimento orgânico",
    descricao: "Posicionamento consistente com resultados.",
    imagem: "/images/agentes/agente-seo.webp",
    icone: BarChart3,
    corIcone: "text-cyan-400 bg-cyan-400/15",
  },
];

export function EquipeAgentesSection() {
  return (
    <section id="agentes" className="relative py-16 sm:py-24 border-b border-white/[0.06] bg-[#03060a]">
      {/* Luz difusa de fundo */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-full max-w-6xl opacity-25 blur-[140px]"
        style={{
          background: "radial-gradient(circle, #ff6200 0%, transparent 65%)",
        }}
      />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 relative z-10">
        {/* CABEÇALHO DA SEÇÃO */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#ff6200]/30 bg-[#ff6200]/10 px-3.5 py-1 text-xs font-bold tracking-wider text-[#ff7a00] uppercase mb-4 shadow-[0_0_12px_rgba(255,98,0,0.15)]">
            FUNCIONÁRIOS DE IA DA SUA OPERAÇÃO
          </div>

          <h2 className="font-sans text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            Uma equipe de IA{" "}
            <span className="text-[#ff6200] drop-shadow-[0_0_20px_rgba(255,98,0,0.35)]">
              pronta para executar.
            </span>
          </h2>

          <p className="mt-3 text-sm sm:text-base text-slate-300">
            Agentes especializados trabalhando juntos para o crescimento do seu negócio.
          </p>
        </div>

        {/* GRADE DE CARDS (LINHA 1: 4 CARDS, LINHA 2: 3 CARDS CENTRALIZADOS) */}
        <div className="space-y-6">
          {/* PRIMEIRA LINHA: 4 CARDS (CEO, Prospecção, SDR, Vendas) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {AGENTES_LISTA.slice(0, 4).map((agente) => (
              <AgenteCard key={agente.id} agente={agente} />
            ))}
          </div>

          {/* SEGUNDA LINHA: 3 CARDS (Conteúdo, Tráfego, SEO) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {AGENTES_LISTA.slice(4, 7).map((agente) => (
              <AgenteCard key={agente.id} agente={agente} />
            ))}
          </div>
        </div>

        {/* NOTA COMERCIAL TRANSPARENTE */}
        <div className="mt-12 text-center">
          <p className="text-xs text-slate-400">
            Cada agente atua de forma autônoma e colaborativa sob a coordenação do CEO Mestre no Flow Business.
          </p>
        </div>
      </div>
    </section>
  );
}

function AgenteCard({ agente }: { agente: AgenteItem }) {
  const Icone = agente.icone;

  return (
    <div className="group relative rounded-2xl border border-white/10 bg-[#070c14]/90 backdrop-blur-md p-4 transition-all duration-300 hover:border-[#ff6200]/50 hover:shadow-[0_0_25px_rgba(255,98,0,0.2)] hover:-translate-y-1 flex flex-col justify-between">
      {/* Imagem do Agente com Badge Online/Disponível */}
      <div className="relative rounded-xl overflow-hidden aspect-[16/10] bg-black/60 border border-white/5">
        <img
          src={agente.imagem}
          alt={`Retrato de ${agente.nome} - ${agente.papel}`}
          className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
          width={176}
          height={100}
          loading="lazy"
        />

        {/* Gradiente sutil inferior */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#070c14] via-transparent to-transparent opacity-60" />

        {/* Badge Superior: Disponível / Ativo */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 rounded-full bg-black/70 backdrop-blur-sm px-2.5 py-0.5 border border-white/10 text-[10px] font-semibold text-emerald-400 shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Disponível</span>
        </div>
      </div>

      {/* Conteúdo Informativo */}
      <div className="mt-4 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-1.5">
          <div className={`p-1.5 rounded-lg shrink-0 ${agente.corIcone}`}>
            <Icone className="h-3.5 w-3.5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white group-hover:text-[#ff7a00] transition-colors">
              {agente.nome}
            </h3>
            <span className="text-[11px] font-medium text-slate-400 block">
              {agente.papel}
            </span>
          </div>
        </div>

        <p className="mt-2 text-xs text-slate-300 line-clamp-2 leading-relaxed">
          {agente.descricao}
        </p>
      </div>

      {/* Rodapé do Card com Ação Funcional */}
      <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
        <Link
          to="/pricing"
          preload="render"
          className="text-[11px] font-bold text-slate-300 group-hover:text-[#ff7a00] transition-colors flex items-center gap-1"
        >
          Conhecer agente
        </Link>
        <Link
          to="/pricing"
          preload="render"
          aria-label={`Ver planos e detalhes para ${agente.nome}`}
          className="h-7 w-7 rounded-full bg-white/[0.05] border border-white/10 group-hover:bg-[#ff6200] group-hover:border-[#ff6200] flex items-center justify-center text-slate-300 group-hover:text-white transition-all shadow-sm"
        >
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

