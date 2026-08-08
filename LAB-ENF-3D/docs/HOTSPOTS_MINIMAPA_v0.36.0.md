# Hotspots e Mini Mapa — v0.36.0

## ClinicalOverlayManager

Responsabilidades:
- projetar centros de meshes para coordenadas da tela;
- criar hotspots DOM;
- atualizar posições com limite de frequência;
- manter estado selecionado;
- desenhar referência espacial simplificada;
- permitir ligar/desligar pontos e mapa.

## Desempenho

A atualização visual é limitada a aproximadamente 12 atualizações por segundo.

O WebGL continua renderizando em seu ciclo normal; o overlay DOM não precisa atualizar a cada frame.

## Mini mapa

As posições são normalizadas a partir dos centros X/Y dos objetos selecionáveis da cena.

Não existe tentativa de representar paredes, escala arquitetônica ou circulação real.

## Biossegurança

Somente itens já encontrados são enviados ao overlay.
Isso evita que a interface revele previamente os riscos da atividade.
