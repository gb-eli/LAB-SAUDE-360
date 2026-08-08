# Validação v0.37.0

## Estrutural

A versão foi submetida a:
- `node --check` de todos os JavaScripts;
- parse de todos os JSONs;
- resolução de imports relativos;
- catálogo, atividades e jornadas;
- referências de assets;
- auditoria de controllers;
- validação dos GLBs;
- equivalência semântica dos modelos usados pelo Comparador;
- orçamento de performance;
- HTTP smoke;
- integridade do ZIP completo;
- integridade do patch.

## Browser smoke — standalone

Chromium confirmou:
- v0.37.0 carregada;
- 36 laboratórios;
- 6 experiências em destaque;
- card em destaque do Hospital abre o módulo;
- Sandbox Técnico ativo;
- Guia aberto;
- 0 page errors;
- 0 console errors.

## ClinicalOverlayManager

Teste real do manager no navegador:

- 3 pontos simulados;
- dois próximos formaram 1 cluster;
- cluster exibiu quantidade `2`;
- 2 zonas na legenda;
- trilha ordenada criada;
- clicar em uma zona selecionou o ponto correspondente;
- clicar no cluster abriu um dos membros.

## ClinicalTourManager

Teste real no navegador:

- primeiro passo selecionado;
- segundo passo selecionado;
- status `2/2 · Segundo`;
- play ativo;
- pause funcionando;
- cleanup concluído.

## Limitação WebGL

O ambiente de execução usado para a auditoria continua sem garantia de carregamento completo do Three.js externo via CDN.

Por isso:
- a interface standalone e os managers DOM foram testados no Chromium;
- os GLBs foram validados separadamente;
- os controllers 3D passaram por validação estática;
- não é afirmado QA visual WebGL completo em dispositivo real para todos os módulos.
