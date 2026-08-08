# Prévia de Sessão — v0.34.0

## Objetivo

Inspecionar uma sessão importada sem alterar a comparação atual.

## Serviço

`ComparisonSessionPreviewManager`

## Estado atual

É capturado por:

`currentWorkspaceState()`

## Estado importado

É lido de:

`packageData.state`

## Comparação

São comparados:
1. systemA;
2. structureA;
3. systemB;
4. structureB;
5. mode;
6. opacityA;
7. opacityB;
8. semanticSync;
9. markerLines.

## Saída

O preview contém:
- descrições humanas dos sistemas/estruturas;
- lista de mudanças;
- total de alterações;
- resumo de marcadores;
- anotação;
- nome de exportação;
- presença de estilos;
- quantidade de presets locais.

## Segurança de estado

A prévia não chama:
- `setSideSelection`;
- `reloadBoth`;
- `replaceAll`;
- `setMode`.

Portanto é somente leitura.

A modificação acontece apenas em:

`applyWorkspacePackage()`
