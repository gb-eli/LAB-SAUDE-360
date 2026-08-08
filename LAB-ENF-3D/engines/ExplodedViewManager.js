export class ExplodedViewManager {
  constructor({ root = null, parts = [], distance = 0.55 } = {}) {
    this.root = root;
    this.parts = parts;
    this.distance = distance;
    this.exploded = false;
    this.original = new Map();
    this.bind(root, parts);
  }

  bind(root, parts = this.parts) {
    this.restore();
    this.root = root;
    this.parts = parts || [];
    this.original.clear();

    if (!root) return;

    this.parts.forEach((part, index) => {
      const object = root.getObjectByName(part.id);
      if (!object) return;

      this.original.set(part.id, {
        position: object.position.clone(),
        rotation: object.rotation.clone(),
        index
      });
    });
  }

  explode() {
    if (!this.root || this.exploded) return false;

    const count = Math.max(1, this.original.size);

    for (const [id, data] of this.original.entries()) {
      const object = this.root.getObjectByName(id);
      if (!object) continue;

      const angle = (data.index / count) * Math.PI * 2 - Math.PI / 2;
      const layer = data.index % 3;

      object.position.copy(data.position);
      object.position.x += Math.cos(angle) * this.distance * (1 + layer * 0.18);
      object.position.y += (layer - 1) * this.distance * 0.22;
      object.position.z += Math.sin(angle) * this.distance * (1 + layer * 0.18);
    }

    this.exploded = true;
    return true;
  }

  restore() {
    if (!this.root) {
      this.exploded = false;
      return;
    }

    for (const [id, data] of this.original.entries()) {
      const object = this.root.getObjectByName(id);
      if (!object) continue;
      object.position.copy(data.position);
      object.rotation.copy(data.rotation);
    }

    this.exploded = false;
  }

  toggle() {
    if (this.exploded) {
      this.restore();
      return false;
    }

    this.explode();
    return true;
  }

  destroy() {
    this.restore();
    this.original.clear();
    this.root = null;
    this.parts = [];
  }
}
