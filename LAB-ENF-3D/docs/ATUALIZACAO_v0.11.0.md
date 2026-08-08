# v0.11.0 — Modo Aluno, jornadas e evidência

## StudentSessionManager

Registra uma sessão local de aula sem conta ou servidor.

## GuidedJourneyManager

Permite encadear vários laboratórios em uma única sequência pedagógica.

## EvidenceManager

Gera evidência local em:

- HTML imprimível;
- JSON estruturado.

## AccessibilityManager

Controla:

- redução de movimento;
- alto contraste;
- ampliação de texto;
- modo projetor.

## Princípio arquitetural

As jornadas coordenam módulos externos, mas os módulos não conhecem as jornadas.

Isso mantém baixo acoplamento e permite reorganizar roteiros sem alterar os laboratórios.
