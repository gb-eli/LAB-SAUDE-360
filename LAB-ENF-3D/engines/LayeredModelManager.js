export class LayeredModelManager {
  constructor({ engine, loader, graphics, events }) {
    this.engine = engine;
    this.loader = loader;
    this.graphics = graphics;
    this.events = events;
    this.layers = new Map();
  }

  register(id, config) {
    this.layers.set(id, {
      id,
      config,
      object: null,
      url: null,
      visible: config.visible ?? true,
      opacity: config.opacity ?? 1,
      generation: 0
    });
  }

  chooseUrl(layer) {
    const variants = layer.config.variants || {};
    const profile = this.graphics.activeProfile;
    return variants[profile] || variants.medium || variants.eco || null;
  }

  applyTransform(object, config = {}) {
    const scale = config.scale ?? 1;
    const scaleArray = Array.isArray(scale) ? scale : [scale, scale, scale];

    object.scale.set(...scaleArray);

    if (config.position) {
      object.position.set(...config.position);
    }

    if (config.rotation) {
      object.rotation.set(...config.rotation);
    }

    object.userData.layerBaseScale = object.scale.clone();
    object.userData.layerBasePosition = object.position.clone();
  }

  async ensure(id, { style } = {}) {
    const layer = this.layers.get(id);
    if (!layer) throw new Error(`Layer "${id}" não registrado.`);

    const url = this.chooseUrl(layer);

    if (layer.object && layer.url === url) {
      layer.object.visible = layer.visible;
      return layer.object;
    }

    const generation = ++layer.generation;
    const previousObject = layer.object;
    const gltf = await this.loader.load(url);
    const object = gltf.scene;

    if (generation !== layer.generation) {
      this.engine.disposeObject(object);
      return layer.object;
    }

    object.name = `layer_${id}`;
    object.visible = layer.visible;

    style?.(object, id);
    this.applyTransform(object, layer.config.transform);
    this.applyOpacityObject(object, layer.opacity);

    this.engine.scene.add(object);

    layer.object = object;
    layer.url = url;

    if (previousObject && previousObject !== object) {
      this.engine.scene.remove(previousObject);
      this.engine.disposeObject(previousObject);
    }

    this.events?.emit("layer:loaded", { id, url, object, previousObject });
    return object;
  }

  setVisible(id, visible) {
    const layer = this.layers.get(id);
    if (!layer) return;

    layer.visible = visible;
    if (layer.object) layer.object.visible = visible;
  }

  setOpacity(id, opacity) {
    const layer = this.layers.get(id);
    if (!layer) return;

    layer.opacity = Math.max(0.05, Math.min(1, opacity));
    if (layer.object) this.applyOpacityObject(layer.object, layer.opacity);
  }

  applyOpacityObject(object, opacity) {
    object.traverse((child) => {
      if (!child.isMesh || !child.material) return;

      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material];

      for (const material of materials) {
        material.transparent = opacity < 1 || material.transparent;
        material.opacity = opacity;
        material.depthWrite = opacity >= 0.45;
        material.needsUpdate = true;
      }
    });
  }

  getObject(id) {
    return this.layers.get(id)?.object || null;
  }

  getLayer(id) {
    return this.layers.get(id) || null;
  }

  async reloadAll({ style } = {}) {
    for (const [id, layer] of this.layers) {
      if (layer.object) await this.ensure(id, { style });
    }
  }

  destroy() {
    for (const layer of this.layers.values()) {
      layer.generation += 1;
      if (layer.object) {
        this.engine.scene.remove(layer.object);
        this.engine.disposeObject(layer.object);
      }
    }

    this.layers.clear();
    this.engine = null;
    this.loader = null;
    this.graphics = null;
  }
}
