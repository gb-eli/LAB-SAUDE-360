let visualCleanup=null;
let loadGuard=null;
let context=null,root=null,modelManifest=null,flowData=null;
let engine=null,loader=null,raycast=null,cameras=null,modelRoot=null,THREE=null,graphicsUnsub=null,sceneFocus=null,materialManager=null,overlayManager=null,tourManager=null;
let expected=1,completed=new Set();

const safe=(s="")=>s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const stepByMesh=id=>flowData.steps.find(x=>x.mesh===id);
const stepByOrder=order=>flowData.steps.find(x=>x.order===order);

function renderFlow(){
 root.querySelector("[data-flow-list]").innerHTML=flowData.steps.map(s=>`<button class="flow-step ${s.order===expected?"active":""} ${completed.has(s.order)?"done":""}" data-flow="${s.order}"><b>${s.order}</b><span>${safe(s.name)}</span><small>${safe(s.zone)}</small></button>`).join("");
}

function selectStep(step){
 root.querySelector(".cme-info").innerHTML=`<span class="eyebrow">${safe(step.zone)}</span><h3>${safe(step.name)}</h3><p>${safe(step.description)}</p>`;
 if(step.order===expected){
   completed.add(step.order);expected+=1;
   root.querySelector(".flow-status").textContent=expected>flowData.steps.length?"Fluxo didático concluído.":"Etapa correta. Continue para a próxima estação.";
   context.progress.saveModuleProgress("cme",{completed:[...completed],expected});
 }else if(completed.has(step.order)){
   root.querySelector(".flow-status").textContent="Essa etapa já foi reconhecida.";
 }else{
   root.querySelector(".flow-status").textContent=`Ainda não. O fluxo didático espera a etapa ${expected}.`;
 }
 renderFlow();
}

function selectByMesh(id){
 const step=stepByMesh(id);if(step){selectStep(step);sceneFocus?.focusObject(modelRoot,id,{distanceFactor:2.7});overlayManager?.setSelected(id);}
}

async function loadModel(){
 const url=context.assets.chooseVariant(modelManifest);if(!loadGuard){const {AsyncLoadGuard}=await import("../../engines/AsyncLoadGuard.js");loadGuard=new AsyncLoadGuard();}const loadToken=loadGuard.begin();const gltf=await loader.load(url);if(!loadGuard.isCurrent(loadToken)){loadGuard.disposeObject(gltf.scene);return;}
 if(modelRoot){engine.scene.remove(modelRoot);engine.disposeObject(modelRoot)}
 modelRoot=gltf.scene;
 materialManager.apply(modelRoot,{resolve:child=>{
  const step=stepByMesh(child.name);
  if(step){
   const color=step.zone==="Suja"?0x8f7258:step.zone==="Limpa"?0x6aa0b6:step.zone==="Estéril"?0xd5dce7:0x7db398;
   return {color,roughness:.54,metalness:.02,clearcoat:.09};
  }
  return {};
 }});
 const box=new THREE.Box3().setFromObject(modelRoot),center=box.getCenter(new THREE.Vector3());modelRoot.position.sub(center);modelRoot.position.z+=1.45;
 engine.scene.add(modelRoot);raycast.setTarget(modelRoot);overlayManager?.setScene({rootObject:modelRoot,items:flowData.steps});tourManager?.setItems(flowData.steps)
}

function resetFlow(){
 expected=1;completed.clear();renderFlow();
 root.querySelector(".flow-status").textContent="Comece pela recepção de material contaminado.";
 root.querySelector(".cme-info").innerHTML='<span class="eyebrow">Fluxo CME</span><h3>Explore as estações</h3><p>Clique nas áreas do ambiente na sequência didática indicada.</p>';
 context.progress.saveModuleProgress("cme",{completed:[],expected:1});
}

function onClick(e){
 const flowBtn=e.target.closest("[data-flow]");if(flowBtn){const s=stepByOrder(Number(flowBtn.dataset.flow));if(s){selectStep(s);sceneFocus?.focusObject(modelRoot,s.mesh,{distanceFactor:2.7});overlayManager?.setSelected(s.mesh);}return}
 const tool=e.target.closest("[data-tool]");if(!tool)return;
 if(tool.dataset.tool==="overview")cameras?.go("overview");
 if(tool.dataset.tool==="reset")resetFlow();
}

async function mount3D(){
 const imports=await Promise.all([import("../../engines/ThreeEngine.js"),import("../../engines/CameraController.js"),import("../../engines/GLBAssetLoader.js"),import("../../engines/RaycastManager.js"),import("../../engines/SceneFocusManager.js"),import("../../engines/ClinicalMaterialManager.js"),import("../../services/ClinicalOverlayManager.js"),import("../../services/ClinicalTourManager.js")]);
 const {ThreeEngine,THREE:ThreeNS}=imports[0];THREE=ThreeNS;const {CameraController}=imports[1],{GLBAssetLoader}=imports[2],{RaycastManager}=imports[3],{SceneFocusManager}=imports[4],{ClinicalMaterialManager}=imports[5],{ClinicalOverlayManager}=imports[6],{ClinicalTourManager}=imports[7];
 engine=new ThreeEngine({host:root.querySelector(".three-host"),graphics:context.graphics,events:context.events,background:0x07131f,camera:{fov:42,near:.05,far:120}});
 engine.addDefaultLights({ambient:1.5,key:2.4,fill:1.2,rim:.7});engine.focus([0,-11,3.6],[0,0,1.4]);
 const {applyClinicalScenePreset}=await import("../../engines/ClinicalScenePreset.js");visualCleanup=applyClinicalScenePreset({engine,THREE,mood:"sterile",profile:context.graphics.activeProfile});sceneFocus=new SceneFocusManager({engine,THREE});materialManager=new ClinicalMaterialManager({engine,THREE,mood:"sterile"});loader=new GLBAssetLoader({events:context.events});raycast=new RaycastManager({engine,target:null,selectable:id=>Boolean(stepByMesh(id)),onSelect:({id})=>selectByMesh(id)});
 cameras=new CameraController(engine);cameras.register("overview",{position:[0,-11,3.6],target:[0,0,1.4]});
 await loadModel();overlayManager=new ClinicalOverlayManager({engine,THREE,stage:root.querySelector(".cme-stage"),rootObject:modelRoot,items:flowData.steps,getLabel:item=>item.name,getOrder:item=>item.order,onSelect:id=>selectByMesh(id)});overlayManager.update(true);tourManager=new ClinicalTourManager({stage:root.querySelector(".cme-stage"),engine,items:flowData.steps,getLabel:item=>item.name,onSelect:id=>selectByMesh(id)});graphicsUnsub=context.events.on("graphics:profileChanged",async()=>await loadModel());engine.start()
}

export default{
 async mount(ctx){
  context=ctx;[modelManifest,flowData]=await Promise.all([context.assets.loadJson("./modules/cme/data/model.json"),context.assets.loadJson("./modules/cme/data/flow.json")]);
  const saved=context.progress.getModuleProgress("cme");expected=saved.expected||1;completed=new Set(saved.completed||[]);
  root=document.createElement("section");root.className="cme-lab";
  root.innerHTML=`<div class="cme-stage"><div class="three-host"></div><div class="cme-badge">CME G2 · FLUXO DIDÁTICO</div></div><aside class="cme-panel"><span class="eyebrow">Central de Material e Esterilização · G2</span><h2>Fluxo sujo → limpo → estéril</h2><p>Ambiente educacional para reconhecer zonas e sequência lógica do processamento.</p><div class="cme-info"><span class="eyebrow">Fluxo CME</span><h3>Explore as estações</h3><p>Clique nas áreas do ambiente na sequência didática indicada.</p></div><div class="flow-list" data-flow-list></div><div class="cme-tools"><button class="cme-tool" data-tool="overview">Visão geral</button><button class="cme-tool" data-tool="reset">Reiniciar fluxo</button></div><div class="flow-status">Comece pela recepção de material contaminado.</div><div class="cme-note">A cena não apresenta parâmetros reais de esterilização, tempos, temperaturas ou validações de ciclo. O foco é fluxo, organização e reconhecimento visual.</div></aside>`;
  root.addEventListener("click",onClick);context.host.append(root);renderFlow();
  try{await mount3D()}catch(error){console.error(error);root.querySelector(".cme-stage").innerHTML='<div style="display:grid;place-items:center;height:100%;color:#9db1c2">Modo leve: CME 3D indisponível.</div>'}
 },
 async start(){engine?.start()},pause(){engine?.pause()},
 async destroy(){loadGuard?.invalidate();visualCleanup?.();graphicsUnsub?.();tourManager?.destroy();overlayManager?.destroy();materialManager?.destroy();sceneFocus?.destroy();raycast?.destroy();cameras?.destroy();loader?.destroy();if(modelRoot&&engine){engine.scene.remove(modelRoot);engine.disposeObject(modelRoot)}engine?.destroy();root?.removeEventListener("click",onClick);root?.remove();context=root=modelManifest=flowData=engine=loader=raycast=cameras=modelRoot=THREE=sceneFocus=materialManager=overlayManager=tourManager=null;completed=new Set();expected=1}
};
