export class ComparisonMarkerStyleManager {
  constructor({
    storage,
    definitions = [],
    key = "comparison-marker-styles"
  } = {}) {
    this.storage = storage;
    this.definitions = definitions;
    this.key = key;
    this.overrides = storage?.get?.(key, {}) || {};
  }

  base(categoryId) {
    return this.definitions.find(
      item => item.id === categoryId
    ) || {
      id: categoryId,
      label: categoryId,
      icon: "●",
      exportColor: "#63e6be"
    };
  }

  hasOverride(categoryId) {
    return Boolean(
      this.overrides &&
      Object.prototype.hasOwnProperty.call(
        this.overrides,
        categoryId
      )
    );
  }

  get(categoryId) {
    const base = this.base(categoryId);
    const override =
      this.overrides?.[categoryId] || {};

    return {
      ...base,
      ...override,
      id: categoryId,
      color:
        override.color ||
        base.exportColor ||
        "#63e6be",
      icon:
        override.icon ||
        base.icon ||
        "●"
    };
  }

  all() {
    return this.definitions.map(
      item => this.get(item.id)
    );
  }

  set(categoryId, {
    color,
    icon
  } = {}) {
    const base = this.base(categoryId);

    this.overrides = {
      ...this.overrides,
      [categoryId]: {
        color:
          /^#[0-9a-f]{6}$/i.test(String(color || ""))
            ? color
            : base.exportColor,
        icon:
          String(icon || base.icon || "●")
            .trim()
            .slice(0, 4)
      }
    };

    this.storage?.set?.(
      this.key,
      this.overrides
    );

    return this.get(categoryId);
  }

  reset(categoryId = null) {
    if (categoryId) {
      const next = {
        ...this.overrides
      };
      delete next[categoryId];
      this.overrides = next;
    } else {
      this.overrides = {};
    }

    this.storage?.set?.(
      this.key,
      this.overrides
    );
  }

  exportData() {
    return {
      schema:
        "lab-enfermagem-marker-styles",
      version: 1,
      overrides: {
        ...this.overrides
      }
    };
  }

  importData(data) {
    if (
      !data ||
      data.schema !==
        "lab-enfermagem-marker-styles" ||
      Number(data.version) !== 1
    ) {
      throw new Error(
        "Estilos de marcador incompatíveis."
      );
    }

    const allowed =
      new Set(
        this.definitions.map(
          item => item.id
        )
      );

    const next = {};

    for (const [
      categoryId,
      value
    ] of Object.entries(
      data.overrides || {}
    )) {
      if (
        allowed.size &&
        !allowed.has(categoryId)
      ) {
        continue;
      }

      const base =
        this.base(categoryId);

      next[categoryId] = {
        color:
          /^#[0-9a-f]{6}$/i.test(
            String(value?.color || "")
          )
            ? value.color
            : base.exportColor,
        icon:
          String(
            value?.icon ||
            base.icon ||
            "●"
          )
            .trim()
            .slice(0,4)
      };
    }

    this.overrides = next;

    this.storage?.set?.(
      this.key,
      this.overrides
    );
  }
}
