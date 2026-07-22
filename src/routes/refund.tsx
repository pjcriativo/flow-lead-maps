import { createFileRoute, Link } from "@tanstack/react-router";
import { FlowLeadsLogo } from "@/components/FlowLeadsLogo";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/refund")({
  head: () => ({
    meta: [
      { title: "Política de Reembolso — Flow Leads" },
      {
        name: "description",
        content:
          "Política de reembolso dos planos de assinatura do Flow Leads, incluindo o direito de arrependimento de 7 dias (CDC).",
      },
      { property: "og:title", content: "Política de Reembolso — Flow Leads" },
      {
        property: "og:description",
        content:
          "Condições de reembolso dos planos mensais, anuais e do direito de arrependimento do art. 49 do CDC.",
      },
      { property: "og:url", content: "https://flowleads.com.br/refund" },
    ],
    links: [{ rel: "canonical", href: "https://flowleads.com.br/refund" }],
  }),
  component: RefundPage,
});

function RefundPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex h-full items-center">
            <FlowLeadsLogo className="h-9 w-auto" />
          </Link>
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/pricing" className="hover:text-foreground">
              Preços
            </Link>
            <Link to="/dashboard" className="hover:text-foreground">
              Painel
            </Link>
          </nav>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-6 py-16 prose prose-neutral dark:prose-invert">
        <h1 className="text-4xl font-semibold tracking-tight">Política de Reembolso</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Última atualização: 10 de julho de 2026
        </p>

        <section className="mt-10 space-y-6 text-sm leading-relaxed text-muted-foreground">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Direito de Arrependimento (7 dias — CDC art. 49)
            </h2>
            <p className="mt-2">
              Por se tratar de contratação realizada fora do estabelecimento comercial (pela
              internet), você pode desistir da compra no prazo de{" "}
              <strong>7 (sete) dias corridos</strong> contados da confirmação do pagamento ou da
              contratação, nos termos do art. 49 do Código de Defesa do Consumidor. Nesse caso, os
              valores efetivamente pagos serão <strong>integralmente devolvidos</strong>, incluindo
              eventuais encargos, corrigidos monetariamente.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">Teste Gratuito</h2>
            <p className="mt-2">Sem cobrança, portanto não há reembolso a solicitar.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">Planos Mensais</h2>
            <p className="mt-2">
              Além do direito de arrependimento de 7 dias, reembolsos podem ser solicitados em até 7
              dias após o primeiro pagamento.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">Planos Anuais</h2>
            <p className="mt-2">
              Além do direito de arrependimento de 7 dias, reembolsos podem ser solicitados em até
              14 dias após o pagamento.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">Após o Prazo de Reembolso</h2>
            <p className="mt-2">
              Encerrados os prazos acima, não são emitidos reembolsos. Ainda assim, você mantém o
              acesso ao Serviço até o fim do período de cobrança já pago.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">Como Solicitar um Reembolso</h2>
            <p className="mt-2">
              Para solicitar um reembolso, entre em contato pelo e-mail{" "}
              <a className="text-primary" href="mailto:contato@flowleads.com.br">
                contato@flowleads.com.br
              </a>
              , informando o e-mail da conta e a data da compra.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">Prazo de Processamento</h2>
            <p className="mt-2">
              Reembolsos são processados em até 5 a 10 dias úteis após a aprovação, podendo o prazo
              de estorno variar conforme o meio de pagamento e a operadora do cartão.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">Lei Aplicável e Foro</h2>
            <p className="mt-2">
              Esta Política é regida pelas leis brasileiras. Fica eleito o foro do domicílio do
              consumidor para dirimir controvérsias, nos termos do CDC. Consulte também os nossos{" "}
              <Link to="/terms" className="text-primary">
                Termos de Uso
              </Link>
              .
            </p>
          </div>
        </section>
      </article>

      <SiteFooter />
    </div>
  );
}
