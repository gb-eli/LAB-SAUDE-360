# Ficha Comparativa HTML — v0.31.0

## Serviço

`ComparisonReportManager`

## Objetivo

Gerar um registro local que possa ser:
- aberto offline;
- salvo;
- anexado em outro sistema;
- projetado posteriormente.

## Conteúdo

A ficha contém:
- título;
- A e B;
- imagem PNG incorporada;
- modo;
- perfil;
- data/hora;
- sincronização;
- anotação;
- marcadores;
- aviso pedagógico.

## Arquivo autocontido

O PNG é convertido para Data URL e incluído no próprio HTML.

Não existem referências externas obrigatórias.

## Nome personalizado

O mesmo nome-base pode gerar:
- `.png`;
- `.html`.

Extensões digitadas manualmente são removidas antes da geração para evitar nomes como `.png.png`.

## Privacidade

Todo o processo ocorre no navegador.
