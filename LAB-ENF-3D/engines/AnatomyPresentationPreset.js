export function applyAnatomyPresentation({
  engine,
  THREE,
  events,
  mood = "anatomy"
}) {
  engine.addDefaultLights({
    ambient: 1.45,
    key: 2.8,
    fill: 1.45,
    rim: 1.35
  });

  const frontal = new THREE.DirectionalLight(0xf3fbff, 0);
  frontal.position.set(0, -4.8, 4.2);
  frontal.name = "anatomy_front_fill";

  const moodColors = {
    cardio: 0xffc8d1,
    respiratory: 0xbfeaff,
    human: 0xd7f5ed,
    anatomy: 0xd9f2ff
  };

  const top = new THREE.DirectionalLight(
    moodColors[mood] ||
      moodColors.anatomy,
    0
  );
  top.position.set(1.8, 1.8, 5.4);
  top.name = "anatomy_top_fill";

  const rim = new THREE.DirectionalLight(
    mood === "cardio"
      ? 0xff7d93
      : mood === "respiratory"
        ? 0x78d7ef
        : mood === "human"
          ? 0x79d8bb
          : 0x8fcde8,
    0
  );
  rim.position.set(-3.8,2.6,2.8);
  rim.name = "anatomy_mood_rim";

  engine.scene.add(frontal, top, rim);

  const baseExposure = 1.05;

  const applyProfile = profile => {
    const enabled = profile !== "eco";
    const high = profile === "high" || profile === "ultra";

    frontal.visible = enabled;
    top.visible = enabled;
    rim.visible = enabled;

    frontal.intensity = enabled ? (high ? 0.72 : 0.48) : 0;
    top.intensity = enabled ? (high ? 0.46 : 0.30) : 0;
    rim.intensity = enabled ? (high ? 0.52 : 0.32) : 0;
  };

  const applyProjector = enabled => {
    if (!engine?.renderer) return;

    engine.renderer.toneMappingExposure = enabled ? 1.22 : baseExposure;
    engine.controls.rotateSpeed = enabled ? 0.62 : 1.0;
    engine.controls.zoomSpeed = enabled ? 0.72 : 1.0;
  };

  applyProfile(engine.graphics?.activeProfile || "medium");
  applyProjector(
    document.documentElement.classList.contains("projector-mode")
  );

  const unsubAccessibility = events?.on(
    "accessibility:changed",
    ({ key, value }) => {
      if (key === "projector") applyProjector(value);
    }
  );

  const unsubGraphics = events?.on(
    "graphics:profileChanged",
    ({ active, profile, activeProfile }) => {
      applyProfile(active || activeProfile || profile || engine.graphics?.activeProfile);
    }
  );

  return () => {
    unsubAccessibility?.();
    unsubGraphics?.();
    engine?.scene?.remove(frontal, top, rim);

    if (engine?.renderer) {
      engine.renderer.toneMappingExposure = baseExposure;
    }
  };
}

export function registerAnatomyViews(
  cameras,
  {
    distance = 7,
    target = [0, 0, 0.8],
    top = false
  } = {}
) {
  cameras.register("front", {
    position: [0, -distance, target[2] + 0.3],
    target
  });

  cameras.register("side", {
    position: [distance, 0, target[2] + 0.3],
    target
  });

  cameras.register("back", {
    position: [0, distance, target[2] + 0.3],
    target
  });

  if (top) {
    cameras.register("top", {
      position: [0, -1.0, distance * 0.92],
      target
    });
  }
}
