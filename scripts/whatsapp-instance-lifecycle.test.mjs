import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const wa = readFileSync("supabase/functions/_shared/wa.ts", "utf8");
const migration = readFileSync(
  "supabase/migrations/202610200002_wa_instance_lifecycle.sql",
  "utf8",
);

test("exclusão de conexão arquiva a instância e preserva o histórico", () => {
  assert.match(migration, /add column if not exists deleted_at timestamptz/i);
  assert.match(wa, /\.update\(\{[\s\S]*?deleted_at: new Date\(\)\.toISOString\(\)/);
  assert.doesNotMatch(wa, /motivo: "tem_historico"/);
});

test("instâncias arquivadas não aparecem nem consomem a cota do plano", () => {
  assert.match(migration, /where org_id = v_org and deleted_at is null/i);
  assert.match(wa, /listarInstanciasDaOrg[\s\S]*?\.is\("deleted_at", null\)/);
});

test("pareamento reutiliza qualquer tentativa ativa sem telefone", () => {
  const pairing = wa.slice(wa.indexOf("export async function obterOuCriarInstanciaParaPareamento"));
  assert.match(pairing, /\.is\("deleted_at", null\)[\s\S]*?\.is\("numero", null\)/);
  assert.doesNotMatch(
    pairing.slice(0, pairing.indexOf("return criarInstanciaDaOrg")),
    /\.in\("status"/,
  );
});
