import { createSharedAnatomySystemModule } from "../../services/SharedAnatomySystemModule.js";

export default createSharedAnatomySystemModule({
  "materialSystem": "endocrine",
  "title": "Sistema Endócrino G3",
  "badge": "SISTEMA ENDÓCRINO · G3",
  "description": "Glândulas endócrinas distribuídas no corpo em um conjunto G3 compartilhado com o Corpo Humano.",
  "note": "Representação anatômica esquemática para estudo visual. Não é exame clínico, diagnóstico ou atlas anatômico validado.",
  "modelPath": "./modules/sistema-endocrino/data/model.json",
  "contentPath": "./modules/sistema-endocrino/data/content.json",
  "targetSize": 4.5,
  "cameraDistance": 6.6,
  "cameraTarget": [
    0,
    0,
    0.5
  ]
});
