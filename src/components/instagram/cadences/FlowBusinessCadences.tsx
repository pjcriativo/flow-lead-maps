import { CheckCircle2, Clock3, LockKeyhole, Plus, Route } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type {
  FlowBusinessAction,
  FlowBusinessCadence,
  FlowBusinessPlan,
} from "@/services/flow-business";

const TEMPLATE: Array<{
  position: number;
  dayOffset: number;
  actionType: FlowBusinessAction;
  title: string;
  instructions: string;
}> = [
  {
    position: 1,
    dayOffset: 0,
    actionType: "analyze",
    title: "Analisar oportunidade",
    instructions: "Valide o fit e encontre um gancho real.",
  },
  {
    position: 2,
    dayOffset: 1,
    actionType: "visit_profile",
    title: "Visitar o perfil",
    instructions: "Observe oferta, posicionamento e conteúdo recente.",
  },
  {
    position: 3,
    dayOffset: 2,
    actionType: "follow",
    title: "Seguir quando fizer sentido",
    instructions: "Ação manual, apenas quando houver aderência.",
  },
  {
    position: 4,
    dayOffset: 3,
    actionType: "like",
    title: "Interagir com conteúdo",
    instructions: "Curta manualmente um conteúdo relevante.",
  },
  {
    position: 5,
    dayOffset: 5,
    actionType: "send_dm",
    title: "Abordagem personalizada",
    instructions: "Envie manualmente uma mensagem contextual.",
  },
  {
    position: 6,
    dayOffset: 8,
    actionType: "follow_up",
    title: "Acompanhar resposta",
    instructions: "Faça follow-up apenas dentro de um contexto permitido.",
  },
];

export function FlowBusinessCadences({
  cadences,
  plan,
  onCreate,
}: {
  cadences: FlowBusinessCadence[];
  plan: FlowBusinessPlan;
  onCreate: (input: { name: string; description: string; steps: typeof TEMPLATE }) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const atLimit = plan.used.cadences >= plan.limits.cadences;

  const create = async () => {
    setSaving(true);
    try {
      await onCreate({ name, description, steps: TEMPLATE });
      setOpen(false);
      setName("");
      setDescription("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
        <div>
          <h2 className="text-lg font-semibold">Cadências de aquecimento</h2>
          <p className="text-sm text-muted-foreground">
            Rotinas assistidas, mensuráveis e seguras para transformar interesse em conversa.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {plan.used.cadences}/{plan.limits.cadences} no plano
          </span>
          <Button disabled={atLimit} onClick={() => setOpen(true)}>
            <Plus className="size-4" /> Nova cadência
          </Button>
        </div>
      </div>

      {atLimit ? (
        <div className="flex items-center gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm">
          <LockKeyhole className="size-4 text-warning" /> O limite de cadências do plano foi
          atingido. As já criadas continuam funcionando.
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-2">
        {cadences.map((cadence) => (
          <article
            key={cadence.id}
            className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{cadence.name}</h3>
                  {cadence.isSystem ? (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      MODELO FLOW
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {cadence.description || "Sem descrição"}
                </p>
              </div>
              <span className="flex size-9 items-center justify-center rounded-xl bg-success/10 text-success">
                <Route className="size-4" />
              </span>
            </div>
            <div className="mt-5 space-y-3">
              {cadence.steps.map((step) => (
                <div
                  key={step.id}
                  className="grid grid-cols-[44px_1fr_auto] items-start gap-3 rounded-xl border border-border p-3"
                >
                  <span className="rounded-lg bg-muted px-2 py-1 text-center text-xs font-semibold">
                    D{step.dayOffset}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{step.title}</p>
                    <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                      {step.instructions}
                    </p>
                  </div>
                  {step.isManual ? (
                    <span title="Ação manual">
                      <CheckCircle2 className="size-4 text-success" />
                    </span>
                  ) : (
                    <Clock3 className="size-4 text-muted-foreground" />
                  )}
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Nova cadência assistida</DialogTitle>
            <DialogDescription>
              O modelo cria seis ações distribuídas em oito dias. Seguir, curtir e abordar continuam
              sob decisão humana.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cadence-name">Nome</Label>
              <Input
                id="cadence-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-1.5"
                placeholder="Ex.: Agências de marketing"
              />
            </div>
            <div>
              <Label htmlFor="cadence-description">Objetivo</Label>
              <Textarea
                id="cadence-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="mt-1.5"
                placeholder="Descreva o público e a abordagem"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button disabled={!name.trim() || saving} onClick={() => void create()}>
              {saving ? "Criando..." : "Criar cadência"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
