export class ProgressManager {
  constructor({ storage, events }) {
    this.storage = storage;
    this.events = events;
  }

  getModuleProgress(moduleId) {
    return this.storage.get(`progress:${moduleId}`, {});
  }

  saveModuleProgress(moduleId, data) {
    const value = {
      ...this.getModuleProgress(moduleId),
      ...data,
      updatedAt: new Date().toISOString()
    };
    this.storage.set(`progress:${moduleId}`, value);
    this.events.emit("progress:updated", { moduleId, value });
    return value;
  }

  recordModuleOpen(moduleId) {
    const current = this.getModuleProgress(moduleId);
    return this.saveModuleProgress(moduleId, {
      opens: Number(current.opens || 0) + 1,
      lastOpenedAt: new Date().toISOString()
    });
  }

  recordModuleClose(moduleId) {
    return this.saveModuleProgress(moduleId, {
      lastClosedAt: new Date().toISOString()
    });
  }

  markComplete(moduleId, activityId = null) {
    const current = this.getModuleProgress(moduleId);
    const completions = Array.isArray(current.completions)
      ? [...current.completions]
      : [];

    if (activityId && !completions.includes(activityId)) {
      completions.push(activityId);
    }

    return this.saveModuleProgress(moduleId, {
      completed: true,
      completedAt: new Date().toISOString(),
      completions
    });
  }

  getAll(moduleIds = []) {
    return moduleIds.reduce((acc, id) => {
      acc[id] = this.getModuleProgress(id);
      return acc;
    }, {});
  }

  resetModule(moduleId) {
    this.storage.remove(`progress:${moduleId}`);
    this.events.emit("progress:reset", { moduleId });
  }

  resetAll(moduleIds = []) {
    for (const id of moduleIds) this.storage.remove(`progress:${id}`);
    this.events.emit("progress:resetAll", { moduleIds });
  }
}
