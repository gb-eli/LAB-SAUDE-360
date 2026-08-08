let loadGuard=null;
let context=null,root=null,modelData=null,content=null,engine=null,loader=null,raycast=null,cameras=null,modelRoot=null,THREE=null,graphicsUnsub=null;
let stage="t1",uterusOpacity=.22,rotating=false,frameUnsub=null;

const safe=(s="")=>s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const itemByMesh=id=>content.structures.find(x=>x.mesh===id);
function chooseUrl(){return context.assets.chooseVariant({variants:modelData.stages[stage].variants})}

function styleModel(){
 modelRoot.traverse(child=>{
  if(!child.isMesh)return;
  child.userData.structureId=child.name;
  const transparent=child.name==="uterus"||child.name==="amniotic_space";
  const color=child.name==="uterus"?0xc97d91:child.name==="placenta"?0x8f4655:child.name==="umbilical_cord"?0xa97e9f:child.name==="amniotic_space"?0x74c0fc:0xdca995;
  engine.replaceMaterial(child,new THREE.MeshPhysicalMaterial({color,roughness:.55,transparent,opacity:child.name==="uterus"?uterusOpacity:child.name==="amniotic_space" ? 0.12 : 1,side:THREE.DoubleSide,clearcoat:.05}));
 });
}

async function loadStage(){
 if(!loadGuard){const {AsyncLoadGuard}=await import("../../engines/AsyncLoadGuard.js");loadGuard=new AsyncLoadGuard();}const loadToken=loadGuard.begin();const gltf=await loader.load(chooseUrl());if(!loadGuard.isCurrent(loadToken)){loadGuard.disposeObject(gltf.scene);return;}
 if(modelRoot){engine.scene.remove(modelRoot);engine.disposeObject(modelRoot)}
 modelRoot=gltf.scene;styleModel();
 const box=new THREE.Box3().setFromObject(modelRoot),center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());
 modelRoot.position.sub(center);modelRoot.scale.setScalar(3.8/Math.max(size.x,size.y,size.z));engine.scene.add(modelRoot);raycast.setTarget(modelRoot);
 root.querySelectorAll("[data-stage]").forEach(b=>b.classList.toggle("active",b.dataset.stage===stage));
 root.querySelector("[data-stage-label]").textContent=modelData.stages[stage].label;
 root.querySelector("[data-timeline]").textContent=content.timeline[stage];
}

function select(id){
 const item=itemByMesh(id);if(!item)return;
 root.querySelector(".maternal-info").innerHTML=`<span class="eyebrow">Estrutura selecionada</span><h3>${safe(item.name)}</h3><p>${safe(item.description)}</p>`;
}

function onInput(e){
 const range=e.target.closest("[data-opacity]");if(!range)return;
 uterusOpacity=Number(range.value);
 const uterus=modelRoot?.getObjectByName("uterus");
 if(uterus?.material){uterus.material.opacity=uterusOpacity;uterus.material.needsUpdate=true}
 root.querySelector("[data-opacity-value]").textContent=`${Math.round(uterusOpacity*100)}%`;
}

function onClick(e){
 const tab=e.target.closest("[data-stage]");if(tab){stage=tab.dataset.stage;loadStage();return}
 const tool=e.target.closest("[data-tool]");if(!tool)return;
 const a=tool.dataset.tool;
 if(a==="front")cameras?.go("front");if(a==="side")cameras?.go("side");
 if(a==="rotate"){rotating=!rotating;tool.classList.toggle("active",rotating)}
 if(a==="cephalic"&&modelRoot)modelRoot.rotation.z=0;
 if(a==="breech"&&modelRoot)modelRoot.rotation.z=Math.PI;
}

async function mount3D(){
 const imports=await Promise.all([import("../../engines/ThreeEngine.js"),import("../../engines/CameraController.js"),import("../../engines/GLBAssetLoader.js"),import("../../engines/RaycastManager.js")]);
 const {ThreeEngine,THREE:ThreeNS}=imports[0];THREE=ThreeNS;const {CameraController}=imports[1],{GLBAssetLoader}=imports[2],{RaycastManager}=imports[3];
 engine=new ThreeEngine({host:root.querySelector(".three-host"),graphics:context.graphics,events:context.events,background:0x08111b,camera:{fov:36,near:.05,far:60}});
 engine.addDefaultLights({ambient:1.35,key:2.6,fill:1.3,rim:1.2});engine.focus([0,-6.3,.5],[0,0,0]);
 loader=new GLBAssetLoader({events:context.events});raycast=new RaycastManager({engine,target:null,selectable:id=>Boolean(itemByMesh(id)),onSelect:({id})=>select(id)});cameras=new CameraController(engine);
 cameras.register("front",{position:[0,-6.3,.5],target:[0,0,0]});cameras.register("side",{position:[5.6,0,.5],target:[0,0,0]});
 frameUnsub=engine.onFrame(({delta})=>{if(rotating&&modelRoot)modelRoot.rotation.y+=delta*.3});
 await loadStage();graphicsUnsub=context.events.on("graphics:profileChanged",async()=>await loadStage());engine.start()
}

export default{
 async mount(ctx){context=ctx;[modelData,content]=await Promise.all([context.assets.loadJson("./modules/materno-infantil/data/model.json"),context.assets.loadJson("./modules/materno-infantil/data/content.json")]);root=document.createElement("section");root.className="maternal-lab";root.innerHTML=`<div class="maternal-stage"><div class="three-host"></div><div class="maternal-badge">SAÚDE MATERNO-INFANTIL · <span data-stage-label>—</span></div></div><aside class="maternal-panel"><span class="eyebrow">Gestação 3D · G3</span><h2>Gestação G3 por fases</h2><p>Comparação didática de três fases da gestação com útero, feto, placenta e cordão representados de forma esquemática.</p><div class="stage-tabs"><button class="stage-tab active" data-stage="t1">1º tri.</button><button class="stage-tab" data-stage="t2">2º tri.</button><button class="stage-tab" data-stage="t3">3º tri.</button></div><div class="maternal-info"><span class="eyebrow">Exploração</span><h3>Selecione uma estrutura</h3><p>Gire o modelo e clique diretamente nos elementos visíveis.</p></div><div class="maternal-tools"><button class="maternal-tool" data-tool="front">Frontal</button><button class="maternal-tool" data-tool="side">Lateral</button><button class="maternal-tool" data-tool="rotate">Auto rotação</button><button class="maternal-tool" data-tool="cephalic">Posição A</button><button class="maternal-tool" data-tool="breech">Posição B</button></div><label class="field-label">Transparência do útero<input data-opacity type="range" min=".08" max=".55" step=".03" value=".22"><span data-opacity-value>22%</span></label><div class="timeline-card" data-timeline></div><div class="maternal-note">As posições A/B e a escala fetal são recursos visuais esquemáticos. O módulo não representa avaliação obstétrica, diagnóstico, conduta ou orientação de parto.</div></aside>`;root.addEventListener("click",onClick);root.addEventListener("input",onInput);context.host.append(root);try{await mount3D()}catch(error){console.error(error);root.querySelector(".maternal-stage").innerHTML='<div style="display:grid;place-items:center;height:100%;color:#9db1c2">Modo leve: visualização 3D indisponível.</div>'}},
 async start(){engine?.start()},pause(){engine?.pause()},
 async destroy(){loadGuard?.invalidate();graphicsUnsub?.();frameUnsub?.();raycast?.destroy();cameras?.destroy();loader?.destroy();if(modelRoot&&engine){engine.scene.remove(modelRoot);engine.disposeObject(modelRoot)}engine?.destroy();root?.removeEventListener("click",onClick);root?.removeEventListener("input",onInput);root?.remove();context=root=modelData=content=engine=loader=raycast=cameras=modelRoot=THREE=null}
};
