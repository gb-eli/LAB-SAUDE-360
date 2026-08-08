# Modo Demonstração — v0.38.0

## Objetivo

Executar uma apresentação contínua entre laboratórios sem exigir troca manual de módulo.

## Arquivos

- `services/DemonstrationManager.js`
- `data/demonstration-sequences-v0.38.json`

## Sequências

### Tour Clínico
6 laboratórios.

### Anatomia Essencial
6 laboratórios.

### Materno-Infantil
4 laboratórios.

## Controles

- Iniciar;
- Pausar;
- Retomar;
- Anterior;
- Próximo;
- Encerrar;
- selecionar diretamente uma etapa.

## Cinema

Existe opção para manter o modo Cinema ativado durante a demonstração.

## Temporização

Cada entrada pode ter `dwellMs`.

Fallback:

`defaultDwellMs = 22000`

## Arquitetura

O manager chama o mesmo `openModule()` usado pela navegação normal.

Não existe uma segunda implementação dos laboratórios.
