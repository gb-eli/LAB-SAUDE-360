# Zonas e Clusters — v0.37.0

## Clustering
Pontos projetados com distância de até 48 px podem formar um grupo.

O cluster:
- exibe quantidade;
- evita sobreposição de etiquetas;
- é calculado em coordenadas da tela;
- não altera geometria;
- não remove conteúdo.

## Zona
Cada item pode informar `zone`.

Fallback:
`zone → category → Pontos`.

## Navegação
A legenda do mini mapa é clicável e seleciona o primeiro ponto da zona.

## Trilhas
Itens com `order` geram uma polyline no mini mapa.

Atualmente a CME utiliza a sequência completa.
