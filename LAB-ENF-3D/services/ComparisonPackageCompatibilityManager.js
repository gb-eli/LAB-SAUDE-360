export class ComparisonPackageCompatibilityManager {
  constructor({
    systems = {},
    markerCategories = [],
    packageVersion = 1
  } = {}) {
    this.systems = systems;
    this.markerCategories =
      new Set(
        markerCategories.map(
          item => item.id
        )
      );
    this.packageVersion = packageVersion;
  }

  structureExists(systemId, structureId) {
    const system =
      this.systems?.[systemId];

    if (!system) return false;
    if (!structureId) return true;

    return (system.structures || [])
      .some(item =>
        item.mesh === structureId
      );
  }

  inspect(data) {
    const issues = [];
    const warnings = [];

    if (
      !data ||
      data.schema !==
        "lab-enfermagem-comparison-workspace"
    ) {
      issues.push(
        "Schema do pacote não reconhecido."
      );
    }

    if (
      Number(data?.packageVersion) !==
        this.packageVersion
    ) {
      issues.push(
        `Versão do pacote ${data?.packageVersion ?? "?"} não suportada.`
      );
    }

    const state =
      data?.state || {};

    for (const side of ["A","B"]) {
      const systemId =
        state[`system${side}`];

      const structureId =
        state[`structure${side}`];

      if (
        systemId &&
        !this.systems?.[systemId]
      ) {
        issues.push(
          `Sistema ${side} não existe nesta versão: ${systemId}.`
        );
        continue;
      }

      if (
        systemId &&
        structureId &&
        !this.structureExists(
          systemId,
          structureId
        )
      ) {
        issues.push(
          `Estrutura ${side} não existe no sistema atual: ${structureId}.`
        );
      }
    }

    const markers =
      Array.isArray(data?.markers)
        ? data.markers
        : [];

    let compatibleMarkers = 0;
    let incompatibleMarkers = 0;

    markers.forEach((marker,index) => {
      const validSystem =
        Boolean(
          marker?.systemId &&
          this.systems?.[marker.systemId]
        );

      const validStructure =
        validSystem &&
        this.structureExists(
          marker.systemId,
          marker.objectName
        );

      if (validSystem && validStructure) {
        compatibleMarkers += 1;
      } else {
        incompatibleMarkers += 1;
        warnings.push(
          `Marcador ${index + 1} pode não encontrar sua mesh (${marker?.objectName || "?"}).`
        );
      }

      if (
        marker?.category &&
        !this.markerCategories.has(
          marker.category
        )
      ) {
        warnings.push(
          `Categoria de marcador não reconhecida: ${marker.category}.`
        );
      }
    });

    const markerStyles =
      data?.markerStyles;

    if (
      markerStyles &&
      markerStyles.schema !==
        "lab-enfermagem-marker-styles"
    ) {
      warnings.push(
        "Bloco de estilos de marcador possui schema desconhecido."
      );
    }

    const customPresets =
      data?.customPresets;

    if (
      customPresets &&
      customPresets.schema !==
        "lab-enfermagem-custom-comparison-presets"
    ) {
      warnings.push(
        "Bloco de presets personalizados possui schema desconhecido."
      );
    }

    const compatible =
      issues.length === 0;

    return {
      compatible,
      issues,
      warnings,
      summary: {
        packageVersion:
          data?.packageVersion ?? null,
        sourceAppVersion:
          data?.appVersion ?? null,
        markers:
          markers.length,
        compatibleMarkers,
        incompatibleMarkers,
        hasAnnotation:
          Boolean(
            String(data?.annotation || "").trim()
          ),
        hasExportName:
          Boolean(
            String(data?.exportName || "").trim()
          ),
        hasMarkerStyles:
          Boolean(markerStyles),
        customPresetCount:
          Array.isArray(
            customPresets?.presets
          )
            ? customPresets.presets.length
            : 0
      }
    };
  }
}
