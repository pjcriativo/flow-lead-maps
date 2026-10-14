import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface TemplateMiniatureProps {
  templateId: string;
  className?: string;
  alt?: string;
}

/**
 * Renderizador de miniaturas oficial do Flow Business.
 * Exibe a imagem de alta fidelidade do template correspondente,
 * garantindo fidelidade visual absoluta ao design aprovado.
 */
export function TemplateMiniature({ templateId, className, alt }: TemplateMiniatureProps) {
  const [hasError, setHasError] = useState(false);
  const imageSrc = `/images/templates/${templateId}.png`;

  if (hasError) {
    return (
      <div
        className={cn(
          "relative flex h-36 w-full items-center justify-center overflow-hidden rounded-xl bg-[#141824] border border-[#232a3d] text-zinc-400 text-xs select-none p-3",
          className,
        )}
      >
        <span className="font-semibold text-zinc-500">{alt || templateId}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex h-36 w-full overflow-hidden rounded-xl bg-[#141824] border border-[#232a3d] select-none shadow-sm",
        className,
      )}
    >
      <img
        src={imageSrc}
        alt={alt || templateId}
        loading="lazy"
        onError={() => setHasError(true)}
        className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.02]"
      />
    </div>
  );
}
