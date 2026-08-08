# Experiências Imersivas — v0.35.0

## Objetivo
Aumentar o valor visual da plataforma sem criar uma arquitetura pesada ou separar perfis de usuário.

## ImmersiveExperienceManager
Responsável por:
- identidade visual do card;
- experiências em destaque;
- Guia;
- Cinema;
- Foco;
- destaque do passo atual;
- persistência local da conclusão do guia.

## SceneFocusManager
Calcula o bounding box do objeto selecionado, centro e raio aproximado.

A câmera é movida suavemente na direção atual, com distância limitada para não atravessar a geometria.

Respeita `reduced-motion`.

## Projetor
Cinema e guias usam controles maiores no modo projetor.

## Mobile
A home e as experiências em destaque passam para uma coluna.
A toolbar de experiência ocupa largura disponível.
