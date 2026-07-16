// Identidade do REMETENTE nos e-mails que chegam no LEAD.
//
// O que é livre e o que não é:
//   - DOMÍNIO do From: precisa ser VERIFICADO no Resend. Trocá-lo pelo e-mail pessoal do
//     usuário, sem verificar o domínio dele, é spoofing → spam. NÃO se mexe nisso aqui.
//   - NOME DE EXIBIÇÃO do From: livre. É o que o lead lê na caixa dele.
//
// O lead é prospect da AGÊNCIA, não cliente da plataforma: ele não pode ver "Flow Leads" na
// caixa de entrada. E a copy é pessoal ("Peguei o que já é público de vocês e refiz a página")
// — assinada por uma ferramenta, soava falsa. Então o nome de exibição é o full_name da org
// (o MESMO que assina o corpo), e o endereço continua o do domínio verificado.
//
// ⚠️ Isto é paliativo enquanto o From mora num domínio com marca. O alvo é o PORTÃO da
// identidade de envio: domínio NEUTRO + subdomínio por org (precisa de DNS programático).

/** Extrai só o endereço de um From no formato `Nome <a@b.c>` ou `a@b.c`. */
export function enderecoDoFrom(emailFrom: string): string {
  const m = emailFrom.match(/<([^>]+)>/);
  return (m ? m[1] : emailFrom).trim();
}

/**
 * Monta o From com o NOME PESSOAL da org + o endereço do domínio VERIFICADO.
 * Sem nome configurado devolve null — quem chama BARRA o envio (mandar com nome de
 * ferramenta, ou sem nome, é o que estamos justamente corrigindo).
 */
export function montarFrom(
  emailFrom: string,
  nomePessoal: string | null | undefined,
): string | null {
  const nome = (nomePessoal ?? "").trim();
  if (!nome) return null;
  const endereco = enderecoDoFrom(emailFrom);
  if (!endereco.includes("@")) return null;
  // Aspas: nome com vírgula/ponto quebraria o cabeçalho. Aspas internas viram espaço.
  const seguro = nome
    .replace(/["<>\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return `"${seguro}" <${endereco}>`;
}
