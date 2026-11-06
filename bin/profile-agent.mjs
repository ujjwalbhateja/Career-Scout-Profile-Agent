#!/usr/bin/env node
import {readFile} from 'node:fs/promises';
import {basename} from 'node:path';
import {createProfileAgent} from '../src/index.mjs';
const [command='help',...args]=process.argv.slice(2);
const help=`Career Scout Profile Agent (local CLI; no web server)

  npm run demo                         Offline synthetic workflow; no keys needed
  npm start -- status                  Configuration presence only
  npm start -- read                    Load owner-scoped profile and revision
  npm start -- current [version]        Current eligible profile / pinned version
  npm start -- questionnaires           Review rows, fingerprints and revision
  npm start -- upload FILE REVISION [resume|jd]
  npm start -- action PRIVATE_JSON_FILE Execute an explicit revision-bound action

Live operations require .env.local and PROFILE_OWNER_ID=profile-agent:<unique-id>.
Keep action files and outputs under ignored .local/. Outputs can contain personal data.
Read docs/API.md before approving or deleting anything. No automatic approvals.
`;
try{
  if(command==='help'||command==='--help'){console.log(help);}
  else if(command==='demo'){const {runDemo}=await import('../examples/demo.mjs');console.log(JSON.stringify(await runDemo(),null,2));}
  else{
    if(!['status','read','current','questionnaires','upload','action'].includes(command))throw new Error('Unknown command. Use help.');
    const owner=process.env.PROFILE_OWNER_ID;
    if(!owner?.startsWith('profile-agent:')||owner==='profile-agent:choose-a-unique-owner'||owner.length<=14)throw new Error('Set a unique PROFILE_OWNER_ID beginning profile-agent: in .env.local');
    const agent=createProfileAgent({env:process.env,owner});
    let result;
    if(command==='status')result={configurationOnly:true,...agent.status()};
    else if(command==='read')result=await agent.read();
    else if(command==='current')result=await agent.current(args[0]||'current');
    else if(command==='questionnaires')result=await agent.questionnaires();
    else if(command==='action'){
      if(!args[0])throw new Error('Supply a private JSON action file');
      result=await agent.execute(JSON.parse(await readFile(args[0],'utf8')));
    }else{
      const [filePath,rev,kind='resume']=args;
      if(!filePath||!/^\d+$/.test(rev||'')||!['resume','jd'].includes(kind))throw new Error('Use upload FILE REVISION [resume|jd]');
      const bytes=await readFile(filePath);
      result=await agent.upload(new File([bytes],basename(filePath)),{kind,selected:kind==='jd',revision:Number(rev)});
    }
    console.log(JSON.stringify(result,null,2));
  }
}catch(error){console.error(error.message);process.exitCode=1;}
