# Análise de repetição das buscas Maps — 24/08/2026

## Evidência de produção

A consulta somente leitura dos últimos 30 dias encontrou 119 combinações pagas
de usuário/nicho/cidade. Várias combinações tiveram mais de um run. Como a
telemetria antiga não guardava a chave normalizada nem as coordenadas em todos os
registros, esses grupos são indício de repetição, não prova de que toda ocorrência
era a mesma área exata.

O banco não contém duplicatas persistidas por organização:

- grupos duplicados por `org_id + place_id`: **0**;
- grupos duplicados por `org_id + nome/endereço normalizados`: **0**.

Isso prova que a proteção permanente de leads funciona, mas também revelou que
ela atuava tarde: o cache devolvia o mesmo prefixo, e só depois o pipeline removia
os leads conhecidos. O cliente podia receber zero leads mesmo com uma resposta de
cache, e uma ampliação voltava a cobrar o prefixo do Actor.

## Regra implementada

1. A consulta é identificada por nicho normalizado e cidade/UF ou área do mapa.
2. O cache bruto continua compartilhado entre todas as organizações por 30 dias.
3. Antes de responder, o cache é comparado ao `lead_seen_registry` permanente da
   organização; somente a próxima fatia inédita é devolvida.
4. O livro-caixa `api_consumption_logs` registra `metadata.query_key`, quantidade
   nova pedida e profundidade coletada.
5. Se a mesma organização já iniciou um run pago para aquela chave nos últimos 30
   dias, outro run não pode começar. O sistema entrega o estoque inédito restante
   ou encerra sem leads e sem cobrança.
6. Outra organização reaproveita gratuitamente o estoque compartilhado. Ela só
   pode ampliar a profundidade se nunca tiver pago aquela consulta e o estoque não
   for suficiente nem estiver esgotado.
7. O limite máximo de profundidade continua em 1.000 lugares, preservando o teto
   rígido já adotado pelo projeto.

O resultado separa dois conceitos que antes estavam misturados: deduplicação
permanente por cliente e estoque compartilhado por consulta. A quantidade de leads
não é reduzida quando existem itens inéditos no cache; a qualidade permanece igual
porque os dados são os mesmos resultados brutos do Actor, apenas sem repetição.
