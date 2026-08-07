
import{LAB_API_VERSION}from"../app/version.js";
export class ModuleManager{
 constructor({events,services,host}){this.events=events;this.services=services;this.host=host;this.catalog=[];this.active=null}
 async loadCatalog(url="./data/modules.json"){const r=await fetch(url,{cache:"no-cache"});if(!r.ok)throw new Error(`Falha no catálogo (${r.status})`);this.catalog=await r.json();this.events.emit("catalog:loaded",this.catalog);return this.catalog}
 getModule(id){return this.catalog.find(x=>x.id===id)}
 async open(id){const manifest=this.getModule(id);if(!manifest)throw new Error(`Módulo ${id} não encontrado`);if(manifest.apiVersion!==LAB_API_VERSION)throw new Error("Módulo incompatível com a API interna");await this.close();this.events.emit("module:loading",manifest);const imported=await import(new URL(manifest.entry,window.location.href).href);const instance=imported.default;this.host.replaceChildren();await instance.mount({manifest,host:this.host,events:this.events,...this.services});this.active={manifest,instance};await instance.start?.();this.events.emit("module:started",manifest);return manifest}
 async close(){if(!this.active)return;const current=this.active;try{current.instance.pause?.();await current.instance.destroy?.()}finally{this.host.replaceChildren();this.active=null;this.events.emit("module:closed",current.manifest)}}
}
