# Tour Inteligente — v0.38.0

## Pausa por interação

O Tour é interrompido quando o usuário interage manualmente com a cena.

Fontes:
- pointerdown;
- wheel;
- keydown;
- evento `start` do OrbitControls.

Cliques nos próprios controles do Tour não disparam essa pausa.

## Estado

Quando pausado pela interação:

`Pausado pela interação · 3/6 · Monitor`

O botão muda para:

`▶ Retomar`

## Concorrência

`busy` impede dois avanços simultâneos.

## Navegação manual

- Anterior;
- Próximo;
- Retomar.

## Projetor

O tempo mínimo por ponto segue sendo 5,6 segundos.

## Biossegurança

A lista do Tour continua sendo reconstruída somente com riscos já descobertos.
