/**
 * Validador de E-mails Autênticos do Flow Leads.
 * Impede o cadastro e aprovação de e-mails falsos, temporários ou de teste (@teste, @fake, etc.).
 */

// Domínios expressamente proibidos
const BLOCKED_DOMAINS = new Set([
  "teste.com",
  "teste.com.br",
  "test.com",
  "test.com.br",
  "example.com",
  "fake.com",
  "invalid.com",
  "temp.com",
  "tempmail.com",
  "trashmail.com",
  "mailinator.com",
  "yopmail.com",
  "disposable.com",
  "10minutemail.com",
  "guerrillamail.com",
  "sharklasers.com",
  "throwaway.com",
  "fakeinbox.com",
  "minitts.net",
  "dispostable.com",
  "getairmail.com",
  "mailnesia.com",
  "maildrop.cc",
  "crazymailing.com",
  "mohmal.com",
  "mailcatch.com",
]);

// Palavras-chave proibidas no domínio
const BLOCKED_DOMAIN_KEYWORDS = [
  "teste",
  "test",
  "fake",
  "invalid",
  "disposable",
  "trashmail",
  "tempmail",
  "10minute",
  "yopmail",
  "mailinator",
  "throwaway",
  "fakeinbox",
  "temp-email",
];

// TLDs / Extensões proibidas
const BLOCKED_TLDS = [".test", ".teste", ".invalid", ".fake", ".tmp", ".temp"];

// Usernames genéricos / falsos proibidos antes do @
const BLOCKED_USERNAMES = new Set([
  "teste",
  "test",
  "admin",
  "fake",
  "asdf",
  "qwerty",
  "123456",
  "usuario",
  "user",
  "abc",
]);

export type EmailValidationResult = {
  valido: boolean;
  motivo?: string;
};

export function validarEmailAutentico(email: string): EmailValidationResult {
  if (!email || typeof email !== "string") {
    return { valido: false, motivo: "Informe um e-mail válido." };
  }

  const emailLimpo = email.trim().toLowerCase();

  // 1. Sintaxe RFC 5322 básica
  const regexEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!regexEmail.test(emailLimpo)) {
    return {
      valido: false,
      motivo:
        "Formato de e-mail inválido. Certifique-se de incluir um domínio válido (ex: @suaempresa.com).",
    };
  }

  const partes = emailLimpo.split("@");
  if (partes.length !== 2) {
    return { valido: false, motivo: "E-mail inválido." };
  }

  const [username, domain] = partes;

  // Permite e-mails de teste do sistema interno (ex: @flowleads.local ou @flowleads.app)
  if (domain.endsWith("flowleads.local") || domain.endsWith("flowleads.app")) {
    return { valido: true };
  }

  // 2. Validação do Usuário (antes do @)
  if (username.length < 2) {
    return { valido: false, motivo: "O e-mail informado é muito curto." };
  }

  if (BLOCKED_USERNAMES.has(username)) {
    return {
      valido: false,
      motivo: `O e-mail "${emailLimpo}" não é aceito. Por favor, utilize seu e-mail pessoal ou corporativo real.`,
    };
  }

  // 3. Validação de TLD / Extensão
  for (const tld of BLOCKED_TLDS) {
    if (domain.endsWith(tld)) {
      return {
        valido: false,
        motivo: `O domínio de e-mail "${domain}" não é um domínio de e-mail válido para cadastro.`,
      };
    }
  }

  // 4. Validação de Domínio exato bloqueado
  if (BLOCKED_DOMAINS.has(domain)) {
    return {
      valido: false,
      motivo: `Domínios de e-mail de teste ou temporários (@${domain}) não são permitidos. Use um e-mail autêntico.`,
    };
  }

  // 5. Validação de palavras-chave no domínio
  for (const keyword of BLOCKED_DOMAIN_KEYWORDS) {
    if (domain.includes(keyword)) {
      return {
        valido: false,
        motivo: `O domínio "@${domain}" parece ser um e-mail temporário ou de teste. Por favor, cadastre um e-mail autêntico.`,
      };
    }
  }

  return { valido: true };
}
