// Monta o HTML final: escolhe o template pelo nicho e injeta o SiteData.
// O design é 100% do template; só o conteúdo (copy + depoimentos reais) varia.
import type { MateriaPrima, ConteudoIA } from "../ai/types.ts";
import type { TemplateId, Depoimento } from "./tipos.ts";
import { montarSiteData } from "./dados.ts";
import { templateSaude } from "./templates/saude.ts";
import { templateServicoLocal } from "./templates/servico_local.ts";
import { templateProfissional } from "./templates/profissional.ts";

export function montarHtml(
  mp: MateriaPrima,
  conteudo: ConteudoIA,
  nicho: TemplateId,
  depoimentos: Depoimento[] = [],
): string {
  const d = montarSiteData(mp, conteudo, nicho, depoimentos);
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
