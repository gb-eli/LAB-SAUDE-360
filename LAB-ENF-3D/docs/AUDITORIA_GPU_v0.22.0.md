# Auditoria de GPU e Ciclo de Vida — v0.22.0

## Objetivo

Reduzir risco de crescimento de memória GPU durante:
- troca de módulos;
- troca de LOD;
- troca de modelos internos;
- substituição de materiais;
- cargas assíncronas obsoletas.

## Materiais

Antes, vários módulos executavam diretamente:

`mesh.material = new THREE...`

Esse padrão perde a referência imediata do material importado.

Na v0.22 foi centralizado:

- `ThreeEngine.disposeMaterial(material)`;
- `ThreeEngine.replaceMaterial(mesh, material)`.

Resultado da inspeção estática:
- 0 atribuições diretas restantes de `*.material =` nos módulos;
- 33 módulos existentes migrados durante a auditoria;
- o novo Paciente G3 já foi criado usando o novo padrão.

## AsyncLoadGuard

Módulos que utilizam `GLBAssetLoader`: 32.

Cobertura:
- 32/32 com `loadGuard.begin()`;
- 32/32 invalidam a geração no `destroy()`.

Carga obsoleta é descartada antes de entrar na cena.

## ThreeEngine.destroy()

Continua responsável por:
- geometria;
- material atual;
- texturas;
- OrbitControls;
- renderer;
- contexto WebGL;
- canvas;
- listeners.

## Limitações

A auditoria é estrutural.

Não foi realizada captura real de:
- heap do navegador;
- memória GPU via ferramentas do driver;
- Chrome Performance/Memory;
- WebGL Inspector.

Esses testes devem ser feitos em navegador real antes de definir limites institucionais definitivos.
