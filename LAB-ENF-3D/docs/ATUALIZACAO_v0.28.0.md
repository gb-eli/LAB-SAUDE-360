# v0.28.0 — Comparador Estrutural + Busca Anatômica

## Comparador
- 1 renderer;
- 2 modelos;
- 15 sistemas;
- seleção de estrutura A/B;
- lado a lado;
- sobreposição;
- opacidade A/B;
- exportação PNG;
- perfil adaptativo próprio.

## Performance do Comparador
Novo `ComparisonPerformanceManager.js`.

Em dispositivo limitado, HIGH/ULTRA global pode usar MEDIUM somente dentro do Comparador.

## Cabeça/Pescoço
- integrado ao manifesto;
- SharedAnatomySystemModule;
- 6/6 estruturas em todos os LODs.

## Olho/Ouvido
- integrado ao manifesto;
- SharedAnatomySystemModule;
- 6/6 estruturas em todos os LODs.

## Busca
Novo `search-index-v0.28.json`.

Busca global agora considera estruturas internas.

Filtros:
- área;
- geração;
- ordenação.

## Corpo Humano
Busca local por estrutura com abertura automática da camada correspondente.

## Limpeza
6 GLBs regionais antigos removidos.

## Assets
- 258 GLBs;
- ~5,00 MB;
- 412.056 faces.

## Jornada
- `ENF-JORNADA-21`.
