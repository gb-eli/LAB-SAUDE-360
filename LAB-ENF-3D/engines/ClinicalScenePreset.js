export function applyClinicalScenePreset({
  engine,
  THREE,
  mood = "clinical",
  profile = "medium"
}) {
  if (!engine?.scene || !engine?.renderer || !THREE) {
    return () => {};
  }

  const palettes = {
    clinical: {
      sky: 0xd8eef5,
      ground: 0x182632,
      fog: 0x0b1722,
      exposure: 1.08,
      key:0xf5fbff,
      fill:0xdaf4ff,
      accent:0x8ed8e8
    },
    urgent: {
      sky: 0xf4e1d2,
      ground: 0x2a201c,
      fog: 0x16110f,
      exposure: 1.07,
      key:0xfff4e9,
      fill:0xffd9b8,
      accent:0xffb36b
    },
    primary: {
      sky: 0xdff3e5,
      ground: 0x17271f,
      fog: 0x0c1712,
      exposure: 1.08,
      key:0xf1fff6,
      fill:0xcff2d9,
      accent:0x8ee0a6
    },
    maternity: {
      sky: 0xf4dbe4,
      ground: 0x211922,
      fog: 0x17101a,
      exposure: 1.10,
      key:0xfff7fb,
      fill:0xffdfe9,
      accent:0xd7a6c5
    },
    safety: {
      sky: 0xf5edcf,
      ground: 0x282319,
      fog: 0x15130e,
      exposure: 1.06,
      key:0xfff9e6,
      fill:0xf7e6a6,
      accent:0xe0bd58
    },
    sterile: {
      sky: 0xdceff7,
      ground: 0x17262d,
      fog: 0x0a151b,
      exposure: 1.10,
      key:0xf6fdff,
      fill:0xdaf5ff,
      accent:0xa6dfef
    },
    pediatrics: {
      sky: 0xdff4f3,
      ground: 0x16252b,
      fog: 0x0b1820,
      exposure: 1.10,
      key:0xf2ffff,
      fill:0xd3f6f1,
      accent:0x8be1d3
    }
  };
  const palette = palettes[mood] || palettes.clinical;
  const previousFog = engine.scene.fog;
  const previousExposure = engine.renderer.toneMappingExposure;

  const hemi = new THREE.HemisphereLight(
    palette.sky,
    palette.ground,
    profile === "eco" ? 0.28 : 0.42
  );

  hemi.name = "clinical_preset_hemi";
  engine.scene.add(hemi);

  const extraLights = [];
  if (profile !== "eco") {
    const strong =
      profile === "high" || profile === "ultra";

    const intensity =
      strong ? 0.48 : 0.30;

    const ceilingA = new THREE.PointLight(
      palette.key,
      intensity,
      13,
      2
    );
    ceilingA.position.set(-2.8, -1.4, 4.4);
    ceilingA.name = "clinical_ceiling_a";

    const ceilingB = new THREE.PointLight(
      palette.fill,
      intensity * 0.78,
      12,
      2
    );
    ceilingB.position.set(2.8, 1.8, 4.0);
    ceilingB.name = "clinical_ceiling_b";

    const accent = new THREE.PointLight(
      palette.accent,
      strong ? 0.24 : 0.14,
      9,
      2
    );
    accent.position.set(0,3.2,2.2);
    accent.name = "clinical_accent";

    extraLights.push(
      ceilingA,
      ceilingB,
      accent
    );
    engine.scene.add(
      ceilingA,
      ceilingB,
      accent
    );

    if (strong) {
      const task = new THREE.SpotLight(
        palette.key,
        0.34,
        14,
        Math.PI / 5,
        .45,
        1.5
      );
      task.position.set(0,-1.2,5.2);
      task.target.position.set(0,0,1.1);
      task.name = "clinical_task";
      task.target.name = "clinical_task_target";
      extraLights.push(task,task.target);
      engine.scene.add(task,task.target);
    }
  }

  if (profile !== "eco") {
    engine.scene.fog = new THREE.FogExp2(
      palette.fog,
      profile === "high" || profile === "ultra" ? 0.017 : 0.022
    );
  }

  engine.renderer.toneMappingExposure =
    palette.exposure + (profile === "high" || profile === "ultra" ? 0.05 : 0);

  return () => {
    engine.scene?.remove(hemi);
    for (const light of extraLights) engine.scene?.remove(light);
    engine.scene.fog = previousFog || null;
    if (engine.renderer) engine.renderer.toneMappingExposure = previousExposure;
  };
}

export function applyClinicalMaterials({
  root,
  THREE,
  engine = null,
  accent = 0x78a9bb
}) {
  if (!root || !THREE) return;

  root.traverse(child => {
    if (!child.isMesh) return;

    let color = 0xd9e4e8;
    let roughness = 0.62;
    let metalness = 0.02;

    if (child.name === "floor") {
      color = 0x61727a;
      roughness = 0.82;
    } else if (child.name.startsWith("wall_")) {
      color = 0xe2edf0;
      roughness = 0.90;
    } else if (
      child.name.includes("monitor") ||
      child.name.includes("screen")
    ) {
      color = 0x294753;
      roughness = 0.32;
    } else if (
      child.name.includes("stand") ||
      child.name.includes("rail") ||
      child.name.includes("tray")
    ) {
      color = 0xc3d0d5;
      roughness = 0.30;
      metalness = 0.58;
    } else if (
      child.name.includes("desk") ||
      child.name.includes("cabinet") ||
      child.name.includes("storage")
    ) {
      color = accent;
      roughness = 0.58;
    } else if (
      child.name.includes("bed") ||
      child.name.includes("table") ||
      child.name.includes("sink") ||
      child.name.includes("bassinet")
    ) {
      color = 0xedf7f9;
      roughness = 0.52;
    }

    child.castShadow =
      !child.name.startsWith("wall_") &&
      child.name !== "floor";

    child.receiveShadow = true;

    const material = new THREE.MeshPhysicalMaterial({
      color,
      roughness,
      metalness,
      clearcoat: metalness > 0.2 ? 0.18 : 0.04,
      clearcoatRoughness: 0.42
    });

    if (engine?.replaceMaterial) {
      engine.replaceMaterial(
        child,
        material
      );
    } else {
      child.material?.dispose?.();
      child.material = material;
    }
  });
}
