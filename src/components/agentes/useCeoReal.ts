// Estado REAL do CEO de IA para as Telas 02, 03 e 10 (lê o backend; nunca presume ativo).
import { useCallback, useEffect, useMemo, useState } from "react";
import { derivarEstadoCeo, type CargaCeo, type EstadoCeo } from "@/lib/ceo-config";
import { carregarCeo, ErroCeo } from "@/services/agente-ceo-admin";
import type { CatalogoIa } from "@/services/ia-catalogo";
import { useCatalogoIa } from "./useCatalogoIa";

export type CeoReal = {
  estado: EstadoCeo;
  carga: CargaCeo | null;
  orgId: string | null;
  carregando: boolean;
  /** Mensagem do último erro de leitura (serviço fora do ar, sem permissão etc.). */
  erro: string | null;
  recarregar: () => Promise<void>;
  /** Catálogo da Central de IA (provedores/modelos); "indisponível" quando a Central não está publicada. */
  catalogo: CatalogoIa;
};

export function useCeoReal(habilitado = true): CeoReal {
  const [carregando, setCarregando] = useState(habilitado);
  const [carga, setCarga] = useState<CargaCeo | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const cat = useCatalogoIa(habilitado);

  const recarregar = useCallback(async () => {
    setCarregando(true);
    try {
      const r = await carregarCeo();
      setOrgId(r.orgId);
      setCarga({
        agente: r.agente,
        ferramentasConcedidas: r.ferramentasConcedidas,
        gastoDiaUsd: r.gastoDiaUsd,
        gastoMesUsd: r.gastoMesUsd,
      });
      setErro(null);
    } catch (e) {
      setCarga(null);
      setErro(e instanceof ErroCeo ? e.message : "Não foi possível consultar o CEO de IA.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    if (habilitado) void recarregar();
  }, [habilitado, recarregar]);

  const carregandoTotal = carregando || cat.carregando;
  const estado = useMemo(
    () => derivarEstadoCeo({ carregando: carregandoTotal, erroServico: erro !== null, carga }),
    // cat.versao: o catálogo muda quais modelos (ex.: OpenAI) a interface considera válidos
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [carregandoTotal, erro, carga, cat.versao],
  );
  return {
    estado,
    carga,
    orgId,
    carregando: carregandoTotal,
    erro,
    recarregar,
    catalogo: cat.catalogo,
  };
}
