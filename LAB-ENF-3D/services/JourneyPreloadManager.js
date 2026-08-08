export class JourneyPreloadManager {
  constructor({
    moduleManager,
    performanceBudget,
    graphics,
    events,
    maxAssets = 2
  }) {
    this.moduleManager = moduleManager;
    this.performanceBudget = performanceBudget;
    this.graphics = graphics;
    this.events = events;
    this.maxAssets = maxAssets;
    this.pending = null;
    this.links = new Set();
    this.lastModuleId = null;
  }

  connectionAllows() {
    if (globalThis.__LAB_STANDALONE__) {
      return false;
    }

    const connection =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection;

    if (!connection) return true;
    if (connection.saveData) return false;

    return !["slow-2g", "2g"].includes(connection.effectiveType);
  }

  cancel() {
    if (this.pending == null) return;

    if (typeof cancelIdleCallback === "function") {
      cancelIdleCallback(this.pending);
    } else {
      clearTimeout(this.pending);
    }

    this.pending = null;
  }

  schedule(journey, state) {
    this.cancel();

    if (!journey || !state || !this.connectionAllows()) return;

    const nextIndex = Number(state.stepIndex || 0) + 1;
    const nextStep = journey.steps?.[nextIndex];

    if (!nextStep?.moduleId) return;

    const run = () => {
      this.pending = null;
      this.preloadModule(nextStep.moduleId).catch(error => {
        this.events?.emit("preload:error", {
          moduleId: nextStep.moduleId,
          message: error?.message || String(error)
        });
      });
    };

    if (typeof requestIdleCallback === "function") {
      this.pending = requestIdleCallback(run, { timeout: 1800 });
    } else {
      this.pending = setTimeout(run, 900);
    }
  }

  addLink(rel, href, as = null) {
    const absolute = new URL(href, window.location.href).href;

    if (document.querySelector(`link[data-journey-preload="${absolute}"]`)) {
      return;
    }

    const link = document.createElement("link");
    link.rel = rel;
    link.href = absolute;
    link.dataset.journeyPreload = absolute;
    if (as) link.as = as;
    document.head.append(link);
    this.links.add(link);
  }


  preloadShell(moduleId) {
    if (!moduleId || !this.connectionAllows()) return;

    const manifest = this.moduleManager.getModule(moduleId);
    if (!manifest) return;

    this.addLink("modulepreload", manifest.entry);

    for (const stylesheet of manifest.styles || []) {
      this.addLink("prefetch", stylesheet, "style");
    }

    this.events?.emit("preload:shell", { moduleId });
  }

  warmCatalog(moduleIds = []) {
    if (!this.connectionAllows()) return;

    const ids = [...new Set(moduleIds.filter(Boolean))].slice(0, 2);
    if (!ids.length) return;

    const run = () => ids.forEach(id => this.preloadShell(id));

    if (typeof requestIdleCallback === "function") {
      requestIdleCallback(run, { timeout: 2400 });
    } else {
      setTimeout(run, 1400);
    }
  }

  async preloadModule(moduleId) {
    if (!moduleId || moduleId === this.lastModuleId) return;

    const manifest = this.moduleManager.getModule(moduleId);
    if (!manifest) return;

    this.lastModuleId = moduleId;

    this.addLink("modulepreload", manifest.entry);

    for (const stylesheet of manifest.styles || []) {
      this.addLink("prefetch", stylesheet, "style");
    }

    const profile = this.graphics.activeProfile || "medium";
    const budget = this.performanceBudget.get(moduleId, profile);
    const assets = (budget?.assets || []).slice(0, this.maxAssets);

    await Promise.allSettled(
      assets.map(asset =>
        fetch(new URL(asset.path, window.location.href).href, {
          cache: "force-cache"
        })
      )
    );

    this.events?.emit("preload:complete", {
      moduleId,
      profile,
      assets: assets.map(x => x.path)
    });
  }

  clearLinks() {
    for (const link of this.links) link.remove();
    this.links.clear();
  }

  destroy() {
    this.cancel();
    this.clearLinks();
    this.lastModuleId = null;
  }
}
