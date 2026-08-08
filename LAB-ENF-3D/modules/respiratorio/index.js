let loadGuard=null;
let context=null,root=null,modelManifest=null,structureData=null;
let engine=null,loader=null,raycast=null,cameras=null,motions=null,modelRoot=null,graphicsUnsub=null,THREE=null;
let breathing=true,amplitude=.06,baseScale=1,presentationCleanup=null,isolation=null,selectedId=null,sceneFocus=null,tourManager=null;

const safe=(s="")=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const itemByMesh=id=>structureData.structures.find(x=>x.mesh===id);

function select(id){
  const item=itemByMesh(id);if(!item)return;
  selectedId=id;
  root.querySelector(".resp-info").innerHTML=`<span class="eyebrow">Estrutura selecionada</span><h3>${safe(item.name)}</h3><p>${safe(item.description)}</p>`;
  root.querySelectorAll("[data-structure]").forEach(b=>b.classList.toggle("active",b.dataset.structure===id));
  sceneFocus?.focusObject(modelRoot,id,{distanceFactor:2.8,minDistance:2.4,maxDistance:5.2});
}

function resetPose(){
  modelRoot?.traverse(child=>{
    const base=child.userData.baseScale;
    const basePosition=child.userData.basePosition;
    if(child.isMesh&&base)child.scale.copy(base);
    if(child.isMesh&&basePosition)child.position.copy(basePosition);
  });
}

function syncCutButtons(){
  root.querySelectorAll("[data-cut]").forEach(btn=>
    btn.classList.toggle("active",btn.dataset.cut===isolation?.cutMode)
  );
}

async function loadModel(){
  const url=context.assets.chooseVariant(modelManifest);
  if(!loadGuard){
    const {AsyncLoadGuard}=await import("../../engines/AsyncLoadGuard.js");
    loadGuard=new AsyncLoadGuard();
  }

  const loadToken=loadGuard.begin();
  const gltf=await loader.load(url);
  if(!loadGuard.isCurrent(loadToken)){loadGuard.disposeObject(gltf.scene);return}

  if(modelRoot){
    isolation?.unregisterRoot(modelRoot);
    engine.scene.remove(modelRoot);
    engine.disposeObject(modelRoot);
  }

  modelRoot=gltf.scene;

  const {applyAnatomyMaterialPreset}=await import("../../engines/AnatomyMaterialPreset.js");
  applyAnatomyMaterialPreset({root:modelRoot,engine,THREE,system:"respiratory"});

  modelRoot.traverse(child=>{
    if(!child.isMesh)return;
    child.userData.baseScale=child.scale.clone();
    child.userData.basePosition=child.position.clone();
  });

  const box=new THREE.Box3().setFromObject(modelRoot);
  const center=box.getCenter(new THREE.Vector3());
  const size=box.getSize(new THREE.Vector3());
  modelRoot.position.sub(center);
  baseScale=3.9/Math.max(size.x,size.y,size.z);
  modelRoot.scale.setScalar(baseScale);

  engine.scene.add(modelRoot);
  isolation.registerRoot(modelRoot);
  raycast.setTarget(modelRoot);
  root.querySelector("[data-quality]").textContent=context.graphics.activeProfile.toUpperCase();
}

function installMotion(){
  motions.add("breathing",({time})=>{
    if(!modelRoot||document.documentElement.classList.contains("reduced-motion"))return;
    const phase=(Math.sin(time*.0022)+1)/2;

    modelRoot.traverse(child=>{
      if(!child.isMesh)return;
      const base=child.userData.baseScale;if(!base)return;

      if(child.name==="left_lung"||child.name==="right_lung"){
        child.scale.set(
          base.x*(1+phase*amplitude*.65),
          base.y*(1+phase*amplitude*.45),
          base.z*(1+phase*amplitude)
        );
      }

      if(child.name==="diaphragm"){
        const basePosition=child.userData.basePosition;
        if(basePosition)child.position.z=basePosition.z-phase*amplitude*.7;
      }
    });
  },true);
}

function onInput(e){
  const cutRange=e.target.closest("[data-cut-offset]");
  if(cutRange){
    isolation?.setCutOffset(Number(cutRange.value));
    const label=root.querySelector("[data-cut-offset-value]");
    if(label)label.textContent=Number(isolation?.cutOffset||0).toFixed(2);
    return;
  }

  const range=e.target.closest("[data-amplitude]");
  if(!range)return;
  amplitude=Number(range.value);
  root.querySelector("[data-amplitude-value]").textContent=`${Math.round(amplitude*100)}%`;
}

function onClick(e){
  const structure=e.target.closest("[data-structure]");
  if(structure){select(structure.dataset.structure);return}

  const cut=e.target.closest("[data-cut]");
  if(cut){
    const next=isolation.cutMode===cut.dataset.cut?"none":cut.dataset.cut;
    isolation.setCut(next);
    syncCutButtons();
    return;
  }

  const tool=e.target.closest("[data-tool]");
  if(!tool)return;
  const a=tool.dataset.tool;

  if(a==="breathing"){
    breathing=motions.toggle("breathing");
    tool.classList.toggle("active",breathing);
    if(!breathing)resetPose();
  }

  if(["front","side","top"].includes(a))cameras?.go(a);
  if(a==="lungs"){cameras?.go("front");select("left_lung")}
  if(a==="airway"){cameras?.go("front");select("trachea")}

  if(a==="isolate"){
    if(!selectedId)return;
    if(isolation.isolatedId===selectedId){
      isolation.clearIsolation();
      tool.classList.remove("active");
    }else{
      isolation.isolate(selectedId);
      tool.classList.add("active");
    }
  }

  if(a==="reset"){
    cameras?.go("front");
    amplitude=.06;
    breathing=true;
    motions.setEnabled("breathing",true);
    isolation.reset();
    selectedId=null;
    root.querySelector("[data-amplitude]").value=.06;
    root.querySelector("[data-amplitude-value]").textContent="6%";
    const cutRange=root.querySelector("[data-cut-offset]");
    if(cutRange)cutRange.value=0;
    const cutLabel=root.querySelector("[data-cut-offset-value]");
    if(cutLabel)cutLabel.textContent="0.00";
    root.querySelector('[data-tool="breathing"]')?.classList.add("active");
    root.querySelector('[data-tool="isolate"]')?.classList.remove("active");
    root.querySelectorAll("[data-structure]").forEach(b=>b.classList.remove("active"));
    syncCutButtons();
    resetPose();
  }
}

async function mount3D(){
  const imports=await Promise.all([
    import("../../engines/ThreeEngine.js"),
    import("../../engines/CameraController.js"),
    import("../../engines/GLBAssetLoader.js"),
    import("../../engines/RaycastManager.js"),
    import("../../engines/MotionManager.js"),
    import("../../engines/AnatomyIsolationManager.js"),
    import("../../engines/SceneFocusManager.js"),
    import("../../services/ClinicalTourManager.js")
  ]);

  const {ThreeEngine,THREE:ThreeNS}=imports[0];THREE=ThreeNS;
  const {CameraController}=imports[1],{GLBAssetLoader}=imports[2],{RaycastManager}=imports[3],{MotionManager}=imports[4],{AnatomyIsolationManager}=imports[5],{SceneFocusManager}=imports[6],{ClinicalTourManager}=imports[7];

  engine=new ThreeEngine({host:root.querySelector(".three-host"),graphics:context.graphics,events:context.events,background:0x06131f,camera:{fov:36,near:.05,far:60}});
  const {applyAnatomyPresentation,registerAnatomyViews}=await import("../../engines/AnatomyPresentationPreset.js");
  presentationCleanup=applyAnatomyPresentation({engine,THREE,events:context.events,mood:"respiratory"});
  engine.focus([0,-6.2,1.0],[0,0,.5]);
  sceneFocus=new SceneFocusManager({engine,THREE});

  loader=new GLBAssetLoader({events:context.events});
  raycast=new RaycastManager({engine,target:null,selectable:id=>Boolean(itemByMesh(id)),onSelect:({id})=>select(id)});
  cameras=new CameraController(engine);
  registerAnatomyViews(cameras,{distance:6.2,target:[0,0,.5],top:true});
  isolation=new AnatomyIsolationManager({engine,THREE});
  motions=new MotionManager(engine);
  installMotion();

  await loadModel();
  tourManager=new ClinicalTourManager({stage:root.querySelector(".resp-stage"),engine,items:structureData.structures,getLabel:item=>item.name,onSelect:id=>select(id),interval:4200});
  graphicsUnsub=context.events.on("graphics:profileChanged",loadModel);
  engine.start();
}

export default{
 async mount(ctx){
  context=ctx;
  [modelManifest,structureData]=await Promise.all([
    context.assets.loadJson("./modules/respiratorio/data/model.json"),
    context.assets.loadJson("./modules/respiratorio/data/structures.json")
  ]);

  root=document.createElement("section");
  root.className="resp-lab";
  root.innerHTML=`<div class="resp-stage"><div class="three-host"></div><div class="resp-badge">RESPIRATÓRIO · G3 · <span data-quality>—</span></div></div><aside class="resp-panel"><span class="eyebrow">Anatomia compartilhada · G3 · v0.37</span><h2>Pulmões e Vias Aéreas G3</h2><p>O mesmo conjunto respiratório agora é utilizado também no Corpo Humano, com movimento didático, isolamento e cortes gráficos.</p><div class="resp-info"><span class="eyebrow">Exploração</span><h3>Observe a mecânica respiratória</h3><p>Selecione estruturas, isole uma região ou use um corte gráfico didático.</p></div><div class="resp-tools"><button class="resp-tool active" data-tool="breathing">Respiração</button><button class="resp-tool" data-tool="front">Frontal</button><button class="resp-tool" data-tool="side">Lateral</button><button class="resp-tool" data-tool="top">Superior</button><button class="resp-tool" data-tool="lungs">Macro pulmões</button><button class="resp-tool" data-tool="airway">Macro vias aéreas</button><button class="resp-tool" data-tool="isolate">Isolar seleção</button><button class="resp-tool" data-cut="sagittal">Corte sagital</button><button class="resp-tool" data-cut="transverse">Corte transversal</button><button class="resp-tool" data-tool="reset">Resetar</button></div><div class="resp-cut-control"><strong>Posição do plano de corte</strong><input data-cut-offset type="range" min="-2" max="2" step=".05" value="0"><div><span>-2</span><span data-cut-offset-value>0.00</span><span>+2</span></div></div><div class="breath-control"><strong>Amplitude visual</strong><input data-amplitude type="range" min=".02" max=".12" step=".01" value=".06"><div class="breath-readout"><span>Didática</span><span data-amplitude-value>6%</span></div><div class="airflow-strip"><span></span></div></div><div class="resp-structure-list">${structureData.structures.map(x=>`<button class="resp-structure-row" data-structure="${x.mesh}">${safe(x.name)}</button>`).join("")}</div><div class="resp-note">A animação e os cortes são esquemáticos e não correspondem a medidas fisiológicas reais.</div></aside>`;

  root.addEventListener("click",onClick);
  root.addEventListener("input",onInput);
  context.host.append(root);

  try{await mount3D()}
  catch(error){
    console.error(error);
    const {renderAnatomyFallback}=await import("../../services/AnatomyFallbackRenderer.js");
    renderAnatomyFallback({host:root.querySelector(".resp-stage"),title:"Sistema Respiratório G3",structures:structureData.structures,note:"Fallback 2D para reconhecimento de pulmões e vias aéreas quando WebGL não estiver disponível."});
  }
 },
 async start(){engine?.start()},
 pause(){engine?.pause()},
 async destroy(){
  loadGuard?.invalidate();
  graphicsUnsub?.();
  presentationCleanup?.();
  isolation?.destroy();
  motions?.destroy();
  raycast?.destroy();
  cameras?.destroy();
  loader?.destroy();
  if(modelRoot&&engine){engine.scene.remove(modelRoot);engine.disposeObject(modelRoot)}
  engine?.destroy();
  root?.removeEventListener("click",onClick);
  root?.removeEventListener("input",onInput);
  root?.remove();
  context=root=modelManifest=structureData=engine=loader=raycast=cameras=motions=modelRoot=THREE=isolation=null;
 }
};
