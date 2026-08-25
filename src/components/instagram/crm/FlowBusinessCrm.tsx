import { ExternalLink, Flame, Search, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type {
  FlowBusinessCadence,
  FlowBusinessCard,
  FlowBusinessStage,
} from "@/services/flow-business";

const STAGES: Array<{ id: FlowBusinessStage; label: string }> = [
  { id: "novo", label: "Novos" },
  { id: "analisando", label: "Analisando" },
  { id: "aquecendo", label: "Aquecendo" },
  { id: "pronto_abordar", label: "Prontos" },
  { id: "abordado", label: "Abordados" },
  { id: "respondeu", label: "Responderam" },
  { id: "qualificado", label: "Qualificados" },
  { id: "proposta", label: "Proposta" },
  { id: "cliente", label: "Clientes" },
  { id: "perdido", label: "Perdidos" },
];

export function FlowBusinessCrm({
  cards,
  cadences,
  onMove,
  onStartCadence,
}: {
  cards: FlowBusinessCard[];
  cadences: FlowBusinessCadence[];
  onMove: (cardId: string, stage: FlowBusinessStage) => Promise<void>;
  onStartCadence: (cardId: string, cadenceId: string) => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [temperature, setTemperature] = useState("all");
  const normalized = query.trim().toLocaleLowerCase("pt-BR");
  const filtered = useMemo(
    () =>
      cards.filter(
        (card) =>
          (temperature === "all" || card.temperature === temperature) &&
          (!normalized ||
            [card.businessName, card.username, card.category, card.city]
              .join(" ")
              .toLocaleLowerCase("pt-BR")
              .includes(normalized)),
      ),
    [cards, normalized, temperature],
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
        <div className="relative min-w-64 flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar oportunidade"
            className="pl-9"
          />
        </div>
        <Select value={temperature} onValueChange={setTemperature}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas temperaturas</SelectItem>
            <SelectItem value="quente">Quentes</SelectItem>
            <SelectItem value="morno">Mornos</SelectItem>
            <SelectItem value="frio">Frios</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{filtered.length} oportunidades</span>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="flex min-w-max gap-4">
          {STAGES.map((stage) => {
            const stageCards = filtered.filter((card) => card.stage === stage.id);
            return (
              <section
                key={stage.id}
                className="w-80 shrink-0 rounded-2xl border border-border bg-muted/30"
              >
                <header className="flex items-center justify-between border-b border-border px-4 py-3">
                  <h3 className="text-sm font-semibold">{stage.label}</h3>
                  <span className="rounded-full bg-background px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
                    {stageCards.length}
                  </span>
                </header>
                <div className="max-h-[calc(100vh-270px)] min-h-40 space-y-3 overflow-y-auto p-3">
                  {stageCards.map((card) => (
                    <CrmCard
                      key={card.id}
                      card={card}
                      cadences={cadences}
                      onMove={onMove}
                      onStartCadence={onStartCadence}
                    />
                  ))}
                  {!stageCards.length ? (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      Nenhuma oportunidade
                    </div>
                  ) : null}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CrmCard({
  card,
  cadences,
  onMove,
  onStartCadence,
}: {
  card: FlowBusinessCard;
  cadences: FlowBusinessCadence[];
  onMove: (cardId: string, stage: FlowBusinessStage) => Promise<void>;
  onStartCadence: (cardId: string, cadenceId: string) => Promise<void>;
}) {
  return (
    <article className="rounded-xl border border-border bg-card p-3 shadow-sm">
      <div className="flex items-start gap-3">
        <Avatar className="size-9">
          <AvatarImage src={card.profilePictureUrl ?? undefined} />
          <AvatarFallback>{card.businessName.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{card.fullName || card.businessName}</p>
          <p className="truncate text-xs text-muted-foreground">
            {card.username ? `@${card.username}` : card.category || "Instagram"}
          </p>
        </div>
        <span
          title={card.temperature}
          className={cn(
            "flex size-7 items-center justify-center rounded-lg",
            card.temperature === "quente"
              ? "bg-destructive/10 text-destructive"
              : card.temperature === "morno"
                ? "bg-warning/10 text-warning"
                : "bg-muted text-muted-foreground",
          )}
        >
          <Flame className="size-3.5" />
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>{[card.city, card.state].filter(Boolean).join("/") || "Local não informado"}</span>
        <span className="font-semibold tabular-nums text-foreground">Score {card.score ?? 0}</span>
      </div>
      <div className="mt-3 space-y-2 border-t border-border pt-3">
        <Select
          value={card.stage}
          onValueChange={(value) => void onMove(card.id, value as FlowBusinessStage)}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STAGES.map((stage) => (
              <SelectItem key={stage.id} value={stage.id}>
                {stage.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          {card.instagramUrl ? (
            <Button size="sm" variant="outline" className="flex-1" asChild>
              <a href={card.instagramUrl} target="_blank" rel="noreferrer">
                Perfil <ExternalLink className="size-3" />
              </a>
            </Button>
          ) : null}
          <Select onValueChange={(cadenceId) => void onStartCadence(card.id, cadenceId)}>
            <SelectTrigger className="h-9 flex-1 text-xs">
              <SelectValue placeholder="Cadência" />
            </SelectTrigger>
            <SelectContent>
              {cadences
                .filter((cadence) => cadence.isActive)
                .map((cadence) => (
                  <SelectItem key={cadence.id} value={cadence.id}>
                    {cadence.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </article>
  );
}

export function FlowBusinessCrmEmpty() {
  return (
    <div className="rounded-2xl border border-dashed border-border p-12 text-center">
      <Users className="mx-auto size-9 text-muted-foreground/50" />
      <p className="mt-3 font-medium">Sua operação começa na descoberta</p>
    </div>
  );
}
