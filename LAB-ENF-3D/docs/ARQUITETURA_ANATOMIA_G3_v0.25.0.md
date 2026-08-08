# Arquitetura de Anatomia G3 — v0.25.0

## Problema

Até a v0.24 existiam conjuntos separados de assets para:
- laboratório de Esqueleto;
- camada de Esqueleto do Corpo Humano;
- laboratório Cardiovascular;
- camada Cardiovascular do Corpo Humano.

Isso permitia divergência visual e duplicava GLBs no pacote.

## Decisão

A v0.25 define assets anatômicos compartilhados.

### Esqueleto
Um único conjunto LOW/MEDIUM/HIGH é consumido por:
- `esqueleto`;
- `corpo-humano`.

### Cardiovascular
Um único conjunto LOW/MEDIUM/HIGH é consumido por:
- `sistema-cardiovascular`;
- `corpo-humano`.

## Coordenadas

Os novos assets seguem um referencial comum:
- Z = eixo vertical;
- X = esquerda/direita;
- Y = profundidade.

O objetivo é permitir sobreposição das camadas sem transformação específica por módulo.

## Benefícios

- menos arquivos duplicados;
- mesma geometria entre laboratórios;
- correções futuras aplicadas em um único asset;
- menor risco de divergência semântica;
- menor pacote final;
- base para unificação progressiva dos demais sistemas.

## Manifesto

O arquivo:

`data/anatomy-g3-manifest.json`

registra os consumidores e variantes dos conjuntos compartilhados.
