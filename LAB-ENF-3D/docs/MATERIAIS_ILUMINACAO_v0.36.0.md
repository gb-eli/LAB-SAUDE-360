# Materiais e Iluminação — v0.36.0

## ClinicalMaterialManager

Materiais físicos compartilhados reduzem duplicação entre ambientes.

Telas:
- roughness menor;
- clearcoat maior;
- emissive sutil.

Metal:
- metalness elevado;
- roughness baixa/moderada.

Pisos e paredes:
- resposta mais fosca.

Leitos e superfícies:
- resposta intermediária.

## ClinicalScenePreset

Cada ambiente pode informar um mood.

- clinical: hospital;
- urgent: UPA;
- primary: UBS;
- maternity: maternidade;
- safety: biossegurança;
- sterile: CME.

A iluminação continua adaptativa ao perfil gráfico.

## Anatomia

Os sistemas anatômicos agora variam roughness/clearcoat/specular conforme o tipo de tecido, sem alterar geometria.
