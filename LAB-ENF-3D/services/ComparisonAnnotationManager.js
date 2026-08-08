export class ComparisonAnnotationManager {
  constructor({
    storage,
    key = "comparison-annotation-draft",
    maxLength = 420
  } = {}) {
    this.storage = storage;
    this.key = key;
    this.maxLength = maxLength;
  }

  normalize(value = "") {
    return String(value)
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, this.maxLength);
  }

  load() {
    return this.normalize(
      this.storage?.get?.(this.key, "") || ""
    );
  }

  save(value = "") {
    const normalized = this.normalize(value);
    this.storage?.set?.(this.key, normalized);
    return normalized;
  }

  clear() {
    this.storage?.remove?.(this.key);
  }
}
