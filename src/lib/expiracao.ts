// Regra de PROTEÇÃO contra a expiração do site (Fase 4).
//
// A copy do follow-up promete "eu tiro essa página do ar em {N} dias" e o cron expirar-sites
// cumpre. A exceção: lead que ENGAJOU não pode perder o site. Para esses, o cron RENOVA o
// expira_em (+90d) em vez de limpar — pular só a limpeza não bastaria, porque quem derruba a
// página é o expira_em na rota /site/<slug>.
//
// ⚠️ ESPELHO: a lista real que decide a renovação vive em supabase/functions/expirar-sites
// (runtime Deno, não importa de src/). Esta cópia serve só pra UI dizer "Protegido" em vez de
// mostrar uma contagem regressiva que nunca dispara. Se mudar lá, mude aqui.
//
// ⚠️ NÃO confundir com campanha_leads.estado='aprovado': aquilo é o DONO aprovando o ENVIO,
// não o lead comprando. A proteção olha SÓ leads.status.
export const STATUS_PROTEGIDOS = ["won", "meeting", "responded", "nurture"];

/** O site deste lead está protegido da expiração? */
export function leadProtegido(status: string | null | undefined): boolean {
  return !!status && STATUS_PROTEGIDOS.includes(status);
}
