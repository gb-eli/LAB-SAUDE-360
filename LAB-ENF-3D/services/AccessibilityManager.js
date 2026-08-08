export class AccessibilityManager {
  constructor({ storage, events }) {
    this.storage = storage;
    this.events = events;
    this.state = {
      reducedMotion: storage.get("accessibility:reducedMotion", false),
      highContrast: storage.get("accessibility:highContrast", false),
      largeText: storage.get("accessibility:largeText", false),
      projector: storage.get("accessibility:projector", false)
    };

    this.apply();
  }

  set(key, value) {
    if (!(key in this.state)) return;

    this.state[key] = Boolean(value);
    this.storage.set(`accessibility:${key}`, this.state[key]);
    this.apply();

    this.events.emit("accessibility:changed", {
      key,
      value: this.state[key],
      state: { ...this.state }
    });
  }

  toggle(key) {
    this.set(key, !this.state[key]);
    return this.state[key];
  }

  apply() {
    const root = document.documentElement;
    root.classList.toggle("reduced-motion", this.state.reducedMotion);
    root.classList.toggle("high-contrast", this.state.highContrast);
    root.classList.toggle("large-text", this.state.largeText);
    root.classList.toggle("projector-mode", this.state.projector);
  }
}
