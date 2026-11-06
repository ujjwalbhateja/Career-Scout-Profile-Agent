import {readFile} from 'node:fs/promises';
import {ProfileService,approvedProfileLoader} from '../lib/profile/service.mjs';
import {dispatchProfileOperation} from '../lib/workflow/profile-intake.mjs';
import {buildRoleQuestionnaires} from '../lib/profile/builder-expansion.mjs';
import {providerStatus} from '../lib/profile/providers.mjs';

const promptPaths={fact:'fact',builder:'profile_builder',profile:'profile',memory:'memory'};
export async function readPrompt(name){
  if(!Object.hasOwn(promptPaths,name))throw new Error('Unknown Profile-family prompt');
  return readFile(new URL('../backend/src/career_scout/agents/'+promptPaths[name]+'/prompt.md',import.meta.url),'utf8');
}
const actions=new Set(['paste','importJD','selectJD','prepare','analyze','extractSection1','buildProfiles','decideFacts','reviewBuilder','correctFact','resolveConflict','answer','analyzeAnswer','retrieve','sync','removeDocument','cleanup','preferences','export','deleteProfile']);
const environmentKeys=['SUPABASE_URL','SUPABASE_SECRET_KEY','SUPABASE_SERVICE_ROLE_KEY','GEMINI_API_KEY','PINECONE_API_KEY','PINECONE_INDEX_HOST','PROFILE_SEMANTIC_SEARCH'];

// This is a trusted server/local-library boundary, not an HTTP authentication layer.
export function createProfileAgent({env={},owner}={}){
  if(typeof owner!=='string'||!owner.trim()||owner.length>200)throw new Error('Supply a trusted owner identity');
  const config=Object.fromEntries(environmentKeys.filter(key=>typeof env[key]==='string').map(key=>[key,env[key]]));
  const service=new ProfileService(config,owner,{factPrompt:()=>readPrompt('fact'),builderPrompt:()=>readPrompt('builder')});
  return {
    status:()=>providerStatus(config),
    read:()=>service.read(),
    current:(version='current')=>approvedProfileLoader(service)({version}),
    questionnaires:async()=>{const record=await service.memory.load();return {revision:record.revision,roles:buildRoleQuestionnaires(record.state)};},
    execute:async body=>{
      if(!body||Array.isArray(body)||!actions.has(body.action))throw new Error('Unsupported Profile action');
      if(['owner','owner_id','namespace'].some(key=>key in body))throw new Error('Owner identity cannot be supplied in an action');
      return dispatchProfileOperation(service,{body});
    },
    upload:(file,{kind='resume',title=file.name,selected=false,revision}={})=>dispatchProfileOperation(service,{file,body:{kind,title,selected,revision}})
  };
}
