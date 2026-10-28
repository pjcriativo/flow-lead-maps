// Estado REAL da equipe comercial para as telas de Agentes (lê o backend; nunca presume nada).
import { useCallback, useEffect, useMemo, useState } from "react";
import { derivarEstadoAgente, type Papel } from "@/lib/equipe-config";
import type { CargaCeo } from "@/lib/ceo-config";
import { ErroCeo } from "@/services/agente-ceo-admin";
import { useCatalogoIa } from "./useCatalogoIa";
import { carregarEquipe, type EquipeCarregada } from "@/services/agente-equipe-admin";
import type { CeoReal } from "./useCeoReal";

export type EquipeReal = {
  equipe: EquipeCarregada | null;
  carregando: boolean;
  /** Mensagem do último erro de leitura (serviço fora do ar, sem permissão etc.). */
  erro: string | null;
  recarregar: () => Promise<void>;
};

export function useEquipeReal(habilitado = true): EquipeReal {
  const [equipe, setEquipe] = useState<EquipeCarregada | null>(null);
  const [carregando, setCarregando] = useState(habilitado);
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = useCallback(async () => {
    setCarregando(true);
    try {
      setEquipe(await carregarEquipe());
      setErro(null);
    } catch (e) {
      setEquipe(null);
      setErro(e instanceof ErroCeo ? e.message : "Não foi possível consultar a equipe de IA.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    if (habilitado) void recarregar();
  }, [habilitado, recarregar]);

  return { equipe, carregando, erro, recarregar };
}

/** Visão de UM agente no formato do painel de configuração do CEO (reaproveitado nas Telas 02/03). */
export function useAgenteReal(papel: Papel | null): CeoReal {
  const { equipe, carregando, erro, recarregar } = useEquipeReal(papel !== null);
  const agente = papel ? (equipe?.agentes.find((a) => a.papel === papel) ?? null) : null;
  const carga: CargaCeo | null = equipe
    ? {
        agente,
        ferramentasConcedidas: agente ? (equipe.permissoes[agente.id] ?? []) : [],
        gastoDiaUsd: agente
          ? equipe.runs
              .filter((r) => r.agentId === agente.id && Date.parse(r.iniciadoEm) >= inicioDoDia())
              .reduce((a, r) => a + r.custoUsd, 0)
          : 0,
        gastoMesUsd: agente
          ? equipe.runs
              .filter((r) => r.agentId === agente.id && Date.parse(r.iniciadoEm) >= inicioDoMes())
              .reduce((a, r) => a + r.custoUsd, 0)
          : 0,
      }
    : null;
  const cat = useCatalogoIa(papel !== null);
  const carregandoTotal = carregando || cat.carregando;
  const estado = useMemo(
    () => derivarEstadoAgente({ carregando: carregandoTotal, erroServico: erro !== null, carga }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [carregandoTotal, erro, equipe, papel, cat.versao],
  );
  return {
    estado,
    carga,
    orgId: equipe?.orgId ?? null,
    carregando: carregandoTotal,
    erro,
    recarregar,
    catalogo: cat.catalogo,
  };
}

function inicioDoDia(): number {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
}
function inicioDoMes(): number {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
}

/** Gasto de IA do agente no dia/mês (UTC, como o banco) a partir das execuções carregadas. */
export function gastoDoAgente(
  equipe: EquipeCarregada,
  agenteId: string,
): { dia: number; mes: number } {
  const dia = inicioDoDia();
  const mes = inicioDoMes();
  let d = 0;
  let m = 0;
  for (const r of equipe.runs) {
    if (r.agentId !== agenteId) continue;
    const t = Date.parse(r.iniciadoEm);
    if (t >= mes) m += r.custoUsd;
    if (t >= dia) d += r.custoUsd;
  }
  return { dia: d, mes: m };
}

/** Estado operacional de um agente da equipe (mesmas regras de precedência do CEO). */
export function estadoDoAgente(
  equipe: EquipeCarregada,
  agente: EquipeCarregada["agentes"][number],
) {
  const gasto = gastoDoAgente(equipe, agente.id);
  return derivarEstadoAgente({
    carregando: false,
    erroServico: false,
    carga: {
      agente,
      ferramentasConcedidas: equipe.permissoes[agente.id] ?? [],
      gastoDiaUsd: gasto.dia,
      gastoMesUsd: gasto.mes,
    },
  });
}
