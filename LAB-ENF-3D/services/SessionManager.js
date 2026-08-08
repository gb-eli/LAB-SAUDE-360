export class SessionManager {
  constructor({ storage, events }) {
    this.storage = storage;
    this.events = events;

    const migratedCurrent =
      storage.get("session:current", null) ||
      storage.get("student:session:current", null);

    const migratedHistory =
      storage.get("session:history", null) ||
      storage.get("student:session:history", []);

    this.current = migratedCurrent;
    this.history = migratedHistory || [];

    if (migratedCurrent) storage.set("session:current", migratedCurrent);
    if (migratedHistory) storage.set("session:history", migratedHistory);
  }

  start({ displayName = "", groupName = "", journeyId = null } = {}) {
    if (this.current?.active) this.finish();

    this.current = {
      id: `SES-${Date.now().toString(36).toUpperCase()}`,
      active: true,
      displayName: String(displayName || "").trim(),
      groupName: String(groupName || "").trim(),
      journeyId,
      startedAt: new Date().toISOString(),
      finishedAt: null,
      visitedModules: [],
      events: [],
      assessments: []
    };

    this.storage.set("session:current", this.current);
    this.events.emit("session:started", this.current);
    return this.current;
  }

  getCurrent() {
    return this.current;
  }

  isActive() {
    return Boolean(this.current?.active);
  }

  update(patch = {}) {
    if (!this.current) return null;
    this.current = { ...this.current, ...patch };
    this.storage.set("session:current", this.current);
    return this.current;
  }

  recordEvent(type, data = {}) {
    if (!this.current?.active) return;

    const event = {
      type,
      at: new Date().toISOString(),
      ...data
    };

    this.current.events = [...(this.current.events || []), event].slice(-300);
    this.storage.set("session:current", this.current);
    this.events.emit("session:event", event);
  }

  recordModule(moduleId, moduleName = "") {
    if (!this.current?.active) return;

    const existing = this.current.visitedModules.find(x => x.moduleId === moduleId);

    if (existing) {
      existing.opens = Number(existing.opens || 0) + 1;
      existing.lastOpenedAt = new Date().toISOString();
    } else {
      this.current.visitedModules.push({
        moduleId,
        moduleName,
        opens: 1,
        firstOpenedAt: new Date().toISOString(),
        lastOpenedAt: new Date().toISOString()
      });
    }

    this.recordEvent("module:opened", { moduleId, moduleName });
  }

  recordAssessment(attempt) {
    if (!this.current?.active || !attempt) return;

    this.current.assessments = [
      ...(this.current.assessments || []),
      attempt
    ].slice(-50);

    this.recordEvent("assessment:submitted", {
      activityId: attempt.activityId,
      percent: attempt.percent
    });
  }

  finish() {
    if (!this.current) return null;

    const finished = {
      ...this.current,
      active: false,
      finishedAt: new Date().toISOString()
    };

    this.history = [finished, ...this.history].slice(0, 20);
    this.storage.set("session:history", this.history);
    this.storage.set("session:current", finished);

    this.current = finished;
    this.events.emit("session:finished", finished);
    return finished;
  }

  clearCurrent() {
    this.current = null;
    this.storage.remove("session:current");
    this.events.emit("session:cleared");
  }

  getHistory() {
    return this.history;
  }
}
