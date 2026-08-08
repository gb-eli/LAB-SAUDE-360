# Perfil de Performance do Comparador — v0.28.0

## Objetivo

O Comparador é diferente dos demais módulos porque pode exibir dois modelos simultaneamente.

## ComparisonPerformanceManager

Sinais analisados:
- saveData;
- deviceMemory;
- hardwareConcurrency;
- pointer coarse;
- perfil gráfico global.

## Resolução

- ECO → ECO;
- MEDIUM → MEDIUM;
- HIGH → HIGH em dispositivo não limitado;
- ULTRA → HIGH em dispositivo não limitado;
- HIGH/ULTRA → MEDIUM em dispositivo limitado.

## Escala de renderização

- ECO: 0,72;
- MEDIUM: 0,86;
- HIGH: 1,00.

## Contexto WebGL

Somente um renderer é usado na v0.28.

## Orçamento estático HIGH

Pior combinação conservadora:
- 2 modelos;
- 80 draw calls;
- 23.776 faces.

Classificação interna:
`moderado`.

Isso representa pior caso estático e não uma medição real de FPS.
