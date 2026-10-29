import { Link } from "@tanstack/react-router";
import { FlowLogoMark, YouTubeIcon, InstagramIcon, LinkedInIcon } from "./HomeIcons";

export function FooterPublico() {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="suporte" className="relative z-10 border-t border-white/[0.08] bg-[#040609] pt-16 pb-12 text-slate-400">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 pb-10 border-b border-white/[0.06]">
          {/* Logo e Tagline */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <Link to="/" className="flex items-center gap-2.5">
              <FlowLogoMark className="h-7 w-7" />
              <span className="font-sans text-lg font-extrabold tracking-tight text-white">
                Flow Business
              </span>
            </Link>
            <p className="mt-2 text-xs text-slate-400">
              Mais oportunidades. Mais vendas.
            </p>
          </div>

          {/* Links Centrais */}
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs sm:text-sm font-medium text-slate-300">
            <a href="#recursos" className="hover:text-white transition-colors">
              Recursos
            </a>
            <a href="#ecossistema" className="hover:text-white transition-colors">
              Soluções
            </a>
            <Link to="/pricing" className="hover:text-white transition-colors">
              Planos
            </Link>
            <a href="#demo" className="hover:text-white transition-colors">
              Conteúdo
            </a>
            <a href="mailto:contato@flowleads.com.br" className="hover:text-white transition-colors">
              Suporte
            </a>
            <Link to="/terms" className="hover:text-white transition-colors">
              Termos
            </Link>
            <Link to="/privacy" className="hover:text-white transition-colors">
              Privacidade
            </Link>
          </nav>

          {/* Redes Sociais Oficiais */}
          <div className="flex items-center gap-3">
            <a
              href="https://www.youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Canal no YouTube"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.05] text-slate-300 hover:bg-[#ff0000]/20 hover:text-[#ff0000] transition-colors"
            >
              <YouTubeIcon className="h-4 w-4" />
            </a>
            <a
              href="https://www.instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Perfil no Instagram"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.05] text-slate-300 hover:bg-[#d6249f]/20 hover:text-[#d6249f] transition-colors"
            >
              <InstagramIcon className="h-4 w-4" />
            </a>
            <a
              href="https://www.linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Página no LinkedIn"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.05] text-slate-300 hover:bg-[#0077b5]/20 hover:text-[#0077b5] transition-colors"
            >
              <LinkedInIcon className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Linha Inferior com Copyright */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 text-center sm:text-left">
          <p>© {currentYear} Flow Business. Todos os direitos reservados.</p>
          <p className="text-slate-400">
            Plataforma SaaS de inteligência e automação de prospecção B2B.
          </p>
        </div>
      </div>
    </footer>
  );
}
