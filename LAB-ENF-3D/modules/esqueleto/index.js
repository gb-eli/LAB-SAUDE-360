let loadGuard=null;
let context=null,root=null,modelManifest=null,structureData=null;
let engine=null,loader=null,raycast=null,cameras=null,joints=null,modelRoot=null,graphicsUnsub=null,THREE=null;

const safe=(s="")=>s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const itemByMesh=id=>structureData.structures.find(x=>x.mesh===id);

function select(id){
  const item=itemByMesh(id);if(!item)return;
  root.querySelector(".skel-info").innerHTML=`<span class="eyebrow">${safe(item.region)}</span><h3>${safe(item.name)}</h3><p>${safe(item.description)}</p>`;
}

function setRegion(region){
  if(!modelRoot)return;
  const matcher={
    all:()=>true,
    axial:n=>n==="skull"||n==="spine"||n==="sternum"||n==="rib_cage_cluster",
    upper:n=>n.includes("clavicle")||n.includes("scapula")||n.includes("shoulder_joint")||n.includes("humerus")||n.includes("radius")||n.includes("ulna")||n.includes("elbow_joint")||n.includes("hand_cluster"),
    lower:n=>n.includes("pelvis")||n.includes("hip_joint")||n.includes("femur")||n.includes("patella")||n.includes("tibia")||n.includes("fibula")||n.includes("knee_joint")||n.includes("foot_cluster")
  }[region]||(()=>true);
  modelRoot.traverse(child=>{if(child.isMesh)child.visible=matcher(child.name)});
  root.querySelectorAll("[data-region]").forEach(b=>b.classList.toggle("active",b.dataset.region===region));
}

function installJoints(){
  joints.clear();

  joints.registerPivot({
    id:"left-elbow",
    root:modelRoot,
    pivotObjectName:"left_elbow_joint",
    childNames:["left_radius","left_ulna"],
    axis:"x"
  });

  joints.registerPivot({
    id:"right-elbow",
    root:modelRoot,
    pivotObjectName:"right_elbow_joint",
    childNames:["right_radius","right_ulna"],
    axis:"x"
  });

  joints.registerPivot({
    id:"left-knee",
    root:modelRoot,
    pivotObjectName:"left_knee_joint",
    childNames:["left_tibia","left_fibula"],
    axis:"x"
  });

  joints.registerPivot({
    id:"right-knee",
    root:modelRoot,
    pivotObjectName:"right_knee_joint",
    childNames:["right_tibia","right_fibula"],
    axis:"x"
  });
}

async function loadModel(){
  const url=context.assets.chooseVariant(modelManifest);
  if(!loadGuard){const {AsyncLoadGuard}=await import("../../engines/AsyncLoadGuard.js");loadGuard=new AsyncLoadGuard();}const loadToken=loadGuard.begin();const gltf=await loader.load(url);if(!loadGuard.isCurrent(loadToken)){loadGuard.disposeObject(gltf.scene);return;}
  if(modelRoot){engine.scene.remove(modelRoot);engine.disposeObject(modelRoot)}
  modelRoot=gltf.scene;
  modelRoot.traverse(child=>{
    if(!child.isMesh)return;
    child.userData.structureId=child.name;
    child.castShadow=true;child.receiveShadow=true;
    engine.replaceMaterial(child,new THREE.MeshStandardMaterial({color:child.name.includes("joint")?0xcbbfa0:0xe4dfc7,roughness:.72}));
  });
  const box=new THREE.Box3().setFromObject(modelRoot),center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());
  modelRoot.position.sub(center);modelRoot.position.z+=.9;modelRoot.scale.setScalar(4.7/Math.max(size.x,size.y,size.z));
  engine.scene.add(modelRoot);raycast.setTarget(modelRoot);installJoints();setRegion("all");
  root.querySelector("[data-quality]").textContent=context.graphics.activeProfile.toUpperCase();
}

function onInput(e){
  const range=e.target.closest("[data-joint]");if(!range)return;
  const deg=Number(range.value),rad=deg*Math.PI/180;
  joints.apply(range.dataset.joint,rad);
  root.querySelector(`[data-joint-value="${range.dataset.joint}"]`).textContent=`${deg}°`;
}

function onClick(e){
  const region=e.target.closest("[data-region]");if(region){setRegion(region.dataset.region);return}
  const tool=e.target.closest("[data-tool]");if(!tool)return;
  const a=tool.dataset.tool;if(["front","side","back"].includes(a))cameras?.go(a);
  if(a==="reset"){cameras?.go("front");setRegion("all");root.querySelectorAll("[data-joint]").forEach(r=>{r.value=0;joints.apply(r.dataset.joint,0);root.querySelector(`[data-joint-value="${r.dataset.joint}"]`).textContent="0°"})}
}

async function mount3D(){
  const imports=await Promise.all([import("../../engines/ThreeEngine.js"),import("../../engines/CameraController.js"),import("../../engines/GLBAssetLoader.js"),import("../../engines/RaycastManager.js"),import("../../engines/JointController.js")]);
  const {ThreeEngine,THREE:ThreeNS}=imports[0];THREE=ThreeNS;const {CameraController}=imports[1],{GLBAssetLoader}=imports[2],{RaycastManager}=imports[3],{JointController}=imports[4];
  engine=new ThreeEngine({host:root.querySelector(".three-host"),graphics:context.graphics,events:context.events,background:0x06131f,camera:{fov:34,near:.05,far:80}});
  const {applyAnatomyPresentation,registerAnatomyViews}=await import("../../engines/AnatomyPresentationPreset.js");presentationCleanup=applyAnatomyPresentation({engine,THREE,events:context.events,mood:"skeleton"});engine.focus([0,-7.6,1.1],[0,0,.8]);loader=new GLBAssetLoader({events:context.events});raycast=new RaycastManager({engine,target:null,selectable:id=>Boolean(itemByMesh(id)),onSelect:({id})=>select(id)});cameras=new CameraController(engine);joints=new JointController({THREE});
  registerAnatomyViews(cameras,{distance:7.6,target:[0,0,.8]});
  await loadModel();graphicsUnsub=context.events.on("graphics:profileChanged",async()=>await loadModel());engine.start();
}

export default{
 async mount(ctx){context=ctx;[modelManifest,structureData]=await Promise.all([context.assets.loadJson("./modules/esqueleto/data/model.json"),context.assets.loadJson("./modules/esqueleto/data/structures.json")]);root=document.createElement("section");root.className="skel-lab";root.innerHTML=`<div class="skel-stage"><div class="three-host"></div><div class="skel-badge">ESQUELETO · <span data-quality>—</span></div></div><aside class="skel-panel"><span class="eyebrow">Laboratório esquelético · G3 · v0.25</span><h2>Esqueleto G3 — Segmentação e Pivôs</h2><p>Exploração G3 com cintura escapular, pelve, membros segmentados, patelas, mãos/pés simplificados e pivôs articulares de cotovelos e joelhos.</p><div class="skel-info"><span class="eyebrow">Exploração</span><h3>Selecione um osso</h3><p>Clique diretamente nas estruturas e use os filtros regionais.</p></div><div class="skel-tools"><button class="skel-tool" data-tool="front">Frontal</button><button class="skel-tool" data-tool="side">Lateral</button><button class="skel-tool" data-tool="back">Posterior</button><button class="skel-tool" data-tool="reset">Resetar</button><button class="skel-tool active" data-region="all">Completo</button><button class="skel-tool" data-region="axial">Axial</button><button class="skel-tool" data-region="upper">Membros sup.</button><button class="skel-tool" data-region="lower">Membros inf.</button></div><div class="joint-box"><strong>Movimentos articulares didáticos</strong><label>Cotovelo E.<input data-joint="left-elbow" type="range" min="-55" max="55" value="0"><div class="joint-readout"><span>Ângulo visual</span><span data-joint-value="left-elbow">0°</span></div></label><label>Cotovelo D.<input data-joint="right-elbow" type="range" min="-55" max="55" value="0"><div class="joint-readout"><span>Ângulo visual</span><span data-joint-value="right-elbow">0°</span></div></label><label>Joelho E.<input data-joint="left-knee" type="range" min="-45" max="45" value="0"><div class="joint-readout"><span>Ângulo visual</span><span data-joint-value="left-knee">0°</span></div></label><label>Joelho D.<input data-joint="right-knee" type="range" min="-45" max="45" value="0"><div class="joint-readout"><span>Ângulo visual</span><span data-joint-value="right-knee">0°</span></div></label></div><div class="skel-note">Os movimentos usam pivôs posicionados nas referências de cotovelo e joelho do modelo. Continuam sendo simplificações visuais, não simulação biomecânica clínica.</div></aside>`;root.addEventListener("click",onClick);root.addEventListener("input",onInput);context.host.append(root);try{await mount3D()}catch(error){console.error(error);root.querySelector(".skel-stage").innerHTML='<div style="display:grid;place-items:center;height:100%;color:#9db1c2">Modo leve: laboratório 3D indisponível.</div>'}},
 async start(){engine?.start()},pause(){engine?.pause()},
 async destroy(){loadGuard?.invalidate();graphicsUnsub?.();presentationCleanup?.();joints?.destroy();raycast?.destroy();cameras?.destroy();loader?.destroy();if(modelRoot&&engine){engine.scene.remove(modelRoot);engine.disposeObject(modelRoot)}engine?.destroy();root?.removeEventListener("click",onClick);root?.removeEventListener("input",onInput);root?.remove();context=root=modelManifest=structureData=engine=loader=raycast=cameras=joints=modelRoot=THREE=null}
};
