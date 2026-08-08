export class ComparisonSemanticSyncManager {
  constructor(data = null) {
    this.data = data || {
      equivalents: [],
      related: []
    };
  }

  setData(data) {
    this.data = data || {
      equivalents: [],
      related: []
    };
  }

  equivalentGroups() {
    return this.data?.equivalents || [];
  }

  relatedGroups() {
    return this.data?.related || [];
  }

  groups({ includeRelated = false } = {}) {
    return [
      ...this.equivalentGroups(),
      ...(includeRelated
        ? this.relatedGroups()
        : [])
    ];
  }

  groupsFor(
    systemId,
    structureId,
    { includeRelated = true } = {}
  ) {
    if (!systemId || !structureId) return [];

    return this.groups({ includeRelated }).filter(
      group => group.members?.some(member =>
        member.systemId === systemId &&
        member.structureId === structureId
      )
    );
  }

  groupFor(
    systemId,
    structureId,
    { includeRelated = false } = {}
  ) {
    return this.groupsFor(
      systemId,
      structureId,
      { includeRelated }
    )[0] || null;
  }

  equivalentFor(
    sourceSystemId,
    sourceStructureId,
    targetSystemId
  ) {
    const group = this.equivalentGroups().find(
      item => item.members?.some(member =>
        member.systemId === sourceSystemId &&
        member.structureId === sourceStructureId
      )
    );

    if (!group) return null;

    const match = group.members.find(member =>
      member.systemId === targetSystemId &&
      !(
        member.systemId === sourceSystemId &&
        member.structureId === sourceStructureId
      )
    );

    return match
      ? {
          ...match,
          relation: group.relation,
          canonical: group.canonical,
          groupLabel: group.label
        }
      : null;
  }

  suggestions(
    sourceSystemId,
    sourceStructureId,
    {
      preferredTargetSystemId = null,
      includeEquivalent = true,
      includeRelated = true
    } = {}
  ) {
    const groups = [
      ...(includeEquivalent
        ? this.equivalentGroups()
        : []),
      ...(includeRelated
        ? this.relatedGroups()
        : [])
    ];

    const result = [];
    const seen = new Set();

    for (const group of groups) {
      const contains = group.members?.some(member =>
        member.systemId === sourceSystemId &&
        member.structureId === sourceStructureId
      );

      if (!contains) continue;

      for (const member of group.members || []) {
        if (
          member.systemId === sourceSystemId &&
          member.structureId === sourceStructureId
        ) {
          continue;
        }

        const key =
          `${member.systemId}:${member.structureId}:${group.relation}`;

        if (seen.has(key)) continue;
        seen.add(key);

        result.push({
          ...member,
          relation: group.relation,
          canonical: group.canonical,
          groupLabel: group.label,
          preferred:
            Boolean(preferredTargetSystemId) &&
            member.systemId === preferredTargetSystemId
        });
      }
    }

    const priority = relation => {
      if (relation === "equivalent") return 0;
      if (relation === "shared-organ-reference") return 1;
      if (relation === "regional-reference") return 2;
      return 3;
    };

    return result.sort((a, b) =>
      Number(b.preferred) - Number(a.preferred) ||
      priority(a.relation) - priority(b.relation) ||
      String(a.name).localeCompare(
        String(b.name),
        "pt-BR"
      )
    );
  }

  candidates(
    sourceSystemId,
    sourceStructureId,
    options = {}
  ) {
    return this.suggestions(
      sourceSystemId,
      sourceStructureId,
      options
    );
  }

  bestCandidate(
    sourceSystemId,
    sourceStructureId,
    preferredTargetSystemId = null
  ) {
    return this.suggestions(
      sourceSystemId,
      sourceStructureId,
      { preferredTargetSystemId }
    )[0] || null;
  }
}
