import type {Metadata} from 'next';
function contentText(node:any):string {if(typeof node==='string')return node;if(!node)return '';return Array.isArray(node)?node.map(contentText).join(' '):contentText(node.children);}
export function publicMetadata(title:string,description:any,path:string):Metadata{
 const summary=contentText(description).replace(/\s+/g,' ').trim().slice(0,160);
 return {title:title+' | POBlancer - POB Digital Experts',description:summary||undefined,alternates:{canonical:path},openGraph:{title,description:summary||undefined,url:path},robots:{index:false,follow:false}};
}
