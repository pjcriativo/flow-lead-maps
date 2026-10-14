// Suite: navegação legítima do Super Admin
// Invariant: o papel global vindo de profiles controla o único atalho para /admin
// Boundary IN: composição dashboard -> sidebar e guard da rota administrativa
// Boundary OUT: sessão Supabase real e renderização visual em navegador autenticado

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const dashboard = readFileSync("src/routes/_authenticated/dashboard.tsx", "utf8");
const sidebar = readFileSync("src/components/home-premium/DashboardSidebar.tsx", "utf8");
const topbar = readFileSync("src/components/google-maps-premium/GoogleMapsTopbar.tsx", "utf8");
const mapsView = readFileSync(
  "src/components/google-maps-premium/GoogleMapsPremiumView.tsx",
  "utf8",
);
const accessMenu = readFileSync("src/components/perfil/ProfileAccessMenu.tsx", "utf8");
const adminRoute = readFileSync("src/routes/_authenticated/admin.tsx", "utf8");

test("propaga o papel global do perfil até a sidebar premium", () => {
  assert.match(
    dashboard,
    /\.select\("full_name, email, avatar_url, plan, is_super_admin"\)/,
    "o dashboard deve carregar o papel usando o ID autenticado",
  );
  assert.match(
    dashboard,
    /isSuperAdmin=\{userProfile\?\.is_super_admin === true\}/,
    "o dashboard deve passar somente o booleano validado para a sidebar",
  );
  assert.match(sidebar, /isSuperAdmin: boolean;/);
  assert.match(
    dashboard,
    /<GoogleMapsPremiumView[\s\S]*?isSuperAdmin=\{userProfile\?\.is_super_admin === true\}/,
  );
  assert.match(dashboard, /onOpenProfile=\{\(\) => selectSection\("settings"\)\}/);
});

test("o clique no perfil oferece conta do cliente e painel geral somente ao Super Admin", () => {
  assert.match(accessMenu, /Conta do cliente/);
  assert.match(accessMenu, /\{isSuperAdmin \? \(/);
  assert.match(accessMenu, /to="\/admin"/);
  assert.match(accessMenu, /Painel Super Admin/);
  assert.match(sidebar, /<ProfileAccessMenu[\s\S]*?isSuperAdmin=\{isSuperAdmin\}/);
  assert.match(topbar, /<ProfileAccessMenu[\s\S]*?isSuperAdmin=\{isSuperAdmin\}/);
  assert.match(mapsView, /<GoogleMapsTopbar[\s\S]*?isSuperAdmin=\{isSuperAdmin\}/);
});

test("a rota administrativa continua validando o papel pelo ID autenticado", () => {
  assert.match(adminRoute, /\.eq\("id", data\.user\.id\)/);
  assert.match(adminRoute, /perfil\?\.is_super_admin !== true/);
  assert.doesNotMatch(adminRoute, /marcosg1\.pereira@gmail\.com/i);
  assert.doesNotMatch(adminRoute, /OWNER_EMAIL/);
});
