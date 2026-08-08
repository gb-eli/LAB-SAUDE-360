export class JointController {
  constructor({ THREE = null } = {}) {
    this.THREE = THREE;
    this.animations = new Map();
    this.pivots = new Map();
  }

  register(id, callback) {
    this.animations.set(id, callback);
  }

  registerPivot({
    id,
    root,
    pivotObjectName,
    childNames = [],
    axis = "x"
  }) {
    if (!this.THREE || !root) return null;

    const pivotObject = root.getObjectByName(pivotObjectName);
    if (!pivotObject) return null;

    root.updateMatrixWorld(true);

    const worldCenter = new this.THREE.Box3()
      .setFromObject(pivotObject)
      .getCenter(new this.THREE.Vector3());

    const localCenter = root.worldToLocal(worldCenter.clone());

    const group = new this.THREE.Group();
    group.name = `joint_pivot_${id}`;
    group.position.copy(localCenter);
    root.add(group);
    group.updateMatrixWorld(true);

    const attached = [];
    for (const name of childNames) {
      const child = root.getObjectByName(name);
      if (!child || child === group) continue;
      group.attach(child);
      attached.push(child);
    }

    const baseRotation = group.rotation.clone();

    this.pivots.set(id, {
      id,
      group,
      root,
      axis,
      attached,
      baseRotation
    });

    this.register(id, value => {
      const pivot = this.pivots.get(id);
      if (!pivot) return;

      pivot.group.rotation.copy(pivot.baseRotation);
      pivot.group.rotation[pivot.axis] += value;
    });

    return group;
  }

  apply(id, value) {
    this.animations.get(id)?.(value);
  }

  reset(id) {
    const pivot = this.pivots.get(id);
    if (pivot) pivot.group.rotation.copy(pivot.baseRotation);
  }

  resetAll() {
    for (const id of this.pivots.keys()) this.reset(id);
  }

  clear() {
    this.animations.clear();
    this.pivots.clear();
  }

  destroy() {
    this.clear();
    this.THREE = null;
  }
}
