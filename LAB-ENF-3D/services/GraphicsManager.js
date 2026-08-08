const PROFILES={
 eco:{label:"Econômico",renderScale:.65,maxPixelRatio:1,shadows:false,lod:"low"},
 medium:{label:"Médio",renderScale:.85,maxPixelRatio:1.25,shadows:true,lod:"medium"},
 high:{label:"Alto",renderScale:1,maxPixelRatio:1.5,shadows:true,lod:"high"},
 ultra:{label:"Ultra",renderScale:1.1,maxPixelRatio:2,shadows:true,lod:"ultra"}
};
export class GraphicsManager{
 constructor({events,storage,defaultProfile="auto"}){this.events=events;this.storage=storage;this.requestedProfile=storage.get("graphicsProfile",defaultProfile);this.activeProfile=this.resolve(this.requestedProfile)}
 resolve(profile){if(profile!=="auto"&&PROFILES[profile])return profile;const cores=navigator.hardwareConcurrency||4,memory=navigator.deviceMemory||4,small=Math.min(screen.width,screen.height)<700;if(memory<=2||cores<=2)return"eco";if(memory<=4||small)return"medium";if(cores>=8&&memory>=8)return"high";return"medium"}
 setProfile(profile,{adaptive=false}={}){if(profile!=="auto"&&!PROFILES[profile])return;this.requestedProfile=profile;this.activeProfile=this.resolve(profile);if(!adaptive)this.storage.set("graphicsProfile",profile);this.events.emit("graphics:profileChanged",{requested:this.requestedProfile,active:this.activeProfile,settings:this.settings,adaptive})}
 lowerProfile(){const order=["eco","medium","high","ultra"],index=order.indexOf(this.activeProfile);if(index<=0)return false;this.activeProfile=order[index-1];this.events.emit("graphics:profileChanged",{requested:this.requestedProfile,active:this.activeProfile,settings:this.settings,adaptive:true});return true}
 get settings(){return PROFILES[this.activeProfile]}
}
