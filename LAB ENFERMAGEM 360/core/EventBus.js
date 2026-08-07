
export class EventBus{
  #listeners=new Map();
  on(event,callback){if(!this.#listeners.has(event))this.#listeners.set(event,new Set());this.#listeners.get(event).add(callback);return()=>this.off(event,callback)}
  off(event,callback){this.#listeners.get(event)?.delete(callback)}
  emit(event,payload){this.#listeners.get(event)?.forEach(cb=>{try{cb(payload)}catch(error){console.error(`[EventBus] ${event}`,error)}})}
  clear(event){event?this.#listeners.delete(event):this.#listeners.clear()}
}
