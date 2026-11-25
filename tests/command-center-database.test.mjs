import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
const gates=['unit','integration','regression','engineeringReference','schema','security','build','preview','compatibility','rollback'];
test('release RPC fails closed, binds evidence and atomically audits one decision',async()=>{
 const db=new PGlite();
 try{
 await db.exec(`create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key); insert into auth.users values ('00000000-0000-4000-8000-000000000001'); create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('test.uid',true),'')::uuid $$; create function public.platform_access_is_owner() returns boolean language sql as $$ select coalesce(current_setting('test.owner',true),'false')='true' $$;`);
 await db.exec(readFileSync(new URL('../supabase/migrations/20261125000100_command_center_core_staged.sql',import.meta.url),'utf8'));
 const sha='a'.repeat(40);
 const {rows:[candidate]}=await db.query('insert into command_center_core_releases(target_version,source_sha) values ($1,$2) returning id',['0.6.0',sha]);
 const review=decision=>db.query('select command_center_review_core_release($1,$2,$3)',[candidate.id,decision,'Reviewed test evidence']);
 await assert.rejects(review('approve'),/forbidden/);
 await db.exec(`set test.uid='00000000-0000-4000-8000-000000000001';set test.owner='true'`);
 await assert.rejects(review('approve'),/stale_evidence/);
 const evidence={sourceSha:sha,productionAuthorization:'explicit-owner-review-required',checks:Object.fromEntries(gates.map(g=>[g,'passed'])),evidenceRefs:Object.fromEntries(gates.map(g=>[g,'https://evidence.example/'+g]))};
 evidence.checks.security='failed';
 await db.query('update command_center_core_releases set evidence=$1 where id=$2',[JSON.stringify(evidence),candidate.id]);
 await assert.rejects(review('approve'),/mandatory_gate_missing: security/);
 evidence.checks.security='passed';delete evidence.evidenceRefs.engineeringReference;
 await db.query('update command_center_core_releases set evidence=$1 where id=$2',[JSON.stringify(evidence),candidate.id]);
 await assert.rejects(review('approve'),/evidence_reference_missing/);
 evidence.evidenceRefs.engineeringReference='https://evidence.example/reference';
 await db.query('update command_center_core_releases set evidence=$1 where id=$2',[JSON.stringify(evidence),candidate.id]);
 await review('approve');await assert.rejects(review('approve'),/release_not_reviewable/);
 assert.equal((await db.query('select status from command_center_core_releases')).rows[0].status,'approved');
 const events=(await db.query('select * from command_center_core_release_events')).rows;
 assert.equal(events.length,1);assert.equal(events[0].source_sha,sha);assert.deepEqual(events[0].evidence_snapshot,evidence);
 // Direct client writes are prohibited even for an authenticated Owner.
 await db.exec('set role authenticated');
 await assert.rejects(db.exec(`update public.command_center_core_releases set status='released'`),/permission denied/);
 await assert.rejects(db.exec('delete from public.command_center_core_release_events'),/permission denied/);
 await db.exec("set test.owner='false'");
 assert.equal((await db.query('select * from public.command_center_core_releases')).rows.length,0);
 }finally{await db.close();}
});
