const MOODS = {
  clinical:{
    accent:0x78a9bb,
    wall:0xe5eff2,
    floor:0x66777f,
    textile:0xeef5f6,
    screen:0x183943,
    plastic:0xdce8eb,
    metal:0xc8d3d7,
    warm:0xa78c72
  },
  urgent:{
    accent:0xc98b63,
    wall:0xe6ecee,
    floor:0x626e74,
    textile:0xf1f4f4,
    screen:0x173840,
    plastic:0xdbe4e6,
    metal:0xc8d0d2,
    warm:0xb78b68
  },
  primary:{
    accent:0x78ae91,
    wall:0xe8f0eb,
    floor:0x66766d,
    textile:0xf0f6f2,
    screen:0x1f4241,
    plastic:0xdce9e2,
    metal:0xc9d2cf,
    warm:0xa88d70
  },
  maternity:{
    accent:0xb997af,
    wall:0xf1e8ed,
    floor:0x74696f,
    textile:0xf8f1f4,
    screen:0x29404a,
    plastic:0xeee4e9,
    metal:0xd2ccd0,
    warm:0xb49482
  },
  safety:{
    accent:0xc9a94e,
    wall:0xe7edef,
    floor:0x646f73,
    textile:0xf1f3f3,
    screen:0x223b42,
    plastic:0xdde5e6,
    metal:0xc8d0d2,
    warm:0xa78968
  },
  sterile:{
    accent:0x8cb9c9,
    wall:0xe8f1f4,
    floor:0x64747a,
    textile:0xf2f7f8,
    screen:0x183942,
    plastic:0xe0ebee,
    metal:0xcbd5d8,
    warm:0x9c8774
  }
};

function includesAny(name, terms) {
  return terms.some(term => name.includes(term));
}

export class ClinicalMaterialManager {
  constructor({
    engine,
    THREE,
    mood = "clinical"
  } = {}) {
    this.engine = engine;
    this.THREE = THREE;
    this.mood = mood;
  }

  palette() {
    return (
      MOODS[this.mood] ||
      MOODS.clinical
    );
  }

  descriptor(name = "") {
    const id =
      String(name).toLowerCase();

    const p = this.palette();

    if (
      id === "floor" ||
      id.includes("floor_") ||
      id.includes("_floor")
    ) {
      return {
        color:p.floor,
        roughness:.82,
        metalness:0,
        clearcoat:.025
      };
    }

    if (
      id.startsWith("wall_") ||
      id.includes("_wall")
    ) {
      return {
        color:p.wall,
        roughness:.92,
        metalness:0,
        clearcoat:.01
      };
    }

    if (
      includesAny(id,[
        "monitor",
        "screen",
        "display"
      ])
    ) {
      return {
        color:p.screen,
        roughness:.25,
        metalness:.08,
        clearcoat:.52,
        clearcoatRoughness:.2,
        emissive:0x071e25,
        emissiveIntensity:.42
      };
    }

    if (
      includesAny(id,[
        "stand","rail","frame","tray",
        "autoclave","sterilizer",
        "instrument","trolley"
      ])
    ) {
      return {
        color:p.metal,
        roughness:.28,
        metalness:.62,
        clearcoat:.28,
        clearcoatRoughness:.2
      };
    }

    if (
      includesAny(id,[
        "sink","basin","cooler",
        "bin","container","cabinet",
        "storage"
      ])
    ) {
      return {
        color:p.plastic,
        roughness:.46,
        metalness:.04,
        clearcoat:.15,
        clearcoatRoughness:.35
      };
    }

    if (
      includesAny(id,[
        "bed","mattress","bassinet",
        "pad","sheet","table"
      ])
    ) {
      return {
        color:p.textile,
        roughness:.6,
        metalness:0,
        clearcoat:.05
      };
    }

    if (
      includesAny(id,[
        "desk","wood","counter"
      ])
    ) {
      return {
        color:p.warm,
        roughness:.56,
        metalness:0,
        clearcoat:.08
      };
    }

    return {
      color:p.accent,
      roughness:.58,
      metalness:.02,
      clearcoat:.08
    };
  }

  create(
    name,
    overrides = {}
  ) {
    const base = {
      ...this.descriptor(name),
      ...overrides
    };

    return new this.THREE
      .MeshPhysicalMaterial({
        color:base.color,
        roughness:
          base.roughness ?? .58,
        metalness:
          base.metalness ?? 0,
        clearcoat:
          base.clearcoat ?? .06,
        clearcoatRoughness:
          base.clearcoatRoughness ?? .42,
        ior:base.ior ?? 1.42,
        specularIntensity:
          base.specularIntensity ?? .42,
        emissive:
          base.emissive ?? 0x000000,
        emissiveIntensity:
          base.emissiveIntensity ?? 0,
        transparent:
          Boolean(base.transparent),
        opacity:
          base.opacity ?? 1
      });
  }

  apply(
    root,
    {
      resolve = null
    } = {}
  ) {
    if (
      !root ||
      !this.engine ||
      !this.THREE
    ) {
      return;
    }

    root.traverse(child => {
      if (!child.isMesh) return;

      child.userData.structureId =
        child.userData.structureId ||
        child.name;

      child.castShadow =
        !child.name.startsWith(
          "wall_"
        ) &&
        child.name !== "floor";

      child.receiveShadow = true;

      const overrides =
        resolve?.(child) || {};

      const material =
        this.create(
          child.name,
          overrides
        );

      this.engine.replaceMaterial(
        child,
        material
      );
    });
  }

  destroy() {
    this.engine = null;
    this.THREE = null;
  }
}
