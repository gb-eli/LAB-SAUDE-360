# Como adicionar um módulo

1. Crie `modules/nome-do-modulo/`.
2. Adicione um `index.js` com `mount`, `start`, `pause`, `reset` e `destroy`.
3. Registre o módulo em `data/modules.json`.
4. Coloque assets exclusivos dentro da pasta do módulo.
5. Use os serviços recebidos em `context`; não acesse outro módulo diretamente.
