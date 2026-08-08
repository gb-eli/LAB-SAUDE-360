# Exportação Anotada — v0.30.0

## Pipeline

1. ThreeEngine renderiza a cena.
2. Um canvas 2D auxiliar é criado.
3. O canvas WebGL é desenhado na área central.
4. Cabeçalho A/B é renderizado.
5. Rodapé recebe modo, perfil e horário.
6. Anotação local é incorporada.
7. O canvas final gera PNG.
8. O mesmo Blob é baixado e salvo no IndexedDB.

## Legenda

A:
referência verde.

B:
referência rosada.

## Anotação

Máximo:
420 caracteres.

Armazenamento do rascunho:
localStorage através do `StorageManager`.

Armazenamento da captura:
IndexedDB através do `ComparisonHistoryManager`.

## Privacidade

Nenhuma imagem ou anotação é enviada pela plataforma.
