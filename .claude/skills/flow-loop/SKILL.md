---
name: flow-loop
description: >-
  Loop de execução autônoma do projeto Flow Leads — o agente assume a tarefa do
  início ao fim: planeja, executa, verifica e só para quando um CRITÉRIO DE PRONTO
  OBJETIVO passar (build, lint, testes e app subindo sem crashar). USE SEMPRE,
  AUTOMATICAMENTE, para QUALQUER pedido que envolva escrever ou alterar código,
  como: implementar, construir, criar, adicionar, desenvolver, montar, codar,
  programar, corrigir, consertar, resolver bug, ajustar, refatorar, otimizar,
  fazer funcionar, terminar, finalizar, deixar pronto, integrar, conectar,
  configurar, migrar, ou "faz aí", "resolve isso", "manda ver", "toca o projeto".
  Também para tarefas de front, back, banco/Supabase, Edge Function, Places e
  WhatsApp/Evolution. Gatilhos de exemplo: "implementa a busca com Places",
  "cria a Edge Function de X", "conserta o erro no dashboard", "faz o login
  funcionar", "ajusta o componente Y e garante o build". NÃO acione para perguntas
  conceituais, explicações, decisões de arquitetura ou pesquisa (nesses casos,
  apenas responda). Ao acionar, siga as regras invioláveis abaixo (critério
  objetivo de pronto, teto de 5 iterações, proibição de fraudar testes).
---

# Flow Loop — execução autônoma com freios

Este loop faz o agente **assumir uma tarefa e levá-la até o fim**: planejar,
executar, verificar e repetir até passar. A diferença para um loop ingênuo é que
ele NUNCA declara "pronto" por conta própria — ele prova, com comandos que
retornam verde, e para de forma segura se não conseguir.

## Regras invioláveis (leia antes de tudo)

1. **PRONTO é objetivo, não sensação.** Só é "concluído" quando TODOS os comandos
   do bloco `CRITÉRIO DE PRONTO` retornam sucesso (exit 0) e a saída é mostrada ao
   usuário como prova. "Acho que está funcionando" não conta.
2. **Teto de iterações: 5.** Se após 5 ciclos completos o critério não passar,
   PARE, escreva um relatório do que travou (erro exato + hipótese) e devolva o
   controle ao usuário. Não continue tentando indefinidamente.
3. **Proibido fraudar o verde.** É terminantemente proibido, para fazer um teste
   passar: pular/comentar testes, enfraquecer asserções, aumentar timeouts para
   mascarar lentidão, mockar o que deveria ser integração real, apagar casos de
   teste, ou marcar `.skip`/`.only`. Se o teste não passa de verdade, o trabalho
   NÃO está pronto — reporte, não maquie.
4. **Uma tarefa por loop.** Não expanda o escopo. Se descobrir trabalho adicional,
   anote como "follow-up" e não o execute sem confirmação.
5. **Respeite os guardrails do projeto.** Nunca toque no `.env`, nunca faça `git
   push` sem o critério ter passado, nunca rode comando destrutivo (`rm -rf`,
   `git reset --hard`) sem confirmação explícita.

## O ciclo

Repita os passos 1–5 até PRONTO ou até bater o teto de 5 iterações.

### 0. Enquadrar (uma vez, no começo)
- Reafirme em 1–2 frases o que a tarefa entrega.
- Defina o `CRITÉRIO DE PRONTO` desta tarefa (ver seção abaixo). Se o usuário não
  deu um, proponha um e confirme antes de executar.
- Registre o teto: iteração 0 de 5.

### 1. Planejar
- Liste os passos concretos. Se a tarefa for grande, quebre em subtarefas
  sequenciais e faça uma de cada vez.

### 2. Executar
- Implemente o menor incremento que aproxima do critério.
- Faça commits locais por incremento (mensagem descritiva). NÃO faça push ainda.

### 3. Verificar (o coração do loop)
- Rode, na ordem, os comandos do `CRITÉRIO DE PRONTO` e CAPTURE a saída real.
- Se algum falhar: NÃO conserte no chute. Antes, investigue a causa-raiz (leia o
  erro completo, o arquivo e a linha). Só então corrija. Volte ao passo 2.
- Incremente o contador de iteração.

### 4. Autoauditoria anti-fraude
Antes de considerar verde, confirme para si mesmo:
- Nenhum teste foi pulado, comentado, enfraquecido ou mockado indevidamente?
- A asserção testa o comportamento real, não uma versão trivializada?
- O `git diff` dos testes não removeu cobertura?
Se qualquer resposta for "sim/duvidosa", o trabalho NÃO está pronto.

### 5. Fechar
- Quando TODOS os comandos passam e a autoauditoria está limpa:
  - Mostre ao usuário a saída dos comandos como prova.
  - Faça o commit final e, se o projeto autorizar push, faça push.
  - Escreva um resumo curto: o que mudou, como foi verificado, follow-ups.
- Se bateu o teto sem passar:
  - PARE. Relate: último erro exato, o que já tentou, e sua melhor hipótese.
  - Devolva o controle. Não entre em nova rodada sem o usuário pedir.

## CRITÉRIO DE PRONTO (padrão do Flow Leads)

Ajuste por tarefa, mas o padrão do projeto é: a tarefa só está pronta quando
todos abaixo retornam exit 0 e a saída é exibida.

```
# 1. Compila sem erro
npm run build

# 2. Sem erro de tipos/lint (se houver script)
npm run lint        # pule se o script não existir

# 3. Testes passam (se houver)
npm run test        # pule se ainda não houver testes

# 4. Fumaça: o app sobe sem crashar
#    (rode em background por alguns segundos e verifique que não caiu)
timeout 15 npm run dev
```

Para tarefas de banco/Supabase, adicione ao critério:
- a migration aplica sem erro (`supabase db push` ou o fluxo do projeto);
- uma query de fumaça retorna o esperado.

Para tarefas de Edge Function, adicione:
- a função responde 200 a uma chamada de teste com payload mínimo.

## Quando NÃO usar este loop
- Pedidos de explicação, pesquisa ou decisão de arquitetura → responda direto.
- Mudança trivial de 1 linha (doc/config) → faça e verifique sem cerimônia.
- Quando o critério de pronto não puder ser objetivo → alinhe com o usuário
  primeiro; não entre em loop sem saber o que é "verde".

## Integração com outras skills (se instaladas)
- `systematic-debugging` → use no passo 3 quando algo falhar.
- `verification-before-completion` → reforça o passo 3/5.
- `no-workarounds` → reforça a regra 3 (proibido fraudar).
- `testing-boss` / `vitest` → padrão dos testes que compõem o critério.
