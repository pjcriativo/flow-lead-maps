import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { lerConfigPublica } from "@/services/config-publica";
import { BRAND_NAME } from "@/lib/brand";

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

  const texto = nome || BRAND_NAME;

  if (logoUrl) {
    return <img src={logoUrl} alt={texto} className={cn("h-9 w-auto object-contain", className)} />;
  }

  const isDark = variant === "dark";

  if (isDark) {
    return (
      <div className={cn("flex items-center gap-2.5", className)}>
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 shrink-0"
          aria-hidden="true"
        >
          <path
            d="M4 7C4 5.34315 5.34315 4 7 4H25C26.6569 4 28 5.34315 28 7C28 8.65685 26.6569 10 25 10H13C11.3431 10 10 11.3431 10 13C10 14.6569 11.3431 16 13 16H22C23.6569 16 25 17.3431 25 19C25 20.6569 23.6569 22 22 22H10V27C10 27.5523 9.55228 28 9 28H5C4.44772 28 4 27.5523 4 27V7Z"
            fill="url(#flow-orange-grad)"
          />
          <path
            d="M10 10H23C24.1046 10 25 9.10457 25 8C25 6.89543 24.1046 6 23 6H10V10Z"
            fill="#FFF"
            opacity="0.3"
          />
          <defs>
            <linearGradient
              id="flow-orange-grad"
              x1="4"
              y1="4"
              x2="28"
              y2="28"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#FF7A00" />
              <stop offset="100%" stopColor="#FF4500" />
            </linearGradient>
          </defs>
        </svg>
        <span className="font-sans text-[18px] font-bold tracking-tight text-white">{texto}</span>
      </div>
    );
  }

  const tile = "#1a1a2e";
  const tileFg = "#ffffff";
  const wordmark = "#1a1a2e";
  const accent = "#4f8ef7";

  return (
    <svg
      viewBox="0 0 250 36"
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
