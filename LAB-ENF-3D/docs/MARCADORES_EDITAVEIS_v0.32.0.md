# Marcadores Editáveis — v0.32.0

## Ciclo de vida

Um marcador possui:
- id;
- texto;
- categoria;
- lado;
- systemId;
- objectName;
- localPoint;
- normalizedPoint;
- createdAt;
- updatedAt.

## Edição

O botão `✎` abre o editor.

É possível alterar:
- texto;
- categoria.

O ID e a âncora permanecem.

## Reposicionamento

`Reposicionar` mantém o ID e espera um novo clique na cena.

O novo raycast atualiza:
- lado;
- sistema;
- mesh;
- ponto local;
- ponto normalizado.

## Categorias

As categorias são declarativas e não estão presas ao controller.

Arquivo:
`marker-categories.json`

## Linhas-guia

Cada etiqueta possui:
- ponto;
- linha;
- caixa de texto.

A linha pode ser ocultada.

No PNG, a linha também respeita a configuração atual.

## LOD

A posição normalizada no bounding box continua sendo usada para reconstrução proporcional em outra geometria com o mesmo mesh id.
