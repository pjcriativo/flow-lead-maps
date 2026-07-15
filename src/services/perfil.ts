// Perfil da org (profiles, RLS pelo dono). Guarda as duas coisas que os e-mails da org
// precisam e que NÃO podem ser hardcoded:
//
//   full_name       → {remetente}: a assinatura no corpo. Nome PESSOAL — quem recebe o
//                     e-mail responde pra uma pessoa, não pra uma empresa.
//   reply_to_email  → Reply-To: ONDE A RESPOSTA DO LEAD CHEGA.
//
// ⚠️ reply_to_email NÃO é o remetente. O From continua no domínio VERIFICADO
// (contato@flowgenius.com.br): trocar o From pelo e-mail pessoal do usuário, sem verificar o
// domínio dele, é spoofing — cai em spam e queima a reputação do domínio. O Reply-To, esse
// sim, aceita qualquer endereço sem verificação.
import { supabase } from "@/integrations/supabase/client";

async function idDaOrg(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  const id = data.user?.id;
  if (!id) throw new Error("Não autenticado");
  return id;
}

export type PerfilEmail = {
  /** Assina o corpo. "" = não configurado (a geração de proposta bloqueia). */
  nome: string;
  /** Reply-To. "" = não configurado (o ENVIO bloqueia). */
  replyTo: string;
};

/** Validação pragmática: algo@algo.tld. Não tenta ser RFC 5322 — só barra o obviamente errado. */
export function emailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export async function lerPerfilEmail(): Promise<PerfilEmail> {
  const id = await idDaOrg();
  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, reply_to_email")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  const row = data as { full_name: string | null; reply_to_email: string | null } | null;
  return { nome: (row?.full_name ?? "").trim(), replyTo: (row?.reply_to_email ?? "").trim() };
}

/** Nome que assina os e-mails. "" = não configurado (a geração de proposta bloqueia). */
export async function lerNomeRemetente(): Promise<string> {
  return (await lerPerfilEmail()).nome;
}

export async function salvarNomeRemetente(nome: string): Promise<void> {
  await gravar({ full_name: obrigatorio(nome, "O nome não pode ficar vazio") });
}

/** E-mail onde as respostas dos leads chegam (Reply-To). */
export async function salvarReplyTo(email: string): Promise<void> {
  const limpo = obrigatorio(email, "O e-mail não pode ficar vazio");
  if (!emailValido(limpo)) throw new Error(`"${limpo}" não parece um e-mail válido.`);
  await gravar({ reply_to_email: limpo });
}

function obrigatorio(v: string, msg: string): string {
  const limpo = (v ?? "").trim();
  if (!limpo) throw new Error(msg);
  return limpo;
}

/** UPDATE (não upsert): a RLS de profiles tem SELECT e UPDATE, mas NÃO INSERT — um upsert
 * bateria em 42501. A linha existe: o trigger on_auth_user_created a cria. */
async function gravar(patch: Record<string, string>): Promise<void> {
  const id = await idDaOrg();
  const { data, error } = await supabase
    .from("profiles")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id");
  if (error) throw error;
  if (!data?.length) throw new Error("Perfil não encontrado para esta conta.");
}
