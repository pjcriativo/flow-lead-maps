// Camada de serviço — WhatsApp (Fase 2, peça 1: PROVA DE CONEXÃO). Fala com as
// Edge Functions wa-connect / wa-send-test (que falam com a Evolution GO). As
// chaves da Evolution ficam só no secret do servidor — nunca aqui no cliente.
import { supabase } from "@/integrations/supabase/client";

export type WaConnect =
  | { status: "conectado"; instancia: string; numero: string }
  | { status: "qr"; instancia: string; qr: string }
  | { status: "code"; instancia: string; code: string }
  | { status: "aguardando"; instancia: string; aviso?: string }
  | { status: "erro"; error: string };

/** Cria/lê a instância dedicada e devolve o QR (pra parear) ou "conectado".
 * fresh=true (clique explícito em "Conectar") recria a sessão p/ um QR novo
 * (o QR da Evolution GO é estático e vale só ~60s). O polling passa fresh=false. */
export async function conectarWhatsapp(fresh = false): Promise<WaConnect> {
  const { data, error } = await supabase.functions.invoke("wa-connect", { body: { fresh } });
  if (error) throw error;
  return data as WaConnect;
}

/** Gera um CÓDIGO DE PAREAMENTO para o número dedicado (alternativa confiável ao QR).
 * O dono digita o código em WhatsApp → Conectar um aparelho → Conectar com número. */
export async function pairWhatsapp(phone: string): Promise<WaConnect> {
  const { data, error } = await supabase.functions.invoke("wa-connect", { body: { phone } });
  if (error) throw error;
  return data as WaConnect;
}

// ===== N CHIPS por org (edge wa-chips) =====
export type WaChip = {
  id: string;
  nome: string;
  numero: string | null;
  status: "desconectado" | "aguardando" | "conectado" | "erro" | "queimada" | string;
  funcao: "disparo" | "conversa" | string;
  ordem: number;
};

async function waChips<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("wa-chips", { body });
  if (error) throw error;
  return data as T;
}

/** Lista os chips (instâncias) da org. */
export async function listarChips(): Promise<WaChip[]> {
  const r = await waChips<{ chips: WaChip[] }>({ acao: "listar" });
  return r.chips ?? [];
}

/** Cria um chip novo (função disparo/conversa). Depois pareie-o. */
export async function criarChip(funcao: "disparo" | "conversa" = "disparo") {
  return waChips<{ id: string; nome: string; status: string; funcao: string }>({
    acao: "criar",
    funcao,
  });
}

/** Gera o código de pareamento de um chip (recria a sessão dele). */
export async function parearChip(instancia_id: string, phone: string) {
  return waChips<WaConnect & { instancia_id?: string }>({ acao: "parear", instancia_id, phone });
}

/** Gera o QR de um chip (recria a sessão dele). */
export async function qrChip(instancia_id: string) {
  return waChips<WaConnect & { instancia_id?: string }>({ acao: "qr", instancia_id });
}

/** Lê o status real de um chip (sincroniza numero/status). */
export async function statusChip(instancia_id: string) {
  return waChips<{ status: string; numero: string | null; instancia_id?: string }>({
    acao: "status",
    instancia_id,
  });
}

/** Muda função/status/ordem de um chip (marcar queimado, graduar, reordenar). */
export async function marcarChip(
  instancia_id: string,
  patch: { funcao?: "disparo" | "conversa"; status?: string; ordem?: number },
) {
  return waChips<{ ok: boolean; error?: string }>({ acao: "marcar", instancia_id, ...patch });
}

/** Checa a saúde de um chip ao vivo (ETAPA 3): se queimou, já rotaciona pro próximo + avisa. */
export async function checarChip(instancia_id: string) {
  return waChips<{
    resultado: "sadio" | "suspeito" | "queimou" | "pulado" | "erro";
    falhas?: number;
    loggedIn?: boolean;
    rotacao?: { proximo: string | null; alerta: string };
  }>({ acao: "checar", instancia_id });
}

/** Graduação: o chip que mandou pro lead vira 'conversa' (gancho: lead move p/ Respondeu). */
export async function graduarLeadWa(lead_id: string) {
  return waChips<{ graduou: boolean; chip?: string }>({ acao: "graduar_lead", lead_id });
}

// ===== Alertas visíveis (wa_alertas) — lidos direto por RLS (SELECT/UPDATE do dono) =====
export type WaAlerta = {
  id: string;
  tipo: string;
  mensagem: string;
  lido: boolean;
  criado_em: string;
};

/** Alertas não lidos da org (chip queimado, rotação, sem chip, graduação). */
export async function listarAlertas(): Promise<WaAlerta[]> {
  const { data, error } = await supabase
    .from("wa_alertas")
    .select("id, tipo, mensagem, lido, criado_em")
    .eq("lido", false)
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return (data ?? []) as WaAlerta[];
}

/** Marca um alerta como lido (dispensar). */
export async function marcarAlertaLido(id: string): Promise<void> {
  const { error } = await supabase.from("wa_alertas").update({ lido: true }).eq("id", id);
  if (error) throw error;
}

export type WaEnvio = { ok: boolean; para?: string; error?: string };

/** Envia 1 mensagem de teste para um número (DDI+DDD). Erro real da Evolution. */
export async function enviarTesteWhatsapp(numero: string, texto?: string): Promise<WaEnvio> {
  const { data, error } = await supabase.functions.invoke("wa-send-test", {
    body: { number: numero, text: texto },
  });
  if (error) throw error;
  return data as WaEnvio;
}
