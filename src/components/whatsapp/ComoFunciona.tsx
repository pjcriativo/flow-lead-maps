// Ajuda autoexplicativa por tela: bullets curtos, um por recurso, para o dono não precisar
// perguntar "o que esse botão faz?". Recolhível e com memória (localStorage) — explica uma vez,
// some quando não é mais preciso, e continua a um clique de distância.
import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ItemAjuda = {
  /** o recurso (aparece em negrito) — use o MESMO rótulo do botão na tela */
  termo: string;
  /** o que ele faz, em uma frase, na língua do dono */
  texto: string;
};

const chave = (id: string) => `ajuda:${id}`;

export function ComoFunciona({
  id,
  titulo = "Como funciona esta tela",
  resumo = "entenda em 15 segundos",
  itens,
}: {
  /** identificador estável — guarda aberto/fechado por tela */
  id: string;
  titulo?: string;
  resumo?: string;
  itens: ItemAjuda[];
}) {
  const [aberto, setAberto] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem(chave(id)) !== "0"; // nasce aberto; respeita quem fechou
  });

  const alternar = () => {
    setAberto((a) => {
      const novo = !a;
      try {
        window.localStorage.setItem(chave(id), novo ? "1" : "0");
      } catch {
        /* modo privado: só não lembra */
      }
      return novo;
    });
  };

  return (
    <div className="rounded-xl border border-border bg-muted/40">
      <button
        type="button"
        onClick={alternar}
        aria-expanded={aberto}
        className="flex w-full items-center gap-2 px-3 py-2 text-left"
      >
        <HelpCircle className="h-4 w-4 shrink-0 text-primary" />
        <span className="text-sm font-medium">{titulo}</span>
        <span className="text-xs text-muted-foreground">· {resumo}</span>
        <ChevronDown
          className={cn(
            "ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            aberto && "rotate-180",
          )}
        />
      </button>

      {aberto && (
        <ul className="grid gap-x-6 gap-y-1.5 px-3 pb-3 pt-0.5 sm:grid-cols-2">
          {itens.map((i) => (
            <li key={i.termo} className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
              <span>
                <b className="font-medium text-foreground">{i.termo}</b> — {i.texto}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
