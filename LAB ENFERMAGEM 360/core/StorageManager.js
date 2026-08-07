
export class StorageManager{
  constructor(namespace="lab-enfermagem"){this.namespace=namespace}
  key(k){return `${this.namespace}:${k}`}
  get(k,fallback=null){try{const v=localStorage.getItem(this.key(k));return v===null?fallback:JSON.parse(v)}catch{return fallback}}
  set(k,v){try{localStorage.setItem(this.key(k),JSON.stringify(v));return true}catch{return false}}
  remove(k){localStorage.removeItem(this.key(k))}
}
