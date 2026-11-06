import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),manifest=JSON.parse(readFileSync(new URL('UPSTREAM.json',root),'utf8'));
for(const file of manifest.files){
  const hash=createHash('sha256').update(readFileSync(new URL(file.path,root))).digest('hex');
  if(hash!==file.sha256)throw new Error('Upstream file differs: '+file.path);
}
console.log(`${manifest.files.length} upstream files match ${manifest.commit}.`);
