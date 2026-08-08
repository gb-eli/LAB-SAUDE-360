let visualCleanup=null;
let loadGuard=null;
let context=null,root=null,modelManifest=null,riskData=null,engine=null,loader=null,raycast=null,cameras=null,modelRoot=null,THREE=null,graphicsUnsub=null,sceneFocus=null,materialManager=null,overlayManager=null,tourManager=null;
let found=new Set();

const safe=(s="")=>s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const itemByMesh=id=>riskData.risks.find(x=>x.mesh===id);
const foundRiskItems=()=>riskData.risks.filter(item=>found.has(item.mesh));
function renderScore(){
 root.querySelector("[data-score]").textContent=`${found.size}/${riskData.risks.length}`;
 root.querySelectorAll("[data-risk-row]").forEach(row=>{
   const id=row.dataset.riskRow,isFound=found.has(id),item=itemByMesh(id);
   row.classList.toggle("found",isFound);
   const label=row.querySelector("[data-risk-label]");
   if(label)label.textContent=isFound?item?.title||"Risco identificado":"Risco ainda não identificado";
   applyRiskVisual(id,isFound);
 });
}
function applyRiskVisual(id,isFound){
 const mesh=modelRoot?.getObjectByName(id);if(!mesh?.material)return;
 mesh.material.color?.setHex?.(isFound?0xd6a84f:0xc6d5da);
 if(mesh.material.emissive)mesh.material.emissive.setHex(isFound?0x241800:0x000000);
}

function selectRisk(id){
 const item=itemByMesh(id);if(!item)return;
 found.add(id);renderScore();
 overlayManager?.setScene({rootObject:modelRoot,items:foundRiskItems()});tourManager?.setItems(foundRiskItems());tourManager?.setItems(foundRiskItems());
 overlayManager?.setSelected(id);
 root.querySelector(".bio-info").innerHTML=`<span class="eyebrow">Risco identificado</span><h3>${safe(item.title)}</h3><p>${safe(item.explanation)}</p>`;
 sceneFocus?.focusObject(modelRoot,id,{distanceFactor:2.6});
 context.progress.saveModuleProgress("biosseguranca",{found:[...found]});
}

async function loadModel(){
 const url=context.assets.chooseVariant(modelManifest);if(!loadGuard){const {AsyncLoadGuard}=await import("../../engines/AsyncLoadGuard.js");loadGuard=new AsyncLoadGuard();}const loadToken=loadGuard.begin();const gltf=await loader.load(url);if(!loadGuard.isCurrent(loadToken)){loadGuard.disposeObject(gltf.scene);return;}
 if(modelRoot){engine.scene.remove(modelRoot);engine.disposeObject(modelRoot)}
 modelRoot=gltf.scene;materialManager.apply(modelRoot,{resolve:child=>{
   const risk=itemByMesh(child.name);
   if(risk)return {color:0xc6d5da,roughness:.64,metalness:0,clearcoat:.05,emissive:0x000000};
   if(child.name==="sharps_bin")return {color:0xd7b94a,roughness:.5,clearcoat:.12};
   return {};
 }});
 const box=new THREE.Box3().setFromObject(modelRoot),center=box.getCenter(new THREE.Vector3());modelRoot.position.sub(center);modelRoot.position.z+=1.45;engine.scene.add(modelRoot);raycast.setTarget(modelRoot);for(const id of found)applyRiskVisual(id,true);overlayManager?.setScene({rootObject:modelRoot,items:foundRiskItems()})
}

function onClick(e){
 const tool=e.target.closest("[data-tool]");if(!tool)return;
 if(tool.dataset.tool==="overview")cameras?.go("overview");
 if(tool.dataset.tool==="reset"){found.clear();renderScore();overlayManager?.setScene({rootObject:modelRoot,items:[]});tourManager?.setItems([]);root.querySelector(".bio-info").innerHTML='<span class="eyebrow">Inspeção</span><h3>Encontre os riscos</h3><p>Explore o ambiente e clique nos elementos que representam situações de risco.</p>';context.progress.saveModuleProgress("biosseguranca",{found:[]})}
}

async function mount3D(){
 const imports=await Promise.all([import("../../engines/ThreeEngine.js"),import("../../engines/CameraController.js"),import("../../engines/GLBAssetLoader.js"),import("../../engines/RaycastManager.js"),import("../../engines/SceneFocusManager.js"),import("../../engines/ClinicalMaterialManager.js"),import("../../services/ClinicalOverlayManager.js"),import("../../services/ClinicalTourManager.js")]);
 const {ThreeEngine,THREE:ThreeNS}=imports[0];THREE=ThreeNS;const {CameraController}=imports[1],{GLBAssetLoader}=imports[2],{RaycastManager}=imports[3],{SceneFocusManager}=imports[4],{ClinicalMaterialManager}=imports[5],{ClinicalOverlayManager}=imports[6],{ClinicalTourManager}=imports[7];
 engine=new ThreeEngine({host:root.querySelector(".three-host"),graphics:context.graphics,events:context.events,background:0x07131f,camera:{fov:42,near:.05,far:100}});engine.addDefaultLights({ambient:1.5,key:2.3,fill:1.2,rim:.7});engine.focus([0,-9,3.2],[0,0,1.3]);
 const {applyClinicalScenePreset}=await import("../../engines/ClinicalScenePreset.js");visualCleanup=applyClinicalScenePreset({engine,THREE,mood:"safety",profile:context.graphics.activeProfile});sceneFocus=new SceneFocusManager({engine,THREE});materialManager=new ClinicalMaterialManager({engine,THREE,mood:"safety"});loader=new GLBAssetLoader({events:context.events});raycast=new RaycastManager({engine,target:null,selectable:id=>Boolean(itemByMesh(id)),onSelect:({id})=>selectRisk(id)});cameras=new CameraController(engine);cameras.register("overview",{position:[0,-9,3.2],target:[0,0,1.3]});
 await loadModel();overlayManager=new ClinicalOverlayManager({engine,THREE,stage:root.querySelector(".bio-stage"),rootObject:modelRoot,items:foundRiskItems(),getLabel:item=>item.title,onSelect:id=>selectRisk(id)});overlayManager.update(true);tourManager=new ClinicalTourManager({stage:root.querySelector(".bio-stage"),engine,items:foundRiskItems(),getLabel:item=>item.title,onSelect:id=>selectRisk(id)});graphicsUnsub=context.events.on("graphics:profileChanged",async()=>await loadModel());engine.start()
}

export default{
 async mount(ctx){context=ctx;[modelManifest,riskData]=await Promise.all([context.assets.loadJson("./modules/biosseguranca/data/model.json"),context.assets.loadJson("./modules/biosseguranca/data/risks.json")]);found=new Set(context.progress.getModuleProgress("biosseguranca").found||[]);root=document.createElement("section");root.className="bio-lab";root.innerHTML=`<div class="bio-stage"><div class="three-host"></div><div class="bio-badge">BIOSSEGURANÇA · INSPEÇÃO 3D</div><div class="bio-score">Encontrados: <span data-score>0/${riskData.risks.length}</span></div></div><aside class="bio-panel"><span class="eyebrow">Biossegurança · v0.22</span><h2>Encontre os Riscos</h2><p>Ambiente fictício para observação, reconhecimento e discussão de riscos.</p><div class="bio-info"><span class="eyebrow">Inspeção</span><h3>Encontre os riscos</h3><p>Explore o ambiente e clique nos elementos que representam situações de risco.</p></div><div class="bio-tools"><button class="bio-tool" data-tool="overview">Visão geral</button><button class="bio-tool" data-tool="reset">Reiniciar</button></div><div class="risk-list">${riskData.risks.map(r=>`<div class="risk-row" data-risk-row="${r.mesh}"><span data-risk-label>Risco ainda não identificado</span><strong>✓</strong></div>`).join("")}</div><div class="bio-note">A atividade é educacional e usa um cenário fictício. Protocolos reais devem seguir formação, supervisão e normas da instituição.</div></aside>`;root.addEventListener("click",onClick);context.host.append(root);renderScore();try{await mount3D()}catch(error){console.error(error);root.querySelector(".bio-stage").innerHTML='<div style="display:grid;place-items:center;height:100%;color:#9db1c2">Modo leve: inspeção 3D indisponível.</div>'}},
 async start(){engine?.start()},pause(){engine?.pause()},
 async destroy(){loadGuard?.invalidate();visualCleanup?.();graphicsUnsub?.();tourManager?.destroy();overlayManager?.destroy();materialManager?.destroy();sceneFocus?.destroy();raycast?.destroy();cameras?.destroy();loader?.destroy();if(modelRoot&&engine){engine.scene.remove(modelRoot);engine.disposeObject(modelRoot)}engine?.destroy();root?.removeEventListener("click",onClick);root?.remove();context=root=modelManifest=riskData=engine=loader=raycast=cameras=modelRoot=THREE=sceneFocus=materialManager=overlayManager=tourManager=null;found=new Set()}
};
