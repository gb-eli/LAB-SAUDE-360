# Mini Mapa Vivo — v0.38.0

## Novos elementos

- zona ativa;
- marcador aproximado do foco da câmera;
- cluster radial;
- trilha ordenada;
- navegação pela legenda.

## Marcador da câmera

O marcador utiliza:

`engine.controls.target`

e normaliza suas coordenadas contra os limites X/Y dos pontos disponíveis.

Ele representa para onde a visualização está orientada, não a posição física precisa do observador.

## Zona ativa

Selecionar um item atualiza a zona associada.

A respectiva legenda recebe estado visual ativo.

## Cluster radial

Quando um cluster é aberto, seus membros são distribuídos em um círculo ao redor do ponto de agrupamento.

A expansão é temporária e desaparece após a seleção.
