# Atualização v0.3.0 — Engine 3D

## Infraestrutura

Foram adicionados:

```text
engines/
├── ThreeEngine.js
├── HotspotManager.js
└── CameraController.js
```

## Engine 3D

A `ThreeEngine` centraliza:

- Scene
- PerspectiveCamera
- WebGLRenderer
- OrbitControls
- qualidade gráfica
- iluminação
- resize
- frame loop
- métricas WebGL
- descarte de GPU

## Anatomia

O coração passa de representação plana G1 para um modelo procedural 3D G2.

## Equipamentos

A seringa também utiliza a mesma engine, provando que ela não está acoplada à anatomia.

## Fallback

Se Three.js ou WebGL não puder ser iniciado, os módulos exibem uma representação leve em vez de bloquear o conteúdo.
