import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";

/** Portão compartilhado pelas Edge Functions chamadas por usuários autenticados. */
export async function acessoFerramentaLiberado(
  client: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data, error } = await client
    .from("profiles")
    .select("acesso_liberado, is_super_admin")
    .eq("id", userId)
    .maybeSingle();

  return !error && (data?.acesso_liberado === true || data?.is_super_admin === true);
}
