import {readdir,mkdir,copyFile,cp,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
const source=path.resolve(process.argv[2]||'../poblancer-workspace'),target=path.resolve('backend/poblancer-workspace');
await mkdir(target,{recursive:true});const manifest={};
for(const file of await readdir(source))if(file.endsWith('.php')&&file!=='repair-local-checkout.php'){
 await copyFile(path.join(source,file),path.join(target,file));manifest[file]=createHash('sha256').update(await readFile(path.join(target,file))).digest('hex');
}
await cp(path.join(source,'assets'),path.join(target,'assets'),{recursive:true});
await writeFile('backend/workspace-source-manifest.json',JSON.stringify(manifest,null,2)+'\n');
console.log('Backend source packaged without database dumps, saved sessions or credentials.');
