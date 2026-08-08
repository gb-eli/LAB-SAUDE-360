# v0.26.0 — Sistemas G3 Compartilhados

## Arquitetura
O Corpo Humano agora reutiliza diretamente os assets dos laboratórios:
- Respiratório;
- Urinário;
- Digestório;
- Nervoso.

## Equivalência semântica
- Respiratório: 10/10 em LOW/MEDIUM/HIGH;
- Urinário: 9/9;
- Digestório: 10/10;
- Nervoso: 8/8.

Relatório:
`data/semantic-equivalence-v0.26.json`

## Novos recursos compartilhados
- `AnatomyMaterialPreset.js`;
- `AnatomyIsolationManager.js`;
- `AnatomyFallbackRenderer.js`.

## Corte e isolamento
Disponíveis nos quatro laboratórios e no Corpo Humano.

## Corpo Humano
Novas camadas:
- urinary;
- digestive;
- nervous.

Respiratory agora aponta para o mesmo asset do laboratório dedicado.

## Fallback
Fallback 2D/SVG para falha de WebGL nos módulos atualizados.

## Limpeza
15 GLBs antigos removidos.

## Performance
- 282 GLBs;
- ~5,48 MB;
- 480.572 faces;
- 34/34 módulos HIGH com GLB na faixa leve.

## Jornada
- `ENF-JORNADA-19`.
