// Envio manual de mensagens WhatsApp — decisão PURA (sem rede, sem Supabase), testada à parte.
//
// Princípios:
//  * uma operação lógica = um operation_id; repetir a MESMA operação nunca duplica a mensagem;
//  * resposta perdida (CORS, rede, timeout) ou 5xx NÃO autoriza reenvio: consulta-se o registro
//    do backend pelo id da operação;
//  * só "recusado" (4xx antes do registro, ou recusa do WhatsApp) significa que nada saiu;
//  * "não confirmado" nunca é exibido como "falhou".

/** Resultado estruturado devolvido pela Edge wa-responder para uma operação REGISTRADA. */
export type WaEnvioResultado = {
  ok: boolean;
  operation_id: string;
  message_id: string | null;
  external_id: string | null;
  status: "pending" | "sent" | "delivered" | "read" | "failed" | "uncertain";
  occurred_at: string;
  duplicate?: boolean;
  error?: string;
};

export type WaEnvioDesfecho =
  | { tipo: "confirmado"; resultado: WaEnvioResultado }
  | { tipo: "recusado"; mensagem: string; resultado?: WaEnvioResultado }
  | { tipo: "nao_confirmado"; mensagem: string; resultado?: WaEnvioResultado };

export const MENSAGEM_ENVIO_NAO_CONFIRMADO =
  "Envio não confirmado. Verifique o status antes de tentar novamente.";

const STATUS_CONFIRMADOS = new Set<WaEnvioResultado["status"]>(["sent", "delivered", "read"]);

export function desfechoDoResultado(resultado: WaEnvioResultado): WaEnvioDesfecho {
  if (STATUS_CONFIRMADOS.has(resultado.status)) return { tipo: "confirmado", resultado };
  if (resultado.status === "failed") {
    return {
      tipo: "recusado",
      mensagem: resultado.error ?? "O WhatsApp recusou o envio desta mensagem.",
      resultado,
    };
  }
  return { tipo: "nao_confirmado", mensagem: MENSAGEM_ENVIO_NAO_CONFIRMADO, resultado };
}

/** Converte a linha registrada em wa_mensagens no mesmo formato do resultado da Edge. */
export function resultadoDoRegistro(
  registro: {
    id: string;
    status: string;
    externo_id?: string | null;
    provider_occurred_at: string | null;
    criado_em: string;
  },
  operationId: string,
): WaEnvioResultado {
  const status = registro.status as WaEnvioResultado["status"];
  return {
    ok: STATUS_CONFIRMADOS.has(status),
    operation_id: operationId,
    message_id: registro.id,
    external_id: registro.externo_id ?? null,
    status,
    occurred_at: registro.provider_occurred_at ?? registro.criado_em,
  };
}

/**
 * Executa UMA tentativa de envio e, se a resposta se perder, reconcilia com o backend.
 * `enviar` é chamado exatamente uma vez — nunca há reenvio automático.
 */
export async function reconciliarEnvio(deps: {
  enviar: () => Promise<WaEnvioResultado>;
  consultar: () => Promise<WaEnvioResultado | null>;
  statusHttp: (error: unknown) => number | null;
  mensagemDoErro: (error: unknown) => string;
}): Promise<WaEnvioDesfecho> {
  try {
    return desfechoDoResultado(await deps.enviar());
  } catch (error) {
    const status = deps.statusHttp(error);
    if (status !== null && status >= 400 && status < 500) {
      // Rejeitado antes do registro: nada foi gravado nem enviado.
      return { tipo: "recusado", mensagem: deps.mensagemDoErro(error) };
    }
    // Sem resposta (CORS/rede/timeout) ou 5xx: o envio pode ter ocorrido. Consulta o registro.
    try {
      const registrado = await deps.consultar();
      if (registrado) return desfechoDoResultado(registrado);
    } catch {
      // A consulta também falhou: segue como não confirmado.
    }
    return { tipo: "nao_confirmado", mensagem: MENSAGEM_ENVIO_NAO_CONFIRMADO };
  }
}

export type OperacaoEnvio = { conversaId: string; texto: string; operationId: string };

/**
 * Escolhe o operation_id de uma tentativa: o mesmo texto na mesma conversa reutiliza a operação
 * ainda não confirmada (repetir não duplica); texto editado ou outra conversa = operação nova.
 */
export function escolherOperacaoEnvio(
  pendente: OperacaoEnvio | null,
  conversaId: string,
  texto: string,
  gerarId: () => string,
): OperacaoEnvio {
  if (pendente && pendente.conversaId === conversaId && pendente.texto === texto) return pendente;
  return { conversaId, texto, operationId: gerarId() };
}
