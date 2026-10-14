import type {
  EmailTemplateItem,
  CorporateSignatureItem,
  SignatureData,
  TemplateVariables,
} from "@/types/templates";
import createDOMPurify from "dompurify";

const SIGNATURE_ALLOWED_TAGS = [
  "a",
  "br",
  "div",
  "img",
  "span",
  "strong",
  "table",
  "tbody",
  "td",
  "tr",
];
const SIGNATURE_ALLOWED_ATTRS = [
  "alt",
  "border",
  "cellpadding",
  "cellspacing",
  "height",
  "href",
  "role",
  "src",
  "style",
  "target",
  "title",
  "width",
];

export function escapeSignatureText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function normalizeSignatureUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "#";
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:" ? parsed.toString() : "#";
  } catch {
    return "#";
  }
}

function normalizeSignatureSite(value: string): string {
  const withoutProtocol = value.trim().replace(/^https?:\/\//i, "");
  if (!withoutProtocol) return "";
  const normalized = normalizeSignatureUrl(`https://${withoutProtocol}`);
  return normalized === "#" ? "" : normalized.slice("https://".length);
}

function sanitizeSignatureHtml(html: string): string {
  if (typeof window === "undefined") return html;
  return createDOMPurify(window).sanitize(html, {
    ALLOWED_TAGS: SIGNATURE_ALLOWED_TAGS,
    ALLOWED_ATTR: SIGNATURE_ALLOWED_ATTRS,
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Utilitário de interpolação segura de variáveis de template de e-mail.
 * Substitui tags no formato {{variavel}} com fallback inteligente quando não preenchida.
 */
export function interpolateVariables(template: string, vars: TemplateVariables = {}): string {
  const fallbacks: Record<string, string> = {
    nome: "Cliente",
    empresa: "sua empresa",
    cidade: "sua região",
    nome_remetente: "Equipe Comercial",
    empresa_remetente: "Flow Business",
    telefone_remetente: "+55 (11) 98765-4321",
    site_remetente: "https://flowbusiness.com.br",
  };

  return template.replace(/\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}/g, (_, key) => {
    const val = vars[key];
    if (val && val.trim().length > 0) {
      return val.trim();
    }
    return fallbacks[key] || `[${key}]`;
  });
}

// ============================================================================
// 12 TEMPLATES OFICIAIS DE E-MAIL
// ============================================================================

export const OFFICIAL_EMAIL_TEMPLATES: EmailTemplateItem[] = [
  {
    id: "apresentacao-comercial",
    nome: "Apresentação Comercial",
    descricao: "Apresente sua empresa e gere interesse em uma primeira conversa.",
    categoria: "comercial",
    categoriaLabel: "Comercial",
    badgeVariant: "blue",
    assuntoPadrao: "Apresentação institucional e geração de oportunidades para {{empresa}}",
    preheaderPadrao:
      "Descubra como acelerar o crescimento comercial da sua empresa com tecnologia.",
    ctaTexto: "Agendar uma conversa",
    ctaUrl: "https://flowbusiness.com.br/contato",
    temaEscuro: true,
    variaveisSuportadas: [
      "nome",
      "empresa",
      "cidade",
      "nome_remetente",
      "empresa_remetente",
      "telefone_remetente",
      "site_remetente",
    ],
    conteudoHtml: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Apresentação Comercial</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0c0f17; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0c0f17; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; width: 100%; background-color: #12151f; border-radius: 16px; border: 1px solid #1f2738; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.4);">
          <!-- Header Logo -->
          <tr>
            <td style="padding: 28px 32px 20px 32px; border-bottom: 1px solid #1a2233;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="left">
                    <span style="font-size: 16px; font-weight: 800; color: #ff6200; letter-spacing: -0.5px;">⚡ {{empresa_remetente}}</span>
                  </td>
                  <td align="right">
                    <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; font-weight: 600;">Apresentação Executiva</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Hero Section -->
          <tr>
            <td style="padding: 36px 32px 24px 32px;">
              <div style="display: inline-block; padding: 4px 10px; background-color: rgba(255,98,0,0.15); border: 1px solid rgba(255,98,0,0.3); border-radius: 6px; font-size: 11px; font-weight: 700; color: #ff6200; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px;">Crescimento Comercial</div>
              <h1 style="margin: 0 0 16px 0; font-size: 26px; line-height: 1.25; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">Vamos impulsionar o crescimento da {{empresa}}?</h1>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #94a3b8;">Olá, <strong>{{nome}}</strong>. Identificamos um potencial relevante de expansão no mercado de <strong>{{cidade}}</strong> e estruturamos um modelo estratégico sob medida para gerar novos clientes qualificados.</p>
              
              <!-- Value Props Box -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #171c2b; border: 1px solid #232d42; border-radius: 12px; margin: 24px 0 28px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding-bottom: 12px; font-size: 13px; color: #e2e8f0;">
                          <strong style="color: #ff6200;">✓</strong> Prospecção ativa de decisores de alta conversão
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 12px; font-size: 13px; color: #e2e8f0;">
                          <strong style="color: #ff6200;">✓</strong> Automação com abordagem consultiva e humana
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size: 13px; color: #e2e8f0;">
                          <strong style="color: #ff6200;">✓</strong> Previsibilidade e inteligência comercial contínua
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin-top: 10px;">
                <tr>
                  <td align="center" style="border-radius: 10px; background-color: #ff6200;">
                    <a href="https://flowbusiness.com.br/contato" target="_blank" style="font-size: 14px; font-weight: 700; color: #ffffff; text-decoration: none; padding: 14px 28px; display: inline-block; border-radius: 10px; letter-spacing: 0.2px;">Agendar uma conversa de 15 minutos →</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Sign-off & Footer -->
          <tr>
            <td style="padding: 24px 32px 32px 32px; border-top: 1px solid #1a2233; background-color: #0f121a;">
              <p style="margin: 0 0 4px 0; font-size: 13px; font-weight: 700; color: #ffffff;">{{nome_remetente}}</p>
              <p style="margin: 0 0 16px 0; font-size: 12px; color: #64748b;">{{empresa_remetente}} • {{telefone_remetente}} • <a href="{{site_remetente}}" style="color: #94a3b8; text-decoration: underline;">{{site_remetente}}</a></p>
              <p style="margin: 0; font-size: 11px; line-height: 1.5; color: #475569;">Você recebeu este e-mail corporativo direcionado a {{empresa}}. Se não desejar receber mais mensagens nossas, basta responder com "remover".</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  },

  {
    id: "proposta-servicos",
    nome: "Proposta de Serviços",
    descricao: "Template ideal para envio de propostas comerciais personalizadas.",
    categoria: "proposta",
    categoriaLabel: "Proposta",
    badgeVariant: "amber",
    assuntoPadrao: "Proposta Comercial Exclusiva — Solução Sob Medida para {{empresa}}",
    preheaderPadrao: "Confira o escopo, cronograma e investimentos detalhados da proposta.",
    ctaTexto: "Ver proposta comercial",
    ctaUrl: "https://flowbusiness.com.br/proposta",
    temaEscuro: false,
    variaveisSuportadas: [
      "nome",
      "empresa",
      "cidade",
      "nome_remetente",
      "empresa_remetente",
      "telefone_remetente",
      "site_remetente",
    ],
    conteudoHtml: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Proposta de Serviços</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f9; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
          <tr>
            <td style="padding: 28px 32px 20px 32px; border-bottom: 1px solid #f1f5f9; background-color: #fafbfc;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="left">
                    <span style="font-size: 16px; font-weight: 800; color: #0f172a;">{{empresa_remetente}}</span>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; padding: 4px 8px; background-color: #fef3c7; color: #b45309; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase;">Proposta Comercial</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 36px 32px 24px 32px;">
              <h1 style="margin: 0 0 16px 0; font-size: 24px; line-height: 1.3; font-weight: 800; color: #0f172a;">Proposta de Serviços para a {{empresa}}</h1>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">Prezado(a) <strong>{{nome}}</strong>, conforme alinhamos, preparamos a proposta comercial com as melhores práticas de entrega, cronograma executivo e condições especiais para acelerar os resultados da sua equipe em <strong>{{cidade}}</strong>.</p>
              
              <!-- Scope Preview Card -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin: 20px 0 28px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 8px;">Resumo do Escopo</div>
                    <div style="font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 6px;">Implantação Comercial Completa</div>
                    <div style="font-size: 13px; color: #475569; line-height: 1.5;">Diagnóstico, parametrização, prospecção segmentada e entrega de leads qualificados prontos para reunião.</div>
                  </td>
                </tr>
              </table>

              <!-- Action button -->
              <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="border-radius: 10px; background-color: #0f172a;">
                    <a href="https://flowbusiness.com.br/proposta" target="_blank" style="font-size: 14px; font-weight: 700; color: #ffffff; text-decoration: none; padding: 14px 28px; display: inline-block; border-radius: 10px;">Visualizar Proposta Completa →</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 32px; border-top: 1px solid #f1f5f9; background-color: #f8fafc;">
              <p style="margin: 0 0 4px 0; font-size: 13px; font-weight: 700; color: #0f172a;">{{nome_remetente}}</p>
              <p style="margin: 0; font-size: 12px; color: #64748b;">{{empresa_remetente}} • {{telefone_remetente}}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  },

  {
    id: "newsletter-corporativa",
    nome: "Newsletter Corporativa",
    descricao: "Compartilhe novidades, insights e conteúdos relevantes.",
    categoria: "newsletter",
    categoriaLabel: "Newsletter",
    badgeVariant: "purple",
    assuntoPadrao: "Insights e Tendências de Mercado • Edição Especial {{empresa_remetente}}",
    preheaderPadrao:
      "As principais novidades e estratégias que estão impulsionando o mercado corporativo.",
    ctaTexto: "Ler agora",
    ctaUrl: "https://flowbusiness.com.br/insights",
    temaEscuro: true,
    variaveisSuportadas: [
      "nome",
      "empresa",
      "cidade",
      "nome_remetente",
      "empresa_remetente",
      "telefone_remetente",
      "site_remetente",
    ],
    conteudoHtml: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Newsletter Corporativa</title>
</head>
<body style="margin: 0; padding: 0; background-color: #080d1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #080d1a; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; width: 100%; background-color: #0f172a; border-radius: 16px; border: 1px solid #1e293b; overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.5);">
          <tr>
            <td style="padding: 30px 32px 20px 32px; border-bottom: 1px solid #1e293b; background: linear-gradient(180deg, #131d36 0%, #0f172a 100%);">
              <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; color: #a855f7;">Edição Mensal</span>
              <h1 style="margin: 8px 0 0 0; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">Nossa newsletter: Conteúdos que impulsionam o seu negócio</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #cbd5e1;">Olá, <strong>{{nome}}</strong>. Separamos as 3 análises mais impactantes deste mês para inspirar o planejamento comercial da <strong>{{empresa}}</strong>.</p>
              
              <!-- Topic 1 -->
              <div style="margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid #1e293b;">
                <span style="font-size: 12px; font-weight: 700; color: #38bdf8;">01 / PROSPECÇÃO</span>
                <h3 style="margin: 6px 0 8px 0; font-size: 18px; font-weight: 700; color: #ffffff;">Como empresas líderes estão reduzindo o CAC em 40%</h3>
                <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #94a3b8;">A integração entre enriquecimento de dados e abordagem hiper-segmentada revoluciona as taxas de conversão de ponta a ponta.</p>
              </div>

              <!-- Topic 2 -->
              <div style="margin-bottom: 28px;">
                <span style="font-size: 12px; font-weight: 700; color: #a855f7;">02 / TECNOLOGIA</span>
                <h3 style="margin: 6px 0 8px 0; font-size: 18px; font-weight: 700; color: #ffffff;">Automação comercial sem perder a humanização</h3>
                <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #94a3b8;">Descubra os gatilhos comprovados para manter conversas autênticas com executivos C-Level.</p>
              </div>

              <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="border-radius: 10px; background-color: #3b82f6;">
                    <a href="https://flowbusiness.com.br/insights" target="_blank" style="font-size: 14px; font-weight: 700; color: #ffffff; text-decoration: none; padding: 12px 24px; display: inline-block; border-radius: 10px;">Ler os artigos completos →</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 32px; border-top: 1px solid #1e293b; background-color: #0b1120; font-size: 11px; color: #64748b;">
              {{empresa_remetente}} • Curadoria mensal de inteligência corporativa.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  },

  {
    id: "convite-empresarial",
    nome: "Convite Empresarial",
    descricao: "Convide para eventos, webinars e apresentações exclusivas.",
    categoria: "eventos",
    categoriaLabel: "Eventos",
    badgeVariant: "teal",
    assuntoPadrao: "Você está convidado! Encontro Executivo com {{empresa_remetente}}",
    preheaderPadrao: "Reserve seu lugar na mesa redonda exclusiva sobre tendências de mercado.",
    ctaTexto: "Confirmar presença",
    ctaUrl: "https://flowbusiness.com.br/evento",
    temaEscuro: false,
    variaveisSuportadas: [
      "nome",
      "empresa",
      "cidade",
      "nome_remetente",
      "empresa_remetente",
      "telefone_remetente",
      "site_remetente",
    ],
    conteudoHtml: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Convite Empresarial</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 25px rgba(0,0,0,0.05);">
          <tr>
            <td style="padding: 36px 32px 24px 32px;">
              <span style="display: inline-block; padding: 4px 10px; background-color: #ccfbf1; color: #0f766e; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase;">Apresentação Exclusiva</span>
              <h1 style="margin: 12px 0 16px 0; font-size: 26px; line-height: 1.25; font-weight: 800; color: #0f172a;">Você está convidado!</h1>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">Olá, <strong>{{nome}}</strong>. É com grande satisfação que convidamos os executivos da <strong>{{empresa}}</strong> para nossa mesa de inovação executiva com os principais líderes de <strong>{{cidade}}</strong>.</p>
              
              <!-- Event details box -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f0fdfa; border: 1px solid #99f6e4; border-radius: 12px; margin: 20px 0 28px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <div style="font-size: 13px; font-weight: 700; color: #0f766e; margin-bottom: 4px;">📅 Próxima Quinta-feira às 10h00</div>
                    <div style="font-size: 13px; color: #334155; margin-bottom: 4px;">📍 Transmissão Online Privada • Vagas Limitadas</div>
                    <div style="font-size: 12px; color: #64748b;">Tema: Otimização de Funis B2B de Alta Performance</div>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="border-radius: 10px; background-color: #ff6200;">
                    <a href="https://flowbusiness.com.br/evento" target="_blank" style="font-size: 14px; font-weight: 700; color: #ffffff; text-decoration: none; padding: 14px 28px; display: inline-block; border-radius: 10px;">Confirmar presença gratuita →</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 32px; border-top: 1px solid #f1f5f9; background-color: #f8fafc; font-size: 12px; color: #64748b;">
              Organizado por {{empresa_remetente}} • Dúvidas? Fale conosco em {{telefone_remetente}}.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  },

  {
    id: "followup-comercial",
    nome: "Follow-up Comercial",
    descricao: "Reative conversas e aumente suas taxas de resposta.",
    categoria: "follow_up",
    categoriaLabel: "Follow-up",
    badgeVariant: "blue",
    assuntoPadrao: "Só passando para acompanhar: Próximos passos para a {{empresa}}",
    preheaderPadrao: "Gostaria de saber se conseguiu avaliar nossa última mensagem.",
    ctaTexto: "Continuar conversa",
    ctaUrl: "https://flowbusiness.com.br/contato",
    temaEscuro: false,
    variaveisSuportadas: [
      "nome",
      "empresa",
      "cidade",
      "nome_remetente",
      "empresa_remetente",
      "telefone_remetente",
      "site_remetente",
    ],
    conteudoHtml: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Follow-up Comercial</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden;">
          <tr>
            <td style="padding: 36px 32px 24px 32px;">
              <span style="font-size: 11px; font-weight: 700; color: #2563eb; text-transform: uppercase;">Acompanhamento</span>
              <h1 style="margin: 8px 0 16px 0; font-size: 24px; font-weight: 800; color: #0f172a;">Só passando para acompanhar...</h1>
              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #334155;">Olá, <strong>{{nome}}</strong>. Espero que esteja tendo uma excelente semana na <strong>{{empresa}}</strong>.</p>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #334155;">Passando brevemente para verificar se teve a oportunidade de avaliar os pontos que conversamos sobre novas oportunidades de clientes em <strong>{{cidade}}</strong>.</p>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #334155;">Caso faça sentido nesta semana, podemos bater um papo rápido de 10 minutos para tirar qualquer dúvida.</p>

              <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="border-radius: 10px; background-color: #ff6200;">
                    <a href="https://flowbusiness.com.br/contato" target="_blank" style="font-size: 14px; font-weight: 700; color: #ffffff; text-decoration: none; padding: 12px 24px; display: inline-block; border-radius: 10px;">Continuar conversa →</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 32px; border-top: 1px solid #f1f5f9; background-color: #f8fafc; font-size: 12px; color: #64748b;">
              Um abraço,<br>
              <strong>{{nome_remetente}}</strong> • {{empresa_remetente}}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  },

  {
    id: "pos-atendimento",
    nome: "Pós-atendimento",
    descricao: "Mantenha o relacionamento após o fechamento do negócio.",
    categoria: "relacionamento",
    categoriaLabel: "Relacionamento",
    badgeVariant: "emerald",
    assuntoPadrao: "Obrigado pela sua confiança, {{nome}}! Boas-vindas à nossa parceria",
    preheaderPadrao: "Nosso time já está a postos para garantir seu sucesso absoluto.",
    ctaTexto: "Acessar canal exclusivo",
    ctaUrl: "https://flowbusiness.com.br/suporte",
    temaEscuro: true,
    variaveisSuportadas: [
      "nome",
      "empresa",
      "cidade",
      "nome_remetente",
      "empresa_remetente",
      "telefone_remetente",
      "site_remetente",
    ],
    conteudoHtml: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pós-atendimento</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0b0f19; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; width: 100%; background-color: #111827; border-radius: 16px; border: 1px solid #1f2937; overflow: hidden;">
          <tr>
            <td style="padding: 36px 32px 24px 32px;">
              <span style="font-size: 11px; font-weight: 700; color: #10b981; text-transform: uppercase;">Parceria Confirmada</span>
              <h1 style="margin: 8px 0 16px 0; font-size: 26px; font-weight: 800; color: #ffffff;">Obrigado pela sua confiança!</h1>
              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #9ca3af;">Olá, <strong>{{nome}}</strong>. É uma honra iniciar esta jornada com a <strong>{{empresa}}</strong>.</p>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #9ca3af;">Nossa equipe de especialistas já iniciou os preparativos para o seu onboarding. O objetivo é garantir o máximo retorno sobre o investimento desde os primeiros dias.</p>

              <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="border-radius: 10px; background-color: #10b981;">
                    <a href="https://flowbusiness.com.br/suporte" target="_blank" style="font-size: 14px; font-weight: 700; color: #ffffff; text-decoration: none; padding: 12px 24px; display: inline-block; border-radius: 10px;">Acessar canal exclusivo de atendimento →</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 32px; border-top: 1px solid #1f2937; background-color: #0d121f; font-size: 12px; color: #6b7280;">
              Com carinho,<br>
              <strong>{{nome_remetente}}</strong> • {{empresa_remetente}}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  },

  {
    id: "diagnostico-comercial",
    nome: "Diagnóstico Comercial",
    descricao: "Ofereça uma consultoria inicial e identifique oportunidades.",
    categoria: "diagnostico",
    categoriaLabel: "Diagnóstico",
    badgeVariant: "rose",
    assuntoPadrao: "Diagnóstico Comercial Gratuito para a {{empresa}}",
    preheaderPadrao: "Mapeamento exclusivo de oportunidades e gargalos no seu segmento.",
    ctaTexto: "Solicitar diagnóstico",
    ctaUrl: "https://flowbusiness.com.br/diagnostico",
    temaEscuro: false,
    variaveisSuportadas: [
      "nome",
      "empresa",
      "cidade",
      "nome_remetente",
      "empresa_remetente",
      "telefone_remetente",
      "site_remetente",
    ],
    conteudoHtml: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Diagnóstico Comercial</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden;">
          <tr>
            <td style="padding: 36px 32px 24px 32px;">
              <span style="font-size: 11px; font-weight: 700; color: #e11d48; text-transform: uppercase;">Avaliação de Mercado</span>
              <h1 style="margin: 8px 0 16px 0; font-size: 26px; font-weight: 800; color: #0f172a;">Diagnóstico Comercial Gratuito</h1>
              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #334155;">Olá, <strong>{{nome}}</strong>. Realizamos um levantamento preliminar sobre a presença digital e atração de leads em <strong>{{cidade}}</strong> e identificamos oportunidades valiosas para a <strong>{{empresa}}</strong>.</p>
              
              <div style="background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 10px; padding: 16px; margin: 18px 0 24px 0;">
                <p style="margin: 0; font-size: 13px; color: #9f1239; line-height: 1.5;"><strong>O que inclui o diagnóstico:</strong> análise do funil atual, benchmarking competitivo de mercado e plano prático de aceleração comercial.</p>
              </div>

              <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="border-radius: 10px; background-color: #ff6200;">
                    <a href="https://flowbusiness.com.br/diagnostico" target="_blank" style="font-size: 14px; font-weight: 700; color: #ffffff; text-decoration: none; padding: 14px 28px; display: inline-block; border-radius: 10px;">Solicitar diagnóstico gratuito →</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 32px; border-top: 1px solid #f1f5f9; background-color: #f8fafc; font-size: 12px; color: #64748b;">
              Atenciosamente,<br>
              <strong>{{nome_remetente}}</strong> • {{empresa_remetente}}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  },

  {
    id: "portfolio-servicos",
    nome: "Portfólio de Serviços",
    descricao: "Apresente seus principais serviços de forma profissional.",
    categoria: "institucional",
    categoriaLabel: "Institucional",
    badgeVariant: "zinc",
    assuntoPadrao: "Conheça o portfólio executivo de soluções da {{empresa_remetente}}",
    preheaderPadrao: "Soluções completas desenhadas para alta performance e escalabilidade.",
    ctaTexto: "Conhecer nosso portfólio",
    ctaUrl: "https://flowbusiness.com.br/portfolio",
    temaEscuro: true,
    variaveisSuportadas: [
      "nome",
      "empresa",
      "cidade",
      "nome_remetente",
      "empresa_remetente",
      "telefone_remetente",
      "site_remetente",
    ],
    conteudoHtml: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Portfólio de Serviços</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f17; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0b0f17; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; width: 100%; background-color: #111726; border-radius: 16px; border: 1px solid #1e293b; overflow: hidden;">
          <tr>
            <td style="padding: 36px 32px 24px 32px;">
              <span style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Apresentação Institucional</span>
              <h1 style="margin: 8px 0 16px 0; font-size: 26px; font-weight: 800; color: #ffffff;">Conheça nosso portfólio de serviços</h1>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #94a3b8;">Olá, <strong>{{nome}}</strong>. A <strong>{{empresa_remetente}}</strong> é especializada em soluções corporativas desenhadas para empresas que buscam eficiência e escala em <strong>{{cidade}}</strong>.</p>
              
              <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="border-radius: 10px; background-color: #ff6200;">
                    <a href="https://flowbusiness.com.br/portfolio" target="_blank" style="font-size: 14px; font-weight: 700; color: #ffffff; text-decoration: none; padding: 14px 28px; display: inline-block; border-radius: 10px;">Conhecer portfólio completo →</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 32px; border-top: 1px solid #1e293b; background-color: #0d121c; font-size: 12px; color: #64748b;">
              {{empresa_remetente}} • {{site_remetente}}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  },

  {
    id: "agendamento-reuniao",
    nome: "Agendamento de Reunião",
    descricao: "Convide seus leads para uma reunião de apresentação.",
    categoria: "reuniao",
    categoriaLabel: "Reunião",
    badgeVariant: "purple",
    assuntoPadrao: "Vamos marcar uma reunião rápida de alinhamento, {{nome}}?",
    preheaderPadrao: "Selecione o melhor dia e horário na nossa agenda corporativa.",
    ctaTexto: "Agendar reunião",
    ctaUrl: "https://flowbusiness.com.br/agenda",
    temaEscuro: false,
    variaveisSuportadas: [
      "nome",
      "empresa",
      "cidade",
      "nome_remetente",
      "empresa_remetente",
      "telefone_remetente",
      "site_remetente",
    ],
    conteudoHtml: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Agendamento de Reunião</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden;">
          <tr>
            <td style="padding: 36px 32px 24px 32px;">
              <span style="font-size: 11px; font-weight: 700; color: #7c3aed; text-transform: uppercase;">Alinhamento Comercial</span>
              <h1 style="margin: 8px 0 16px 0; font-size: 26px; font-weight: 800; color: #0f172a;">Vamos marcar uma reunião?</h1>
              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #334155;">Olá, <strong>{{nome}}</strong>. Gostaríamos de dedicar 15 minutos para apresentar à <strong>{{empresa}}</strong> como nossas soluções podem acelerar sua receita.</p>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #334155;">Para facilitar sua rotina, disponibilizamos nossa agenda direta abaixo:</p>

              <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="border-radius: 10px; background-color: #ff6200;">
                    <a href="https://flowbusiness.com.br/agenda" target="_blank" style="font-size: 14px; font-weight: 700; color: #ffffff; text-decoration: none; padding: 14px 28px; display: inline-block; border-radius: 10px;">Escolher melhor horário na agenda →</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 32px; border-top: 1px solid #f1f5f9; background-color: #f8fafc; font-size: 12px; color: #64748b;">
              {{nome_remetente}} • {{empresa_remetente}}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  },

  {
    id: "lancamento-servico",
    nome: "Lançamento de Serviço",
    descricao: "Divulgue novos serviços, produtos e novidades da sua empresa.",
    categoria: "lancamento",
    categoriaLabel: "Lançamento",
    badgeVariant: "rose",
    assuntoPadrao: "Novidade: Apresentamos o novo serviço da {{empresa_remetente}}",
    preheaderPadrao: "Uma solução inovadora pensada especialmente para os desafios da sua empresa.",
    ctaTexto: "Conhecer o lançamento",
    ctaUrl: "https://flowbusiness.com.br/novo-servico",
    temaEscuro: true,
    variaveisSuportadas: [
      "nome",
      "empresa",
      "cidade",
      "nome_remetente",
      "empresa_remetente",
      "telefone_remetente",
      "site_remetente",
    ],
    conteudoHtml: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lançamento de Serviço</title>
</head>
<body style="margin: 0; padding: 0; background-color: #060911; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #060911; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; width: 100%; background-color: #0f1524; border-radius: 16px; border: 1px solid #1f2a44; overflow: hidden;">
          <tr>
            <td style="padding: 36px 32px 24px 32px;">
              <span style="font-size: 11px; font-weight: 700; color: #f43f5e; text-transform: uppercase;">🚀 Grande Novidade</span>
              <h1 style="margin: 8px 0 16px 0; font-size: 26px; font-weight: 800; color: #ffffff;">Novo serviço chegou!</h1>
              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #94a3b8;">Olá, <strong>{{nome}}</strong>. É com muito orgulho que lançamos hoje nossa mais nova solução tecnológica voltada para os desafios operacionais da <strong>{{empresa}}</strong>.</p>
              
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin-top: 10px;">
                <tr>
                  <td align="center" style="border-radius: 10px; background-color: #ff6200;">
                    <a href="https://flowbusiness.com.br/novo-servico" target="_blank" style="font-size: 14px; font-weight: 700; color: #ffffff; text-decoration: none; padding: 14px 28px; display: inline-block; border-radius: 10px;">Conhecer todos os recursos →</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 32px; border-top: 1px solid #1f2a44; background-color: #090e1a; font-size: 12px; color: #64748b;">
              {{empresa_remetente}} • Inovação corporativa contínua.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  },

  {
    id: "conteudo-educativo",
    nome: "Conteúdo Educativo",
    descricao: "Compartilhe conteúdos educativos e estabeleça autoridade.",
    categoria: "educativo",
    categoriaLabel: "Educativo",
    badgeVariant: "amber",
    assuntoPadrao: "Material Exclusivo: O guia definitivo para o time da {{empresa}}",
    preheaderPadrao: "Acesse gratuitamente metodologias validadas para otimizar suas operações.",
    ctaTexto: "Acessar conteúdo",
    ctaUrl: "https://flowbusiness.com.br/conteudo",
    temaEscuro: false,
    variaveisSuportadas: [
      "nome",
      "empresa",
      "cidade",
      "nome_remetente",
      "empresa_remetente",
      "telefone_remetente",
      "site_remetente",
    ],
    conteudoHtml: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Conteúdo Educativo</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden;">
          <tr>
            <td style="padding: 36px 32px 24px 32px;">
              <span style="font-size: 11px; font-weight: 700; color: #d97706; text-transform: uppercase;">Conhecimento Aplicado</span>
              <h1 style="margin: 8px 0 16px 0; font-size: 26px; font-weight: 800; color: #0f172a;">Conteúdo que gera resultados</h1>
              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #334155;">Olá, <strong>{{nome}}</strong>. Preparamos um material prático e direto ao ponto com os maiores aprendizados coletados em centenas de operações em <strong>{{cidade}}</strong>.</p>

              <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="border-radius: 10px; background-color: #0f172a;">
                    <a href="https://flowbusiness.com.br/conteudo" target="_blank" style="font-size: 14px; font-weight: 700; color: #ffffff; text-decoration: none; padding: 14px 28px; display: inline-block; border-radius: 10px;">Ler material educativo →</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 32px; border-top: 1px solid #f1f5f9; background-color: #f8fafc; font-size: 12px; color: #64748b;">
              Curadoria de Conteúdo • {{empresa_remetente}}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  },

  {
    id: "reativacao-relacionamento",
    nome: "Reativação de Relacionamento",
    descricao: "Reconecte-se com leads inativos e reative oportunidades.",
    categoria: "reativacao",
    categoriaLabel: "Reativação",
    badgeVariant: "zinc",
    assuntoPadrao: "Sentimos sua falta! Novas condições exclusivas para a {{empresa}}",
    preheaderPadrao: "Reconecte-se com a nossa equipe e confira as atualizações disponíveis.",
    ctaTexto: "Reconectar agora",
    ctaUrl: "https://flowbusiness.com.br/reconectar",
    temaEscuro: false,
    variaveisSuportadas: [
      "nome",
      "empresa",
      "cidade",
      "nome_remetente",
      "empresa_remetente",
      "telefone_remetente",
      "site_remetente",
    ],
    conteudoHtml: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reativação de Relacionamento</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden;">
          <tr>
            <td style="padding: 36px 32px 24px 32px;">
              <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Reconexão</span>
              <h1 style="margin: 8px 0 16px 0; font-size: 26px; font-weight: 800; color: #0f172a;">Sentimos sua falta!</h1>
              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #334155;">Olá, <strong>{{nome}}</strong>. Faz algum tempo desde nosso último contato sobre os projetos da <strong>{{empresa}}</strong>.</p>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #334155;">Lançamos novos recursos e queremos oferecer condições especiais para reativar nossa conversa em <strong>{{cidade}}</strong>.</p>

              <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="border-radius: 10px; background-color: #ff6200;">
                    <a href="https://flowbusiness.com.br/reconectar" target="_blank" style="font-size: 14px; font-weight: 700; color: #ffffff; text-decoration: none; padding: 14px 28px; display: inline-block; border-radius: 10px;">Reconectar agora →</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 32px; border-top: 1px solid #f1f5f9; background-color: #f8fafc; font-size: 12px; color: #64748b;">
              {{nome_remetente}} • {{empresa_remetente}}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  },
];

// ============================================================================
// 10 MODELOS OFICIAIS DE ASSINATURA CORPORATIVA
// ============================================================================

export const DEFAULT_SIGNATURE_DATA: SignatureData = {
  nome: "Marcos Gonçalves",
  cargo: "Diretor Comercial",
  empresa: "Flow Business",
  telefone: "+55 11 98765-4321",
  email: "marcos@flowbusiness.com.br",
  site: "www.flowbusiness.com.br",
  endereco: "São Paulo - SP",
  linkedin: "https://linkedin.com/company/flowbusiness",
  instagram: "https://instagram.com/flowbusiness",
  whatsapp: "https://wa.me/5511987654321",
};

export function renderSignatureHtml(htmlTemplate: string, data: SignatureData): string {
  const phone = /^[+()\d\s.-]*$/.test(data.telefone.trim()) ? data.telefone.trim() : "";
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()) ? data.email.trim() : "";
  const site = normalizeSignatureSite(data.site);
  const rendered = htmlTemplate
    .replace(/\{\{nome\}\}/g, escapeSignatureText(data.nome))
    .replace(/\{\{cargo\}\}/g, escapeSignatureText(data.cargo))
    .replace(/\{\{empresa\}\}/g, escapeSignatureText(data.empresa))
    .replace(/\{\{telefone\}\}/g, escapeSignatureText(phone))
    .replace(/\{\{email\}\}/g, escapeSignatureText(email))
    .replace(/\{\{site\}\}/g, escapeSignatureText(site))
    .replace(/\{\{endereco\}\}/g, escapeSignatureText(data.endereco ?? ""))
    .replace(/\{\{linkedin\}\}/g, escapeSignatureText(normalizeSignatureUrl(data.linkedin ?? "")))
    .replace(/\{\{instagram\}\}/g, escapeSignatureText(normalizeSignatureUrl(data.instagram ?? "")))
    .replace(/\{\{whatsapp\}\}/g, escapeSignatureText(normalizeSignatureUrl(data.whatsapp ?? "")));

  return sanitizeSignatureHtml(rendered);
}

export const OFFICIAL_CORPORATE_SIGNATURES: CorporateSignatureItem[] = [
  {
    id: "executiva-classica",
    nome: "Executiva Clássica",
    descricao: "Layout sóbrio e elegante com foto circular, dados alinhados e divisores sutis.",
    categoria: "executiva",
    badgeLabel: "Clássica",
    badgeVariant: "blue",
    isPadrao: true,
    dadosExemplo: DEFAULT_SIGNATURE_DATA,
    htmlTemplate: `<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="font-family: Arial, sans-serif; font-size: 13px; color: #1e293b; line-height: 1.4;">
  <tr>
    <td style="vertical-align: top; padding-right: 16px;">
      <div style="width: 56px; height: 56px; border-radius: 50%; background: #0f172a; color: #ffffff; font-weight: bold; font-size: 18px; text-align: center; line-height: 56px;">
        MG
      </div>
    </td>
    <td style="vertical-align: top; border-left: 2px solid #ff6200; padding-left: 16px;">
      <div style="font-size: 15px; font-weight: bold; color: #0f172a;">{{nome}}</div>
      <div style="font-size: 12px; color: #64748b; margin-bottom: 6px;">{{cargo}} • <strong style="color: #ff6200;">{{empresa}}</strong></div>
      <div style="font-size: 12px; color: #334155;">📞 {{telefone}} &nbsp;|&nbsp; ✉️ <a href="mailto:{{email}}" style="color: #2563eb; text-decoration: none;">{{email}}</a></div>
      <div style="font-size: 12px; color: #334155;">🌐 <a href="https://{{site}}" style="color: #2563eb; text-decoration: none;">{{site}}</a> &nbsp;|&nbsp; 📍 {{endereco}}</div>
    </td>
  </tr>
</table>`,
  },

  {
    id: "minimalista-premium",
    nome: "Minimalista Premium",
    descricao: "Linhas limpas, tipografia refinada e sem ruído visual para comunicação direta.",
    categoria: "minimalista",
    badgeLabel: "Minimalista",
    badgeVariant: "zinc",
    dadosExemplo: DEFAULT_SIGNATURE_DATA,
    htmlTemplate: `<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; color: #334155;">
  <tr>
    <td style="padding-bottom: 4px;">
      <span style="font-size: 14px; font-weight: 700; color: #0f172a;">{{nome}}</span>
      <span style="color: #94a3b8;"> — </span>
      <span style="color: #64748b;">{{cargo}}</span>
    </td>
  </tr>
  <tr>
    <td style="color: #64748b; font-size: 11px;">
      {{empresa}} &bull; {{telefone}} &bull; <a href="https://{{site}}" style="color: #ff6200; text-decoration: none;">{{site}}</a>
    </td>
  </tr>
</table>`,
  },

  {
    id: "corporativa-logomarca",
    nome: "Corporativa com Logomarca",
    descricao: "Destaque para a marca da empresa acompanhada de dados profissionais completos.",
    categoria: "corporativa",
    badgeLabel: "Logomarca",
    badgeVariant: "emerald",
    dadosExemplo: DEFAULT_SIGNATURE_DATA,
    htmlTemplate: `<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="font-family: Arial, sans-serif; font-size: 12px; color: #1e293b;">
  <tr>
    <td style="vertical-align: middle; padding-right: 18px;">
      <div style="background-color: #0f172a; color: #ffffff; padding: 10px 14px; border-radius: 8px; font-weight: 800; font-size: 14px; letter-spacing: -0.5px;">
        ⚡ {{empresa}}
      </div>
    </td>
    <td style="vertical-align: middle; border-left: 1px solid #cbd5e1; padding-left: 18px;">
      <div style="font-size: 14px; font-weight: 700; color: #0f172a;">{{nome}}</div>
      <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">{{cargo}}</div>
      <div style="font-size: 11px; color: #475569;">📞 {{telefone}} &bull; ✉️ {{email}}</div>
      <div style="font-size: 11px; color: #475569;">🌐 {{site}} &bull; 📍 {{endereco}}</div>
    </td>
  </tr>
</table>`,
  },

  {
    id: "moderna-icones",
    nome: "Moderna com Ícones",
    descricao: "Ícones de redes sociais e canais diretos de WhatsApp e LinkedIn.",
    categoria: "moderna",
    badgeLabel: "Moderna",
    badgeVariant: "purple",
    dadosExemplo: DEFAULT_SIGNATURE_DATA,
    htmlTemplate: `<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="font-family: Arial, sans-serif; font-size: 12px; color: #1e293b;">
  <tr>
    <td style="padding-bottom: 4px;">
      <strong style="font-size: 14px; color: #0f172a;">{{nome}}</strong> &bull; <span style="color: #ff6200; font-weight: 600;">{{cargo}}</span>
    </td>
  </tr>
  <tr>
    <td style="color: #64748b; font-size: 12px; padding-bottom: 8px;">
      {{empresa}} &bull; 📍 {{endereco}}
    </td>
  </tr>
  <tr>
    <td>
      <table role="presentation" border="0" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding-right: 8px;"><a href="tel:{{telefone}}" style="display: inline-block; padding: 3px 8px; background-color: #f1f5f9; border-radius: 4px; color: #0f172a; text-decoration: none; font-size: 11px;">📞 {{telefone}}</a></td>
          <td style="padding-right: 8px;"><a href="{{whatsapp}}" style="display: inline-block; padding: 3px 8px; background-color: #dcfce7; border-radius: 4px; color: #15803d; text-decoration: none; font-size: 11px; font-weight: bold;">💬 WhatsApp</a></td>
          <td><a href="{{linkedin}}" style="display: inline-block; padding: 3px 8px; background-color: #e0f2fe; border-radius: 4px; color: #0369a1; text-decoration: none; font-size: 11px;">💼 LinkedIn</a></td>
        </tr>
      </table>
    </td>
  </tr>
</table>`,
  },

  {
    id: "consultor-comercial",
    nome: "Consultor Comercial",
    descricao: "Focada em conversão rápida com botão direto para agendamento de reuniões.",
    categoria: "vendas",
    badgeLabel: "Comercial",
    badgeVariant: "amber",
    dadosExemplo: DEFAULT_SIGNATURE_DATA,
    htmlTemplate: `<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="font-family: Arial, sans-serif; font-size: 12px; color: #1e293b;">
  <tr>
    <td style="border-left: 3px solid #ff6200; padding-left: 12px;">
      <div style="font-size: 14px; font-weight: 700; color: #0f172a;">{{nome}}</div>
      <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">Especialista Comercial na {{empresa}}</div>
      <div style="font-size: 11px; color: #475569; margin-bottom: 8px;">📱 {{telefone}} &bull; ✉️ {{email}}</div>
      <div>
        <a href="https://{{site}}" style="display: inline-block; padding: 4px 10px; background-color: #ff6200; color: #ffffff; text-decoration: none; border-radius: 4px; font-size: 11px; font-weight: bold;">Agendar Reunião de 15 Minutos →</a>
      </div>
    </td>
  </tr>
</table>`,
  },

  {
    id: "agencia-marketing",
    nome: "Agência de Marketing",
    descricao: "Visual vibrante e criativo com paleta arrojada ideal para agências.",
    categoria: "criativa",
    badgeLabel: "Criativa",
    badgeVariant: "purple",
    dadosExemplo: DEFAULT_SIGNATURE_DATA,
    htmlTemplate: `<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="font-family: Arial, sans-serif; font-size: 12px;">
  <tr>
    <td style="padding-bottom: 4px;">
      <span style="font-size: 15px; font-weight: 800; background: linear-gradient(90deg, #ff6200, #a855f7); -webkit-background-clip: text; color: #ff6200;">{{nome}}</span>
    </td>
  </tr>
  <tr>
    <td style="font-size: 12px; color: #475569; padding-bottom: 6px;">
      {{cargo}} @ <strong style="color: #0f172a;">{{empresa}}</strong>
    </td>
  </tr>
  <tr>
    <td style="font-size: 11px; color: #64748b;">
      🚀 Criação &bull; Tráfego &bull; Performance &bull; <a href="https://{{site}}" style="color: #a855f7; text-decoration: none;">{{site}}</a>
    </td>
  </tr>
</table>`,
  },

  {
    id: "tecnologia-saas",
    nome: "Tecnologia e SaaS",
    descricao: "Estilo técnico com status de plataforma e links para documentação e suporte.",
    categoria: "tech",
    badgeLabel: "Tecnologia",
    badgeVariant: "blue",
    dadosExemplo: DEFAULT_SIGNATURE_DATA,
    htmlTemplate: `<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="font-family: 'Courier New', Courier, monospace; font-size: 12px; color: #0f172a; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; background: #f8fafc;">
  <tr>
    <td>
      <div style="font-weight: bold; color: #0f172a; font-size: 13px;">[SYS] {{nome}} // {{cargo}}</div>
      <div style="color: #64748b; font-size: 11px;">org: {{empresa}} | env: production</div>
      <div style="color: #2563eb; font-size: 11px; margin-top: 4px;">contact: {{email}} | tel: {{telefone}}</div>
      <div style="font-size: 10px; color: #16a34a; margin-top: 4px;">● Sistemas Operacionais Online: {{site}}</div>
    </td>
  </tr>
</table>`,
  },

  {
    id: "profissional-liberal",
    nome: "Profissional Liberal",
    descricao: "Formalidade com espaço para registro de classe (OAB, CRM, CREA) e endereço.",
    categoria: "formal",
    badgeLabel: "Formal",
    badgeVariant: "zinc",
    dadosExemplo: DEFAULT_SIGNATURE_DATA,
    htmlTemplate: `<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="font-family: Georgia, serif; font-size: 12px; color: #1e293b;">
  <tr>
    <td style="border-bottom: 1px solid #0f172a; padding-bottom: 4px;">
      <span style="font-size: 15px; font-weight: bold; color: #0f172a;">{{nome}}</span>
    </td>
  </tr>
  <tr>
    <td style="padding-top: 4px; font-style: italic; color: #475569; font-size: 11px;">
      {{cargo}} &bull; {{empresa}}
    </td>
  </tr>
  <tr>
    <td style="padding-top: 4px; font-size: 11px; color: #334155;">
      Telefone: {{telefone}} | E-mail: {{email}}
    </td>
  </tr>
  <tr>
    <td style="font-size: 10px; color: #64748b; padding-top: 2px;">
      Sede: {{endereco}} | Website: {{site}}
    </td>
  </tr>
</table>`,
  },

  {
    id: "empresarial-horizontal",
    nome: "Empresarial Horizontal",
    descricao: "Formato faixa estreita horizontal perfeito para respostas e threads curtas.",
    categoria: "compacta",
    badgeLabel: "Compacta",
    badgeVariant: "emerald",
    dadosExemplo: DEFAULT_SIGNATURE_DATA,
    htmlTemplate: `<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="font-family: Arial, sans-serif; font-size: 11px; color: #475569;">
  <tr>
    <td style="padding: 6px 12px; background-color: #f1f5f9; border-radius: 6px; border-left: 3px solid #0f172a;">
      <strong style="color: #0f172a;">{{nome}}</strong> &nbsp;|&nbsp; {{cargo}} &nbsp;|&nbsp; <strong style="color: #ff6200;">{{empresa}}</strong> &nbsp;|&nbsp; {{telefone}} &nbsp;|&nbsp; <a href="https://{{site}}" style="color: #2563eb; text-decoration: none;">{{site}}</a>
    </td>
  </tr>
</table>`,
  },

  {
    id: "institucional",
    nome: "Institucional",
    descricao: "Contém selos de certificação, endereço completo, CNPJ e disclaimer legal.",
    categoria: "institucional",
    badgeLabel: "Institucional",
    badgeVariant: "zinc",
    dadosExemplo: DEFAULT_SIGNATURE_DATA,
    htmlTemplate: `<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="font-family: Arial, sans-serif; font-size: 11px; color: #334155; max-width: 500px;">
  <tr>
    <td style="padding-bottom: 6px;">
      <div style="font-size: 13px; font-weight: bold; color: #0f172a;">{{nome}}</div>
      <div style="font-size: 11px; color: #64748b;">{{cargo}} &bull; {{empresa}}</div>
    </td>
  </tr>
  <tr>
    <td style="border-top: 1px solid #e2e8f0; padding-top: 6px; color: #64748b; font-size: 10px;">
      {{endereco}} &bull; {{telefone}} &bull; {{site}}
    </td>
  </tr>
  <tr>
    <td style="padding-top: 6px; font-size: 9px; line-height: 1.4; color: #94a3b8;">
      Aviso Legal: Esta mensagem e anexos destinam-se exclusivamente ao destinatário. Se você recebeu por engano, por favor notifique o remetente e descarte este conteúdo.
    </td>
  </tr>
</table>`,
  },
];
