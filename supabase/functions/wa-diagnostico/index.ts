// Diagnóstico operacional do pareamento WhatsApp (Evolution GO) — backend-only.
//
// Por que existe: o pareamento depende de um servidor externo (Evolution GO) cujo estado não é
// observável pela UI nem pelos logs acessíveis ao time. Esta função roda o protocolo REAL de
// pareamento numa instância TEMPORÁRIA (create → connect → esperar Connected → QR), devolve um
// relatório SEM segredos (tokens/ids redigidos, QR nunca devolvido) e SEMPRE apaga a instância
// temporária no fim. Não toca em linhas de wa_instancias nem em instâncias de clientes.
//
// Auth: mesmo segredo dos crons (x-cron-secret === CRON_SECRET). Chamada via pg_net pelo
// próprio banco, então o segredo nunca transita fora da infraestrutura.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { json } from "../_shared/cors.ts";
import {
  inicializarCofreWa,
  instanciaDaOrgComToken,
  jidCanonicoWhatsapp,
  waBase,
  waGlobalKey,
} from "../_shared/wa.ts";

const PRAZO_SESSAO_MS = 20_000;
const PRAZO_QR_MS = 20_000;
const INTERVALO_MS = 1_000;

function redigir(value: string): string {
  return value
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "<id>")
    .replace(/[A-Za-z0-9+/_=-]{24,}/g, "<redigido>")
    .replace(/(password|senha|apikey|token)[^\s,;]*/gi, "$1=<redigido>")
    .slice(0, 400);
}

function dormir(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function chamar(
  path: string,
  init: { method?: string; apikey: string; body?: unknown },
): Promise<{ status: number; payload: unknown; ms: number; erro?: string }> {
  const started = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(`${waBase()}${path}`, {
      method: init.method ?? "GET",
      headers: { apikey: init.apikey, "Content-Type": "application/json" },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: controller.signal,
    });
    const payload: unknown = await response.json().catch(() => null);
    return { status: response.status, payload, ms: Date.now() - started };
  } catch (error) {
    return {
      status: 0,
      payload: null,
      ms: Date.now() - started,
      erro: error instanceof Error ? error.name : "erro_de_rede",
    };
  } finally {
    clearTimeout(timeout);
  }
}

function mensagem(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const record = payload as Record<string, unknown>;
  const value = record.error ?? record.message;
  return typeof value === "string" ? redigir(value) : "";
}

function dados(payload: unknown): Record<string, unknown> | null {
  if (!payload || typeof payload !== "object") return null;
  const data = (payload as Record<string, unknown>).data;
  return data && typeof data === "object" ? (data as Record<string, unknown>) : null;
}

type Etapa = { etapa: string; status: number; ms: number; detalhe: string };

async function sondarPareamento(nomesAtivos: Set<string>) {
  const etapas: Etapa[] = [];
  const registrar = (etapa: string, r: Awaited<ReturnType<typeof chamar>>, detalhe = "") =>
    etapas.push({
      etapa,
      status: r.status,
      ms: r.ms,
      detalhe: detalhe || r.erro || mensagem(r.payload),
    });

  // 1. Inventário do servidor (só contagens — nada de nomes de clientes no relatório).
  const all = await chamar("/instance/all", { apikey: waGlobalKey() });
  const rawList = (all.payload as { data?: unknown } | null)?.data;
  const lista: Array<Record<string, unknown>> = Array.isArray(rawList) ? rawList : [];
  const inventario = {
    http: all.status,
    total: lista.length,
    conectadas: lista.filter((i) => (i.connected ?? i.Connected) === true).length,
    orfas: lista.filter((i) => {
      const nome = String(i.name ?? i.Name ?? "");
      return !nomesAtivos.has(nome);
    }).length,
    orfas_conectadas: lista.filter((i) => {
      const nome = String(i.name ?? i.Name ?? "");
      return !nomesAtivos.has(nome) && (i.connected ?? i.Connected) === true;
    }).length,
  };
  registrar("inventario", all, `total=${inventario.total}`);
  if (all.status !== 200) return { inventario, etapas, qr_gerado: false, logs: [] as string[] };

  // 2. Instância temporária.
  const nome = `diag-${Date.now().toString(36)}`;
  const token = crypto.randomUUID();
  const criar = await chamar("/instance/create", {
    method: "POST",
    apikey: waGlobalKey(),
    body: { name: nome, token },
  });
  registrar("create", criar);
  let qrGerado = false;
  let logs: string[] = [];
  let remoteId = "";
  try {
    if (criar.status < 200 || criar.status >= 300)
      return { inventario, etapas, qr_gerado: false, logs };
    const criada = dados(criar.payload);
    remoteId = String(criada?.id ?? criada?.Id ?? "");

    // 3. connect → esperar Connected.
    const connect = await chamar("/instance/connect", {
      method: "POST",
      apikey: token,
      body: { subscribe: ["MESSAGE", "CONNECTION", "QRCODE"] },
    });
    registrar("connect", connect);

    let conectado = false;
    const limiteSessao = Date.now() + PRAZO_SESSAO_MS;
    let ultimoStatus = "";
    while (Date.now() < limiteSessao) {
      await dormir(INTERVALO_MS);
      const st = await chamar("/instance/status", { apikey: token });
      const d = dados(st.payload);
      const atual = `${st.status}:${d?.Connected ?? d?.connected}/${d?.LoggedIn ?? d?.loggedIn}`;
      if (atual !== ultimoStatus) registrar("status", st, atual);
      ultimoStatus = atual;
      if ((d?.Connected ?? d?.connected) === true) {
        conectado = true;
        break;
      }
    }

    // 4. QR (só com sessão conectada — não provoca o segundo StartClient).
    if (conectado) {
      const limiteQr = Date.now() + PRAZO_QR_MS;
      let ultimo = "";
      while (Date.now() < limiteQr) {
        const q = await chamar("/instance/qr", { apikey: token });
        const d = dados(q.payload);
        const code = String(d?.Qrcode ?? d?.qrcode ?? "");
        if (q.status === 200 && code.startsWith("data:image/png;base64,")) {
          registrar("qr", q, `png_base64_len=${code.length}`);
          qrGerado = true;
          break;
        }
        const atual = `${q.status}:${mensagem(q.payload)}`;
        if (atual !== ultimo) registrar("qr", q);
        ultimo = atual;
        await dormir(INTERVALO_MS);
      }
    }

    // 5. Logs do servidor para esta instância (redigidos).
    if (!remoteId) {
      const again = await chamar("/instance/all", { apikey: waGlobalKey() });
      const found = Array.isArray((again.payload as { data?: unknown })?.data)
        ? (again.payload as { data: Array<Record<string, unknown>> }).data.find(
            (i) => String(i.name ?? i.Name ?? "") === nome,
          )
        : null;
      remoteId = String(found?.id ?? found?.Id ?? "");
    }
    if (remoteId) {
      const l = await chamar(`/instance/logs/${encodeURIComponent(remoteId)}?limit=40`, {
        apikey: waGlobalKey(),
      });
      if (Array.isArray(l.payload)) {
        logs = (l.payload as Array<Record<string, unknown>>).map((entry) =>
          redigir(`${entry.level ?? "LOG"}:${entry.message ?? ""}`),
        );
      } else {
        registrar("logs", l);
      }
    }
    return { inventario, etapas, qr_gerado: qrGerado, logs };
  } finally {
    // 6. SEMPRE remove a instância temporária.
    if (remoteId) {
      const del = await chamar(`/instance/delete/${encodeURIComponent(remoteId)}`, {
        method: "DELETE",
        apikey: waGlobalKey(),
      });
      registrar("delete", del);
    } else {
      etapas.push({ etapa: "delete", status: 0, ms: 0, detalhe: "id_remoto_nao_encontrado" });
    }
  }
}

/**
 * Sonda de fotos: para conversas ativas, chama /user/avatar exatamente como a Edge de conversas
 * faz e devolve SÓ o formato do identificador, o HTTP e a mensagem do provedor (dígitos
 * redigidos). Nenhum telefone, nome ou URL de foto sai daqui. Somente leitura.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sondarAvatares(admin: any, limite: number) {
  const { data: conversas } = await admin
    .from("wa_conversas")
    .select("org_id,instancia_id,remote_contact_id,normalized_phone")
    .neq("status", "archived")
    .order("last_message_at", { ascending: false })
    .limit(limite);
  const { data: conectadas } = await admin
    .from("wa_instancias")
    .select("id,org_id")
    .is("deleted_at", null)
    .eq("status", "conectado")
    .order("ordem", { ascending: true });
  const semDigitos = (value: string) => value.replace(/\d{5,}/g, "<num>");
  const formato = (value: string) =>
    !value
      ? "vazio"
      : value.includes("@")
        ? `jid@${value.split("@")[1]}`
        : `digitos_${value.replace(/\D/g, "").length}`;
  const resultados = [];
  for (const conversa of conversas ?? []) {
    const numero = String(conversa.normalized_phone || conversa.remote_contact_id || "").trim();
    const candidatos = [
      conversa.instancia_id,
      ...(conectadas ?? [])
        .filter((row: { org_id: string }) => row.org_id === conversa.org_id)
        .map((row: { id: string }) => row.id),
    ];
    const tentativas = [];
    for (const instanceId of [...new Set(candidatos)]) {
      const instance = await instanciaDaOrgComToken(admin, conversa.org_id, String(instanceId));
      if (!instance) {
        tentativas.push({ chip: "sem_token_ou_arquivado" });
        continue;
      }
      const r = await chamar("/user/avatar", {
        method: "POST",
        apikey: instance.token,
        body: { number: jidCanonicoWhatsapp(numero), preview: true },
      });
      const d = dados(r.payload);
      const url = String(d?.URL ?? d?.url ?? "");
      tentativas.push({
        chip: instance.status,
        http: r.status,
        ms: r.ms,
        url_https: url.startsWith("https://"),
        msg: semDigitos(r.erro || mensagem(r.payload)),
      });
      if (r.status === 200 && url) break;
    }
    resultados.push({
      formato_numero: formato(numero),
      fonte: conversa.normalized_phone ? "normalized_phone" : "remote_contact_id",
      formato_remote: formato(String(conversa.remote_contact_id ?? "")),
      tentativas,
    });
  }
  return { conversas: resultados.length, resultados };
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "Método não permitido." }, 405);
  const secret = Deno.env.get("CRON_SECRET");
  if (!secret || request.headers.get("x-cron-secret") !== secret) {
    return json({ error: "Não autorizado." }, 401);
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
  await inicializarCofreWa(admin);
  if (!waBase() || !waGlobalKey()) {
    return json({ configurado: false }, 503);
  }

  const { data: ativas } = await admin.from("wa_instancias").select("nome").is("deleted_at", null);
  const nomesAtivos = new Set<string>((ativas ?? []).map((row: { nome: string }) => row.nome));

  const started = Date.now();
  const body: Record<string, unknown> = await request
    .clone()
    .json()
    .catch(() => ({}));
  if (body.modo === "avatares") {
    const limite = Math.min(Math.max(Number(body.limite) || 8, 1), 20);
    return json({ configurado: true, ...(await sondarAvatares(admin, limite)) });
  }
  const relatorio = await sondarPareamento(nomesAtivos);
  return json({ configurado: true, duracao_ms: Date.now() - started, ...relatorio });
});
