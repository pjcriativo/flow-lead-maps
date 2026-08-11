/**
 * Validador de E-mails Autênticos para Deno / Edge Functions Supabase.
 * Impede a criação e aprovação de e-mails falsos, temporários ou de teste (@teste, @fake, etc.).
 */

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

const BLOCKED_TLDS = [".test", ".teste", ".invalid", ".fake", ".tmp", ".temp"];

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

  const regexEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!regexEmail.test(emailLimpo)) {
    return {
      valido: false,
      motivo: "Formato de e-mail inválido. Certifique-se de incluir um domínio válido.",
    };
  }

  const partes = emailLimpo.split("@");
  if (partes.length !== 2) {
    return { valido: false, motivo: "E-mail inválido." };
  }

  const [username, domain] = partes;

  if (domain.endsWith("flowleads.local") || domain.endsWith("flowleads.app")) {
    return { valido: true };
  }

  if (username.length < 2) {
    return { valido: false, motivo: "O e-mail informado é muito curto." };
  }

  if (BLOCKED_USERNAMES.has(username)) {
    return {
      valido: false,
      motivo: `O e-mail "${emailLimpo}" não é aceito. Por favor, utilize seu e-mail pessoal ou corporativo real.`,
    };
  }

  for (const tld of BLOCKED_TLDS) {
    if (domain.endsWith(tld)) {
      return {
        valido: false,
        motivo: `O domínio de e-mail "${domain}" não é um domínio válido para cadastro.`,
      };
    }
  }

  if (BLOCKED_DOMAINS.has(domain)) {
    return {
      valido: false,
      motivo: `Domínios de e-mail de teste ou temporários (@${domain}) não são permitidos. Use um e-mail autêntico.`,
    };
  }

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
