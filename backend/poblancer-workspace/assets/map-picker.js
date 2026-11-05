let loading;
export async function openMap(container,home,value,change){
 if(!loading)loading=new Promise((resolve,reject)=>{
  const base=home+'wp-content/themes/freeio/';const css=document.createElement('link');css.rel='stylesheet';css.href=base+'css/leaflet.css';document.head.append(css);
  const script=document.createElement('script');script.src=base+'js/leaflet.js';script.onload=resolve;script.onerror=()=>{loading=null;reject(new Error('The map could not load. You can still enter coordinates.'));};document.head.append(script);
 });await loading;
 const L=window.L,lat=Number(value?.latitude),lng=Number(value?.longitude),valid=Number.isFinite(lat)&&Number.isFinite(lng)&&lat>=-90&&lat<=90&&lng>=-180&&lng<=180&&value?.latitude!==''&&value?.latitude!=null;
 container.hidden=false;container.style.height='300px';const center=valid?[lat,lng]:[9.082,8.6753];const map=L.map(container,{scrollWheelZoom:false}).setView(center,valid?12:5);
 L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(map);
 const marker=L.marker(center,{draggable:true}).addTo(map);const update=point=>{marker.setLatLng(point);change({latitude:point.lat.toFixed(6),longitude:point.lng.toFixed(6)});};map.on('click',e=>update(e.latlng));marker.on('dragend',()=>update(marker.getLatLng()));
 const observer=new MutationObserver(()=>{if(!container.isConnected){map.remove();observer.disconnect();}});observer.observe(document.body,{childList:true,subtree:true});map.invalidateSize();
}
