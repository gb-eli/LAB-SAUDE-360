# Sincronização Semântica — v0.30.0

## Objetivo

Sincronizar seleções equivalentes sem criar afirmações anatômicas incorretas.

## Relação `equivalent`

Pode ser sincronizada automaticamente.

Exemplos:
- skull;
- thyroid_left;
- trachea.

## Relação `regional-reference`

Não é equivalência geométrica.

É apresentada somente quando o usuário solicita explicitamente um relacionado.

Exemplos:
- left_patella ↔ patella;
- left_humerus ↔ humeral_head;
- left_humerus ↔ humerus_distal.

## Arquitetura

`semantic-links.json`

é declarativo.

O manager não depende de nomes específicos codificados no controller.

Novas equivalências podem ser acrescentadas ao JSON sem reescrever o Comparador.

## Segurança pedagógica

A UI informa se o resultado é:
- Equivalente;
- Referência regional.

Isso reduz o risco de interpretar duas geometrias diferentes como a mesma estrutura.
