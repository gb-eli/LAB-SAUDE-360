export class CustomComparisonPresetManager {
  constructor({
    storage,
    key = "comparison-custom-presets",
    maxItems = 20
  } = {}) {
    this.storage = storage;
    this.key = key;
    this.maxItems = maxItems;
    this.items = storage?.get?.(key, []) || [];
  }

  sanitize(value = "", max = 100) {
    return String(value)
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, max);
  }

  normalizeTags(tags = []) {
    const source =
      Array.isArray(tags)
        ? tags
        : String(tags || "").split(",");

    const seen = new Set();
    const result = [];

    for (const raw of source) {
      const tag =
        this.sanitize(raw, 28)
          .replace(/^#/, "");

      if (!tag) continue;

      const key =
        tag
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase();

      if (seen.has(key)) continue;
      seen.add(key);
      result.push(tag);

      if (result.length >= 8) break;
    }

    return result;
  }

  list() {
    return [...this.items]
      .map(item => ({
        ...item,
        tags:this.normalizeTags(item.tags || [])
      }))
      .sort((a,b)=>
        String(b.updatedAt)
          .localeCompare(String(a.updatedAt))
      );
  }

  get(id) {
    return this.items.find(
      item => item.id === id
    ) || null;
  }

  search(
    query = "",
    {
      tag = "all"
    } = {}
  ) {
    const normalized =
      String(query || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

    return this.list().filter(item => {
      const tags =
        this.normalizeTags(item.tags || []);

      const tagMatches =
        tag === "all" ||
        tags.some(value =>
          value.localeCompare(
            tag,
            "pt-BR",
            { sensitivity:"base" }
          ) === 0
        );

      if (!tagMatches) return false;
      if (!normalized) return true;

      const haystack = [
        item.label,
        item.lesson,
        item.competency,
        ...tags,
        item.state?.systemA,
        item.state?.structureA,
        item.state?.systemB,
        item.state?.structureB
      ]
        .filter(Boolean)
        .join(" ")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

      return normalized
        .split(/\s+/)
        .filter(Boolean)
        .every(token =>
          haystack.includes(token)
        );
    });
  }

  allTags() {
    const values =
      this.list()
        .flatMap(item =>
          this.normalizeTags(item.tags || [])
        );

    const byKey = new Map();

    for (const value of values) {
      const key =
        value
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase();

      if (!byKey.has(key)) {
        byKey.set(key, value);
      }
    }

    return [...byKey.values()]
      .sort((a,b)=>
        a.localeCompare(
          b,
          "pt-BR"
        )
      );
  }

  normalizeState(state = {}) {
    return {
      systemA:
        state.systemA || null,
      structureA:
        state.structureA || null,
      systemB:
        state.systemB || null,
      structureB:
        state.structureB || null,
      mode:
        state.mode === "overlay"
          ? "overlay"
          : "side-by-side",
      opacityA:
        Math.min(
          1,
          Math.max(
            .12,
            Number(state.opacityA) || 1
          )
        ),
      opacityB:
        Math.min(
          1,
          Math.max(
            .12,
            Number(state.opacityB) || 1
          )
        ),
      semanticSync:
        Boolean(state.semanticSync),
      markerLines:
        state.markerLines !== false
    };
  }

  save({
    id = null,
    label,
    lesson = "",
    competency = "",
    tags = [],
    state = {}
  } = {}) {
    const cleanedLabel =
      this.sanitize(label, 80);

    if (!cleanedLabel) {
      throw new Error(
        "Informe um nome para o preset."
      );
    }

    const now =
      new Date().toISOString();

    const existing =
      id ? this.get(id) : null;

    const preset = {
      id:
        id ||
        globalThis.crypto?.randomUUID?.() ||
        `custom-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      label:cleanedLabel,
      lesson:
        this.sanitize(lesson, 120),
      competency:
        this.sanitize(competency, 180),
      tags:
        this.normalizeTags(tags),
      state:
        this.normalizeState(state),
      createdAt:
        existing?.createdAt || now,
      updatedAt:now
    };

    this.items = [
      preset,
      ...this.items.filter(
        item => item.id !== preset.id
      )
    ].slice(0, this.maxItems);

    this.persist();
    return preset;
  }

  update(id, patch = {}) {
    const current = this.get(id);

    if (!current) {
      throw new Error(
        "Preset personalizado não encontrado."
      );
    }

    return this.save({
      id,
      label:
        patch.label ??
        current.label,
      lesson:
        patch.lesson ??
        current.lesson,
      competency:
        patch.competency ??
        current.competency,
      tags:
        patch.tags ??
        current.tags,
      state:
        patch.state ??
        current.state
    });
  }

  duplicate(
    id,
    {
      label = null
    } = {}
  ) {
    const current = this.get(id);

    if (!current) {
      throw new Error(
        "Preset personalizado não encontrado."
      );
    }

    return this.save({
      label:
        label ||
        `${current.label} — cópia`,
      lesson:current.lesson,
      competency:current.competency,
      tags:current.tags,
      state:current.state
    });
  }

  remove(id) {
    this.items =
      this.items.filter(
        item => item.id !== id
      );
    this.persist();
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

  exportData() {
    return {
      schema:
        "lab-enfermagem-custom-comparison-presets",
      version: 1,
      exportedAt:
        new Date().toISOString(),
      presets:this.list()
    };
  }

  importData(data) {
    if (
      !data ||
      data.schema !==
        "lab-enfermagem-custom-comparison-presets" ||
      Number(data.version) !== 1 ||
      !Array.isArray(data.presets)
    ) {
      throw new Error(
        "Arquivo de presets personalizados inválido."
      );
    }

    const now =
      new Date().toISOString();

    const valid =
      data.presets
        .filter(item =>
          item &&
          typeof item.label === "string" &&
          item.state &&
          typeof item.state === "object"
        )
        .map(item => ({
          id:
            String(
              item.id ||
              `import-${Date.now()}-${Math.random().toString(36).slice(2)}`
            ).slice(0,120),
          label:
            this.sanitize(
              item.label,
              80
            ),
          lesson:
            this.sanitize(
              item.lesson,
              120
            ),
          competency:
            this.sanitize(
              item.competency,
              180
            ),
          tags:
            this.normalizeTags(
              item.tags || []
            ),
          state:
            this.normalizeState(
              item.state
            ),
          createdAt:
            item.createdAt || now,
          updatedAt:
            item.updatedAt || now
        }))
        .filter(item => item.label)
        .slice(0, this.maxItems);

    const byId =
      new Map(
        this.items.map(item => [
          item.id,
          item
        ])
      );

    for (const item of valid) {
      byId.set(
        item.id,
        item
      );
    }

    this.items =
      [...byId.values()]
        .sort((a,b)=>
          String(
            b.updatedAt ||
            b.createdAt ||
            ""
          ).localeCompare(
            String(
              a.updatedAt ||
              a.createdAt ||
              ""
            )
          )
        )
        .slice(0, this.maxItems);

    this.persist();
    return this.list();
  }
}
