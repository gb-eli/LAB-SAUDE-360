export class CatalogSearchManager {
  constructor() {
    this.activityTermsByModule = new Map();
    this.structureTermsByModule = new Map();
    this.structureItemsByModule = new Map();
  }

  normalize(value = "") {
    return String(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  build({ activities = [], structureIndex = null } = {}) {
    this.activityTermsByModule.clear();
    this.structureTermsByModule.clear();
    this.structureItemsByModule.clear();

    for (const activity of activities) {
      const terms = [
        activity.code,
        activity.title,
        ...(activity.objectives || []),
        ...(activity.explorationPrompts || []),
        ...(activity.checkpoints || [])
      ].filter(Boolean);

      const current =
        this.activityTermsByModule.get(activity.moduleId) || [];

      current.push(...terms);
      this.activityTermsByModule.set(activity.moduleId, current);
    }

    for (const [moduleId, row] of Object.entries(
      structureIndex?.modules || {}
    )) {
      this.structureTermsByModule.set(
        moduleId,
        row.terms || []
      );

      this.structureItemsByModule.set(
        moduleId,
        row.structures || []
      );
    }
  }

  searchableText(module) {
    const terms = [
      module.id,
      module.name,
      module.category,
      module.description,
      module.experience,
      module.generation,
      ...(module.planned || []),
      ...(module.searchTerms || []),
      ...(this.activityTermsByModule.get(module.id) || []),
      ...(this.structureTermsByModule.get(module.id) || [])
    ];

    return this.normalize(terms.join(" "));
  }

  matchesQuery(module, query = "") {
    const normalizedQuery = this.normalize(query);
    const tokens = normalizedQuery.split(" ").filter(Boolean);

    if (!tokens.length) return true;

    const text = this.searchableText(module);
    return tokens.every(token => text.includes(token));
  }

  filter(
    modules = [],
    {
      query = "",
      category = "all",
      generation = "all",
      sort = "catalog"
    } = {}
  ) {
    const filtered = modules.filter(module => {
      if (
        category !== "all" &&
        module.category !== category
      ) {
        return false;
      }

      if (
        generation !== "all" &&
        String(module.generation || "SIM") !== generation
      ) {
        return false;
      }

      return this.matchesQuery(module, query);
    });

    if (sort === "az") {
      return [...filtered].sort((a, b) =>
        a.name.localeCompare(b.name, "pt-BR")
      );
    }

    if (sort === "area") {
      return [...filtered].sort((a, b) => {
        const area = a.category.localeCompare(
          b.category,
          "pt-BR"
        );

        return area ||
          a.name.localeCompare(b.name, "pt-BR");
      });
    }

    return filtered;
  }

  matchLabels(module, query = "", limit = 3) {
    const normalizedQuery = this.normalize(query);
    const tokens = normalizedQuery.split(" ").filter(Boolean);

    if (!tokens.length) return [];

    const items =
      this.structureItemsByModule.get(module.id) || [];

    const hits = [];

    for (const item of items) {
      const text = this.normalize([
        item.name,
        item.mesh,
        item.system
      ].filter(Boolean).join(" "));

      if (tokens.every(token => text.includes(token))) {
        hits.push(item.name);
      }

      if (hits.length >= limit) break;
    }

    return [...new Set(hits)];
  }

  categories(modules = []) {
    return [
      ...new Set(
        modules.map(x => x.category).filter(Boolean)
      )
    ].sort((a, b) =>
      a.localeCompare(b, "pt-BR")
    );
  }

  generations(modules = []) {
    const order = ["G3", "G2", "G1", "SIM"];

    return [
      ...new Set(
        modules.map(x => String(x.generation || "SIM"))
      )
    ].sort((a, b) => {
      const ai = order.indexOf(a);
      const bi = order.indexOf(b);

      if (ai >= 0 || bi >= 0) {
        return (
          (ai >= 0 ? ai : 999) -
          (bi >= 0 ? bi : 999)
        );
      }

      return a.localeCompare(b, "pt-BR");
    });
  }
}
