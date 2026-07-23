import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function SiteFooter() {
  // ⚙️ CMS (admin → Conteúdos do site): texto após o ano — vazio = usa "Flow Leads".
  const [texto, setTexto] = useState<string | null>(null);
  useEffect(() => {
    supabase
      .from("site_conteudo")
      .select("footer_texto")
      .eq("id", true)
      .maybeSingle()
      .then(({ data }) => setTexto(data?.footer_texto ?? null));
  }, []);

  return (
    <footer className="border-t border-border py-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 text-sm text-muted-foreground sm:flex-row">
        <p>
          © {new Date().getFullYear()} {texto || "Flow Leads"}
        </p>
        <nav className="flex items-center gap-6">
          <Link to="/pricing" className="hover:text-foreground">
            Preços
          </Link>
          <Link to="/refund" className="hover:text-foreground">
            Reembolso
          </Link>
          <Link to="/terms" className="hover:text-foreground">
            Termos
          </Link>
          <Link to="/privacy" className="hover:text-foreground">
            Privacidade
          </Link>
        </nav>
      </div>
    </footer>
  );
}
