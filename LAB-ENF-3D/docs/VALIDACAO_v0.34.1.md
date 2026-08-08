# Validação v0.34.1

## Teste de inicialização standalone

Método:
- carregar todo o conteúdo de `index-standalone.html` diretamente no Chromium com `page.set_content()`;
- não utilizar `file://`;
- não utilizar servidor localhost.

Isso permite testar o bootstrap standalone apesar da política do ambiente.

Resultado:
- catálogo: 36 módulos;
- version label: `v0.34.1 · HOTFIX HTML LOCAL + GITHUB PAGES`;
- erros de página: 0;
- erros de console no bootstrap: 0.

## Comparador

A interface do Comparador foi criada corretamente no standalone:
- presets;
- seletores A/B;
- ferramentas de marcadores;
- biblioteca de presets.

## Limitação do ambiente

A importação do Three.js remoto não finaliza no Chromium desta infraestrutura.

Por isso a validação WebGL completa continua pendente de navegador/dispositivo com acesso normal ao CDN.

## Validações adicionais obrigatórias

Também foram executadas:
- `node --check`;
- JSON parse;
- imports relativos;
- catálogo;
- atividades;
- jornadas;
- referências de assets;
- GLBs;
- HTTP smoke da versão normal;
- integridade ZIP;
- integridade patch.


## Smoke funcional de módulo local

Também foi aberto o módulo:

`demo — Sandbox Técnico`

Resultado no HTML standalone:
- card encontrado;
- módulo aberto por Blob URL;
- CSS do módulo carregado pelo registro standalone;
- status final: `ativo`;
- conteúdo do módulo exibido;
- erros de página: 0;
- erros de console: 0.

Isso confirma o funcionamento do carregamento modular local sem servidor.

O Comparador também montou sua interface no standalone sem erros de console. Seu status permaneceu em `carregando` neste ambiente porque a biblioteca Three.js externa não finaliza devido à restrição de rede da infraestrutura.
