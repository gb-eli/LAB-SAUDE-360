# Otimização da Pele G3 — v0.24.0

## Problema

O modelo HIGH possuía poucas faces para o padrão da plataforma, mas 41 geometrias.

A maior parte vinha de:
- vários pelos;
- vários folículos;
- várias glândulas;
- vários ductos;
- várias terminações nervosas.

Como cada geometria tende a gerar uma chamada de desenho, o custo era desproporcional ao número de polígonos.

## Estratégia

Foram mantidos individualmente os meshes necessários ao conteúdo semântico:

- epidermis;
- dermis;
- hypodermis;
- hair_1;
- hair_follicle_1;
- gland_1;
- sweat_duct_proxy_1;
- arterial_vessel_proxy;
- venous_vessel_proxy;
- cutaneous_nerve_proxy.

Repetições não essenciais ao clique foram agrupadas em:
- `hair_cluster`;
- `follicle_cluster`;
- `gland_cluster`;
- `duct_cluster`;
- `nerve_ending_cluster`.

## Resultado

### LOW
7 → 5 geometrias.

### MEDIUM
27 → 13 geometrias.

### HIGH
41 → 15 geometrias.

Faces HIGH:
4.084 → 4.084.

A otimização privilegia redução de draw calls sem sacrificar os hotspots usados pelo laboratório.
