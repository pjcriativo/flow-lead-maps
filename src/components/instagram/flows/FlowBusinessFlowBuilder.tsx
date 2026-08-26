import {
  Bot,
  ChevronDown,
  ChevronUp,
  CirclePlay,
  LockKeyhole,
  Plus,
  Save,
  Trash2,
  Workflow,
} from "lucide-react";
import { useState, type Dispatch, type SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  FlowBusinessAccount,
  FlowBusinessFlow,
  FlowBusinessFlowDraft,
  FlowBusinessNode,
  FlowBusinessPlan,
  FlowNodeSubtype,
} from "@/services/flow-business";

const TRIGGERS = [{ value: "comment_keyword", label: "Palavra-chave em comentário" }];

const ACTIONS: Array<{
  subtype: FlowNodeSubtype;
  label: string;
  nodeType: FlowBusinessNode["nodeType"];
}> = [
  { subtype: "send_message", label: "Enviar mensagem", nodeType: "action" },
  { subtype: "add_tag", label: "Adicionar tag", nodeType: "action" },
  { subtype: "move_crm", label: "Mover no CRM", nodeType: "action" },
  { subtype: "create_task", label: "Criar tarefa", nodeType: "action" },
];

const EMPTY_DRAFT: FlowBusinessFlowDraft = {
  name: "",
  description: "",
  accountId: null,
  triggerType: "comment_keyword",
  keyword: "",
  nodes: [],
};

export function FlowBusinessFlowBuilder({
  flows,
  accounts,
  plan,
  onSave,
  onPublish,
}: {
  flows: FlowBusinessFlow[];
  accounts: FlowBusinessAccount[];
  plan: FlowBusinessPlan;
  onSave: (draft: FlowBusinessFlowDraft) => Promise<string>;
  onPublish: (flowId: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState<FlowBusinessFlowDraft>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [actionToAdd, setActionToAdd] = useState<FlowNodeSubtype>("send_message");
  const atLimit = !draft.id && plan.used.flows >= plan.limits.flows;
  const connectedAccounts = accounts.filter(
    (account) => account.provider === "session_worker" && account.status === "conectado",
  );
  const messageNodeCount = draft.nodes.filter((node) => node.subtype === "send_message").length;
  const hasCompleteMessage = draft.nodes.some(
    (node) => node.subtype === "send_message" && String(node.config.text ?? "").trim().length > 0,
  );
  const canPublish =
    Boolean(draft.name.trim()) &&
    Boolean(draft.accountId) &&
    Boolean(draft.keyword.trim()) &&
    messageNodeCount === 1 &&
    hasCompleteMessage &&
    !atLimit;

  const editFlow = (flow: FlowBusinessFlow) =>
    setDraft({
      id: flow.id,
      name: flow.name,
      description: flow.description ?? "",
      accountId: flow.accountId,
      triggerType: "comment_keyword",
      keyword: typeof flow.triggerConfig.keyword === "string" ? flow.triggerConfig.keyword : "",
      nodes: flow.nodes.map(({ id: _id, ...node }) => node),
    });

  const addAction = () => {
    const action = ACTIONS.find((item) => item.subtype === actionToAdd);
    if (!action) return;
    if (action.subtype === "send_message" && messageNodeCount >= 1) return;
    if (action.subtype === "send_message") setActionToAdd("add_tag");
    setDraft((current) => ({
      ...current,
      nodes: [
        ...current.nodes,
        {
          nodeType: action.nodeType,
          subtype: action.subtype,
          label: action.label,
          config: {},
          positionX: 0,
          positionY: (current.nodes.length + 1) * 160,
        },
      ],
    }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const id = await onSave(draft);
      setDraft((current) => ({ ...current, id }));
      return id;
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    setPublishing(true);
    try {
      const id = await save();
      await onPublish(id);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="space-y-3">
        <Button
          className="w-full"
          disabled={plan.limits.flows === 0 || atLimit}
          onClick={() => setDraft({ ...EMPTY_DRAFT })}
        >
          <Plus className="size-4" /> Novo fluxo
        </Button>
        {plan.limits.flows === 0 ? (
          <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-xs leading-5">
            <LockKeyhole className="mb-2 size-4 text-warning" />O Flow Builder está disponível a
            partir do plano Pro.
          </div>
        ) : null}
        <div className="space-y-2">
          {flows.map((flow) => (
            <button
              key={flow.id}
              type="button"
              onClick={() => editFlow(flow)}
              className="w-full rounded-xl border border-border bg-card p-3 text-left transition hover:border-primary/40"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium">{flow.name}</span>
                <span
                  className={
                    flow.status === "active"
                      ? "rounded-full bg-success/10 px-2 py-0.5 text-[9px] font-semibold text-success"
                      : "rounded-full bg-muted px-2 py-0.5 text-[9px] font-semibold text-muted-foreground"
                  }
                >
                  {flow.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                v{flow.version} ·{" "}
                {TRIGGERS.find((item) => item.value === flow.triggerType)?.label ||
                  flow.triggerType}
              </p>
            </button>
          ))}
        </div>
      </aside>

      <section className="rounded-3xl border border-border bg-card shadow-[var(--shadow-card)]">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
          <div>
            <div className="flex items-center gap-2">
              <Workflow className="size-5 text-instagram-pink" />
              <h2 className="text-lg font-semibold">Construtor de fluxos</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Monte respostas e ações automáticas em uma sequência simples.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={saving || !draft.name.trim() || atLimit}
              onClick={() => void save()}
            >
              <Save className="size-4" /> Salvar
            </Button>
            <Button disabled={publishing || !canPublish} onClick={() => void publish()}>
              <CirclePlay className="size-4" /> Publicar
            </Button>
          </div>
        </header>

        <div className="grid gap-6 p-5 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="space-y-4">
            <div>
              <Label htmlFor="flow-name">Nome do fluxo</Label>
              <Input
                id="flow-name"
                value={draft.name}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, name: event.target.value }))
                }
                className="mt-1.5"
                placeholder="Ex.: Comentário QUERO"
              />
            </div>
            <div>
              <Label htmlFor="flow-description">Objetivo</Label>
              <Textarea
                id="flow-description"
                value={draft.description}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, description: event.target.value }))
                }
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Conta conectada</Label>
              <Select
                value={draft.accountId ?? "none"}
                onValueChange={(value) =>
                  setDraft((current) => ({
                    ...current,
                    accountId: value === "none" ? null : value,
                  }))
                }
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Selecione para publicar</SelectItem>
                  {connectedAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.username ? `@${account.username}` : account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Gatilho</Label>
              <Select
                value={draft.triggerType}
                onValueChange={(value) =>
                  setDraft((current) => ({ ...current, triggerType: value }))
                }
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGERS.map((trigger) => (
                    <SelectItem key={trigger.value} value={trigger.value}>
                      {trigger.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="flow-keyword">Palavra-chave</Label>
              <Input
                id="flow-keyword"
                value={draft.keyword}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, keyword: event.target.value }))
                }
                className="mt-1.5"
                placeholder="QUERO"
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                A palavra ou frase precisa aparecer completa no comentário.
              </p>
            </div>
            <div className="rounded-xl border border-border p-3">
              <p className="text-xs font-medium">Adicionar etapa</p>
              <div className="mt-2 flex gap-2">
                <Select
                  value={actionToAdd}
                  onValueChange={(value) => setActionToAdd(value as FlowNodeSubtype)}
                >
                  <SelectTrigger className="min-w-0 flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIONS.filter(
                      (action) => action.subtype !== "send_message" || messageNodeCount === 0,
                    ).map((action) => (
                      <SelectItem key={action.subtype} value={action.subtype}>
                        {action.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="icon" variant="secondary" onClick={addAction}>
                  <Plus className="size-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-4 sm:p-6">
            <FlowStep
              icon={Bot}
              title={`Quando: ${TRIGGERS.find((trigger) => trigger.value === draft.triggerType)?.label || "Evento"}`}
              detail={
                draft.keyword ? `Palavra-chave: ${draft.keyword}` : "Entrada recebida pelo perfil"
              }
            />
            {draft.nodes.map((node, index) => (
              <div key={`${node.subtype}-${index}`}>
                <div className="mx-auto h-6 w-px bg-border" />
                <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <span className="text-xs font-semibold">{index + 1}</span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <Input
                        value={node.label}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            nodes: current.nodes.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, label: event.target.value } : item,
                            ),
                          }))
                        }
                        className="h-8 border-0 bg-transparent px-0 font-medium shadow-none focus-visible:ring-0"
                      />
                      <p className="text-xs text-muted-foreground">
                        {node.subtype.replaceAll("_", " ")}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={index === 0}
                        onClick={() =>
                          setDraft((current) => ({
                            ...current,
                            nodes: move(current.nodes, index, index - 1),
                          }))
                        }
                      >
                        <ChevronUp className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={index === draft.nodes.length - 1}
                        onClick={() =>
                          setDraft((current) => ({
                            ...current,
                            nodes: move(current.nodes, index, index + 1),
                          }))
                        }
                      >
                        <ChevronDown className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() =>
                          setDraft((current) => ({
                            ...current,
                            nodes: current.nodes.filter((_, itemIndex) => itemIndex !== index),
                          }))
                        }
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                  {node.subtype === "send_message" ? (
                    <Textarea
                      value={typeof node.config.text === "string" ? node.config.text : ""}
                      onChange={(event) =>
                        updateNodeConfig(setDraft, index, "text", event.target.value)
                      }
                      className="mt-3"
                      placeholder="Mensagem enviada dentro da janela permitida"
                    />
                  ) : null}
                  {node.subtype === "add_tag" ? (
                    <Input
                      value={typeof node.config.tag === "string" ? node.config.tag : ""}
                      onChange={(event) =>
                        updateNodeConfig(setDraft, index, "tag", event.target.value)
                      }
                      className="mt-3"
                      placeholder="Tag adicionada ao contato"
                    />
                  ) : null}
                  {node.subtype === "move_crm" ? (
                    <Select
                      value={
                        typeof node.config.stage === "string" ? node.config.stage : "respondeu"
                      }
                      onValueChange={(value) => updateNodeConfig(setDraft, index, "stage", value)}
                    >
                      <SelectTrigger className="mt-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="respondeu">Respondeu</SelectItem>
                        <SelectItem value="qualificado">Qualificado</SelectItem>
                        <SelectItem value="proposta">Proposta</SelectItem>
                        <SelectItem value="cliente">Cliente</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : null}
                  {node.subtype === "create_task" ? (
                    <Textarea
                      value={
                        typeof node.config.instructions === "string" ? node.config.instructions : ""
                      }
                      onChange={(event) =>
                        updateNodeConfig(setDraft, index, "instructions", event.target.value)
                      }
                      className="mt-3"
                      placeholder="Instruções da tarefa para o time"
                    />
                  ) : null}
                </div>
              </div>
            ))}
            {!draft.nodes.length ? (
              <div className="mt-6 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Adicione a primeira etapa do fluxo.
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}

function FlowStep({
  icon: Icon,
  title,
  detail,
}: {
  icon: typeof Bot;
  title: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-instagram-pink/25 bg-card p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-lg bg-instagram-pink/10 text-instagram-pink">
          <Icon className="size-4" />
        </span>
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">{detail}</p>
        </div>
      </div>
    </div>
  );
}

function move<T>(items: T[], from: number, to: number): T[] {
  const next = [...items];
  const [item] = next.splice(from, 1);
  if (item !== undefined) next.splice(to, 0, item);
  return next;
}

function updateNodeConfig(
  setDraft: Dispatch<SetStateAction<FlowBusinessFlowDraft>>,
  index: number,
  key: string,
  value: string,
) {
  setDraft((current) => ({
    ...current,
    nodes: current.nodes.map((item, itemIndex) =>
      itemIndex === index ? { ...item, config: { ...item.config, [key]: value } } : item,
    ),
  }));
}
