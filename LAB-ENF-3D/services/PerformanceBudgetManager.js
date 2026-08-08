export class PerformanceBudgetManager {
  constructor({ assets, events }) {
    this.assets = assets;
    this.events = events;
    this.data = { modules: {}, profiles: {} };
  }

  async load(url = "./data/performance-budget.json") {
    this.data = await this.assets.loadJson(url);
    this.events?.emit("performanceBudget:loaded", this.data);
    return this.data;
  }

  get(moduleId, profile = "medium") {
    return this.data.modules?.[moduleId]?.profiles?.[profile] || null;
  }

  formatBytes(bytes = 0) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }

  summary(moduleId, profile = "medium") {
    const item = this.get(moduleId, profile);
    if (!item || !item.assetCount) return null;

    return {
      ...item,
      maxAssetLabel: this.formatBytes(item.maxSingleAssetBytes),
      referencedLabel: this.formatBytes(item.totalReferencedBytes)
    };
  }
}
