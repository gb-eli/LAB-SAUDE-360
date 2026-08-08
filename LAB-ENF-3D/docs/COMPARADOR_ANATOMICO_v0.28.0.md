# Comparador Anatômico G3 — v0.28.0

## Mudança arquitetural

### v0.27
- 2 ThreeEngine;
- 2 renderers;
- 2 contextos WebGL.

### v0.28
- 1 ThreeEngine;
- 1 renderer;
- 2 roots de modelo.

Isso reduz:
- contextos WebGL;
- listeners;
- observers;
- buffers de canvas;
- duplicação da infraestrutura de câmera.

## Modos

### Lado a lado
A fica à esquerda e B à direita.

### Sobreposição A/B
Os dois roots são centralizados na mesma área visual.

A transparência pode ser controlada separadamente.

## Estruturas

Cada sistema possui uma lista de estruturas quando há conteúdo semântico disponível.

Selecionar uma estrutura oculta as outras meshes daquele modelo.

## Normalização

Cada modelo usa seu bounding box completo para:
- centralização;
- escala visual.

Mesmo quando uma estrutura é isolada, permanece a escala do sistema original.

Isso evita ampliar automaticamente uma pequena estrutura de forma enganosa.

## Exportação

`Exportar PNG` captura o canvas após uma renderização explícita.

A operação é local e não requer backend.

## Performance

O comparador possui orçamento próprio.

O perfil adaptativo pode reduzir HIGH/ULTRA para MEDIUM em dispositivos limitados sem alterar a configuração global.
