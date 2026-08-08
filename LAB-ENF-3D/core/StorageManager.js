export class StorageManager{
  constructor(namespace="lab-enfermagem"){this.namespace=namespace}
  key(name){return `${this.namespace}:${name}`}
  get(name,fallback=null){try{const raw=localStorage.getItem(this.key(name));return raw===null?fallback:JSON.parse(raw)}catch{return fallback}}
  set(name,value){try{localStorage.setItem(this.key(name),JSON.stringify(value));return true}catch{return false}}
  remove(name){localStorage.removeItem(this.key(name))}
}
