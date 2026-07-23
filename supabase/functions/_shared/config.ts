// Lê config_plataforma (singleton). Cada campo é opcional — quem chama já sabe o valor
// PADRÃO (a const pura do módulo original) e usa `?? padrao` linha a linha. Nunca falha: erro
// de rede/tabela devolve tudo null (cai no padrão).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = any;

export type ConfigPlataforma = {
  teto_rodada_usd: number | null;
  teto_mes_usd: number | null;
  dias_validade_site: number | null;
  remetente_nome_padrao: string | null;
  remetente_email_padrao: string | null;
  intervalo_disparo_min_seg: number | null;
  intervalo_disparo_max_seg: number | null;
  max_leads_busca: number | null;
  modelo_ia: string | null;
  modelo_openai: string | null;
};

const VAZIA: ConfigPlataforma = {
  teto_rodada_usd: null,
  teto_mes_usd: null,
  dias_validade_site: null,
  remetente_nome_padrao: null,
  remetente_email_padrao: null,
  intervalo_disparo_min_seg: null,
  intervalo_disparo_max_seg: null,
  max_leads_busca: null,
  modelo_ia: null,
  modelo_openai: null,
};

export async function lerConfigPlataforma(client: Client): Promise<ConfigPlataforma> {
  try {
    const { data } = await client
      .from("config_plataforma")
      .select(
        "teto_rodada_usd, teto_mes_usd, dias_validade_site, remetente_nome_padrao, remetente_email_padrao, intervalo_disparo_min_seg, intervalo_disparo_max_seg, max_leads_busca, modelo_ia, modelo_openai",
      )
      .eq("id", true)
      .maybeSingle();
    return (data as ConfigPlataforma) ?? VAZIA;
  } catch {
    return VAZIA;
  }
}
