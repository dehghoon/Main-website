import test from 'node:test';
import assert from 'node:assert/strict';
import { discoverCoreChanges,openReviewTasks,relevantPath } from '../scripts/command-center-core-monitor.mjs';
test('interface filtering includes engineering and schema changes',()=>{
 for(const p of ['src/loads.ts','schemas/model.json','catalogs/materials.json','package.json','CORE_CONTRACT.md'])assert.equal(relevantPath(p),true);
 assert.equal(relevantPath('README.md'),false);
});
function fake(){
 const calls=[],created=[];
 const rest={repos:{listReleases:'releases',listTags:'tags',getCommit:async()=>({data:{sha:'a'.repeat(40),html_url:'https://example.com/main'}})},pulls:{list:'prs',listFiles:'files'},issues:{listForRepo:'issues',create:async x=>created.push(x)}};
 const values={releases:[{id:1,draft:false,tag_name:'v0.6.0',html_url:'https://example.com/release'},{id:2,draft:true}],tags:[{name:'v0.6.0',commit:{sha:'b'.repeat(40)}}],prs:[{number:3,head:{sha:'c'.repeat(40)},html_url:'https://example.com/pr'}],files:[{filename:'schemas/model.json'}],issues:created};
 return {created,calls,github:{rest,paginate:async(method,args)=>{calls.push({method,args});return values[method];}}};
}
test('discovery records source, release, tag and relevant PR without draft release',async()=>{
 const f=fake(),changes=await discoverCoreChanges(f.github);
 assert.deepEqual(changes.map(c=>c.kind),['source','release','tag','interface-pr']);
 assert.equal(f.created.length,0);
});
test('monitor creates review tasks once and never publishes or deploys',async()=>{
 const f=fake();await openReviewTasks(f.github,{repo:{owner:'dehghoon',repo:'Main-website'}});await openReviewTasks(f.github,{repo:{owner:'dehghoon',repo:'Main-website'}});
 assert.equal(f.created.length,4);
 assert.ok(f.created.every(x=>x.body.includes('engineering reference')&&x.body.includes('explicit Owner approval')));
});
test('discovery errors fail closed without partial task creation',async()=>{
 const f=fake();f.github.rest.repos.getCommit=async()=>{throw Error('denied')};
 await assert.rejects(openReviewTasks(f.github,{repo:{owner:'dehghoon',repo:'Main-website'}}),/denied/);
 assert.equal(f.created.length,0);
});
