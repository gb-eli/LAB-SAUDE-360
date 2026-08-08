# Validação v0.36.0

## Estrutural

Executado:
- `node --check` em todos os JavaScripts;
- parse de todos os JSONs;
- imports relativos;
- catálogo;
- atividades;
- jornadas;
- referências de assets;
- 246 GLBs;
- contagem de faces;
- orçamento de performance;
- ausência de atribuições diretas de `.material =` nos controllers dos módulos.

## Resultado

- 90 JavaScripts;
- 100 JSONs;
- 0 erros de sintaxe;
- 0 imports ausentes;
- 0 assets ausentes;
- 36 módulos;
- 43 atividades;
- 29 jornadas;
- 246 GLBs;
- 399.712 faces.

## Smoke do standalone no Chromium

Confirmado:

- versão `v0.36.0`;
- 36 cards de laboratório;
- 6 experiências em destaque;
- card em destaque do Hospital abre a tela do módulo;
- título do Hospital atualizado corretamente;
- Sandbox Técnico chega ao estado `ativo`;
- Guia abre corretamente;
- 0 page errors;
- 0 console errors.

## ClinicalOverlayManager

O manager real foi importado em um navegador e executado com uma cena matemática controlada.

Confirmado:

- 2 hotspots criados;
- 2 pontos no mini mapa;
- seleção por hotspot;
- estado selecionado;
- ocultar/exibir hotspots;
- ocultar/exibir mini mapa;
- cleanup.

## Limitação WebGL

A infraestrutura de teste ainda não garante que o CDN externo do Three.js conclua o carregamento.

Por isso o teste de interface, módulos locais e overlay foi executado no Chromium, mas não é feita afirmação de QA visual WebGL completo dos seis ambientes clínicos nesta infraestrutura.

A estrutura dos GLBs e os controllers foram validados separadamente.
