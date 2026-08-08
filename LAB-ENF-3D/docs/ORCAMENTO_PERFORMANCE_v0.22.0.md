# Orçamento de Performance — v0.22.0

## Base medida

Os números abaixo são calculados diretamente sobre os GLBs presentes no pacote.

- GLBs: 288
- tamanho somado: aproximadamente 5,41 MB
- faces somadas: 495.168
- módulos registrados: 35
- módulos com GLB no orçamento HIGH: 34

## Limites internos atuais

### Leve
- maior asset ≤ 250 KB
- e ≤ 12.000 faces.

### Moderado
- maior asset ≤ 700 KB
- e ≤ 40.000 faces.

### Alto
- acima desses limites.

Esses limites são heurísticos do projeto, não especificações universais de WebGL.

## Maiores assets HIGH

1. Olho/Ouvido — ~98,2 KB / 7.200 faces
2. Sistema Digestório — ~84,0 KB / 10.960 faces
3. Articulações — ~64,0 KB / 4.480 faces no maior asset
4. Respiratório — ~61,3 KB / 9.064 faces
5. Paciente G3 — ~60,0 KB / 5.768 faces
6. Sinais Vitais G3 — ~60,0 KB / 5.768 faces
7. Coração — ~56,4 KB / 7.308 faces
8. Esqueleto — ~55,9 KB / 7.136 faces
9. Corpo Humano — ~55,8 KB / 6.400 faces no maior asset
10. Gestação — ~51,3 KB / 6.432 faces no maior asset

## Conclusão

Todos os módulos HIGH permanecem na faixa interna `leve`.

Isso não significa que qualquer dispositivo executará tudo a 60 FPS. A carga final também depende de:
- DPR;
- quantidade de draw calls;
- materiais;
- transparência;
- animações;
- tamanho do canvas;
- memória disponível;
- navegador e GPU.

Por isso o projeto continua mantendo ECO/MEDIUM/HIGH/ULTRA e ajuste adaptativo.
