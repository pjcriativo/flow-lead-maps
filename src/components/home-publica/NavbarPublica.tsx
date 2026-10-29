import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, ArrowRight } from "lucide-react";
import { FlowLogoMark } from "./HomeIcons";

export function NavbarPublica() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#05080e]/95 backdrop-blur-md border-b border-white/[0.08] shadow-2xl py-3"
          : "bg-[#05080e]/80 backdrop-blur-sm border-b border-transparent py-4"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* LOGO */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <FlowLogoMark className="h-8 w-8 transition-transform group-hover:scale-105" />
          <span className="font-sans text-lg font-extrabold tracking-tight text-white">
            Flow Business
          </span>
        </Link>

        {/* NAVEGAÇÃO CENTRAL (DESKTOP) */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <a href="/#recursos" className="hover:text-white transition-colors">
            Recursos
          </a>
          <Link to="/prospeccao" className="hover:text-white transition-colors">
            Soluções
          </Link>
          <Link to="/pricing" className="hover:text-white transition-colors">
            Planos
          </Link>
          <a href="/#demo" className="hover:text-white transition-colors">
            Conteúdo
          </a>
          <a href="#suporte" className="hover:text-white transition-colors">
            Suporte
          </a>
        </nav>

        {/* AÇÕES DA DIREITA (DESKTOP) */}
        <div className="hidden sm:flex items-center gap-4">
          <Link
            to="/auth"
            search={{ mode: "signin" }}
            preload="render"
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors px-3 py-1.5"
          >
            Entrar
          </Link>
          <Link
            to="/pricing"
            preload="render"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#ff6200] px-4 py-2 text-sm font-bold text-white shadow-[0_0_15px_rgba(255,98,0,0.35)] hover:bg-[#e05600] hover:shadow-[0_0_22px_rgba(255,98,0,0.5)] transition-all"
          >
            Ver planos <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* BOTÃO MOBILE */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            to="/pricing"
            preload="render"
            className="rounded-lg bg-[#ff6200] px-3 py-1.5 text-xs font-bold text-white shadow-sm"
          >
            Ver planos
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-300 hover:text-white rounded-lg focus:outline-none"
            aria-label="Abrir menu de navegação"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* DRAWER / MENU MOBILE */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/10 bg-[#070c14] px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-4 duration-200">
          <div className="flex flex-col space-y-2 text-sm font-medium text-slate-300">
            <a
              href="/#recursos"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 px-3 rounded-lg hover:bg-white/5 hover:text-white transition-colors"
            >
              Recursos
            </a>
            <Link
              to="/prospeccao"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 px-3 rounded-lg hover:bg-white/5 hover:text-white transition-colors"
            >
              Soluções
            </Link>
            <Link
              to="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 px-3 rounded-lg hover:bg-white/5 hover:text-white transition-colors"
            >
              Planos
            </Link>
            <a
              href="/#demo"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 px-3 rounded-lg hover:bg-white/5 hover:text-white transition-colors"
            >
              Conteúdo & Vídeo
            </a>
            <a
              href="#suporte"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 px-3 rounded-lg hover:bg-white/5 hover:text-white transition-colors"
            >
              Suporte
            </a>
          </div>

          <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
            <Link
              to="/auth"
              search={{ mode: "signin" }}
              className="w-full text-center py-2.5 rounded-lg text-sm font-medium text-slate-300 bg-white/5 hover:bg-white/10"
            >
              Entrar na Plataforma
            </Link>
            <Link
              to="/pricing"
              className="w-full text-center py-2.5 rounded-lg text-sm font-bold text-white bg-[#ff6200] hover:bg-[#e05600] shadow-md"
            >
              Ver Planos e Assinaturas
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

