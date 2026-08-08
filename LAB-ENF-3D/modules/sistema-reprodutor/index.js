let loadGuard=null;
let context=null,root=null,data=null,content=null,engine=null,loader=null,raycast=null,cameras=null,modelRoot=null,THREE=null,graphicsUnsub=null,current="female",presentationCleanup=null,isolation=null,selectedId=null;

const safe=(s="")=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const cfg=()=>data.views[current];
const items=()=>content[current]||[];
const item=id=>items().find(x=>x.mesh===id);

function select(id){
  const x=item(id);if(!x)return;
  selectedId=id;
  if(isolation?.isolatedId)isolation.isolate(id);
  root.querySelector(".anatomy16-info").innerHTML=`<span class="eyebrow">Estrutura selecionada</span><h3>${safe(x.name)}</h3><p>${safe(x.description)}</p>`;
  root.querySelectorAll("[data-structure]").forEach(b=>b.classList.toggle("active",b.dataset.structure===id));
}

function syncCut(){
  root.querySelectorAll("[data-cut]").forEach(b=>b.classList.toggle("active",b.dataset.cut===isolation?.cutMode));
  const label=root.querySelector("[data-cut-offset-value]");
  if(label)label.textContent=Number(isolation?.cutOffset||0).toFixed(2);
}

function renderList(){
  root.querySelector(".anatomy16-list").innerHTML=items().map(x=>`<button class="anatomy16-row anatomy16-row-button" data-structure="${safe(x.mesh)}">${safe(x.name)}</button>`).join("");
}

async function loadModel(){
  if(!loadGuard){
    const {AsyncLoadGuard}=await import("../../engines/AsyncLoadGuard.js");
    loadGuard=new AsyncLoadGuard();
  }

  const token=loadGuard.begin();
  const gltf=await loader.load(context.assets.chooseVariant({variants:cfg().variants}));
  if(!loadGuard.isCurrent(token)){loadGuard.disposeObject(gltf.scene);return}

  if(modelRoot){
    isolation?.unregisterRoot(modelRoot);
    engine.scene.remove(modelRoot);
    engine.disposeObject(modelRoot);
  }

  modelRoot=gltf.scene;

  const {applyAnatomyMaterialPreset}=await import("../../engines/AnatomyMaterialPreset.js");
  applyAnatomyMaterialPreset({
    root:modelRoot,
    engine,
    THREE,
    system:current==="female"?"reproductiveFemale":"reproductiveMale"
  });

  const box=new THREE.Box3().setFromObject(modelRoot);
  const center=box.getCenter(new THREE.Vector3());
  const size=box.getSize(new THREE.Vector3());
  modelRoot.position.sub(center);
  modelRoot.scale.setScalar(4.4/Math.max(size.x,size.y,size.z));

  engine.scene.add(modelRoot);
  isolation.registerRoot(modelRoot);
  raycast.setTarget(modelRoot);

  selectedId=null;
  isolation.clearIsolation();

  root.querySelectorAll("[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===current));
  root.querySelector('[data-tool="isolate"]')?.classList.remove("active");
  renderList();
  root.querySelector(".anatomy16-info").innerHTML=`<span class="eyebrow">${safe(cfg().label)}</span><h3>Explore o modelo</h3><p>Selecione uma estrutura, use isolamento ou corte gráfico.</p>`;
}

function onInput(e){
  const range=e.target.closest("[data-cut-offset]");
  if(!range)return;
  isolation?.setCutOffset(Number(range.value));
  syncCut();
}

function onClick(e){
  const structure=e.target.closest("[data-structure]");
  if(structure){select(structure.dataset.structure);return}

  const view=e.target.closest("[data-view]");
  if(view){
    current=view.dataset.view;
    loadModel();
    return;
  }

  const cut=e.target.closest("[data-cut]");
  if(cut){
    isolation.setCut(isolation.cutMode===cut.dataset.cut?"none":cut.dataset.cut);
    syncCut();
    return;
  }

  const tool=e.target.closest("[data-tool]");
  if(!tool)return;
  const action=tool.dataset.tool;

  if(action==="front")cameras?.go("front");
  if(action==="side")cameras?.go("side");
  if(action==="top")cameras?.go("top");

  if(action==="isolate"){
    if(!selectedId)return;
    if(isolation.isolatedId===selectedId){
      isolation.clearIsolation();
      tool.classList.remove("active");
    }else{
      isolation.isolate(selectedId);
      tool.classList.add("active");
    }
  }

  if(action==="reset"){
    selectedId=null;
    isolation.reset();
    cameras?.go("front");
    root.querySelector('[data-tool="isolate"]')?.classList.remove("active");
    root.querySelectorAll("[data-structure]").forEach(b=>b.classList.remove("active"));
    const range=root.querySelector("[data-cut-offset]");
    if(range)range.value=0;
    syncCut();
  }
}

async function mount3D(){
  const imports=await Promise.all([
    import("../../engines/ThreeEngine.js"),
    import("../../engines/CameraController.js"),
    import("../../engines/GLBAssetLoader.js"),
    import("../../engines/RaycastManager.js"),
    import("../../engines/AnatomyIsolationManager.js")
  ]);

  const {ThreeEngine,THREE:ThreeNS}=imports[0];THREE=ThreeNS;
  const {CameraController}=imports[1],{GLBAssetLoader}=imports[2],{RaycastManager}=imports[3],{AnatomyIsolationManager}=imports[4];

  engine=new ThreeEngine({host:root.querySelector(".three-host"),graphics:context.graphics,events:context.events,background:0x07131f,camera:{fov:34,near:.05,far:60}});
  const {applyAnatomyPresentation,registerAnatomyViews}=await import("../../engines/AnatomyPresentationPreset.js");
  presentationCleanup=applyAnatomyPresentation({engine,THREE,events:context.events,mood:"reproductive"});
  engine.focus([0,-5.8,.7],[0,0,0]);

  loader=new GLBAssetLoader({events:context.events});
  raycast=new RaycastManager({engine,target:null,selectable:id=>Boolean(item(id)),onSelect:({id})=>select(id)});
  cameras=new CameraController(engine);
  registerAnatomyViews(cameras,{distance:5.8,target:[0,0,0],top:true});
  isolation=new AnatomyIsolationManager({engine,THREE});

  await loadModel();
  graphicsUnsub=context.events.on("graphics:profileChanged",loadModel);
  engine.start();
}

export default{
  async mount(ctx){
    context=ctx;
    [data,content]=await Promise.all([
      context.assets.loadJson("./modules/sistema-reprodutor/data/models.json"),
      context.assets.loadJson("./modules/sistema-reprodutor/data/content.json")
    ]);

    root=document.createElement("section");
    root.className="anatomy16-lab";
    root.innerHTML=`<div class="anatomy16-stage"><div class="three-host"></div><div class="anatomy16-badge">SISTEMA REPRODUTOR · G3</div></div><aside class="anatomy16-panel"><span class="eyebrow">Anatomia compartilhada · G3 · v0.27</span><h2>Sistema Reprodutor G3</h2><p>Modelos internos femininos e masculinos com equivalência semântica LOW/MEDIUM/HIGH, isolamento e corte ajustável.</p><div class="anatomy16-tabs"><button class="anatomy16-tab active" data-view="female">Feminino</button><button class="anatomy16-tab" data-view="male">Masculino</button></div><div class="anatomy16-info"></div><div class="anatomy16-tools"><button class="anatomy16-tool" data-tool="front">Frontal</button><button class="anatomy16-tool" data-tool="side">Lateral</button><button class="anatomy16-tool" data-tool="top">Superior</button><button class="anatomy16-tool" data-tool="isolate">Isolar seleção</button><button class="anatomy16-tool" data-cut="sagittal">Corte sagital</button><button class="anatomy16-tool" data-cut="transverse">Corte transversal</button><button class="anatomy16-tool" data-tool="reset">Resetar</button></div><div class="anatomy16-cut"><strong>Posição do plano</strong><input data-cut-offset type="range" min="-2" max="2" step=".05" value="0"><div><span>-2</span><span data-cut-offset-value>0.00</span><span>+2</span></div></div><div class="anatomy16-list"></div><div class="anatomy16-note">Conteúdo anatômico educacional, interno e esquemático. Não representa exame, diagnóstico, função sexual ou orientação clínica.</div></aside>`;

    root.addEventListener("click",onClick);
    root.addEventListener("input",onInput);
    context.host.append(root);

    try{await mount3D()}
    catch(error){
      console.error(error);
      const {renderAnatomyFallback}=await import("../../services/AnatomyFallbackRenderer.js");
      renderAnatomyFallback({host:root.querySelector(".anatomy16-stage"),title:"Sistema Reprodutor G3",structures:items(),note:"Fallback 2D/SVG para reconhecimento anatômico quando WebGL não estiver disponível."});
    }
  },
  async start(){engine?.start()},
  pause(){engine?.pause()},
  async destroy(){
    loadGuard?.invalidate();
    graphicsUnsub?.();
    presentationCleanup?.();
    isolation?.destroy();
    raycast?.destroy();
    cameras?.destroy();
    loader?.destroy();
    if(modelRoot&&engine){engine.scene.remove(modelRoot);engine.disposeObject(modelRoot)}
    engine?.destroy();
    root?.removeEventListener("click",onClick);
    root?.removeEventListener("input",onInput);
    root?.remove();
    context=root=data=content=engine=loader=raycast=cameras=modelRoot=THREE=isolation=null;
  }
};
