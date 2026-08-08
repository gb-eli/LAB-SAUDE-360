import { createSharedAnatomySystemModule } from "../../services/SharedAnatomySystemModule.js";

export default createSharedAnatomySystemModule({
  "materialSystem": "headNeck",
  "title": "Cabeça e Pescoço G3",
  "badge": "CABEÇA E PESCOÇO · G3",
  "description": "Crânio, coluna cervical, via aérea, tireoide e linfonodo em um conjunto regional G3 compartilhado.",
  "note": "Representação regional simplificada para orientação anatômica. Não substitui atlas validado ou avaliação clínica.",
  "modelPath": "./modules/cabeca-pescoco/data/model.json",
  "contentPath": "./modules/cabeca-pescoco/data/content.json",
  "targetSize": 4.5,
  "cameraDistance": 6.4,
  "cameraTarget": [
    0,
    0,
    0.3
  ]
});
