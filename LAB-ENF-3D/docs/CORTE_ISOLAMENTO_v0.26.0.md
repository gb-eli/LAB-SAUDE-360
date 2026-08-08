# Corte e Isolamento Anatômico — v0.26.0

## AnatomyIsolationManager

Gerencia múltiplos roots 3D.

Pode registrar camadas carregadas depois da inicialização.

Isso é importante no Corpo Humano, que utiliza lazy-load.

## Isolamento

Ao selecionar uma estrutura:
- `structureId` é usado como chave;
- as outras geometrias ficam temporariamente ocultas;
- limpar o isolamento restaura a visibilidade anterior.

## Corte sagital

Utiliza clipping plane ao redor do eixo X central.

## Corte transversal

Utiliza clipping plane ao redor do eixo Z central.

## Limitações

O corte:
- não gera cap geometry;
- não reconstrói anatomia interna;
- não equivale a uma dissecação;
- não representa corte radiológico;
- é somente recurso gráfico de visualização espacial.

## Compatibilidade com lazy-load

Quando uma nova camada é carregada enquanto um corte ou isolamento está ativo, o manager aplica o estado corrente à nova camada.
