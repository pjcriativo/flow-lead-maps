// Leitura PÚBLICA de config_plataforma (RLS libera geral — migration 055): usada pela marca
// (logo/nome), pelo /auth (cadastro/termos) e pelo guard de manutenção. Nada aqui é secreto —
// chaves de API de verdade vivem em config_chaves, que não tem NENHUMA policy de client.
import { supabase } from "@/integrations/supabase/client";

export type ConfigPublica = {
  nome_plataforma: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  cadastro_usuario_ativo: boolean;
  termos_condicoes_ativo: boolean;
  modo_manutencao_ativo: boolean;
};

const CAMPOS =
  "nome_plataforma, logo_url, favicon_url, cadastro_usuario_ativo, termos_condicoes_ativo, modo_manutencao_ativo";

export async function lerConfigPublica(): Promise<ConfigPublica> {
  const { data } = await supabase
    .from("config_plataforma")
    .select(CAMPOS)
    .eq("id", true)
    .maybeSingle();
  return {
    nome_plataforma: data?.nome_plataforma ?? null,
    logo_url: data?.logo_url ?? null,
    favicon_url: data?.favicon_url ?? null,
    cadastro_usuario_ativo: data?.cadastro_usuario_ativo ?? true,
    termos_condicoes_ativo: data?.termos_condicoes_ativo ?? false,
    modo_manutencao_ativo: data?.modo_manutencao_ativo ?? false,
  };
}
