// Keep immutable assets available to tabs opened before a local preview rebuild.
import {cpSync,existsSync,mkdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const current='.next-production/static', retained='.preview-static';
mkdirSync(retained,{recursive:true});
if(existsSync(current))cpSync(current,retained,{recursive:true});
const build=spawnSync(process.execPath,['node_modules/next/dist/bin/next','build','--webpack'],{stdio:'inherit',env:process.env});
if(build.status===0){
 cpSync(retained,current,{recursive:true,force:false,errorOnExist:false});
 cpSync(current,retained,{recursive:true});
}
process.exit(build.status??1);
