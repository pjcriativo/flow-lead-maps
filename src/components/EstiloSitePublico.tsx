// Tema/SEO do SITE PÚBLICO vindos de Configurações (admin): cor base/secundária viram as
// variáveis CSS --primary/--gold, css_personalizado vira um <style> injetado, e
// seo_titulo/seo_descricao sobrescrevem title + meta description. Escopo: só as páginas que
// montam este componente (landing, /pricing) — restaura tudo ao desmontar, pra nunca vazar
// pro painel (que mantém a identidade navy/gold fixa).
import { useEffect } from "react";
import { lerConfigPublica } from "@/services/config-publica";

const HEX_RE = /^#?[0-9a-fA-F]{6}$/;
const normalizarHex = (v: string) => (v.startsWith("#") ? v : `#${v}`);

export function EstiloSitePublico() {
  useEffect(() => {
    const raiz = document.documentElement;
    const anteriores: Record<string, string> = {};
    let styleEl: HTMLStyleElement | null = null;
    const tituloAnterior = document.title;

    lerConfigPublica().then((c) => {
      if (c.cor_base && HEX_RE.test(c.cor_base)) {
        anteriores["--primary"] = raiz.style.getPropertyValue("--primary");
        raiz.style.setProperty("--primary", normalizarHex(c.cor_base));
      }
      if (c.cor_secundaria && HEX_RE.test(c.cor_secundaria)) {
        anteriores["--gold"] = raiz.style.getPropertyValue("--gold");
        raiz.style.setProperty("--gold", normalizarHex(c.cor_secundaria));
      }
      if (c.css_personalizado?.trim()) {
        styleEl = document.createElement("style");
        styleEl.id = "css-personalizado-admin";
        styleEl.textContent = c.css_personalizado;
        document.head.appendChild(styleEl);
      }
      if (c.seo_titulo?.trim()) document.title = c.seo_titulo.trim();
      if (c.seo_descricao?.trim()) {
        const meta = document.querySelector('meta[name="description"]');
        if (meta) meta.setAttribute("content", c.seo_descricao.trim());
      }
    });

    return () => {
      for (const [prop, valor] of Object.entries(anteriores)) {
        if (valor) raiz.style.setProperty(prop, valor);
        else raiz.style.removeProperty(prop);
      }
      styleEl?.remove();
      document.title = tituloAnterior;
    };
  }, []);
  return null;
}
