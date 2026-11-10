import source from '@/data/scout-progress.json';
import {profileAgentProgress} from '@/lib/project-progress.mjs';
import {COMMUNICATION_ROUTES} from '@/lib/workflow/policy.mjs';
import {ANALYSIS_MODEL,EMBEDDING_MODEL,EMBEDDING_DIMENSIONS} from '@/lib/profile/providers.mjs';

export const dynamic='force-dynamic';
export function GET(){
  const record=profileAgentProgress(source);
  return Response.json({
    schemaVersion:2,framework:record.framework,participants:record.agents,
    routes:COMMUNICATION_ROUTES.map(([from,to])=>({from,to})),
    entrypoint:'backend/src/career_scout/agents/master/agent.py#build_graph',
    execution:'Profile intake, evidence review and local application preparation with a user-supplied job.',
    profileInput:{resume:'Upload or paste an existing resume',jobDescriptions:'Optional job descriptions for Profile Builder',intake:'lib/workflow/profile-intake.mjs#dispatchProfileOperation'},
    applicationInput:{selectedJob:'A user-supplied job with description and HTTPS application URL',automaticDiscovery:false},
    adapters:['loadApprovedProfile','fact','profileBuilder','matcher','tailor','critic','savePackage'],
    validation:{reviews:['profileFacts','jobAlignment'],bindsTo:['jobId','profileVersion','draftHash'],unresolvedIssuesAllowed:false,revisionLimit:'0–5; default 2'},
    memory:'Supabase revisioned records/private files plus Pinecone vectors; Profile alone accesses memory.',
    profileWorkspace:'/',profileArchitecture:'/?view=workflow',applicationsWorkspace:'/?step=Applications',
    providers:{provider:'gemini',embeddingModel:EMBEDDING_MODEL,dimensions:EMBEDDING_DIMENSIONS,analysisModel:ANALYSIS_MODEL,paidFallback:false,legacyOpenAISettingsIgnored:true}
  },{headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}
