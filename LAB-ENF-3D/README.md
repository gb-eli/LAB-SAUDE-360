# Laboratório Virtual de Enfermagem — v0.38.0

Plataforma educacional 100% front-end para Técnico em Enfermagem.

A plataforma mantém uma interface única: não existe separação entre professor e aluno.

## v0.38.0 — Rota Suave + Tour Inteligente + Mini Mapa Vivo + Demonstração

### Tour inteligente

O `ClinicalTourManager` agora pausa automaticamente quando detecta interação manual com a cena.

Eventos tratados:
- pointer/touch;
- roda do mouse;
- teclado sobre a cena;
- início de interação do OrbitControls.

Quando isso acontece:
- o avanço automático para;
- o ponto atual permanece;
- o botão passa de `Pausar` para `Retomar`.

Também entrou:
- Anterior;
- Próximo;
- Play/Pause;
- status do ponto atual.

No modo Projetor, o intervalo mínimo continua sendo maior.

### Rota suave

`SceneFocusManager` ganhou uma trajetória suavizada com pequeno arco vertical.

A câmera:
1. parte da posição atual;
2. interpola até o novo ponto;
3. sobe levemente durante a transição;
4. reduz o movimento ao chegar;
5. mantém o alvo sincronizado.

Isso diminui a sensação de “teleporte” entre setores e estruturas.

`reduced-motion` continua desativando a animação.

## Cluster radial

Na v0.37 pontos próximos eram reunidos em um cluster.

Na v0.38 tocar nesse cluster abre seus membros radialmente ao redor do grupo.

Assim é possível escolher exatamente o ponto desejado sem poluir a cena permanentemente.

## Mini mapa vivo

O mini mapa agora apresenta:

- pontos do ambiente;
- zonas;
- zona ativa;
- trilha de fluxo quando existe ordem;
- marcador aproximado da câmera.

O marcador usa o `target` do OrbitControls como referência.

Importante:
não representa localização arquitetônica precisa nem planta técnica.

## Modo Demonstração

Novo:

`services/DemonstrationManager.js`

A plataforma pode percorrer vários laboratórios em sequência automaticamente.

Sequências prontas:

### Tour Clínico
- Hospital;
- UPA;
- UBS;
- Maternidade;
- Biossegurança;
- CME.

### Anatomia Essencial
- Corpo Humano;
- Cardiovascular;
- Respiratório;
- Urinário;
- Digestório;
- Nervoso.

### Materno-Infantil
- Gestação;
- Maternidade;
- Recém-nascido;
- Ciclo de Vida.

Controles:
- Iniciar;
- Pausar/Retomar;
- Anterior;
- Próximo;
- Encerrar;
- abrir diretamente qualquer etapa;
- Cinema opcional.

Cada laboratório possui um tempo de apresentação configurável no JSON da sequência.

## Mobile paisagem

A interface em orientação horizontal de celular foi compactada:
- toolbar menor;
- mini mapa menor;
- controles do Tour reduzidos;
- guia protegido;
- maior área livre para a cena.

## Atividade e jornada

Nova atividade:

`ENF-EXP-04 — Tour Inteligente, Mini Mapa Vivo e Demonstração`

Nova jornada:

`ENF-JORNADA-31 — Tour Inteligente e Demonstração em Projetor`

## Estado técnico

- 36 laboratórios;
- 45 atividades;
- 31 jornadas;
- 92 JavaScripts;
- 101 JSONs;
- 246 GLBs;
- 399.712 faces;
- ~4,83 MiB em GLBs;
- 2.555 termos de busca.

Nenhum GLB novo foi adicionado nesta fase.
