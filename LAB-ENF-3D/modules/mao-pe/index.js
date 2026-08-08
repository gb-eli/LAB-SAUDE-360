import { createSharedAnatomySystemModule } from "../../services/SharedAnatomySystemModule.js";

export default createSharedAnatomySystemModule({
  "materialSystem": "handFoot",
  "title": "Mão e Pé G3",
  "badge": "MÃO + PÉ · G3",
  "description": "Comparação regional de ossos, tendões e nervos de mão e pé com equivalência semântica em todos os LODs.",
  "note": "Representação regional didática. Não substitui exame, diagnóstico ou avaliação funcional.",
  "modelPath": "./modules/mao-pe/data/model.json",
  "contentPath": "./modules/mao-pe/data/content.json",
  "targetSize": 4.7,
  "cameraDistance": 6.3,
  "cameraTarget": [
    0,
    0,
    0
  ]
});
