# v0.22.0 — Paciente G3, Segurança G2 e Orçamento GPU

## Paciente/Sinais Vitais
- novo módulo Paciente G3;
- Paciente G3 reutilizado pelos Sinais Vitais;
- três LODs;
- animações de waveform respeitam visibilidade e redução de movimento.

## Biossegurança
- novos LOW/MEDIUM/HIGH;
- 6/6 riscos em todos os LODs;
- riscos inicialmente neutros;
- nomes só aparecem após identificação.

## CME
- ambiente G2 aprimorado;
- zonas e fluxo visualmente reforçados;
- nenhum parâmetro operacional clínico real adicionado.

## GPU
- `ThreeEngine.replaceMaterial()`;
- `ThreeEngine.disposeMaterial()`;
- 0 atribuições diretas de material nos módulos;
- 32/32 módulos GLB com AsyncLoadGuard.

## Performance
- `data/performance-budget.json`;
- `PerformanceBudgetManager.js`;
- orçamento apresentado no painel Diagnóstico.

## Catálogos
- busca e filtros dentro de Equipamentos;
- busca e filtros dentro de Materiais Hospitalares.

## Jornada
- `ENF-JORNADA-15`.
