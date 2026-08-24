# Análise do consumo Apify — 24/08/2026

## Resultado

Na janela de 00:00 até 15:47 (America/Sao_Paulo), o banco de produção atribuiu
**US$ 1,0220 ao Google Maps** e **US$ 0 ao novo módulo do Instagram**.

Foram 10 runs distintos do Actor de Maps, todos concluídos, que devolveram 265
lugares. O custo observado foi o esperado pela tarifa usada pelo projeto:
aproximadamente US$ 0,004 por lugar, mais US$ 0,0002 por run.

| Grupo | Runs | Lugares | Custo |
| --- | ---: | ---: | ---: |
| Maior consumidor do período | 6 | 220 | US$ 0,8812 |
| Segundo consumidor | 4 | 45 | US$ 0,1408 |
| Total | 10 | 265 | US$ 1,0220 |

As dez chaves de busca eram diferentes (nicho e/ou região diferentes). Portanto,
o pico não foi causado por duplo clique, repetição da mesma consulta ou falha do
cache. Foi volume real de testes/coleta no Maps.

## Diferença para o painel da Apify

Se o painel da Apify mostrou aproximadamente US$ 2 no mesmo intervalo, cerca de
US$ 0,98 não está explicado pelo livro-caixa do SaaS. As hipóteses restantes são:

- período ou fuso diferente no painel da Apify;
- run iniciado diretamente no console da Apify;
- consumo em outra conta/chave do pool ainda não reconciliado;
- outro Actor que não passou pelos fluxos instrumentados do SaaS.

Não foi iniciado nenhum Actor para esta análise. A confirmação dessa diferença
depende apenas de reconciliar o extrato de runs da conta Apify com os IDs já
registrados no banco.

## Proteções implementadas

1. O cache de Maps passou a gravar a quantidade realmente devolvida, separada da
   quantidade pedida, e marca uma fonte esgotada. Isso evita nova cobrança inútil
   quando uma busca pediu, por exemplo, 40 lugares e a região só devolveu 21.
2. Registros legados do cache são corrigidos pela migration 090.
3. Uma retentativa do Instagram agora recebe somente o saldo do teto da tentativa
   anterior. O teto inteiro não é renovado quando uma chave acaba no meio do run.

As proteções não reduzem o limite solicitado nem o volume de leads entregue por
uma busca nova. Para reduzir o custo unitário das buscas novas de Maps, é preciso
negociar/trocar a faixa de preço do Actor ou validar outro provedor com um teste
controlado; cache não elimina o custo de consultas realmente distintas.
