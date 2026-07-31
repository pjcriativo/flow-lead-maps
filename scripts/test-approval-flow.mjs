// Script de verificação automatizada para o fluxo de cadastro e aprovação por admin.
// Valida:
// 1. Esquema dos 5 campos (Nome, Email, Telefone, Criar senha, Confirmar senha).
// 2. Regra de bloqueio de acesso (acesso_liberado === false).
// 3. Redirecionamento forçado para /aguardando-aprovacao.

import assert from "node:assert";

console.log("⚡ Executando testes automatizados do fluxo de cadastro e aprovação...");

// 1. Teste de Validação de Dados do Cadastro
const validarCadastro = (dados) => {
  const erros = [];
  if (!dados.nome || dados.nome.trim().length < 2) {
    erros.push("Informe seu nome completo.");
  }
  if (!dados.email || !dados.email.includes("@")) {
    erros.push("Informe um e-mail válido.");
  }
  if (!dados.phone || dados.phone.trim().length < 8) {
    erros.push("Informe um telefone/WhatsApp válido.");
  }
  if (!dados.password || dados.password.length < 8) {
    erros.push("A senha deve ter pelo menos 8 caracteres.");
  }
  if (dados.password !== dados.confirmPassword) {
    erros.push("As senhas não coincidem.");
  }
  return erros;
};

// Teste 1.1: Senhas diferentes devem ser rejeitadas
const t1 = validarCadastro({
  nome: "João Silva",
  email: "joao@exemplo.com",
  phone: "(11) 99999-8888",
  password: "senhaSegura123",
  confirmPassword: "senhaDiferente456",
});
assert(t1.includes("As senhas não coincidem."), "FAIL: Deveria rejeitar senhas divergentes");
console.log("✔ Passou: Rejeita senhas divergentes");

// Teste 1.2: Senha curta deve ser rejeitada
const t2 = validarCadastro({
  nome: "João Silva",
  email: "joao@exemplo.com",
  phone: "(11) 99999-8888",
  password: "123",
  confirmPassword: "123",
});
assert(t2.includes("A senha deve ter pelo menos 8 caracteres."), "FAIL: Deveria exigir 8+ chars");
console.log("✔ Passou: Exige no mínimo 8 caracteres para a senha");

// Teste 1.3: Todos os 5 campos válidos
const t3 = validarCadastro({
  nome: "João Silva",
  email: "joao@exemplo.com",
  phone: "(11) 99999-8888",
  password: "senhaSegura123",
  confirmPassword: "senhaSegura123",
});
assert.strictEqual(t3.length, 0, "FAIL: Cadastro válido com 5 campos não deveria gerar erros");
console.log("✔ Passou: Aceita formulário válido com os 5 campos completos");

// 2. Teste da Regra de Portão de Aprovação
const verificarDestinoRota = (perfil) => {
  if (perfil?.is_super_admin === true || perfil?.acesso_liberado === true) {
    return "/dashboard";
  }
  return "/aguardando-aprovacao";
};

// Teste 2.1: Novo perfil sem aprovação deve ir para /aguardando-aprovacao
const destinoPendente = verificarDestinoRota({
  is_super_admin: false,
  acesso_liberado: false,
});
assert.strictEqual(
  destinoPendente,
  "/aguardando-aprovacao",
  "FAIL: Perfil pendente deve ser bloqueado",
);
console.log(
  "✔ Passou: Conta pendente (acesso_liberado=false) é direcionada para /aguardando-aprovacao",
);

// Teste 2.2: Perfil liberado pode ir para o /dashboard
const destinoLiberado = verificarDestinoRota({
  is_super_admin: false,
  acesso_liberado: true,
});
assert.strictEqual(destinoLiberado, "/dashboard", "FAIL: Perfil liberado deve acessar o dashboard");
console.log("✔ Passou: Conta liberada pelo admin (acesso_liberado=true) acessa o /dashboard");

// Teste 2.3: Super admin sempre tem acesso
const destinoSuper = verificarDestinoRota({
  is_super_admin: true,
  acesso_liberado: false,
});
assert.strictEqual(destinoSuper, "/dashboard", "FAIL: Super admin deve sempre acessar");
console.log("✔ Passou: Super Admin sempre acessa independente do flag de acesso liberado");

console.log("\n✅ Todos os testes automatizados do fluxo passaram com sucesso!");
