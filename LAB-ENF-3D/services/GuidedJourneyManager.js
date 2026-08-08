export class GuidedJourneyManager {
  constructor({ storage, events }) {
    this.storage = storage;
    this.events = events;
    this.journeys = [];
    this.active = storage.get("journey:active", null);
  }

  async loadCatalog(url) {
    const response = await fetch(url, { cache: "no-cache" });
    if (!response.ok) {
      throw new Error(`Falha no catálogo de jornadas (${response.status}).`);
    }

    const data = await response.json();
    this.journeys = data.journeys || [];
    this.events.emit("journeys:loaded", this.journeys);
    return this.journeys;
  }

  getById(id) {
    return this.journeys.find(j => j.id === id) || null;
  }

  normalizeCode(code = "") {
    return String(code).trim().toUpperCase().replace(/\s+/g, "");
  }

  getByCode(code) {
    const normalized = this.normalizeCode(code);
    return this.journeys.find(j => this.normalizeCode(j.code) === normalized) || null;
  }

  start(journeyOrId) {
    const journey = typeof journeyOrId === "string"
      ? this.getById(journeyOrId)
      : journeyOrId;

    if (!journey) return null;

    this.active = {
      id: journey.id,
      code: journey.code,
      stepIndex: 0,
      completedSteps: [],
      startedAt: new Date().toISOString()
    };

    this.storage.set("journey:active", this.active);
    this.events.emit("journey:started", {
      journey,
      state: this.active
    });

    return journey;
  }

  getActiveJourney() {
    if (!this.active) return null;
    return this.getById(this.active.id);
  }

  getState() {
    return this.active;
  }

  getCurrentStep() {
    const journey = this.getActiveJourney();
    if (!journey || !this.active) return null;
    return journey.steps[this.active.stepIndex] || null;
  }

  goTo(index) {
    const journey = this.getActiveJourney();
    if (!journey) return null;

    const max = journey.steps.length - 1;
    this.active.stepIndex = Math.max(0, Math.min(max, Number(index) || 0));
    this.storage.set("journey:active", this.active);

    const step = this.getCurrentStep();
    this.events.emit("journey:stepChanged", {
      journey,
      state: this.active,
      step
    });

    return step;
  }

  markCurrentComplete() {
    if (!this.active) return null;

    if (!this.active.completedSteps.includes(this.active.stepIndex)) {
      this.active.completedSteps = [
        ...this.active.completedSteps,
        this.active.stepIndex
      ];
    }

    this.storage.set("journey:active", this.active);
    this.events.emit("journey:stepCompleted", {
      journey: this.getActiveJourney(),
      state: this.active,
      step: this.getCurrentStep()
    });

    return this.active;
  }

  next() {
    const journey = this.getActiveJourney();
    if (!journey || !this.active) return null;

    this.markCurrentComplete();

    if (this.active.stepIndex >= journey.steps.length - 1) {
      this.events.emit("journey:completed", {
        journey,
        state: this.active
      });
      return null;
    }

    return this.goTo(this.active.stepIndex + 1);
  }

  previous() {
    if (!this.active) return null;
    return this.goTo(this.active.stepIndex - 1);
  }

  finish() {
    const journey = this.getActiveJourney();
    const state = this.active;

    if (journey && state) {
      const record = {
        ...state,
        finishedAt: new Date().toISOString()
      };
      this.storage.set(`journey:history:${journey.id}`, record);
      this.events.emit("journey:finished", { journey, state: record });
    }

    this.active = null;
    this.storage.remove("journey:active");
  }
}
