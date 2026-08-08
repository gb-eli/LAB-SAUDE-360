# Validação v0.33.0

## Executado

- sintaxe de todos os JavaScripts com `node --check`;
- parse de todos os JSONs;
- resolução de imports relativos;
- referências do catálogo;
- referências de atividades e jornadas;
- referências de assets;
- validação dos 246 GLBs;
- equivalência semântica das estruturas do Comparador em ECO/MEDIUM/HIGH;
- testes unitários Node dos managers semânticos, pacotes, estilos, presets, compatibilidade e histórico;
- smoke HTTP dos recursos centrais;
- integridade do ZIP completo e patch;
- comparação SHA-256 entre v0.32.0 e v0.33.0.

## QA de navegador

Foi tentado QA com Chromium + Playwright local.

O ambiente de execução bloqueou navegação para o servidor `127.0.0.1` com:

`net::ERR_BLOCKED_BY_ADMINISTRATOR`

Portanto a v0.33 **não é marcada como visualmente validada em navegador real** neste ambiente.

A presença de Chromium/Playwright foi confirmada, mas a política de rede local impediu abrir a aplicação servida localmente.

## O que isso significa

A validação estrutural e HTTP é válida.

Permanece recomendado, após publicar no GitHub Pages, verificar em dispositivo real:

- arraste das etiquetas;
- auto-layout;
- toque em celular;
- cores/ícones;
- importação de sessão;
- painel de compatibilidade;
- WebGL;
- exportação PNG/HTML.
