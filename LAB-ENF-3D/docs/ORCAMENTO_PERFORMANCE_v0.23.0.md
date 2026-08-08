# Orçamento de Performance — v0.23.0

## Métricas

O orçamento passa a considerar:
- maior GLB;
- faces;
- draw calls estimados;
- quantidade de assets referenciados.

## Faixa leve
- ≤ 250 KB por maior asset;
- ≤ 12.000 faces;
- ≤ 40 draw calls estimados.

## Faixa moderada
- ≤ 700 KB;
- ≤ 40.000 faces;
- ≤ 100 draw calls estimados.

## HIGH

Resultado:
- 33 módulos com GLB em faixa leve;
- 1 módulo em faixa moderada.

### Ponto de atenção
Pele G3:
- ~26 KB;
- ~4.084 faces;
- 41 draw calls estimados.

Isso indica que o próximo ganho relevante não é reduzir polígonos, e sim agrupar geometrias quando isso puder ser feito sem perder semântica educacional.
