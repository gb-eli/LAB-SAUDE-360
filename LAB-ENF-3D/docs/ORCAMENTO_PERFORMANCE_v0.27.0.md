# Orçamento de Performance — v0.27.0

## Assets gerais

- 264 GLBs;
- ~5,18 MB;
- 425.136 faces.

## Cena única

No HIGH:
- 34 módulos com GLB: leves;
- nenhum módulo de cena única moderado ou alto.

## Comparador

O Comparador possui duas cenas simultâneas.

Maior combinação conservadora:
- 40 draw calls por renderer;
- 80 draw calls concorrentes.

Classificação:
`moderado`.

## Corpo Humano

Possui 15 camadas registradas, mas continua lazy-load.

O botão global foi limitado ao preset `systems`.

Os novos sistemas permanecem acessíveis individualmente.

Essa limitação é intencional para evitar que “15 camadas disponíveis” seja interpretado como “15 camadas carregadas ao mesmo tempo”.
