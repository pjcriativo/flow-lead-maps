// Edge: sdr-sugerir — o AGENTE SDR rascunha respostas para conversas de LEAD.
//
// 🔒 AUTH OBRIGATÓRIA; tudo escopado por user_id do JWT.
// 🚧 PORTÃO: o agente NUNCA envia. Ele grava 'rascunho' e o dono aprova. Não existe caminho
//    neste arquivo que chame o envio — é proposital.
// 🙅 TRAVA DE PESSOA ERRADA: só age em conversa com lead_id. O número conectado é o WhatsApp
//    PESSOAL do dono (hoje 100% das conversas são pessoais) — responder família seria desastre.
// 💸 TETO: US$1/dia e US$10/mês de IA. Sem teto não liga (doutrina do projeto).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { corsHeaders, json } from "../_shared/cors.ts";
import {
  conversaElegivel,
  alertasDePromessa,
  historicoParaPrompt,
  planejarSdr,
  ESTADO_INICIAL,
  TETO_SDR_DIA_USD,
  TETO_SDR_MES_USD,
  type MensagemConversa,
} from "../../../src/lib/sdr.ts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Rec = Record<string, any>;

const PRECO_ENTRADA_POR_TOKEN = 1 / 1_000_000; // Claude Haiku-ish; o custo real é pequeno
const PRECO_SAIDA_POR_TOKEN = 5 / 1_000_000;

const REGRAS = `Você é um SDR brasileiro respondendo no WhatsApp em nome de uma agência que refaz
sites de negócios locais. Escreva a PRÓXIMA mensagem da conversa.

REGRAS INEGOCIÁVEIS:
- NUNCA invente preço, prazo, desconto ou garantia. Se perguntarem, diga que vai confirmar.
- NUNCA invente dados do negócio do lead (nota, número de clientes, faturamento).
- Curto: no máximo 2 frases, tom de pessoa real, sem emoji exagerado, sem "prezado".
- Objetivo: entender a necessidade e propor uma conversa rápida. Não feche venda sozinho.
- Responda SOMENTE com a mensagem, sem aspas e sem explicação.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);
  const chave = Deno.env.get("ANTHROPIC_API_KEY");
  if (!chave) return json({ error: "ANTHROPIC_API_KEY não configurada" }, 503);

  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) return json({ error: "Não autenticado" }, 401);
  const userId = userData.user.id;

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  let b: Rec = {};
  try {
    b = await req.json();
  } catch {
    /* body opcional */
  }
  const limite = Math.max(1, Math.min(10, Number(b?.limite ?? 3)));
  const agora = new Date();
  const diaRef = agora.toISOString().slice(0, 10);
  const mesRef = diaRef.slice(0, 7);

  // ---------- TETO antes de gastar ----------
  const { data: gastos } = await admin
    .from("sdr_sugestoes")
    .select("custo_usd, dia_ref")
    .eq("user_id", userId)
    .eq("mes_ref", mesRef);
  const gastoMes = (gastos ?? []).reduce((s, g) => s + Number(g.custo_usd ?? 0), 0);
  const gastoDia = (gastos ?? [])
    .filter((g) => g.dia_ref === diaRef)
    .reduce((s, g) => s + Number(g.custo_usd ?? 0), 0);
  const plano = planejarSdr(gastoDia, gastoMes);
  if (!plano.podeRodar)
    return json({ ok: false, reason: "teto", motivo: plano.motivo, gastoDia, gastoMes });

  // ---------- conversas candidatas: SÓ as que têm LEAD ----------
  const { data: msgs } = await admin
    .from("wa_mensagens")
    .select("id, numero, lead_id, direcao, texto, criado_em")
    .eq("user_id", userId)
    .not("lead_id", "is", null)
    .order("criado_em", { ascending: false })
    .limit(500);

  const porNumero = new Map<string, MensagemConversa[]>();
  for (const m of (msgs ?? []) as MensagemConversa[]) {
    if (!porNumero.has(m.numero)) porNumero.set(m.numero, []);
    porNumero.get(m.numero)!.push(m);
  }

  const { data: pendentes } = await admin
    .from("sdr_sugestoes")
    .select("numero")
    .eq("user_id", userId)
    .eq("estado", "rascunho");
  const comPendencia = new Set((pendentes ?? []).map((p) => p.numero));

  const criadas: Rec[] = [];
  const pulados: Rec[] = [];
  let gastoAcumulado = 0;

  for (const [numero, lista] of porNumero) {
    if (criadas.length >= limite) break;
    const eleg = conversaElegivel(lista, comPendencia.has(numero));
    if (!eleg.elegivel) {
      pulados.push({ numero, motivo: eleg.motivo });
      continue;
    }
    if (!planejarSdr(gastoDia + gastoAcumulado, gastoMes + gastoAcumulado).podeRodar) break;

    const ordenadas = [...lista].sort((a, b) => a.criado_em.localeCompare(b.criado_em));
    const ultima = ordenadas[ordenadas.length - 1];
    const leadId = lista.find((m) => m.lead_id)?.lead_id ?? null;
    const { data: lead } = leadId
      ? await admin
          .from("leads")
          .select("business_name, category, city, website")
          .eq("id", leadId)
          .maybeSingle()
      : { data: null };

    const contexto = `NEGÓCIO DO LEAD: ${lead?.business_name ?? "(desconhecido)"}${
      lead?.category ? ` · ${lead.category}` : ""
    }${lead?.city ? ` · ${lead.city}` : ""}${lead?.website ? ` · site: ${lead.website}` : " · sem site"}

CONVERSA:
${historicoParaPrompt(lista)}`;

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": chave,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: Deno.env.get("ANTHROPIC_MODEL") || "claude-sonnet-5",
        max_tokens: 300,
        system: REGRAS,
        messages: [{ role: "user", content: contexto }],
      }),
    });
    if (!r.ok) {
      pulados.push({ numero, motivo: "ia_falhou", status: r.status });
      continue;
    }
    const j: Rec = await r.json();
    const texto = (j?.content ?? [])
      .map((c: Rec) => c?.text ?? "")
      .join("")
      .trim();
    if (!texto) {
      pulados.push({ numero, motivo: "ia_vazia" });
      continue;
    }
    const custo =
      Number(j?.usage?.input_tokens ?? 0) * PRECO_ENTRADA_POR_TOKEN +
      Number(j?.usage?.output_tokens ?? 0) * PRECO_SAIDA_POR_TOKEN;
    gastoAcumulado += custo;

    // promessas inventadas viram ALERTA para o dono ver antes de aprovar
    const alertas = alertasDePromessa(texto);

    const { data: nova } = await admin
      .from("sdr_sugestoes")
      .insert({
        user_id: userId,
        numero,
        lead_id: leadId,
        mensagem_id: ultima.id,
        texto,
        alertas,
        estado: ESTADO_INICIAL, // 'rascunho' — o agente NÃO envia
        custo_usd: custo,
        dia_ref: diaRef,
        mes_ref: mesRef,
      })
      .select("id")
      .single();
    criadas.push({ id: nova?.id, numero, texto, alertas, custo });
  }

  return json({
    ok: true,
    criadas: criadas.length,
    sugestoes: criadas,
    pulados: pulados.slice(0, 20),
    // deixa explícito para quem lê a resposta: nada saiu daqui.
    enviadas: 0,
    portao: "todo rascunho aguarda aprovação do dono — o agente não envia",
    gasto: { dia: gastoDia + gastoAcumulado, mes: gastoMes + gastoAcumulado },
    teto: { dia: TETO_SDR_DIA_USD, mes: TETO_SDR_MES_USD },
  });
});
