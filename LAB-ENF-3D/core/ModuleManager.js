import { LAB_API_VERSION } from "../app/version.js";

export class ModuleManager {
  constructor({ events, services, host }) {
    this.events = events;
    this.services = services;
    this.host = host;
    this.catalog = [];
    this.active = null;
    this.activeStyleLinks = [];
  }

  async loadCatalog(url) {
    const response = await fetch(url, { cache: "no-cache" });
    if (!response.ok) {
      throw new Error(`Falha no catálogo (${response.status}).`);
    }

    this.catalog = await response.json();
    this.events.emit("catalog:loaded", this.catalog);
    return this.catalog;
  }

  getModule(id) {
    return this.catalog.find((item) => item.id === id);
  }

  loadStyles(manifest) {
    this.removeStyles();

    for (const href of manifest.styles || []) {
      const standaloneCss =
        globalThis.__LAB_STANDALONE_STYLE__?.(
          href
        );

      if (standaloneCss != null) {
        const style =
          document.createElement("style");
        style.dataset.moduleStyle =
          manifest.id;
        style.textContent =
          standaloneCss;
        document.head.append(style);
        this.activeStyleLinks.push(style);
        continue;
      }

      const link =
        document.createElement("link");
      link.rel = "stylesheet";
      link.href =
        new URL(
          href,
          window.location.href
        ).href;
      link.dataset.moduleStyle =
        manifest.id;
      document.head.append(link);
      this.activeStyleLinks.push(link);
    }
  }

  removeStyles() {
    for (const link of this.activeStyleLinks) {
      link.remove();
    }
    this.activeStyleLinks = [];
  }

  async open(id) {
    const manifest = this.getModule(id);

    if (!manifest) {
      throw new Error(`Módulo "${id}" não encontrado.`);
    }

    if (manifest.apiVersion !== LAB_API_VERSION) {
      throw new Error("Módulo incompatível com a API interna.");
    }

    await this.close();
    this.events.emit("module:loading", manifest);

    this.loadStyles(manifest);

    const standaloneEntry =
      globalThis.__LAB_STANDALONE_MODULE__?.(
        manifest.entry
      );

    const imported = await import(
      standaloneEntry ||
      new URL(
        manifest.entry,
        window.location.href
      ).href
    );

    const instance = imported.default;

    if (!instance?.mount) {
      throw new Error("Módulo sem mount().");
    }

    this.host.replaceChildren();

    try {
      await instance.mount({
        manifest,
        host: this.host,
        events: this.events,
        ...this.services
      });

      this.active = { manifest, instance };
      await instance.start?.();
      this.events.emit("module:started", manifest);
      return manifest;
    } catch (error) {
      this.removeStyles();
      throw error;
    }
  }

  async close() {
    if (!this.active) {
      this.removeStyles();
      return;
    }

    const current = this.active;

    try {
      current.instance.pause?.();

      const node =
        this.host?.firstElementChild;

      const reducedMotion =
        document.documentElement
          .classList.contains(
            "reduced-motion"
          );

      if (node && !reducedMotion) {
        node.classList.add(
          "module-exit-transition"
        );

        await new Promise(resolve =>
          setTimeout(resolve, 150)
        );
      }

      await current.instance.destroy?.();
    } finally {
      this.host.replaceChildren();
      this.active = null;
      this.removeStyles();
      this.events.emit("module:closed", current.manifest);
    }
  }
}
