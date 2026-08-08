export class CameraController {
  constructor(engine) {
    this.engine = engine;
    this.presets = new Map();
    this.animationFrame = 0;
  }

  register(id, { position, target }) {
    this.presets.set(id, { position, target });
  }

  go(id, { animate = true, duration = null } = {}) {
    const preset = this.presets.get(id);
    if (!preset || !this.engine?.camera || !this.engine?.controls) return false;

    cancelAnimationFrame(this.animationFrame);

    const reducedMotion =
      document.documentElement.classList.contains("reduced-motion");

    if (!animate || reducedMotion) {
      this.engine.focus(preset.position, preset.target);
      return true;
    }

    const projector =
      document.documentElement.classList.contains("projector-mode");

    const ms = duration ?? (projector ? 650 : 430);
    const start = performance.now();
    const camera = this.engine.camera;
    const controls = this.engine.controls;

    const fromPosition = camera.position.clone();
    const fromTarget = controls.target.clone();
    const toPosition = fromPosition.clone().set(...preset.position);
    const toTarget = fromTarget.clone().set(...preset.target);

    const ease = t =>
      t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const tick = now => {
      if (!this.engine?.camera || !this.engine?.controls) return;

      const t = Math.min(1, (now - start) / ms);
      const k = ease(t);

      camera.position.lerpVectors(fromPosition, toPosition, k);
      controls.target.lerpVectors(fromTarget, toTarget, k);
      controls.update();

      if (t < 1) {
        this.animationFrame = requestAnimationFrame(tick);
      }
    };

    this.animationFrame = requestAnimationFrame(tick);
    return true;
  }

  destroy() {
    cancelAnimationFrame(this.animationFrame);
    this.animationFrame = 0;
    this.presets.clear();
    this.engine = null;
  }
}
