# Base compartilhada de leads — 24/08/2026

## Regra de produto

- Um lead já entregue a uma organização nunca volta para ela, mesmo que seja apagado do CRM.
- Antes da Apify, toda busca consulta o catálogo global de empresas públicas.
- O catálogo aceita a mesma cidade/UF ou uma área de mapa compatível com o raio solicitado.
- Nichos cadastrados como equivalentes compartilham estoque. Exemplo: `dentista`,
  `odontologia` e `clínica odontológica` pertencem à família `odontologia`.
- Resultados do catálogo têm prioridade e são ordenados por qualidade e atualização.
- O cache exato complementa o catálogo sem repetir a mesma identidade comercial.
- A Apify só pode iniciar quando ainda faltam candidatos e a organização não pagou a
  mesma consulta nos últimos 30 dias.
- Quando uma fonte já foi esgotada, a busca termina com o estoque local disponível e
  não repete uma cobrança sem perspectiva de resultado novo.

## Separação dos dados

`lead_catalog` guarda somente dados públicos de empresas já descobertas. Os dados do
CRM permanecem em `leads` e continuam isolados por organização. A associação entre
empresa, nicho equivalente e área fica em `lead_catalog_hits`.

`lead_seen_registry` continua sendo a fonte definitiva para saber se uma organização
já recebeu uma empresa. A exclusão de um lead no CRM não apaga esse histórico.

## Atualização e qualidade

O estoque semelhante é considerado válido por 90 dias. Dentro dele, empresas com
telefone, site, Instagram e mais avaliações aparecem primeiro. Uma nova coleta
preserva campos ricos já conhecidos quando o provedor devolver um campo vazio.

## Observabilidade

Cada busca Maps registra em `lead_search_events`:

- quantidade pedida;
- leads vindos do catálogo;
- leads vindos do cache exato;
- leads novos vindos do provedor;
- duplicatas descartadas;
- se um run pago foi iniciado;
- motivo de a busca ter sido atendida sem cobrança ou ampliada.

O painel **Consumo de APIs** mostra o tamanho da base, percentual de reaproveitamento,
runs evitados, repetidos bloqueados, custo por lead Apify novo e as consultas com maior
economia.

## Limite conhecido

A equivalência semântica é deliberadamente controlada pela tabela
`lead_niche_aliases`. Isso evita misturar automaticamente nichos apenas relacionados,
como `barbearia` e `salão de beleza`. Novos sinônimos podem ser adicionados à tabela
sem alterar o catálogo ou o histórico já existente.
