# Busca e Navegação — v0.28.0

## Problema

Com 36 laboratórios, navegar apenas pela grade e pelo nome do módulo já não é suficiente.

## Índice estático

`data/search-index-v0.28.json`

Contém termos e estruturas por módulo.

O arquivo é produzido junto da versão e não exige servidor ou banco de dados.

## Busca

`CatalogSearchManager` combina:
- catálogo;
- atividades;
- índice estrutural.

A normalização:
- remove acentos;
- converte para minúsculas;
- ignora pontuação;
- exige todos os tokens digitados.

## Correspondências estruturais

Quando possível, o card mostra:
`Encontrado em: ...`

Isso permite entender por que o laboratório apareceu.

## Filtros

### Área
Categorias reais do catálogo.

### Geração
G3, G2, SIM e outras gerações presentes.

### Ordenação
- ordem do catálogo;
- nome A–Z;
- área + nome.

## Hub de áreas

Agora é dinâmico.

Uma categoria nova adicionada ao catálogo passa a aparecer sem editar manualmente a função.

## Corpo Humano

Possui busca local para:
- identificar estrutura;
- descobrir a camada;
- carregar sob demanda;
- selecionar o objeto.
