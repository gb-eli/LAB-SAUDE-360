let context=null,root=null,unsubscribe=null,counter=0;
function status(msg){const el=root?.querySelector("[data-status]");if(el)el.textContent=msg}
function reset(){counter=0;const b=root?.querySelector('[data-action="counter"]');if(b)b.textContent="Contador: 0";status("Estado reiniciado.")}
function click(e){const a=e.target.closest("[data-action]")?.dataset.action;if(!a)return;if(a==="event"){context.events.emit("demo:event",{at:Date.now()});status("Evento emitido.")}if(a==="counter"){counter++;e.target.textContent=`Contador: ${counter}`;status(`Estado local: ${counter}`)}if(a==="reset")reset()}
export default{
 async mount(ctx){context=ctx;root=document.createElement("section");root.className="demo-module";root.innerHTML=`<div class="demo-stage"><div class="demo-orb" data-profile="${context.graphics.activeProfile}"></div></div><aside class="demo-panel"><span class="eyebrow">Sandbox</span><h2>Prova modular</h2><p>Este módulo usa serviços do Core e pode ser removido sem afetar a plataforma.</p><ol><li>Troque o perfil gráfico.</li><li>Dispare um evento.</li><li>Altere o estado local.</li><li>Volte e abra novamente.</li></ol><div class="demo-actions"><button class="button" data-action="event">Disparar evento</button><button class="button secondary" data-action="counter">Contador: 0</button><button class="button secondary" data-action="reset">Resetar</button></div><p class="meta" data-status style="margin-top:1rem">Módulo montado.</p></aside>`;root.addEventListener("click",click);context.host.append(root);unsubscribe=context.events.on("graphics:profileChanged",({active})=>{root?.querySelector(".demo-orb")?.setAttribute("data-profile",active);status(`Perfil: ${active}`)})},
 async start(){},
 pause(){},
 reset,
 async destroy(){unsubscribe?.();if(root){root.removeEventListener("click",click);root.remove()}context=null;root=null;unsubscribe=null;counter=0}
};
