export class ComparisonSessionPreviewManager {
  constructor({
    systems = {}
  } = {}) {
    this.systems = systems;
  }

  systemLabel(id) {
    return (
      this.systems?.[id]?.label ||
      id ||
      "—"
    );
  }

  structureLabel(
    systemId,
    structureId
  ) {
    if (!structureId) {
      return "Sistema completo";
    }

    const system =
      this.systems?.[systemId];

    return (
      system?.structures?.find(
        item =>
          item.mesh === structureId
      )?.name ||
      structureId
    );
  }

  normalize(state = {}) {
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
        Number.isFinite(
          Number(state.opacityA)
        )
          ? Math.min(
              1,
              Math.max(
                .12,
                Number(state.opacityA)
              )
            )
          : 1,
      opacityB:
        Number.isFinite(
          Number(state.opacityB)
        )
          ? Math.min(
              1,
              Math.max(
                .12,
                Number(state.opacityB)
              )
            )
          : 1,
      semanticSync:
        Boolean(state.semanticSync),
      markerLines:
        state.markerLines !== false
    };
  }

  describe(state = {}) {
    const value =
      this.normalize(state);

    return {
      ...value,
      systemLabelA:
        this.systemLabel(
          value.systemA
        ),
      systemLabelB:
        this.systemLabel(
          value.systemB
        ),
      structureLabelA:
        this.structureLabel(
          value.systemA,
          value.structureA
        ),
      structureLabelB:
        this.structureLabel(
          value.systemB,
          value.structureB
        ),
      modeLabel:
        value.mode === "overlay"
          ? "Sobreposição A/B"
          : "Lado a lado",
      opacityLabelA:
        `${Math.round(value.opacityA * 100)}%`,
      opacityLabelB:
        `${Math.round(value.opacityB * 100)}%`
    };
  }

  compare(
    currentState = {},
    incomingState = {}
  ) {
    const current =
      this.describe(currentState);

    const incoming =
      this.describe(incomingState);

    const fields = [
      ["systemA","Sistema A"],
      ["structureA","Estrutura A"],
      ["systemB","Sistema B"],
      ["structureB","Estrutura B"],
      ["mode","Modo"],
      ["opacityA","Opacidade A"],
      ["opacityB","Opacidade B"],
      ["semanticSync","Sincronização"],
      ["markerLines","Linhas-guia"]
    ];

    const changes =
      fields
        .filter(([key]) =>
          current[key] !==
          incoming[key]
        )
        .map(([key,label]) => ({
          key,
          label,
          from:current[key],
          to:incoming[key]
        }));

    return {
      current,
      incoming,
      changes,
      changedCount:changes.length
    };
  }

  markerSummary(markers = []) {
    const items =
      Array.isArray(markers)
        ? markers
        : [];

    const categories = {};

    for (const marker of items) {
      const category =
        marker?.category ||
        "structure";

      categories[category] =
        (categories[category] || 0) + 1;
    }

    return {
      count:items.length,
      categories
    };
  }

  buildPreview({
    currentState = {},
    packageData = {}
  } = {}) {
    const comparison =
      this.compare(
        currentState,
        packageData?.state || {}
      );

    return {
      ...comparison,
      markers:
        this.markerSummary(
          packageData?.markers
        ),
      annotation:
        String(
          packageData?.annotation || ""
        ).slice(0,420),
      exportName:
        String(
          packageData?.exportName || ""
        ).slice(0,80),
      sourceAppVersion:
        packageData?.appVersion ||
        null,
      customPresetCount:
        Array.isArray(
          packageData?.customPresets?.presets
        )
          ? packageData.customPresets.presets.length
          : 0,
      hasMarkerStyles:
        Boolean(
          packageData?.markerStyles
        )
    };
  }
}
