export class SceneFocusManager {
  constructor({
    engine,
    THREE
  } = {}) {
    this.engine = engine;
    this.THREE = THREE;
    this.animationFrame = 0;
  }

  focusObject(
    root,
    objectName,
    options = {}
  ) {
    const object =
      root?.getObjectByName?.(
        objectName
      );

    return this.focusTarget(
      object,
      options
    );
  }

  focusTarget(
    object,
    {
      distanceFactor = 2.4,
      minDistance = 2.5,
      maxDistance = 5.8,
      duration = 620,
      routeArc = 0.10
    } = {}
  ) {
    if (
      !object ||
      !this.engine?.camera ||
      !this.engine?.controls
    ) {
      return false;
    }

    const box =
      new this.THREE.Box3()
        .setFromObject(object);

    if (box.isEmpty()) {
      return false;
    }

    const center =
      box.getCenter(
        new this.THREE.Vector3()
      );

    const size =
      box.getSize(
        new this.THREE.Vector3()
      );

    const radius =
      Math.max(
        size.x,
        size.y,
        size.z,
        .4
      );

    const targetDistance =
      Math.min(
        maxDistance,
        Math.max(
          minDistance,
          radius * distanceFactor
        )
      );

    const camera =
      this.engine.camera;

    const controls =
      this.engine.controls;

    const direction =
      camera.position
        .clone()
        .sub(controls.target);

    if (direction.lengthSq() < .01) {
      direction.set(0,-1,.4);
    }

    direction
      .normalize()
      .multiplyScalar(targetDistance);

    direction.z =
      Math.max(
        direction.z,
        targetDistance * .22
      );

    const destination =
      center
        .clone()
        .add(direction);

    const reducedMotion =
      document.documentElement
        .classList.contains(
          "reduced-motion"
        );

    cancelAnimationFrame(
      this.animationFrame
    );

    if (reducedMotion) {
      camera.position.copy(destination);
      controls.target.copy(center);
      controls.update();
      return true;
    }

    const start =
      performance.now();

    const fromPosition =
      camera.position.clone();

    const fromTarget =
      controls.target.clone();

    const ease =
      t => 1 - Math.pow(1 - t, 3);

    const tick = now => {
      if (
        !this.engine?.camera ||
        !this.engine?.controls
      ) {
        return;
      }

      const t =
        Math.min(
          1,
          (now - start) /
            duration
        );

      const k = ease(t);

      camera.position.lerpVectors(
        fromPosition,
        destination,
        k
      );

      if (routeArc > 0) {
        const lift =
          Math.min(
            0.55,
            targetDistance *
              routeArc
          ) *
          Math.sin(
            Math.PI * t
          );

        camera.position.z += lift;
      }

      controls.target.lerpVectors(
        fromTarget,
        center,
        k
      );

      controls.update();

      if (t < 1) {
        this.animationFrame =
          requestAnimationFrame(tick);
      }
    };

    this.animationFrame =
      requestAnimationFrame(tick);

    return true;
  }

  destroy() {
    cancelAnimationFrame(
      this.animationFrame
    );

    this.animationFrame = 0;
    this.engine = null;
    this.THREE = null;
  }
}
