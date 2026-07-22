// Edge: wa-webhook — RECEBE os eventos de mensagem da Evolution GO e grava em wa_mensagens.
// PÚBLICA (verify_jwt=false) porque quem chama é a Evolution, não um usuário. Anti-spoof: exige
// ?k=<WA_WEBHOOK_SECRET> na URL (só a Evolution, configurada por nós, conhece). A org é
// identificada pelo NOME da instância (única por org). Sempre responde 200 (não provoca retry).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { corsHeaders, json } from "../_shared/cors.ts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pick(obj: any, paths: string[]): any {
  for (const p of paths) {
    let cur = obj;
    let ok = true;
    for (const seg of p.split(".")) {
      if (cur && typeof cur === "object" && seg in cur) cur = cur[seg];
      else {
        ok = false;
        break;
      }
    }
    if (ok && cur !== undefined && cur !== null) return cur;
  }
  return undefined;
}

function soDigitos(jidOuNumero: string): string {
  // "554199999@s.whatsapp.net" | "554199999:12@s.whatsapp.net" -> "554199999"
  return String(jidOuNumero || "")
    .split("@")[0]
    .split(":")[0]
    .replace(/\D/g, "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const url = new URL(req.url);
  const k = url.searchParams.get("k");

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  // anti-spoof: o secret vai na PRÓPRIA URL (?k=...) — é o que a Evolution guarda e chama de volta.
  // (Ela não manda header nenhum; header não serviria.) POST sem o ?k certo é rejeitado.
  if (!k || k !== Deno.env.get("WA_WEBHOOK_SECRET")) return json({ ok: false }, 401);

  const raw = await req.text().catch(() => "");
  if (!raw) return json({ ok: true, ignored: "no-body" });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any = {};
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ ok: true, ignored: "nao-json" });
  }

  const data = body.data ?? body.Data ?? body;
  const info = data.Info ?? data.info ?? data.key ?? data;

  const evento = String(body.event ?? body.Event ?? body.type ?? "").toLowerCase();
  const fromMe = Boolean(
    pick(info, ["IsFromMe", "isFromMe", "fromMe"]) ??
    pick(data, ["IsFromMe", "fromMe"]) ??
    pick(body, ["fromMe"]),
  );

  const nomeInstancia = String(
    pick(body, ["instance", "instanceName", "Instance", "name", "Name"]) ?? "",
  );
  if (!nomeInstancia) return json({ ok: true, ignored: "no-instance" });

  const chatJid = String(
    pick(info, ["Chat", "chat", "RemoteJid", "remoteJid", "Sender", "sender"]) ??
      pick(data, ["Chat", "remoteJid", "from"]) ??
      "",
  );
  const numero = soDigitos(chatJid);

  // SÓ conversas 1-a-1 com um número (@s.whatsapp.net). Grupos (@g.us), newsletters
  // (@newsletter), status/broadcast e listas ficam de fora — não são leads.
  const ehGrupo =
    Boolean(pick(info, ["IsGroup", "isGroup"])) ||
    /@g\.us|@broadcast|@newsletter|status@/i.test(chatJid) ||
    !/@s\.whatsapp\.net$/i.test(chatJid);
  if (ehGrupo) return json({ ok: true, ignored: "nao-individual" });

  const texto = String(
    pick(data, [
      "Message.conversation",
      "Message.Conversation",
      "message.conversation",
      "Message.extendedTextMessage.text",
      "Message.ExtendedTextMessage.Text",
      "message.extendedTextMessage.text",
      "body",
      "text",
    ]) ?? "",
  );
  const externoId =
    String(pick(info, ["ID", "Id", "id"]) ?? pick(data, ["id", "ID"]) ?? "") || null;
  const pushName = pick(info, ["PushName", "pushName", "notifyName"]) ?? null;

  // Só nos interessa MENSAGEM recebida (não a nossa própria, não evento de conexão).
  const ehMensagem = !evento || evento.includes("message") || evento.includes("msg") || !!texto;
  if (!ehMensagem || fromMe || !numero || !texto) {
    return json({ ok: true, ignored: "not-inbound-text", evento, fromMe, temTexto: !!texto });
  }

  // Org dona da instância (pelo NOME). O server vê todas; escopamos pela linha encontrada.
  const { data: inst } = await admin
    .from("wa_instancias")
    .select("id, user_id")
    .eq("nome", nomeInstancia)
    .maybeSingle();
  if (!inst) return json({ ok: true, ignored: "instancia-desconhecida" });

  // Casa o número com um lead da org (best-effort).
  const { data: lead } = await admin
    .from("leads")
    .select("id")
    .eq("user_id", inst.user_id)
    .eq("whatsapp", numero)
    .maybeSingle();

  const { error } = await admin.from("wa_mensagens").insert({
    user_id: inst.user_id,
    instancia_id: inst.id,
    numero,
    lead_id: lead?.id ?? null,
    nome_contato: pushName,
    direcao: "in",
    tipo: "texto",
    texto,
    externo_id: externoId,
    lida: false,
  });
  // externo_id duplicado (23505) = evento repetido → ok, ignora.
  if (error && !String(error.code).includes("23505"))
    return json({ ok: true, warn: error.message });

  return json({ ok: true, stored: true });
});
