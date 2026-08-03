// Suite: navegação do perfil no dashboard
// Invariant: "Meu Perfil" é acessível na navegação móvel sem duplicar o atalho no menu desktop.
// Boundary IN: configuração e ligação das navegações responsivas do dashboard.
// Boundary OUT: autenticação, carregamento do perfil e persistência no Supabase.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync("src/routes/_authenticated/dashboard.tsx", "utf8");

const nav = source.match(/const NAV:[\s\S]*?= \[([\s\S]*?)\n\];/)?.[1] ?? "";
const desktop = source.match(/<nav className="[^"]*">([\s\S]*?)<\/nav>/)?.[1] ?? "";
const mobile = source.match(/\{\/\* Mobile top tabs \*\/\}([\s\S]*?)<main/)?.[1] ?? "";

assert.match(
  nav,
  /id:\s*"settings",\s*label:\s*"Meu Perfil"/,
  'NAV deve registrar a seção "settings" com o rótulo visível "Meu Perfil".',
);
assert.match(mobile, /\{NAV\.map\(/, "A navegação móvel deve renderizar todos os itens de NAV.");
assert.match(
  desktop,
  /NAV\.filter\(\(item\)\s*=>\s*item\.id\s*!==\s*"settings"\)\.map\(/,
  'O menu desktop deve omitir "settings", pois o card da conta já é o atalho de perfil.',
);

console.log("OK: Meu Perfil está acessível no mobile e não duplicado no menu desktop.");
