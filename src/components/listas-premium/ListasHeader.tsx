// Cabeçalho da Central de Listas Premium com ambient glow e background fotográfico aprovado
import { cn } from "@/lib/utils";

interface ListasHeaderProps {
  className?: string;
}

export function ListasHeader({ className }: ListasHeaderProps) {
  return (
    <div className={cn("relative overflow-hidden pt-1 pb-3", className)}>
      {/* Background Hero com montanhas e glow âmbar ao fundo conforme referência visual */}
      <div className="pointer-events-none absolute -top-12 -right-4 h-56 w-[560px] opacity-45 mix-blend-screen select-none md:h-64 md:w-[720px]">
        <img
          src="/auth-hero.png"
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover object-right"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-home-background/60 to-home-background" />
        <div className="absolute inset-0 bg-gradient-to-t from-home-background via-transparent to-transparent" />
        <div className="absolute -top-10 right-20 h-40 w-40 rounded-full bg-amber-500/20 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-3xl">
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Minhas Listas
        </h1>
        <p className="mt-1 text-xs text-home-muted sm:text-sm leading-relaxed">
          Seu centro de comando para organizar listas de prospecção, definir a estratégia comercial e conectar com campanhas.
        </p>
      </div>
    </div>
  );
}
