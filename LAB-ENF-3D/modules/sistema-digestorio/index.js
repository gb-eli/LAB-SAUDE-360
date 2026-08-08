import { createSharedAnatomySystemModule } from "../../services/SharedAnatomySystemModule.js";

export default createSharedAnatomySystemModule({
  "materialSystem": "digestive",
  "title": "Sistema Digestório G3",
  "badge": "SISTEMA DIGESTÓRIO · G3",
  "description": "Esôfago, estômago, fígado, pâncreas, intestinos e referências associadas em um conjunto G3 compartilhado com o Corpo Humano.",
  "note": "Modelo esquemático para orientação anatômica. Não substitui atlas validado, avaliação clínica ou diagnóstico.",
  "modelPath": "./modules/sistema-digestorio/data/model.json",
  "contentPath": "./modules/sistema-digestorio/data/content.json",
  "targetSize": 4.5,
  "cameraDistance": 6.6,
  "cameraTarget": [
    0,
    0,
    0.25
  ]
});
