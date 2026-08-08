# Contrato interno — API 1

O módulo recebe:

- `context.manifest`
- `context.host`
- `context.events`
- `context.graphics`
- `context.storage`
- `context.performance`
- `context.assets`
- `context.progress`

O método `destroy()` deve limpar DOM, listeners, timers, áudio e, futuramente, recursos GPU.
