import { useLayoutEffect, useState, type RefObject } from "react";

/**
 * Altura útil para um elemento que deve ocupar o resto da tela, a partir de onde ele começa na
 * página (cabeçalho, KPIs e filtros já descontados). Medida pela posição no documento, então não
 * muda quando a página rola. Em telas muito baixas respeita o mínimo, e a página rola normalmente.
 */
export function useFillViewportHeight(
  ref: RefObject<HTMLElement | null>,
  { bottomGap = 16, min = 420 }: { bottomGap?: number; min?: number } = {},
): number | undefined {
  const [height, setHeight] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => {
      const top = element.getBoundingClientRect().top + window.scrollY;
      setHeight(Math.max(min, Math.floor(window.innerHeight - top - bottomGap)));
    };
    measure();
    window.addEventListener("resize", measure);
    // O que fica acima (KPIs, filtros, avisos) pode mudar de altura sem a janela mudar.
    const observer = new ResizeObserver(measure);
    observer.observe(document.body);
    return () => {
      window.removeEventListener("resize", measure);
      observer.disconnect();
    };
  }, [ref, bottomGap, min]);

  return height;
}
