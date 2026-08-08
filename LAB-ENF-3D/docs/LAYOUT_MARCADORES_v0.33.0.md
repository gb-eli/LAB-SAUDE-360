# Layout de Marcadores — v0.33.0

## Dois tipos de movimento

### Reposicionar âncora
Novo raycast.
Altera a referência anatômica.

### Arrastar etiqueta
Não faz raycast.
Mantém a referência anatômica.
Altera apenas `screenOffset`.

## Arraste

A etiqueta escuta pointer events.

Durante o arraste:
- atualiza o offset em memória;
- redesenha a etiqueta;
- não grava localStorage a cada pixel.

Ao soltar:
- grava o novo offset;
- emite evento `dragged`.

## Auto-layout

O manager testa posições ao redor da âncora.

Critérios:
- caixa dentro do canvas;
- menor colisão com caixas já posicionadas.

O algoritmo é propositalmente leve para continuar adequado a celulares.

## Reset

`resetLabelOffsets()`

remove todos os offsets explícitos e volta aos offsets padrão por categoria.
