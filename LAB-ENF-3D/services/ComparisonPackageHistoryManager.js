export class ComparisonPackageHistoryManager {
  constructor({
    storage,
    key = "comparison-package-history",
    maxItems = 8
  } = {}) {
    this.storage = storage;
    this.key = key;
    this.maxItems = maxItems;
    this.items = storage?.get?.(key, []) || [];
  }

  record({
    filename = "",
    sourceAppVersion = null,
    compatible = false,
    applied = false,
    markers = 0,
    issues = 0,
    warnings = 0
  } = {}) {
    const now = new Date().toISOString();

    const item = {
      id:
        globalThis.crypto?.randomUUID?.() ||
        `pkg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      filename:
        String(filename || "pacote.json")
          .slice(0, 120),
      sourceAppVersion,
      compatible:Boolean(compatible),
      applied:Boolean(applied),
      markers:Number(markers) || 0,
      issues:Number(issues) || 0,
      warnings:Number(warnings) || 0,
      checkedAt:now,
      appliedAt:
        applied ? now : null
    };

    this.items = [
      item,
      ...this.items
    ].slice(0, this.maxItems);

    this.persist();
    return item;
  }

  markApplied(id) {
    const item =
      this.items.find(
        entry => entry.id === id
      );

    if (!item) return null;

    item.applied = true;
    item.appliedAt =
      new Date().toISOString();

    this.persist();
    return item;
  }

  list() {
    return [...this.items];
  }

  clear() {
    this.items = [];
    this.persist();
  }

  persist() {
    this.storage?.set?.(
      this.key,
      this.items
    );
  }
}
