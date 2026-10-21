// Número de atendimento de uma conversa WhatsApp.
//
// Regras (não negociáveis, vêm do vínculo REAL conversa -> instância):
//   * o número exibido é sempre o da instância gravada na conversa;
//   * nunca se usa o telefone do lead nem o "primeiro chip conectado" como substituto;
//   * instância arquivada ou sem número gravado mostra "não identificado";
//   * nenhum número é inventado.

export type WaInstanciaAtendimento = {
  id: string;
  nome: string;
  numero: string | null;
  status: string;
  provider_status: string | null;
  arquivada: boolean;
};

export type EstadoChipAtendimento =
  "conectado" | "aguardando" | "desconectado" | "arquivado" | "desconhecido";

export const NUMERO_NAO_IDENTIFICADO = "Número de atendimento não identificado";

/** Padrão brasileiro: 554197844716 -> +55 41 9784-4716; 5541997844716 -> +55 41 99784-4716. */
export function formatarNumeroWhatsapp(value: string | null | undefined): string | null {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (digits.length < 8) return null;
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    const ddd = digits.slice(2, 4);
    const resto = digits.slice(4);
    const corte = resto.length - 4;
    return `+55 ${ddd} ${resto.slice(0, corte)}-${resto.slice(corte)}`;
  }
  return `+${digits}`;
}

export type ChipAtendimentoDescrito = {
  /** Número formatado, ou null quando a instância não tem número conhecido. */
  numeroFormatado: string | null;
  /** Texto pronto para a interface: o número ou "Número de atendimento não identificado". */
  rotuloNumero: string;
  /** Nome técnico da instância; null se a conversa não aponta para instância conhecida. */
  nomeInstancia: string | null;
  estado: EstadoChipAtendimento;
  estadoRotulo: string;
};

const ROTULOS_ESTADO: Record<EstadoChipAtendimento, string> = {
  conectado: "Conectado",
  aguardando: "Aguardando conexão",
  desconectado: "Desconectado",
  arquivado: "Instância arquivada",
  desconhecido: "Instância não encontrada",
};

export function descreverChipAtendimento(
  chip: WaInstanciaAtendimento | null | undefined,
): ChipAtendimentoDescrito {
  if (!chip) {
    return {
      numeroFormatado: null,
      rotuloNumero: NUMERO_NAO_IDENTIFICADO,
      nomeInstancia: null,
      estado: "desconhecido",
      estadoRotulo: ROTULOS_ESTADO.desconhecido,
    };
  }
  const numeroFormatado = formatarNumeroWhatsapp(chip.numero);
  let estado: EstadoChipAtendimento;
  if (chip.arquivada) estado = "arquivado";
  else if (chip.status === "conectado" && chip.provider_status === "connected")
    estado = "conectado";
  else if (chip.status === "aguardando" || chip.provider_status === "pairing")
    estado = "aguardando";
  else estado = "desconectado";
  return {
    numeroFormatado,
    rotuloNumero: numeroFormatado ?? NUMERO_NAO_IDENTIFICADO,
    nomeInstancia: chip.nome,
    estado,
    estadoRotulo: ROTULOS_ESTADO[estado],
  };
}
