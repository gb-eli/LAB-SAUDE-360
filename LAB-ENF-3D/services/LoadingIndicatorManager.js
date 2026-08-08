export class LoadingIndicatorManager {
  constructor({ host, events }) {
    this.host = host;
    this.events = events;
    this.active = new Map();

    this.node = document.createElement("div");
    this.node.className = "global-loading-indicator";
    this.node.hidden = true;
    this.node.setAttribute("role", "status");
    this.node.setAttribute("aria-live", "polite");
    this.node.setAttribute("aria-atomic", "true");
    this.node.innerHTML = `
      <div class="loading-spinner" aria-hidden="true"></div>
      <div class="loading-copy">
        <strong>Carregando conteúdo 3D</strong>
        <span data-loading-label>Preparando modelo…</span>
        <div class="loading-track" aria-hidden="true">
          <i data-loading-bar></i>
        </div>
      </div>
    `;
    host.append(this.node);

    this.unsubscribers = [
      events.on("asset3d:loading", payload => this.start(payload)),
      events.on("asset3d:progress", payload => this.progress(payload)),
      events.on("asset3d:loaded", payload => this.finish(payload)),
      events.on("asset3d:error", payload => this.finish(payload, true))
    ];
  }

  filename(url = "") {
    try {
      return decodeURIComponent(String(url).split("/").pop() || "modelo 3D");
    } catch {
      return "modelo 3D";
    }
  }

  start({ url } = {}) {
    if (!url) return;
    this.active.set(url, { ratio: null, startedAt: performance.now() });
    this.host?.setAttribute("aria-busy", "true");
    this.render(url);
  }

  progress({ url, ratio } = {}) {
    if (!url || !this.active.has(url)) return;
    this.active.set(url, {
      ...this.active.get(url),
      ratio: Number.isFinite(ratio) ? Math.max(0, Math.min(1, ratio)) : null
    });
    this.render(url);
  }

  finish({ url } = {}, failed = false) {
    if (url) this.active.delete(url);

    if (!this.active.size) {
      this.node.hidden = true;
      this.node.classList.remove("error");
      this.host?.setAttribute("aria-busy", "false");
      return;
    }

    const current = [...this.active.keys()].at(-1);
    this.render(current);

    if (failed) this.node.classList.add("error");
  }

  render(currentUrl) {
    const current = this.active.get(currentUrl);
    this.node.hidden = false;
    this.node.classList.remove("error");

    const label = this.node.querySelector("[data-loading-label]");
    const bar = this.node.querySelector("[data-loading-bar]");

    if (current?.ratio != null) {
      const percent = Math.round(current.ratio * 100);
      label.textContent = `${this.filename(currentUrl)} · ${percent}%`;
      bar.style.width = `${percent}%`;
      bar.parentElement.classList.remove("indeterminate");
    } else {
      label.textContent = this.filename(currentUrl);
      bar.style.width = "38%";
      bar.parentElement.classList.add("indeterminate");
    }
  }

  clear() {
    this.active.clear();
    this.host?.setAttribute("aria-busy", "false");
    if (this.node) this.node.hidden = true;
  }

  destroy() {
    this.unsubscribers.forEach(fn => fn?.());
    this.unsubscribers = [];
    this.clear();
    this.node?.remove();
    this.node = null;
    this.host = null;
    this.events = null;
  }
}
