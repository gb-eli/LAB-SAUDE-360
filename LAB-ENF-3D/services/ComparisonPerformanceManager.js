export class ComparisonPerformanceManager {
  constructor({ graphics } = {}) {
    this.graphics = graphics;
  }

  getNetworkSaveData() {
    return Boolean(navigator.connection?.saveData);
  }

  getDeviceMemory() {
    return Number(navigator.deviceMemory || 0);
  }

  getHardwareConcurrency() {
    return Number(navigator.hardwareConcurrency || 0);
  }

  isCoarsePointer() {
    return Boolean(
      window.matchMedia?.("(pointer: coarse)")?.matches
    );
  }

  resolveProfile() {
    const requested =
      this.graphics?.activeProfile ||
      this.graphics?.requestedProfile ||
      "medium";

    if (requested === "eco") return "eco";
    if (requested === "medium") return "medium";

    const constrained =
      this.getNetworkSaveData() ||
      (this.getDeviceMemory() > 0 && this.getDeviceMemory() <= 4) ||
      (this.getHardwareConcurrency() > 0 && this.getHardwareConcurrency() <= 4) ||
      this.isCoarsePointer();

    if (constrained) return "medium";

    return requested === "ultra" ? "high" : requested;
  }

  chooseVariant(variants = {}) {
    const profile = this.resolveProfile();

    return (
      variants[profile] ||
      variants.medium ||
      variants.eco ||
      variants.high ||
      variants.ultra ||
      null
    );
  }

  renderScaleFactor() {
    const profile = this.resolveProfile();

    if (profile === "eco") return 0.72;
    if (profile === "medium") return 0.86;
    return 1;
  }

  summary() {
    return {
      globalProfile:
        this.graphics?.activeProfile ||
        this.graphics?.requestedProfile ||
        "medium",
      comparisonProfile: this.resolveProfile(),
      saveData: this.getNetworkSaveData(),
      deviceMemory: this.getDeviceMemory() || null,
      hardwareConcurrency:
        this.getHardwareConcurrency() || null,
      coarsePointer: this.isCoarsePointer()
    };
  }
}
