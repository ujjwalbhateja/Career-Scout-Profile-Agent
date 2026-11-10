// Real adapter logic, also imported by bounded synthetic/live verification.
import {generateAgentJSON} from '../profile/providers.mjs';
import {ProfileService,pythonProfileLoader} from '../profile/service.mjs';
import {ProfileError} from '../profile/domain.mjs';

const string={type:'STRING'},boolean={type:'BOOLEAN'};
const array=items=>({type:'ARRAY',items});
const object=properties=>({type:'OBJECT',properties,required:Object.keys(properties)});
const check=object({passed:boolean,issues:array(string)});
export const AGENT_SCHEMAS={
  extract_facts:object({facts:array(object({id:string,text:string,evidence:array(object({source_id:string,quote:string}))}))}),
  build_profile:object({roles:array(object({id:string,name:string,keywords:array(string),fact_ids:array(string)})),questions:array(string)}),
  match_jobs:object({suitable:boolean,selected_job_id:{type:'STRING',nullable:true},reasons:array(string)}),
  tailor_resume:object({content:string}),
  review_draft:check
};
const RULES={
  extract_facts:'Extract explicit factual proposals from the supplied resume/answer sources. Each fact needs a unique ID, text, and an EXACT contiguous source quotation with its supplied source_id. Never use JDs as user evidence. Do not approve anything.',
  build_profile:'Compare supplied employer requirements against approved factual information. Return roles:[] and only material unanswered questions. Do not invent role suggestions, job titles, responsibilities, skills or vacancies. Profile saving is explicit.',
  match_jobs:'Assess essential responsibilities and mandatory qualifications against approved facts. Select only a supplied job ID. Set suitable false if mandatory experience is unsupported or the supplied description is too incomplete to assess. Explain support, gaps and unknowns in reasons. A matching title alone is insufficient. Never invent credentials, tenure or work authorization. If unsuitable use selected_job_id null.',
  tailor_resume:'Create a complete, readable ATS-friendly resume in plain Markdown. Preserve employer/role/date associations and factual limits. Use only supplied approved profile facts; do not turn JD requirements or profile keywords into experience. Include approved name/contact facts when present; omit unavailable fields, placeholders and commentary. Emphasize supported work relevant to the supplied job. Apply revision feedback without adding claims. Output only {content}.',
};
export async function runProvider({name,payload,prompt,owner},env,{generate=generateAgentJSON,service}={}){
  const model=(instructions,input,schema)=>generate(env,{instructions:prompt+'\n'+instructions,input,schema});
  if(name==='load_profile')return pythonProfileLoader(service||new ProfileService(env,owner))(payload.version);
  if(name==='review_draft'){
    const identity={reviewer:'critic',job_id:payload.job.id,profile_version:payload.profile.version,draft_hash:payload.draft_hash};
    // Two independent model calls; alignment never supplies JD claims as facts.
    const [facts,alignment]=await Promise.all([
      model('Independently audit EVERY factual assertion in the draft against supplied approved profile facts. Check all names, dates, employers, degrees, metrics, scope, tools and experience. A listed skill cannot prove a project. passed=true only if every claim is supported and issues is empty. Return actionable issues for every unsupported or conflicting assertion.',{profile:payload.profile,draft:payload.draft},check),
      model('Independently review this resume against the selected job. Check relevant supported experience, clarity, and job/profile identity. Do not require inventing missing qualifications. Flag misleading alignment and presentation problems. A conservative resume may omit unsupported employer requirements. passed=true only with no issues.',{profile:payload.profile,job:payload.job,draft:payload.draft},check)
    ]);
    return {...identity,profile_facts:facts,job_alignment:alignment,unresolved_issues:[]};
  }
  if(!RULES[name])throw new ProfileError('Unknown agent provider operation.');
  const result=await model(RULES[name],payload,AGENT_SCHEMAS[name]);
  if(name==='tailor_resume')return {job_id:payload.job.id,profile_version:payload.profile.version,content:result.content};
  return result;
}
