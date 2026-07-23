// Edge Function: melhorar-proposta (Fase 2, opcional "híbrido").
// Recebe a copy montada por template e pede ao Claude para reescrever mais
// persuasiva/humana, SEM preço, preservando o link único e sem gatilhos de spam.
// Devolve { assunto, corpo } — a UI revisa e o usuário salva. Chave em secret.
//
// 🔒 RATE-LIMIT POR ORG (achado da auditoria: qualquer autenticado gastava IA à vontade).
// Exige getUser (a org sai do JWT), conta o uso do dia em ia_uso e barra ao estourar o teto
// (MELHORAR_PROPOSTA_MAX_DIA, default 30) com mensagem CLARA — não erro genérico. O uso só é
// registrado quando a IA responde de fato (falha não consome cota). ia_uso também dá ao dono
// a visibilidade de consumo por org.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { corsHeaders, json } from "../_shared/cors.ts";
import { resolverChave } from "../_shared/chaves.ts";

const TETO_PADRAO = 30;

// A copy que chega aqui é DELIBERADA (aprovada pelo dono): tom consultivo/direto, escassez
// honesta, saída fácil. O trabalho da IA é LAPIDAR, não reescrever — uma IA solta achata isso
// de volta pro genérico. Por isso o prompt é de PRESERVAÇÃO, com o que NÃO pode mudar listado
// antes do que pode. Na UI o botão é opcional e nasce DESLIGADO.
const SYSTEM = `Você lapida uma mensagem de PRIMEIRA ABORDAGEM (e-mail) já escrita por um
redator experiente, para dono de negócio local no Brasil. A mensagem JÁ está boa: o seu
trabalho é melhorar o acabamento SEM descaracterizá-la. Mudança pequena é sucesso; reescrita
é FALHA.

PRESERVE (inviolável):
- A ESTRUTURA e a ORDEM: abertura (constatação sobre o negócio) → o problema → o que foi
  feito → o link → a saída fácil → a assinatura.
- A ABERTURA como está: se ela cita nota e avaliações, mantenha; se NÃO cita, NÃO invente
  nota, avaliações nem elogio — a ausência é proposital (o dado não existe).
- O TOM: consultivo, direto, 1ª pessoa, sem bajulação e sem jargão de vendas.
- A ÚLTIMA LINHA (assinatura/nome) exatamente como está.
- A saída fácil ("se não for o momento...") — não transforme em pressão.
- EXATAMENTE 1 link (URL), idêntico ao original: não invente, não duplique, não remova.
- Tamanho entre 120 e 180 palavras.

PROIBIDO:
- Citar preço, valor ou custo.
- Inventar QUALQUER dado: nota, número de avaliações, prêmio, tempo de mercado, resultado.
- Palavras-gatilho de spam (grátis, promoção, urgente, clique aqui, garantido, oferta).
- Trocar o assunto por outro tema — pode ajustar a redação, no máximo 78 caracteres, sem CAPS.

PODE: melhorar ritmo, cortar repetição, tornar uma frase mais concreta, corrigir gramática.

Responda APENAS um JSON válido: {"assunto":"...","corpo":"..."}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);

  // service_role: ia_uso não é escrita pelo cliente (senão ele zeraria a própria cota).
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
  // 🔐 Cofre de chaves: ANTHROPIC_API_KEY passa a valer o override do painel, se houver.
  const key = await resolverChave(admin, "ANTHROPIC_API_KEY");
  if (!key) return json({ error: "IA indisponível (sem chave configurada)" }, 503);

  // AUTH OBRIGATÓRIA — a org (para o limite e o registro) sai do JWT, nunca do corpo.
  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) return json({ error: "Não autenticado" }, 401);
  const userId = userData.user.id;

  // RATE-LIMIT por org: quantas melhorias esta org já fez HOJE (UTC)?
  const teto = Number(Deno.env.get("MELHORAR_PROPOSTA_MAX_DIA") || TETO_PADRAO);
  const inicioDoDia = new Date();
  inicioDoDia.setUTCHours(0, 0, 0, 0);
  const { count: usados } = await admin
    .from("ia_uso")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("funcao", "melhorar-proposta")
    .gte("criado_em", inicioDoDia.toISOString());
  const jaUsou = usados ?? 0;
  if (jaUsou >= teto)
    return json({
      reason: "rate_limit",
      limite: teto,
      usados: jaUsou,
      error: `Limite diário de "Melhorar com IA" atingido nesta conta: ${jaUsou}/${teto} hoje. O contador zera à meia-noite (UTC). Se precisar de mais, ajuste MELHORAR_PROPOSTA_MAX_DIA.`,
    });

  let body: { assunto?: string; corpo?: string; lead_nome?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Body inválido" }, 400);
  }
  const assunto = (body.assunto ?? "").slice(0, 200);
  const corpo = (body.corpo ?? "").slice(0, 4000);
  if (!corpo.trim()) return json({ error: "Corpo vazio" }, 400);

  const modelo = Deno.env.get("ANTHROPIC_MODEL") || "claude-opus-4-8";
  const urlOriginal = corpo.match(/https?:\/\/\S+/)?.[0] ?? "";
  const prompt = `Negócio: ${body.lead_nome ?? ""}

Assunto atual:
${assunto}

Mensagem atual:
${corpo}

Reescreva melhorando a persuasão e a naturalidade, respeitando TODAS as regras.
Preserve o link exatamente como está${urlOriginal ? ` (${urlOriginal})` : ""}.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelo,
      max_tokens: 1200,
      system: SYSTEM + "\n\nResponda APENAS com o JSON, começando por { e terminando por }.",
      messages: [{ role: "user", content: prompt }],
    }),
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok)
    return json({ error: `Claude: ${data?.error?.message ?? "HTTP " + res.status}` }, 502);

  const txt = Array.isArray(data.content)
    ? data.content.map((c: { text?: string }) => c.text ?? "").join("")
    : "";
  const m = txt.match(/\{[\s\S]*\}/);
  if (!m) return json({ error: "Resposta da IA inválida" }, 502);
  let out: { assunto?: string; corpo?: string };
  try {
    out = JSON.parse(m[0]);
  } catch {
    return json({ error: "JSON da IA inválido" }, 502);
  }

  let novoCorpo = (out.corpo ?? corpo).trim();
  // Blindagem: se a IA removeu/alterou o link, reinjeta o original.
  if (urlOriginal && !novoCorpo.includes(urlOriginal)) novoCorpo += `\n\n${urlOriginal}`;
  const novoAssunto = (out.assunto ?? assunto).slice(0, 120);

  // Consome a cota SÓ agora (a IA respondeu de fato). Alimenta o limite e a visão de custo.
  await admin.from("ia_uso").insert({ user_id: userId, funcao: "melhorar-proposta", modelo });

  return json({ assunto: novoAssunto, corpo: novoCorpo, usados: jaUsou + 1, limite: teto });
});
