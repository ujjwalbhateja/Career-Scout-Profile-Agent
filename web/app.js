const panel=document.querySelector('#panel');
const message=document.querySelector('#message');
let record=null,status=null,groups=[],step='documents',busy=false;
const emptyRecord={revision:0,state:{documents:[],facts:[],roleProfiles:[],requirements:[],builderReviews:[],questions:[],answers:[],snapshots:[],outbox:[],runs:[],preferences:{}},currentProfile:{ready:false,message:'Configure a separate Profile Agent owner and storage to build a saved profile.'}};
const connected=()=>status?.ownerConfigured===true&&status?.providers?.supabase===true;
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const active=()=>record?.state?.documents?.filter(doc=>!doc.deleted)||[];
const facts=()=>record?.state?.facts?.filter(f=>f.lifecycle==='active')||[];
const approved=()=>facts().filter(f=>f.approval==='approved'&&!f.conflict);
const hasModel=()=>status?.providers?.model===true;
function notice(text,error=false){message.textContent=text||'';message.className=text?(error?'web-alert web-error':'web-alert web-success'):'';}
async function request(url,options){
  const response=await fetch(url,{cache:'no-store',...options});
  let data;try{data=await response.json();}catch{throw new Error('The Profile service returned an unreadable response.');}
  if(!response.ok)throw new Error(data.error||`Profile request failed (${response.status}).`);
  return data;
}
async function refresh(){
  status=await request('/api/profile?status=1');
  if(connected()){record=await request('/api/profile');}
  else {record=emptyRecord;groups=[];}
  if(record&&step==='builder')await loadGroups();
  render();
}
async function loadGroups(){const data=await request('/api/profile?questionnaires=1');groups=data.roles||[];}
function setup(){
  return `<div class="web-callout web-setup" role="status"><strong>Profile actions need local setup.</strong> ${!status?.ownerConfigured?'Set a unique <code>PROFILE_OWNER_ID</code>.':''} ${!status?.providers?.supabase?'Set <code>SUPABASE_URL</code> and <code>SUPABASE_SECRET_KEY</code>.':''} Add them to this project's ignored <code>.env.local</code>, then restart the launcher. You can inspect the workflow below now.</div>`;
}
function sourceList(kind){
  const docs=active().filter(d=>d.kind===kind);
  if(!docs.length)return '<p class="web-muted">No '+(kind==='jd'?'job descriptions':'resume')+' saved yet.</p>';
  return `<div class="web-list">${docs.map(d=>`<article class="web-row"><div><strong>${esc(d.title||d.filename||'Document')}</strong><small>${esc(d.analysis||'pending')} · ${d.segments?.length||0} text segments ${d.kind==='jd'?(d.selected?'· selected':'· not selected'):''}</small></div><div class="web-row-actions">${d.objectPath?`<a class="cw-secondary web-download" href="/api/profile?download=${encodeURIComponent(d.id)}">Download original</a>`:''}${d.kind==='jd'?`<button class="cw-secondary" data-action="select-jd" data-id="${esc(d.id)}" data-selected="${d.selected?'false':'true'}">${d.selected?'Unselect':'Select'}</button>`:''}<button class="cw-secondary" data-action="analyze" data-id="${esc(d.id)}" ${hasModel()?'':'disabled title="Configure Gemini first"'}>Analyze</button><button class="web-text-danger" data-action="remove" data-id="${esc(d.id)}">Remove</button></div></article>`).join('')}</div>`;
}
function documents(){
  return `<div class="cw-panel-top">STEP 01 · SOURCE DOCUMENTS</div><div class="cw-section-heading"><h2>Start with your resume.</h2><p>Profile reads your original resume and optional job descriptions. Analysis proposes claims for your review; it never approves them for you.</p></div>
    <div class="web-grid"><article class="cw-upload-card"><h3>Upload your resume</h3><p>PDF, Word (.docx), or TXT. Uploading also stages basic contact and education details.</p><form data-form="upload" data-kind="resume"><input type="file" name="file" accept=".pdf,.docx,.txt" required><button class="cw-primary">Upload resume</button></form></article>
    <article class="cw-upload-card"><h3>Optional job descriptions</h3><p>Use these to compare requirements after you approve your own facts.</p><form data-form="upload" data-kind="jd"><input type="file" name="file" accept=".pdf,.docx,.txt" required><button class="cw-secondary">Upload JD</button></form><form data-form="link"><label>Public job link<input type="url" name="url" placeholder="https://company.com/careers/role" required></label><button class="cw-secondary">Add job link</button></form></article></div>
    <details class="web-paste"><summary>Paste resume or JD text</summary><form data-form="paste"><label>Document type<select name="kind"><option value="resume">Resume</option><option value="jd">Job description</option></select></label><label>Title<input name="title" maxlength="180" placeholder="Document title"></label><label>Text<textarea name="text" rows="8" minlength="80" maxlength="60000" required></textarea></label><button class="cw-secondary">Save text</button></form></details>
    <h3 class="web-subhead">Resume</h3>${sourceList('resume')}<h3 class="web-subhead">Optional job descriptions</h3>${sourceList('jd')}
    <div class="cw-step-footer"><span>JD requirements never become facts about you.</span><button class="cw-primary" data-step="facts">Review factual profile →</button></div>`;
}
function evidence(f){const refs=f.evidence||[];return refs.length?`<details class="web-evidence"><summary>Source evidence (${refs.length})</summary>${refs.map(e=>{const doc=record.state.documents.find(d=>d.id===e.documentId),segment=doc?.segments?.find(s=>s.id===e.segmentId);return `<blockquote>${esc(e.quote)}<small>${esc(doc?.title||'Saved source')} · ${esc(segment?.locator||e.segmentId||'Source segment')}</small></blockquote>`;}).join('')}</details>`:'<p class="web-muted">No source quote attached. Check this claim carefully.</p>';}
function factual(){
  const items=facts();
  return `<div class="cw-panel-top">STEP 02 · FACT AGENT</div><div class="cw-section-heading"><h2>Review your factual profile.</h2><p>The Fact Agent proposes source linked statements. Approve or reject each displayed version explicitly.</p></div>${!hasModel()?'<p class="web-callout">Gemini is not configured. Saved source material remains available; model analysis is disabled.</p>':''}
    ${!items.length?'<div class="web-empty">No proposed facts yet. Return to Documents and choose Analyze on your resume.</div>':`<div class="web-list">${items.map(f=>`<article class="web-fact"><div class="web-fact-heading"><span>${esc(f.category)} · ${esc(f.field)} · v${f.version}</span><strong class="web-status">${esc(f.conflict?'conflict':f.approval||'pending')}</strong></div><p>${esc(f.statement)}</p>${evidence(f)}${f.conflict?`<p class="web-callout">This statement conflicts with another active record. Review both before choosing which one to keep.</p><button class="cw-secondary" data-action="resolve" data-id="${esc(f.id)}">Keep this; supersede conflicting record</button>`:''}${f.approval==='pending'?`<div class="web-row-actions"><button class="cw-primary" data-action="fact" data-id="${esc(f.id)}" data-version="${f.version}" data-decision="approved" ${f.conflict?'disabled':''}>Approve this wording</button><button class="cw-secondary" data-action="fact" data-id="${esc(f.id)}" data-version="${f.version}" data-decision="rejected">Reject</button></div>`:f.approval==='approved'?`<button class="web-text-danger" data-action="fact" data-id="${esc(f.id)}" data-version="${f.version}" data-decision="withdrawn">Withdraw approval</button>`:''}<details class="web-correction"><summary>Correct this statement</summary><form data-form="correct" data-id="${esc(f.id)}" data-version="${f.version}"><label>Exact corrected wording<textarea name="statement" rows="3" maxlength="1800" required>${esc(f.statement)}</textarea></label><button class="cw-secondary">Save corrected version for separate review</button></form></details></article>`).join('')}</div>`}
    <div class="cw-step-footer"><span>Approvals are stored for each fact version.</span><button class="cw-primary" data-step="builder">Continue to Profile Builder →</button></div>`;
}
function builderRows(rows){return rows.map((row,index)=>{
  const key=String(index);const canReview=['pending','awaiting_approval'].includes(row.status)&&!row.historyOnly;
  return `<article class="web-fact"><div class="web-fact-heading"><span>${esc(row.area||row.section||'Role requirement')}</span><strong class="web-status">${esc(row.status)}</strong></div><p>${esc(row.proposedStatement||row.statement||'')}</p>${row.comparisonExplanation?`<p class="web-muted">${esc(row.comparisonExplanation)}</p>`:''}${row.originalRequirementTexts?.length?`<details class="web-evidence"><summary>Employer requirement</summary>${row.originalRequirementTexts.map(s=>`<blockquote>${esc(s)}</blockquote>`).join('')}</details>`:''}${row.recordedStatements?.length?`<details class="web-evidence"><summary>Recorded experience</summary>${row.recordedStatements.map(s=>`<blockquote>${esc(s)}</blockquote>`).join('')}</details>`:''}
    ${canReview?`<form data-form="review" data-group="${esc(row._group)}" data-section="${esc(row._section)}" data-index="${key}"><label>Decision<select name="decision"><option value="">Choose a decision</option><option value="approve">Approve exact statement</option><option value="reject">Reject</option><option value="somewhat">Somewhat — write correction</option>${row.draftVersion?'<option value="approve_revision">Approve saved revision</option>':''}</select></label><label>Your precise correction, only for Somewhat<textarea name="text" rows="3" maxlength="1800">${esc(row.revisionText||'')}</textarea></label><button class="cw-primary">Save my decision</button></form>`:''}</article>`;}).join('');}
function builder(){
  const docs=active().filter(d=>d.kind==='jd'&&d.selected),professional=approved().filter(f=>!['personal','preferences'].includes(f.category));
  return `<div class="cw-panel-top">STEP 03 · PROFILE BUILDER</div><div class="cw-section-heading"><h2>Compare optional roles.</h2><p>Builder compares JD requirements with approved experience. It asks about gaps; the JD itself never proves a capability.</p></div>
    <p class="web-callout">${professional.length} approved professional facts · ${docs.length} selected job descriptions</p><button class="cw-primary" data-action="compare" ${professional.length&&docs.length&&hasModel()?'':'disabled'}>Analyze selected roles</button>
    ${!docs.length?'<div class="web-empty">Add and select a JD in Documents. Optional JDs are not required for the factual profile.</div>':''}
    ${groups.map((g,gi)=>`<section class="web-group"><h3>${esc(g.title||'Job description')}</h3>${g.recorded?.length?`<details><summary>Already supported (${g.recorded.length})</summary>${g.recorded.map(x=>`<p>${esc(x.requirement)}</p>`).join('')}</details>`:''}${g.unresolved?.length?`<details><summary>Unresolved requirements (${g.unresolved.length})</summary>${g.unresolved.map(x=>`<p>${esc(x.requirement)} — ${esc(x.explanation)}</p>`).join('')}</details>`:''}${builderRows((g.experience||[]).map(r=>({...r,_group:gi,_section:'experience'})))}${builderRows((g.skills||[]).map(r=>({...r,_group:gi,_section:'skills'})))}</section>`).join('')}
    <div class="cw-step-footer"><span>Somewhat saves a draft requiring separate approval.</span><button class="cw-primary" data-step="handoff">View current profile →</button></div>`;
}
function handoff(){
  const current=record?.currentProfile;
  return `<div class="cw-panel-top">STEP 04 · PROFILE HANDOFF</div><div class="cw-section-heading"><h2>Current approved profile.</h2><p>This packet is derived from source linked facts and stored decisions. It can be passed to Master; this standalone website does not start Scout.</p></div>
    <div class="web-callout"><strong>${current?.ready?'Ready for handoff':'Not ready yet'}</strong><p>${esc(current?.message||'Review your resume facts first.')}</p>${current?.version?`<small>Version ${esc(current.version)}</small>`:''}</div>
    ${current?.ready?'<button class="cw-primary" data-action="current">Download current profile JSON</button>':''}<div class="cw-step-footer"><span>Resume content remains as uploaded; no resume is rewritten.</span><button class="cw-secondary" data-step="memory">My data →</button></div>`;
}
function memory(){return `<div class="cw-panel-top">STEP 05 · PROFILE MEMORY</div><div class="cw-section-heading"><h2>Find and manage your evidence.</h2><p>Search approved records, export your profile, or explicitly remove saved material.</p></div><form data-form="retrieve"><label>Search approved experience<input name="query" minlength="3" required placeholder="Experience, skill, or qualification"></label><button class="cw-secondary">Search</button></form><div id="results"></div><p><button class="cw-secondary" data-action="export">Download profile JSON</button></p><details class="web-delete"><summary>Delete all Profile Agent data</summary><p>This deletes this standalone owner’s saved profile and original files. It cannot be undone.</p><form data-form="delete"><label>Type DELETE MY PROFILE<input name="confirmation" autocomplete="off" required></label><button class="web-danger">Delete my profile</button></form></details>`;}
function render(){
  document.querySelectorAll('[data-step]').forEach(button=>{if(button.closest('.cw-sidebar'))button.classList.toggle('active',button.dataset.step===step);});
  document.querySelector('#profile-count').textContent=record?String(approved().length):'—';
  document.querySelector('#profile-progress').style.width=record?.currentProfile?.ready?'100%':approved().length?'66%':active().some(d=>d.kind==='resume')?'33%':'0%';
  panel.innerHTML=(!connected()?setup():'')+({documents,facts:factual,builder,handoff,memory}[step]||documents)();
  if(!connected())panel.querySelectorAll('[data-action],form input,form select,form textarea,form button').forEach(element=>element.disabled=true);
}
async function action(body,success){
  if(busy)return;busy=true;notice('Saving or analyzing…');
  try{const result=await request('/api/profile',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision:record.revision,...body})});
    record=await request('/api/profile');
    if(step==='builder')await loadGroups();
    notice(success||result.result?.message||'Profile updated and saved.');render();return result;
  }catch(error){notice(error.message,true);}finally{busy=false;}
}
function download(data,name){const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
document.addEventListener('click',async event=>{
  const button=event.target.closest('button');if(!button)return;
  if(button.id==='refresh'){try{await refresh();notice('Profile refreshed.');}catch(e){notice(e.message,true);}return;}
  if(button.dataset.step){step=button.dataset.step;if(step==='builder'&&record){try{await loadGroups();}catch(e){notice(e.message,true);}}render();return;}
  if(!connected()||!button.dataset.action)return;
  const id=button.dataset.id;
  switch(button.dataset.action){
    case 'analyze':await action({action:'analyze',id},'Document analyzed. Review its proposed facts and requirements.');break;
    case 'select-jd':await action({action:'selectJD',id,selected:button.dataset.selected==='true'},'JD selection saved.');break;
    case 'remove':if(confirm('Withdraw this document and its dependent evidence?'))await action({action:'removeDocument',id},'Document withdrawn.');break;
    case 'fact':await action({action:'decideFacts',decisions:[{id,version:Number(button.dataset.version),decision:button.dataset.decision}]},'Fact decision saved.');break;
    case 'resolve':if(confirm('Keep this fact and supersede the linked conflicting fact?'))await action({action:'resolveConflict',id},'Conflict choice saved. Review the retained fact before approving.');break;
    case 'compare':await action({action:'buildProfiles',mode:'expansion'},'Role comparison saved. Review Builder rows.');break;
    case 'current':try{download(await request('/api/profile?current=1'),'current-profile.json');notice('Current profile downloaded.');}catch(e){notice(e.message,true);}break;
    case 'export':try{const result=await action({action:'export'},'Profile export prepared.');if(result?.result)download(result.result,'profile-export.json');}catch(e){notice(e.message,true);}break;
  }
});
document.addEventListener('submit',async event=>{
  const form=event.target;if(!form.dataset.form)return;event.preventDefault();if(!connected()||busy)return;
  const values=new FormData(form);
  if(form.dataset.form==='upload'){
    const file=values.get('file');if(!(file instanceof File)||!file.size)return notice('Choose a file.',true);
    const body=new FormData();body.set('file',file);body.set('kind',form.dataset.kind);body.set('title',file.name);body.set('selected',String(form.dataset.kind==='jd'));body.set('revision',String(record.revision));
    busy=true;notice('Uploading document…');try{await request('/api/profile',{method:'POST',body});record=await request('/api/profile');notice('Document uploaded. Choose Analyze to run the agent.');render();}catch(e){notice(e.message,true);}finally{busy=false;}return;
  }
  if(form.dataset.form==='paste'){await action({action:'paste',kind:values.get('kind'),title:values.get('title'),text:values.get('text'),selected:values.get('kind')==='jd'},'Document text saved. Choose Analyze to run the agent.');return;}
  if(form.dataset.form==='correct'){await action({action:'correctFact',id:form.dataset.id,version:Number(form.dataset.version),statement:values.get('statement')},'Corrected version saved. Review and approve it separately.');return;}
  if(form.dataset.form==='link'){await action({action:'importJD',url:values.get('url')},'Job description imported.');return;}
  if(form.dataset.form==='review'){
    const group=groups[Number(form.dataset.group)],row=group?.[form.dataset.section]?.[Number(form.dataset.index)],decision=values.get('decision'),text=String(values.get('text')||'').trim();
    if(!row||!decision)return notice('Choose a Builder decision.',true);
    if(decision==='somewhat'&&text.length<3)return notice('Enter your precise correction for Somewhat.',true);
    const review={rowId:row.id,fingerprint:row.fingerprint,decision};
    if(decision==='somewhat'||decision==='approve_revision')review.text=text;
    if(decision==='approve_revision')review.draftVersion=row.draftVersion;
    await action({action:'reviewBuilder',submissionId:crypto.randomUUID(),rows:[review]},'Builder decision saved and verified.');return;
  }
  if(form.dataset.form==='retrieve'){
    const result=await action({action:'retrieve',query:values.get('query')},'Search complete.');
    const target=document.querySelector('#results');if(target&&result?.result)target.innerHTML=`<div class="web-list">${(result.result.results||[]).map(x=>`<blockquote>${esc(x.text)}</blockquote>`).join('')||'<p>No approved records matched.</p>'}</div>`;
    return;
  }
  if(form.dataset.form==='delete'){
    if(values.get('confirmation')!=='DELETE MY PROFILE')return notice('Type the exact confirmation phrase.',true);
    if(confirm('Permanently delete this Profile Agent owner’s data?'))await action({action:'deleteProfile',confirmation:'DELETE MY PROFILE'},'Profile deleted.');
  }
});
refresh().catch(error=>{notice(error.message,true);render();});
