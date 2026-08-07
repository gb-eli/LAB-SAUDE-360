
import{EventBus}from"../core/EventBus.js";
import{StorageManager}from"../core/StorageManager.js";
import{ModuleManager}from"../core/ModuleManager.js";
import{GraphicsManager}from"../services/GraphicsManager.js";
import{PerformanceManager}from"../services/PerformanceManager.js";
const $=s=>document.querySelector(s),events=new EventBus(),storage=new StorageManager(),graphics=new GraphicsManager({events,storage}),perf=new PerformanceManager({events,graphics});
const dashboard=$("#dashboard-view"),moduleView=$("#module-view"),grid=$("#module-grid"),host=$("#module-host"),profile=$("#graphics-profile");
const manager=new ModuleManager({events,host,services:{graphics,storage,performance:perf}});
function toast(msg){const n=document.createElement("div");n.className="toast";n.textContent=msg;$("#toast-region").append(n);setTimeout(()=>n.remove(),2600)}
function showDash(){dashboard.classList.add("active");moduleView.classList.remove("active")}function showModule(){dashboard.classList.remove("active");moduleView.classList.add("active")}
function renderCatalog(items){grid.replaceChildren();$("#module-count").textContent=`${items.length} ${items.length===1?"módulo":"módulos"}`;for(const x of items){const c=document.createElement("article");c.className="module-card";c.innerHTML=`<span class="eyebrow">${x.category}</span><h3>${x.name}</h3><p>${x.description}</p><div class="module-card-footer"><span class="meta">v${x.version} · ${x.experience}</span><button class="button" data-open="${x.id}">Abrir</button></div>`;grid.append(c)}}
async function openModule(id){const m=manager.getModule(id);if(!m)return;$("#module-title").textContent=m.name;$("#module-category").textContent=m.category;$("#module-status").textContent="carregando";showModule();try{await manager.open(id);$("#module-status").textContent="ativo"}catch(error){console.error(error);$("#module-status").textContent="erro";host.innerHTML=`<div style="padding:1.2rem"><span class="eyebrow">Falha isolada</span><h2>O módulo não pôde ser iniciado.</h2><p>${error.message}</p></div>`}}
grid.addEventListener("click",e=>{const id=e.target.closest("[data-open]")?.dataset.open;if(id)openModule(id)});
$("#back-button").addEventListener("click",async()=>{await manager.close();showDash()});
profile.value=graphics.requestedProfile;profile.addEventListener("change",()=>graphics.setProfile(profile.value));
const panel=$("#diagnostics-panel");$("#diagnostics-toggle").addEventListener("click",()=>{panel.classList.add("open");panel.setAttribute("aria-hidden","false")});$("#diagnostics-close").addEventListener("click",()=>{panel.classList.remove("open");panel.setAttribute("aria-hidden","true")});
events.on("performance:update",({fps,frameMs})=>{$("#metric-fps").textContent=fps;$("#metric-frame").textContent=`${frameMs} ms`});
events.on("graphics:profileChanged",({active,adaptive})=>{$("#metric-profile").textContent=active;if(adaptive)toast(`Qualidade ajustada para ${active}.`)});
events.on("module:started",m=>$("#metric-module").textContent=m.name);events.on("module:closed",()=>$("#metric-module").textContent="—");events.on("demo:event",()=>toast("Evento recebido pelo Core."));
async function main(){$("#metric-profile").textContent=graphics.activeProfile;perf.start();try{renderCatalog(await manager.loadCatalog())}catch(error){console.error(error);grid.innerHTML=`<article class="module-card"><span class="eyebrow">Erro</span><h3>Catálogo indisponível</h3><p>Teste por um servidor HTTP, não por file://.</p></article>`}}main();
