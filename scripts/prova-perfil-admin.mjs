// Suite: acesso ao perfil do super-admin
// Invariant: o perfil e independente das configuracoes globais e abre por navegacao explicita.
// Boundary IN: ligacao entre o menu da conta, a tela administrativa e o formulario de perfil.
// Boundary OUT: Supabase Auth, Storage e persistencia remota dos dados do usuario.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const painel = readFileSync("src/components/admin/AdminPanel.tsx", "utf8");
const configuracoes = readFileSync("src/components/admin/AdminConfiguracoes.tsx", "utf8");

assert.match(
  painel,
  /type TelaAdmin =[\s\S]*?\| "profile"/,
  'O painel deve possuir uma tela explicita "profile".',
);
assert.match(
  painel,
  /const handlePerfil = \(\) => \{\s*onNavegar\("profile"\);\s*\}/,
  'O botao "Meu Perfil" deve navegar diretamente para a tela de perfil.',
);
assert.doesNotMatch(
  painel,
  /abrir-perfil-admin|setTimeout\(\(\) => \{[\s\S]*?handlePerfil/,
  "A navegacao do perfil nao pode depender de evento global ou temporizador.",
);
assert.match(
  painel,
  /tela === "profile" && \([\s\S]*?<AdminProfile/,
  "A tela de perfil deve renderizar o formulario diretamente.",
);
assert.match(
  configuracoes,
  /export function AdminProfile\(/,
  "O formulario de perfil deve ser um componente independente e reutilizavel.",
);
assert.match(
  configuracoes,
  /await atualizarPerfilUsuario\(\{ full_name: nomeLimpo \}\)/,
  "O nome do super-admin deve ser persistido no perfil canonico.",
);
assert.match(
  configuracoes,
  /const publicUrl = await uploadAvatarUsuario\(file\)/,
  "A foto do super-admin deve usar o mesmo fluxo de upload dos demais usuarios.",
);
assert.match(
  configuracoes,
  /supabase\.auth\.updateUser\(\{ password: novaSenha \}\)/,
  "A alteracao de senha deve chamar o fluxo autenticado do Supabase.",
);

console.log("OK: perfil do super-admin abre por uma tela propria e independente.");
