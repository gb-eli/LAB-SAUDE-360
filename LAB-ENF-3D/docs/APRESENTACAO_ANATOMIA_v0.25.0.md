# Apresentação Anatômica e Projetor — v0.25.0

## AnatomyPresentationPreset

Centraliza a apresentação dos principais laboratórios anatômicos.

### Iluminação
- iluminação base;
- preenchimento frontal;
- preenchimento superior;
- intensidade adaptada ao perfil gráfico.

No ECO as luzes complementares ficam desativadas.

### Projetor

Quando o modo Projetor está ativo:
- exposição do renderer sobe moderadamente;
- rotação fica mais controlada;
- zoom fica menos brusco;
- textos e controles dos módulos principais aumentam;
- a área tridimensional recebe mais altura.

## CameraController

As vistas agora podem fazer transição interpolada.

A interpolação:
- usa easing cúbico;
- não altera os presets existentes;
- é cancelada quando outra vista é solicitada;
- é desligada quando `reduced-motion` está ativo.

## Objetivo

O recurso foi pensado para:
- projetor;
- TV;
- lousa digital;
- explicação coletiva;
- navegação durante aula.

Não cria um modo de usuário diferente.
