import { createFileRoute, Link } from "@tanstack/react-router";
import { FlowLeadsLogo } from "@/components/FlowLeadsLogo";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade — Flow Leads" },
      { name: "description", content: "Como o Flow Leads coleta, usa e protege seus dados, em conformidade com a LGPD (Lei 13.709/2018)." },
      { property: "og:title", content: "Política de Privacidade — Flow Leads" },
      { property: "og:description", content: "Como tratamos seus dados, tokens do Google OAuth e os leads que você gera, conforme a LGPD." },
      { property: "og:url", content: "https://flowleads.com.br/privacy" },
    ],
    links: [{ rel: "canonical", href: "https://flowleads.com.br/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
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

      <article className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-4xl font-semibold tracking-tight">Política de Privacidade</h1>
        <p className="mt-2 text-sm text-muted-foreground">Última atualização: 10 de julho de 2026</p>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Esta Política descreve como o Flow Leads trata dados pessoais, em conformidade com a Lei Geral de Proteção de Dados — LGPD (Lei 13.709/2018). Ao usar o Serviço, você concorda com as práticas aqui descritas.
        </p>

        <section className="mt-10 space-y-6 text-sm leading-relaxed text-muted-foreground">
          <div>
            <h2 className="text-lg font-semibold text-foreground">1. Dados que Coletamos</h2>
            <p className="mt-2">
              Coletamos os dados que você fornece diretamente (e-mail da conta, dados de cobrança), os dados gerados durante o uso do Flow Leads (consultas de busca, tarefas de coleta, leads exportados) e dados técnicos mínimos (endereço IP, tipo de navegador) necessários para operar o Serviço.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">2. Base Legal do Tratamento</h2>
            <p className="mt-2">
              Tratamos dados pessoais com fundamento nas hipóteses da LGPD, especialmente: <strong>execução de contrato</strong> (art. 7º, V) para prestar o Serviço; <strong>legítimo interesse</strong> (art. 7º, IX, e art. 10) para segurança, prevenção a fraudes e melhoria do produto; <strong>cumprimento de obrigação legal</strong> (art. 7º, II); e <strong>consentimento</strong> (art. 7º, I), quando aplicável. Nosso legítimo interesse é sempre ponderado frente aos seus direitos e liberdades.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">3. Google OAuth e Google Sheets</h2>
            <p className="mt-2">
              Ao conectar o Google Sheets, usamos o Google OAuth 2.0 para obter um token de acesso com escopo restrito. Solicitamos apenas as permissões necessárias para ler e escrever na planilha que você indicar. Não acessamos outros arquivos do seu Google Drive.
            </p>
            <p className="mt-2">
              Os tokens de atualização (refresh tokens) do OAuth são armazenados de forma criptografada e usados exclusivamente para manter a sincronização com o Google Sheets. Você pode revogar o acesso a qualquer momento na página de Google Sheets do painel ou nas{" "}
              <a className="text-primary" href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer">permissões da sua Conta Google</a>.
            </p>
            <p className="mt-2">
              O uso e a transferência de informações recebidas das APIs do Google pelo Flow Leads observam a{" "}
              <a className="text-primary" href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer">Política de Dados do Usuário dos Serviços de API do Google</a>, incluindo os requisitos de Uso Limitado.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">4. Dados de Leads e Papéis (Controlador/Operador)</h2>
            <p className="mt-2">
              Os registros de leads que você gera (nome do estabelecimento, endereço, telefone, site, e-mail, avaliações) são armazenados na nossa base para que você possa reexportá-los e revisar o histórico. Você pode excluir seus leads a qualquer momento; leads excluídos são removidos da base ativa em até 30 dias.
            </p>
            <p className="mt-2">
              Em relação a esses dados de leads, <strong>você é o Controlador</strong> e o Flow Leads atua como <strong>Operador</strong> (arts. 5º, VI e VII, da LGPD). Cabe a você definir a finalidade do tratamento, possuir base legal adequada, atender aos titulares e disponibilizar opt-out em suas comunicações. Consulte a cláusula correspondente nos <Link to="/terms" className="text-primary">Termos de Uso</Link>.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">5. Como Usamos os Dados</h2>
            <p className="mt-2">
              Usamos os dados para operar, manter e melhorar o Serviço; processar pagamentos; oferecer suporte; e enviar comunicações relacionadas ao Serviço. <strong>Não vendemos seus dados pessoais.</strong>
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">6. Compartilhamento</h2>
            <p className="mt-2">
              Compartilhamos dados apenas com: (a) provedores de infraestrutura (hospedagem, banco de dados, e-mail); (b) processadores de pagamento; e (c) autoridades, quando exigido por lei. Cada provedor está sujeito a obrigações de confidencialidade e proteção de dados.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">7. Segurança</h2>
            <p className="mt-2">
              Adotamos salvaguardas de mercado, incluindo TLS em trânsito, criptografia em repouso para credenciais sensíveis e controle de acesso com privilégio mínimo. Nenhum sistema é 100% seguro, mas trabalhamos para proteger seus dados e comunicar incidentes relevantes conforme a LGPD.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">8. Seus Direitos como Titular (art. 18 da LGPD)</h2>
            <p className="mt-2">
              Você pode, a qualquer momento e mediante requisição, exercer os direitos previstos no art. 18 da LGPD, entre eles:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>confirmação da existência de tratamento;</li>
              <li>acesso aos dados;</li>
              <li>correção de dados incompletos, inexatos ou desatualizados;</li>
              <li>anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade;</li>
              <li>portabilidade a outro fornecedor;</li>
              <li>eliminação dos dados tratados com base no consentimento;</li>
              <li>informação sobre com quem compartilhamos seus dados;</li>
              <li>informação sobre a possibilidade de não fornecer consentimento e suas consequências;</li>
              <li>revogação do consentimento.</li>
            </ul>
            <p className="mt-2">
              Para exercer seus direitos, fale com nosso Encarregado (DPO) em <a className="text-primary" href="mailto:privacidade@flowleads.com.br">privacidade@flowleads.com.br</a>. Você também tem o direito de peticionar à <strong>Autoridade Nacional de Proteção de Dados (ANPD)</strong>.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">9. Retenção de Dados</h2>
            <p className="mt-2">
              Mantemos os dados da conta enquanto ela estiver ativa. Após a exclusão, backups residuais são eliminados em até 90 dias, ressalvadas as hipóteses de guarda obrigatória previstas em lei.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">10. Crianças e Adolescentes</h2>
            <p className="mt-2">O Flow Leads não é direcionado a menores de 18 anos e não coletamos, de forma consciente, dados de crianças e adolescentes.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">11. Alterações desta Política</h2>
            <p className="mt-2">Podemos atualizar esta Política. Alterações relevantes serão comunicadas por e-mail ou aviso no aplicativo.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">12. Contato e Encarregado (DPO)</h2>
            <p className="mt-2">
              Dúvidas sobre privacidade? Escreva para <a className="text-primary" href="mailto:privacidade@flowleads.com.br">privacidade@flowleads.com.br</a>.
            </p>
          </div>
        </section>
      </article>

      <SiteFooter />
    </div>
  );
}
