import { createSharedAnatomySystemModule } from "../../services/SharedAnatomySystemModule.js";

export default createSharedAnatomySystemModule({
  "materialSystem": "nervous",
  "title": "Sistema Nervoso G3",
  "badge": "SISTEMA NERVOSO · G3",
  "description": "Hemisférios, cerebelo, tronco encefálico, medula e nervos periféricos em um conjunto G3 compartilhado com o Corpo Humano.",
  "note": "Modelo esquemático para orientação anatômica. Não substitui avaliação neurológica, diagnóstico ou atlas validado.",
  "modelPath": "./modules/sistema-nervoso/data/model.json",
  "contentPath": "./modules/sistema-nervoso/data/content.json",
  "targetSize": 4.7,
  "cameraDistance": 6.8,
  "cameraTarget": [
    0,
    0,
    0.25
  ]
});
