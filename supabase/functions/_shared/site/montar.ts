// Monta o HTML final: escolhe o template pelo nicho, escolhe a VARIANTE de hero
// pela SEMENTE (determinística — variantes.ts) e injeta o SiteData. O design é
// 100% dos blocos/template; só o conteúdo (copy + depoimentos reais) varia.
import type { MateriaPrima, ConteudoIA } from "../ai/types.ts";
import type { TemplateId, Depoimento } from "./tipos.ts";
import { montarSiteData, type FotosOverride } from "./dados.ts";
import { varianteHero } from "./variantes.ts";
import { detectarNicho } from "./nicho.ts";
import { templateSaude } from "./templates/saude.ts";
import { templateServicoLocal } from "./templates/servico_local.ts";
import { templateProfissional } from "./templates/profissional.ts";

export function montarHtml(
  mp: MateriaPrima,
  conteudo: ConteudoIA,
  nicho: TemplateId,
  depoimentos: Depoimento[] = [],
  fotos?: FotosOverride,
  /** Semente ESTÁVEL do lead (place_id ?? lead_id). Define a variante de hero. */
  seed?: string,
  /** Crédito do rodapé da ORG (profiles.site_credito). null/undefined = sem crédito. */
  creditoRodape?: string | null,
): string {
  const s = seed || mp.nome; // fallback: nome (estável o suficiente p/ preview local)
  // Variante escolhida com o nicho ESTÁVEL (só categoria — nunca o scrape do
  // site, que oscila e mudaria a variante entre regenerações do mesmo lead).
  const heroVar = varianteHero(s, detectarNicho(mp.categoria, ""));
  const d = montarSiteData(
    mp,
    conteudo,
    nicho,
    depoimentos,
    fotos,
    { seed: s, heroVar },
    creditoRodape ?? null,
  );
  switch (nicho) {
    case "saude":
      return templateSaude(d);
    case "profissional":
      return templateProfissional(d);
    case "servico-local":
    default:
      return templateServicoLocal(d);
  }
}
