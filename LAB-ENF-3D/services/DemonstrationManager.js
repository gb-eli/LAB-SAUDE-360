export class DemonstrationManager {
  constructor({
    panel,
    toggleButton,
    openModule,
    closeModule = null,
    setCinema = null,
    toast = null
  } = {}) {
    this.panel = panel;
    this.toggleButton = toggleButton;
    this.openModule = openModule;
    this.closeModule = closeModule;
    this.setCinema = setCinema;
    this.toast = toast;

    this.data = {
      defaultDwellMs:22000,
      sequences:[]
    };

    this.sequence = null;
    this.index = -1;
    this.running = false;
    this.timer = 0;
    this.busy = false;
    this.cinema = true;

    this.onClick =
      this.onClick.bind(this);
    this.onChange =
      this.onChange.bind(this);

    this.panel?.addEventListener(
      "click",
      this.onClick
    );

    this.panel?.addEventListener(
      "change",
      this.onChange
    );

    this.toggleButton
      ?.addEventListener(
        "click",
        () => this.togglePanel()
      );
  }

  setData(data = {}) {
    this.data = {
      defaultDwellMs:22000,
      sequences:[],
      ...data
    };

    this.render();
  }

  currentItem() {
    return (
      this.sequence
        ?.modules?.[
          this.index
        ] ||
      null
    );
  }

  togglePanel() {
    if (!this.panel) return;

    const open =
      !this.panel.classList
        .contains("open");

    this.panel.classList.toggle(
      "open",
      open
    );

    this.panel.setAttribute(
      "aria-hidden",
      String(!open)
    );

    this.render();
  }

  closePanel() {
    this.panel?.classList.remove(
      "open"
    );

    this.panel?.setAttribute(
      "aria-hidden",
      "true"
    );
  }

  setSequence(id) {
    const next =
      this.data.sequences.find(
        sequence =>
          sequence.id === id
      ) ||
      this.data.sequences[0] ||
      null;

    if (
      this.sequence?.id !==
      next?.id
    ) {
      this.stop({
        close:false
      });
      this.index = -1;
    }

    this.sequence = next;
    this.render();
  }

  async start() {
    if (
      !this.sequence ||
      !this.sequence.modules?.length ||
      this.busy
    ) {
      return false;
    }

    this.running = true;

    if (this.index < 0) {
      await this.goTo(0);
    } else {
      this.applyCinema();
      this.schedule();
    }

    this.render();
    return true;
  }

  pause() {
    this.running = false;
    clearTimeout(this.timer);
    this.timer = 0;
    this.render();
  }

  stop({
    close = false
  } = {}) {
    this.running = false;
    this.index = -1;

    clearTimeout(this.timer);
    this.timer = 0;

    this.setCinema?.(false);

    if (close) {
      this.closeModule?.();
    }

    this.render();
  }

  toggleRun() {
    if (this.running) {
      this.pause();
    } else {
      this.start();
    }
  }

  applyCinema() {
    this.setCinema?.(
      Boolean(this.cinema)
    );
  }

  dwellFor(item) {
    return (
      Number(item?.dwellMs) ||
      Number(
        this.data
          .defaultDwellMs
      ) ||
      22000
    );
  }

  async goTo(index) {
    if (
      !this.sequence ||
      !this.sequence.modules?.length ||
      this.busy
    ) {
      return false;
    }

    this.busy = true;
    clearTimeout(this.timer);

    try {
      const total =
        this.sequence.modules.length;

      this.index =
        ((index % total) + total) %
        total;

      const item =
        this.currentItem();

      if (!item) return false;

      await this.openModule?.(
        item.moduleId
      );

      this.applyCinema();

      this.toast?.(
        `Demonstração: ${item.label}`
      );

      this.render();

      if (this.running) {
        this.schedule();
      }

      return true;
    } finally {
      this.busy = false;
    }
  }

  next() {
    return this.goTo(
      this.index + 1
    );
  }

  previous() {
    return this.goTo(
      this.index - 1
    );
  }

  schedule() {
    clearTimeout(this.timer);

    if (!this.running) return;

    this.timer =
      setTimeout(
        () => this.next(),
        this.dwellFor(
          this.currentItem()
        )
      );
  }

  render() {
    if (!this.panel) return;

    const select =
      this.panel.querySelector(
        "[data-demo-sequence]"
      );

    if (select) {
      select.innerHTML =
        this.data.sequences
          .map(sequence => `
            <option value="${this.escape(sequence.id)}" ${sequence.id===this.sequence?.id?"selected":""}>
              ${this.escape(sequence.title)}
            </option>
          `)
          .join("");
    }

    const title =
      this.panel.querySelector(
        "[data-demo-title]"
      );

    const description =
      this.panel.querySelector(
        "[data-demo-description]"
      );

    if (title) {
      title.textContent =
        this.sequence?.title ||
        "Modo Demonstração";
    }

    if (description) {
      description.textContent =
        this.sequence
          ?.description ||
        "Escolha uma sequência para apresentação.";
    }

    const item =
      this.currentItem();

    const status =
      this.panel.querySelector(
        "[data-demo-status]"
      );

    if (status) {
      status.innerHTML =
        item
          ? `<strong>${this.index+1}/${this.sequence.modules.length}</strong><span>${this.escape(item.label)}</span><small>${Math.round(this.dwellFor(item)/1000)} s</small>`
          : `<strong>—</strong><span>Pronto para iniciar</span>`;
    }

    const list =
      this.panel.querySelector(
        "[data-demo-list]"
      );

    if (list) {
      list.innerHTML =
        (this.sequence?.modules || [])
          .map((entry,index) => `
            <button type="button" data-demo-index="${index}" class="${index===this.index?"active":""}">
              <b>${index+1}</b>
              <span>${this.escape(entry.label)}</span>
              <small>${Math.round(this.dwellFor(entry)/1000)}s</small>
            </button>
          `)
          .join("");
    }

    const play =
      this.panel.querySelector(
        "[data-demo-play]"
      );

    if (play) {
      play.textContent =
        this.running
          ? "❚❚ Pausar"
          : this.index >= 0
            ? "▶ Retomar"
            : "▶ Iniciar";
      play.classList.toggle(
        "active",
        this.running
      );
    }

    const cinema =
      this.panel.querySelector(
        "[data-demo-cinema]"
      );

    if (cinema) {
      cinema.checked =
        this.cinema;
    }
  }

  onChange(event) {
    const sequence =
      event.target.closest(
        "[data-demo-sequence]"
      );

    if (sequence) {
      this.setSequence(
        sequence.value
      );
      return;
    }

    const cinema =
      event.target.closest(
        "[data-demo-cinema]"
      );

    if (cinema) {
      this.cinema =
        Boolean(
          cinema.checked
        );

      if (this.index >= 0) {
        this.applyCinema();
      }
    }
  }

  onClick(event) {
    if (
      event.target.closest(
        "[data-demo-close]"
      )
    ) {
      this.closePanel();
      return;
    }

    if (
      event.target.closest(
        "[data-demo-play]"
      )
    ) {
      this.toggleRun();
      return;
    }

    if (
      event.target.closest(
        "[data-demo-prev]"
      )
    ) {
      this.previous();
      return;
    }

    if (
      event.target.closest(
        "[data-demo-next]"
      )
    ) {
      this.next();
      return;
    }

    if (
      event.target.closest(
        "[data-demo-stop]"
      )
    ) {
      this.stop({
        close:true
      });
      return;
    }

    const entry =
      event.target.closest(
        "[data-demo-index]"
      );

    if (entry) {
      this.goTo(
        Number(
          entry.dataset.demoIndex
        )
      );
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
    this.stop();

    this.panel?.removeEventListener(
      "click",
      this.onClick
    );

    this.panel?.removeEventListener(
      "change",
      this.onChange
    );

    this.panel = null;
    this.toggleButton = null;
    this.openModule = null;
    this.closeModule = null;
    this.setCinema = null;
    this.toast = null;
  }
}
