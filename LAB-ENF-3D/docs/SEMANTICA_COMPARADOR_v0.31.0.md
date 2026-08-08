# Dicionário Semântico do Comparador — v0.31.0

## Grupos automáticos

`relation = equivalent`

Quantidade:
3.

- Crânio;
- Tireoide;
- Traqueia.

## Grupos explícitos

Quantidade:
12.

Tipos atuais:

### regional-reference
Uma estrutura completa é relacionada a uma referência regional.

### shared-organ-reference
Duas representações didáticas se referem ao mesmo órgão, mas não são consideradas geometricamente equivalentes.

### functional-reference
Estruturas diferentes possuem relação funcional útil à explicação.

## Sugestões múltiplas

Uma estrutura pode participar de mais de um grupo.

Exemplo:
`left_humerus`

participa de:
- úmero — ombro;
- úmero — cotovelo.

O manager retorna uma lista ordenada, e não apenas um único resultado.

Prioridade:
1. equivalente;
2. mesmo órgão;
3. referência regional;
4. relação funcional.

O sistema oposto atual recebe prioridade dentro do mesmo nível.
