# QA Runtime — v0.24.0

## Testes estruturais

A validação inclui:
- sintaxe de todos os JS;
- parse de todos os JSON;
- referências de módulos;
- atividades e jornadas;
- imports relativos;
- referências de assets;
- leitura de todos os GLBs;
- equivalência dos hotspots principais;
- auditoria de AsyncLoadGuard;
- auditoria de substituição de materiais;
- integridade dos ZIPs.

## HTTP local

Também é executado um servidor HTTP local durante a validação final para solicitar:
- index.html;
- app/version.js;
- catálogo;
- orçamento;
- módulos modificados;
- serviços modificados;
- GLBs selecionados.

## Navegador headless

Foi preparada uma tentativa de QA com Chromium/Playwright.

O runtime desta sessão bloqueia navegação local do Chromium com `ERR_BLOCKED_BY_ADMINISTRATOR`, inclusive para `localhost` e `file://`.

Portanto, esta versão não afirma inspeção visual WebGL real em navegador.

O bloqueio é do ambiente de execução da sessão, não uma falha detectada na aplicação.
