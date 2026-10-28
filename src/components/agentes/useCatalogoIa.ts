// Catálogo de modelos da Central de IA para as Telas 02/03/10. Sem a flag (VITE_IA_CENTRAL) ou sem a
// Central publicada no banco, devolve "indisponível" e tudo segue com a lista estática de Claude.
import { useEffect, useState } from "react";
import {
  CATALOGO_INDISPONIVEL,
  IA_CENTRAL_HABILITADA,
  carregarCatalogoIa,
  type CatalogoIa,
} from "@/services/ia-catalogo";

export type CatalogoIaEstado = {
  catalogo: CatalogoIa;
  carregando: boolean;
  /** Muda quando o catálogo chega: força os estados derivados a serem recalculados. */
  versao: number;
};

export function useCatalogoIa(habilitado = true): CatalogoIaEstado {
  const ativo = habilitado && IA_CENTRAL_HABILITADA;
  const [estado, setEstado] = useState<CatalogoIaEstado>({
    catalogo: CATALOGO_INDISPONIVEL,
    carregando: ativo,
    versao: 0,
  });

  useEffect(() => {
    if (!ativo) return;
    let vivo = true;
    void carregarCatalogoIa().then((catalogo) => {
      if (vivo) setEstado((e) => ({ catalogo, carregando: false, versao: e.versao + 1 }));
    });
    return () => {
      vivo = false;
    };
  }, [ativo]);

  return estado;
}
