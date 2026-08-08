export class AnatomyIsolationManager {
  constructor({ engine, THREE }) {
    this.engine = engine;
    this.THREE = THREE;
    this.roots = new Set();
    this.cutMode = "none";
    this.cutOffset = 0;
    this.isolatedId = null;
  }

  registerRoot(root) {
    if (!root) return;
    this.roots.add(root);
    this.applyCutToRoot(root);
    if (this.isolatedId) this.applyIsolationToRoot(root);
  }

  unregisterRoot(root) {
    this.roots.delete(root);
  }

  materialsFor(root) {
    const materials = new Set();

    root?.traverse?.(child => {
      if (!child.isMesh) return;
      const list = Array.isArray(child.material)
        ? child.material
        : child.material
          ? [child.material]
          : [];
      list.forEach(material => materials.add(material));
    });

    return materials;
  }

  planeFor(mode) {
    if (mode === "sagittal") {
      return new this.THREE.Plane(
        new this.THREE.Vector3(-1, 0, 0),
        this.cutOffset
      );
    }

    if (mode === "transverse") {
      return new this.THREE.Plane(
        new this.THREE.Vector3(0, 0, -1),
        this.cutOffset
      );
    }

    return null;
  }

  applyCutToRoot(root) {
    const plane = this.planeFor(this.cutMode);

    if (this.engine?.renderer) {
      this.engine.renderer.localClippingEnabled = Boolean(plane);
    }

    for (const material of this.materialsFor(root)) {
      material.clippingPlanes = plane ? [plane] : [];
      material.clipShadows = Boolean(plane);
      material.needsUpdate = true;
    }
  }

  refreshCut() {
    for (const root of this.roots) {
      this.applyCutToRoot(root);
    }

    if (this.cutMode === "none" && this.engine?.renderer) {
      this.engine.renderer.localClippingEnabled = false;
    }
  }

  setCut(mode = "none") {
    this.cutMode =
      ["none", "sagittal", "transverse"].includes(mode)
        ? mode
        : "none";

    this.refreshCut();
    return this.cutMode;
  }

  setCutOffset(value = 0) {
    const parsed = Number(value);
    this.cutOffset = Number.isFinite(parsed)
      ? Math.max(-2.5, Math.min(2.5, parsed))
      : 0;

    this.refreshCut();
    return this.cutOffset;
  }

  applyIsolationToRoot(root) {
    root?.traverse?.(child => {
      if (!child.isMesh) return;

      if (!("isolationBaseVisible" in child.userData)) {
        child.userData.isolationBaseVisible = child.visible;
      }

      child.visible =
        !this.isolatedId ||
        child.userData.structureId === this.isolatedId ||
        child.name === this.isolatedId;
    });
  }

  isolate(id) {
    this.isolatedId = id || null;

    for (const root of this.roots) {
      this.applyIsolationToRoot(root);
    }
  }

  clearIsolation() {
    this.isolatedId = null;

    for (const root of this.roots) {
      root.traverse?.(child => {
        if (!child.isMesh) return;

        if ("isolationBaseVisible" in child.userData) {
          child.visible = child.userData.isolationBaseVisible;
          delete child.userData.isolationBaseVisible;
        }
      });
    }
  }

  reset() {
    this.clearIsolation();
    this.cutOffset = 0;
    this.setCut("none");
  }

  destroy() {
    this.reset();
    this.roots.clear();
    this.engine = null;
    this.THREE = null;
  }
}
