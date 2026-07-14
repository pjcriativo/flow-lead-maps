// Cliente da EVOLUTION GO (WhatsApp). ⚠️ Rotas VALIDADAS contra o Swagger da versão
// EM USO — DIFEREM da Evolution API (Node). Auth por header `apikey`: a GLOBAL key
// gerencia (create/all); o TOKEN da instância resolve a instância (status/qr/send).
// Rotas GO usadas:
//   GET  /instance/all      (apikey: global)          -> lista instâncias
//   POST /instance/create   (apikey: global)          body {name, token}
//   GET  /instance/status   (apikey: token instância) -> {data:{Connected,LoggedIn,Name}}
//   GET  /instance/qr       (apikey: token instância) -> {data:{Qrcode:"data:image/png;base64,..."}}
//   POST /send/text         (apikey: token instância) body {number, text}
// (Na Node seria /instance/connect/{inst}, /instance/connectionState/{inst},
//  /message/sendText/{inst} — NÃO usar aqui.)

export function waBase(): string {
  return (Deno.env.get("EVOLUTION_URL") || "").replace(/\/+$/, "");
}
export function waGlobalKey(): string {
  return Deno.env.get("EVOLUTION_API_KEY") || "";
}
export function waInstanceName(): string {
  return Deno.env.get("EVOLUTION_INSTANCE") || "flowleads";
}

export type WaInstancia = { token: string; jid: string; name: string };

/** Acha a instância dedicada pelo nome (GET /instance/all). Cria se faltar
 * (POST /instance/create). null = não configurado / falha. */
export async function resolverInstancia(criarSeFaltar = true): Promise<WaInstancia | null> {
  const base = waBase();
  const g = waGlobalKey();
  const nome = waInstanceName();
  if (!base || !g) return null;

  const all = await fetch(`${base}/instance/all`, { headers: { apikey: g } });
  if (all.ok) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const j: any = await all.json().catch(() => ({}));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inst = (j.data || []).find((i: any) => i.name === nome);
    if (inst) return { token: inst.token, jid: inst.jid || "", name: inst.name };
  }
  if (!criarSeFaltar) return null;

  const token = crypto.randomUUID();
  const c = await fetch(`${base}/instance/create`, {
    method: "POST",
    headers: { apikey: g, "Content-Type": "application/json" },
    body: JSON.stringify({ name: nome, token }),
  });
  if (!c.ok) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cj: any = await c.json().catch(() => ({}));
  return { token: cj.data?.token || token, jid: "", name: nome };
}

export type WaStatus = { connected: boolean; loggedIn: boolean; name: string };

/** Status da instância (GET /instance/status com o token dela). loggedIn = pareado. */
export async function statusInstancia(token: string): Promise<WaStatus | null> {
  const r = await fetch(`${waBase()}/instance/status`, { headers: { apikey: token } });
  if (!r.ok) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const j: any = await r.json().catch(() => ({}));
  return {
    connected: !!j.data?.Connected,
    loggedIn: !!j.data?.LoggedIn,
    name: j.data?.Name || "",
  };
}
