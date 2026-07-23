# Dívidas técnicas — Flow Leads

Registro honesto do que está devendo. Uma dívida sai daqui quando for PAGA (com
prova), não quando for esquecida.

## 0. Cobrança recorrente — CAMADA 3 do billing (registrada em 2026-07-22)

**O que existe:** o billing está pronto até a camada 2 — cadastro de planos
(`planos`, migration 045), org aponta pra um plano (`orgs.plano_id`), e a
MEDIÇÃO + APLICAÇÃO de limite por org já roda (`consumo_org` + função
`consumir_ou_bloquear`, migration 046; instrumentada em `search-leads` e
`redesign-site`). Ao bater o limite do plano, a ação é bloqueada com aviso.

**O que FALTA (camada 3 — NÃO construir agora):** cobrança recorrente de verdade.
Depende de um gateway (Stripe / Mercado Pago) que o **dono vai escolher**. Para
plugar depois, o modelo já está pronto:
- `orgs.plano_id` diz o que a org assina;
- faltam: `assinaturas` (status, ciclo, gateway_customer_id, gateway_sub_id),
  webhook do gateway para ativar/suspender por pagamento, e a troca de plano na
  Ut (hoje o plano da org só muda por SQL/serviço).
- Regra ao ligar: assinatura vencida/suspensa → org cai para um plano gratuito
  ou é bloqueada (decisão do dono), reusando o mesmo `consumir_ou_bloquear`.

**Até lá:** os planos funcionam como limite operacional (freio de uso), não como
cobrança. Ninguém é cobrado; o `preco` dos planos é só catálogo.

**Política de inadimplência (decidida pelo dono em 2026-07-23, gateway ainda
não escolhido):** assinatura vencida/inadimplente → **bloquear acesso até
regularizar**. Refinamento ainda a decidir na implementação: bloquear as
AÇÕES (busca, disparo, publicação) mas manter os DADOS visíveis (leads,
propostas, histórico) — por dois motivos: (a) atrito de cobrança — corte total
some com a chance de o cliente regularizar por conta própria vendo o que
perderia; (b) LGPD — o titular tem direito de acesso aos próprios dados mesmo
com a conta em atraso, então apagar/esconder tudo é o caminho errado. Quando o
gateway for escolhido, implementar o bloqueio de ação reusando o mesmo padrão
de `consumir_ou_bloquear` (nova condição: assinatura em dia), não um mecanismo
novo. Tela `/admin` → Pagamentos já existe com o estado honesto (o que está
pronto vs. o que falta) — ver `AdminPagamentos.tsx`.

## 1. Gasto Apify CEGO anterior ao livro-caixa (registrada em 2026-07-22)

**O que é:** as 2 buscas de Maps via provider `apify` feitas ANTES do livro-caixa
existir (listas "Advogado — São Paulo/SP", 30 leads, e "Clínica odontológica —
Curitiba/PR", 50 leads) gastaram crédito da conta Apify e **não estão medidas em
lugar nenhum do sistema**. O custo delas só existe no billing da conta
(console.apify.com → Billing). A Management API da Supabase não expõe o valor do
secret `APIFY_API_TOKEN` (retorna digest; deu 401 ao tentar usar), então nem o
agente consegue puxar o número da conta por aqui.

**Por que importa:** o teto mensal (US$ 50, global do livro-caixa `redes_buscas`)
só enxerga o que passa pelo livro-caixa. Gasto que não passa por ele é FURO no
teto — o total real do mês pode ser maior do que o sistema acredita.

**Regra até pagar a dívida:** antes de ligar QUALQUER automação contínua que
gaste, TODO caminho de gasto de API tem que registrar no livro-caixa
(`redes_buscas`). Estado em 2026-07-22:
- ✅ coleta de redes (`buscar-redes`) — registra desde a criação;
- ✅ geração de sites (`redesign-site`) — registra desde a FASE 0 (fonte
  `ia_site`, custo real IA + Apify de reviews, inclusive parcial em erro);
- ⚠️ provider `apify` do Maps (`search-leads` com fonte apify) — **NÃO registra**
  (o custo do run é logado no streaming e descartado). É o mesmo furo das 2
  buscas antigas. Não usar essa fonte em automação até registrar no livro-caixa.
- ⚠️ Apify de reviews chamado por outros caminhos que não o redesign-site (se
  houver no futuro) — mesma regra.

**Como pagar:** (a) registrar o custo real do run do provider apify do Maps no
livro-caixa (mesmo padrão do `buscar-redes`); (b) conferir 1x o billing da conta
Apify e anotar o gasto histórico cego para fechar a conta do mês corrente.
