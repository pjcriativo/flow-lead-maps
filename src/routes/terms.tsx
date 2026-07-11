import { createFileRoute, Link } from "@tanstack/react-router";
import { FlowLeadsLogo } from "@/components/FlowLeadsLogo";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Termos de Uso — Flow Leads" },
      { name: "description", content: "Termos de Uso do Flow Leads, ferramenta de geração de leads a partir do Google Maps." },
      { property: "og:title", content: "Termos de Uso — Flow Leads" },
      { property: "og:description", content: "As regras para uso do serviço de geração de leads do Flow Leads." },
      { property: "og:url", content: "https://flowleads.com.br/terms" },
    ],
    links: [{ rel: "canonical", href: "https://flowleads.com.br/terms" }],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex h-full items-center">
            <FlowLeadsLogo className="h-9 w-auto" />
          </Link>
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/pricing" className="hover:text-foreground">Preços</Link>
            <Link to="/dashboard" className="hover:text-foreground">Painel</Link>
          </nav>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-6 py-16 prose prose-neutral dark:prose-invert">
        <h1 className="text-4xl font-semibold tracking-tight">Termos de Uso</h1>
        <p className="mt-2 text-sm text-muted-foreground">Última atualização: 10 de julho de 2026</p>

        <section className="mt-10 space-y-6 text-sm leading-relaxed text-muted-foreground">
          <div>
            <h2 className="text-lg font-semibold text-foreground">1. Aceitação dos Termos</h2>
            <p className="mt-2">
              Ao acessar ou utilizar o Flow Leads ("Serviço"), você concorda em se vincular a estes Termos de Uso. Caso não concorde, não utilize o Serviço. Estes Termos são regidos pela legislação brasileira, incluindo o Código de Defesa do Consumidor (Lei 8.078/1990) e a Lei Geral de Proteção de Dados — LGPD (Lei 13.709/2018).
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">2. Descrição do Serviço</h2>
            <p className="mt-2">
              O Flow Leads é uma ferramenta de geração de leads que auxilia o usuário a localizar informações comerciais publicamente disponíveis no Google Maps e a exportá-las para planilhas e para o Google Sheets.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">3. Cadastro e Conta</h2>
            <p className="mt-2">
              Você é responsável por manter a confidencialidade das credenciais da sua conta e por todas as atividades realizadas por meio dela. Notifique-nos imediatamente em caso de uso não autorizado.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">4. Uso Aceitável</h2>
            <p className="mt-2">
              Você concorda em não utilizar o Flow Leads para: (a) violar qualquer lei aplicável ou direitos de terceiros; (b) enviar comunicações não solicitadas em massa (spam) em desacordo com a legislação aplicável; (c) revender dados brutos de leads sem agregar valor; ou (d) interferir na infraestrutura do Serviço.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">5. Responsabilidade sobre os Dados de Leads (LGPD)</h2>
            <p className="mt-2">
              Os dados pessoais de leads que você coleta, armazena e utiliza por meio do Serviço são de sua exclusiva responsabilidade. Para os fins da LGPD, <strong>você é o Controlador</strong> desses dados, cabendo a você definir as finalidades e os meios do tratamento. O Flow Leads atua como <strong>Operador</strong>, tratando esses dados apenas conforme suas instruções e para prestação do Serviço.
            </p>
            <p className="mt-2">
              Como Controlador, você é o único responsável por: (a) possuir <strong>base legal adequada</strong> (por exemplo, legítimo interesse, nos termos dos arts. 7º e 10 da LGPD) para tratar os dados dos leads; (b) atender às requisições dos titulares e respeitar seus direitos; e (c) garantir mecanismo de <strong>consentimento e descadastramento (opt-out)</strong> em todo envio de mensagens de marketing por e-mail, WhatsApp, SMS ou outros canais, em conformidade com a LGPD e as boas práticas de mercado. O Flow Leads não se responsabiliza pelo uso que você faz dos dados coletados nem pelas mensagens que você envia.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">6. Assinaturas e Cobrança</h2>
            <p className="mt-2">
              Os planos pagos são renovados automaticamente até o cancelamento. Você pode cancelar a qualquer momento pela sua conta; o cancelamento passa a valer ao fim do período de cobrança vigente. Reembolsos observam a nossa <Link to="/refund" className="text-primary">Política de Reembolso</Link> e o direito de arrependimento do art. 49 do CDC.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">7. Precisão dos Dados de Leads</h2>
            <p className="mt-2">
              Os dados de leads são obtidos de plataformas de terceiros e fornecidos "no estado em que se encontram". Não garantimos exatidão, completude ou adequação a qualquer finalidade específica.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">8. Propriedade Intelectual</h2>
            <p className="mt-2">
              O Flow Leads e sua marca pertencem a nós. Você recebe uma licença limitada, não exclusiva e intransferível para usar o Serviço para sua finalidade durante a vigência da sua assinatura.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">9. Suspensão e Encerramento</h2>
            <p className="mt-2">
              Podemos suspender ou encerrar o seu acesso caso você descumpra estes Termos ou utilize o Serviço de forma que gere risco a nós ou a outros usuários.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">10. Limitação de Responsabilidade</h2>
            <p className="mt-2">
              Na máxima extensão permitida pela lei, o Flow Leads não será responsável por danos indiretos, incidentais ou consequenciais decorrentes do uso do Serviço. Nada nestes Termos limita direitos que a lei assegura ao consumidor.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">11. Alterações destes Termos</h2>
            <p className="mt-2">
              Podemos atualizar estes Termos periodicamente. O uso continuado do Serviço após a publicação das alterações representa a aceitação da versão revisada.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">12. Lei Aplicável e Foro</h2>
            <p className="mt-2">
              Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro do domicílio do consumidor para dirimir quaisquer controvérsias, nos termos do CDC.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">13. Contato</h2>
            <p className="mt-2">
              Dúvidas? Escreva para <a className="text-primary" href="mailto:contato@flowleads.com.br">contato@flowleads.com.br</a>.
            </p>
          </div>
        </section>
      </article>

      <SiteFooter />
    </div>
  );
}
