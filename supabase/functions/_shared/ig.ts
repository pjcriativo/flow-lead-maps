import { resolverChave } from "./chaves.ts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Admin = any;

let _evoBaseCache: string | null = null;
let _evoKeyCache: string | null = null;

export async function inicializarCofreIg(admin: Admin): Promise<void> {
  _evoBaseCache = await resolverChave(admin, "EVOLUTION_URL");
  _evoKeyCache = await resolverChave(admin, "EVOLUTION_API_KEY");
}

export function evoBase(): string {
  return (_evoBaseCache ?? Deno.env.get("EVOLUTION_URL") ?? "").replace(/\/+$/, "");
}
export function evoGlobalKey(): string {
  return _evoKeyCache ?? Deno.env.get("EVOLUTION_API_KEY") ?? "";
}

export type IgInstanciaOrg = {
  id: string;
  nome: string;
  token: string;
  username_ig: string | null;
  status: string;
};

async function criarNaEvolution(nome: string): Promise<string | null> {
  const token = crypto.randomUUID();
  const c = await fetch(`${evoBase()}/instance/create`, {
    method: "POST",
    headers: { apikey: evoGlobalKey(), "Content-Type": "application/json" },
    // Evolution API aceita integration para diferenciar WABaileys, WABusiness, INSTAGRAM, etc.
    body: JSON.stringify({ instanceName: nome, token, integration: "INSTAGRAM" }),
  });
  if (!c.ok) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cj: any = await c.json().catch(() => ({}));
  return cj.hash?.token || cj.instance?.token || token;
}

export async function resolverInstanciaIg(
  admin: Admin,
  orgId: string,
  criarSeFaltar = true,
): Promise<IgInstanciaOrg | null> {
  if (!evoBase() || !evoGlobalKey()) return null;

  const { data: row } = await admin
    .from("ig_instancias")
    .select("id, nome, username_ig, status")
    .eq("org_id", orgId)
    .order("criada_em", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (row) {
    const { data: tk } = await admin
      .from("ig_instancia_tokens")
      .select("token")
      .eq("instancia_id", row.id)
      .maybeSingle();
    if (tk?.token) {
      return { ...row, token: tk.token };
    }
  }

  if (!criarSeFaltar) return null;

  const nome = `ig-${orgId.slice(0, 8)}-${crypto.randomUUID().replace(/-/g, "").slice(0, 4)}`;
  const token = await criarNaEvolution(nome);
  if (!token) return null;

  const { data: nova, error } = await admin
    .from("ig_instancias")
    .insert({ org_id: orgId, nome, status: "desconectado" })
    .select("id, nome, username_ig, status")
    .single();

  if (error || !nova) return null;
  await admin.from("ig_instancia_tokens").insert({ instancia_id: nova.id, token });
  return { id: nova.id, nome: nova.nome, token, username_ig: null, status: "desconectado" };
}

export async function definirWebhookInstanciaIg(nome: string, token: string): Promise<boolean> {
  const wh = `${Deno.env.get("SUPABASE_URL")}/functions/v1/ig-webhook`;
  const b = {
    url: wh,
    webhook_by_events: false,
    webhook_base64: false,
    events: ["MESSAGES_UPSERT", "CONNECTION_UPDATE"],
  };
  const r = await fetch(`${evoBase()}/webhook/set/${nome}`, {
    method: "POST",
    headers: { apikey: evoGlobalKey(), "Content-Type": "application/json" },
    body: JSON.stringify(b),
  });
  return r.ok;
}
