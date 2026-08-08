export class AssetManager{
 constructor({graphics,events}){this.graphics=graphics;this.events=events;this.cache=new Map()}
 chooseVariant(asset){const p=this.graphics.activeProfile;return asset.variants?.[p]||asset.variants?.medium||asset.variants?.eco||asset.url||null}
 async loadJson(url){if(this.cache.has(url))return this.cache.get(url);const response=await fetch(url);if(!response.ok)throw new Error(`Asset indisponível: ${url}`);const data=await response.json();this.cache.set(url,data);return data}
 release(key){this.cache.delete(key)}
 clear(){this.cache.clear()}
}
