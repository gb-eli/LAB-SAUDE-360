let context=null,root=null,data=null,engine=null,loader=null,cameras=null,modelRoot=null,THREE=null,graphicsUnsub=null,current="surgical-mask",loadGuard=null,query="",category="all";
const safe=(s="")=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const normalize=(s="")=>String(s).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const cfg=()=>data.materials[current];
const categories=()=>[...new Set(Object.values(data.materials).map(x=>x.category).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"pt-BR"));
function filtered(){
 const q=normalize(query);
 return Object.entries(data.materials).filter(([id,cfg])=>{
  if(category!=="all"&&cfg.category!==category)return false;
  if(!q)return true;
  return normalize([id,cfg.label,cfg.description,cfg.category,...(cfg.tags||[])].join(" ")).includes(q);
 });
}
function renderCatalog(){
 const box=root.querySelector("[data-material-catalog]"),items=filtered();
 box.innerHTML=items.length?items.map(([id,c])=>`<button class="material-catalog-card ${id===current?"active":""}" data-material="${id}"><strong>${safe(c.label)}</strong><small>${safe(c.category||"Material")}</small></button>`).join(""):`<div class="equipment-empty">Nenhum material encontrado.</div>`;
}
async function loadModel(){
 if(!loadGuard){const {AsyncLoadGuard}=await import("../../engines/AsyncLoadGuard.js");loadGuard=new AsyncLoadGuard()}
 const token=loadGuard.begin(),gltf=await loader.load(context.assets.chooseVariant({variants:cfg().variants}));
 if(!loadGuard.isCurrent(token)){loadGuard.disposeObject(gltf.scene);return}
 if(modelRoot){engine.scene.remove(modelRoot);engine.disposeObject(modelRoot)}
 modelRoot=gltf.scene;modelRoot.traverse(c=>{if(!c.isMesh)return;let color=0xdde9ed;if(c.name.includes("mask"))color=0x87c0d0;if(c.name.includes("sharps"))color=0xe3c637;if(c.name.includes("cap"))color=0x8f4550;if(c.name.includes("tourniquet"))color=0x4f7e9e;if(c.name.includes("bag")||c.name.includes("tube"))color=0xcfe8ef;const transparent=c.name.includes("bag")||c.name==="collection_tube";engine.replaceMaterial(c,new THREE.MeshPhysicalMaterial({color,roughness:.58,transparent,opacity:transparent?0.58:1,clearcoat:.05}))});
 const box=new THREE.Box3().setFromObject(modelRoot),center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());modelRoot.position.sub(center);modelRoot.scale.setScalar(4.2/Math.max(size.x,size.y,size.z));engine.scene.add(modelRoot);
 root.querySelector(".anatomy16-info").innerHTML=`<span class="eyebrow">${safe(cfg().category||"Material")}</span><h3>${safe(cfg().label)}</h3><p>${safe(cfg().description)}</p>`;renderCatalog()
}
function onClick(e){const b=e.target.closest("[data-material]");if(b){current=b.dataset.material;loadModel();return}const t=e.target.closest("[data-tool]");if(!t)return;if(t.dataset.tool==="front")cameras?.go("front");if(t.dataset.tool==="detail")cameras?.go("detail")}
function onInput(e){if(e.target.matches("[data-material-search]")){query=e.target.value;renderCatalog()}}
function onChange(e){if(e.target.matches("[data-material-category]")){category=e.target.value;renderCatalog()}}
async function mount3D(){
 const imports=await Promise.all([import("../../engines/ThreeEngine.js"),import("../../engines/CameraController.js"),import("../../engines/GLBAssetLoader.js")]);const {ThreeEngine,THREE:ThreeNS}=imports[0];THREE=ThreeNS;const {CameraController}=imports[1],{GLBAssetLoader}=imports[2];
 engine=new ThreeEngine({host:root.querySelector(".three-host"),graphics:context.graphics,events:context.events,background:0x07131f,camera:{fov:34,near:.05,far:50}});engine.addDefaultLights({ambient:1.45,key:2.7,fill:1.35,rim:1});engine.focus([0,-5.5,.8],[0,0,0]);loader=new GLBAssetLoader({events:context.events});cameras=new CameraController(engine);cameras.register("front",{position:[0,-5.5,.8],target:[0,0,0]});cameras.register("detail",{position:[2.6,-3.2,1.5],target:[0,0,0]});await loadModel();graphicsUnsub=context.events.on("graphics:profileChanged",loadModel);engine.start()
}
export default{
 async mount(ctx){context=ctx;data=await context.assets.loadJson("./modules/materiais-hospitalares/data/materials.json");root=document.createElement("section");root.className="anatomy16-lab material-catalog-lab";root.innerHTML=`<div class="anatomy16-stage"><div class="three-host"></div><div class="anatomy16-badge">MATERIAIS HOSPITALARES</div></div><aside class="anatomy16-panel"><span class="eyebrow">Catálogo visual · G2 · v0.24</span><h2>Materiais Hospitalares 3D</h2><p>Pesquise e filtre materiais genéricos para reconhecimento visual.</p><div class="equipment-filterbar"><input data-material-search type="search" placeholder="Buscar material" aria-label="Buscar material"><select data-material-category aria-label="Filtrar materiais por categoria"><option value="all">Todas as categorias</option>${categories().map(x=>`<option value="${safe(x)}">${safe(x)}</option>`).join("")}</select></div><div class="material-catalog" data-material-catalog></div><div class="anatomy16-info"></div><div class="anatomy16-tools"><button class="anatomy16-tool" data-tool="front">Visão geral</button><button class="anatomy16-tool" data-tool="detail">Detalhe</button></div><div class="anatomy16-note">Galeria apenas para reconhecimento visual. Não apresenta indicação de uso, técnica, preparo, dose ou procedimento clínico.</div></aside>`;root.addEventListener("click",onClick);root.addEventListener("input",onInput);root.addEventListener("change",onChange);context.host.append(root);renderCatalog();try{await mount3D()}catch(error){console.error(error);root.querySelector(".anatomy16-stage").innerHTML='<div style="display:grid;place-items:center;height:100%;color:#9db1c2">Modo leve: galeria 3D indisponível.</div>'}},
 async start(){engine?.start()},pause(){engine?.pause()},
 async destroy(){loadGuard?.invalidate();graphicsUnsub?.();cameras?.destroy();loader?.destroy();if(modelRoot&&engine){engine.scene.remove(modelRoot);engine.disposeObject(modelRoot)}engine?.destroy();root?.removeEventListener("click",onClick);root?.removeEventListener("input",onInput);root?.removeEventListener("change",onChange);root?.remove();context=root=data=engine=loader=cameras=modelRoot=THREE=null}
};
