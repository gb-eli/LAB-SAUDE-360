# v0.10.0 — Modo Professor, atividades e progresso

## Novos serviços

### ActivityManager
Carrega o catálogo de roteiros, interpreta códigos de atividade, salva atividade ativa e checkpoints.

### AssessmentManager
Corrige avaliações simples, salva tentativas locais e recupera melhor resultado.

### ProgressManager
Passa a registrar acessos, encerramentos e conclusões de módulos.

## Modo Professor

O painel global não pertence a nenhum laboratório específico.

Isso evita duplicar ferramentas de aula dentro de cada módulo.

## Códigos

Os códigos são definidos em `data/activities.json`.

Como não há backend, são códigos pedagógicos estáticos e portáveis entre dispositivos que estejam usando a mesma versão da plataforma.
