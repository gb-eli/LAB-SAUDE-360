# Biblioteca de Coleções — v0.31.0

## Extensão do CatalogLibraryManager

O mesmo serviço que gerencia favoritos/recentes de laboratórios passou a controlar coleções.

## Persistência

### Favoritos
`catalog:collectionFavorites`

### Recentes
`catalog:collectionRecent`

## Limites

Recentes:
6 coleções.

## Interface

Cada card de coleção recebe estrela:

- ☆ não favorita;
- ★ favorita.

Acima da grade aparecem dois grupos:

- Coleções favoritas;
- Coleções recentes.

Os itens rápidos também abrem a coleção e atualizam o histórico.

## Independência

Favoritar uma coleção não favorita automaticamente os laboratórios contidos nela.

Os dois recursos permanecem independentes.
