# v0.34.0 — Preview de Sessão, Presets com Tags e Layout Adaptativo

## Presets personalizados
- editar;
- duplicar;
- tags;
- busca;
- filtro por tag;
- preservação do estado A/B durante edição de metadados;
- atualização do estado somente sob opção explícita.

## Marcadores
- ocultar/reexibir categoria;
- persistência da visibilidade;
- categorias ocultas excluídas da exportação atual.

## Auto-layout
Agora considera:
- zoom;
- distância da câmera;
- bordas;
- tamanho da etiqueta;
- overflow;
- colisão.

## Sessão
Novo `ComparisonSessionPreviewManager.js`.

Antes de aplicar:
- estado atual × sessão;
- 9 campos comparados;
- marcadores;
- anotação;
- estilos;
- presets locais.

## Correção
`ComparisonPackageCompatibilityManager` agora recebe `systems()` resolvido.

## Busca
`search-index-v0.34.json`
- 2.399 termos.

## Assets
Sem alteração:
- 246 GLBs;
- ~4,83 MB;
- 399.712 faces.

## Jornada
- `ENF-JORNADA-27`.
