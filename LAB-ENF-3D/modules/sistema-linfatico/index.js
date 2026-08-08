import { createSharedAnatomySystemModule } from "../../services/SharedAnatomySystemModule.js";

export default createSharedAnatomySystemModule({
  "materialSystem": "lymphatic",
  "title": "Sistema Linfático G3",
  "badge": "SISTEMA LINFÁTICO · G3",
  "description": "Ducto torácico, cadeias de linfonodos e baço em um mapa corporal G3 compartilhado com o Corpo Humano.",
  "note": "Representação simplificada para orientação espacial. Não substitui avaliação clínica, imagem diagnóstica ou atlas validado.",
  "modelPath": "./modules/sistema-linfatico/data/model.json",
  "contentPath": "./modules/sistema-linfatico/data/content.json",
  "targetSize": 4.6,
  "cameraDistance": 6.8,
  "cameraTarget": [
    0,
    0,
    0.3
  ]
});
