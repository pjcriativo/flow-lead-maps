// Rodízio de chips de disparo do WhatsApp — decisão PURA (sem I/O), usada pelo worker de envio
// e pela sonda de diagnóstico. O chip é escolhido NA HORA DO ENVIO, não na aprovação da
// campanha: um chip que caiu, queimou ou bateu o teto diário não segura a fila.
//
// Ordem de preferência para um envio vinculado ao chip X:
//   1. Contingência ativa autorizada para X → o backup indicado (decisão humana explícita).
//   2. O próprio X, se utilizável e abaixo do teto — mantém o lead falando com o mesmo número.
//   3. Outro chip de DISPARO utilizável, o MENOS usado hoje (empate: ordem da fila).
// Nenhum utilizável → adiar (nunca enviar por chip sem saúde comprovada).

export const WA_SAUDE_FRESCA_MS = 5 * 60_000;

export type ChipRotacao = {
  id: string;
  status: string;
  funcao: string;
  numero: string | null;
  provider_status: string;
  operational_health: string;
  last_provider_success_at: string | null;
  last_health_check_at?: string | null;
  ordem: number;
  enviosHoje: number;
};

export type MotivoIndisponivel =
  | "status_nao_conectado"
  | "sem_numero_pareado"
  | "provedor_desconectado"
  | "saude_nao_saudavel"
  | "saude_desatualizada"
  | "teto_diario";

export type EscolhaChip =
  | {
      chipId: string;
      motivo: "contingencia" | "chip_original" | "rodizio";
      trocou: boolean;
    }
  | { chipId: null; motivo: "sem_chip_disponivel"; bloqueios: Record<string, MotivoIndisponivel> };

/** Por que um chip NÃO pode enviar agora (null = pode). `exigirDisparo` vale fora da contingência. */
export function motivoIndisponivel(
  chip: ChipRotacao,
  teto: number,
  agora: number,
  exigirDisparo: boolean,
): MotivoIndisponivel | null {
  if (chip.status !== "conectado") return "status_nao_conectado";
  if (exigirDisparo && chip.funcao !== "disparo") return "status_nao_conectado";
  if (!chip.numero) return "sem_numero_pareado";
  if (chip.provider_status !== "connected") return "provedor_desconectado";
  if (chip.operational_health !== "healthy") return "saude_nao_saudavel";
  const sucesso = chip.last_provider_success_at ? Date.parse(chip.last_provider_success_at) : NaN;
  if (!Number.isFinite(sucesso) || agora - sucesso > WA_SAUDE_FRESCA_MS)
    return "saude_desatualizada";
  if (chip.enviosHoje >= teto) return "teto_diario";
  return null;
}

export function escolherChipParaEnvio(input: {
  chipOriginalId: string;
  backupContingenciaId: string | null;
  chips: ChipRotacao[];
  teto: number;
  agora?: number;
}): EscolhaChip {
  const agora = input.agora ?? Date.now();
  const porId = new Map(input.chips.map((chip) => [chip.id, chip]));
  const bloqueios: Record<string, MotivoIndisponivel> = {};
  const avaliar = (id: string, exigirDisparo: boolean) => {
    const chip = porId.get(id);
    if (!chip) return false;
    const motivo = motivoIndisponivel(chip, input.teto, agora, exigirDisparo);
    if (motivo) bloqueios[id] = motivo;
    return motivo === null;
  };

  if (input.backupContingenciaId && avaliar(input.backupContingenciaId, false)) {
    return {
      chipId: input.backupContingenciaId,
      motivo: "contingencia",
      trocou: input.backupContingenciaId !== input.chipOriginalId,
    };
  }
  // Com contingência ativa, o chip de origem foi declarado fora de operação por um humano.
  if (!input.backupContingenciaId && avaliar(input.chipOriginalId, true)) {
    return { chipId: input.chipOriginalId, motivo: "chip_original", trocou: false };
  }

  const alternativas = input.chips
    .filter(
      (chip) =>
        chip.id !== input.chipOriginalId &&
        chip.id !== input.backupContingenciaId &&
        avaliar(chip.id, true),
    )
    .sort((a, b) => a.enviosHoje - b.enviosHoje || a.ordem - b.ordem || a.id.localeCompare(b.id));
  const escolhido = alternativas[0];
  if (escolhido) return { chipId: escolhido.id, motivo: "rodizio", trocou: true };
  return { chipId: null, motivo: "sem_chip_disponivel", bloqueios };
}

export const WA_INTERVALO_MIN_CHECAGEM_MS = 60_000;

const REVALIDAVEIS = new Set<MotivoIndisponivel>([
  "saude_desatualizada",
  "provedor_desconectado",
  "saude_nao_saudavel",
]);

/**
 * Chips conectados e pareados cuja saúde está velha ou ruim merecem uma checagem AO VIVO antes
 * de decidir: sem monitor periódico, a saúde envelhece em 5 min e travaria a fila; e um chip que
 * caiu e voltou precisa poder reassumir. No máximo 1 checagem por chip a cada 60 s.
 */
export function chipsParaRevalidar(
  chips: ChipRotacao[],
  teto: number,
  agora = Date.now(),
): string[] {
  return chips
    .filter((chip) => {
      const motivo = motivoIndisponivel(chip, teto, agora, false);
      // Um chip já pareado que o provedor marcou como desconectado pode ter sido reconectado
      // pela própria Evolution; só uma checagem ao vivo devolve ele ao rodízio.
      const reconectavel =
        motivo === "status_nao_conectado" && chip.status === "desconectado" && Boolean(chip.numero);
      if (!motivo || (!REVALIDAVEIS.has(motivo) && !reconectavel)) return false;
      const ultima = chip.last_health_check_at ? Date.parse(chip.last_health_check_at) : NaN;
      return !Number.isFinite(ultima) || agora - ultima >= WA_INTERVALO_MIN_CHECAGEM_MS;
    })
    .map((chip) => chip.id);
}
