import {emptyProfile,addDocument,proposeFacts,decideFacts,addJDAnalysis,buildProfiles} from '../lib/profile/domain.mjs';
import {ProfileService,approvedProfileLoader} from '../lib/profile/service.mjs';
import {buildRoleQuestionnaires} from '../lib/profile/builder-expansion.mjs';
import {dispatchProfileOperation} from '../lib/workflow/profile-intake.mjs';

// Explicitly synthetic fixtures. This is not live Fact/Builder model execution.
export async function runDemo(){
  const owner='synthetic-demo-owner',state=emptyProfile();
  addDocument(state,{id:'resume',kind:'resume',title:'Synthetic resume',hash:'demo-resume',segments:[{id:'resume.1',text:'Listed skills: Excel. Prepared monthly client reports.'}]});
  await proposeFacts(state,[{category:'skills',field:'tools_technologies',scope:'Listed skills',statement:'Excel',evidence:[{documentId:'resume',segmentId:'resume.1',quote:'Excel'}]}]);
  decideFacts(state,[{id:state.facts[0].id,version:1,decision:'approved'}],owner);
  addDocument(state,{id:'jd',kind:'jd',title:'Synthetic reporting role',selected:true,hash:'demo-jd',segments:[{id:'jd.1',text:'Experience creating Python reports is required.'}]});
  await addJDAnalysis(state,'jd',{roleName:'Reporting role',requirements:[{category:'task',text:'Experience creating Python reports',importance:'required',evidence:[{documentId:'jd',segmentId:'jd.1',quote:'Experience creating Python reports'}]}]});
  await buildProfiles(state,{profiles:[],mappings:state.requirements.map(r=>({requirementId:r.id,factIds:[],explanation:'Synthetic fixture: Python reporting is not established.'})),questions:[]},'analysis');
  let stored={revision:1,state:structuredClone(state)};
  const service=new ProfileService({},owner);
  service.memory.load=async()=>structuredClone(stored);
  service.memory.save=async(revision,next)=>{if(revision!==stored.revision)throw new Error('Stale demo revision');stored={revision:revision+1,state:structuredClone(next)};return structuredClone(stored);};
  const row=buildRoleQuestionnaires(state)[0].experience[0];
  if(!row)throw new Error('Synthetic questionnaire did not produce a review row');
  const response=await dispatchProfileOperation(service,{body:{action:'reviewBuilder',revision:stored.revision,submissionId:'synthetic-demo-approval',rows:[{rowId:row.id,fingerprint:row.fingerprint,decision:'approve'}]}});
  const packet=await approvedProfileLoader(service)({version:'current'});
  return {mode:'offline synthetic fixture; simulated user decision; no model or database calls',storageVerified:response.result.storageVerified,approvedAdditionCount:response.result.rows.length,currentVersion:packet.facts.version,dispatch:response.dispatch.map(({from,to})=>`${from} -> ${to}`)};
}
