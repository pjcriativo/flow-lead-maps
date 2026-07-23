import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { lerConfigPublica } from "@/services/config-publica";

interface FlowLeadsLogoProps {
  className?: string;
  variant?: "light" | "dark";
}

// ⚙️ Configurações (admin → Logotipo e Favicon): logo_url substitui o SVG por uma imagem;
// nome_plataforma troca o texto da marca (só quando não há logo_url). Vazio = usa o padrão.
export function FlowLeadsLogo({ className, variant = "light" }: FlowLeadsLogoProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [nome, setNome] = useState<string | null>(null);
  useEffect(() => {
    lerConfigPublica().then((c) => {
      setLogoUrl(c.logo_url);
      setNome(c.nome_plataforma);
    });
  }, []);

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={nome || "Flow Leads"}
        className={cn("h-9 w-auto object-contain", className)}
      />
    );
  }

  const isDark = variant === "dark";
  const tile = isDark ? "#ffffff" : "#1a1a2e";
  const tileFg = isDark ? "#1a1a2e" : "#ffffff";
  const wordmark = isDark ? "#ffffff" : "#1a1a2e";
  const accent = "#4f8ef7";
  const texto = nome || "Flow Leads";

  return (
    <svg
      viewBox="0 0 210 36"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-9 w-auto", className)}
      role="img"
      aria-label={texto}
    >
      <rect x="0" y="0" width="36" height="36" rx="8" fill={tile} />
      <rect x="10" y="8" width="5" height="20" rx="2" fill={tileFg} />
      <rect x="10" y="22" width="16" height="5" rx="2" fill={tileFg} />
      <rect x="21" y="8" width="5" height="14" rx="2" fill={accent} />
      <text
        x="46"
        y="25"
        fontFamily="Georgia, serif"
        fontSize="22"
        fontWeight="400"
        fill={wordmark}
        letterSpacing="1"
      >
        {texto}
      </text>
    </svg>
  );
}
