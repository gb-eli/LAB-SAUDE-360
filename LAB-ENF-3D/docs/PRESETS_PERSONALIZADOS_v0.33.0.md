# Presets Personalizados — v0.33.0

## Serviço

`CustomComparisonPresetManager`

## Persistência

Chave local:

`comparison-custom-presets`

## Limite

20 presets.

## Conteúdo

Cada preset preserva:
- label;
- lesson;
- competency;
- seleção A/B;
- modo;
- opacidades;
- sincronização;
- linhas-guia.

Marcadores e anotação não fazem parte do preset.

Eles pertencem ao workspace/sessão.

## Exportação

Schema:

`lab-enfermagem-custom-comparison-presets`

Versão:
1.

## Importação

Presets importados são mesclados com os existentes pelo ID.

Isso permite transportar a biblioteca pessoal de comparações entre dispositivos.
