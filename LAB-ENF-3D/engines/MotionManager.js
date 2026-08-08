export class MotionManager {
  constructor(engine) {
    this.engine = engine;
    this.motions = new Map();

    this.unsubscribeFrame = engine.onFrame((frame) => {
      for (const motion of this.motions.values()) {
        if (motion.enabled) motion.callback(frame);
      }
    });
  }

  add(id, callback, enabled = true) {
    this.motions.set(id, { callback, enabled });
  }

  setEnabled(id, enabled) {
    const motion = this.motions.get(id);
    if (motion) motion.enabled = enabled;
  }

  toggle(id) {
    const motion = this.motions.get(id);
    if (!motion) return false;
    motion.enabled = !motion.enabled;
    return motion.enabled;
  }

  isEnabled(id) {
    return this.motions.get(id)?.enabled ?? false;
  }

  remove(id) {
    this.motions.delete(id);
  }

  destroy() {
    this.unsubscribeFrame?.();
    this.motions.clear();
    this.engine = null;
  }
}
