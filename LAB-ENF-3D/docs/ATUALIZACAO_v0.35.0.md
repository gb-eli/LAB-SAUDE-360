# v0.35.0 — Polimento Visual e Experiências Imersivas

## Home
- novo hero visual;
- indicadores de laboratórios/modelos/jornadas;
- experiências em destaque;
- cards com identidade visual por contexto;
- melhor hierarquia, profundidade e responsividade.

## Experiência global
Novo `ImmersiveExperienceManager.js`.

Em qualquer laboratório:
- Guia;
- Cinema;
- Foco.

Guias específicos foram preparados para experiências centrais e existe fallback genérico para os demais módulos.

## Cinema
Oculta a navegação externa e maximiza o laboratório.

## Foco
Oculta painéis laterais sem perder estado, priorizando a cena.

## Guias
Passos visuais flutuantes podem destacar a área relevante da interface.

## Foco automático em ambientes
Novo `SceneFocusManager.js`.

Integrado em:
- Hospital 3D;
- UPA;
- UBS;
- Maternidade;
- Biossegurança;
- CME.

Ao selecionar um objeto/estação, a câmera aproxima suavemente preservando OrbitControls.

## Performance
Nenhum GLB novo foi adicionado.

Mantidos:
- 246 GLBs;
- 399.712 faces.

## Jornada
`ENF-JORNADA-28 — Tour Imersivo de Enfermagem`

## Atividade
`ENF-EXP-01 — Experiência Imersiva`
