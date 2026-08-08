export class PerformanceManager{
 constructor({events,graphics}){this.events=events;this.graphics=graphics;this.running=false;this.last=0;this.samples=[];this.lowSince=null;this.cooldownUntil=0}
 start(){if(this.running)return;this.running=true;this.last=performance.now();requestAnimationFrame(this.tick)}
 stop(){this.running=false}
 tick=(now)=>{if(!this.running)return;const delta=Math.max(1,now-this.last);this.last=now;this.samples.push(1000/delta);if(this.samples.length>45)this.samples.shift();const avg=this.samples.reduce((a,b)=>a+b,0)/this.samples.length;this.events.emit("performance:update",{fps:Math.round(avg),frameMs:Number((1000/Math.max(avg,1)).toFixed(1))});this.guard(now,avg);requestAnimationFrame(this.tick)}
 guard(now,avg){if(this.graphics.requestedProfile!=="auto"){this.lowSince=null;return}if(now<this.cooldownUntil)return;if(avg<28){this.lowSince??=now;if(now-this.lowSince>4500){const changed=this.graphics.lowerProfile();this.lowSince=null;if(changed)this.cooldownUntil=now+10000}}else this.lowSince=null}
}
