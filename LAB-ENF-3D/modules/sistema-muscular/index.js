import { createSharedAnatomySystemModule } from "../../services/SharedAnatomySystemModule.js";

export default createSharedAnatomySystemModule({
  "materialSystem": "muscular",
  "title": "Sistema Muscular G3",
  "badge": "SISTEMA MUSCULAR · G3",
  "description": "Grupos musculares, tendões e referências fasciais em um conjunto G3 compartilhado com o Corpo Humano.",
  "note": "Modelo esquemático para reconhecimento anatômico e comparação visual. Não representa biomecânica ou avaliação funcional.",
  "modelPath": "./modules/sistema-muscular/data/model.json",
  "contentPath": "./modules/sistema-muscular/data/content.json",
  "targetSize": 4.8,
  "cameraDistance": 7.0,
  "cameraTarget": [
    0,
    0,
    0.2
  ]
});
