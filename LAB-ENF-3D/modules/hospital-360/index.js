let context=null,root=null,modelData=null,roomData=null;
let engine=null,loader=null,raycast=null,cameras=null,modelRoot=null,THREE=null,currentScene="patient-room",graphicsUnsub=null,visualCleanup=null,currentUrl=null,quiz=null,loadGuard=null,sceneFocus=null,materialManager=null,overlayManager=null,tourManager=null;

const safe=(s="")=>s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const objects=()=>roomData.objects[currentScene]||[];
const itemByMesh=id=>objects().find(x=>x.mesh===id);
function sceneConfig(){return modelData.scenes[currentScene]}
function chooseUrl(){return context.assets.chooseVariant({variants:sceneConfig().variants})}

function styleRoom(object){
  materialManager.apply(object,{resolve:child=>{
    if(child.name==="sharps_bin"){
      return {color:0xd74c51,roughness:.48,clearcoat:.1};
    }
    return {};
  }});
}

async function loadScene(force=false){
  const token=loadGuard.begin();
  const url=chooseUrl();if(!force&&modelRoot&&url===currentUrl)return;
  const gltf=await loader.load(url);
  if(!loadGuard.isCurrent(token)){gltf.scene?.traverse?.(c=>{c.geometry?.dispose?.();c.material?.dispose?.()});return;}
  if(modelRoot){engine.scene.remove(modelRoot);engine.disposeObject(modelRoot)}
  modelRoot=gltf.scene;styleRoom(modelRoot);
  const box=new THREE.Box3().setFromObject(modelRoot),center=box.getCenter(new THREE.Vector3());modelRoot.position.sub(center);modelRoot.position.z+=1.45;engine.scene.add(modelRoot);raycast.setTarget(modelRoot);currentUrl=url;overlayManager?.setScene({rootObject:modelRoot,items:objects()});tourManager?.setItems(objects());
  root.querySelector("[data-quality]").textContent=context.graphics.activeProfile.toUpperCase();
  root.querySelectorAll("[data-scene]").forEach(b=>b.classList.toggle("active",b.dataset.scene===currentScene));
  root.querySelector(".hospital3d-info").innerHTML=`<span class="eyebrow">${safe(sceneConfig().label)}</span><h3>Explore o ambiente</h3><p>Clique diretamente nos objetos para abrir informações didáticas.</p>`;
  cameras.go("entry");
}

function select(id){
  const item=itemByMesh(id);if(!item)return;
  root.querySelector(".hospital3d-info").innerHTML=`<span class="eyebrow">${safe(item.category)}</span><h3>${safe(item.name)}</h3><p>${safe(item.description)}</p>`;
  sceneFocus?.focusObject(modelRoot,id,{distanceFactor:2.55,maxDistance:6.4});overlayManager?.setSelected(id);
  if(quiz){
    const st=root.querySelector(".inspection-status");
    if(quiz===id){st.textContent="Correto. Ponto localizado.";quiz=null}else st.textContent="Ainda não. Continue explorando.";
  }
}

function newInspection(){
  const list=objects();if(!list.length)return;const item=list[Math.floor(Math.random()*list.length)];quiz=item.mesh;root.querySelector("[data-inspection-question]").textContent=`Localize: ${item.name}`;root.querySelector(".inspection-status").textContent="";
}

function onClick(e){
  const sceneBtn=e.target.closest("[data-scene]");if(sceneBtn){currentScene=sceneBtn.dataset.scene;currentUrl=null;loadScene(true);return}
  const tool=e.target.closest("[data-tool]");if(!tool)return;const a=tool.dataset.tool;
  if(a==="entry")cameras.go("entry");if(a==="focus")cameras.go("focus");if(a==="inspection")newInspection();if(a==="reset"){quiz=null;cameras.go("entry");root.querySelector("[data-inspection-question]").textContent="Ative uma inspeção para praticar.";root.querySelector(".inspection-status").textContent=""}
}

async function mount3D(){
  const imports=await Promise.all([import("../../engines/ThreeEngine.js"),import("../../engines/CameraController.js"),import("../../engines/GLBAssetLoader.js"),import("../../engines/RaycastManager.js"),import("../../engines/ClinicalScenePreset.js"),import("../../engines/SceneFocusManager.js"),import("../../engines/ClinicalMaterialManager.js"),import("../../services/ClinicalOverlayManager.js"),import("../../services/ClinicalTourManager.js")]);
  const {ThreeEngine,THREE:ThreeNS}=imports[0];THREE=ThreeNS;const {AsyncLoadGuard}=await import("../../engines/AsyncLoadGuard.js");loadGuard=new AsyncLoadGuard();const {CameraController}=imports[1],{GLBAssetLoader}=imports[2],{RaycastManager}=imports[3],{applyClinicalScenePreset}=imports[4],{SceneFocusManager}=imports[5],{ClinicalMaterialManager}=imports[6],{ClinicalOverlayManager}=imports[7],{ClinicalTourManager}=imports[8];
  engine=new ThreeEngine({host:root.querySelector(".three-host"),graphics:context.graphics,events:context.events,background:0x07131f,camera:{fov:42,near:.05,far:120}});engine.addDefaultLights({ambient:1.55,key:2.25,fill:1.25,rim:.7});visualCleanup=applyClinicalScenePreset({engine,THREE,mood:"clinical",profile:context.graphics.activeProfile});materialManager=new ClinicalMaterialManager({engine,THREE,mood:"clinical"});engine.focus([0,-9,3.2],[0,0,1.35]);engine.controls.minDistance=4;engine.controls.maxDistance=15;
  sceneFocus=new SceneFocusManager({engine,THREE});loader=new GLBAssetLoader({events:context.events});raycast=new RaycastManager({engine,target:null,selectable:id=>Boolean(itemByMesh(id)),onSelect:({id})=>select(id)});cameras=new CameraController(engine);
  cameras.register("entry",{position:[0,-9,3.2],target:[0,0,1.35]});cameras.register("focus",{position:[4,-4.5,2.6],target:[0,0,1]});
  await loadScene();overlayManager=new ClinicalOverlayManager({engine,THREE,stage:root.querySelector(".hospital3d-stage"),rootObject:modelRoot,items:objects(),getLabel:item=>item.name,onSelect:id=>select(id)});overlayManager.update(true);tourManager=new ClinicalTourManager({stage:root.querySelector(".hospital3d-stage"),engine,items:objects(),getLabel:item=>item.name,onSelect:id=>select(id)});graphicsUnsub=context.events.on("graphics:profileChanged",async()=>await loadScene(false));engine.start();
}

export default{
 async mount(ctx){context=ctx;[modelData,roomData]=await Promise.all([context.assets.loadJson("./modules/hospital-360/data/model.json"),context.assets.loadJson("./modules/hospital-360/data/room.json")]);root=document.createElement("section");root.className="hospital3d-lab";root.innerHTML=`<div class="hospital3d-stage"><div class="three-host"></div><div class="hospital3d-badge">HOSPITAL 3D · <span data-quality>—</span></div></div><aside class="hospital3d-panel"><span class="eyebrow">Hospital 3D · G2 aprimorado</span><h2>Ambientes Hospitalares</h2><p>Agora o módulo possui três ambientes tridimensionais independentes.</p><div class="scene-tabs">${Object.entries(modelData.scenes).map(([id,cfg])=>`<button class="scene-tab" data-scene="${id}">${safe(cfg.label)}</button>`).join("")}</div><div class="hospital3d-info"><span class="eyebrow">Ambiente</span><h3>Explore</h3><p>Selecione um ambiente e clique nos objetos.</p></div><div class="hospital3d-tools"><button class="hospital3d-tool" data-tool="entry">Visão geral</button><button class="hospital3d-tool" data-tool="focus">Aproximar</button><button class="hospital3d-tool" data-tool="reset">Resetar</button></div><div class="inspection-box"><strong data-inspection-question>Ative uma inspeção para praticar.</strong><button class="hospital3d-tool" data-tool="inspection">Nova inspeção</button><div class="inspection-status"></div></div><div class="hospital3d-note">Ambientes e objetos fictícios para aprendizagem visual, organização e segurança.</div></aside>`;root.addEventListener("click",onClick);context.host.append(root);try{await mount3D()}catch(error){console.error(error);root.querySelector(".hospital3d-stage").innerHTML='<div style="display:grid;place-items:center;height:100%;color:#9db1c2">Modo leve: ambiente 3D indisponível.</div>'}},
 async start(){engine?.start()},pause(){engine?.pause()},
 async destroy(){loadGuard?.invalidate();graphicsUnsub?.();visualCleanup?.();tourManager?.destroy();overlayManager?.destroy();materialManager?.destroy();sceneFocus?.destroy();raycast?.destroy();cameras?.destroy();loader?.destroy();if(modelRoot&&engine){engine.scene.remove(modelRoot);engine.disposeObject(modelRoot)}engine?.destroy();root?.removeEventListener("click",onClick);root?.remove();context=root=modelData=roomData=engine=loader=raycast=cameras=modelRoot=THREE=sceneFocus=materialManager=overlayManager=tourManager=null;currentUrl=null;quiz=null}
};
