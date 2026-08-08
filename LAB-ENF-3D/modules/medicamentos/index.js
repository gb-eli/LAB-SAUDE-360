let loadGuard=null;
let context=null,root=null,modelManifest=null,casesData=null;
let engine=null,loader=null,raycast=null,cameras=null,modelRoot=null,THREE=null,graphicsUnsub=null;
let currentCase="case-a";

const safe=(s="")=>s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const activeCase=()=>casesData.cases.find(x=>x.id===currentCase)||casesData.cases[0];

function renderCase(){
 const c=activeCase();
 root.querySelectorAll("[data-case]").forEach(b=>b.classList.toggle("active",b.dataset.case===c.id));
 root.querySelector(".med-info").innerHTML=`<span class="eyebrow">Caso fictício</span><h3>${safe(c.title)}</h3><p>${safe(c.prescription)}</p>`;
 root.querySelector("[data-med-label]").innerHTML=`<span class="eyebrow">Rótulo fictício</span><h3>${safe(c.label.name)}</h3><dl><div><dt>Concentração</dt><dd>${safe(c.label.concentration)}</dd></div><div><dt>Lote</dt><dd>${safe(c.label.lot)}</dd></div><div><dt>Validade</dt><dd>${safe(c.label.expiry)}</dd></div><div><dt>Rota didática</dt><dd>${safe(c.label.route)}</dd></div></dl>`;
 root.querySelector("[data-checks]").innerHTML=c.checks.map((x,i)=>`<label class="check-item"><input type="checkbox" data-check-index="${i}"> ${safe(x)}</label>`).join("");
 root.querySelector("[data-calc-prompt]").textContent=`Cálculo acadêmico: ${c.calc.requested} UD solicitadas; ${c.calc.available} UD disponíveis em ${c.calc.presentation} mL simulados.`;
 root.querySelector("[data-calc-input]").value="";
 root.querySelector(".calc-result").textContent="";
}

function identifyObject(id){
 const map={
  vial_body:["Frasco didático","Recipiente visual usado para leitura de rótulo e conferência."],
  vial_label:["Rótulo","Área de identificação fictícia do produto didático."],
  ampoule_body:["Ampola didática","Representação visual para reconhecimento de apresentação."],
  training_syringe_barrel:["Seringa de treinamento","Objeto visual associado à organização de bandeja acadêmica."],
  case_board:["Quadro do caso","Exibe o caso fictício selecionado na interface."],
  label_card_proxy:["Cartão de identificação","Elemento visual para discussão de conferência de identificação."],
  swab_pack_proxy:["Pacote didático","Objeto genérico para organização visual da bancada."],
  glove_box_proxy:["Caixa didática de barreira","Objeto genérico para reconhecimento visual."],
  barcode_reference_proxy:["Referência de código","Marcador fictício para discussão de leitura e identificação."],
  case_identifier_proxy:["Identificador do caso","Marcador fictício adicional disponível no perfil HIGH."]
 };
 const item=map[id];if(!item)return;
 root.querySelector(".med-info").innerHTML=`<span class="eyebrow">Objeto selecionado</span><h3>${item[0]}</h3><p>${item[1]}</p>`;
}

function checkCalculation(){
 const c=activeCase();
 const input=Number(String(root.querySelector("[data-calc-input]").value).replace(",","."));
 const result=root.querySelector(".calc-result");
 if(!Number.isFinite(input)){result.textContent="Digite um valor numérico.";return}
 const ok=Math.abs(input-c.calc.answer)<0.01;
 result.textContent=ok?`Correto: ${c.calc.answer} ${c.calc.unit}.`:"Revise a proporção usando apenas os valores fictícios apresentados.";
 context.progress.saveModuleProgress("medicamentos",{case:c.id,lastCalcCorrect:ok});
}

function allChecksDone(){
 const checks=[...root.querySelectorAll("[data-check-index]")];
 const done=checks.length>0&&checks.every(x=>x.checked);
 root.querySelector(".calc-result").textContent=done?"Checklist acadêmico concluído.":"Ainda há itens de conferência não marcados.";
}

async function loadModel(){
 const url=context.assets.chooseVariant(modelManifest);
 if(!loadGuard){const {AsyncLoadGuard}=await import("../../engines/AsyncLoadGuard.js");loadGuard=new AsyncLoadGuard();}const loadToken=loadGuard.begin();const gltf=await loader.load(url);if(!loadGuard.isCurrent(loadToken)){loadGuard.disposeObject(gltf.scene);return;}
 if(modelRoot){engine.scene.remove(modelRoot);engine.disposeObject(modelRoot)}
 modelRoot=gltf.scene;
 modelRoot.traverse(child=>{
  if(!child.isMesh)return;
  child.userData.structureId=child.name;
  const amber=child.name==="vial_body";
  const screen=child.name==="case_screen";
  engine.replaceMaterial(child,new THREE.MeshPhysicalMaterial({
   color:amber?0xa66a34:screen?0x4d83a0:child.name.includes("label")?0xebf4f6:0xdce9ee,
   roughness:.5,
   transparent:amber||child.name==="ampoule_body"||child.name==="training_syringe_barrel",
   opacity:amber ? 0.72 : ((child.name==="ampoule_body"||child.name==="training_syringe_barrel") ? 0.55 : 1),
   clearcoat:.08
  }));
 });
 const box=new THREE.Box3().setFromObject(modelRoot),center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());
 modelRoot.position.sub(center);modelRoot.position.z+=.3;modelRoot.scale.setScalar(4.7/Math.max(size.x,size.y,size.z));
 engine.scene.add(modelRoot);raycast.setTarget(modelRoot)
}

function onClick(e){
 const caseBtn=e.target.closest("[data-case]");if(caseBtn){currentCase=caseBtn.dataset.case;renderCase();return}
 const tool=e.target.closest("[data-tool]");if(!tool)return;
 if(tool.dataset.tool==="front")cameras?.go("front");
 if(tool.dataset.tool==="detail")cameras?.go("detail");
 if(tool.dataset.tool==="calc")checkCalculation();
 if(tool.dataset.tool==="checklist")allChecksDone();
}

async function mount3D(){
 const imports=await Promise.all([import("../../engines/ThreeEngine.js"),import("../../engines/CameraController.js"),import("../../engines/GLBAssetLoader.js"),import("../../engines/RaycastManager.js")]);
 const {ThreeEngine,THREE:ThreeNS}=imports[0];THREE=ThreeNS;
 const {CameraController}=imports[1],{GLBAssetLoader}=imports[2],{RaycastManager}=imports[3];
 engine=new ThreeEngine({host:root.querySelector(".three-host"),graphics:context.graphics,events:context.events,background:0x06131f,camera:{fov:36,near:.05,far:60}});
 engine.addDefaultLights({ambient:1.35,key:2.9,fill:1.4,rim:1.1});engine.focus([0,-6.8,2.2],[0,0,.45]);
 loader=new GLBAssetLoader({events:context.events});
 raycast=new RaycastManager({engine,target:null,onSelect:({id})=>identifyObject(id)});
 cameras=new CameraController(engine);cameras.register("front",{position:[0,-6.8,2.2],target:[0,0,.45]});cameras.register("detail",{position:[2.5,-3.8,1.8],target:[0,0,.55]});
 await loadModel();graphicsUnsub=context.events.on("graphics:profileChanged",async()=>await loadModel());engine.start()
}

export default{
 async mount(ctx){
  context=ctx;[modelManifest,casesData]=await Promise.all([context.assets.loadJson("./modules/medicamentos/data/model.json"),context.assets.loadJson("./modules/medicamentos/data/cases.json")]);
  root=document.createElement("section");root.className="med-lab";
  root.innerHTML=`<div class="med-stage"><div class="three-host"></div><div class="med-badge">MEDICAMENTOS · G2 DIDÁTICO</div></div><aside class="med-panel"><span class="eyebrow">Administração segura · G2</span><h2>Rótulos, Organização e Cálculo Didático</h2><p>Casos totalmente fictícios para leitura de rótulos, checagens e raciocínio matemático acadêmico.</p><div class="case-tabs">${casesData.cases.map(c=>`<button class="case-tab" data-case="${c.id}">${safe(c.title)}</button>`).join("")}</div><div class="med-info"></div><div class="med-label-card" data-med-label></div><div class="check-list" data-checks></div><button class="med-tool" data-tool="checklist">Verificar checklist</button><div class="calc-box"><strong data-calc-prompt></strong><div class="calc-form"><input data-calc-input inputmode="decimal" placeholder="Resultado"><button class="med-tool" data-tool="calc">Conferir</button></div><div class="calc-result"></div></div><div style="display:flex;gap:.45rem;flex-wrap:wrap;margin-top:.75rem"><button class="med-tool" data-tool="front">Visão geral</button><button class="med-tool" data-tool="detail">Detalhe</button></div><div class="med-note">Os produtos, rotas, doses e pacientes são fictícios. Este módulo não orienta administração real de medicamentos.</div></aside>`;
  root.addEventListener("click",onClick);context.host.append(root);renderCase();
  try{await mount3D()}catch(error){console.error(error);root.querySelector(".med-stage").innerHTML='<div style="display:grid;place-items:center;height:100%;color:#9db1c2">Modo leve: bancada 3D indisponível.</div>'}
 },
 async start(){engine?.start()},pause(){engine?.pause()},
 async destroy(){loadGuard?.invalidate();graphicsUnsub?.();raycast?.destroy();cameras?.destroy();loader?.destroy();if(modelRoot&&engine){engine.scene.remove(modelRoot);engine.disposeObject(modelRoot)}engine?.destroy();root?.removeEventListener("click",onClick);root?.remove();context=root=modelManifest=casesData=engine=loader=raycast=cameras=modelRoot=THREE=null}
};
