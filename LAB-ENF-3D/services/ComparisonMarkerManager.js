export class ComparisonMarkerManager {
  constructor({
    engine,
    THREE,
    stage,
    storage,
    getSides,
    onChange = null,
    categories = null,
    getCategoryStyle = null,
    key = "comparison-markers",
    maxMarkers = 8
  } = {}) {
    this.engine = engine;
    this.THREE = THREE;
    this.stage = stage;
    this.storage = storage;
    this.getSides = getSides;
    this.onChange = onChange;
    this.categoryDefinitions =
      Array.isArray(categories) && categories.length
        ? categories
        : null;
    this.getCategoryStyle =
      getCategoryStyle;
    this.dragState = null;
    this.key = key;
    this.visibilityKey =
      `${key}:category-visibility`;
    this.hiddenCategories =
      new Set(
        storage?.get?.(
          this.visibilityKey,
          []
        ) || []
      );
    this.maxMarkers = maxMarkers;

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.markers = [];
    this.nodes = new Map();

    this.armedText = "";
    this.armedCategory = "structure";
    this.repositionId = null;

    this.onPointerDown = this.onPointerDown.bind(this);
    this.onDragMove = this.onDragMove.bind(this);
    this.onDragEnd = this.onDragEnd.bind(this);
    this.stage?.addEventListener(
      "pointerdown",
      this.onPointerDown,
      true
    );

    this.restore();
  }

  categories() {
    return this.categoryDefinitions || [
      { id:"structure", label:"Estrutura" },
      { id:"attention", label:"Atenção" },
      { id:"relation", label:"Relação" },
      { id:"question", label:"Dúvida" }
    ];
  }

  sanitize(text = "", max = 100) {
    return String(text)
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, max);
  }

  normalizeCategory(value = "structure") {
    const ids = new Set(
      this.categories().map(item => item.id)
    );
    return ids.has(value) ? value : "structure";
  }

  isCategoryVisible(categoryId) {
    return !this.hiddenCategories.has(
      this.normalizeCategory(categoryId)
    );
  }

  setCategoryVisible(
    categoryId,
    visible = true
  ) {
    const category =
      this.normalizeCategory(categoryId);

    if (visible) {
      this.hiddenCategories.delete(
        category
      );
    } else {
      this.hiddenCategories.add(
        category
      );
    }

    this.storage?.set?.(
      this.visibilityKey,
      [...this.hiddenCategories]
    );

    this.renderAll();

    this.onChange?.({
      type:"categoryVisibility",
      category,
      visible:Boolean(visible),
      markers:this.list()
    });
  }

  visibleCategories() {
    return this.categories()
      .filter(item =>
        this.isCategoryVisible(item.id)
      )
      .map(item => item.id);
  }

  arm(text = "", category = "structure") {
    this.repositionId = null;
    this.armedText = this.sanitize(text);
    this.armedCategory = this.normalizeCategory(category);
    return Boolean(this.armedText);
  }

  armReposition(id) {
    const marker = this.get(id);
    if (!marker) return false;
    this.armedText = "";
    this.repositionId = id;
    return true;
  }

  disarm() {
    this.armedText = "";
    this.repositionId = null;
  }

  isArmed() {
    return Boolean(
      this.armedText ||
      this.repositionId
    );
  }

  mode() {
    if (this.repositionId) return "reposition";
    if (this.armedText) return "create";
    return "idle";
  }

  get(id) {
    return this.markers.find(
      marker => marker.id === id
    ) || null;
  }

  identifySide(object) {
    const sides = this.getSides?.() || {};

    for (const [key, side] of Object.entries(sides)) {
      let current = object;

      while (current) {
        if (current === side.root) {
          return key;
        }
        current = current.parent;
      }
    }

    return null;
  }

  visibleMeshes() {
    const meshes = [];
    const sides = this.getSides?.() || {};

    for (const side of Object.values(sides)) {
      side.root?.traverse?.(child => {
        if (child.isMesh && child.visible) {
          meshes.push(child);
        }
      });
    }

    return meshes;
  }

  hitFromPointer(event) {
    if (!this.engine?.camera || !this.engine?.canvas) {
      return null;
    }

    const rect =
      this.engine.canvas.getBoundingClientRect();

    this.pointer.x =
      ((event.clientX - rect.left) / rect.width) * 2 - 1;

    this.pointer.y =
      -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(
      this.pointer,
      this.engine.camera
    );

    return this.raycaster.intersectObjects(
      this.visibleMeshes(),
      false
    )[0] || null;
  }

  anchorFromHit(hit) {
    const sideKey = this.identifySide(hit.object);
    if (!sideKey) return null;

    const localPoint = hit.object.worldToLocal(
      hit.point.clone()
    );

    hit.object.geometry?.computeBoundingBox?.();
    const bounds = hit.object.geometry?.boundingBox;
    let normalizedPoint = null;

    if (bounds) {
      const size = bounds.getSize(
        new this.THREE.Vector3()
      );

      normalizedPoint = [
        size.x
          ? (localPoint.x - bounds.min.x) / size.x
          : 0.5,
        size.y
          ? (localPoint.y - bounds.min.y) / size.y
          : 0.5,
        size.z
          ? (localPoint.z - bounds.min.z) / size.z
          : 0.5
      ].map(value =>
        Math.min(1, Math.max(0, value))
      );
    }

    return {
      side:sideKey,
      systemId:
        this.getSides?.()?.[sideKey]?.systemId || null,
      objectName:hit.object.name,
      localPoint:[
        localPoint.x,
        localPoint.y,
        localPoint.z
      ],
      normalizedPoint
    };
  }

  onPointerDown(event) {
    if (!this.isArmed()) return;
    if (event.target !== this.engine?.canvas) return;

    const hit = this.hitFromPointer(event);
    if (!hit) return;

    const anchor = this.anchorFromHit(hit);
    if (!anchor) return;

    event.preventDefault();
    event.stopPropagation();

    if (this.repositionId) {
      const marker = this.get(this.repositionId);
      if (!marker) {
        this.disarm();
        return;
      }

      Object.assign(marker, anchor, {
        updatedAt:new Date().toISOString()
      });

      const id = marker.id;
      this.disarm();
      this.persist();
      this.renderAll();

      this.onChange?.({
        type:"repositioned",
        id,
        marker,
        markers:this.list()
      });
      return;
    }

    const marker = {
      id:
        globalThis.crypto?.randomUUID?.() ||
        `marker-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      text:this.armedText,
      category:this.armedCategory,
      screenOffset:null,
      ...anchor,
      createdAt:new Date().toISOString(),
      updatedAt:new Date().toISOString()
    };

    this.markers = [
      ...this.markers,
      marker
    ].slice(-this.maxMarkers);

    this.disarm();
    this.persist();
    this.renderAll();

    this.onChange?.({
      type:"added",
      marker,
      markers:this.list()
    });
  }

  findObject(marker) {
    const side =
      this.getSides?.()?.[marker.side];

    if (!side?.root) return null;

    if (
      marker.systemId &&
      side.systemId !== marker.systemId
    ) {
      return null;
    }

    let found = null;

    side.root.traverse?.(child => {
      if (
        !found &&
        child.isMesh &&
        child.name === marker.objectName
      ) {
        found = child;
      }
    });

    return found;
  }

  markerWorldPosition(marker) {
    const object = this.findObject(marker);
    if (!object) return null;

    let local = null;

    if (
      Array.isArray(marker.normalizedPoint) &&
      marker.normalizedPoint.length === 3
    ) {
      object.geometry?.computeBoundingBox?.();
      const bounds = object.geometry?.boundingBox;

      if (bounds) {
        const [nx, ny, nz] =
          marker.normalizedPoint;

        local = new this.THREE.Vector3(
          bounds.min.x +
            (bounds.max.x - bounds.min.x) * nx,
          bounds.min.y +
            (bounds.max.y - bounds.min.y) * ny,
          bounds.min.z +
            (bounds.max.z - bounds.min.z) * nz
        );
      }
    }

    if (!local) {
      local = new this.THREE.Vector3(
        ...(marker.localPoint || [0,0,0])
      );
    }

    return object.localToWorld(local);
  }

  markerVisible(marker) {
    const object = this.findObject(marker);
    return Boolean(object?.visible);
  }

  project(marker, pixelWidth = null, pixelHeight = null) {
    const world = this.markerWorldPosition(marker);
    if (!world || !this.engine?.camera) return null;

    const projected = world
      .clone()
      .project(this.engine.camera);

    if (
      projected.z < -1 ||
      projected.z > 1 ||
      Math.abs(projected.x) > 1.2 ||
      Math.abs(projected.y) > 1.2
    ) {
      return null;
    }

    const rect =
      this.engine.canvas.getBoundingClientRect();

    const width =
      pixelWidth || rect.width;

    const height =
      pixelHeight || rect.height;

    return {
      x:(projected.x + 1) * 0.5 * width,
      y:(1 - projected.y) * 0.5 * height,
      depth:projected.z
    };
  }

  baseLabelOffset(marker) {
    const category =
      this.normalizeCategory(marker.category);

    const offsets = {
      structure:[18,-24],
      attention:[20,18],
      relation:[-190,-26],
      question:[-180,18]
    };

    return offsets[category] || offsets.structure;
  }

  labelOffset(marker) {
    if (
      Array.isArray(marker.screenOffset) &&
      marker.screenOffset.length === 2
    ) {
      return [
        Number(marker.screenOffset[0]) || 0,
        Number(marker.screenOffset[1]) || 0
      ];
    }

    return this.baseLabelOffset(marker);
  }

  startLabelDrag(marker,event) {
    if (
      event.button !== undefined &&
      event.button !== 0
    ) {
      return;
    }

    if (
      event.target?.closest?.("button")
    ) {
      return;
    }

    const [dx,dy] =
      this.labelOffset(marker);

    this.dragState = {
      id:marker.id,
      startX:event.clientX,
      startY:event.clientY,
      offsetX:dx,
      offsetY:dy
    };

    event.preventDefault();
    event.stopPropagation();

    window.addEventListener(
      "pointermove",
      this.onDragMove
    );

    window.addEventListener(
      "pointerup",
      this.onDragEnd,
      { once:true }
    );

    this.onChange?.({
      type:"dragStarted",
      id:marker.id,
      marker:this.get(marker.id),
      markers:this.list()
    });
  }

  onDragMove(event) {
    if (!this.dragState) return;

    const marker =
      this.get(this.dragState.id);

    if (!marker) return;

    const nextX =
      this.dragState.offsetX +
      event.clientX -
      this.dragState.startX;

    const nextY =
      this.dragState.offsetY +
      event.clientY -
      this.dragState.startY;

    marker.screenOffset = [
      Math.max(-360,Math.min(360,nextX)),
      Math.max(-240,Math.min(240,nextY))
    ];

    this.renderAll();
  }

  onDragEnd() {
    if (!this.dragState) return;

    const id =
      this.dragState.id;

    const marker =
      this.get(id);

    this.dragState = null;

    window.removeEventListener(
      "pointermove",
      this.onDragMove
    );

    if (marker) {
      marker.updatedAt =
        new Date().toISOString();

      this.persist();

      this.onChange?.({
        type:"dragged",
        id,
        marker,
        markers:this.list()
      });
    }
  }

  resetLabelOffsets() {
    for (const marker of this.markers) {
      marker.screenOffset = null;
    }

    this.persist();
    this.renderAll();

    this.onChange?.({
      type:"layoutReset",
      markers:this.list()
    });
  }

  cameraLayoutScale() {
    const camera =
      this.engine?.camera;

    if (!camera) return 1;

    const zoom =
      Number(camera.zoom) || 1;

    const distance =
      Number(
        camera.position?.length?.()
      ) || 8;

    const distanceScale =
      Math.max(
        .78,
        Math.min(
          1.28,
          distance / 8
        )
      );

    return Math.max(
      .72,
      Math.min(
        1.4,
        distanceScale /
          Math.max(.7,zoom)
      )
    );
  }

  layoutCandidates(
    marker,
    point,
    canvasRect,
    labelWidth,
    labelHeight
  ) {
    const scale =
      this.cameraLayoutScale();

    const nearLeft =
      point.x <
      canvasRect.width * .32;

    const nearRight =
      point.x >
      canvasRect.width * .68;

    const nearTop =
      point.y <
      canvasRect.height * .28;

    const nearBottom =
      point.y >
      canvasRect.height * .72;

    const horizontal =
      Math.round(
        Math.max(
          28,
          Math.min(
            230,
            (labelWidth + 18) * scale
          )
        )
      );

    const vertical =
      Math.round(
        Math.max(
          24,
          Math.min(
            110,
            (labelHeight + 14) * scale
          )
        )
      );

    const rightX =
      Math.round(18 * scale);

    const leftX =
      -horizontal;

    const upY =
      -vertical;

    const downY =
      Math.round(18 * scale);

    const preferred =
      this.baseLabelOffset(marker);

    const edgeAware = [];

    if (nearLeft) {
      edgeAware.push(
        [rightX,upY],
        [rightX,downY]
      );
    } else if (nearRight) {
      edgeAware.push(
        [leftX,upY],
        [leftX,downY]
      );
    }

    if (nearTop) {
      edgeAware.push(
        [rightX,downY],
        [leftX,downY]
      );
    } else if (nearBottom) {
      edgeAware.push(
        [rightX,upY],
        [leftX,upY]
      );
    }

    return [
      ...edgeAware,
      preferred,
      [rightX,upY],
      [rightX,downY],
      [leftX,upY],
      [leftX,downY],
      [
        Math.round(74*scale),
        upY
      ],
      [
        -Math.round(
          horizontal + 58*scale
        ),
        upY
      ],
      [
        Math.round(74*scale),
        downY
      ],
      [
        -Math.round(
          horizontal + 58*scale
        ),
        downY
      ],
      [
        rightX,
        -Math.round(
          vertical + 42*scale
        )
      ],
      [
        leftX,
        -Math.round(
          vertical + 42*scale
        )
      ]
    ];
  }

  autoLayout() {
    const canvasRect =
      this.engine?.canvas
        ?.getBoundingClientRect?.();

    if (!canvasRect) return 0;

    this.renderAll();

    const placed = [];
    let adjusted = 0;

    const intersects = (a,b) =>
      !(
        a.right + 10 < b.left ||
        a.left - 10 > b.right ||
        a.bottom + 8 < b.top ||
        a.top - 8 > b.bottom
      );

    for (const marker of this.markers) {
      if (
        !this.markerVisible(marker) ||
        !this.isCategoryVisible(
          marker.category
        )
      ) {
        continue;
      }

      const point =
        this.project(marker);

      if (!point) continue;

      const node =
        this.ensureNode(marker);

      const label =
        node.querySelector(
          ".compare-scene-marker"
        );

      const rect =
        label?.getBoundingClientRect?.();

      const width =
        rect?.width ||
        Math.min(
          260,
          Math.max(
            128,
            marker.text.length * 7 + 80
          )
        );

      const height =
        rect?.height || 36;

      const candidates =
        this.layoutCandidates(
          marker,
          point,
          canvasRect,
          width,
          height
        );

      let choice =
        candidates[0] ||
        this.baseLabelOffset(marker);

      let bestPenalty =
        Number.POSITIVE_INFINITY;

      for (const [dx,dy] of candidates) {
        const left =
          point.x + dx;

        const top =
          point.y + dy;

        const candidate = {
          left,
          top,
          right:left + width,
          bottom:top + height
        };

        const overflow =
          Math.max(0,4-candidate.left) +
          Math.max(0,4-candidate.top) +
          Math.max(
            0,
            candidate.right -
              (canvasRect.width-4)
          ) +
          Math.max(
            0,
            candidate.bottom -
              (canvasRect.height-4)
          );

        const collisions =
          placed.filter(existing =>
            intersects(
              candidate,
              existing
            )
          ).length;

        const distancePenalty =
          Math.hypot(dx,dy) * .002;

        const penalty =
          overflow * 5 +
          collisions * 1000 +
          distancePenalty;

        if (penalty < bestPenalty) {
          bestPenalty = penalty;
          choice = [dx,dy];
        }

        if (
          overflow === 0 &&
          collisions === 0
        ) {
          choice = [dx,dy];
          break;
        }
      }

      marker.screenOffset = choice;

      placed.push({
        left:
          point.x + choice[0],
        top:
          point.y + choice[1],
        right:
          point.x +
          choice[0] +
          width,
        bottom:
          point.y +
          choice[1] +
          height
      });

      adjusted += 1;
    }

    this.persist();
    this.renderAll();

    this.onChange?.({
      type:"autoLayout",
      count:adjusted,
      markers:this.list()
    });

    return adjusted;
  }

  ensureNode(marker) {
    if (this.nodes.has(marker.id)) {
      return this.nodes.get(marker.id);
    }

    const wrap = document.createElement("div");
    wrap.className = "compare-scene-marker-wrap";
    wrap.dataset.markerId = marker.id;

    wrap.innerHTML = `
      <span class="compare-marker-anchor" aria-hidden="true"></span>
      <span class="compare-marker-line" aria-hidden="true"></span>
      <div class="compare-scene-marker" title="Arraste para mover a etiqueta">
        <span class="compare-marker-icon" aria-hidden="true"></span>
        <span class="compare-marker-category"></span>
        <span class="compare-marker-text"></span>
        <button type="button" data-marker-node-edit aria-label="Editar marcador">✎</button>
        <button type="button" data-marker-node-delete aria-label="Excluir marcador">×</button>
      </div>
    `;

    wrap
      .querySelector("[data-marker-node-edit]")
      .addEventListener("click", event => {
        event.stopPropagation();
        this.onChange?.({
          type:"editRequested",
          id:marker.id,
          marker:this.get(marker.id),
          markers:this.list()
        });
      });

    wrap
      .querySelector("[data-marker-node-delete]")
      .addEventListener("click", event => {
        event.stopPropagation();
        this.remove(marker.id);
      });

    wrap
      .querySelector(".compare-scene-marker")
      .addEventListener(
        "pointerdown",
        event =>
          this.startLabelDrag(
            this.get(marker.id),
            event
          )
      );

    this.stage?.append(wrap);
    this.nodes.set(marker.id, wrap);

    return wrap;
  }

  updateNodeContent(node, marker) {
    const category =
      this.categories().find(
        item => item.id ===
          this.normalizeCategory(marker.category)
      );

    node.dataset.side = marker.side;
    node.dataset.category =
      this.normalizeCategory(marker.category);

    const text =
      node.querySelector(".compare-marker-text");
    if (text) text.textContent = marker.text;

    const tag =
      node.querySelector(".compare-marker-category");
    if (tag) tag.textContent = category?.label || "Estrutura";

    const style =
      this.getCategoryStyle?.(
        marker.category,
        marker
      ) || {
        color:
          category?.exportColor ||
          "#63e6be",
        icon:
          category?.icon ||
          "●"
      };

    node.style.setProperty(
      "--marker-color",
      style.color ||
        category?.exportColor ||
        "#63e6be"
    );

    const icon =
      node.querySelector(
        ".compare-marker-icon"
      );

    if (icon) {
      icon.textContent =
        style.icon ||
        category?.icon ||
        "●";
    }
  }

  renderAll() {
    const validIds = new Set(
      this.markers.map(marker => marker.id)
    );

    for (const [id, node] of this.nodes.entries()) {
      if (!validIds.has(id)) {
        node.remove();
        this.nodes.delete(id);
      }
    }

    for (const marker of this.markers) {
      const node = this.ensureNode(marker);
      this.updateNodeContent(node, marker);

      const point = this.project(marker);
      const visible =
        point &&
        this.markerVisible(marker) &&
        this.isCategoryVisible(
          marker.category
        );

      node.hidden = !visible;
      if (!visible) continue;

      const [dx,dy] = this.labelOffset(marker);
      const label =
        node.querySelector(".compare-scene-marker");
      const line =
        node.querySelector(".compare-marker-line");

      node.style.left = `${point.x}px`;
      node.style.top = `${point.y}px`;

      label.style.left = `${dx}px`;
      label.style.top = `${dy}px`;

      const length =
        Math.hypot(dx,dy);

      const angle =
        Math.atan2(dy,dx) * 180 / Math.PI;

      line.style.width = `${Math.max(8,length)}px`;
      line.style.transform =
        `rotate(${angle}deg)`;
    }
  }

  exportMarkers(pixelWidth, pixelHeight) {
    return this.markers
      .filter(marker =>
        this.markerVisible(marker) &&
        this.isCategoryVisible(
          marker.category
        )
      )
      .map(marker => {
        const point = this.project(
          marker,
          pixelWidth,
          pixelHeight
        );

        const style =
          this.getCategoryStyle?.(
            marker.category,
            marker
          ) || null;

        const [dx,dy] =
          this.labelOffset(marker);

        return point
          ? {
              ...marker,
              x:point.x,
              y:point.y,
              labelOffset:[dx,dy],
              categoryStyle:style
            }
          : null;
      })
      .filter(Boolean);
  }

  list() {
    return this.markers.map(
      marker => ({
        ...marker,
        localPoint:[
          ...(marker.localPoint || [])
        ],
        normalizedPoint:
          Array.isArray(marker.normalizedPoint)
            ? [...marker.normalizedPoint]
            : null
      })
    );
  }

  visibleList() {
    return this.list()
      .filter(marker =>
        this.markerVisible(marker) &&
        this.isCategoryVisible(
          marker.category
        )
      )
      .map(marker => ({
        ...marker,
        categoryStyle:
          this.getCategoryStyle?.(
            marker.category,
            marker
          ) || null
      }));
  }

  update(id, {
    text,
    category
  } = {}) {
    const marker = this.get(id);
    if (!marker) return null;

    if (text !== undefined) {
      const cleaned = this.sanitize(text);
      if (cleaned) marker.text = cleaned;
    }

    if (category !== undefined) {
      marker.category =
        this.normalizeCategory(category);
    }

    marker.updatedAt =
      new Date().toISOString();

    this.persist();
    this.renderAll();

    this.onChange?.({
      type:"updated",
      id,
      marker,
      markers:this.list()
    });

    return marker;
  }

  remove(id) {
    this.markers =
      this.markers.filter(
        marker => marker.id !== id
      );

    this.persist();
    this.renderAll();

    this.onChange?.({
      type:"removed",
      id,
      markers:this.list()
    });
  }

  replaceAll(markers = []) {
    this.markers = markers
      .filter(marker =>
        marker &&
        typeof marker.text === "string" &&
        typeof marker.objectName === "string" &&
        Array.isArray(marker.localPoint) &&
        marker.localPoint.length === 3
      )
      .map(marker => ({
        ...marker,
        text:this.sanitize(marker.text),
        category:
          this.normalizeCategory(marker.category),
        screenOffset:
          Array.isArray(marker.screenOffset) &&
          marker.screenOffset.length === 2
            ? [
                Number(marker.screenOffset[0]) || 0,
                Number(marker.screenOffset[1]) || 0
              ]
            : null,
        normalizedPoint:
          Array.isArray(marker.normalizedPoint) &&
          marker.normalizedPoint.length === 3
            ? marker.normalizedPoint.map(
                value =>
                  Math.min(
                    1,
                    Math.max(0, Number(value) || 0)
                  )
              )
            : null
      }))
      .slice(-this.maxMarkers);

    this.disarm();
    this.persist();
    this.renderAll();

    this.onChange?.({
      type:"replaced",
      markers:this.list()
    });
  }

  clear() {
    this.markers = [];
    this.disarm();
    this.persist();

    for (const node of this.nodes.values()) {
      node.remove();
    }

    this.nodes.clear();

    this.onChange?.({
      type:"cleared",
      markers:[]
    });
  }

  persist() {
    this.storage?.set?.(
      this.key,
      this.markers
    );
  }

  restore() {
    const raw =
      this.storage?.get?.(
        this.key,
        []
      ) || [];

    this.markers = raw
      .filter(marker =>
        marker &&
        typeof marker.text === "string" &&
        typeof marker.objectName === "string" &&
        Array.isArray(marker.localPoint) &&
        marker.localPoint.length === 3
      )
      .map(marker => ({
        ...marker,
        category:
          this.normalizeCategory(marker.category),
        screenOffset:
          Array.isArray(marker.screenOffset) &&
          marker.screenOffset.length === 2
            ? [
                Number(marker.screenOffset[0]) || 0,
                Number(marker.screenOffset[1]) || 0
              ]
            : null
      }))
      .slice(-this.maxMarkers);
  }

  destroy() {
    this.stage?.removeEventListener(
      "pointerdown",
      this.onPointerDown,
      true
    );

    window.removeEventListener(
      "pointermove",
      this.onDragMove
    );

    window.removeEventListener(
      "pointerup",
      this.onDragEnd
    );

    for (const node of this.nodes.values()) {
      node.remove();
    }

    this.nodes.clear();
    this.raycaster = null;
    this.pointer = null;
    this.engine = null;
    this.THREE = null;
    this.stage = null;
    this.getSides = null;
    this.onChange = null;
    this.categoryDefinitions = null;
    this.getCategoryStyle = null;
    this.dragState = null;
    this.hiddenCategories = null;
    this.visibilityKey = null;
  }
}
