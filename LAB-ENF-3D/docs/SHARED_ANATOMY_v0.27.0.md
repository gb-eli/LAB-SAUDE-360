# Shared Anatomy — v0.27.0

## Objetivo

Evitar que cada laboratório anatômico mantenha seu próprio controlador quase idêntico.

## SharedAnatomySystemModule

O factory recebe apenas configuração:

- `materialSystem`;
- `title`;
- `badge`;
- `description`;
- `note`;
- `modelPath`;
- `contentPath`;
- câmera e tamanho.

O módulo gerado recebe automaticamente:
- engine 3D;
- loader;
- guard assíncrono;
- material preset;
- raycast;
- câmera;
- clipping;
- isolamento;
- fallback;
- lifecycle.

## Laboratórios usando o factory

- Endócrino;
- Linfático;
- Muscular;
- Pele;
- Urinário;
- Digestório;
- Nervoso.

Respiratório permanece dedicado por possuir animação ventilatória.

Cardiovascular permanece dedicado por possuir pulso visual.

Reprodutor permanece dedicado por possuir dois modelos alternáveis.

## Benefício

Uma futura correção no corte, fallback ou câmera pode ser aplicada uma única vez para sete laboratórios.
