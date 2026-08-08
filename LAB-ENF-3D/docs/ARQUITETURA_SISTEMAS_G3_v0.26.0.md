# Arquitetura dos Sistemas G3 — v0.26.0

## Regra

Um sistema anatômico G3 deve possuir um único conjunto de variants.

Esse conjunto pode ser consumido por:
- laboratório dedicado;
- Corpo Humano;
- futuras jornadas;
- futuras ferramentas de comparação.

## Sistemas compartilhados

### Respiratório
Consumidores:
- `respiratorio`;
- `corpo-humano`.

### Urinário
Consumidores:
- `sistema-urinario`;
- `corpo-humano`.

### Digestório
Consumidores:
- `sistema-digestorio`;
- `corpo-humano`.

### Nervoso
Consumidores:
- `sistema-nervoso`;
- `corpo-humano`.

Essa arquitetura se soma aos compartilhamentos de:
- Esqueleto;
- Cardiovascular.

## Equivalência entre LODs

A geometria pode simplificar, mas estruturas usadas pelo conteúdo devem permanecer semanticamente disponíveis.

Quando necessário, LOW/MEDIUM recebem proxies simples com o mesmo nome semântico.

Assim:
- roteiro não muda com o perfil gráfico;
- raycasting mantém IDs;
- ECO continua funcional;
- HIGH acrescenta detalhe, não funcionalidade obrigatória.

## Shared tools

`anatomy-g3-manifest.json` também registra:
- AnatomyPresentationPreset;
- AnatomyMaterialPreset;
- AnatomyIsolationManager;
- AnatomyFallbackRenderer.
