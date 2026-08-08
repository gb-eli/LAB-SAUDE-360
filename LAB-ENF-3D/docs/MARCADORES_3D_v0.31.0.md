# Marcadores 3D — v0.31.0

## Serviço

`ComparisonMarkerManager`

## Criação

O usuário:
1. escreve um texto;
2. arma o modo marcador;
3. clica diretamente no canvas;
4. o manager executa raycast apenas nas meshes visíveis.

## Âncora

O marcador armazena:

- lado A/B;
- systemId;
- objectName;
- ponto local;
- ponto normalizado no bounding box;
- texto;
- data de criação.

## Por que ponto normalizado?

LOW, MEDIUM e HIGH podem possuir geometrias diferentes.

O mesmo ponto local absoluto pode não corresponder à mesma região ao trocar de LOD.

A posição normalizada permite reconstruir a âncora proporcionalmente ao bounding box da nova mesh.

## Projeção

A cada frame:
1. local/normalizado → coordenada local atual;
2. local → world;
3. world → NDC;
4. NDC → posição HTML sobre o canvas.

## Segurança de contexto

O marcador também guarda `systemId`.

Se o lado A/B estiver exibindo outro sistema, a etiqueta fica oculta mesmo que exista outra mesh com o mesmo nome.

## Exportação

Somente marcadores visíveis da comparação atual entram:
- no PNG;
- nos metadados do histórico;
- na ficha HTML.

## Limite

8 marcadores locais.
