# v0.34.1 — Hotfix de abertura local

## Problema identificado

O `index.html` utiliza ES Modules.

Em GitHub Pages isso funciona porque os arquivos são servidos por HTTP/HTTPS.

Ao abrir o arquivo diretamente:

`file:///.../index.html`

o navegador bloqueia o carregamento de módulos, JSONs e outros recursos locais por política de origem.

A validação anterior por HTTP não detectava esse caso de uso.

## Correção

Foi criado:

`index-standalone.html`

Esse arquivo incorpora a plataforma necessária para o modo local.

### JavaScript
Os módulos internos são transformados em módulos Blob e ligados por um import map gerado no próprio HTML.

### JSON
JSONs são incorporados em base64 e atendidos por um wrapper local de `fetch()`.

### GLB
Os 246 GLBs são incorporados no standalone e convertidos em Blob URLs sob demanda.

### CSS
O CSS geral é incorporado no HTML e CSSs de módulos usam um registro local.

### ModuleManager
Passou a aceitar:
- `__LAB_STANDALONE_MODULE__`;
- `__LAB_STANDALONE_STYLE__`.

### GLBAssetLoader
Passou a aceitar:
- `__LAB_STANDALONE_ASSET_URL__`.

### JourneyPreloadManager
O preload é desligado no standalone porque os dados já estão dentro do arquivo.

## index.html

O `index.html` normal continua sendo o ponto de entrada recomendado no GitHub Pages.

Quando aberto por `file://`, ele tenta redirecionar para:

`index-standalone.html`

## Dependência externa

Three.js permanece no CDN configurado.

Consequência:
- catálogo e dados estão incorporados;
- para abrir os ambientes 3D é necessário acesso à internet.

## Validação

O standalone foi injetado diretamente no Chromium para contornar o bloqueio administrativo do ambiente contra `file://` e `localhost`.

Resultado:
- 36 laboratórios renderizados no catálogo;
- versão v0.34.1 exibida;
- 0 erros de bootstrap;
- interface do Comparador carregada;
- 0 erros de JavaScript durante a inicialização local.

A renderização WebGL completa depende do Three.js externo e não pôde ser concluída no navegador deste ambiente por restrição de rede externa.
