export class ActivityManager {
  constructor({ storage, events }) {
    this.storage = storage;
    this.events = events;
    this.activities = [];
    this.active = storage.get("activity:active", null);
  }

  async loadCatalog(url) {
    const response = await fetch(url, { cache: "no-cache" });
    if (!response.ok) throw new Error(`Falha no catálogo de atividades (${response.status}).`);
    const data = await response.json();
    this.activities = data.activities || [];
    this.events.emit("activities:loaded", this.activities);
    return this.activities;
  }

  normalizeCode(code = "") {
    return code.trim().toUpperCase().replace(/\s+/g, "");
  }

  getByCode(code) {
    const normalized = this.normalizeCode(code);
    return this.activities.find(a => this.normalizeCode(a.code) === normalized) || null;
  }

  getById(id) {
    return this.activities.find(a => a.id === id) || null;
  }

  activate(activityOrId) {
    const activity = typeof activityOrId === "string"
      ? this.getById(activityOrId)
      : activityOrId;

    if (!activity) return null;

    this.active = {
      id: activity.id,
      code: activity.code,
      moduleId: activity.moduleId,
      activatedAt: new Date().toISOString()
    };

    this.storage.set("activity:active", this.active);
    this.events.emit("activity:activated", activity);
    return activity;
  }

  activateByCode(code) {
    const activity = this.getByCode(code);
    if (!activity) return null;
    return this.activate(activity);
  }

  getActiveActivity() {
    if (!this.active) return null;
    return this.getById(this.active.id);
  }

  clearActive() {
    this.active = null;
    this.storage.remove("activity:active");
    this.events.emit("activity:cleared");
  }

  saveCheckpoint(activityId, index, checked) {
    const key = `activity:checkpoints:${activityId}`;
    const current = this.storage.get(key, {});
    current[index] = Boolean(checked);
    this.storage.set(key, current);
    this.events.emit("activity:checkpoint", { activityId, index, checked });
    return current;
  }

  getCheckpoints(activityId) {
    return this.storage.get(`activity:checkpoints:${activityId}`, {});
  }
}
