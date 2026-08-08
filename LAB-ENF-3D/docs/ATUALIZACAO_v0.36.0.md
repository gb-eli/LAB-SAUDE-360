# v0.36.0 — Realismo Clínico, Hotspots e Mini Mapa

## Materiais clínicos
Novo `ClinicalMaterialManager.js`.

O serviço usa `MeshPhysicalMaterial` e classifica elementos por função visual:
- piso;
- paredes;
- telas/monitores;
- metal;
- plástico;
- mobiliário;
- superfícies de leito.

Perfis visuais:
- clinical;
- urgent;
- primary;
- maternity;
- safety;
- sterile.

## Iluminação
`ClinicalScenePreset` ganhou atmosferas específicas para:
- Hospital;
- UPA;
- UBS;
- Maternidade;
- Biossegurança;
- CME.

Perfis High/Ultra podem receber luz de tarefa adicional.

## Hotspots
Novo `ClinicalOverlayManager.js`.

Hotspots:
- acompanham a projeção 3D;
- permanecem clicáveis;
- destacam o item selecionado;
- podem ser ocultados.

## Mini mapa
O mesmo manager cria um mini mapa 2D simplificado usando a distribuição X/Y dos objetos no ambiente.

O mini mapa:
- não é planta técnica;
- serve apenas como referência espacial;
- permite selecionar pontos.

## Biossegurança
Riscos não descobertos não aparecem em hotspot nem mini mapa.
Após serem identificados, tornam-se referências de revisão.

## Anatomia
`AnatomyMaterialPreset` ganhou perfis de superfície por sistema:
- osso mais fosco;
- cardiovascular mais úmido/brilhante;
- tecidos moles com resposta especular moderada;
- cartilagem e estruturas sensoriais com resposta diferenciada.

## Transições
A entrada e saída dos módulos agora possui animação curta, respeitando `reduced-motion`.

## Assets
Nenhum GLB novo:
- 246 GLBs;
- 399.712 faces.
