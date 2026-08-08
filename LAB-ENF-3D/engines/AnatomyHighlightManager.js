export class AnatomyHighlightManager {
  constructor({ engine, THREE, color = 0x63e6be } = {}) {
    this.engine = engine;
    this.THREE = THREE;
    this.color = color;
    this.entries = [];
    this.helper = null;
  }

  clear() {
    for (const entry of this.entries) {
      const material = entry.material;
      if (!material) continue;

      if (entry.emissive && material.emissive) {
        material.emissive.copy(entry.emissive);
      }

      if (Number.isFinite(entry.emissiveIntensity)) {
        material.emissiveIntensity = entry.emissiveIntensity;
      }

      if (Number.isFinite(entry.roughness)) {
        material.roughness = entry.roughness;
      }

      material.needsUpdate = true;
    }

    this.entries = [];

    if (this.helper && this.engine?.scene) {
      this.engine.scene.remove(this.helper);
      this.helper.geometry?.dispose?.();
      this.helper.material?.dispose?.();
    }

    this.helper = null;
  }

  findMeshes(root, id) {
    const meshes = [];

    root?.traverse?.(child => {
      if (!child.isMesh) return;

      const semantic =
        child.userData?.structureId ||
        child.name;

      if (semantic === id || child.name === id) {
        meshes.push(child);
      }
    });

    return meshes;
  }

  highlight(root, id, { color = this.color } = {}) {
    this.clear();
    if (!root || !id) return [];

    const meshes = this.findMeshes(root, id);
    const highlightColor = new this.THREE.Color(color);

    for (const mesh of meshes) {
      const materials = Array.isArray(mesh.material)
        ? mesh.material
        : mesh.material
          ? [mesh.material]
          : [];

      for (const material of materials) {
        this.entries.push({
          material,
          emissive: material.emissive?.clone?.() || null,
          emissiveIntensity: material.emissiveIntensity,
          roughness: material.roughness
        });

        if (material.emissive) {
          material.emissive.copy(highlightColor);
          material.emissiveIntensity = Math.max(
            0.24,
            Number(material.emissiveIntensity || 0) + 0.32
          );
        }

        if (Number.isFinite(material.roughness)) {
          material.roughness = Math.max(0.28, material.roughness - 0.12);
        }

        material.needsUpdate = true;
      }
    }

    if (meshes.length && this.engine?.scene) {
      const box = new this.THREE.Box3();
      meshes.forEach(mesh => box.expandByObject(mesh));

      if (!box.isEmpty()) {
        this.helper = new this.THREE.Box3Helper(box, color);
        this.helper.name = "anatomy-selection-highlight";
        this.engine.scene.add(this.helper);
      }
    }

    return meshes;
  }

  destroy() {
    this.clear();
    this.engine = null;
    this.THREE = null;
  }
}
