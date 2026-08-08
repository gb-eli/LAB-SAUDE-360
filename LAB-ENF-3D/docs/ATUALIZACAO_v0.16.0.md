# v0.16.0 — Sistema Locomotor, Reprodutor, Materiais e Mobile

Foram adicionados cinco laboratórios:
- Sistema Muscular;
- Sistema Reprodutor;
- Articulações;
- Mão e Pé;
- Materiais Hospitalares.

Foram criados 39 novos GLBs em perfis LOW/MEDIUM/HIGH.

## Performance

O ThreeEngine passa a controlar o estado desejado de execução separadamente do estado de visibilidade.

Quando o documento fica oculto:
- o animation loop é interrompido;
- a intenção de execução é preservada.

Quando volta a ficar visível:
- o loop só retorna se o módulo continuava solicitado como ativo.

Também foram adicionados listeners de perda/restauração de contexto WebGL e calibração para telas touch.

A interface permanece unificada e não possui modos separados por papel.
