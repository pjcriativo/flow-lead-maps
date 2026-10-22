// Suite: autorização das Edge Functions de WhatsApp.
// Invariante: as consultas independentes rodam juntas, mas as RECUSAS continuam avaliadas na mesma
// ordem (acesso, organização, vínculo, papel) e nada é concedido sem vínculo com a organização.
// Boundary IN: autorizador com bancos simulados. Boundary OUT: GoTrue e PostgreSQL reais.
import test from "node:test";
import assert from "node:assert/strict";
import { WhatsappAuthorizationError, authorizeWhatsappRequest } from "./whatsapp-authorization.ts";

const ORG = "11111111-1111-4111-8111-111111111111";
const USUARIO = "22222222-2222-4222-8222-222222222222";

type Cliente = Parameters<typeof authorizeWhatsappRequest>[0]["admin"];

type Cenario = {
  usuarioLogado?: boolean;
  acessoLiberado?: boolean;
  organizacaoExiste?: boolean;
  superAdmin?: boolean;
  papel?: string | null;
  papelAtivo?: boolean | null;
};

function bancos(cenario: Cenario = {}) {
  const config = {
    usuarioLogado: true,
    acessoLiberado: true,
    organizacaoExiste: true,
    superAdmin: false,
    papel: "admin" as string | null,
    papelAtivo: null as boolean | null,
    ...cenario,
  };
  const consultas: string[] = [];
  const linhas = (tabela: string): { data: unknown } => {
    if (tabela === "orgs") return { data: config.organizacaoExiste ? { id: ORG } : null };
    if (tabela === "memberships") return { data: config.papel ? { papel: config.papel } : null };
    if (tabela === "org_papeis") {
      return {
        data:
          config.papelAtivo === null || !config.papel
            ? []
            : [{ papel: config.papel, ativo: config.papelAtivo }],
      };
    }
    return { data: null };
  };
  const consulta = (tabela: string, cliente: "admin" | "user") => {
    consultas.push(`${cliente}:${tabela}`);
    const q: Record<string, unknown> = {
      select: () => q,
      eq: () => q,
      maybeSingle: async () =>
        tabela === "profiles"
          ? {
              data:
                cliente === "user"
                  ? { acesso_liberado: config.acessoLiberado, is_super_admin: false }
                  : { is_super_admin: config.superAdmin },
              error: null,
            }
          : { ...linhas(tabela), error: null },
      then: (resolve: (valor: unknown) => unknown) => resolve({ ...linhas(tabela), error: null }),
    };
    return q;
  };
  const userClient = {
    auth: {
      getUser: async () =>
        config.usuarioLogado
          ? { data: { user: { id: USUARIO } }, error: null }
          : { data: { user: null }, error: { message: "sem sessão" } },
    },
    from: (tabela: string) => consulta(tabela, "user"),
  };
  const admin = { from: (tabela: string) => consulta(tabela, "admin") };
  return { admin, userClient, consultas };
}

async function autorizar(
  cenario: Cenario,
  orgId: unknown = ORG,
  permissao: "reply_conversations" | "view_dashboard" | "manage_campaigns" = "reply_conversations",
) {
  const { admin, userClient, consultas } = bancos(cenario);
  const resultado = await authorizeWhatsappRequest({
    admin: admin as unknown as Cliente,
    userClient: userClient as unknown as Cliente,
    requestedOrgId: orgId,
    permission: permissao,
  }).then(
    (contexto) => ({ contexto }),
    (erro: unknown) => ({ erro }),
  );
  return { ...resultado, consultas };
}

function recusa(resultado: { erro?: unknown }) {
  assert.ok(resultado.erro instanceof WhatsappAuthorizationError, "esperava uma recusa");
  return resultado.erro as WhatsappAuthorizationError;
}

test("a member with the right role is authorized and the checks run together", async () => {
  const r = await autorizar({ papel: "admin" });
  assert.deepEqual(r.contexto, { userId: USUARIO, orgId: ORG, role: "admin", isSuperAdmin: false });
  // Todas as verificações independentes foram feitas na mesma passada.
  assert.deepEqual([...r.consultas].sort(), [
    "admin:memberships",
    "admin:org_papeis",
    "admin:orgs",
    "admin:profiles",
    "user:profiles",
  ]);
});

test("a request without a session is refused with 401", async () => {
  const erro = recusa(await autorizar({ usuarioLogado: false }));
  assert.equal(erro.status, 401);
});

test("access not released wins over every other refusal, even with an invalid organization", async () => {
  assert.equal(recusa(await autorizar({ acessoLiberado: false })).status, 403);
  assert.equal(recusa(await autorizar({ acessoLiberado: false }, "nao-e-uuid")).status, 403);
  assert.equal(
    recusa(await autorizar({ acessoLiberado: false, organizacaoExiste: false })).status,
    403,
  );
});

test("an invalid organization id is a 422 and an unknown organization is a 404", async () => {
  assert.equal(recusa(await autorizar({}, "   ")).status, 422);
  assert.equal(recusa(await autorizar({}, null)).status, 422);
  assert.equal(recusa(await autorizar({ organizacaoExiste: false })).status, 404);
});

test("no membership means no access, even though the other checks already ran", async () => {
  const erro = recusa(await autorizar({ papel: null }));
  assert.equal(erro.status, 403);
  assert.match(erro.message, /Sem acesso à organização/);
});

test("a role disabled for the organization is refused", async () => {
  const erro = recusa(await autorizar({ papel: "vendedor", papelAtivo: false }));
  assert.equal(erro.status, 403);
  assert.match(erro.message, /Papel desativado/);
  // Um papel explicitamente ativo, ou sem linha de configuração, continua valendo.
  assert.equal((await autorizar({ papel: "admin", papelAtivo: true })).contexto?.role, "admin");
});

test("the role permissions still apply after membership is proven", async () => {
  const erro = recusa(await autorizar({ papel: "suporte" }, ORG, "manage_campaigns"));
  assert.equal(erro.status, 403);
  assert.match(erro.message, /Sem permissão/);
});

test("a super admin passes without a membership", async () => {
  const r = await autorizar({ superAdmin: true, papel: null });
  assert.equal(r.contexto?.role, "super_admin");
  assert.equal(r.contexto?.isSuperAdmin, true);
});
