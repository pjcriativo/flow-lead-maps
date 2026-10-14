import { Check, Eye, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CorporateSignatureItem, SignatureData } from "@/types/templates";
import { renderSignatureHtml } from "./templates-data";

interface SignatureCardProps {
  signature: CorporateSignatureItem;
  signatureData: SignatureData;
  isPadrao: boolean;
  isFavorito: boolean;
  onToggleFavorito: (id: string) => void;
  onPreview: (signature: CorporateSignatureItem) => void;
  onSetDefault: (signature: CorporateSignatureItem) => void;
}

export function SignatureCard({
  signature,
  signatureData,
  isPadrao,
  isFavorito,
  onToggleFavorito,
  onPreview,
  onSetDefault,
}: SignatureCardProps) {
  const renderedHtml = renderSignatureHtml(signature.htmlTemplate, signatureData);

  return (
    <div className="group flex flex-col justify-between rounded-2xl border border-zinc-800/80 bg-[#12141a] p-3 transition-all duration-200 hover:border-zinc-700 hover:shadow-xl hover:shadow-black/40">
      {/* Miniatura renderizada da Assinatura */}
      <div
        onClick={() => onPreview(signature)}
        className="relative mb-3 flex h-36 w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-white p-3 text-zinc-900 border border-zinc-200 select-none shadow-sm"
      >
        <div
          className="scale-[0.88] origin-left pointer-events-none w-full"
          dangerouslySetInnerHTML={{ __html: renderedHtml }}
        />
        {isPadrao && (
          <div className="absolute top-2 right-2 flex items-center gap-1 rounded-md bg-emerald-500/90 px-2 py-0.5 text-[9px] font-bold text-white shadow-sm">
            <Check className="size-3 stroke-[3]" />
            <span>Padrão</span>
          </div>
        )}
      </div>

      {/* Detalhes da Assinatura */}
      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <h3 className="truncate text-[13.5px] font-bold text-white group-hover:text-zinc-100">
              {signature.nome}
            </h3>
            <span className="shrink-0 rounded-md border border-zinc-700/60 bg-zinc-800/80 px-2 py-0.5 text-[10px] font-semibold text-zinc-300">
              {signature.badgeLabel}
            </span>
          </div>

          <button
            type="button"
            aria-label={isFavorito ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorito(signature.id);
            }}
            className={cn(
              "shrink-0 p-1 text-zinc-500 transition-colors hover:text-amber-400",
              isFavorito && "text-amber-400",
            )}
          >
            <Star
              className={cn(
                "size-4",
                isFavorito ? "fill-amber-400 text-amber-400" : "text-zinc-500",
              )}
            />
          </button>
        </div>

        <p className="mt-1.5 h-9 line-clamp-2 text-xs leading-relaxed text-zinc-400">
          {signature.descricao}
        </p>

        {/* Botões de Ação */}
        <div className="mt-3.5 flex items-center gap-2 pt-1 border-t border-zinc-800/60">
          <button
            type="button"
            onClick={() => onPreview(signature)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-zinc-700/80 bg-zinc-800/50 py-2 px-3 text-xs font-semibold text-zinc-200 transition-all hover:bg-zinc-800 hover:text-white"
          >
            <Eye className="size-3.5" />
            <span>Prévia</span>
          </button>

          <button
            type="button"
            onClick={() => onSetDefault(signature)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1 rounded-xl py-2 px-3 text-xs font-bold transition-all",
              isPadrao
                ? "bg-emerald-950/70 text-emerald-400 border border-emerald-800/60 hover:bg-emerald-900/80"
                : "bg-[#ff6200] hover:bg-[#e65800] text-white active:scale-[0.98]",
            )}
          >
            <span>{isPadrao ? "Assinatura ativa" : "Definir padrão"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
