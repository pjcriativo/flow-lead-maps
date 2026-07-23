// Leitura PÚBLICA de config_plataforma (RLS libera geral — migration 055): usada pela marca
// (logo/nome), pelo /auth (cadastro/termos), pelo guard de manutenção e pelo tema/SEO do site
// público. Nada aqui é secreto — chaves de API de verdade vivem em config_chaves, que não tem
// NENHUMA policy de client.
import { supabase } from "@/integrations/supabase/client";

export type ConfigPublica = {
  nome_plataforma: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  cadastro_usuario_ativo: boolean;
  termos_condicoes_ativo: boolean;
  modo_manutencao_ativo: boolean;
  moeda: string | null;
  simbolo_moeda: string | null;
  fuso_horario: string | null;
  cor_base: string | null;
  cor_secundaria: string | null;
  seo_titulo: string | null;
  seo_descricao: string | null;
  gdpr_texto: string | null;
  css_personalizado: string | null;
};

const CAMPOS =
  "nome_plataforma, logo_url, favicon_url, cadastro_usuario_ativo, termos_condicoes_ativo, modo_manutencao_ativo, moeda, simbolo_moeda, fuso_horario, cor_base, cor_secundaria, seo_titulo, seo_descricao, gdpr_texto, css_personalizado";

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
    moeda: data?.moeda ?? null,
    simbolo_moeda: data?.simbolo_moeda ?? null,
    fuso_horario: data?.fuso_horario ?? null,
    cor_base: data?.cor_base ?? null,
    cor_secundaria: data?.cor_secundaria ?? null,
    seo_titulo: data?.seo_titulo ?? null,
    seo_descricao: data?.seo_descricao ?? null,
    gdpr_texto: data?.gdpr_texto ?? null,
    css_personalizado: data?.css_personalizado ?? null,
  };
}
