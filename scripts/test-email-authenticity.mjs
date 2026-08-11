import { validarEmailAutentico } from "../src/lib/email-validation.ts";

console.log("⚡ Executando bateria de testes do validador de e-mails autênticos...\n");

const casos = [
  { email: "usuario@teste.com", esperado: false, nome: "Rejeita @teste.com" },
  { email: "admin@teste", esperado: false, nome: "Rejeita @teste sem TLD" },
  { email: "test@domain.com", esperado: false, nome: "Rejeita username 'test'" },
  {
    email: "contato@tempmail.com",
    esperado: false,
    nome: "Rejeita provedor temporário tempmail.com",
  },
  { email: "marcos@mailinator.com", esperado: false, nome: "Rejeita mailinator.com" },
  { email: "fake.user@fake.com", esperado: false, nome: "Rejeita fake.com" },
  { email: "usuario@minitts.net", esperado: false, nome: "Rejeita minitts.net" },
  {
    email: "pedro@empresa.com.br",
    esperado: true,
    nome: "Aceita e-mail corporativo válido (.com.br)",
  },
  { email: "contato@startup.io", esperado: true, nome: "Aceita e-mail corporativo válido (.io)" },
  { email: "dono@gmail.com", esperado: true, nome: "Aceita e-mail pessoal real (@gmail.com)" },
  {
    email: "admin@flowleads.local",
    esperado: true,
    nome: "Aceita e-mail de teste interno do sistema (@flowleads.local)",
  },
];

let passou = 0;
let falhou = 0;

for (const c of casos) {
  const res = validarEmailAutentico(c.email);
  if (res.valido === c.esperado) {
    console.log(`✔ Passou: ${c.nome} ("${c.email}" → ${res.valido ? "VÁLIDO" : "BLOQUEADO"})`);
    passou++;
  } else {
    console.error(
      `❌ Falhou: ${c.nome} (Esperado: ${c.esperado}, Obtido: ${res.valido}) - Motivo: ${res.motivo}`,
    );
    falhou++;
  }
}

console.log(`\n📊 Resultado final: ${passou} passaram · ${falhou} falharam`);

if (falhou > 0) {
  process.exit(1);
} else {
  console.log("✅ Todos os casos de teste de validação de e-mail passaram com sucesso!");
}
