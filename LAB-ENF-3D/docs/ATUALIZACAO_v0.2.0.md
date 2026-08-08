# Atualização v0.2.0

Esta versão inaugura os primeiros laboratórios gráficos utilizáveis.

## Mudança arquitetural importante

O `ModuleManager` agora suporta `styles` em `data/modules.json`.

Exemplo:

```json
{
  "entry": "./modules/anatomia/index.js",
  "styles": ["./modules/anatomia/module.css"]
}
```

Ao abrir o laboratório, seu CSS é carregado.
Ao sair, o CSS é removido.

Isso permite evoluir graficamente cada laboratório de maneira independente.
