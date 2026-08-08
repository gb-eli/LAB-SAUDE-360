# Pacote Local de Anotações — v0.32.0

## Objetivo

Permitir guardar e transportar um estado didático do Comparador sem backend.

## Serviço

`ComparisonWorkspacePackageManager`

## Formato

JSON UTF-8.

## Schema

`lab-enfermagem-comparison-workspace`

## Conteúdo

- appVersion;
- exportedAt;
- annotation;
- exportName;
- markers;
- state.

### State
- systemA;
- structureA;
- systemB;
- structureB;
- mode;
- opacityA;
- opacityB;
- semanticSync;
- markerLines.

## Importação

O arquivo é validado antes da aplicação.

Sistemas/estruturas que não existem no catálogo atual não substituem a seleção válida.

Os marcadores passam novamente pelo normalizador do MarkerManager.

## Privacidade

O JSON é criado e lido localmente.

Não há envio automático para servidor.
