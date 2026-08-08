# Pré-carregamento de Jornadas — v0.23.0

## Objetivo

Reduzir o intervalo entre uma etapa e a próxima sem transformar o site em um download antecipado de toda a plataforma.

## Estratégia

O `JourneyPreloadManager` analisa apenas o próximo passo.

Pode antecipar:
- entry JavaScript;
- folhas CSS;
- até dois GLBs do perfil gráfico atual.

## Proteções

O preload não é feito quando:
- `navigator.connection.saveData` está ativo;
- conexão reportada é `2g`;
- conexão reportada é `slow-2g`;
- não existe próxima etapa.

A execução é agendada via `requestIdleCallback` quando disponível.

## GitHub Pages

O sistema não exige service worker ou backend.

Os requests antecipados usam cache HTTP normal do navegador e funcionam no modelo estático do GitHub Pages.
