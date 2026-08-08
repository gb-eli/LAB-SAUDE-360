export class AsyncLoadGuard {
  constructor(){ this.generation=0; }
  begin(){ return ++this.generation; }
  isCurrent(token){ return token===this.generation; }
  invalidate(){ this.generation+=1; }

  disposeObject(root){
    root?.traverse?.(child=>{
      child.geometry?.dispose?.();
      const materials=Array.isArray(child.material)
        ? child.material
        : child.material ? [child.material] : [];
      for(const material of materials){
        for(const value of Object.values(material || {})){
          if(value?.isTexture)value.dispose?.();
        }
        material?.dispose?.();
      }
    });
  }
}
