const ZONE_COLORS = [
  "#63e6be",
  "#74c0fc",
  "#ffd43b",
  "#ffa94d",
  "#d0a5ff",
  "#ff8787",
  "#8ce99a",
  "#a5d8ff"
];

export class ClinicalOverlayManager {
  constructor({
    engine,
    THREE,
    stage,
    rootObject = null,
    items = [],
    getId = item => item?.mesh,
    getLabel = item =>
      item?.name ||
      item?.title ||
      item?.mesh ||
      "Ponto",
    getZone = item =>
      item?.zone ||
      item?.category ||
      "Pontos",
    getOrder = item =>
      Number.isFinite(Number(item?.order))
        ? Number(item.order)
        : null,
    clusterDistance = 48,
    onSelect = null
  } = {}) {
    this.engine = engine;
    this.THREE = THREE;
    this.stage = stage;
    this.rootObject = rootObject;
    this.items = items;
    this.getId = getId;
    this.getLabel = getLabel;
    this.getZone = getZone;
    this.getOrder = getOrder;
    this.clusterDistance = clusterDistance;
    this.onSelect = onSelect;

    this.hotspotsVisible = true;
    this.mapVisible = true;
    this.selectedId = null;
    this.activeZone = null;
    this.expandedCluster = null;
    this.lastUpdate = 0;
    this.unsubscribeFrame = null;

    this.nodes = new Map();
    this.mapNodes = new Map();
    this.zoneColors = new Map();

    this.onClick =
      this.onClick.bind(this);

    this.mount();
  }

  mount() {
    if (!this.stage) return;

    this.stage.classList.add(
      "clinical-overlay-stage"
    );

    this.hotspotLayer =
      document.createElement("div");
    this.hotspotLayer.className =
      "clinical-hotspot-layer";
    this.hotspotLayer.setAttribute(
      "aria-label",
      "Pontos interativos da cena"
    );

    this.clusterLayer =
      document.createElement("div");
    this.clusterLayer.className =
      "clinical-cluster-layer";
    this.clusterLayer.setAttribute(
      "aria-label",
      "Grupos de pontos próximos"
    );

    this.controls =
      document.createElement("div");
    this.controls.className =
      "clinical-overlay-controls";
    this.controls.innerHTML = `
      <button type="button" data-overlay-hotspots aria-pressed="true" class="active">Pontos</button>
      <button type="button" data-overlay-map aria-pressed="true" class="active">Mapa</button>
    `;

    this.minimap =
      document.createElement("aside");
    this.minimap.className =
      "clinical-minimap";
    this.minimap.innerHTML = `
      <div class="clinical-minimap-head">
        <span>MAPA DO AMBIENTE</span>
        <b data-map-count>0</b>
      </div>
      <div class="clinical-minimap-plane" data-map-plane>
        <svg class="clinical-minimap-trail" data-map-trail viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"></svg>
        <span class="clinical-minimap-camera" data-map-camera title="Posição aproximada da câmera"></span>
      </div>
      <div class="clinical-minimap-legend" data-map-legend></div>
      <small>Referência espacial simplificada · não representa planta técnica</small>
    `;

    this.stage.append(
      this.hotspotLayer,
      this.clusterLayer,
      this.controls,
      this.minimap
    );

    this.stage.addEventListener(
      "click",
      this.onClick
    );

    this.rebuild();

    this.unsubscribeFrame =
      this.engine?.onFrame?.(
        ({ time }) => {
          if (
            time -
              this.lastUpdate <
            84
          ) {
            return;
          }

          this.lastUpdate = time;
          this.update();
        }
      );
  }

  setScene({
    rootObject = this.rootObject,
    items = this.items
  } = {}) {
    this.rootObject = rootObject;
    this.items =
      Array.isArray(items)
        ? items
        : [];
    this.selectedId = null;
    this.activeZone = null;
    this.expandedCluster = null;
    this.rebuild();
    this.update(true);
  }

  zoneColor(zone) {
    const key =
      String(zone || "Pontos");

    if (
      !this.zoneColors.has(key)
    ) {
      this.zoneColors.set(
        key,
        ZONE_COLORS[
          this.zoneColors.size %
          ZONE_COLORS.length
        ]
      );
    }

    return this.zoneColors.get(key);
  }

  rebuild() {
    this.nodes.clear();
    this.mapNodes.clear();
    this.zoneColors.clear();

    this.hotspotLayer?.replaceChildren();
    this.clusterLayer?.replaceChildren();

    const plane =
      this.minimap?.querySelector(
        "[data-map-plane]"
      );

    plane
      ?.querySelectorAll(
        ".clinical-minimap-point"
      )
      .forEach(node => node.remove());

    const count =
      this.minimap?.querySelector(
        "[data-map-count]"
      );

    if (count) {
      count.textContent =
        String(this.items.length);
    }

    for (const item of this.items) {
      const id =
        this.getId(item);

      if (!id) continue;

      const label =
        this.getLabel(item);

      const zone =
        this.getZone(item) ||
        "Pontos";

      const color =
        this.zoneColor(zone);

      const button =
        document.createElement("button");

      button.type = "button";
      button.className =
        "clinical-hotspot";
      button.dataset.hotspot = id;
      button.dataset.zone = zone;
      button.style.setProperty(
        "--hotspot-color",
        color
      );
      button.innerHTML = `
        <i></i>
        <span>${this.escape(label)}</span>
      `;
      button.setAttribute(
        "aria-label",
        `Abrir ${label}`
      );

      this.hotspotLayer?.append(button);
      this.nodes.set(id,button);

      const mapButton =
        document.createElement("button");
      mapButton.type = "button";
      mapButton.className =
        "clinical-minimap-point";
      mapButton.dataset.mapPoint = id;
      mapButton.dataset.zone = zone;
      mapButton.title =
        `${label} · ${zone}`;
      mapButton.style.setProperty(
        "--zone-color",
        color
      );
      mapButton.innerHTML =
        `<i></i><span>${this.escape(label)}</span>`;

      plane?.append(mapButton);
      this.mapNodes.set(
        id,
        mapButton
      );
    }

    this.renderLegend();
  }

  renderLegend() {
    const legend =
      this.minimap?.querySelector(
        "[data-map-legend]"
      );

    if (!legend) return;

    legend.innerHTML =
      [...this.zoneColors.entries()]
        .map(([zone,color]) => `
          <button type="button" data-map-zone="${this.escape(zone)}" style="--zone-color:${color}" title="Ir para ${this.escape(zone)}">
            <i style="--zone-color:${color}"></i>
            ${this.escape(zone)}
          </button>
        `)
        .join("");
  }

  objectFor(id) {
    return (
      this.rootObject
        ?.getObjectByName?.(id) ||
      null
    );
  }

  worldCenter(object) {
    const box =
      new this.THREE.Box3()
        .setFromObject(object);

    if (box.isEmpty()) {
      return object
        .getWorldPosition(
          new this.THREE.Vector3()
        );
    }

    return box.getCenter(
      new this.THREE.Vector3()
    );
  }

  update(force = false) {
    if (
      !this.engine?.camera ||
      !this.engine?.canvas ||
      !this.rootObject
    ) {
      return;
    }

    const rect =
      this.engine.canvas
        .getBoundingClientRect();

    const mapPoints = [];
    const screenPoints = [];

    for (const item of this.items) {
      const id =
        this.getId(item);

      const object =
        this.objectFor(id);

      const node =
        this.nodes.get(id);

      if (!object || !node) {
        if (node) node.hidden = true;

        const mapNode =
          this.mapNodes.get(id);

        if (mapNode) {
          mapNode.hidden = true;
        }

        continue;
      }

      const mapNode =
        this.mapNodes.get(id);

      if (mapNode) {
        mapNode.hidden = false;
      }

      const center =
        this.worldCenter(object);

      mapPoints.push({
        id,
        item,
        x:center.x,
        y:center.y,
        order:this.getOrder(item)
      });

      const projected =
        center
          .clone()
          .project(
            this.engine.camera
          );

      const visible =
        projected.z > -1 &&
        projected.z < 1 &&
        Math.abs(projected.x) < 1.08 &&
        Math.abs(projected.y) < 1.08;

      node.hidden =
        !visible ||
        !this.hotspotsVisible;

      if (!visible) continue;

      const x =
        (projected.x * .5 + .5) *
        rect.width;

      const y =
        (-projected.y * .5 + .5) *
        rect.height;

      node.style.transform =
        `translate(${Math.round(x)}px,${Math.round(y)}px)`;

      screenPoints.push({
        id,
        item,
        x,
        y,
        node
      });
    }

    this.updateClusters(
      screenPoints
    );

    if (
      force ||
      mapPoints.length
    ) {
      this.updateMap(mapPoints);
    }
  }

  updateClusters(points) {
    this.clusterLayer
      ?.replaceChildren();

    if (
      !this.hotspotsVisible ||
      points.length < 2
    ) {
      return;
    }

    for (const point of points) {
      point.node.hidden = false;
    }

    const remaining =
      points.filter(point =>
        point.id !==
        this.selectedId
      );

    const used = new Set();

    for (let i=0;i<remaining.length;i+=1) {
      if (used.has(i)) continue;

      const anchor =
        remaining[i];

      const group = [anchor];
      used.add(i);

      for (
        let j=i+1;
        j<remaining.length;
        j+=1
      ) {
        if (used.has(j)) continue;

        const candidate =
          remaining[j];

        const distance =
          Math.hypot(
            anchor.x-candidate.x,
            anchor.y-candidate.y
          );

        if (
          distance <=
          this.clusterDistance
        ) {
          group.push(candidate);
          used.add(j);
        }
      }

      if (group.length < 2) {
        continue;
      }

      group.forEach(point =>
        point.node.hidden = true
      );

      const x =
        group.reduce(
          (sum,point) =>
            sum+point.x,
          0
        )/group.length;

      const y =
        group.reduce(
          (sum,point) =>
            sum+point.y,
          0
        )/group.length;

      const button =
        document.createElement(
          "button"
        );

      button.type = "button";
      button.className =
        "clinical-hotspot-cluster";
      button.dataset.clusterMembers =
        group
          .map(point=>point.id)
          .join(",");

      button.dataset.clusterX =
        String(x);
      button.dataset.clusterY =
        String(y);

      button.style.transform =
        `translate(${Math.round(x)}px,${Math.round(y)}px)`;

      const labels =
        group
          .slice(0,3)
          .map(point =>
            this.getLabel(
              point.item
            )
          )
          .join(" · ");

      button.innerHTML = `
        <b>${group.length}</b>
        <span>${this.escape(labels)}${group.length>3?"…":""}</span>
      `;

      button.setAttribute(
        "aria-label",
        `${group.length} pontos próximos: ${labels}`
      );

      this.clusterLayer?.append(
        button
      );
    }

    this.renderExpandedCluster();
  }

  renderExpandedCluster() {
    if (
      !this.expandedCluster ||
      !this.clusterLayer
    ) {
      return;
    }

    const {
      members,
      x,
      y
    } = this.expandedCluster;

    const valid =
      members.filter(id =>
        this.items.some(
          item =>
            this.getId(item) === id
        )
      );

    const count =
      valid.length;

    if (!count) {
      this.expandedCluster = null;
      return;
    }

    const radius =
      Math.min(
        74,
        42 + count * 6
      );

    valid.forEach(
      (id,index) => {
        const item =
          this.items.find(
            candidate =>
              this.getId(candidate) === id
          );

        if (!item) return;

        const angle =
          (-Math.PI / 2) +
          (Math.PI * 2 * index) /
          count;

        const node =
          document.createElement(
            "button"
          );

        node.type = "button";
        node.className =
          "clinical-cluster-member";
        node.dataset.clusterMember = id;
        node.style.transform =
          `translate(${Math.round(
            x +
            Math.cos(angle) *
            radius
          )}px,${Math.round(
            y +
            Math.sin(angle) *
            radius
          )}px)`;

        node.innerHTML = `
          <b>${index + 1}</b>
          <span>${this.escape(this.getLabel(item))}</span>
        `;

        node.setAttribute(
          "aria-label",
          `Abrir ${this.getLabel(item)}`
        );

        this.clusterLayer.append(
          node
        );
      }
    );
  }

  updateMap(points) {
    if (!points.length) return;

    const xs =
      points.map(point => point.x);

    const ys =
      points.map(point => point.y);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const spanX =
      Math.max(.001,maxX-minX);

    const spanY =
      Math.max(.001,maxY-minY);

    const normalized = [];

    this.mapBounds = {
      minX,
      maxX,
      minY,
      maxY,
      spanX,
      spanY
    };

    for (const point of points) {
      const node =
        this.mapNodes.get(
          point.id
        );

      if (!node) continue;

      const x =
        10 +
        ((point.x-minX)/spanX)*80;

      const y =
        88 -
        ((point.y-minY)/spanY)*76;

      node.style.left = `${x}%`;
      node.style.top = `${y}%`;

      normalized.push({
        ...point,
        mapX:x,
        mapY:y
      });
    }

    this.renderTrail(
      normalized
    );

    this.updateCameraMarker();
    this.updateActiveZone();
  }

  renderTrail(points) {
    const svg =
      this.minimap?.querySelector(
        "[data-map-trail]"
      );

    if (!svg) return;

    const ordered =
      points
        .filter(point =>
          Number.isFinite(
            point.order
          )
        )
        .sort(
          (a,b) =>
            a.order-b.order
        );

    if (ordered.length < 2) {
      svg.innerHTML = "";
      return;
    }

    const polyline =
      ordered
        .map(point =>
          `${point.mapX},${point.mapY}`
        )
        .join(" ");

    svg.innerHTML = `
      <polyline points="${polyline}" fill="none" vector-effect="non-scaling-stroke"></polyline>
    `;
  }

  updateCameraMarker() {
    const marker =
      this.minimap?.querySelector(
        "[data-map-camera]"
      );

    const bounds =
      this.mapBounds;

    const target =
      this.engine?.controls
        ?.target;

    if (
      !marker ||
      !bounds ||
      !target
    ) {
      return;
    }

    const x =
      10 +
      (
        (
          target.x -
          bounds.minX
        ) /
        bounds.spanX
      ) *
      80;

    const y =
      88 -
      (
        (
          target.y -
          bounds.minY
        ) /
        bounds.spanY
      ) *
      76;

    marker.style.left =
      `${Math.max(5,Math.min(95,x))}%`;

    marker.style.top =
      `${Math.max(5,Math.min(95,y))}%`;
  }

  updateActiveZone() {
    this.minimap
      ?.querySelectorAll(
        "[data-map-zone]"
      )
      .forEach(button =>
        button.classList.toggle(
          "active",
          Boolean(
            this.activeZone &&
            button.dataset.mapZone ===
              this.activeZone
          )
        )
      );
  }

  setSelected(id) {
    this.selectedId = id;

    const selectedItem =
      this.items.find(
        item =>
          this.getId(item) === id
      );

    this.activeZone =
      selectedItem
        ? String(
            this.getZone(
              selectedItem
            ) ||
            "Pontos"
          )
        : null;

    this.expandedCluster = null;

    for (
      const [itemId,node]
      of this.nodes
    ) {
      node.classList.toggle(
        "selected",
        itemId === id
      );
    }

    for (
      const [itemId,node]
      of this.mapNodes
    ) {
      node.classList.toggle(
        "selected",
        itemId === id
      );
    }

    this.updateActiveZone();
    this.update(true);
  }

  toggleHotspots() {
    this.hotspotsVisible =
      !this.hotspotsVisible;

    this.hotspotLayer?.classList.toggle(
      "hidden",
      !this.hotspotsVisible
    );

    this.clusterLayer?.classList.toggle(
      "hidden",
      !this.hotspotsVisible
    );

    const button =
      this.controls?.querySelector(
        "[data-overlay-hotspots]"
      );

    button?.setAttribute(
      "aria-pressed",
      String(this.hotspotsVisible)
    );

    button?.classList.toggle(
      "active",
      this.hotspotsVisible
    );

    this.update(true);
  }

  toggleMap() {
    this.mapVisible =
      !this.mapVisible;

    if (this.minimap) {
      this.minimap.hidden =
        !this.mapVisible;
    }

    const button =
      this.controls?.querySelector(
        "[data-overlay-map]"
      );

    button?.setAttribute(
      "aria-pressed",
      String(this.mapVisible)
    );

    button?.classList.toggle(
      "active",
      this.mapVisible
    );
  }

  onClick(event) {
    const hotspot =
      event.target.closest(
        "[data-hotspot]"
      );

    const mapPoint =
      event.target.closest(
        "[data-map-point]"
      );

    const cluster =
      event.target.closest(
        "[data-cluster-members]"
      );

    const id =
      hotspot?.dataset.hotspot ||
      mapPoint?.dataset.mapPoint;

    if (id) {
      event.preventDefault();
      event.stopPropagation();
      this.setSelected(id);
      this.onSelect?.(id);
      return;
    }

    if (cluster) {
      event.preventDefault();
      event.stopPropagation();

      const members =
        String(
          cluster.dataset
            .clusterMembers || ""
        )
          .split(",")
          .filter(Boolean);

      const x =
        Number(
          cluster.dataset.clusterX
        );

      const y =
        Number(
          cluster.dataset.clusterY
        );

      if (
        members.length &&
        Number.isFinite(x) &&
        Number.isFinite(y)
      ) {
        this.expandedCluster = {
          members,
          x,
          y
        };

        this.update(true);
      }
      return;
    }

    const clusterMember =
      event.target.closest(
        "[data-cluster-member]"
      );

    if (clusterMember) {
      event.preventDefault();
      event.stopPropagation();

      const memberId =
        clusterMember.dataset
          .clusterMember;

      if (memberId) {
        this.expandedCluster = null;
        this.setSelected(memberId);
        this.onSelect?.(memberId);
      }
      return;
    }

    const zoneButton =
      event.target.closest(
        "[data-map-zone]"
      );

    if (zoneButton) {
      event.preventDefault();
      event.stopPropagation();

      const zone =
        zoneButton.dataset.mapZone;

      const item =
        this.items.find(
          candidate =>
            String(
              this.getZone(candidate) ||
              "Pontos"
            ) === zone
        );

      const zoneId =
        item
          ? this.getId(item)
          : null;

      if (zoneId) {
        this.setSelected(zoneId);
        this.onSelect?.(zoneId);
      }
      return;
    }

    if (
      event.target.closest(
        "[data-overlay-hotspots]"
      )
    ) {
      this.toggleHotspots();
      return;
    }

    if (
      event.target.closest(
        "[data-overlay-map]"
      )
    ) {
      this.toggleMap();
    }
  }

  escape(value = "") {
    return String(value)
      .replace(
        /[&<>"']/g,
        char => ({
          "&":"&amp;",
          "<":"&lt;",
          ">":"&gt;",
          '"':"&quot;",
          "'":"&#039;"
        }[char])
      );
  }

  destroy() {
    this.unsubscribeFrame?.();
    this.stage?.removeEventListener(
      "click",
      this.onClick
    );

    this.hotspotLayer?.remove();
    this.clusterLayer?.remove();
    this.controls?.remove();
    this.minimap?.remove();

    this.nodes.clear();
    this.mapNodes.clear();
    this.zoneColors.clear();

    this.engine = null;
    this.THREE = null;
    this.stage = null;
    this.rootObject = null;
    this.items = [];
  }
}
