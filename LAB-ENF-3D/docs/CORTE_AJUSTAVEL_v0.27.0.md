# Corte Anatômico Ajustável — v0.27.0

## Nova propriedade

`AnatomyIsolationManager.cutOffset`

Faixa interna:
- -2.5;
- +2.5.

Interface atual:
- -2;
- +2.

## Modos

### Sagital
Plano normal ao eixo X.

### Transversal
Plano normal ao eixo Z.

O slider altera a constante do `THREE.Plane`.

## Uso

Disponível em:
- SharedAnatomySystemModule;
- Respiratório;
- Reprodutor;
- Corpo Humano.

## Limites

Não há:
- cap geometry;
- reconstrução do interior;
- espessura de corte;
- textura de secção;
- equivalência radiológica.

É um recurso espacial de ensino.
