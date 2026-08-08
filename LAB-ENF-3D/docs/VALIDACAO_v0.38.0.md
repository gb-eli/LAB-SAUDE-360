# Validação v0.38.0

## Validação estrutural

Foram executados:

- `node --check` em todos os JavaScripts;
- parse de todos os JSONs;
- resolução de imports relativos;
- catálogo de módulos;
- referências de estilos;
- atividades;
- jornadas;
- sequências de Demonstração;
- referências de assets;
- integridade dos GLBs;
- equivalência semântica dos sistemas usados pelo Comparador;
- auditoria de materiais nos controllers;
- orçamento estático de performance;
- smoke HTTP;
- ZIP completo;
- patch incremental.

## Chromium — standalone

A tela inicial standalone foi carregada no Chromium.

Confirmado:

- v0.38.0 exibida;
- 36 laboratórios;
- 6 experiências em destaque;
- botão Demonstração presente;
- painel Demonstração aberto;
- 3 sequências carregadas;
- sequência padrão `Tour Clínico`;
- 0 page errors;
- 0 console errors.

## ClinicalTourManager

Teste real no navegador:

- Tour iniciou;
- primeiro ponto foi selecionado;
- pointerdown pausou o Tour;
- interface mudou para `Retomar`;
- Retomar funcionou;
- Próximo funcionou;
- Anterior funcionou;
- evento `start` do OrbitControls pausou o Tour.

## ClinicalOverlayManager

Teste real no navegador:

- dois hotspots próximos formaram um cluster;
- cluster abriu 2 membros radialmente;
- membro radial pôde ser selecionado;
- marcador da câmera recebeu coordenadas;
- seleção atualizou a zona ativa no mini mapa.

## DemonstrationManager

Teste real no navegador com navegação controlada:

- primeira etapa aberta;
- Pausar;
- Próximo;
- Anterior;
- Cinema ligado/desligado;
- Encerrar.

## WebGL

A infraestrutura usada nesta auditoria continua sem garantia de acesso completo ao CDN externo do Three.js.

Portanto:

- o bootstrap standalone foi testado;
- os managers DOM foram testados no navegador;
- controllers 3D foram validados;
- GLBs foram analisados separadamente;
- não é afirmado QA visual WebGL completo de todos os módulos em dispositivo real.
