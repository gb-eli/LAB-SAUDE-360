# Ficha HTML a partir do Histórico — v0.32.0

## Histórico

O histórico continua usando IndexedDB e armazena o PNG como Blob.

## Novo fluxo

Cada card oferece:

- PNG;
- Ficha HTML;
- Excluir.

## Ficha histórica

A ficha usa:
- o Blob já armazenado;
- metadados da captura;
- anotação;
- marcadores;
- A/B;
- modo;
- perfil.

Capturas antigas continuam utilizáveis com fallback dos campos que não existiam em versões anteriores.

## Benefício

Uma captura pode ser transformada em ficha posteriormente, mesmo depois que a comparação atual já mudou.
