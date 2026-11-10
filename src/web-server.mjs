import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {mkdirSync,writeFileSync,readFileSync,unlinkSync} from 'node:fs';
import {randomBytes,timingSafeEqual} from 'node:crypto';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {createProfileAgent} from './index.mjs';
import {ProfileError,LIMITS} from '../lib/profile/domain.mjs';

const webRoot=fileURLToPath(new URL('../web/',import.meta.url));
const localRoot=fileURLToPath(new URL('../.local/',import.meta.url));
const port=Number(process.env.PROFILE_WEB_PORT||5175);
const owner=process.env.PROFILE_OWNER_ID||'';
const configuredOwner=owner.startsWith('profile-agent:')&&owner.length>14&&owner!=='profile-agent:choose-a-unique-owner';
const accessKey=randomBytes(32).toString('hex');
const cookieName='profile_agent_session';
const origin=`http://127.0.0.1:${port}`;
const linkFile=join(localRoot,`web-access-${port}.txt`);
const files=new Map([
  ['/', ['index.html','text/html; charset=utf-8']],
  ['/app.js',['app.js','text/javascript; charset=utf-8']],
  ['/style.css',['style.css','text/css; charset=utf-8']],
  ['/career-workspace.css',['career-workspace.css','text/css; charset=utf-8']],
  ['/career-profile.css',['career-profile.css','text/css; charset=utf-8']]
]);
const privateHeaders={
  'Cache-Control':'private, no-store',
  'X-Content-Type-Options':'nosniff',
  'X-Frame-Options':'DENY',
  'Referrer-Policy':'no-referrer',
  'Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'"
};

function send(response,status,body,extra={}){
  response.writeHead(status,{...privateHeaders,...extra});response.end(body);
}
function json(response,status,data){send(response,status,JSON.stringify(data),{'Content-Type':'application/json; charset=utf-8'});}
function hasSession(request){
  const value=(request.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(cookieName+'='))?.slice(cookieName.length+1)||'';
  const a=Buffer.from(value),b=Buffer.from(accessKey);
  return a.length===b.length&&timingSafeEqual(a,b);
}
function profile(){
  if(!configuredOwner)throw new ProfileError('Set a unique PROFILE_OWNER_ID beginning profile-agent: in .env.local, then restart the website.',503);
  return createProfileAgent({env:process.env,owner});
}
async function bodyBytes(request,max){
  const chunks=[];let size=0;
  for await(const chunk of request){size+=chunk.length;if(size>max)throw new ProfileError('Profile request is too large.',413);chunks.push(chunk);}
  return Buffer.concat(chunks);
}
async function handleApi(request,response,url){
  if(request.method==='GET'){
    if(url.searchParams.has('status'))return json(response,200,{ownerConfigured:configuredOwner,providers:configuredOwner?profile().status():{supabase:false,pinecone:false,model:false}});
    const agent=profile();
    if(url.searchParams.has('questionnaires'))return json(response,200,await agent.questionnaires());
    if(url.searchParams.has('current'))return json(response,200,await agent.current());
    if(url.searchParams.has('download')){
      const original=await agent.original(url.searchParams.get('download'));
      const filename=String(original.filename).replace(/[^\w.\- ]/g,'_');
      return send(response,200,Buffer.from(await original.response.arrayBuffer()),{'Content-Type':original.mime,'Content-Disposition':`attachment; filename="${filename}"`});
    }
    return json(response,200,await agent.read());
  }
  if(request.method!=='POST')return send(response,405,'Method not allowed',{'Allow':'GET, POST'});
  if(request.headers.origin!==origin)throw new ProfileError('Use the Profile form on this site.',403);
  const agent=profile(),contentType=request.headers['content-type']||'';
  const multipart=contentType.startsWith('multipart/form-data');
  if(!multipart&&!contentType.startsWith('application/json'))throw new ProfileError('Use JSON or a document upload.',415);
  const max=multipart?LIMITS.fileBytes+20000:1200000;
  if(Number(request.headers['content-length']||0)>max)throw new ProfileError('Profile request is too large.',413);
  const bytes=await bodyBytes(request,max);
  if(multipart){
    const form=await new Response(bytes,{headers:{'Content-Type':contentType}}).formData();
    const file=form.get('file');if(!(file instanceof File))throw new ProfileError('Choose a document.');
    const kind=form.get('kind');if(!['resume','jd'].includes(kind))throw new ProfileError('Choose resume or JD.');
    const revision=Number(form.get('revision'));
    if(!Number.isSafeInteger(revision)||revision<0)throw new ProfileError('Load the current profile revision first.',400);
    return json(response,200,await agent.upload(file,{kind,title:String(form.get('title')||file.name),selected:kind==='jd'&&form.get('selected')==='true',revision}));
  }
  let body;try{body=JSON.parse(bytes.toString('utf8'));}catch{throw new ProfileError('Use valid JSON.',400);}
  if(!body||typeof body!=='object'||Array.isArray(body))throw new ProfileError('Invalid request.',400);
  return json(response,200,await agent.execute(body));
}
const server=createServer(async(request,response)=>{
  try{
    if(request.headers.host!==`127.0.0.1:${port}`)return send(response,403,'Local access only');
    const url=new URL(request.url,origin);
    if(url.pathname==='/'&&url.searchParams.get('access')===accessKey){
      return send(response,302,'',{'Set-Cookie':`${cookieName}=${accessKey}; HttpOnly; SameSite=Strict; Path=/`,Location:'/'});
    }
    if(!hasSession(request))return send(response,403,'Open the browser link printed by the Profile Agent launcher.');
    if(url.pathname==='/api/profile')return await handleApi(request,response,url);
    const entry=files.get(url.pathname);
    if(!entry||request.method!=='GET')return send(response,404,'Not found');
    const [name,type]=entry;
    return send(response,200,await readFile(join(webRoot,name)),{'Content-Type':type});
  }catch(error){
    const status=error instanceof ProfileError?error.status||400:500;
    json(response,status,{error:error instanceof ProfileError?error.message:'Profile operation failed. Your saved approvals have not been replaced.'});
  }
});
server.listen(port,'127.0.0.1',()=>{
  const link=`${origin}/?access=${accessKey}`;
  mkdirSync(localRoot,{recursive:true});
  writeFileSync(linkFile,link+'\n',{mode:0o600});
  process.stdout.write(`Career Scout Profile Agent website: ${link}\n`);
  if(!process.argv.includes('--no-browser')&&process.platform==='win32')spawn('rundll32.exe',['url.dll,FileProtocolHandler',link],{windowsHide:true,stdio:'ignore'}).unref();
});
process.on('exit',()=>{try{if(readFileSync(linkFile,'utf8').trim().endsWith(`access=${accessKey}`))unlinkSync(linkFile);}catch{}});
