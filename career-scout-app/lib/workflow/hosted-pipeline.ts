import {zipSync,strToU8} from 'fflate';
import {getProfileEnvironment,scheduleProfileWork} from '@/lib/profile-runtime';
import {ProfileService,pythonProfileLoader} from '@/lib/profile/service.mjs';
import {ProfileError,digest} from '@/lib/profile/domain.mjs';
import {runProvider} from '@/lib/workflow/agent-providers.mjs';
import matcherPrompt from '@/backend/src/career_scout/agents/matcher/prompt.md?raw';
import tailorPrompt from '@/backend/src/career_scout/agents/tailor/prompt.md?raw';
import criticPrompt from '@/backend/src/career_scout/agents/critic/prompt.md?raw';

type Run={id:string;status:string;phase:string;updated:string;request?:any;result?:any};
const stamp=()=>new Date().toISOString();
const service=(owner:string)=>new ProfileService(getProfileEnvironment(),owner);

async function change(owner:string,edit:(runs:Run[])=>void){
  const profile=service(owner);
  for(let attempt=0;attempt<3;attempt++){
    const {state,revision}=await profile.memory.load();
    const runs:Run[]=Array.isArray(state.applicationRuns)?state.applicationRuns:[];
    edit(runs);
    state.applicationRuns=runs.slice(-30);
    try{await profile.memory.save(revision,state);return;}catch(error){if(!(error instanceof ProfileError)||error.status!==409||attempt===2)throw error;}
  }
}
async function runs(owner:string):Promise<Run[]>{const {state}=await service(owner).memory.load();return Array.isArray(state.applicationRuns)?state.applicationRuns:[];}
function publicRun(run:Run){const {request,...output}=run;return output;}
async function stage(owner:string,id:string,phase:string,update:Record<string,unknown>={}){
  await change(owner,items=>{const run=items.find(item=>item.id===id);if(!run)throw new ProfileError('Application run was removed.',404);if(run.status==='cancelled'&&update.status!=='cancelled')throw new ProfileError('Application run was cancelled.',409);Object.assign(run,{phase,updated:stamp(),...update});});
}
async function execute(owner:string,id:string,request:any){
  let assessment:any=null,draft:any=null;
  try{
    const profileService=service(owner),load=pythonProfileLoader(profileService);
    await stage(owner,id,'memory',{status:'running'});
    const profile=await load(request.saved_profile_version);
    if(!profile?.facts?.length||!profile.search_profile||request.selected_role_id!=='master-profile')throw new ProfileError('Build and save your source-backed master profile first.',409);
    const job=request.selected_job;
    await stage(owner,id,'matcher');
    assessment=await runProvider({name:'match_jobs',payload:{profile,jobs:[job]},prompt:matcherPrompt,owner},getProfileEnvironment());
    if(!assessment||typeof assessment.suitable!=='boolean'||!Array.isArray(assessment.reasons)||assessment.suitable&&assessment.selected_job_id!==job.id)throw new ProfileError('Matcher did not return a valid decision.',502);
    if(!assessment.suitable){await stage(owner,id,'matcher',{status:'complete',result:{status:'needs_review',assessment}});return;}
    let feedback:string[]=[];
    for(let revision=0;revision<=2;revision++){
      await stage(owner,id,'tailor');
      draft=await runProvider({name:'tailor_resume',payload:{profile,job,assessment,feedback,previous_draft:draft},prompt:tailorPrompt,owner},getProfileEnvironment());
      if(draft.job_id!==job.id||draft.profile_version!==profile.version||typeof draft.content!=='string'||!draft.content.trim())throw new ProfileError('Tailor returned a draft for the wrong job or profile.',502);
      await stage(owner,id,'critic');
      const draftHash=await digest(JSON.stringify(draft));
      const review=await runProvider({name:'review_draft',payload:{profile,job,draft,draft_hash:draftHash},prompt:criticPrompt,owner},getProfileEnvironment());
      feedback=[...(review.profile_facts?.issues||[]),...(review.job_alignment?.issues||[]),...(review.unresolved_issues||[])];
      if(review.job_id!==job.id||review.profile_version!==profile.version||review.draft_hash!==draftHash)feedback.push('Review did not cover the current draft.');
      if(!review.profile_facts?.passed||!review.job_alignment?.passed)feedback.push('Both independent Critic checks must pass.');
      if(feedback.length){if(revision===2){await stage(owner,id,'critic',{status:'complete',result:{status:'needs_review',assessment,draft,feedback}});return;}continue;}
      await stage(owner,id,'application-storage');
      const current=await load(request.saved_profile_version);
      if(JSON.stringify(current)!==JSON.stringify(profile))throw new ProfileError('The approved profile changed. Start a new application run.',409);
      await stage(owner,id,'application-storage',{status:'complete',result:{status:'ready_to_apply',assessment,draft,review,receipt:{stored:true,job_id:job.id,profile_version:profile.version,draft_hash:draftHash}}});
      return;
    }
  }catch(error){
    if(error instanceof ProfileError&&error.message==='Application run was cancelled.')return;
    const message=error instanceof ProfileError?error.message:'Application preparation failed. Retry the run.';
    try{await stage(owner,id,'master',{status:'failed',result:{status:'failed',assessment,draft,error:{message}}});}catch{}
  }
}
export async function hostedPipeline(owner:string,action:string,payload:any={}):Promise<Response>{
  if(action==='health')return Response.json({status:'ok',provider:'hosted'});
  if(action==='list')return Response.json({runs:(await runs(owner)).slice().reverse().map(publicRun)});
  const id=payload.request_id;
  if(typeof id!=='string'||!/^[a-f0-9-]{36}$/.test(id))throw new ProfileError('A valid run ID is required.');
  const existing=(await runs(owner)).find(item=>item.id===id);
  if(action==='get'){
    if(!existing)throw new ProfileError('Application run not found.',404);
    return Response.json(publicRun(existing));
  }
  if(action==='download'){
    if(existing?.result?.status!=='ready_to_apply'||!existing.result.receipt?.stored)throw new ProfileError('No validated package exists for this run.',404);
    const job=existing.request.selected_job,result=existing.result;
    const files={'resume.md':strToU8(result.draft.content),'job-description.txt':strToU8(job.description),'application-url.txt':strToU8(job.application_url),'match-and-review.json':strToU8(JSON.stringify({job:{id:job.id,title:job.title,company:job.company},assessment:result.assessment,review:result.review,receipt:result.receipt},null,2))};
    return new Response(zipSync(files),{headers:{'Content-Type':'application/zip'}});
  }
  if(action==='start'){
    if(existing)throw new ProfileError('This application run already exists.',409);
    if(!payload.request?.selected_job)throw new ProfileError('Provide a target job.',400);
    const request=payload.request;
    await change(owner,items=>items.push({id,status:'queued',phase:'master',updated:stamp(),request}));
    scheduleProfileWork(()=>execute(owner,id,request));
    return Response.json({id,status:'queued',phase:'master',updated:stamp()});
  }
  if(!existing)throw new ProfileError('Application run not found.',404);
  if(action==='delete'){
    if(['queued','running'].includes(existing.status))throw new ProfileError('Wait for this run to finish before deleting it.',409);
    await change(owner,items=>{const index=items.findIndex(item=>item.id===id);if(index>=0)items.splice(index,1);});
    return Response.json({id,status:'deleted'});
  }
  if(action==='retry'){
    if(!['failed','cancelled','interrupted'].includes(existing.status))throw new ProfileError('Only an incomplete run can be retried.',409);
    await stage(owner,id,'master',{status:'queued',result:null});
    scheduleProfileWork(()=>execute(owner,id,existing.request));
    return Response.json({id,status:'queued',phase:'master'});
  }
  if(action==='cancel'){
    await stage(owner,id,existing.phase,{status:'cancelled',result:{status:'cancelled'}});
    return Response.json({id,status:'cancelled',phase:existing.phase});
  }
  throw new ProfileError('Unknown application action.',400);
}
