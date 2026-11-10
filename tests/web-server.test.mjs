import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import net from 'node:net';
import {readFile} from 'node:fs/promises';

async function freePort(){
  const server=net.createServer();
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const port=server.address().port;
  await new Promise(resolve=>server.close(resolve));
  return port;
}

test('local website requires a session, blocks cross-origin writes, and serves setup without credentials',async()=>{
  const port=await freePort(),base=`http://127.0.0.1:${port}`;
  const child=spawn(process.execPath,['src/web-server.mjs','--no-browser'],{
    cwd:new URL('../',import.meta.url),
    env:{...process.env,PROFILE_WEB_PORT:String(port),PROFILE_OWNER_ID:'',SUPABASE_URL:'',SUPABASE_SECRET_KEY:'',SUPABASE_SERVICE_ROLE_KEY:''},
    stdio:['ignore','pipe','pipe']
  });
  try{
    const loginURL=await Promise.race([
      new Promise((resolve,reject)=>{let output='';child.stdout.on('data',chunk=>{output+=chunk;if(output.includes('\n')){const match=output.match(/http:\/\/127\.0\.0\.1:\d+\/\?access=[a-f\d]+/);if(match)resolve(match[0]);}});child.on('exit',code=>reject(new Error(`Server exited: ${code}`)));}),
      new Promise((_,reject)=>setTimeout(()=>reject(new Error('Website did not start')),10000))
    ]);
    assert.equal((await fetch(base)).status,403);
    assert.equal((await readFile(new URL(`../.local/web-access-${port}.txt`,import.meta.url),'utf8')).trim(),loginURL);
    const login=await fetch(loginURL,{redirect:'manual'});
    assert.equal(login.status,302);
    assert.equal(login.headers.get('location'),'/');
    const cookie=login.headers.get('set-cookie').split(';')[0],headers={Cookie:cookie};
    const page=await fetch(base,{headers});assert.equal(page.status,200);
    assert.match(await page.text(),/Career Scout Profile Agent/);
    assert.match(page.headers.get('content-security-policy'),/default-src 'none'/);
    assert.equal((await fetch(base+'/app.js',{headers})).status,200);
    const status=await fetch(base+'/api/profile?status=1',{headers});
    assert.equal(status.status,200);
    assert.equal((await status.json()).ownerConfigured,false);
    const crossSite=await fetch(base+'/api/profile',{method:'POST',headers:{...headers,Origin:'http://other.invalid','Content-Type':'application/json'},body:'{}'});
    assert.equal(crossSite.status,403);
    assert.equal((await fetch(base+'/api/profile',{headers})).status,503);
  }finally{child.kill();}
});
