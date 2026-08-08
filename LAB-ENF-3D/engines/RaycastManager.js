import * as THREE from "three";

export class RaycastManager {
  constructor({ engine, target, onSelect, selectable = null }) {
    this.engine = engine;
    this.target = target;
    this.onSelect = onSelect;
    this.selectable = selectable;
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    this.onPointerUp = this.handlePointerUp.bind(this);
    this.engine.canvas.addEventListener("pointerup", this.onPointerUp);
  }

  setTarget(target) {
    this.target = target;
  }

  isVisibleInHierarchy(object) {
    let current = object;
    while (current) {
      if (current.visible === false) return false;
      current = current.parent;
    }
    return true;
  }

  handlePointerUp(event) {
    if (!this.engine?.camera || !this.target) return;

    const rect = this.engine.canvas.getBoundingClientRect();

    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.engine.camera);

    const hits = this.raycaster.intersectObject(this.target, true);

    for (const hit of hits) {
      const object = hit.object;

      if (!this.isVisibleInHierarchy(object)) continue;

      const id = object.userData?.structureId || object.name;

      if (!id) continue;
      if (this.selectable && !this.selectable(id, object)) continue;

      this.onSelect?.({
        id,
        object,
        point: hit.point,
        distance: hit.distance
      });

      return;
    }
  }

  destroy() {
    this.engine?.canvas?.removeEventListener("pointerup", this.onPointerUp);
    this.engine = null;
    this.target = null;
    this.onSelect = null;
  }
}
