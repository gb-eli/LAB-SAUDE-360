import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export class ThreeEngine {
  constructor({
    host,
    graphics,
    events,
    background = 0x07131f,
    camera = { fov: 38, near: 0.05, far: 100 },
    rendererOptions = {}
  }) {
    this.host = host;
    this.graphics = graphics;
    this.events = events;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(background);

    this.camera = new THREE.PerspectiveCamera(
      camera.fov,
      1,
      camera.near,
      camera.far
    );

    this.renderer = new THREE.WebGLRenderer({
      antialias: graphics.activeProfile !== "eco",
      alpha: false,
      powerPreference:
        graphics.activeProfile === "eco" ? "low-power" : "high-performance",
      ...rendererOptions
    });

    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.canvas = this.renderer.domElement;
    this.canvas.className = "three-canvas";
    this.canvas.setAttribute(
      "aria-label",
      "Visualização tridimensional interativa. Use setas esquerda e direita para girar e setas para cima e para baixo para aproximar ou afastar."
    );
    this.canvas.tabIndex = 0;
    this.canvas.style.touchAction = "none";
    this.host.append(this.canvas);

    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.065;
    this.controls.enablePan = false;
    this.controls.minDistance = 2.4;
    this.controls.maxDistance = 8.5;

    const coarsePointer = window.matchMedia?.("(pointer: coarse)")?.matches;
    if (coarsePointer) {
      this.controls.rotateSpeed = 0.72;
      this.controls.zoomSpeed = 0.78;
      this.controls.dampingFactor = 0.085;
    }

    this.clock = new THREE.Clock();
    this.running = false;
    this.requestedRunning = false;
    this.visibilitySuspended = document.hidden;
    this.frameCallbacks = new Set();
    this.lastMetricsAt = 0;

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(host);

    this.unsubscribeGraphics = events.on(
      "graphics:profileChanged",
      ({ settings }) => this.applyGraphics(settings)
    );

    this.onVisibilityChange = () => {
      this.visibilitySuspended = document.hidden;

      if (this.visibilitySuspended) {
        this.running = false;
        this.renderer?.setAnimationLoop(null);
        this.events?.emit("three:suspended", { reason: "visibility" });
        return;
      }

      if (this.requestedRunning && this.renderer) {
        this.running = true;
        this.clock.start();
        this.renderer.setAnimationLoop(this.render);
        this.resize();
        this.events?.emit("three:resumed", { reason: "visibility" });
      }
    };

    this.onContextLost = event => {
      event.preventDefault();
      this.events?.emit("three:contextLost", {});
    };

    this.onContextRestored = () => {
      this.events?.emit("three:contextRestored", {});
      this.resize();
    };

    this.onCanvasKeyDown = event => {
      if (!this.camera || !this.controls) return;

      const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "+", "=", "-", "_"];
      if (!keys.includes(event.key)) return;

      event.preventDefault();

      const target = this.controls.target;
      const offset = this.camera.position.clone().sub(target);

      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        const direction = event.key === "ArrowLeft" ? 1 : -1;
        const angle = direction * 0.12;
        const x = offset.x * Math.cos(angle) - offset.y * Math.sin(angle);
        const y = offset.x * Math.sin(angle) + offset.y * Math.cos(angle);
        offset.x = x;
        offset.y = y;
      } else {
        const zoomIn = event.key === "ArrowUp" || event.key === "+" || event.key === "=";
        const factor = zoomIn ? 0.90 : 1.10;
        const nextLength = Math.max(
          this.controls.minDistance,
          Math.min(this.controls.maxDistance, offset.length() * factor)
        );
        offset.setLength(nextLength);
      }

      this.camera.position.copy(target).add(offset);
      this.controls.update();
    };

    document.addEventListener("visibilitychange", this.onVisibilityChange);
    this.canvas.addEventListener("webglcontextlost", this.onContextLost, false);
    this.canvas.addEventListener(
      "webglcontextrestored",
      this.onContextRestored,
      false
    );
    this.canvas.addEventListener("keydown", this.onCanvasKeyDown);

    this.applyGraphics(graphics.settings);
    this.resize();
  }

  addDefaultLights({
    ambient = 1.2,
    key = 3.0,
    fill = 1.6,
    rim = 2.2
  } = {}) {
    const hemi = new THREE.HemisphereLight(0xccecff, 0x13202c, ambient);
    this.scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xffffff, key);
    keyLight.position.set(4, 5, 5);
    keyLight.castShadow = this.graphics.settings.shadows;
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x7dd3fc, fill);
    fillLight.position.set(-4, 2, 3);
    this.scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xff8da1, rim);
    rimLight.position.set(1, 1, -5);
    this.scene.add(rimLight);

    this.keyLight = keyLight;
  }

  applyGraphics(settings) {
    if (!settings || !this.renderer) return;

    const maxPixel = settings.maxPixelRatio || 1;
    const scale = settings.renderScale || 1;
    const pixelRatio =
      Math.min(window.devicePixelRatio || 1, maxPixel) * scale;

    this.renderer.setPixelRatio(Math.max(0.55, pixelRatio));
    this.renderer.shadowMap.enabled = Boolean(settings.shadows);
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    if (this.keyLight) {
      this.keyLight.castShadow = Boolean(settings.shadows);
    }

    this.resize();
  }

  resize() {
    if (!this.host || !this.camera || !this.renderer) return;

    const width = Math.max(1, this.host.clientWidth);
    const height = Math.max(1, this.host.clientHeight);

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  onFrame(callback) {
    this.frameCallbacks.add(callback);
    return () => this.frameCallbacks.delete(callback);
  }

  start() {
    this.requestedRunning = true;

    if (this.visibilitySuspended || !this.renderer) return;
    if (this.running) return;

    this.running = true;
    this.clock.start();
    this.renderer.setAnimationLoop(this.render);
  }

  pause() {
    this.requestedRunning = false;
    this.running = false;
    this.renderer?.setAnimationLoop(null);
  }

  render = time => {
    if (!this.running || this.visibilitySuspended) return;

    const delta = Math.min(this.clock.getDelta(), 0.05);

    for (const callback of this.frameCallbacks) {
      callback({ time, delta, engine: this });
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);

    if (time - this.lastMetricsAt > 700) {
      this.lastMetricsAt = time;
      const info = this.renderer.info;

      this.events.emit("three:metrics", {
        calls: info.render.calls,
        triangles: info.render.triangles,
        points: info.render.points,
        lines: info.render.lines
      });
    }
  };

  focus(position = [0, 0, 4.5], target = [0, 0, 0]) {
    this.camera.position.set(...position);
    this.controls.target.set(...target);
    this.controls.update();
  }

  disposeMaterial(material) {
    const materials = Array.isArray(material)
      ? material
      : material
        ? [material]
        : [];

    for (const item of materials) {
      for (const value of Object.values(item || {})) {
        if (value?.isTexture && value.dispose) value.dispose();
      }
      item?.dispose?.();
    }
  }

  replaceMaterial(mesh, material) {
    if (!mesh) return material;
    if (mesh.material && mesh.material !== material) {
      this.disposeMaterial(mesh.material);
    }
    mesh.material = material;
    return material;
  }

  disposeObject(object) {
    object.traverse?.(child => {
      if (child.geometry?.dispose) child.geometry.dispose();
      this.disposeMaterial(child.material);
    });
  }

  destroy() {
    this.pause();
    this.frameCallbacks.clear();

    this.unsubscribeGraphics?.();
    this.resizeObserver?.disconnect();

    document.removeEventListener(
      "visibilitychange",
      this.onVisibilityChange
    );

    this.canvas?.removeEventListener(
      "webglcontextlost",
      this.onContextLost,
      false
    );

    this.canvas?.removeEventListener(
      "webglcontextrestored",
      this.onContextRestored,
      false
    );
    this.canvas?.removeEventListener("keydown", this.onCanvasKeyDown);

    for (const child of [...this.scene.children]) {
      this.disposeObject(child);
      this.scene.remove(child);
    }

    this.controls?.dispose();
    this.renderer?.dispose();
    this.renderer?.forceContextLoss?.();
    this.canvas?.remove();

    this.scene = null;
    this.camera = null;
    this.controls = null;
    this.renderer = null;
    this.host = null;
  }
}

export { THREE };
