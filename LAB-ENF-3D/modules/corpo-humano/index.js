let context=null,root=null,layerData=null,structureData=null;
let engine=null,loader3d=null,layers=null,raycast=null,cameraController=null,motions=null;
let graphicsUnsub=null,THREE=null,presentationCleanup=null,layerLoadedUnsub=null;
let breathing=true,heartBeat=true,isolation=null,selectedStructureId=null,materialPresetFn=null,sceneFocus=null;

const safe=(s="")=>s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const structureByMesh=id=>structureData.structures.find(x=>x.mesh===id);

function styleLayer(object,id){
  const sharedSystem={
    skeleton:"skeleton",
    respiratory:"respiratory",
    cardiovascular:"cardiovascular",
    "heart-detail":"cardiovascular",
    urinary:"urinary",
    digestive:"digestive",
    nervous:"nervous",
    endocrine:"endocrine",
    lymphatic:"lymphatic",
    muscular:"muscular",
    "reproductive-female":"reproductiveFemale",
    "reproductive-male":"reproductiveMale",
    "skin-shell":"skin"
  }[id];

  if(sharedSystem&&materialPresetFn){
    materialPresetFn({root:object,engine,THREE,system:sharedSystem});
    object.traverse(child=>{
      if(child.isMesh)child.userData.baseScale=child.scale.clone();
    });
    return;
  }

  const palette={
    body:0xc58d78,
    skeleton:0xe6dfc5,
    respiratory:0xd77f91,
    cardiovascular:0xb83852,
    organs:0xb88478,
    "heart-detail":0xb9344f
  };

  object.traverse(child=>{
    if(!child.isMesh)return;

    child.userData.structureId=child.name;
    child.userData.baseScale=child.scale.clone();

    const isHeartDetail=id==="heart-detail";
    const blueVessel=(child.name.includes("vein")&&!child.name.includes("pulmonary_vein"))||child.name.includes("vena_cava")||child.name==="pulmonary_artery";
    const redVessel=child.name.includes("artery")||child.name==="aorta"||child.name.includes("coronary")||child.name.includes("pulmonary_vein");

    child.castShadow=id!=="body";
    child.receiveShadow=id!=="body";

    engine.replaceMaterial(child,new THREE.MeshPhysicalMaterial({
      color:blueVessel?0x41679a:redVessel?0xd94d67:(palette[id]||0xd9e2e7),
      roughness:id==="skeleton" ? 0.72 : 0.52,
      clearcoat:isHeartDetail ? 0.18 : (id==="body" ? 0.05 : 0.10),
      transparent:id==="body",
      opacity:id==="body" ? 0.22 : 1,
      side:THREE.DoubleSide
    }));
  });
}

async function ensureLayer(id){
  const box=root.querySelector(".human-loading");
  box.hidden=false;
  box.querySelector("span").textContent=`Carregando ${layerData.layers[id].label}…`;

  const object=await layers.ensure(id,{style:styleLayer});

  box.hidden=true;
  if(object){
    root.querySelector(`[data-layer-meta="${id}"]`).textContent=context.graphics.activeProfile.toUpperCase();
    raycast.setTarget(engine.scene);
  }
  return object;
}

function selectStructure(id,selectedObject=null){
  const item=structureByMesh(id);
  if(!item)return;

  selectedStructureId=id;

  if(isolation?.isolatedId){
    isolation.isolate(id);
  }

  root.querySelector(".human-info").innerHTML=
    `<span class="eyebrow">${safe(item.system)}</span><h3>${safe(item.name)}</h3><p>${safe(item.description)}</p>`;

  const targetObject=
    selectedObject ||
    engine?.scene?.getObjectByName?.(id);

  if(targetObject){
    sceneFocus?.focusTarget(targetObject,{
      distanceFactor:2.7,
      minDistance:3.0,
      maxDistance:6.0
    });
  }

  context.progress.saveModuleProgress("corpo-humano",{
    lastStructure:item.mesh,
    lastSystem:item.system
  });
}

async function toggleLayer(id,visible){
  layers.setVisible(id,visible);

  if(visible){
    const object=await ensureLayer(id);
    if(object)object.visible=true;
  }

  raycast.setTarget(engine.scene);
}

function onInput(e){
  const search=e.target.closest("[data-human-search]");
  if(search){
    renderStructureSearch(search.value);
    return;
  }

  const cutRange=e.target.closest("[data-cut-offset]");
  if(cutRange){
    isolation?.setCutOffset(Number(cutRange.value));
    const cutLabel=root.querySelector("[data-cut-offset-value]");
    if(cutLabel)cutLabel.textContent=Number(isolation?.cutOffset||0).toFixed(2);
    return;
  }

  const range=e.target.closest("[data-opacity]");
  if(!range)return;

  const id=range.dataset.opacity;
  const value=Number(range.value);

  layers.setOpacity(id,value);
  root.querySelector(`[data-opacity-label="${id}"]`).textContent=`${Math.round(value*100)}%`;
}


function normalizeStructureSearch(value=""){
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g," ")
    .replace(/\s+/g," ")
    .trim();
}

function presetForStructure(item){
  const system=normalizeStructureSearch(item?.system||"");

  if(system.includes("esqueleto"))return "skeleton";
  if(system.includes("respiratorio"))return "respiratory";
  if(system.includes("cardiovascular"))return "cardio";
  if(system.includes("urinario"))return "urinary";
  if(system.includes("digestorio"))return "digestive";
  if(system.includes("nervoso"))return "nervous";
  if(system.includes("endocrino"))return "endocrine";
  if(system.includes("linfatico"))return "lymphatic";
  if(system.includes("muscular"))return "muscular";
  if(system.includes("reprodutor feminino"))return "reproductiveFemale";
  if(system.includes("reprodutor masculino"))return "reproductiveMale";
  if(system.includes("orgao"))return "organs";

  return "overview";
}

function renderStructureSearch(query=""){
  const box=root.querySelector("[data-human-search-results]");
  if(!box)return;

  const normalized=normalizeStructureSearch(query);
  const tokens=normalized.split(" ").filter(Boolean);

  if(!tokens.length){
    box.innerHTML='<span class="human-search-empty">Digite o nome de uma estrutura para localizar a camada correspondente.</span>';
    return;
  }

  const hits=structureData.structures
    .filter(item=>{
      const text=normalizeStructureSearch(`${item.name} ${item.mesh} ${item.system||""}`);
      return tokens.every(token=>text.includes(token));
    })
    .slice(0,8);

  box.innerHTML=hits.length
    ? hits.map(item=>`
        <button class="human-search-result" data-human-structure="${safe(item.mesh)}">
          <strong>${safe(item.name)}</strong>
          <span>${safe(item.system||"Anatomia")}</span>
        </button>
      `).join("")
    : '<span class="human-search-empty">Nenhuma estrutura correspondente dentro das camadas do Corpo Humano.</span>';
}

async function focusSearchStructure(mesh){
  const item=structureByMesh(mesh);
  if(!item)return;

  const preset=presetForStructure(item);
  await applyLayerPreset(preset);

  selectedStructureId=item.mesh;
  selectStructure(item.mesh);

  const input=root.querySelector("[data-human-search]");
  if(input)input.value=item.name;

  renderStructureSearch(item.name);
}

function setSkeletonRegion(region){
  const object=layers.getObject("skeleton");
  if(!object)return;

  const groups={
    all:()=>true,
    head:name=>name==="skull",
    axial:name=>name==="skull"||name==="spine"||name==="sternum"||name==="rib_cage_cluster",
    upper:name=>name.includes("clavicle")||name.includes("scapula")||name.includes("shoulder_joint")||name.includes("humerus")||name.includes("radius")||name.includes("ulna")||name.includes("hand_cluster"),
    lower:name=>name.includes("pelvis")||name.includes("hip_joint")||name.includes("femur")||name.includes("patella")||name.includes("tibia")||name.includes("fibula")||name.includes("foot_cluster")
  };

  const matcher=groups[region]||groups.all;

  object.traverse(child=>{
    if(child.isMesh)child.visible=matcher(child.name);
  });

  root.querySelectorAll("[data-skeleton-region]").forEach(btn=>
    btn.classList.toggle("active",btn.dataset.skeletonRegion===region)
  );
}

async function isolateOrgan(group){
  if(!layers.getObject("organs")){
    const cb=root.querySelector('[data-toggle-layer="organs"]');
    cb.checked=true;
    await toggleLayer("organs",true);
  }

  const object=layers.getObject("organs");
  const allowed={
    all:()=>true,
    liver:name=>name==="liver",
    kidneys:name=>name==="left_kidney"||name==="right_kidney",
    stomach:name=>name==="stomach",
    brain:name=>name==="brain"
  }[group]||(()=>true);

  object.traverse(child=>{
    if(child.isMesh)child.visible=allowed(child.name);
  });

  root.querySelectorAll("[data-organ]").forEach(btn=>
    btn.classList.toggle("active",btn.dataset.organ===group)
  );
}


async function applyLayerPreset(preset){
  const off={
    body:false,skeleton:false,respiratory:false,cardiovascular:false,
    organs:false,"heart-detail":false,urinary:false,digestive:false,nervous:false,
    endocrine:false,lymphatic:false,muscular:false,
    "reproductive-female":false,"reproductive-male":false,"skin-shell":false
  };

  const presets={
    overview:{...off,body:true,skeleton:true},
    systems:{...off,body:true,respiratory:true,cardiovascular:true,urinary:true,digestive:true,nervous:true},
    skeleton:{...off,body:true,skeleton:true},
    cardio:{...off,body:true,cardiovascular:true},
    respiratory:{...off,body:true,respiratory:true},
    urinary:{...off,body:true,urinary:true},
    digestive:{...off,body:true,digestive:true},
    nervous:{...off,body:true,nervous:true},
    organs:{...off,body:true,organs:true},
    endocrine:{...off,body:true,endocrine:true},
    lymphatic:{...off,body:true,lymphatic:true},
    muscular:{...off,body:true,muscular:true},
    reproductiveFemale:{...off,body:true,"reproductive-female":true},
    reproductiveMale:{...off,body:true,"reproductive-male":true},
    skin:{...off,"skin-shell":true}
  };

  const state=presets[preset]||presets.overview;
  const pending=[];

  for(const [id,visible] of Object.entries(state)){
    const checkbox=root.querySelector(`[data-toggle-layer="${id}"]`);
    if(checkbox)checkbox.checked=visible;
    layers.setVisible(id,visible);

    if(visible){
      const object=layers.getObject(id);
      if(object)object.visible=true;
      else pending.push(toggleLayer(id,true));
    }
  }

  isolation?.clearIsolation();
  selectedStructureId=null;
  root.querySelector('[data-tool="isolate-selection"]')?.classList.remove("active");

  root.querySelectorAll("[data-layer-preset]").forEach(btn=>
    btn.classList.toggle("active",btn.dataset.layerPreset===preset)
  );

  await Promise.allSettled(pending);
  raycast.setTarget(engine.scene);
}

function updateMotionBadges(){
  root.querySelector('[data-motion="breathing"]').classList.toggle("on",breathing);
  root.querySelector('[data-motion="heart"]').classList.toggle("on",heartBeat);
}

function resetBreathingPose(){
  const respiratory=layers?.getObject("respiratory");
  respiratory?.traverse(child=>{
    if(!child.isMesh||!(child.name==="left_lung"||child.name==="right_lung"))return;
    const base=child.userData.baseScale;
    if(base)child.scale.copy(base);
  });
}

function resetHeartPose(){
  const heart=layers?.getObject("heart-detail");
  const base=heart?.userData.layerBaseScale;
  if(heart&&base)heart.scale.copy(base);
}


async function resetHumanState(){
  cameraController?.go("front");
  isolation?.reset();
  selectedStructureId=null;
  root.querySelector('[data-tool="isolate-selection"]')?.classList.remove("active");
  root.querySelectorAll("[data-cut]").forEach(btn=>btn.classList.remove("active"));
  const cutRange=root.querySelector("[data-cut-offset]");
  if(cutRange)cutRange.value=0;
  const cutLabel=root.querySelector("[data-cut-offset-value]");
  if(cutLabel)cutLabel.textContent="0.00";
  const humanSearch=root.querySelector("[data-human-search]");
  if(humanSearch)humanSearch.value="";
  renderStructureSearch("");

  // Restore default visibility without forcing lazy layers to load.
  const ensures=[];

  for(const [id,cfg] of Object.entries(layerData.layers)){
    const visible=cfg.visible ?? true;
    const checkbox=root.querySelector(`[data-toggle-layer="${id}"]`);
    if(checkbox)checkbox.checked=visible;

    layers.setVisible(id,visible);

    const object=layers.getObject(id);
    if(visible && !object){
      ensures.push(
        ensureLayer(id).then(loaded=>{
          if(loaded)loaded.visible=true;
        })
      );
    }else if(object){
      object.visible=visible;
    }

    const opacity=cfg.opacity ?? 1;
    layers.setOpacity(id,opacity);
    const range=root.querySelector(`[data-opacity="${id}"]`);
    if(range)range.value=opacity;
    const label=root.querySelector(`[data-opacity-label="${id}"]`);
    if(label)label.textContent=`${Math.round(opacity*100)}%`;
  }

  // Only reset organ filtering if the lazy organ layer already exists.
  const organObject=layers.getObject("organs");
  if(organObject){
    organObject.traverse(child=>{
      if(child.isMesh)child.visible=true;
    });
  }

  root.querySelectorAll("[data-organ]").forEach(btn=>
    btn.classList.toggle("active",btn.dataset.organ==="all")
  );

  root.querySelectorAll("[data-layer-preset]").forEach(btn=>
    btn.classList.toggle("active",btn.dataset.layerPreset==="overview")
  );

  const skeletonObject=layers.getObject("skeleton");
  if(skeletonObject)setSkeletonRegion("all");

  motions.setEnabled("breathing",true);
  motions.setEnabled("heart",true);
  breathing=true;
  heartBeat=true;
  resetBreathingPose();
  resetHeartPose();
  updateMotionBadges();

  root.querySelector('[data-tool="breathing"]')?.classList.add("active");
  root.querySelector('[data-tool="heart-motion"]')?.classList.add("active");

  root.querySelector(".human-info").innerHTML=
    '<span class="eyebrow">Exploração integrada</span><h3>Corpo humano modular</h3><p>Configuração inicial restaurada sem carregar sistemas que ainda estavam sob demanda.</p>';

  await Promise.allSettled(ensures);
  raycast.setTarget(engine.scene);
}

function onClick(e){
  const searchResult=e.target.closest("[data-human-structure]");
  if(searchResult){
    focusSearchStructure(searchResult.dataset.humanStructure);
    return;
  }

  const toggle=e.target.closest("[data-toggle-layer]");
  if(toggle){
    toggleLayer(toggle.dataset.toggleLayer,toggle.checked);
    return;
  }

  const region=e.target.closest("[data-skeleton-region]");
  if(region){
    setSkeletonRegion(region.dataset.skeletonRegion);
    return;
  }

  const organ=e.target.closest("[data-organ]");
  if(organ){
    isolateOrgan(organ.dataset.organ);
    return;
  }

  const preset=e.target.closest("[data-layer-preset]");
  if(preset){
    applyLayerPreset(preset.dataset.layerPreset);
    return;
  }

  const cut=e.target.closest("[data-cut]");
  if(cut){
    const next=isolation?.cutMode===cut.dataset.cut?"none":cut.dataset.cut;
    isolation?.setCut(next);
    root.querySelectorAll("[data-cut]").forEach(btn=>
      btn.classList.toggle("active",btn.dataset.cut===isolation?.cutMode)
    );
    return;
  }

  const tool=e.target.closest("[data-tool]");
  if(!tool)return;

  const a=tool.dataset.tool;

  if(["front","side","back"].includes(a))cameraController?.go(a);

  if(a==="isolate-selection"){
    if(!selectedStructureId)return;
    if(isolation?.isolatedId===selectedStructureId){
      isolation.clearIsolation();
      tool.classList.remove("active");
    }else{
      isolation?.isolate(selectedStructureId);
      tool.classList.add("active");
    }
  }

  if(a==="breathing"){
    breathing=motions.toggle("breathing");
    if(!breathing)resetBreathingPose();
    tool.classList.toggle("active",breathing);
    updateMotionBadges();
  }

  if(a==="heart-motion"){
    heartBeat=motions.toggle("heart");
    if(!heartBeat)resetHeartPose();
    tool.classList.toggle("active",heartBeat);
    updateMotionBadges();
  }

  if(a==="skeleton"){
    for(const id of Object.keys(layerData.layers)){
      const show=id==="body"||id==="skeleton";
      const cb=root.querySelector(`[data-toggle-layer="${id}"]`);
      cb.checked=show;
      toggleLayer(id,show);
    }
    setSkeletonRegion("all");
  }

  if(a==="all"){
    applyLayerPreset("systems");
  }

  if(a==="reset"){
    resetHumanState();
  }
}

function installMotions(){
  motions.add("breathing",({time})=>{
    const respiratory=layers.getObject("respiratory");
    if(!respiratory||!respiratory.visible)return;

    const phase=(Math.sin(time*.0018)+1)/2;
    const sx=1+phase*.035;
    const sz=1+phase*.065;

    respiratory.traverse(child=>{
      if(!child.isMesh||!(child.name==="left_lung"||child.name==="right_lung"))return;
      const base=child.userData.baseScale;
      if(!base)return;
      child.scale.set(base.x*sx,base.y*sx,base.z*sz);
    });
  },true);

  motions.add("heart",({time})=>{
    const heart=layers.getObject("heart-detail");
    if(!heart||!heart.visible)return;

    const base=heart.userData.layerBaseScale;
    if(!base)return;

    const pulse=1+Math.max(0,Math.sin(time*.0075))**12*.035;
    heart.scale.set(base.x*pulse,base.y*pulse,base.z*pulse);
  },true);
}

async function mount3D(){
  const imports=await Promise.all([
    import("../../engines/ThreeEngine.js"),
    import("../../engines/CameraController.js"),
    import("../../engines/GLBAssetLoader.js"),
    import("../../engines/RaycastManager.js"),
    import("../../engines/LayeredModelManager.js"),
    import("../../engines/MotionManager.js"),
    import("../../engines/AnatomyIsolationManager.js"),
    import("../../engines/AnatomyMaterialPreset.js"),
    import("../../engines/SceneFocusManager.js")
  ]);

  const {ThreeEngine,THREE:ThreeNS}=imports[0];
  THREE=ThreeNS;

  const {CameraController}=imports[1];
  const {GLBAssetLoader}=imports[2];
  const {RaycastManager}=imports[3];
  const {LayeredModelManager}=imports[4];
  const {MotionManager}=imports[5];
  const {AnatomyIsolationManager}=imports[6];
  materialPresetFn=imports[7].applyAnatomyMaterialPreset;
  const {SceneFocusManager}=imports[8];

  engine=new ThreeEngine({
    host:root.querySelector(".three-host"),
    graphics:context.graphics,
    events:context.events,
    background:0x06131f,
    camera:{fov:34,near:.05,far:80}
  });

  const {applyAnatomyPresentation,registerAnatomyViews}=await import("../../engines/AnatomyPresentationPreset.js");
  presentationCleanup=applyAnatomyPresentation({engine,THREE,events:context.events,mood:"human"});
  engine.focus([0,-7.8,1.1],[0,0,1.0]);
  engine.controls.minDistance=5;
  engine.controls.maxDistance=12;
  sceneFocus=new SceneFocusManager({engine,THREE});

  loader3d=new GLBAssetLoader({events:context.events});

  layers=new LayeredModelManager({
    engine,
    loader:loader3d,
    graphics:context.graphics,
    events:context.events
  });

  isolation=new AnatomyIsolationManager({engine,THREE});

  layerLoadedUnsub=context.events.on("layer:loaded",({object,previousObject})=>{
    if(previousObject)isolation.unregisterRoot(previousObject);
    if(object)isolation.registerRoot(object);
  });

  for(const [id,cfg] of Object.entries(layerData.layers)){
    layers.register(id,cfg);
  }

  cameraController=new CameraController(engine);
  registerAnatomyViews(cameraController,{distance:7.8,target:[0,0,1.0]});

  raycast=new RaycastManager({
    engine,
    target:engine.scene,
    selectable:id=>Boolean(structureByMesh(id)),
    onSelect:({id,object})=>selectStructure(id,object)
  });

  motions=new MotionManager(engine);
  installMotions();

  await ensureLayer("body");
  await ensureLayer("skeleton");
  setSkeletonRegion("all");

  graphicsUnsub=context.events.on("graphics:profileChanged",async()=>{
    const box=root.querySelector(".human-loading");
    box.hidden=false;
    box.querySelector("span").textContent="Atualizando qualidade dos sistemas…";

    await layers.reloadAll({style:styleLayer});

    box.hidden=true;
    raycast.setTarget(engine.scene);

    root.querySelector("[data-profile]").textContent=context.graphics.activeProfile;

    for(const id of Object.keys(layerData.layers)){
      if(layers.getObject(id)){
        root.querySelector(`[data-layer-meta="${id}"]`).textContent=context.graphics.activeProfile.toUpperCase();
      }
    }
  });

  engine.start();
}

export default{
  async mount(ctx){
    context=ctx;

    [layerData,structureData]=await Promise.all([
      context.assets.loadJson("./modules/corpo-humano/data/layers.json"),
      context.assets.loadJson("./modules/corpo-humano/data/structures.json")
    ]);

    root=document.createElement("section");
    root.className="human-lab";

    root.innerHTML=`
      <div class="human-stage">
        <div class="three-host"></div>

        <div class="human-badge">
          CORPO HUMANO · G3 · v0.37 · <span data-profile>${context.graphics.activeProfile}</span>
        </div>

        <div class="human-motion-badge">
          <span class="on" data-motion="breathing">RESPIRAÇÃO</span>
          <span class="on" data-motion="heart">BATIMENTO</span>
        </div>

        <div class="human-loading">
          <strong>Carregando sistema</strong>
          <span>Preparando…</span>
        </div>
      </div>

      <aside class="human-panel">
        <span class="eyebrow">Anatomia integrada · G3 · v0.37</span>
        <h2>Corpo Humano G3 — Camadas Integradas</h2>
        <p>
          Quinze camadas G3, sistemas compartilhados, cortes ajustáveis,
          isolamento de estruturas e movimentos fisiológicos didáticos.
        </p>

        <div class="human-info">
          <span class="eyebrow">Exploração integrada</span>
          <h3>Corpo humano modular</h3>
          <p>Ative sistemas, observe os movimentos didáticos e clique nas estruturas visíveis.</p>
        </div>

        <div class="human-tools">
          <button class="human-tool" data-tool="front">Frontal</button>
          <button class="human-tool" data-tool="side">Lateral</button>
          <button class="human-tool" data-tool="back">Posterior</button>
          <button class="human-tool active" data-tool="breathing">Respiração</button>
          <button class="human-tool active" data-tool="heart-motion">Batimento</button>
          <button class="human-tool" data-tool="reset">Resetar</button>
        </div>

        <span class="eyebrow">Localizar estrutura</span>
        <div class="human-structure-search">
          <input data-human-search type="search" autocomplete="off" placeholder="Ex.: adrenal, patela, ureter, linfonodo…">
          <div data-human-search-results>
            <span class="human-search-empty">Digite o nome de uma estrutura para localizar a camada correspondente.</span>
          </div>
        </div>

        <span class="eyebrow">Corte e isolamento</span>
        <div class="human-tools">
          <button class="human-tool" data-tool="isolate-selection">Isolar seleção</button>
          <button class="human-tool" data-cut="sagittal">Corte sagital</button>
          <button class="human-tool" data-cut="transverse">Corte transversal</button>
        </div>
        <div class="human-cut-control">
          <strong>Posição do plano</strong>
          <input data-cut-offset type="range" min="-2" max="2" step=".05" value="0">
          <div><span>-2</span><span data-cut-offset-value>0.00</span><span>+2</span></div>
        </div>

        <span class="eyebrow">Visões rápidas</span>
        <div class="human-tools layer-presets">
          <button class="human-tool active" data-layer-preset="overview">Visão geral</button>
          <button class="human-tool" data-layer-preset="systems">Sistemas internos</button>
          <button class="human-tool" data-layer-preset="skeleton">Esqueleto</button>
          <button class="human-tool" data-layer-preset="cardio">Cardiovascular</button>
          <button class="human-tool" data-layer-preset="respiratory">Respiratório</button>
          <button class="human-tool" data-layer-preset="urinary">Urinário</button>
          <button class="human-tool" data-layer-preset="digestive">Digestório</button>
          <button class="human-tool" data-layer-preset="nervous">Nervoso</button>
          <button class="human-tool" data-layer-preset="endocrine">Endócrino</button>
          <button class="human-tool" data-layer-preset="lymphatic">Linfático</button>
          <button class="human-tool" data-layer-preset="muscular">Muscular</button>
          <button class="human-tool" data-layer-preset="reproductiveFemale">Reprodutor F.</button>
          <button class="human-tool" data-layer-preset="reproductiveMale">Reprodutor M.</button>
          <button class="human-tool" data-layer-preset="skin">Pele externa</button>
        </div>

        <span class="eyebrow">Sistemas e camadas</span>
        <div class="layer-list">
          ${Object.entries(layerData.layers).map(([id,cfg])=>`
            <div class="layer-row">
              <div class="layer-head">
                <label>
                  <input type="checkbox" data-toggle-layer="${id}" ${cfg.visible?"checked":""}>
                  ${safe(cfg.label)}
                </label>
                <span class="badge" data-layer-meta="${id}">
                  ${cfg.visible?"—":"sob demanda"}
                </span>
              </div>
              <input
                type="range"
                min="0.08"
                max="1"
                step="0.04"
                value="${cfg.opacity}"
                data-opacity="${id}"
              >
              <div class="layer-meta">
                Opacidade:
                <span data-opacity-label="${id}">
                  ${Math.round(cfg.opacity*100)}%
                </span>
              </div>
            </div>
          `).join("")}
        </div>

        <div class="toolbox-section">
          <h3>Esqueleto por regiões</h3>
          <p>Carregue o esqueleto e isole grupos didáticos.</p>
          <div class="region-tools">
            <button class="human-tool active" data-skeleton-region="all">Completo</button>
            <button class="human-tool" data-skeleton-region="head">Crânio</button>
            <button class="human-tool" data-skeleton-region="axial">Axial</button>
            <button class="human-tool" data-skeleton-region="upper">Membros sup.</button>
            <button class="human-tool" data-skeleton-region="lower">Membros inf.</button>
            <button class="human-tool" data-tool="skeleton">Modo esqueleto</button>
          </div>
        </div>

        <div class="toolbox-section">
          <h3>Órgãos isoláveis</h3>
          <p>Ative a camada de órgãos automaticamente e isole estruturas.</p>
          <div class="organ-tools">
            <button class="human-tool active" data-organ="all">Todos</button>
            <button class="human-tool" data-organ="liver">Fígado</button>
            <button class="human-tool" data-organ="kidneys">Rins</button>
            <button class="human-tool" data-organ="stomach">Estômago</button>
            <button class="human-tool" data-organ="brain">Encéfalo</button>
            <button class="human-tool" data-tool="all">Sistemas principais</button>
          </div>
        </div>

        <div class="human-note">
          As animações são representações didáticas simplificadas para compreensão
          espacial e visual; não representam medições fisiológicas reais.
        </div>
      </aside>
    `;

    root.addEventListener("click",onClick);
    root.addEventListener("input",onInput);
    context.host.append(root);

    try{
      await mount3D();
    }catch(error){
      console.error(error);
      root.querySelector(".human-loading").hidden=true;
      const {renderAnatomyFallback}=await import("../../services/AnatomyFallbackRenderer.js");
      renderAnatomyFallback({
        host:root.querySelector(".human-stage"),
        title:"Corpo Humano G3",
        structures:structureData.structures,
        note:"Fallback 2D/SVG para reconhecimento geral quando WebGL não estiver disponível."
      });
    }
  },

  async start(){
    engine?.start();
  },

  pause(){
    engine?.pause();
  },

  async destroy(){
    graphicsUnsub?.();
    layerLoadedUnsub?.();
    presentationCleanup?.();
    isolation?.destroy();
    motions?.destroy();
    raycast?.destroy();
    cameraController?.destroy();
    layers?.destroy();
    loader3d?.destroy();
    engine?.destroy();

    root?.removeEventListener("click",onClick);
    root?.removeEventListener("input",onInput);
    root?.remove();

    context=null;
    root=null;
    layerData=null;
    structureData=null;
    engine=null;
    loader3d=null;
    layers=null;
    raycast=null;
    cameraController=null;
    motions=null;
    THREE=null;
  }
};
