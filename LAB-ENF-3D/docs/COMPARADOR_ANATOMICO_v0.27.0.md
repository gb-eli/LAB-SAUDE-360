# Comparador Anatômico G3 — v0.27.0

## Objetivo

Permitir comparação simultânea de sistemas durante aula, estudo ou apresentação.

## Fontes

As opções vêm de:

`data/anatomy-g3-manifest.json`

Nenhum GLB específico foi criado para o comparador.

## Recursos

- Sistema A;
- Sistema B;
- vista frontal sincronizada;
- vista lateral sincronizada;
- vista superior sincronizada;
- auto rotação;
- troca dos lados;
- troca de perfil gráfico acompanhada pelas duas cenas.

## Escala

Cada modelo é:
1. carregado;
2. centralizado;
3. normalizado para uma caixa visual semelhante.

Consequência:
o tamanho exibido é comparativo, e não escala anatômica real.

## Performance

São dois `ThreeEngine` ativos.

O orçamento considera concorrência 2.

No pior asset HIGH atual:
- 40 draw calls por cena;
- 80 draw calls estimados em duas cenas.

Classificação:
`moderado`.

O comparador deve permanecer sob demanda e nunca ser pré-carregado como duas cenas completas.
