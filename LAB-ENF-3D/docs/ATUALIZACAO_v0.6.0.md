# v0.6.0 — Sistemas anatômicos + Hospital 3D

## Anatomia

- respiração animada
- batimento visual
- coração detalhado reutilizado dentro do corpo
- esqueleto com regiões
- órgãos isoláveis

## Hospital

Foi criado o primeiro ambiente hospitalar 3D real da plataforma.

O módulo anterior, baseado em panorama simulado, evolui para uma cena GLB com raycasting.

## Infraestrutura

### MotionManager

Centraliza movimentos visuais reutilizáveis.

### LayeredModelManager

Passa a suportar transformações por camada, permitindo encaixar um asset independente dentro de outro contexto.
