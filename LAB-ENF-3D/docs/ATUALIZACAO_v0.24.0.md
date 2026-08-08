# v0.24.0 — Pele Otimizada, Equipamentos G2 e Pivôs Articulares

## Pele
- HIGH: 41 → 15 geometrias/draw calls estimados;
- MEDIUM: 27 → 13;
- LOW: 7 → 5;
- 4.084 faces HIGH preservadas;
- hotspots semânticos principais preservados.

## Equipamentos
- 21 novos GLBs G2;
- 7 equipamentos;
- IDs semânticos preservados;
- G1 antigo removido quando sem referência.

## Materiais
- 18 novos GLBs G2;
- 6 materiais;
- detalhes visuais adicionais;
- G1 antigo removido quando sem referência.

## Esqueleto
- `JointController.registerPivot()`;
- cotovelos E/D;
- joelhos E/D;
- movimento em torno das referências articulares.

## Corpo Humano
- reset sem forçar lazy-load de órgãos;
- opacidades e visibilidade padrão restauradas;
- `LayeredModelManager` protegido contra recargas concorrentes.

## Preload
- warm-up leve de até dois Favoritos/Recentes;
- somente JS/CSS;
- sem GLB automático;
- respeita economia de dados/conexões lentas.

## Performance
- 303 GLBs;
- ~5,91 MB;
- 527.016 faces;
- todos os módulos HIGH com GLB na faixa `leve`.

## Jornada
- `ENF-JORNADA-17`.
