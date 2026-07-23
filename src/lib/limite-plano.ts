// LIMITE DE USO POR PLANO — lógica PURA (testável sem rede), no mesmo espírito de redes-teto.ts.
// A APLICAÇÃO real (contar + bloquear atômico) vive na função SQL `consumir_ou_bloquear`
// (migration 046) — fonte única. Aqui ficam só os tipos e a interpretação para a UI/edges.

export type EstadoConsumo = {
  usado: number;
  limite: number | null; // null = ilimitado
  restante: number | null;
  perto: boolean; // >= 80% do limite
};

export type ResultadoConsumo = EstadoConsumo & {
  ok: boolean;
  reason?: "limite_atingido" | "recurso_invalido";
  recurso?: string;
};

/** Mensagem honesta para o usuário quando o limite é atingido (ou está perto). */
export function mensagemLimite(nomePlano: string, e: EstadoConsumo, recursoLabel: string): string {
  if (e.limite === null) return "";
  if (e.usado >= e.limite)
    return `Limite de ${recursoLabel} do plano ${nomePlano} atingido: ${e.usado}/${e.limite}. Faça upgrade do plano para continuar.`;
  if (e.perto)
    return `Você já usou ${e.usado} de ${e.limite} ${recursoLabel} do plano ${nomePlano} neste mês (${Math.round((e.usado / e.limite) * 100)}%).`;
  return "";
}

/** Rótulos pt-BR dos recursos medidos. */
export const RECURSO_LABEL: Record<string, string> = {
  leads: "leads",
  sites: "sites gerados",
  campanhas: "campanhas",
  mensagens: "mensagens",
};
