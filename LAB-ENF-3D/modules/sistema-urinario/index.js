import { createSharedAnatomySystemModule } from "../../services/SharedAnatomySystemModule.js";

export default createSharedAnatomySystemModule({
  "materialSystem": "urinary",
  "title": "Sistema Urinário G3",
  "badge": "SISTEMA URINÁRIO · G3",
  "description": "Rins, pelves renais, ureteres, bexiga e referências vasculares em um conjunto G3 compartilhado com o Corpo Humano.",
  "note": "Modelo esquemático para orientação anatômica. Não substitui atlas validado, avaliação clínica ou diagnóstico.",
  "modelPath": "./modules/sistema-urinario/data/model.json",
  "contentPath": "./modules/sistema-urinario/data/content.json",
  "targetSize": 4.4,
  "cameraDistance": 6.6,
  "cameraTarget": [
    0,
    0,
    0.3
  ]
});
