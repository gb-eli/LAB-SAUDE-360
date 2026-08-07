# Atualizações modulares

## Primeira publicação
Envie todo o conteúdo deste pacote para a raiz do repositório.

## Atualizações seguintes
Não será necessário subir tudo novamente. Envie apenas arquivos novos ou alterados.

### Exemplo: mudou somente o visual
```text
ui/app.css
VERSION.txt
CHANGELOG.md
```

### Exemplo: melhoria de performance
```text
services/GraphicsManager.js
services/PerformanceManager.js
VERSION.txt
CHANGELOG.md
```

### Exemplo: adicionar Coração 3D
A atualização poderá conter somente:
```text
modules/anatomy-heart/
engines/three/
services/AssetManager.js
data/modules.json
VERSION.txt
CHANGELOG.md
```

### Regra
- não apagar módulos anteriores;
- não substituir assets que não mudaram;
- manter caminhos das pastas;
- atualizar `data/modules.json` quando entrar módulo novo;
- atualizar `VERSION.txt` e `CHANGELOG.md`;
- correção pequena: v0.1.1, v0.1.2...
- novo marco/módulo: v0.2.0, v0.3.0...
