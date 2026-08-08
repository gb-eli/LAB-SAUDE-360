export function createSharedAnatomySystemModule(config) {
  let loadGuard = null;
  let context = null;
  let root = null;
  let manifest = null;
  let content = null;
  let engine = null;
  let loader = null;
  let raycast = null;
  let cameras = null;
  let modelRoot = null;
  let THREE = null;
  let graphicsUnsub = null;
  let rotating = false;
  let frameUnsub = null;
  let presentationCleanup = null;
  let isolation = null;
  let highlight = null;
  let selectedId = null;

  const safe = (s = "") =>
    String(s).replace(/[&<>"']/g, c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[c]));

  const item = id =>
    content?.structures?.find(x => x.mesh === id) || null;

  function select(id) {
    const selected = item(id);
    if (!selected) return;

    selectedId = id;

    if (isolation?.isolatedId) {
      isolation.isolate(id);
    }

    highlight?.highlight(modelRoot, id);

    root.querySelector(".shared-anatomy-info").innerHTML =
      `<span class="eyebrow">Estrutura selecionada</span><h3>${safe(selected.name)}</h3><p>${safe(selected.description)}</p>`;

    root.querySelectorAll("[data-structure]").forEach(btn =>
      btn.classList.toggle("active", btn.dataset.structure === id)
    );
  }

  function syncCutUI() {
    root.querySelectorAll("[data-cut]").forEach(btn =>
      btn.classList.toggle(
        "active",
        btn.dataset.cut === isolation?.cutMode
      )
    );

    const label = root.querySelector("[data-cut-offset-value]");
    if (label) {
      label.textContent =
        `${Number(isolation?.cutOffset || 0).toFixed(2)}`;
    }
  }

  async function loadModel() {
    if (!loadGuard) {
      const { AsyncLoadGuard } =
        await import("../engines/AsyncLoadGuard.js");
      loadGuard = new AsyncLoadGuard();
    }

    const token = loadGuard.begin();
    const gltf = await loader.load(
      context.assets.chooseVariant(manifest)
    );

    if (!loadGuard.isCurrent(token)) {
      loadGuard.disposeObject(gltf.scene);
      return;
    }

    highlight?.clear();
    selectedId = null;

    if (modelRoot) {
      isolation?.unregisterRoot(modelRoot);
      engine.scene.remove(modelRoot);
      engine.disposeObject(modelRoot);
    }

    modelRoot = gltf.scene;

    const { applyAnatomyMaterialPreset } =
      await import("../engines/AnatomyMaterialPreset.js");

    applyAnatomyMaterialPreset({
      root: modelRoot,
      engine,
      THREE,
      system: config.materialSystem
    });

    const box = new THREE.Box3().setFromObject(modelRoot);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    modelRoot.position.sub(center);
    modelRoot.scale.setScalar(
      (config.targetSize || 4.5) /
      Math.max(size.x, size.y, size.z)
    );

    engine.scene.add(modelRoot);
    isolation.registerRoot(modelRoot);
    raycast.setTarget(modelRoot);

    const quality = root.querySelector("[data-quality]");
    if (quality) {
      quality.textContent =
        context.graphics.activeProfile.toUpperCase();
    }
  }

  function onInput(e) {
    const range = e.target.closest("[data-cut-offset]");
    if (!range) return;

    isolation?.setCutOffset(Number(range.value));
    syncCutUI();
  }

  function onClick(e) {
    const structure = e.target.closest("[data-structure]");
    if (structure) {
      select(structure.dataset.structure);
      return;
    }

    const cut = e.target.closest("[data-cut]");
    if (cut) {
      const next =
        isolation.cutMode === cut.dataset.cut
          ? "none"
          : cut.dataset.cut;

      isolation.setCut(next);
      syncCutUI();
      return;
    }

    const tool = e.target.closest("[data-tool]");
    if (!tool) return;

    const action = tool.dataset.tool;

    if (["front", "side", "top", "back"].includes(action)) {
      cameras?.go(action);
    }

    if (action === "rotate") {
      rotating = !rotating;
      tool.classList.toggle("active", rotating);
    }

    if (action === "isolate") {
      if (!selectedId) return;

      if (isolation.isolatedId === selectedId) {
        isolation.clearIsolation();
        tool.classList.remove("active");
      } else {
        isolation.isolate(selectedId);
        tool.classList.add("active");
      }
    }

    if (action === "reset") {
      rotating = false;
      selectedId = null;
      isolation.reset();
      highlight?.clear();
      cameras?.go("front");

      root.querySelector('[data-tool="rotate"]')
        ?.classList.remove("active");
      root.querySelector('[data-tool="isolate"]')
        ?.classList.remove("active");
      root.querySelectorAll("[data-structure]")
        .forEach(btn => btn.classList.remove("active"));

      const range = root.querySelector("[data-cut-offset]");
      if (range) range.value = 0;

      syncCutUI();

      root.querySelector(".shared-anatomy-info").innerHTML =
        '<span class="eyebrow">Exploração</span><h3>Selecione uma estrutura</h3><p>Use seleção, isolamento, corte e vistas anatômicas.</p>';
    }
  }

  async function mount3D() {
    const imports = await Promise.all([
      import("../engines/ThreeEngine.js"),
      import("../engines/CameraController.js"),
      import("../engines/GLBAssetLoader.js"),
      import("../engines/RaycastManager.js"),
      import("../engines/AnatomyIsolationManager.js"),
      import("../engines/AnatomyHighlightManager.js")
    ]);

    const { ThreeEngine, THREE: ThreeNS } = imports[0];
    THREE = ThreeNS;

    const { CameraController } = imports[1];
    const { GLBAssetLoader } = imports[2];
    const { RaycastManager } = imports[3];
    const { AnatomyIsolationManager } = imports[4];
    const { AnatomyHighlightManager } = imports[5];

    engine = new ThreeEngine({
      host: root.querySelector(".three-host"),
      graphics: context.graphics,
      events: context.events,
      background: 0x07131f,
      camera: { fov: 35, near: 0.05, far: 70 }
    });

    const {
      applyAnatomyPresentation,
      registerAnatomyViews
    } = await import("../engines/AnatomyPresentationPreset.js");

    presentationCleanup = applyAnatomyPresentation({
      engine,
      THREE,
      events: context.events,
      mood: config.materialSystem
    });

    const distance = config.cameraDistance || 6.6;
    const target = config.cameraTarget || [0, 0, 0.4];

    engine.focus(
      [0, -distance, target[2] + 0.3],
      target
    );

    loader = new GLBAssetLoader({
      events: context.events
    });

    raycast = new RaycastManager({
      engine,
      target: null,
      selectable: id => Boolean(item(id)),
      onSelect: ({ id }) => select(id)
    });

    cameras = new CameraController(engine);

    registerAnatomyViews(cameras, {
      distance,
      target,
      top: true
    });

    isolation = new AnatomyIsolationManager({
      engine,
      THREE
    });

    highlight = new AnatomyHighlightManager({
      engine,
      THREE
    });

    frameUnsub = engine.onFrame(({ delta }) => {
      if (
        rotating &&
        modelRoot &&
        !document.documentElement.classList.contains("reduced-motion")
      ) {
        modelRoot.rotation.y += delta * 0.28;
      }
    });

    await loadModel();

    graphicsUnsub = context.events.on(
      "graphics:profileChanged",
      loadModel
    );

    engine.start();
  }

  return {
    async mount(ctx) {
      context = ctx;

      [manifest, content] = await Promise.all([
        context.assets.loadJson(config.modelPath),
        context.assets.loadJson(config.contentPath)
      ]);

      root = document.createElement("section");
      root.className = "shared-anatomy-lab";

      root.innerHTML = `
        <div class="shared-anatomy-stage">
          <div class="three-host"></div>
          <div class="shared-anatomy-badge">
            ${safe(config.badge)} · <span data-quality>—</span>
          </div>
        </div>

        <aside class="shared-anatomy-panel">
          <span class="eyebrow">Anatomia compartilhada · G3 · v0.27</span>
          <h2>${safe(config.title)}</h2>
          <p>${safe(config.description)}</p>

          <div class="shared-anatomy-info">
            <span class="eyebrow">Exploração</span>
            <h3>Selecione uma estrutura</h3>
            <p>Use seleção, isolamento, corte e vistas anatômicas.</p>
          </div>

          <div class="shared-anatomy-tools">
            <button class="shared-anatomy-tool" data-tool="front">Frontal</button>
            <button class="shared-anatomy-tool" data-tool="side">Lateral</button>
            <button class="shared-anatomy-tool" data-tool="top">Superior</button>
            <button class="shared-anatomy-tool" data-tool="rotate">Auto rotação</button>
            <button class="shared-anatomy-tool" data-tool="isolate">Isolar seleção</button>
            <button class="shared-anatomy-tool" data-cut="sagittal">Corte sagital</button>
            <button class="shared-anatomy-tool" data-cut="transverse">Corte transversal</button>
            <button class="shared-anatomy-tool" data-tool="reset">Resetar</button>
          </div>

          <div class="shared-cut-control">
            <strong>Posição do plano de corte</strong>
            <input data-cut-offset type="range" min="-2" max="2" step=".05" value="0">
            <div>
              <span>-2</span>
              <span data-cut-offset-value>0.00</span>
              <span>+2</span>
            </div>
          </div>

          <div class="shared-anatomy-list">
            ${content.structures.map(x => `
              <button
                class="shared-anatomy-row"
                data-structure="${safe(x.mesh)}"
              >
                ${safe(x.name)}
              </button>
            `).join("")}
          </div>

          <div class="shared-anatomy-note">
            ${safe(config.note)}
          </div>
        </aside>
      `;

      root.addEventListener("click", onClick);
      root.addEventListener("input", onInput);
      context.host.append(root);

      try {
        await mount3D();
      } catch (error) {
        console.error(error);

        const { renderAnatomyFallback } =
          await import("./AnatomyFallbackRenderer.js");

        renderAnatomyFallback({
          host: root.querySelector(".shared-anatomy-stage"),
          title: config.title,
          structures: content.structures,
          note:
            "Fallback 2D/SVG para reconhecimento das estruturas quando WebGL não estiver disponível."
        });
      }
    },

    async start() {
      engine?.start();
    },

    pause() {
      engine?.pause();
    },

    async destroy() {
      loadGuard?.invalidate();
      graphicsUnsub?.();
      frameUnsub?.();
      presentationCleanup?.();
      highlight?.destroy();
      isolation?.destroy();
      raycast?.destroy();
      cameras?.destroy();
      loader?.destroy();

      if (modelRoot && engine) {
        engine.scene.remove(modelRoot);
        engine.disposeObject(modelRoot);
      }

      engine?.destroy();

      root?.removeEventListener("click", onClick);
      root?.removeEventListener("input", onInput);
      root?.remove();

      context = root = manifest = content = engine = loader =
        raycast = cameras = modelRoot = THREE = isolation = highlight = null;
    }
  };
}
