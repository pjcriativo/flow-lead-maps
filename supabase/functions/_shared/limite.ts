// Aplicação do limite de plano nas Edges (chama a função SQL atômica `consumir_ou_bloquear`).
// Fonte única do teto por plano — nenhuma Edge reimplementa a regra. O `admin` é o client com
// service role (as funções são SECURITY DEFINER e resolvem a org/limite no servidor).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Admin = any;

export type ConsumoResp = {
  ok: boolean;
  reason?: string;
  recurso?: string;
  usado?: number;
  limite?: number | null;
  restante?: number | null;
  perto?: boolean;
};

/** org_id da org do usuário (a mais antiga; a que o backfill/onboarding cria). */
export async function orgDoUsuario(admin: Admin, userId: string): Promise<string | null> {
  const { data } = await admin
    .from("memberships")
    .select("org_id")
    .eq("user_id", userId)
    .order("criada_em", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data?.org_id ?? null;
}

/** Conta e aplica o limite de UMA vez (atômico). ok=false → NÃO consumiu; bloqueie a ação. */
export async function consumir(
  admin: Admin,
  orgId: string,
  recurso: "leads" | "sites" | "campanhas" | "mensagens",
  n = 1,
): Promise<ConsumoResp> {
  const { data, error } = await admin.rpc("consumir_ou_bloquear", {
    p_org: orgId,
    p_recurso: recurso,
    p_n: n,
  });
  if (error) return { ok: false, reason: "erro_rpc" };
  return data as ConsumoResp;
}

/** Só lê o estado (sem consumir) — para pré-checar/avisar. */
export async function estadoConsumo(
  admin: Admin,
  orgId: string,
  recurso: "leads" | "sites" | "campanhas" | "mensagens",
): Promise<ConsumoResp> {
  const { data } = await admin.rpc("estado_consumo", { p_org: orgId, p_recurso: recurso });
  return (data ?? { usado: 0, limite: null }) as ConsumoResp;
}
