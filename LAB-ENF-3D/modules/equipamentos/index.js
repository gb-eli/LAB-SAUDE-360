let context=null,root=null,modelsData=null,engine=null,loader=null,raycast=null,cameras=null,modelRoot=null,THREE=null,currentModel="syringe",graphicsUnsub=null,rotating=false,frameUnsub=null,exploded=null,loadGuard=null;
let query="",category="all";
const safe=(s="")=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const normalize=(s="")=>String(s).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
function config(){return modelsData.models[currentModel]}
function chooseUrl(){return context.assets.chooseVariant({variants:config().variants})}
function partFromId(id){return (config().parts||[]).find(x=>x.id===id)}
function categories(){return [...new Set(Object.values(modelsData.models).map(x=>x.category).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"pt-BR"))}
function filteredModels(){
 const q=normalize(query);
 return Object.entries(modelsData.models).filter(([id,cfg])=>{
   if(category!=="all"&&cfg.category!==category)return false;
   if(!q)return true;
   return normalize([id,cfg.label,cfg.description,cfg.category,...(cfg.tags||[]),...(cfg.parts||[]).map(x=>x.label)].join(" ")).includes(q);
 });
}
function renderCatalog(){
 const box=root.querySelector("[data-equipment-catalog]");
 const items=filteredModels();
 box.innerHTML=items.length?items.map(([id,cfg])=>`<button class="equipment-catalog-card ${id===currentModel?"active":""}" data-model="${id}"><strong>${safe(cfg.label)}</strong><small>${safe(cfg.category||"Equipamento")}</small><span>${(cfg.parts||[]).length} parte(s)</span></button>`).join(""):`<div class="equipment-empty">Nenhum equipamento encontrado.</div>`;
}
function style(object){
 object.traverse(child=>{
  if(!child.isMesh)return;child.userData.structureId=child.name;child.castShadow=true;child.receiveShadow=true;
  const metal=child.name.includes("needle")||child.name.includes("gauge")||child.name.includes("tube")||child.name==="chestpiece";
  const screen=child.name.includes("screen");
  engine.replaceMaterial(child,new THREE.MeshPhysicalMaterial({color:screen?0x205d73:metal?0xcbd7dd:child.name.includes("stopper")?0x2f3941:0xe1f2f7,roughness:metal?0.25:0.45,metalness:metal?0.65:0,clearcoat:.08}));
 });
}
function renderParts(){
 const box=root.querySelector("[data-parts-list]"),list=config().parts||[];
 box.innerHTML=list.length?list.map(x=>`<span class="equipment-part-chip">${safe(x.label)}</span>`).join(""):'<span class="equipment-part-chip">Modelo sem peças destacáveis cadastradas</span>';
 root.querySelector('[data-tool="explode"]').disabled=!list.length;
}
async function loadModel(){
 const token=loadGuard.begin(),gltf=await loader.load(chooseUrl());
 if(!loadGuard.isCurrent(token)){loadGuard.disposeObject(gltf.scene);return}
 exploded?.destroy();
 if(modelRoot){engine.scene.remove(modelRoot);engine.disposeObject(modelRoot)}
 modelRoot=gltf.scene;style(modelRoot);
 const box=new THREE.Box3().setFromObject(modelRoot),center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());
 modelRoot.position.sub(center);modelRoot.scale.setScalar(4.5/Math.max(size.x,size.y,size.z));engine.scene.add(modelRoot);raycast.setTarget(modelRoot);
 const {ExplodedViewManager}=await import("../../engines/ExplodedViewManager.js");
 exploded=new ExplodedViewManager({root:modelRoot,parts:config().parts||[],distance:.46});
 root.querySelector("[data-model-label]").textContent=config().label;
 root.querySelector(".equipment-info3d").innerHTML=`<span class="eyebrow">${safe(config().category||"Equipamento")}</span><h3>${safe(config().label)}</h3><p>${safe(config().description||"Modelo didático para reconhecimento visual.")}</p>`;
 root.querySelector('[data-tool="explode"]').classList.remove("active");root.querySelector('[data-tool="explode"]').textContent="Separar partes";
 renderParts();renderCatalog();
}
function onClick(e){
 const tab=e.target.closest("[data-model]");if(tab){currentModel=tab.dataset.model;loadModel();return}
 const tool=e.target.closest("[data-tool]");if(!tool)return;
 if(tool.dataset.tool==="rotate"){rotating=!rotating;tool.classList.toggle("active",rotating)}
 if(tool.dataset.tool==="front")cameras?.go("front");
 if(tool.dataset.tool==="detail")cameras?.go("detail");
 if(tool.dataset.tool==="explode"){const state=exploded?.toggle()||false;tool.classList.toggle("active",state);tool.textContent=state?"Reunir partes":"Separar partes"}
}
function onInput(e){if(e.target.matches("[data-equipment-search]")){query=e.target.value;renderCatalog()}}
function onChange(e){if(e.target.matches("[data-equipment-category]")){category=e.target.value;renderCatalog()}}
async function mount3D(){
 const imports=await Promise.all([import("../../engines/ThreeEngine.js"),import("../../engines/CameraController.js"),import("../../engines/GLBAssetLoader.js"),import("../../engines/RaycastManager.js")]);
 const {ThreeEngine,THREE:ThreeNS}=imports[0];THREE=ThreeNS;const {AsyncLoadGuard}=await import("../../engines/AsyncLoadGuard.js");loadGuard=new AsyncLoadGuard();const {CameraController}=imports[1],{GLBAssetLoader}=imports[2],{RaycastManager}=imports[3];
 engine=new ThreeEngine({host:root.querySelector(".three-host"),graphics:context.graphics,events:context.events,background:0x06131f,camera:{fov:34,near:.05,far:60}});engine.addDefaultLights({ambient:1.3,key:3,fill:1.6,rim:1.3});engine.focus([0,1,6.8],[0,0,0]);
 loader=new GLBAssetLoader({events:context.events});raycast=new RaycastManager({engine,target:null,onSelect:({id})=>{const part=partFromId(id);root.querySelector(".equipment-info3d").innerHTML=`<span class="eyebrow">Parte selecionada</span><h3>${safe(part?.label||id)}</h3><p>${part?"Parte semântica cadastrada no modelo.":"Elemento do modelo 3D selecionado diretamente."}</p>`}});
 cameras=new CameraController(engine);cameras.register("front",{position:[0,1,6.8],target:[0,0,0]});cameras.register("detail",{position:[1.2,.7,4.2],target:[0,0,0]});
 frameUnsub=engine.onFrame(({delta})=>{if(rotating&&modelRoot)modelRoot.rotation.y+=delta*.45});await loadModel();graphicsUnsub=context.events.on("graphics:profileChanged",loadModel);engine.start()
}
export default{
 async mount(ctx){context=ctx;modelsData=await context.assets.loadJson("./modules/equipamentos/data/equipment-models.json");root=document.createElement("section");root.className="equipment-lab3d";root.innerHTML=`<div class="equipment-view3d"><div class="three-host"></div><div class="equipment-badge">EQUIPAMENTO · <span data-model-label>—</span></div></div><aside class="equipment-panel3d"><span class="eyebrow">Catálogo visual · G2 · v0.24</span><h2>Equipamentos 3D</h2><p>Pesquise, filtre por categoria, selecione peças e use a vista explodida.</p><div class="equipment-filterbar"><input data-equipment-search type="search" placeholder="Buscar equipamento ou peça" aria-label="Buscar equipamento ou peça"><select data-equipment-category aria-label="Filtrar equipamentos por categoria"><option value="all">Todas as categorias</option>${categories().map(x=>`<option value="${safe(x)}">${safe(x)}</option>`).join("")}</select></div><div class="equipment-catalog" data-equipment-catalog></div><div class="equipment-info3d"><span class="eyebrow">Equipamento 3D</span><h3>Selecione um equipamento</h3><p>Use o catálogo para trocar o objeto carregado na cena.</p></div><div class="equipment-parts" data-parts-list></div><div class="equipment-tools3d"><button class="equipment-tool3d" data-tool="rotate">Auto rotação</button><button class="equipment-tool3d" data-tool="explode">Separar partes</button><button class="equipment-tool3d" data-tool="front">Visão geral</button><button class="equipment-tool3d" data-tool="detail">Detalhe</button></div><div class="equipment-note">Recursos exclusivamente visuais. Não representam desmontagem, manutenção ou técnica de uso clínico.</div></aside>`;root.addEventListener("click",onClick);root.addEventListener("input",onInput);root.addEventListener("change",onChange);context.host.append(root);renderCatalog();try{await mount3D()}catch(error){console.error(error);root.querySelector(".equipment-view3d").innerHTML='<div style="display:grid;place-items:center;height:100%;color:#9db1c2">Modo leve: galeria 3D indisponível.</div>'}},
 async start(){engine?.start()},pause(){engine?.pause()},
 async destroy(){loadGuard?.invalidate();graphicsUnsub?.();frameUnsub?.();exploded?.destroy();raycast?.destroy();cameras?.destroy();loader?.destroy();if(modelRoot&&engine){engine.scene.remove(modelRoot);engine.disposeObject(modelRoot)}engine?.destroy();root?.removeEventListener("click",onClick);root?.removeEventListener("input",onInput);root?.removeEventListener("change",onChange);root?.remove();context=root=modelsData=engine=loader=raycast=cameras=modelRoot=THREE=exploded=null}
};
