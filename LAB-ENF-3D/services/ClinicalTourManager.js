export class ClinicalTourManager {
  constructor({
    stage,
    engine = null,
    items = [],
    getId = item => item?.mesh,
    getLabel = item =>
      item?.name ||
      item?.title ||
      item?.mesh ||
      "Ponto",
    onSelect = null,
    interval = 4600,
    pauseOnInteraction = true
  } = {}) {
    this.stage = stage;
    this.engine = engine;
    this.items = Array.isArray(items)
      ? items
      : [];
    this.getId = getId;
    this.getLabel = getLabel;
    this.onSelect = onSelect;
    this.interval = interval;
    this.pauseOnInteraction =
      Boolean(pauseOnInteraction);

    this.index = -1;
    this.running = false;
    this.timer = 0;
    this.busy = false;
    this.interactionPaused = false;

    this.onClick =
      this.onClick.bind(this);
    this.onManualInteraction =
      this.onManualInteraction.bind(this);

    this.mount();
  }

  mount() {
    if (!this.stage) return;

    this.controls =
      document.createElement("div");
    this.controls.className =
      "clinical-tour-controls";
    this.controls.innerHTML = `
      <button type="button" data-tour-play aria-pressed="false">▶ Tour</button>
      <button type="button" data-tour-prev>Anterior</button>
      <button type="button" data-tour-next>Próximo</button>
      <span data-tour-status>Exploração livre</span>
    `;

    this.stage.append(
      this.controls
    );

    this.stage.addEventListener(
      "click",
      this.onClick
    );

    if (this.pauseOnInteraction) {
      this.stage.addEventListener(
        "pointerdown",
        this.onManualInteraction,
        { passive:true }
      );

      this.stage.addEventListener(
        "wheel",
        this.onManualInteraction,
        { passive:true }
      );

      this.stage.addEventListener(
        "keydown",
        this.onManualInteraction
      );

      this.engine?.controls
        ?.addEventListener?.(
          "start",
          this.onManualInteraction
        );
    }
  }

  setItems(items = []) {
    this.stop({
      preserveStatus:true
    });

    this.items =
      Array.isArray(items)
        ? items
        : [];

    this.index = -1;
    this.interactionPaused = false;
    this.renderStatus();
  }

  current() {
    return (
      this.items[
        this.index
      ] ||
      null
    );
  }

  effectiveInterval() {
    const projector =
      document.documentElement
        .classList.contains(
          "projector-mode"
        );

    return projector
      ? Math.max(
          this.interval,
          5600
        )
      : this.interval;
  }

  start() {
    if (
      !this.items.length ||
      this.busy
    ) {
      return false;
    }

    this.running = true;
    this.interactionPaused = false;

    this.syncPlayButton();

    if (this.index < 0) {
      this.next();
    } else {
      this.renderStatus();
      this.schedule();
    }

    return true;
  }

  stop({
    preserveStatus = false
  } = {}) {
    this.running = false;

    clearTimeout(this.timer);
    this.timer = 0;

    this.syncPlayButton();

    if (!preserveStatus) {
      this.renderStatus();
    }
  }

  pauseForInteraction() {
    if (!this.running) return;

    this.running = false;
    this.interactionPaused = true;

    clearTimeout(this.timer);
    this.timer = 0;

    this.syncPlayButton();
    this.renderStatus();
  }

  onManualInteraction(event) {
    if (
      event?.target?.closest?.(
        ".clinical-tour-controls"
      )
    ) {
      return;
    }

    this.pauseForInteraction();
  }

  toggle() {
    if (this.running) {
      this.stop();
    } else {
      this.start();
    }
  }

  async goTo(
    index,
    {
      keepSchedule = true
    } = {}
  ) {
    if (
      !this.items.length ||
      this.busy
    ) {
      return false;
    }

    this.busy = true;

    try {
      const total =
        this.items.length;

      this.index =
        ((index % total) + total) %
        total;

      const item =
        this.current();

      const id =
        this.getId(item);

      if (id) {
        await this.onSelect?.(
          id,
          item,
          {
            source:"tour",
            index:this.index,
            total
          }
        );
      }

      this.renderStatus();

      if (
        this.running &&
        keepSchedule
      ) {
        this.schedule();
      }

      return true;
    } finally {
      this.busy = false;
    }
  }

  next(options = {}) {
    return this.goTo(
      this.index + 1,
      options
    );
  }

  previous(options = {}) {
    return this.goTo(
      this.index - 1,
      options
    );
  }

  schedule() {
    clearTimeout(this.timer);

    if (!this.running) return;

    this.timer =
      setTimeout(
        () =>
          this.next(),
        this.effectiveInterval()
      );
  }

  syncPlayButton() {
    const play =
      this.controls?.querySelector(
        "[data-tour-play]"
      );

    play?.setAttribute(
      "aria-pressed",
      String(this.running)
    );

    if (!play) return;

    if (this.running) {
      play.textContent =
        "❚❚ Pausar";
      play.classList.add("active");
      return;
    }

    play.textContent =
      this.interactionPaused
        ? "▶ Retomar"
        : "▶ Tour";

    play.classList.remove("active");
  }

  renderStatus() {
    const status =
      this.controls?.querySelector(
        "[data-tour-status]"
      );

    if (!status) return;

    const item =
      this.current();

    if (
      this.interactionPaused &&
      item
    ) {
      status.textContent =
        `Pausado pela interação · ${this.index+1}/${this.items.length} · ${this.getLabel(item)}`;
      return;
    }

    status.textContent =
      item
        ? `${this.index+1}/${this.items.length} · ${this.getLabel(item)}`
        : "Exploração livre";
  }

  onClick(event) {
    if (
      event.target.closest(
        "[data-tour-play]"
      )
    ) {
      this.toggle();
      return;
    }

    if (
      event.target.closest(
        "[data-tour-prev]"
      )
    ) {
      this.previous({
        keepSchedule:
          this.running
      });
      return;
    }

    if (
      event.target.closest(
        "[data-tour-next]"
      )
    ) {
      this.next({
        keepSchedule:
          this.running
      });
    }
  }

  destroy() {
    this.stop({
      preserveStatus:true
    });

    this.stage?.removeEventListener(
      "click",
      this.onClick
    );

    this.stage?.removeEventListener(
      "pointerdown",
      this.onManualInteraction
    );

    this.stage?.removeEventListener(
      "wheel",
      this.onManualInteraction
    );

    this.stage?.removeEventListener(
      "keydown",
      this.onManualInteraction
    );

    this.engine?.controls
      ?.removeEventListener?.(
        "start",
        this.onManualInteraction
      );

    this.controls?.remove();

    this.stage = null;
    this.engine = null;
    this.items = [];
    this.onSelect = null;
  }
}
