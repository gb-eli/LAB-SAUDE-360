# Visibilidade de Categorias — v0.34.0

## Categorias

- structure;
- attention;
- relation;
- question.

## Comportamento

Ocultar uma categoria:
- não remove marcadores;
- não altera âncoras;
- não apaga localStorage dos marcadores.

Apenas adiciona o ID da categoria ao conjunto local de categorias ocultas.

## Persistência

Chave derivada:

`comparison-markers:category-visibility`

## Exportação

`visibleList()` e `exportMarkers()` respeitam a visibilidade.

Por isso categorias ocultas não aparecem na exportação atual.

## Sessões

A lista de categorias visíveis pode ser salva opcionalmente em:

`markerVisibility`

no workspace v1.
