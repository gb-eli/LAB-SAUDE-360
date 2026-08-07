
let context=null,root=null,unsubscribe=null,counter=0;
function status(msg){const el=root?.querySelector("[data-status]");if(el)el.textContent=msg}
function reset(){counter=0;const b=root?.querySelector('[data-action="counter"]');if(b)b.textContent="Contador: 0";status("Estado local reiniciado.")}
function click(e){const action=e.target.closest("[data-action]")?.dataset.action;if(!action)return;if(action==="event"){context.events.emit("demo:event",{at:Date.now()});status("Evento demo:event emitido.")}if(action==="counter"){counter++;e.target.textContent=`Contador: ${counter}`;status(`Estado local: ${counter}.`)}if(action==="reset")reset()}
export default{
 async mount(ctx){context=ctx;root=document.createElement("section");root.className="demo-module";root.innerHTML=`<div class="demo-stage"><div class="demo-orb" data-profile="${context.graphics.activeProfile}"></div></div><aside class="demo-panel"><span class="eyebrow">Sandbox M0</span><h2>Prova da arquitetura</h2><p>Este módulo recebe serviços do Core, reage a eventos e pode ser destruído sem deixar estado visual para trás.</p><ol><li>Troque o perfil gráfico.</li><li>Dispare um evento.</li><li>Incremente o estado local.</li><li>Volte e abra novamente.</li></ol><div class="demo-actions"><button class="button" data-action="event">Disparar evento</button><button class="button secondary" data-action="counter">Contador: 0</button><button class="button secondary" data-action="reset">Resetar</button></div><p class="meta" data-status style="margin-top:1rem">Módulo montado.</p></aside>`;root.addEventListener("click",click);context.host.append(root);unsubscribe=context.events.on("graphics:profileChanged",({active})=>{root?.querySelector(".demo-orb")?.setAttribute("data-profile",active);status(`Perfil atualizado para ${active}.`)})},
 async start(){context.events.emit("demo:started",{id:context.manifest.id})},
 pause(){status("Módulo pausado.")},
 reset,
 async destroy(){unsubscribe?.();unsubscribe=null;if(root){root.removeEventListener("click",click);root.remove()}root=null;context=null;counter=0}
};
