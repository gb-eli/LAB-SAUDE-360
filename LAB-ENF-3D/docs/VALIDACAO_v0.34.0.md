# Validação v0.34.0

## Validação concluída

Foram executados:

- `node --check` em todos os arquivos JavaScript;
- parse de todos os JSONs;
- resolução de imports relativos;
- validação do catálogo;
- validação das atividades;
- validação das jornadas;
- validação dos presets oficiais;
- validação das relações semânticas;
- regressão dos pacotes v0.32/v0.33;
- testes unitários Node dos presets personalizados;
- testes de tags, busca, edição e duplicação;
- testes do `ComparisonSessionPreviewManager`;
- testes de visibilidade de categorias;
- validação dos 246 GLBs;
- equivalência semântica ECO/MEDIUM/HIGH;
- auditoria de atribuição direta de materiais;
- orçamento estático de performance;
- smoke HTTP dos arquivos centrais;
- integridade do ZIP completo;
- integridade do patch;
- comparação SHA-256 do patch.

## Correção de regressão

Foi identificado que a v0.33 criava o `ComparisonPackageCompatibilityManager` com:

`systems`

em vez de:

`systems()`

Como `systems` é uma função, isso poderia fazer o painel considerar sistemas válidos como ausentes.

A v0.34 corrige essa passagem e possui teste de regressão para um pacote válido da v0.32.

## QA visual em navegador

Foi tentado Chromium + Playwright de duas formas:

1. servidor local `http://127.0.0.1`;
2. abertura direta via `file://`.

Ambas foram bloqueadas pela política do ambiente com:

`net::ERR_BLOCKED_BY_ADMINISTRATOR`

Portanto a v0.34 **não é marcada como visualmente validada em navegador real** neste ambiente.

Após publicação no GitHub Pages, recomenda-se verificar especialmente:

- busca/filtro de presets;
- edição/duplicação;
- ocultação de categorias;
- auto-layout próximo às bordas;
- comportamento com zoom;
- preview Atual × Sessão;
- importação após preview;
- exportação PNG/HTML;
- interação touch em celular.
