# v0.5.0 — Corpo Humano Modular

Foi criado um explorador corporal 3D por sistemas.

## Nova infraestrutura

`LayeredModelManager.js`

Responsável por:

- registrar camadas
- carregar sob demanda
- controlar visibilidade
- controlar opacidade
- recarregar LOD
- liberar GPU

## Assets

Cada sistema possui LOW / MEDIUM / HIGH.

Isso permite evoluir esqueleto, pulmões, vasos e órgãos de forma independente.
