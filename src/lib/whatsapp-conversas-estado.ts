// Estado da Central de Conversas — regras PURAS (sem React, sem rede), testadas à parte.

type ContatoMesclavel = {
  id: string;
  numero: string;
  nome: string;
  avatar?: string;
  ultimaMensagem: string;
  horario: string;
  naoLidas: number;
  statusAtendimento: unknown;
  leadId?: string;
  assignedTo?: string;
  chip?: unknown;
  mensagens: unknown[];
};

/**
 * Mescla a LISTA de conversas (só o resumo de cada uma) com o que já foi carregado do DETALHE.
 *
 * Defeito que isto corrige: a recarga da lista substituía cada contato por uma versão sem
 * mensagens, notas e dados do CRM. Quando ela terminava DEPOIS do detalhe da conversa aberta
 * (a lista é mais lenta), o histórico sumia e o chat ficava em branco. Aqui o detalhe já
 * carregado é preservado e só os campos que a lista realmente traz são atualizados.
 */
export function mesclarListaComDetalhe<T extends ContatoMesclavel>(
  anteriores: readonly T[],
  novos: readonly T[],
): T[] {
  const porId = new Map(anteriores.map((contato) => [contato.id, contato]));
  return novos.map((novo) => {
    const antigo = porId.get(novo.id);
    if (!antigo) return novo;
    const detalheCarregado = antigo.mensagens.length > 0;
    return {
      ...antigo,
      numero: novo.numero,
      nome: detalheCarregado ? antigo.nome : novo.nome,
      avatar: novo.avatar ?? antigo.avatar,
      ultimaMensagem: novo.ultimaMensagem,
      horario: novo.horario,
      naoLidas: novo.naoLidas,
      statusAtendimento: novo.statusAtendimento,
      leadId: novo.leadId ?? antigo.leadId,
      assignedTo: novo.assignedTo,
      chip: novo.chip,
    };
  });
}

/**
 * A conversa conta como "lida" quando está ABERTA pelo atendente e a aba está visível. Devolve a
 * chave da leitura a enviar (uma por conversa+contagem, para não repetir a chamada) ou null.
 */
export function leituraAutomatica(input: {
  conversaAbertaId: string | null;
  naoLidas: number;
  abaVisivel: boolean;
  ultimaChaveEnviada: string | null;
}): string | null {
  if (!input.conversaAbertaId || input.naoLidas <= 0 || !input.abaVisivel) return null;
  const chave = `${input.conversaAbertaId}:${input.naoLidas}`;
  return chave === input.ultimaChaveEnviada ? null : chave;
}
