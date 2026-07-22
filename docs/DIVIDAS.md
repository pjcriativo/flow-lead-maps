# Dívidas técnicas — Flow Leads

Registro honesto do que está devendo. Uma dívida sai daqui quando for PAGA (com
prova), não quando for esquecida.

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
