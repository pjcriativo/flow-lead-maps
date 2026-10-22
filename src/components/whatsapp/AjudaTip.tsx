import { CircleHelp } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AJUDA_WA, type AjudaWa, type AjudaWaId } from "./ajuda-whatsapp";

// Bolinha "?" com explicação clara: abre ao passar o mouse, focar (teclado) ou tocar (celular).
export function AjudaTip({ id }: { id: AjudaWaId }) {
  const ajuda: AjudaWa = AJUDA_WA[id];
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Ajuda: ${ajuda.titulo}`}
          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/15 text-home-muted transition-colors hover:border-home-orange/50 hover:text-home-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-home-orange"
        >
          <CircleHelp className="h-3 w-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-80 max-w-[calc(100vw-2rem)] space-y-2 border border-white/10 bg-[#121724] p-3 text-xs leading-relaxed text-white"
      >
        <p className="text-sm font-bold">{ajuda.titulo}</p>
        <div>
          <p className="font-semibold text-home-orange">Como funciona</p>
          <p className="text-white/80">{ajuda.comoFunciona}</p>
        </div>
        {ajuda.comoConfigurar && (
          <div>
            <p className="font-semibold text-home-orange">Como configurar</p>
            <ol className="list-decimal space-y-0.5 pl-4 text-white/80">
              {ajuda.comoConfigurar.map((passo) => (
                <li key={passo}>{passo}</li>
              ))}
            </ol>
          </div>
        )}
        {ajuda.atencao && (
          <p className="rounded-md bg-amber-500/10 p-2 text-amber-200">
            <span className="font-semibold">Atenção: </span>
            {ajuda.atencao}
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}
