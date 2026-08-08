# v0.33.0 — Layout de Marcadores, Presets Locais e Compatibilidade

## Marcadores
- etiquetas arrastáveis;
- âncora anatômica preservada;
- `screenOffset` persistente;
- organização automática;
- reset de posições;
- linhas-guia adaptadas ao novo offset.

## Estilos
Novo `ComparisonMarkerStyleManager.js`.

Configuração local por categoria:
- cor;
- ícone.

## Presets personalizados
Novo `CustomComparisonPresetManager.js`.

- máximo 20;
- salvar comparação atual;
- aplicar;
- excluir;
- importar/exportar JSON.

## Compatibilidade
Novo `ComparisonPackageCompatibilityManager.js`.

Sessões são analisadas antes da aplicação.

## Histórico
Novo `ComparisonPackageHistoryManager.js`.

Até 8 pacotes analisados.

## Sessão completa
Workspace v1 permanece compatível com v0.32 e pode incluir:
- markerStyles;
- customPresets;
- presetFilters.

## Busca
`search-index-v0.33.json`
- 2.350 termos.

## Assets
Sem alterações:
- 246 GLBs;
- ~4,83 MB;
- 399.712 faces.

## Jornada
- `ENF-JORNADA-26`.
