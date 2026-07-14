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

export type WaEnvio = { ok: boolean; para?: string; error?: string };

/** Envia 1 mensagem de teste para um número (DDI+DDD). Erro real da Evolution. */
export async function enviarTesteWhatsapp(numero: string, texto?: string): Promise<WaEnvio> {
  const { data, error } = await supabase.functions.invoke("wa-send-test", {
    body: { number: numero, text: texto },
  });
  if (error) throw error;
  return data as WaEnvio;
}
