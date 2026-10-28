// Suite: contrato estático da migration 202610270001 (fundação do CEO de IA).
// Invariante: todo dado de agente é isolado por org, só humano governa e o runtime não se auto-promove.
// Boundary IN: texto da migration, da Edge agent-ceo e do config.toml.
// Boundary OUT: comportamento em Postgres real (provado fora do repositório com pglite) e produção.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p: string) => readFileSync(new URL(p, import.meta.url), "utf8");
const sql = read("../../migrations/202610270001_agent_foundation.sql");
const edge = read("../agent-ceo/index.ts");
const config = read("../../config.toml");

const TABELAS = [
  "agent_tools",
  "agents",
  "agent_permissions",
  "agent_tasks",
  "agent_runs",
  "agent_run_steps",
  "agent_approvals",
];
const TABELAS_COM_ORG = TABELAS.filter((t) => t !== "agent_tools");

test("toda tabela de agente tem RLS ligada e policy de leitura", () => {
  for (const t of TABELAS) {
    assert.match(
      sql,
      new RegExp(`alter table public\\.${t} enable row level security`),
      `${t} sem RLS`,
    );
    assert.match(
      sql,
      new RegExp(`create policy ${t}_select on public\\.${t} for select`),
      `${t} sem policy de leitura`,
    );
  }
});

test("não existe policy de escrita para usuário: nenhum insert/update/delete/all", () => {
  assert.doesNotMatch(sql, /create policy[^;]*for (insert|update|delete|all)/i);
  assert.match(sql, /revoke all on public\.agent_tools[\s\S]*from anon, authenticated;/);
  assert.match(sql, /grant select on public\.agent_tools[\s\S]*to authenticated;/);
  assert.doesNotMatch(sql, /grant (insert|update|delete|all)[^;]*on public\.agent/i);
});

test("tabelas de organização têm org_id obrigatório e policies usam agent_pode_gerir(org_id)", () => {
  for (const t of TABELAS_COM_ORG) {
    const corpo =
      sql.match(
        new RegExp(`create table if not exists public\\.${t} \\(([\\s\\S]*?)\\n\\);`),
      )?.[1] ?? "";
    assert.match(corpo, /org_id uuid not null references public\.orgs\(id\)/, `${t} sem org_id`);
    assert.match(
      sql,
      new RegExp(
        `create policy ${t}_select on public\\.${t} for select to authenticated using \\(public\\.agent_pode_gerir\\(org_id\\)\\)`,
      ),
    );
  }
});

test("filhos usam chave composta (id, org_id): não há filho de outra organização", () => {
  for (const fk of [
    /foreign key \(agent_id, org_id\) references public\.agents\(id, org_id\)/,
    /foreign key \(task_id, org_id\) references public\.agent_tasks\(id, org_id\)/,
    /foreign key \(run_id, org_id\) references public\.agent_runs\(id, org_id\)/,
  ])
    assert.match(sql, fk);
});

test("governança: tabelas sensíveis só mudam via RPC (trigger) e as RPCs exigem sessão humana", () => {
  for (const t of ["agents", "agent_permissions", "agent_tools"]) {
    assert.match(
      sql,
      new RegExp(`create trigger agent_guard before insert or update or delete on public\\.${t}`),
    );
  }
  assert.match(sql, /governanca_exige_sessao_humana/);
  const rpcsHumanas = [
    "agent_criar_ceo",
    "agent_conceder_permissao",
    "agent_revogar_permissao",
    "agent_definir_estado",
    "agent_definir_limites",
    "agent_kill_switch",
    "agent_cancelar_tarefa",
    "agent_decidir_aprovacao",
  ];
  for (const f of rpcsHumanas) {
    const corpo =
      sql.match(
        new RegExp(`create or replace function public\\.${f}\\([\\s\\S]*?\\n\\$\\$;`),
      )?.[0] ?? "";
    assert.ok(corpo, `${f} não encontrada`);
    assert.match(corpo, /agent_exigir_humano\(/, `${f} não exige humano`);
    assert.match(corpo, /security definer set search_path = public/, `${f} sem search_path fixo`);
  }
});

test("RPCs do runtime são exclusivas do service_role; governança e ferramenta, de authenticated", () => {
  assert.match(
    sql,
    /revoke all on function\s+public\.agent_enfileirar_tarefa[\s\S]*?from public, anon, authenticated;/,
  );
  assert.match(
    sql,
    /grant execute on function\s+public\.agent_enfileirar_tarefa[\s\S]*?to service_role;/,
  );
  assert.match(sql, /grant execute on function\s+public\.agent_criar_ceo[\s\S]*?to authenticated;/);
  assert.doesNotMatch(
    sql,
    /grant execute[^;]*agent_(definir_limites|conceder_permissao|kill_switch)[^;]*to service_role/,
  );
});

test("limites: tetos absolutos no CHECK, autonomia somente leitura, agente nasce inativo", () => {
  assert.match(
    sql,
    /teto_usd_dia numeric\(10, 4\) not null default 0\.50 check \(teto_usd_dia between 0 and 5\)/,
  );
  assert.match(
    sql,
    /teto_usd_mes numeric\(10, 4\) not null default 5\.00 check \(teto_usd_mes between 0 and 50\)/,
  );
  assert.match(sql, /autonomia in \('somente_leitura'\)/);
  assert.match(sql, /estado text not null default 'inativo'/);
  assert.match(sql, /kill_switch boolean not null default false/);
});

test("fila: idempotência por org, lease, tentativas e skip locked", () => {
  assert.match(sql, /unique \(org_id, idempotency_key\)/);
  assert.match(sql, /lease_expires_at timestamptz/);
  assert.match(sql, /max_attempts integer not null default 2/);
  assert.match(sql, /for update of t skip locked/);
  assert.match(sql, /a\.estado = 'ativo' and not a\.kill_switch/);
});

test("ferramenta de resumo: SECURITY INVOKER, sem escrita, org explícita", () => {
  const corpo =
    sql.match(/create or replace function public\.agent_resumo_comercial[\s\S]*?\n\$\$;/)?.[0] ??
    "";
  assert.match(corpo, /security invoker/);
  assert.match(corpo, /where org_id = p_org/);
  assert.doesNotMatch(corpo, /\b(insert|update|delete|truncate|execute)\b/i);
});

test("a migration é idempotente e não mexe em objetos existentes do produto", () => {
  assert.doesNotMatch(sql, /create table public\./, "use create table if not exists");
  assert.doesNotMatch(
    sql,
    /\b(drop table|truncate|alter table public\.(leads|propostas|campanhas|wa_))/i,
  );
  assert.doesNotMatch(sql, /cron\.schedule/, "nenhum cron é criado");
});

test("Edge agent-ceo: JWT, papel de gestão, nenhuma tabela de negócio e nenhum cron", () => {
  const kit = read("../_shared/agent-edge-kit.ts");
  const exec = read("../_shared/agent-tool-exec.ts");
  const worker = read("../agent-worker/index.ts");
  assert.match(config, /\[functions\.agent-ceo\][\s\S]*?verify_jwt = true/);
  assert.match(config, /\[functions\.agent-worker\][\s\S]*?verify_jwt = true/);
  for (const e of [edge, worker]) {
    assert.match(e, /autorizarGestorDeAgentes\(/);
    assert.doesNotMatch(e, /\.from\("(leads|propostas|campanhas|lead_lists|wa_[a-z_]+)"\)/);
    assert.doesNotMatch(e, /Deno\.cron|cron\.schedule/);
    assert.doesNotMatch(e, /\.(update|delete|upsert)\(/);
  }
  assert.match(kit, /canManageAgents\(/);
  assert.match(kit, /auth\.getUser\(\)/);
  // todas as ferramentas passam por RPC fixa do banco (org derivada do agente)
  const rpcs = [...exec.matchAll(/chamarRpc\("([a-z_]+)"/g)].map((m) => m[1]);
  assert.ok(rpcs.length >= 7);
  assert.ok(
    rpcs.every((n) =>
      /^agent_(tool_[a-z_]+|delegar_tarefa|propor_equipe|propor_operacao|registrar_memoria)$/.test(
        n,
      ),
    ),
    rpcs.join(","),
  );
  assert.doesNotMatch(exec, /\.from\("|\.insert\(|\.update\(|fetch\(/);
});

test("guardas de governança aceitam cascata referencial (apagar org/usuário) mas não DML direto", () => {
  const guarda =
    sql.match(
      /create or replace function public\.agent_guard_governanca\(\)[\s\S]*?\n\$\$;/,
    )?.[0] ?? "";
  assert.match(guarda, /<> 'on' and pg_trigger_depth\(\) <= 1/);
  const aprov =
    sql.match(/create or replace function public\.agent_approvals_guard\(\)[\s\S]*?\n\$\$;/)?.[0] ??
    "";
  assert.match(aprov, /if pg_trigger_depth\(\) > 1 then return coalesce\(new, old\); end if;/);
  assert.match(aprov, /tg_op = 'DELETE' or coalesce\(current_setting/);
});
