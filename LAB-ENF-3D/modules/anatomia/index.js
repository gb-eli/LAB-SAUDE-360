let context=null,root=null,data=null,modelManifest=null;
let engine=null,loader3d=null,raycastManager=null,cameraController=null,modelRoot=null;
let currentUrl=null,graphicsUnsub=null,frameUnsub=null,beating=true,quizTarget=null,baseScale=1;

const safe=(s="")=>s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));

function itemFromMesh(id){return data.structures.find(x=>x.meshName===id||x.id===id)}

function selectMesh(id){
  const item=itemFromMesh(id); if(!item)return;
  root.querySelector(".anatomy-info3d").innerHTML=`<span class="eyebrow">Seleção direta no modelo</span><h3>${safe(item.name)}</h3><p>${safe(item.description)}</p>`;
  root.querySelector("[data-selected]").textContent=item.name;
  if(quizTarget){
    const status=root.querySelector(".anatomy-status3d");
    if(quizTarget.meshName===id||quizTarget.id===id){
      status.textContent="Correto. Estrutura identificada diretamente no 3D.";
      context.progress.saveModuleProgress("anatomia",{lastQuizCorrect:true,lastStructure:item.id});
      quizTarget=null;
    }else status.textContent="Ainda não. Gire o modelo e clique em outra estrutura.";
  }
}

function chooseUrl(){return context.assets.chooseVariant(modelManifest)}

function loading(show,ratio=null){
  const box=root.querySelector(".asset-loader"); box.hidden=!show;
  if(show){
    const pct=ratio==null?18:Math.max(5,Math.min(100,Math.round(ratio*100)));
    box.querySelector(".load-bar").style.width=`${pct}%`;
    box.querySelector("[data-load-text]").textContent=ratio==null?"Carregando asset 3D…":`${pct}%`;
  }
}

async function loadModel(force=false){
  const url=chooseUrl(); if(!force&&modelRoot&&url===currentUrl)return;
  loading(true);
  try{
    const {THREE}=await import("../../engines/ThreeEngine.js");
    const gltf=await loader3d.load(url,{onProgress:({ratio})=>loading(true,ratio)});
    if(modelRoot){engine.scene.remove(modelRoot);engine.disposeObject(modelRoot)}
    modelRoot=gltf.scene;
    modelRoot.traverse(child=>{
      if(!child.isMesh)return;
      child.userData.structureId=child.name;child.castShadow=true;child.receiveShadow=true;
      const blue=child.name==="pulmonary_artery"||child.name==="vena_cava";
      engine.replaceMaterial(child,new THREE.MeshPhysicalMaterial({
        color:blue?0x41679a:child.name==="aorta"?0xd94d67:(child.name==="right_ventricle"||child.name==="right_atrium")?0x7d233c:0xb9344f,
        roughness:.52,clearcoat:context.graphics.activeProfile==="eco"?.04:.18,clearcoatRoughness:.48
      }));
    });
    const box=new THREE.Box3().setFromObject(modelRoot),center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());
    modelRoot.position.sub(center);baseScale=2.9/Math.max(size.x,size.y,size.z);modelRoot.scale.setScalar(baseScale);
    engine.scene.add(modelRoot);raycastManager.setTarget(modelRoot);currentUrl=url;
    root.querySelector("[data-asset]").textContent=url.split("/").pop();
    root.querySelector("[data-lod]").textContent=context.graphics.activeProfile.toUpperCase();
    loading(false);
  }catch(error){console.error(error);loading(false);throw error}
}

function newQuiz(){
  const available=data.structures.filter(item=>modelRoot?.getObjectByName(item.meshName||item.id));
  if(!available.length){
    root.querySelector("[data-quiz-question]").textContent="Nenhuma estrutura disponível neste LOD.";
    return;
  }
  quizTarget=available[Math.floor(Math.random()*available.length)];
  root.querySelector("[data-quiz-question]").textContent=`Clique diretamente em: ${quizTarget.name}`;
  root.querySelector(".anatomy-status3d").textContent="";
}

function onClick(e){
  const tool=e.target.closest("[data-tool]"); if(!tool)return;
  const a=tool.dataset.tool;
  if(a==="beat"){beating=!beating;tool.classList.toggle("active",beating)}
  if(["front","side","top"].includes(a))cameraController?.go(a);
  if(a==="quiz")newQuiz();
  if(a==="reload"){currentUrl=null;loadModel(true)}
  if(a==="reset"){
    beating=true;quizTarget=null;cameraController?.go("front");
    root.querySelector('[data-tool="beat"]')?.classList.add("active");
    root.querySelector("[data-selected]").textContent="—";
    root.querySelector("[data-quiz-question]").textContent="Ative um desafio para praticar.";
    root.querySelector(".anatomy-status3d").textContent="";
    root.querySelector(".anatomy-info3d").innerHTML='<span class="eyebrow">Exploração GLB</span><h3>Clique no próprio modelo</h3><p>Gire o coração e toque diretamente nas malhas para identificar estruturas.</p>';
  }
}

async function mount3D(){
  const [{ThreeEngine,THREE},{CameraController},{GLBAssetLoader},{RaycastManager}]=await Promise.all([
    import("../../engines/ThreeEngine.js"),import("../../engines/CameraController.js"),import("../../engines/GLBAssetLoader.js"),import("../../engines/RaycastManager.js")
  ]);
  engine=new ThreeEngine({host:root.querySelector(".three-host"),graphics:context.graphics,events:context.events,background:0x06131f,camera:{fov:36,near:.05,far:50}});
  engine.addDefaultLights({ambient:1.35,key:3.4,fill:1.35,rim:2.6});engine.focus([0,.18,5.1],[0,.12,0]);
  const floor=new THREE.Mesh(new THREE.CircleGeometry(2.2,64),new THREE.MeshStandardMaterial({color:0x0b2634,roughness:.94,transparent:true,opacity:.78}));
  floor.rotation.x=-Math.PI/2;floor.position.y=-1.52;floor.receiveShadow=true;engine.scene.add(floor);
  cameraController=new CameraController(engine);
  cameraController.register("front",{position:[0,.18,5.1],target:[0,.12,0]});
  cameraController.register("side",{position:[4.1,.2,2.8],target:[0,.12,0]});
  cameraController.register("top",{position:[0,4.3,2.6],target:[0,.25,0]});
  loader3d=new GLBAssetLoader({events:context.events});
  raycastManager=new RaycastManager({engine,target:null,selectable:id=>Boolean(itemFromMesh(id)),onSelect:({id})=>selectMesh(id)});
  frameUnsub=engine.onFrame(({time})=>{if(!modelRoot)return;const pulse=beating?1+Math.max(0,Math.sin(time*.0076))**12*.028:1;modelRoot.scale.setScalar(baseScale*pulse)});
  graphicsUnsub=context.events.on("graphics:profileChanged",async()=>{await loadModel(false)});
  await loadModel(false);engine.start();
}

export default{
 async mount(ctx){
  context=ctx;[data,modelManifest]=await Promise.all([context.assets.loadJson("./modules/anatomia/data/heart.json"),context.assets.loadJson("./modules/anatomia/data/model.json")]);
  root=document.createElement("section");root.className="anatomy-lab3d";
  root.innerHTML=`<div class="anatomy-viewport"><div class="three-host"></div><div class="three-badge">GLB · LOD <span data-lod>—</span></div><div class="asset-loader"><strong>Carregando anatomia 3D</strong><span data-load-text>Preparando…</span><div class="load-track"><div class="load-bar"></div></div></div></div><aside class="anatomy-panel3d"><span class="eyebrow">Anatomia · G3</span><h2>Coração G3 — Estruturas Internas</h2><p>Explore câmaras, grandes vasos e referências internas simplificadas sem perder a compatibilidade semântica das versões anteriores.</p><div class="asset-meta"><div><span>Asset</span><strong data-asset>—</strong></div><div><span>Selecionado</span><strong data-selected>—</strong></div></div><div class="anatomy-info3d"><span class="eyebrow">Exploração GLB</span><h3>Clique no próprio modelo</h3><p>Gire o coração e toque diretamente nas malhas para identificar estruturas.</p></div><div class="anatomy-tools3d"><button class="anatomy-tool3d active" data-tool="beat">Batimento</button><button class="anatomy-tool3d" data-tool="front">Frontal</button><button class="anatomy-tool3d" data-tool="side">Lateral</button><button class="anatomy-tool3d" data-tool="top">Superior</button><button class="anatomy-tool3d" data-tool="reload">Recarregar LOD</button><button class="anatomy-tool3d" data-tool="reset">Resetar</button></div><div class="anatomy-quiz3d"><strong data-quiz-question>Ative um desafio para praticar.</strong><button class="anatomy-tool3d" data-tool="quiz">Novo desafio</button><div class="anatomy-status3d"></div></div></aside>`;
  root.addEventListener("click",onClick);context.host.append(root);
  try{await mount3D()}catch(error){console.error(error);root.querySelector(".asset-loader").hidden=true;root.querySelector(".three-host").innerHTML='<div class="fallback-heart"><div><div class="fallback-heart-shape"></div><p style="text-align:center;margin-top:2rem">Modo leve ativado.</p></div></div>';root.querySelector(".three-badge").textContent="MODO LEVE"}
 },
 async start(){engine?.start()},pause(){engine?.pause()},
 async destroy(){frameUnsub?.();graphicsUnsub?.();raycastManager?.destroy();cameraController?.destroy();loader3d?.destroy();if(modelRoot&&engine){engine.scene.remove(modelRoot);engine.disposeObject(modelRoot)}engine?.destroy();root?.removeEventListener("click",onClick);root?.remove();context=root=data=modelManifest=engine=loader3d=raycastManager=cameraController=modelRoot=null;currentUrl=null;quizTarget=null}
};
