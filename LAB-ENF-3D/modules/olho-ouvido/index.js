import { createSharedAnatomySystemModule } from "../../services/SharedAnatomySystemModule.js";

export default createSharedAnatomySystemModule({
  "materialSystem": "sensory",
  "title": "Olho e Ouvido G3",
  "badge": "OLHO + OUVIDO · G3",
  "description": "Estruturas visuais e auditivas básicas em um conjunto G3 regional compartilhado e comparável.",
  "note": "Modelo didático de orientação. Não realiza teste visual/auditivo, diagnóstico ou avaliação clínica.",
  "modelPath": "./modules/olho-ouvido/data/model.json",
  "contentPath": "./modules/olho-ouvido/data/content.json",
  "targetSize": 4.5,
  "cameraDistance": 6.4,
  "cameraTarget": [
    0,
    0,
    0.2
  ]
});
