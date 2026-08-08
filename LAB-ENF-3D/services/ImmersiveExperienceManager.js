export class ImmersiveExperienceManager {
  constructor({
    moduleView,
    host,
    storage,
    events
  } = {}) {
    this.moduleView = moduleView;
    this.host = host;
    this.storage = storage;
    this.events = events;
    this.data = { modules:{}, default:{} };
    this.activeModule = null;
    this.activeGuide = null;
    this.stepIndex = 0;
    this.cinema = false;
    this.hud = true;

    this.onClick =
      this.onClick.bind(this);

    this.moduleView?.addEventListener(
      "click",
      this.onClick
    );
  }

  setData(data = {}) {
    this.data = {
      default:{},
      modules:{},
      ...data
    };
  }

  guideFor(module) {
    return {
      ...(this.data.default || {}),
      ...(this.data.modules?.[module?.id] || {})
    };
  }

  visualFor(module) {
    const guide = this.guideFor(module);
    const category =
      String(module?.category || "")
        .toLowerCase();

    let tone =
      guide.tone || "clinical";

    if (!guide.tone) {
      if (category.includes("anatom")) tone="anatomy";
      else if (category.includes("ambiente")) tone="facility";
      else if (category.includes("materno")) tone="maternity";
      else if (category.includes("segurança")) tone="safety";
    }

    return {
      code:
        guide.code ||
        String(module?.name || "LAB")
          .replace(/[^A-Za-zÀ-ÿ0-9 ]/g," ")
          .split(/\s+/)
          .filter(Boolean)
          .slice(0,2)
          .map(x=>x[0])
          .join("")
          .toUpperCase() ||
        "LAB",
      tone,
      tagline:
        guide.tagline ||
        module?.experience ||
        "Exploração interativa",
      headline:
        guide.headline ||
        module?.name ||
        "Laboratório"
    };
  }

  featuredModules(catalog = []) {
    const ids =
      this.data.featured || [];

    return ids
      .map(id =>
        catalog.find(module =>
          module.id === id
        )
      )
      .filter(Boolean);
  }

  cardVisual(module) {
    const visual =
      this.visualFor(module);

    return `
      <div class="module-card-visual" data-tone="${this.escape(visual.tone)}" aria-hidden="true">
        <div class="module-card-orbit orbit-a"></div>
        <div class="module-card-orbit orbit-b"></div>
        <div class="module-card-symbol">${this.escape(visual.code)}</div>
        <span>${this.escape(visual.tagline)}</span>
      </div>
    `;
  }

  featuredCard(module) {
    const visual =
      this.visualFor(module);

    return `
      <button class="featured-experience-card" data-open="${this.escape(module.id)}" data-tone="${this.escape(visual.tone)}">
        <span class="featured-code">${this.escape(visual.code)}</span>
        <span class="eyebrow">${this.escape(module.category)}</span>
        <strong>${this.escape(visual.headline)}</strong>
        <small>${this.escape(visual.tagline)} · ${this.escape(module.generation || "SIM")}</small>
        <span class="featured-enter">Entrar na experiência →</span>
      </button>
    `;
  }

  activate(module) {
    this.activeModule = module;
    this.activeGuide =
      this.guideFor(module);
    this.stepIndex = 0;

    const visual =
      this.visualFor(module);

    this.moduleView.dataset.experienceTone =
      visual.tone;

    this.moduleView.classList.add(
      "experience-active"
    );

    const badge =
      this.moduleView.querySelector(
        "[data-experience-badge]"
      );

    if (badge) {
      badge.textContent =
        `${visual.code} · ${visual.tagline}`;
    }

    this.renderGuide();
    this.applyHud();
  }

  deactivate() {
    this.closeGuide();
    this.setCinema(false);
    this.hud = true;
    this.applyHud();

    this.activeModule = null;
    this.activeGuide = null;
    this.stepIndex = 0;

    if (this.moduleView) {
      delete this.moduleView.dataset.experienceTone;
      this.moduleView.classList.remove(
        "experience-active"
      );
    }
  }

  steps() {
    return (
      this.activeGuide?.steps ||
      this.data.default?.steps ||
      []
    );
  }

  renderGuide() {
    const panel =
      this.moduleView?.querySelector(
        "[data-experience-guide-panel]"
      );

    if (!panel) return;

    const steps = this.steps();

    if (!steps.length) {
      panel.innerHTML = "";
      return;
    }

    const step =
      steps[
        Math.max(
          0,
          Math.min(
            this.stepIndex,
            steps.length - 1
          )
        )
      ];

    panel.innerHTML = `
      <div class="experience-guide-progress">
        <span>PASSO ${this.stepIndex + 1}</span>
        <div><i style="width:${((this.stepIndex + 1) / steps.length) * 100}%"></i></div>
        <b>${steps.length}</b>
      </div>
      <div class="experience-guide-copy">
        <span class="eyebrow">Exploração guiada</span>
        <h3>${this.escape(step.title)}</h3>
        <p>${this.escape(step.text)}</p>
      </div>
      <div class="experience-guide-actions">
        <button data-experience-prev ${this.stepIndex === 0 ? "disabled" : ""}>← Anterior</button>
        <button data-experience-next>${this.stepIndex >= steps.length - 1 ? "Concluir" : "Próximo →"}</button>
        <button data-experience-close>Fechar</button>
      </div>
    `;

    this.highlightStep(step);
  }

  highlightStep(step) {
    this.clearHighlights();

    if (!step?.selector) return;

    const selectors =
      step.selector
        .split(",")
        .map(x=>x.trim())
        .filter(Boolean);

    for (const selector of selectors) {
      const target =
        this.host?.querySelector(selector) ||
        this.moduleView?.querySelector(selector);

      if (target) {
        target.classList.add(
          "experience-highlight"
        );
        break;
      }
    }
  }

  clearHighlights() {
    this.moduleView
      ?.querySelectorAll(
        ".experience-highlight"
      )
      .forEach(node =>
        node.classList.remove(
          "experience-highlight"
        )
      );
  }

  openGuide() {
    const panel =
      this.moduleView?.querySelector(
        "[data-experience-guide]"
      );

    if (!panel) return;

    this.stepIndex = 0;
    panel.hidden = false;
    panel.classList.add("open");
    this.renderGuide();

    this.events?.emit?.(
      "experience:guideOpened",
      { moduleId:this.activeModule?.id }
    );
  }

  closeGuide() {
    const panel =
      this.moduleView?.querySelector(
        "[data-experience-guide]"
      );

    if (panel) {
      panel.hidden = true;
      panel.classList.remove("open");
    }

    this.clearHighlights();
  }

  next() {
    const steps = this.steps();

    if (
      this.stepIndex >=
      steps.length - 1
    ) {
      this.storage?.set?.(
        `experience:guide:${this.activeModule?.id}`,
        {
          completedAt:
            new Date().toISOString()
        }
      );

      this.closeGuide();
      return;
    }

    this.stepIndex += 1;
    this.renderGuide();
  }

  previous() {
    if (this.stepIndex <= 0) return;
    this.stepIndex -= 1;
    this.renderGuide();
  }

  setCinema(value) {
    this.cinema =
      Boolean(value);

    document.documentElement
      .classList.toggle(
        "experience-cinema",
        this.cinema
      );

    this.moduleView
      ?.classList.toggle(
        "cinema-active",
        this.cinema
      );

    const button =
      this.moduleView?.querySelector(
        "#experience-cinema"
      );

    if (button) {
      button.classList.toggle(
        "active",
        this.cinema
      );
      button.setAttribute(
        "aria-pressed",
        String(this.cinema)
      );
    }
  }

  toggleCinema() {
    this.setCinema(!this.cinema);
  }

  applyHud() {
    this.moduleView
      ?.classList.toggle(
        "experience-hud-hidden",
        !this.hud
      );

    const button =
      this.moduleView?.querySelector(
        "#experience-hud"
      );

    if (button) {
      button.classList.toggle(
        "active",
        !this.hud
      );
      button.setAttribute(
        "aria-pressed",
        String(!this.hud)
      );
    }
  }

  toggleHud() {
    this.hud = !this.hud;
    this.applyHud();
  }

  onClick(event) {
    if (
      event.target.closest(
        "#experience-guide"
      )
    ) {
      this.openGuide();
      return;
    }

    if (
      event.target.closest(
        "#experience-cinema"
      )
    ) {
      this.toggleCinema();
      return;
    }

    if (
      event.target.closest(
        "#experience-hud"
      )
    ) {
      this.toggleHud();
      return;
    }

    if (
      event.target.closest(
        "[data-experience-next]"
      )
    ) {
      this.next();
      return;
    }

    if (
      event.target.closest(
        "[data-experience-prev]"
      )
    ) {
      this.previous();
      return;
    }

    if (
      event.target.closest(
        "[data-experience-close]"
      )
    ) {
      this.closeGuide();
    }
  }

  escape(value = "") {
    return String(value)
      .replace(
        /[&<>"']/g,
        char => ({
          "&":"&amp;",
          "<":"&lt;",
          ">":"&gt;",
          '"':"&quot;",
          "'":"&#039;"
        }[char])
      );
  }

  destroy() {
    this.deactivate();

    this.moduleView?.removeEventListener(
      "click",
      this.onClick
    );

    this.moduleView = null;
    this.host = null;
    this.storage = null;
    this.events = null;
    this.data = null;
  }
}
