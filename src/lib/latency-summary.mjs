const bounds=[25,50,100,250,500,1000,2000,5000];
// Fixed metric names and bounded storage; no paths, credentials or account data.
export function createLatencySummary(names){
 const metrics=new Map(names.map(name=>[name,{count:0,sum:0,max:0,counts:Array(bounds.length+1).fill(0)}]));
 return {
  add(name,value){const metric=metrics.get(name);if(!metric||typeof value!=='number'||!Number.isFinite(value)||value<0||value>1e12)return false;
   metric.count++;metric.sum+=value;metric.max=Math.max(metric.max,value);const index=bounds.findIndex(bound=>value<=bound);metric.counts[index<0?bounds.length:index]++;return true;
  },
  snapshot(){return Object.fromEntries([...metrics].map(([name,value])=>[name,{...value,counts:[...value.counts],bounds:[...bounds]}]));}
 };
}
