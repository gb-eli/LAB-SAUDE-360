# Fallback Anatômico 2D/SVG — v0.26.0

## Objetivo

A plataforma não deve ficar inutilizável quando WebGL falhar.

## Implementação

`AnatomyFallbackRenderer.js`

Renderiza:
- SVG simples;
- núcleo central;
- nós de estruturas;
- lista de nomes;
- texto educativo.

## Utilização

Foi integrado a:
- Respiratório;
- Urinário;
- Digestório;
- Nervoso;
- Corpo Humano.

## Limite

O fallback serve para:
- reconhecimento de nomes;
- continuidade da aula;
- dispositivos muito limitados.

Ele não pretende reproduzir as relações tridimensionais completas.
