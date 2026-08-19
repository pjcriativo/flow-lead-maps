import type { ComponentProps } from "react";
import { Info, ShieldCheck, Sparkles, Target, TrendingUp, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { InstagramScoreDimension, InstagramScoreV2Result } from "@/lib/instagram-score-v2";
import { cn } from "@/lib/utils";

export type InstagramScoreSort = InstagramScoreDimension | "total";

const DIMENSIONS = [
  { key: "intent", label: "Intenção", icon: Target },
  { key: "fit", label: "Aderência", icon: UsersRound },
  { key: "activity", label: "Atividade", icon: TrendingUp },
  { key: "authenticity", label: "Autenticidade", icon: ShieldCheck },
] as const;

interface InstagramScoreBarsProps extends ComponentProps<"div"> {
  score: InstagramScoreV2Result;
  compact?: boolean;
}

export function InstagramScoreBars({
  score,
  compact = false,
  className,
  ...props
}: InstagramScoreBarsProps) {
  return (
    <div className={cn("space-y-2", className)} data-slot="instagram-score-bars" {...props}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs font-medium">
          <Sparkles className="size-3.5 text-primary" /> Score Instagram v2
        </span>
        <Badge variant={score.total >= 80 ? "default" : "secondary"}>{score.total}/100</Badge>
      </div>
      <div className={cn("grid gap-2", compact ? "grid-cols-2" : "sm:grid-cols-2")}>
        {DIMENSIONS.map(({ key, label, icon: Icon }) => (
          <div key={key} className="rounded-lg border border-border bg-muted/20 p-2">
            <div className="mb-1 flex items-center justify-between gap-2 text-[11px]">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Icon className="size-3" /> {label}
              </span>
              <strong>{score.scores[key]}</strong>
            </div>
            <Progress value={score.scores[key]} className="h-1" />
          </div>
        ))}
      </div>
      {!compact ? (
        <details className="group rounded-lg border border-border bg-muted/20 p-2.5 text-xs">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Info className="size-3.5 text-primary" /> Por que recebeu esta nota?
          </summary>
          <p className="mt-2 text-muted-foreground">{score.explanation}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {score.strengths.map((item) => (
              <Badge key={item} variant="secondary">
                {item}
              </Badge>
            ))}
            {score.risks.map((item) => (
              <Badge key={item} variant="outline">
                atenção: {item}
              </Badge>
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}

interface InstagramScoreControlsProps extends ComponentProps<"div"> {
  sort: InstagramScoreSort;
  minScore: number;
  onSortChange: (sort: InstagramScoreSort) => void;
  onMinScoreChange: (score: number) => void;
}

export function InstagramScoreControls({
  sort,
  minScore,
  onSortChange,
  onMinScoreChange,
  className,
  ...props
}: InstagramScoreControlsProps) {
  return (
    <div
      className={cn("flex flex-wrap items-center gap-2", className)}
      data-slot="instagram-score-controls"
      {...props}
    >
      <Select
        value={sort}
        onValueChange={(value) => {
          if (
            value === "total" ||
            value === "intent" ||
            value === "fit" ||
            value === "activity" ||
            value === "authenticity"
          ) {
            onSortChange(value);
          }
        }}
      >
        <SelectTrigger className="w-44" aria-label="Ordenar perfis pelo score">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="total">Maior score total</SelectItem>
          <SelectItem value="intent">Maior intenção</SelectItem>
          <SelectItem value="fit">Maior aderência</SelectItem>
          <SelectItem value="activity">Maior atividade</SelectItem>
          <SelectItem value="authenticity">Maior autenticidade</SelectItem>
        </SelectContent>
      </Select>
      <Select value={String(minScore)} onValueChange={(value) => onMinScoreChange(Number(value))}>
        <SelectTrigger className="w-40" aria-label="Filtrar score mínimo">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="0">Qualquer score</SelectItem>
          <SelectItem value="45">Score mínimo 45</SelectItem>
          <SelectItem value="65">Score mínimo 65</SelectItem>
          <SelectItem value="80">Score mínimo 80</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
