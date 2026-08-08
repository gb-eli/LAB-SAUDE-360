# Auditoria de Acessibilidade e Responsividade — v0.21.0

## Escopo
Auditoria estrutural dos 34 módulos registrados no catálogo e da infraestrutura compartilhada.

## Melhorias aplicadas

### Canvas 3D
Antes, o canvas era principalmente orientado a mouse/touch.

Agora:
- possui `tabIndex=0`;
- possui descrição acessível;
- aceita rotação por teclado;
- aceita zoom por teclado.

### Carregamento
O host usa `aria-busy` enquanto há assets 3D ativos.

O indicador usa:
- `role=status`;
- `aria-live=polite`;
- `aria-atomic=true`.

### Foco
Foi criado foco visível global para:
- botões;
- selects;
- inputs;
- elementos com tabindex.

### Touch/mobile
Em telas abaixo de 680 px:
- botões dentro do laboratório têm mínimo de 44 px;
- sliders possuem área vertical mínima de 44 px;
- painéis deixam de impor altura máxima.

### Movimento
`prefers-reduced-motion` reduz animações e transições no conteúdo dos módulos.

## Limites da auditoria
Esta auditoria é estrutural e de código.

Ela não substitui teste manual com:
- leitor de tela real;
- VoiceOver/TalkBack/NVDA;
- navegação completa somente por teclado em navegador;
- inspeção visual em múltiplos aparelhos físicos.

Esses testes continuam recomendados antes de uma publicação institucional definitiva.
