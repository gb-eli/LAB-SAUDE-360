let loadGuard=null,context=null,root=null,manifest=null,data=null,engine=null,loader=null,raycast=null,cameras=null,modelRoot=null,THREE=null,graphicsUnsub=null,currentSample="visual_change_1";
const safe=(s="")=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const item=id=>data.samples.find(x=>x.mesh===id);
function renderInfo(id){
 const x=item(id);if(!x)return;currentSample=id;
 root.querySelector(".wound-info").innerHTML=`<span class="eyebrow">Comparação visual · G3</span><h3>${safe(x.name)}</h3><p>${safe(x.description)}</p><div class="wound-features">${(x.features||[]).map(f=>`<span>${safe(f)}</span>`).join("")}</div>`;
 root.querySelectorAll("[data-sample]").forEach(b=>b.classList.toggle("active",b.dataset.sample===id));
}
async function loadModel(){
 if(!loadGuard){const {AsyncLoadGuard}=await import("../../engines/AsyncLoadGuard.js");loadGuard=new AsyncLoadGuard()}
 const token=loadGuard.begin(),gltf=await loader.load(context.assets.chooseVariant(manifest));
 if(!loadGuard.isCurrent(token)){loadGuard.disposeObject(gltf.scene);return}
 if(modelRoot){engine.scene.remove(modelRoot);engine.disposeObject(modelRoot)}
 modelRoot=gltf.scene;
 modelRoot.traverse(c=>{
   if(!c.isMesh)return;c.userData.structureId=c.name;
   let color=0xd7c5b4;
   if(c.name==="sample_board")color=0x70848e;
   if(c.name.includes("dermis"))color=0xdd9788;
   if(c.name.includes("hypodermis"))color=0xe9c263;
   if(c.name.includes("visual_change_1"))color=0xbd585b;
   if(c.name.includes("visual_change_2"))color=0xb15358;
   if(c.name.includes("visual_change_3"))color=0x914950;
   if(c.name.includes("visual_change_4"))color=0x7e5f46;
   engine.replaceMaterial(c,new THREE.MeshPhysicalMaterial({color,roughness:.72,transparent:c.name.includes("surface_reference")||c.name.includes("texture_proxy"),opacity:c.name.includes("surface_reference")||c.name.includes("texture_proxy")?0.65:1,clearcoat:.03}));
 });
 const box=new THREE.Box3().setFromObject(modelRoot),center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());
 modelRoot.position.sub(center);modelRoot.scale.setScalar(4.8/Math.max(size.x,size.y,size.z));engine.scene.add(modelRoot);raycast.setTarget(modelRoot)
}
function onClick(e){
 const b=e.target.closest("[data-sample]");if(b){renderInfo(b.dataset.sample);return}
 const t=e.target.closest("[data-tool]");if(!t)return;
 if(t.dataset.tool==="overview")cameras?.go("overview");
 if(t.dataset.tool==="detail")cameras?.go("detail");
}
async function mount3D(){
 const imports=await Promise.all([import("../../engines/ThreeEngine.js"),import("../../engines/CameraController.js"),import("../../engines/GLBAssetLoader.js"),import("../../engines/RaycastManager.js")]);
 const {ThreeEngine,THREE:ThreeNS}=imports[0];THREE=ThreeNS;const {CameraController}=imports[1],{GLBAssetLoader}=imports[2],{RaycastManager}=imports[3];
 engine=new ThreeEngine({host:root.querySelector(".three-host"),graphics:context.graphics,events:context.events,background:0x07131f,camera:{fov:34,near:.05,far:50}});engine.addDefaultLights({ambient:1.5,key:2.7,fill:1.3,rim:1});engine.focus([0,-5.8,2],[0,0,0]);
 loader=new GLBAssetLoader({events:context.events});raycast=new RaycastManager({engine,target:null,selectable:id=>Boolean(item(id)),onSelect:({id})=>renderInfo(id)});
 cameras=new CameraController(engine);cameras.register("overview",{position:[0,-5.8,2],target:[0,0,0]});cameras.register("detail",{position:[1.8,-4.2,1.4],target:[0,0,.2]});
 await loadModel();graphicsUnsub=context.events.on("graphics:profileChanged",loadModel);engine.start()
}
export default{
 async mount(ctx){context=ctx;[manifest,data]=await Promise.all([context.assets.loadJson("./modules/feridas/data/model.json"),context.assets.loadJson("./modules/feridas/data/samples.json")]);root=document.createElement("section");root.className="wound-lab";root.innerHTML=`<div class="wound-stage"><div class="three-host"></div><div class="wound-badge">INTEGRIDADE CUTÂNEA · G3</div></div><aside class="wound-panel"><span class="eyebrow">Comparação visual · G3</span><h2>Feridas e Integridade Cutânea</h2><p>Compare características visuais genéricas de superfície, cor e profundidade aparente em representações profissionais e estilizadas.</p><div class="wound-info"></div><div class="sample-list">${data.samples.map(x=>`<button class="sample-row" data-sample="${x.mesh}">${safe(x.name)}</button>`).join("")}</div><div class="wound-tools"><button class="sample-row" data-tool="overview">Visão geral</button><button class="sample-row" data-tool="detail">Detalhe</button></div><div class="wound-note">O módulo não diagnostica, não define estágio clínico e não recomenda curativo, produto ou tratamento.</div></aside>`;root.addEventListener("click",onClick);context.host.append(root);renderInfo(currentSample);try{await mount3D()}catch(error){console.error(error);root.querySelector(".wound-stage").innerHTML='<div style="display:grid;place-items:center;height:100%;color:#9db1c2">Modo leve: comparação 3D indisponível.</div>'}},
 async start(){engine?.start()},pause(){engine?.pause()},
 async destroy(){loadGuard?.invalidate();graphicsUnsub?.();raycast?.destroy();cameras?.destroy();loader?.destroy();if(modelRoot&&engine){engine.scene.remove(modelRoot);engine.disposeObject(modelRoot)}engine?.destroy();root?.removeEventListener("click",onClick);root?.remove();context=root=manifest=data=engine=loader=raycast=cameras=modelRoot=THREE=null}
};
