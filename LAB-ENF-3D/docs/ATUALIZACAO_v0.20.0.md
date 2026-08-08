# v0.20.0 — G3 Regional e AsyncLoadGuard Global

## G3
Foram adicionados 18 novos GLBs:
- 6 do Sistema Reprodutor;
- 9 de Articulações;
- 3 de Mão/Pé.

## Robustez
O `AsyncLoadGuard` foi expandido para todos os 31 módulos que atualmente carregam GLB.

Cargas antigas agora são descartadas quando:
- uma nova carga é solicitada;
- o perfil gráfico muda novamente;
- o usuário muda de modelo;
- o módulo é destruído.

## Ambientes
O `ClinicalScenePreset` foi refinado e também aplicado a CME e Biossegurança.

## Jornada
Adicionada `ENF-JORNADA-13`.
