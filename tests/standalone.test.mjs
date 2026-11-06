import test from 'node:test';
import assert from 'node:assert/strict';
import {createProfileAgent,readPrompt} from '../src/index.mjs';
import {runDemo} from '../examples/demo.mjs';
test('standalone adapter rejects untrusted ownership and unsupported actions before storage access',async()=>{
  assert.throws(()=>createProfileAgent(),/trusted owner/);
  const agent=createProfileAgent({owner:'synthetic-test'});
  await assert.rejects(agent.execute({action:'paste',owner:'other'}),/Owner identity/);
  await assert.rejects(agent.execute({action:'search'}),/Unsupported/);
  await assert.rejects(readPrompt('../../.env.local'),/Unknown/);
});
test('offline demo verifies an explicit synthetic Builder decision and current-profile handoff without network',async t=>{
  t.mock.method(globalThis,'fetch',()=>{throw new Error('Network forbidden in demo');});
  const result=await runDemo();assert.equal(result.storageVerified,true);assert.equal(result.approvedAdditionCount,1);assert.match(result.currentVersion,/^current-[a-f0-9]{64}$/);
  assert.deepEqual(result.dispatch,['user -> master','master -> profile','profile -> master']);
});
