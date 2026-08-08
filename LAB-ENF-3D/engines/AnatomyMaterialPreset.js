const palettes = {
  respiratory: {
    default: 0xd47f91, airway: 0x9ecad7, diaphragm: 0xb7769d, alveolar: 0xe4a4b3
  },
  urinary: {
    default: 0xd5b58f, kidney: 0x9d5254, ureter: 0xd2b18f, bladder: 0xcc8fa4,
    artery: 0xb94a51, vein: 0x4a70a3, pelvis: 0xdcae8f, calyx: 0xe1c2a7
  },
  digestive: {
    default: 0xd8b58e, liver: 0x784537, stomach: 0xcd7b6e, intestine: 0xcf9579,
    colon: 0xb97967, pancreas: 0xd9ab6d, gallbladder: 0x78986b,
    esophagus: 0xc98b78, appendix: 0xb77969
  },
  nervous: {
    default: 0xc7a0ae, cerebral: 0xc297a6, cerebellum: 0xa88596, spinal: 0xe0c26e,
    nerve: 0xe8c75f, brainstem: 0xb493a0, lobe: 0xd4aab8
  },
  endocrine: {
    default: 0xd8a29a, pituitary: 0xb685a9, thyroid: 0xcb7189, adrenal: 0xe0bc52,
    pancreas: 0xd7a76a, thymus: 0xb98eac, parathyroid: 0xd694a7
  },
  lymphatic: {
    default: 0x71bf8b, node: 0x75c98e, duct: 0x7ebfa3, spleen: 0x8f4a5c,
    chain: 0x62aa82
  },
  muscular: {
    default: 0xb5494d, back: 0x9d3940, tendon: 0xe2cdae, fascia: 0xd5b7a1
  },
  skin: {
    default: 0xd8b58e, epidermis: 0xcd9a7e, dermis: 0xdd9788,
    hypodermis: 0xe7c267, hair: 0x5f4638, follicle: 0xa86662,
    gland: 0xc58c9d, artery: 0xb84b54, vein: 0x496eaa, nerve: 0xd6b258
  },
  reproductiveFemale: {
    default: 0xd89bab, uterus: 0xb96f80, ovary: 0xd9a76d, tube: 0xc9879c,
    lining: 0xe5b0bd, ligament: 0xd1b7a1
  },
  reproductiveMale: {
    default: 0xb88da4, prostate: 0xa56b87, testis: 0xd8b46d, duct: 0xc7a58e,
    vesicle: 0xb57f98, erectile: 0xc68e9d
  },
  cardiovascular: {
    default: 0xb84859, artery: 0xc8454b, vein: 0x4777a8, chamber: 0xb94358
  },
  skeleton: {
    default: 0xe5ddc6, joint: 0xcfc4a1
  },
  headNeck: {
    default: 0xd3b18f, bone: 0xe5ddc6, airway: 0x9ecad7,
    thyroid: 0xcb7189, node: 0x71bf8b, nerve: 0xe0c26e
  },
  sensory: {
    default: 0xd0a28f, eyeball: 0xf0f3f4, iris: 0x4b8097,
    lens: 0xd7edf2, ear: 0xcc977e, cochlea: 0xd8a4b5,
    nerve: 0xe0c26e
  },
  handFoot: {
    default: 0xe2dbc6, tendon: 0xe2c070, nerve: 0xe0c26e,
    soft: 0xb9826e
  },
  joint: {
    default: 0xe2dbc6, cartilage: 0x89bcc9, ligament: 0xe2c070,
    tendon: 0xd0a47a
  }
};

function colorFor(name, system) {
  const p = palettes[system] || { default: 0xd8b58e };

  if (system === "respiratory") {
    if (name.includes("bronch") || name.includes("trachea") || name.includes("larynx")) return p.airway;
    if (name.includes("diaphragm")) return p.diaphragm;
    if (name.includes("alveolar")) return p.alveolar;
  }

  if (system === "urinary") {
    if (name.includes("kidney")) return p.kidney;
    if (name.includes("ureter") || name.includes("urethra")) return p.ureter;
    if (name.includes("bladder")) return p.bladder;
    if (name.includes("artery")) return p.artery;
    if (name.includes("vein")) return p.vein;
    if (name.includes("pelvis")) return p.pelvis;
    if (name.includes("calyx")) return p.calyx;
  }

  if (system === "digestive") {
    if (name.includes("liver")) return p.liver;
    if (name.includes("stomach")) return p.stomach;
    if (name.includes("small_intestine") || name.includes("duodenum")) return p.intestine;
    if (name.includes("colon") || name.includes("cecum")) return p.colon;
    if (name.includes("pancreas")) return p.pancreas;
    if (name.includes("gallbladder")) return p.gallbladder;
    if (name.includes("esophagus")) return p.esophagus;
    if (name.includes("appendix")) return p.appendix;
  }

  if (system === "nervous") {
    if (name.includes("hemisphere")) return p.cerebral;
    if (name.includes("cerebellum")) return p.cerebellum;
    if (name.includes("spinal_cord")) return p.spinal;
    if (name.includes("nerve") || name.includes("spinal_branch")) return p.nerve;
    if (name.includes("brainstem")) return p.brainstem;
    if (name.includes("lobe")) return p.lobe;
  }

  if (system === "endocrine") {
    if (name.includes("pituitary")) return p.pituitary;
    if (name.includes("thyroid")) return p.thyroid;
    if (name.includes("adrenal")) return p.adrenal;
    if (name.includes("pancreas")) return p.pancreas;
    if (name.includes("thymus")) return p.thymus;
    if (name.includes("parathyroid")) return p.parathyroid;
  }

  if (system === "lymphatic") {
    if (name.includes("spleen")) return p.spleen;
    if (name.includes("duct")) return p.duct;
    if (name.includes("chain")) return p.chain;
    if (name.includes("node")) return p.node;
  }

  if (system === "muscular") {
    if (name.includes("tendon")) return p.tendon;
    if (name.includes("fascia")) return p.fascia;
    if (name.includes("back")) return p.back;
  }

  if (system === "skin") {
    if (name === "epidermis") return p.epidermis;
    if (name === "dermis") return p.dermis;
    if (name === "hypodermis") return p.hypodermis;
    if (name.includes("hair") && !name.includes("follicle")) return p.hair;
    if (name.includes("follicle")) return p.follicle;
    if (name.includes("gland") || name.includes("duct")) return p.gland;
    if (name.includes("arterial")) return p.artery;
    if (name.includes("venous")) return p.vein;
    if (name.includes("nerve")) return p.nerve;
  }

  if (system === "reproductiveFemale") {
    if (name.includes("uterus") || name.includes("myometrium")) return p.uterus;
    if (name.includes("ovary")) return p.ovary;
    if (name.includes("fallopian") || name.includes("fimbria")) return p.tube;
    if (name.includes("endometrium")) return p.lining;
    if (name.includes("ligament")) return p.ligament;
  }

  if (system === "handFoot") {
    if (name.includes("tendon")) return p.tendon;
    if (name.includes("nerve")) return p.nerve;
    if (name.includes("soft_tissue")) return p.soft;
  }

  if (system === "joint") {
    if (name.includes("cartilage") || name.includes("surface") || name.includes("meniscus") || name.includes("labrum")) return p.cartilage;
    if (name.includes("ligament") || name.includes("acl") || name.includes("pcl")) return p.ligament;
    if (name.includes("tendon")) return p.tendon;
  }

  if (system === "headNeck") {
    if (name.includes("skull") || name.includes("spine")) return p.bone;
    if (name.includes("trachea") || name.includes("pharynx") || name.includes("oral")) return p.airway;
    if (name.includes("thyroid")) return p.thyroid;
    if (name.includes("node")) return p.node;
    if (name.includes("nerve")) return p.nerve;
  }

  if (system === "sensory") {
    if (name.includes("eyeball")) return p.eyeball;
    if (name.includes("iris")) return p.iris;
    if (name.includes("lens")) return p.lens;
    if (name.includes("cochlea")) return p.cochlea;
    if (name.includes("ear") || name.includes("tympanic") || name.includes("ossicle")) return p.ear;
    if (name.includes("nerve")) return p.nerve;
  }

  if (system === "cardiovascular") {
    if (name.includes("vein") || name.includes("vena_cava") || name === "pulmonary_artery") return p.vein;
    if (name.includes("artery") || name.includes("coronary") || name === "aorta" || name.includes("pulmonary_vein")) return p.artery;
    if (name.includes("atrium") || name.includes("ventricle")) return p.chamber;
  }

  if (system === "skeleton") {
    if (name.includes("joint")) return p.joint;
  }

  if (system === "reproductiveMale") {
    if (name.includes("prostate")) return p.prostate;
    if (name.includes("testis") || name.includes("epididymis")) return p.testis;
    if (name.includes("deferens") || name.includes("urethral")) return p.duct;
    if (name.includes("seminal")) return p.vesicle;
    if (name.includes("erectile")) return p.erectile;
  }

  return p.default;
}


function surfaceFor(name, system, proxy) {
  const id = String(name || "");

  const surface = {
    roughness: proxy ? 0.60 : 0.52,
    clearcoat: proxy ? 0.03 : 0.08,
    clearcoatRoughness: 0.55,
    ior: 1.36,
    specularIntensity: 0.35
  };

  if (system === "skeleton") {
    surface.roughness = proxy ? 0.68 : 0.72;
    surface.clearcoat = 0.025;
    surface.specularIntensity = 0.28;
  }

  if (system === "cardiovascular") {
    surface.roughness = proxy ? 0.54 : 0.46;
    surface.clearcoat = 0.12;
    surface.clearcoatRoughness = 0.42;
    surface.specularIntensity = 0.42;
  }

  if (system === "muscular") {
    surface.roughness =
      id.includes("tendon") ? 0.62 : 0.55;
    surface.clearcoat =
      id.includes("tendon") ? 0.025 : 0.07;
    surface.specularIntensity = 0.38;
  }

  if (system === "skin") {
    surface.roughness =
      id.includes("hair") ? 0.66 : 0.60;
    surface.clearcoat = 0.045;
    surface.clearcoatRoughness = 0.68;
    surface.specularIntensity = 0.32;
  }

  if (
    system === "respiratory" ||
    system === "urinary" ||
    system === "digestive" ||
    system === "reproductiveFemale" ||
    system === "reproductiveMale"
  ) {
    surface.roughness = proxy ? 0.58 : 0.50;
    surface.clearcoat = 0.075;
    surface.clearcoatRoughness = 0.50;
    surface.specularIntensity = 0.38;
  }

  if (
    system === "nervous" ||
    system === "endocrine" ||
    system === "lymphatic"
  ) {
    surface.roughness = proxy ? 0.60 : 0.54;
    surface.clearcoat = 0.055;
    surface.specularIntensity = 0.34;
  }

  if (
    system === "sensory" &&
    (
      id.includes("lens") ||
      id.includes("eyeball")
    )
  ) {
    surface.roughness = 0.20;
    surface.clearcoat = 0.30;
    surface.clearcoatRoughness = 0.18;
    surface.ior = 1.42;
    surface.specularIntensity = 0.52;
  }

  if (
    system === "joint" &&
    (
      id.includes("cartilage") ||
      id.includes("surface") ||
      id.includes("meniscus")
    )
  ) {
    surface.roughness = 0.38;
    surface.clearcoat = 0.16;
    surface.clearcoatRoughness = 0.36;
    surface.specularIntensity = 0.46;
  }

  return surface;
}

export function applyAnatomyMaterialPreset({
  root,
  engine,
  THREE,
  system,
  semanticResolver = null,
  opacity = 1
}) {
  if (!root || !engine || !THREE) return;

  root.traverse(child => {
    if (!child.isMesh) return;

    child.userData.structureId =
      semanticResolver?.(child) || child.name;

    child.castShadow = true;
    child.receiveShadow = true;

    const proxy = child.name.includes("_proxy");
    const naturallyTranslucent =
      child.name.includes("alveolar") ||
      child.name.includes("diaphragm") ||
      child.name.includes("fascia") ||
      child.name.includes("cartilage") ||
      child.name.includes("surface") ||
      child.name.includes("lens") ||
      child.name.includes("soft_tissue");

    const finalOpacity = Math.min(
      opacity,
      naturallyTranslucent ? 0.82 : 1
    );

    const surface =
      surfaceFor(
        child.name,
        system,
        proxy
      );

    const material = new THREE.MeshPhysicalMaterial({
      color: colorFor(child.name, system),
      roughness: surface.roughness,
      metalness: 0,
      clearcoat: surface.clearcoat,
      clearcoatRoughness:
        surface.clearcoatRoughness,
      ior: surface.ior,
      specularIntensity:
        surface.specularIntensity,
      side: THREE.DoubleSide,
      transparent: finalOpacity < 1,
      opacity: finalOpacity
    });

    engine.replaceMaterial(child, material);
  });
}
