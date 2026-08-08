# Auditoria de Assets — v0.23.0

## Escopo

Todos os GLBs do pacote foram lidos e auditados estruturalmente.

Métricas coletadas:
- tamanho em bytes;
- número de faces;
- quantidade de geometrias;
- estimativa de draw calls;
- SHA-256.

## Resultado geral

- 303 GLBs;
- aproximadamente 5,74 MB;
- 525.280 faces;
- maior estimativa observada no pacote: 41 draw calls em um único GLB.

## Normalização dos novos assets

Os 15 GLBs novos da v0.23 foram submetidos a uma reexportação conservadora de teste.

O teste aumentou o peso total dos arquivos.

Decisão:
- manter os binários originais gerados;
- não fundir geometrias semânticas;
- não aplicar compressão destrutiva apenas para reduzir bytes.

Isso preserva IDs de mesh usados por raycasting e conteúdo didático.

O resultado da decisão está em:

`data/normalization-v0.23.json`

## Observação

A estimativa de draw calls usa o número de geometrias do GLB.

O número real em execução pode variar por:
- materiais;
- transparência;
- estado do renderer;
- sombras;
- duplicação de passes;
- plataforma.

As métricas reais continuam disponíveis no painel Diagnóstico.
