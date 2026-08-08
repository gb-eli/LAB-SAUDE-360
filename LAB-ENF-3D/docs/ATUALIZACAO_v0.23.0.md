# v0.23.0 — Integridade G3, Posicionamento G3 e Preload Inteligente

## Laboratórios
- Feridas e Integridade Cutânea G3;
- Posicionamento G3;
- Medicamentos G2 aprimorado.

## Assets
15 novos GLBs:
- 3 Integridade Cutânea G3;
- 9 Posicionamento G3;
- 3 Medicamentos G2.

## Navegação
- badges G1/G2/G3/SIM na home;
- geração também exibida em Favoritos e Recentes.

## Jornadas
Novo `JourneyPreloadManager.js`.

Pré-carrega somente o próximo laboratório em momento ocioso, respeitando economia de dados e conexões lentas.

Corrigido o roteiro antigo quando uma etapa não possui `activityCode`.

## Performance
`performance-budget.json` agora inclui draw calls estimados.

`asset-audit.json` registra SHA-256, tamanho, faces, geometrias e estimativa de draw calls de todos os GLBs.

## Jornada
Adicionada `ENF-JORNADA-16`.
