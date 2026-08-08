let loadGuard=null,context=null,root=null,data=null,engine=null,loader=null,cameras=null,raycast=null,modelRoot=null,THREE=null,graphicsUnsub=null,position="dorsal";
const safe=(s="")=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const cfg=()=>data.positions[position];
const point=id=>(cfg().points||[]).find(x=>x.mesh===id);
function renderPoint(id){
 const x=point(id);if(!x)return;
 root.querySelector(".room-info").innerHTML=`<span class="eyebrow">Ponto de referência</span><h3>${safe(x.name)}</h3><p>${safe(x.description)}</p>`;
 root.querySelectorAll("[data-point]").forEach(b=>b.classList.toggle("active",b.dataset.point===id));
}
function renderPosition(){
 root.querySelectorAll("[data-position]").forEach(b=>b.classList.toggle("active",b.dataset.position===position));
 root.querySelector(".room-info").innerHTML=`<span class="eyebrow">Comparação postural · G3</span><h3>${safe(cfg().label)}</h3><p>${safe(cfg().description)}</p>`;
 root.querySelector("[data-point-list]").innerHTML=(cfg().points||[]).map(x=>`<button class="position-point" data-point="${x.mesh}">${safe(x.name)}</button>`).join("");
}
async function loadModel(){
 if(!loadGuard){const {AsyncLoadGuard}=await import("../../engines/AsyncLoadGuard.js");loadGuard=new AsyncLoadGuard()}
 const token=loadGuard.begin(),gltf=await loader.load(context.assets.chooseVariant({variants:cfg().variants}));
 if(!loadGuard.isCurrent(token)){loadGuard.disposeObject(gltf.scene);return}
 if(modelRoot){engine.scene.remove(modelRoot);engine.disposeObject(modelRoot)}
 modelRoot=gltf.scene;
 modelRoot.traverse(c=>{
   if(!c.isMesh)return;c.userData.structureId=c.name;
   const marker=Boolean(point(c.name));
   let color=c.name==="reference_surface"?0xd7e3e8:c.name.includes("support")?0xc5d5db:c.name==="head"||c.name.includes("arm")?0xbe8268:c.name.includes("leg")?0x414c55:0x467797;
   if(marker)color=0xf0be5e;
   engine.replaceMaterial(c,new THREE.MeshStandardMaterial({color,roughness:.7,transparent:marker,opacity:marker?0.72:1}));
 });
 const box=new THREE.Box3().setFromObject(modelRoot),center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());modelRoot.position.sub(center);modelRoot.scale.setScalar(4.8/Math.max(size.x,size.y,size.z));engine.scene.add(modelRoot);raycast.setTarget(modelRoot);renderPosition()
}
function onClick(e){
 const b=e.target.closest("[data-position]");if(b){position=b.dataset.position;loadModel();return}
 const pointBtn=e.target.closest("[data-point]");if(pointBtn){renderPoint(pointBtn.dataset.point);return}
 const t=e.target.closest("[data-tool]");if(!t)return;if(t.dataset.tool==="overview")cameras?.go("overview");if(t.dataset.tool==="side")cameras?.go("side")
}
async function mount3D(){
 const imports=await Promise.all([import("../../engines/ThreeEngine.js"),import("../../engines/CameraController.js"),import("../../engines/GLBAssetLoader.js"),import("../../engines/RaycastManager.js")]);
 const {ThreeEngine,THREE:ThreeNS}=imports[0];THREE=ThreeNS;const {CameraController}=imports[1],{GLBAssetLoader}=imports[2],{RaycastManager}=imports[3];
 engine=new ThreeEngine({host:root.querySelector(".three-host"),graphics:context.graphics,events:context.events,background:0x07131f,camera:{fov:36,near:.05,far:60}});engine.addDefaultLights({ambient:1.4,key:2.7,fill:1.4,rim:1.1});engine.focus([0,-7,2.6],[0,0,0]);loader=new GLBAssetLoader({events:context.events});
 raycast=new RaycastManager({engine,target:null,selectable:id=>Boolean(point(id)),onSelect:({id})=>renderPoint(id)});
 cameras=new CameraController(engine);cameras.register("overview",{position:[0,-7,2.6],target:[0,0,0]});cameras.register("side",{position:[6.5,0,2.2],target:[0,0,0]});
 await loadModel();graphicsUnsub=context.events.on("graphics:profileChanged",loadModel);engine.start()
}
export default{
 async mount(ctx){context=ctx;data=await context.assets.loadJson("./modules/posicionamento/data/positions.json");root=document.createElement("section");root.className="room-lab positioning-g3";root.innerHTML=`<div class="room-stage"><div class="three-host"></div><div class="room-badge">POSICIONAMENTO · G3</div></div><aside class="room-panel"><span class="eyebrow">Comparação postural · G3</span><h2>Posicionamento e Pontos de Contato</h2><p>Visualize orientações corporais e pontos de contato neutros, sem instruções de transferência ou manobra.</p><div class="room-info"></div><div class="room-tools">${Object.entries(data.positions).map(([id,c])=>`<button class="room-tool" data-position="${id}">${safe(c.label)}</button>`).join("")}</div><span class="eyebrow">Pontos da posição</span><div class="position-point-list" data-point-list></div><div class="room-tools"><button class="room-tool" data-tool="overview">Visão geral</button><button class="room-tool" data-tool="side">Vista lateral</button></div><div class="room-note">Os pontos servem apenas para observação e discussão. O módulo não ensina mobilização, transferência, contenção ou técnica clínica de posicionamento.</div></aside>`;root.addEventListener("click",onClick);context.host.append(root);renderPosition();try{await mount3D()}catch(error){console.error(error);root.querySelector(".room-stage").innerHTML='<div style="display:grid;place-items:center;height:100%;color:#9db1c2">Modo leve: comparação 3D indisponível.</div>'}},
 async start(){engine?.start()},pause(){engine?.pause()},
 async destroy(){loadGuard?.invalidate();graphicsUnsub?.();raycast?.destroy();cameras?.destroy();loader?.destroy();if(modelRoot&&engine){engine.scene.remove(modelRoot);engine.disposeObject(modelRoot)}engine?.destroy();root?.removeEventListener("click",onClick);root?.remove();context=root=data=engine=loader=cameras=raycast=modelRoot=THREE=null}
};
