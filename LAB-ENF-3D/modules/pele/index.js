import { createSharedAnatomySystemModule } from "../../services/SharedAnatomySystemModule.js";

export default createSharedAnatomySystemModule({
  "materialSystem": "skin",
  "title": "Pele G3 — Corte Tegumentar",
  "badge": "PELE · G3",
  "description": "Corte didático de epiderme, derme, hipoderme, anexos, vasos e nervos com equivalência semântica entre LODs.",
  "note": "Corte tegumentar didático. Não classifica lesões, não diagnostica e não orienta tratamento.",
  "modelPath": "./modules/pele/data/model.json",
  "contentPath": "./modules/pele/data/content.json",
  "targetSize": 4.4,
  "cameraDistance": 6.2,
  "cameraTarget": [
    0,
    0,
    0
  ]
});
