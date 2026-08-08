let loadGuard=null;
let context=null,root=null,data=null,patientManifest=null,preset=null;
let engine=null,loader=null,raycast=null,cameras=null,patientRoot=null,THREE=null,graphicsUnsub=null;
let raf=0,phase=0,canvases=[],visibilityHandler=null,reducedMotionQuery=null;

const safe=(s="")=>s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));

const siteInfo={
 "bp_site_left_arm":{title:"Local de referência — braço",text:"Ponto visual usado para relacionar o cenário à aferição de pressão arterial em contexto educacional."},
 "pulse_site_right_wrist":{title:"Local de referência — pulso",text:"Ponto visual para discutir localização de pulso em atividade orientada."},
 "respiration_site_chest":{title:"Observação respiratória",text:"Ponto visual para observar a região torácica no cenário didático."},
 "spo2_site_right_hand":{title:"Local de referência — mão",text:"Ponto visual associado à oximetria neste ambiente de simulação."}
};

function fitCanvas(canvas){const rect=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,context.graphics.settings.maxPixelRatio||1);const w=Math.max(1,Math.floor(rect.width*dpr)),h=Math.max(1,Math.floor(rect.height*dpr));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}return{w,h}}

function drawWave(canvas,type,color){
 const {w,h}=fitCanvas(canvas),ctx=canvas.getContext("2d");ctx.clearRect(0,0,w,h);ctx.strokeStyle="rgba(255,255,255,.035)";ctx.lineWidth=1;
 for(let x=0;x<w;x+=34){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke()}for(let y=0;y<h;y+=26){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}
 ctx.strokeStyle=color;ctx.lineWidth=Math.max(1.5,w/700);ctx.beginPath();const speed=preset?.rate||1,base=h*.52;
 for(let x=0;x<w;x++){const t=((x/w)*8+phase*speed)%1;let y=base;if(type==="ecg"){let v=0;if(t>.10&&t<.14)v=-.10;else if(t>=.14&&t<.17)v=.55;else if(t>=.17&&t<.20)v=-.25;else if(t>=.34&&t<.48)v=.08*Math.sin((t-.34)/.14*Math.PI);y=base-v*h}else if(type==="spo"){y=base-Math.sin((x/w*10+phase*8)*Math.PI)*h*.12-Math.sin((x/w*20+phase*8)*Math.PI)*h*.025}else y=base-Math.sin((x/w*4+phase*2)*Math.PI)*h*.18;if(x===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)}ctx.stroke()
}
function render(){if(!root||!canvases.length)return;drawWave(canvases[0],"ecg","#69db7c");drawWave(canvases[1],"spo","#74c0fc");drawWave(canvases[2],"resp","#ffd43b");phase+=.008;if(!document.hidden&&!reducedMotionQuery?.matches)raf=requestAnimationFrame(render)}

function applyPreset(id){
 preset=data.presets.find(x=>x.id===id)||data.presets[0];
 root.querySelector("[data-hr]").textContent=preset.hr;root.querySelector("[data-spo2]").textContent=preset.spo2;root.querySelector("[data-bp]").textContent=`${preset.sys}/${preset.dia}`;root.querySelector("[data-temp]").textContent=preset.temp.toFixed(1).replace(".",",");
 root.querySelector("[data-scenario]").textContent=`${preset.name} · ${preset.label}`;
 root.querySelector(".vitals3d-info").innerHTML=`<span class="eyebrow">Cenário fictício</span><h3>${safe(preset.name)}</h3><p>${safe(preset.note)}</p>`;
 root.querySelectorAll("[data-preset]").forEach(b=>b.classList.toggle("active",b.dataset.preset===id));
 context.progress.saveModuleProgress("sinais-vitais",{lastPreset:id});
}

function selectSite(id){const info=siteInfo[id];if(!info)return;root.querySelector(".vitals3d-info").innerHTML=`<span class="eyebrow">Paciente 3D</span><h3>${safe(info.title)}</h3><p>${safe(info.text)}</p>`}

async function loadPatient(){
 const url=context.assets.chooseVariant(patientManifest);if(!loadGuard){const {AsyncLoadGuard}=await import("../../engines/AsyncLoadGuard.js");loadGuard=new AsyncLoadGuard();}const loadToken=loadGuard.begin();const gltf=await loader.load(url);if(!loadGuard.isCurrent(loadToken)){loadGuard.disposeObject(gltf.scene);return;}
 if(patientRoot){engine.scene.remove(patientRoot);engine.disposeObject(patientRoot)}
 patientRoot=gltf.scene;patientRoot.traverse(child=>{if(!child.isMesh)return;child.userData.structureId=child.name;const site=Boolean(siteInfo[child.name]);engine.replaceMaterial(child,new THREE.MeshPhysicalMaterial({color:site?(child.name.includes("bp_")?0x74c0fc:child.name.includes("spo2")?0xffa94d:child.name.includes("respiration")?0xffd43b:0x63e6be):child.name==="torso"?0x3f7299:child.name.includes("leg")?0x374650:0xbe8268,roughness:site ? 0.28 : 0.65,emissive:site?0x07131f:0x000000}))});
 const box=new THREE.Box3().setFromObject(patientRoot),center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());patientRoot.position.sub(center);patientRoot.position.z+=.8;patientRoot.scale.setScalar(4.8/Math.max(size.x,size.y,size.z));engine.scene.add(patientRoot);raycast.setTarget(patientRoot)
}

async function mount3D(){
 const imports=await Promise.all([import("../../engines/ThreeEngine.js"),import("../../engines/CameraController.js"),import("../../engines/GLBAssetLoader.js"),import("../../engines/RaycastManager.js")]);
 const {ThreeEngine,THREE:ThreeNS}=imports[0];THREE=ThreeNS;const {CameraController}=imports[1],{GLBAssetLoader}=imports[2],{RaycastManager}=imports[3];
 engine=new ThreeEngine({host:root.querySelector(".three-host"),graphics:context.graphics,events:context.events,background:0x06131f,camera:{fov:36,near:.05,far:80}});engine.addDefaultLights({ambient:1.4,key:2.8,fill:1.4,rim:1.3});engine.focus([0,-7.2,1],[0,0,.8]);
 loader=new GLBAssetLoader({events:context.events});raycast=new RaycastManager({engine,target:null,selectable:id=>Boolean(siteInfo[id]),onSelect:({id})=>selectSite(id)});cameras=new CameraController(engine);cameras.register("front",{position:[0,-7.2,1],target:[0,0,.8]});cameras.register("side",{position:[6.5,0,1],target:[0,0,.8]});
 await loadPatient();graphicsUnsub=context.events.on("graphics:profileChanged",async()=>await loadPatient());engine.start()
}

function onClick(e){
 const presetBtn=e.target.closest("[data-preset]");if(presetBtn){applyPreset(presetBtn.dataset.preset);return}
 const tool=e.target.closest("[data-tool]");if(!tool)return;if(tool.dataset.tool==="front")cameras?.go("front");if(tool.dataset.tool==="side")cameras?.go("side")
}

export default{
 async mount(ctx){context=ctx;[data,patientManifest]=await Promise.all([context.assets.loadJson("./modules/sinais-vitais/data/presets.json"),context.assets.loadJson("./modules/sinais-vitais/data/patient-model.json")]);root=document.createElement("section");root.className="vitals3d-lab";root.innerHTML=`<div class="vitals3d-main"><div class="patient3d-stage"><div class="three-host"></div><div class="patient3d-badge">PACIENTE G3 · SINAIS VITAIS</div><div class="site-hint">Clique nos pontos de referência</div></div><div class="monitor-shell"><div class="monitor-grid"><div class="wave-area"><div class="wave-row"><span class="wave-label hr">ECG</span><canvas class="wave-canvas"></canvas></div><div class="wave-row"><span class="wave-label spo">PLETH</span><canvas class="wave-canvas"></canvas></div><div class="wave-row"><span class="wave-label resp">RESP</span><canvas class="wave-canvas"></canvas></div></div><div class="readings"><div class="reading hr"><span>FC</span><strong data-hr>—</strong></div><div class="reading spo"><span>SpO₂</span><strong><span data-spo2>—</span><small>%</small></strong></div><div class="reading bp"><span>PA</span><strong data-bp>—</strong></div><div class="reading temp"><span>Temp.</span><strong><span data-temp>—</span><small>°C</small></strong></div></div></div></div></div><aside class="vitals3d-panel"><span class="eyebrow">Sinais vitais integrados · G3</span><h2>Paciente + Monitor</h2><p>Paciente fictício 3D conectado aos cenários simulados do monitor.</p><div class="vitals3d-info"><span class="eyebrow">Simulação</span><h3>Selecione um cenário</h3><p>Use os cenários para comparar leituras e os pontos 3D para reconhecer locais de referência.</p></div><div class="vital-controls">${data.presets.map(p=>`<button class="vital-btn" data-preset="${p.id}">${p.name}</button>`).join("")}<button class="vital-btn" data-tool="front">Frontal</button><button class="vital-btn" data-tool="side">Lateral</button></div><div class="vital-note"><strong data-scenario>—</strong><br>Dados totalmente fictícios. O módulo não é ferramenta clínica nem diagnóstica.</div></aside>`;root.addEventListener("click",onClick);context.host.append(root);canvases=[...root.querySelectorAll("canvas")];reducedMotionQuery=window.matchMedia?.("(prefers-reduced-motion: reduce)")||null;visibilityHandler=()=>{cancelAnimationFrame(raf);if(!document.hidden&&!reducedMotionQuery?.matches)render();else render()};document.addEventListener("visibilitychange",visibilityHandler);const prev=context.progress.getModuleProgress("sinais-vitais").lastPreset;applyPreset(prev||"stable");try{await mount3D()}catch(error){console.error(error);root.querySelector(".patient3d-stage").innerHTML='<div style="display:grid;place-items:center;height:100%;color:#9db1c2">Modo leve: paciente 3D indisponível.</div>'}},
 async start(){cancelAnimationFrame(raf);render();engine?.start()},pause(){cancelAnimationFrame(raf);engine?.pause()},
 async destroy(){loadGuard?.invalidate();cancelAnimationFrame(raf);if(visibilityHandler)document.removeEventListener("visibilitychange",visibilityHandler);graphicsUnsub?.();raycast?.destroy();cameras?.destroy();loader?.destroy();if(patientRoot&&engine){engine.scene.remove(patientRoot);engine.disposeObject(patientRoot)}engine?.destroy();root?.removeEventListener("click",onClick);root?.remove();context=root=data=patientManifest=preset=engine=loader=raycast=cameras=patientRoot=THREE=null;canvases=[];visibilityHandler=null;reducedMotionQuery=null}
};
