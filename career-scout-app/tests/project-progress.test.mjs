import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateProgress,profileAgentProgress,progressCounts,taskBlockers,stageState,PROGRESS_STATUSES} from '../lib/project-progress.mjs';
const read=file=>JSON.parse(fs.readFileSync(new URL(file,import.meta.url),'utf8'));
const source=read('../data/scout-progress.json'),record=profileAgentProgress(source),legacy=read('./fixtures/scout-progress-v1.json');
test('all original points, progress and notes survive reassignment with ownership history',()=>{
  assert.equal(validateProgress(record),record);
  const map={done:'complete',partial:'in_progress',pending:'not_started'};
  assert.equal(source.tasks.filter(task=>task.legacy).length,36);
  for(const old of legacy.tasks){const current=source.tasks.find(task=>task.id===old.id);assert.ok(current);for(const [key,value]of Object.entries(old))if(key!=='status'&&key!=='notes')assert.deepEqual(current[key],value);assert.equal(current.originalStatus,old.status);if(old.status==='done')assert.equal(current.status,'complete');if(old.status==='partial')assert.notEqual(current.status,'not_started');assert.equal(current.originalOwner,'scout');assert.equal(current.ownerHistory[0].owner,'scout');for(const note of old.notes||[])assert.ok(current.notes.includes(note));}
  assert.equal(record.tasks.find(task=>task.id==='resume-grounding').owner,'critic');
  assert.equal(source.tasks.find(task=>task.id==='keenable').owner,'scout');
});
test('five statuses, all active owners and complete item metadata are represented',()=>{
  assert.equal(record.agents.length,9);assert.equal(PROGRESS_STATUSES.length,5);
  const counts=progressCounts(record.tasks);assert.equal(counts.total,PROGRESS_STATUSES.reduce((sum,status)=>sum+counts[status],0));
  for(const task of record.tasks){assert.ok(task.owner);assert.ok(Array.isArray(task.dependsOn));assert.ok(task.acceptance);for(const key of ['blockers','notes','outputLinks'])assert.ok(Array.isArray(task[key]));}
  assert.equal(stageState([]),'not_started');
});
test('only Complete prerequisites satisfy readiness',()=>{
  const task=source.tasks.find(task=>task.id==='scheduler');
  assert.deepEqual(taskBlockers(task,source.tasks).map(item=>item.id),['job-storage','daily-quota']);
  const changed=structuredClone(source.tasks);changed.find(item=>item.id==='job-storage').status='complete';changed.find(item=>item.id==='daily-quota').status='in_review';
  assert.deepEqual(taskBlockers(task,changed).map(item=>item.id),['daily-quota']);
});
test('invalid references, cycles, routes and unsafe output links are rejected',()=>{
  for(const mutate of [r=>r.tasks[0].dependsOn=['missing'],r=>r.tasks[0].dependsOn=['roles'],r=>r.tasks.push({...r.tasks[0]}),r=>r.communication[0]={from:'scout',to:'matcher'},r=>r.tasks[0].outputLinks=[{label:'Unsafe',url:'javascript:alert(1)'}]]){const invalid=structuredClone(record);mutate(invalid);assert.throws(()=>validateProgress(invalid));}
});
test('completed work requires evidence and completed prerequisites',()=>{
  const invalid=structuredClone(record);delete invalid.tasks[0].evidence;assert.throws(()=>validateProgress(invalid),/evidence/);
  const incomplete=structuredClone(record);const completeTask=incomplete.tasks.find(task=>task.status==='complete'&&task.dependsOn.length);incomplete.tasks.find(task=>task.id===completeTask.dependsOn[0]).status='in_review';assert.throws(()=>validateProgress(incomplete),/prerequisites/);
});
