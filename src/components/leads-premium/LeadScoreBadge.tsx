import { cn } from "@/lib/utils";

interface LeadScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LeadScoreBadge({ score, size = "md", className }: LeadScoreBadgeProps) {
  // Cores de acordo com as faixas do layout aprovado:
  // >= 80: Verde esmeralda (#00c968)
  // 70-79: Âmbar/Dourado (#f59e0b)
  // 60-69: Laranja (#ff6200)
  // < 60: Âmbar escuro/laranja queimado
  const getColorClasses = (val: number) => {
    if (val >= 80) {
      return "border-emerald-500/80 text-emerald-400 bg-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.15)]";
    }
    if (val >= 70) {
      return "border-amber-500/80 text-amber-400 bg-amber-500/10 shadow-[0_0_10px_rgba(245,158,11,0.15)]";
    }
    if (val >= 60) {
      return "border-orange-500/80 text-orange-400 bg-orange-500/10 shadow-[0_0_10px_rgba(255,98,0,0.15)]";
    }
    return "border-amber-600/80 text-amber-500 bg-amber-600/10 shadow-[0_0_10px_rgba(217,119,6,0.15)]";
  };

  const sizeClasses = {
    sm: "size-6 text-[10px]",
    md: "size-7 text-[11px]",
    lg: "size-8 text-xs",
  };

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border-2 font-bold leading-none transition-transform",
        getColorClasses(score),
        sizeClasses[size],
        className,
      )}
      title={`Score: ${score}`}
    >
      {score}
    </span>
  );
}

export function LeadScoreDonut({
  score,
  label = "Alto potencial",
  description = "Empresa com alta relevância, boa presença digital e forte potencial de conversão.",
  className,
}: {
  score: number;
  label?: string;
  description?: string;
  className?: string;
}) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const strokeColor =
    score >= 80 ? "#10b981" : score >= 70 ? "#f59e0b" : score >= 60 ? "#ff6200" : "#ea580c";

  const textColor =
    score >= 80
      ? "text-emerald-400"
      : score >= 70
        ? "text-amber-400"
        : score >= 60
          ? "text-orange-400"
          : "text-orange-500";

  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-xl border border-home-border bg-home-surface/60 p-3.5",
        className,
      )}
    >
      <div className="relative flex size-18 shrink-0 items-center justify-center">
        <svg className="size-18 -rotate-90 transform" viewBox="0 0 72 72">
          {/* Fundo do anel */}
          <circle cx="36" cy="36" r={radius} stroke="#172531" strokeWidth="5" fill="transparent" />
          {/* Barra de progresso do score */}
          <circle
            cx="36"
            cy="36"
            r={radius}
            stroke={strokeColor}
            strokeWidth="5"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <span className="absolute text-base font-bold text-white tracking-tight">{score}</span>
      </div>

      <div className="min-w-0 flex-1">
        <h4 className={cn("text-xs font-bold leading-tight", textColor)}>{label}</h4>
        <p className="mt-1 text-[11px] leading-relaxed text-home-muted line-clamp-2">
          {description}
        </p>
      </div>
    </div>
  );
}
