export class ComparisonWorkspacePackageManager {
  constructor({
    packageVersion = 1
  } = {}) {
    this.packageVersion = packageVersion;
  }

  sanitizeFilename(value = "") {
    return (
      String(value)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9._-]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 90) ||
      "comparador-anotacoes"
    );
  }

  build({
    appVersion,
    annotation = "",
    markers = [],
    exportName = "",
    state = {},
    markerStyles = null,
    customPresets = null,
    presetFilters = null,
    markerVisibility = null
  } = {}) {
    return {
      schema:"lab-enfermagem-comparison-workspace",
      packageVersion:this.packageVersion,
      appVersion:appVersion || null,
      exportedAt:new Date().toISOString(),
      annotation:String(annotation || "").slice(0, 420),
      exportName:String(exportName || "").slice(0, 80),
      markers:Array.isArray(markers)
        ? markers.slice(0, 8)
        : [],
      markerStyles:
        markerStyles &&
        typeof markerStyles === "object"
          ? markerStyles
          : null,
      customPresets:
        customPresets &&
        typeof customPresets === "object"
          ? customPresets
          : null,
      presetFilters:
        presetFilters &&
        typeof presetFilters === "object"
          ? presetFilters
          : null,
      markerVisibility:
        Array.isArray(markerVisibility)
          ? markerVisibility
              .map(value=>String(value))
              .slice(0,16)
          : null,
      state:{
        systemA:state.systemA || null,
        structureA:state.structureA || null,
        systemB:state.systemB || null,
        structureB:state.structureB || null,
        mode:
          state.mode === "overlay"
            ? "overlay"
            : "side-by-side",
        opacityA:
          Number.isFinite(state.opacityA)
            ? state.opacityA
            : 1,
        opacityB:
          Number.isFinite(state.opacityB)
            ? state.opacityB
            : 1,
        semanticSync:Boolean(state.semanticSync),
        markerLines:
          state.markerLines !== false
      }
    };
  }

  validate(data) {
    if (
      !data ||
      data.schema !==
        "lab-enfermagem-comparison-workspace"
    ) {
      throw new Error(
        "Arquivo não é um pacote do Comparador Anatômico."
      );
    }

    if (
      Number(data.packageVersion) !==
        this.packageVersion
    ) {
      throw new Error(
        "Versão do pacote não suportada."
      );
    }

    if (
      data.markers !== undefined &&
      !Array.isArray(data.markers)
    ) {
      throw new Error(
        "Lista de marcadores inválida."
      );
    }

    if (
      data.markerVisibility !== undefined &&
      data.markerVisibility !== null &&
      !Array.isArray(data.markerVisibility)
    ) {
      throw new Error(
        "Visibilidade de categorias inválida."
      );
    }

    return data;
  }

  async readFile(
    file,
    { validate = true } = {}
  ) {
    const text = await file.text();
    const data = JSON.parse(text);

    return validate
      ? this.validate(data)
      : data;
  }

  download(data, filename = "comparador-anotacoes.json") {
    const blob = new Blob(
      [
        JSON.stringify(
          data,
          null,
          2
        )
      ],
      {
        type:"application/json;charset=utf-8"
      }
    );

    const url =
      URL.createObjectURL(blob);

    const a =
      document.createElement("a");

    a.href = url;
    a.download = filename;
    a.click();

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1200);
  }
}
