let context=null,root=null,manifest=null,content=null,engine=null,loader=null,raycast=null,cameras=null,modelRoot=null,THREE=null,graphicsUnsub=null,loadGuard=null,rotating=false,frameUnsub=null;
const safe=(s="")=>s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const item=id=>content.structures.find(x=>x.mesh===id);
function select(id){const x=item(id);if(!x)return;root.querySelector(".patient-info").innerHTML=`<span class="eyebrow">Região selecionada</span><h3>${safe(x.name)}</h3><p>${safe(x.description)}</p>`}
async function loadModel(){
 if(!loadGuard){const {AsyncLoadGuard}=await import("../../engines/AsyncLoadGuard.js");loadGuard=new AsyncLoadGuard()}
 const token=loadGuard.begin();const gltf=await loader.load(context.assets.chooseVariant(manifest));
 if(!loadGuard.isCurrent(token)){loadGuard.disposeObject(gltf.scene);return}
 if(modelRoot){engine.scene.remove(modelRoot);engine.disposeObject(modelRoot)}
 modelRoot=gltf.scene;
 modelRoot.traverse(c=>{
  if(!c.isMesh)return;c.userData.structureId=c.name;
  const marker=c.name.includes("_proxy")||c.name.includes("_site_");
  const color=marker?0x74c0fc:c.name==="torso"?0x3f7299:c.name.includes("thigh")||c.name.includes("lower_leg")?0x374650:0xbe8268;
  engine.replaceMaterial(c,new THREE.MeshPhysicalMaterial({color,roughness:marker?0.30:0.65,transparent:c.name==="chest_motion_reference_proxy",opacity:c.name==="chest_motion_reference_proxy"?0.40:1}))
 });
 const box=new THREE.Box3().setFromObject(modelRoot),center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());
 modelRoot.position.sub(center);modelRoot.position.z+=.8;modelRoot.scale.setScalar(4.8/Math.max(size.x,size.y,size.z));engine.scene.add(modelRoot);raycast.setTarget(modelRoot)
}
function onClick(e){const t=e.target.closest("[data-tool]");if(!t)return;if(t.dataset.tool==="front")cameras?.go("front");if(t.dataset.tool==="side")cameras?.go("side");if(t.dataset.tool==="rotate"){rotating=!rotating;t.classList.toggle("active",rotating)}}
async function mount3D(){
 const imports=await Promise.all([import("../../engines/ThreeEngine.js"),import("../../engines/CameraController.js"),import("../../engines/GLBAssetLoader.js"),import("../../engines/RaycastManager.js")]);
 const {ThreeEngine,THREE:ThreeNS}=imports[0];THREE=ThreeNS;const {CameraController}=imports[1],{GLBAssetLoader}=imports[2],{RaycastManager}=imports[3];
 engine=new ThreeEngine({host:root.querySelector(".three-host"),graphics:context.graphics,events:context.events,background:0x07131f,camera:{fov:35,near:.05,far:80}});engine.addDefaultLights({ambient:1.4,key:2.8,fill:1.4,rim:1.2});engine.focus([0,-7.1,1],[0,0,.8]);
 loader=new GLBAssetLoader({events:context.events});raycast=new RaycastManager({engine,target:null,selectable:id=>Boolean(item(id)),onSelect:({id})=>select(id)});
 cameras=new CameraController(engine);cameras.register("front",{position:[0,-7.1,1],target:[0,0,.8]});cameras.register("side",{position:[6.4,0,1],target:[0,0,.8]});
 frameUnsub=engine.onFrame(({delta})=>{if(rotating&&modelRoot)modelRoot.rotation.y+=delta*.28});
 await loadModel();graphicsUnsub=context.events.on("graphics:profileChanged",loadModel);engine.start()
}
export default{
 async mount(ctx){context=ctx;[manifest,content]=await Promise.all([context.assets.loadJson("./modules/paciente-3d/data/model.json"),context.assets.loadJson("./modules/paciente-3d/data/content.json")]);root=document.createElement("section");root.className="patient-lab";root.innerHTML=`<div class="patient-stage"><div class="three-host"></div><div class="patient-badge">PACIENTE G3</div></div><aside class="patient-panel"><span class="eyebrow">Exploração corporal · G3</span><h2>Paciente 3D</h2><p>Modelo humano genérico para orientação espacial e reconhecimento corporal.</p><div class="patient-info"><span class="eyebrow">Exploração</span><h3>Selecione uma região</h3><p>Gire o modelo ou use as vistas prontas.</p></div><div class="patient-tools"><button class="patient-tool" data-tool="front">Frontal</button><button class="patient-tool" data-tool="side">Lateral</button><button class="patient-tool" data-tool="rotate">Auto rotação</button></div><div class="patient-list">${content.structures.map(x=>`<div class="patient-row">${safe(x.name)}</div>`).join("")}</div><div class="patient-note">Modelo genérico e educacional. Não representa uma pessoa real, exame físico, diagnóstico ou avaliação clínica.</div></aside>`;root.addEventListener("click",onClick);context.host.append(root);try{await mount3D()}catch(error){console.error(error);root.querySelector(".patient-stage").innerHTML='<div style="display:grid;place-items:center;height:100%;color:#9db1c2">Modo leve: paciente 3D indisponível.</div>'}},
 async start(){engine?.start()},pause(){engine?.pause()},
 async destroy(){loadGuard?.invalidate();graphicsUnsub?.();frameUnsub?.();raycast?.destroy();cameras?.destroy();loader?.destroy();if(modelRoot&&engine){engine.scene.remove(modelRoot);engine.disposeObject(modelRoot)}engine?.destroy();root?.removeEventListener("click",onClick);root?.remove();context=root=manifest=content=engine=loader=raycast=cameras=modelRoot=THREE=null}
};
