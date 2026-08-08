# v0.29.0 — Destaque, Presets A/B e Histórico Local

## Destaque
Novo `AnatomyHighlightManager.js`.

Integrado ao controlador anatômico compartilhado, Articulações e Comparador.

## Mão/Pé
Migrou para SharedAnatomySystemModule.

Equivalência:
- 10/10 em LOW/MEDIUM/HIGH.

## Articulações
Equivalência:
- Ombro 6/6;
- Cotovelo 7/7;
- Joelho 9/9.

Ganharam:
- destaque;
- isolamento;
- corte ajustável;
- fallback.

## Comparador
- 19 conjuntos anatômicos;
- 6 presets;
- destaque A/B;
- histórico PNG IndexedDB;
- até 8 capturas;
- métricas próprias.

## ThreeEngine
Novo parâmetro opcional `rendererOptions`.

O Comparador usa `preserveDrawingBuffer`.

## Diagnóstico
Novo evento:
`comparison:metrics`.

## Assets
12 GLBs antigos removidos.

Total:
- 246 GLBs;
- ~4,83 MB;
- 399.712 faces.

## Jornada
- `ENF-JORNADA-22`.
