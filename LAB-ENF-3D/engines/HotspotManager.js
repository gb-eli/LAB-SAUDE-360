import * as THREE from "three";

export class HotspotManager {
  constructor({ engine, overlay, onSelect }) {
    this.engine = engine;
    this.overlay = overlay;
    this.onSelect = onSelect;
    this.items = [];
    this.tmp = new THREE.Vector3();

    this.onClick = this.handleClick.bind(this);
    overlay.addEventListener("click", this.onClick);

    this.unsubscribeFrame = engine.onFrame(() => this.update());
  }

  add({ id, label, position, object = null }) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "three-hotspot";
    button.dataset.hotspot = id;
    button.setAttribute("aria-label", label);
    button.innerHTML = `<span></span>`;

    this.overlay.append(button);

    const item = {
      id,
      label,
      localPosition: new THREE.Vector3(...position),
      object,
      button
    };

    this.items.push(item);
    return item;
  }

  setActive(id) {
    for (const item of this.items) {
      item.button.classList.toggle("active", item.id === id);
    }
  }

  update() {
    if (!this.engine?.camera || !this.overlay) return;

    const width = this.overlay.clientWidth;
    const height = this.overlay.clientHeight;

    for (const item of this.items) {
      this.tmp.copy(item.localPosition);

      if (item.object) {
        item.object.updateWorldMatrix?.(true, false);
        item.object.localToWorld(this.tmp);
      }

      this.tmp.project(this.engine.camera);

      const visible = this.tmp.z > -1 && this.tmp.z < 1;
      item.button.hidden = !visible;

      if (!visible) continue;

      const x = (this.tmp.x * 0.5 + 0.5) * width;
      const y = (-this.tmp.y * 0.5 + 0.5) * height;

      item.button.style.transform =
        `translate(${x}px, ${y}px) translate(-50%, -50%)`;
    }
  }

  handleClick(event) {
    const button = event.target.closest("[data-hotspot]");
    if (!button) return;

    this.setActive(button.dataset.hotspot);
    this.onSelect?.(button.dataset.hotspot);
  }

  destroy() {
    this.unsubscribeFrame?.();
    this.overlay?.removeEventListener("click", this.onClick);

    for (const item of this.items) item.button.remove();
    this.items = [];

    this.overlay = null;
    this.engine = null;
  }
}
