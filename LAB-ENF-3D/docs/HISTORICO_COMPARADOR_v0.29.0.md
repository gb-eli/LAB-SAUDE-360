# Histórico Local do Comparador — v0.29.0

## Armazenamento

IndexedDB.

Banco:
`lab-enfermagem-comparison-history`

Store:
`captures`

## Conteúdo

Cada registro contém:
- id;
- createdAt;
- Blob PNG;
- metadata.

Metadata:
- nome do arquivo;
- descrição A × B;
- sistemas;
- estruturas;
- modo;
- opacidades;
- perfil interno.

## Limite

Máximo:
8 itens.

Itens mais antigos são removidos automaticamente.

## Privacidade

O histórico é local.

Não há upload automático.

A limpeza pode ser feita pelo próprio laboratório.

## Fallback

Se IndexedDB estiver indisponível:
- o download PNG ainda pode funcionar;
- o histórico é tratado como indisponível.
