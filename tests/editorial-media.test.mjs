import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {planScene,artScene,escapeXml} from '../scripts/editorial-vector-scenes.mjs';
import {renderBlog,renderSlide,renderCollage,planCarousel,validateJpeg,wrapText} from '../scripts/editorial-media.mjs';
import {stories} from './fixtures/editorial-stories.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
test('specific engineering subject wins over generic AI/building words',()=>{
 for(const story of stories)assert.equal(planScene({title:'AI software for building projects: '+story.title,body:story.body}).subject,story.creative_brief.scene);
 assert.equal(planScene({title:'Engineering research update',body:stories[4].body}).subject,'flood');
 assert.throws(()=>planScene({title:'Amazing AI software platform'}),/supported engineering subject/);
 assert.throws(()=>planScene({scene:'unsupported'}),/Unsupported/);
});
test('copy escapes XML and long text fails closed rather than clipping',async()=>{
 assert.equal(escapeXml('<x & "y">'),'&lt;x &amp; &quot;y&quot;&gt;');
 const r=await renderBlog({title:'Bridge inspection & review <QA>',subtitle:'An illustrative inspection workflow'});
 assert.ok(r.svg.includes('&amp;'));assert.ok(r.svg.includes('&lt;QA&gt;'));
 await assert.rejects(renderBlog({title:'Bridge '+('inspection '.repeat(60))}),/layout/);
 assert.throws(()=>wrapText(createCanvas(1,1).getContext('2d'),'X'.repeat(500),100,40),/word/);
 const a=structuredClone(stories[0]);a.creative_brief.slides[0].detail='oversized '.repeat(70);
 await assert.rejects(renderSlide(a.creative_brief.slides[0],0,a),/layout/);
});
test('storyboard rejects missing briefs and duplicate visual shots',()=>{
 assert.throws(()=>planCarousel({}),/five/);
 const a=structuredClone(stories[0]);a.creative_brief.slides.forEach(s=>s.shot='context');assert.throws(()=>planCarousel(a),/distinct/);
});
test('art responds to visual evidence, stays deterministic, and separates story roles',()=>{
 const p=planScene({title:'Bridge inspection',visual:'Drone imagery'});
 assert.equal(artScene(p),artScene(p));
 assert.notEqual(artScene(p),artScene(planScene({title:'Bridge inspection'})));
 for(const s of stories){const plans=planCarousel(s);assert.equal(new Set(plans.map(p=>hash(artScene(p)))).size,5);}
});
test('six subjects: real JPEG dimensions, distinct art pixels, readable layouts and collages',async()=>{
 const covers=[],layouts=new Set();
 for(const story of stories){
  const cover=await renderBlog(story);covers.push(hash(cover.bytes));layouts.add(cover.plan.layout);await validateJpeg(cover.bytes,1200,630);
  const plans=planCarousel(story),slides=[];
  for(let i=0;i<5;i++){const r=await renderSlide(story.creative_brief.slides[i],i,story,plans[i]);await validateJpeg(r.bytes,1200,1200);slides.push(r);}
  // Art-only fingerprints prevent text/palette-only slide differences passing.
  const fingerprints=slides.map(r=>{const c=createCanvas(40,26),x=c.getContext('2d');x.drawImage(r.artCanvas,0,0,40,26);const pixels=x.getImageData(0,0,40,26).data;return [...pixels].filter((_,i)=>i%4!==3);});
  for(let i=0;i<5;i++)for(let j=0;j<i;j++){const delta=fingerprints[i].reduce((sum,v,k)=>sum+Math.abs(v-fingerprints[j][k]),0)/fingerprints[i].length;assert.ok(delta>3,story.slug+' duplicate scene pixels: '+delta);}
  const collage=await renderCollage(slides,story);await validateJpeg(collage,1600,1200);
  assert.notEqual(hash(collage),hash(cover.bytes));
 }
 assert.equal(new Set(covers).size,6);assert.equal(layouts.size,3);
});
test('JPEG validation rejects wrong dimensions, corrupted bytes and incorrect format',async()=>{
 const b=(await renderBlog(stories[0])).bytes;
 await assert.rejects(validateJpeg(b,1200,1200),/dimensions/);
 await assert.rejects(validateJpeg(b.subarray(0,b.length-2),1200,630),/Invalid/);
 await assert.rejects(validateJpeg(Buffer.from('<svg/>'),1200,630),/Invalid/);
});
test('publication contracts and worker boundaries remain intact',async()=>{
 const blog=JSON.parse(await readFile('contracts/marketing/blog-automation-v1.json'));
 const news=JSON.parse(await readFile('contracts/marketing/ai-news-social-automation-v1.json'));
 assert.equal(blog.roles.publisher.automation_may_publish,false);
 for(const channel of ['facebook_auto_publish','instagram_auto_publish','linkedin_ai_news_auto_publish']){
  assert.equal(news.permissions[channel],false);
 }
 assert.equal(news.manual_creative_workflow.publication_requires_explicit_owner_instruction,true);
 assert.equal(news.website_syndication.publish_only_after_owner_approval,true);
 assert.equal(news.website_syndication.same_story_approval_as_social,true);
 assert.equal(news.website_syndication.stable_key,'asset_id');
 const worker=await readFile('scripts/prepare-ai-news-social-images.mjs','utf8');
 assert.match(worker,/image_status=eq.pending&image_url=is.null/);assert.match(worker,/status=eq.pending/);
 assert.ok(worker.indexOf('const plans=planCarousel(a)')<worker.indexOf('/storage/v1/object/blog-media/'));
 assert.ok(!worker.includes('windsor'));assert.ok(!worker.includes('status:"published"'));
});
test('worker integration: five slides, dedicated collage, pending-only patches and history protection',async()=>{
 const {spawnSync}=await import('node:child_process');
 for(const mode of ['success','published','bad-brief']){
  const p=spawnSync(process.execPath,['--import','./tests/fixtures/editorial-worker-mock.mjs','scripts/prepare-ai-news-social-images.mjs'],{encoding:'utf8',env:{...process.env,SUPABASE_SERVICE_ROLE_KEY:'offline-test-only',EDITORIAL_MOCK_MODE:mode}});
  assert.equal(p.status,mode==='bad-brief'?1:0,p.stdout+p.stderr);
  assert.match(p.stdout,mode==='success'?/"generated":1/:mode==='published'?/"blocked":1/:/"failed":1/);
 }
});
test('contracts pin the real renderer catalog, dimensions, narrative shots and future workflow gates',async()=>{
 const {validateEditorialImagePolicy}=await import('../scripts/validate-editorial-image-policy.mjs');
 for(const [kind,path] of [['blog','blog'],['news','ai-news-social']]){
  const c=JSON.parse(await readFile(`contracts/marketing/${path}-automation-v1.json`));
  assert.match(c.version,/^1\.\d+\.\d+$/);validateEditorialImagePolicy(c,kind);
  for(const change of [x=>x.image_engine.version=1,x=>x.image_engine.no_paid_image_api=false,x=>x.image_engine.supported_subjects.pop(),x=>x.image_engine.preserve_historical_assets=false]){
   const broken=structuredClone(c);change(broken);assert.throws(()=>validateEditorialImagePolicy(broken,kind),/EDITORIAL IMAGE POLICY/);
  }
  const yml=await readFile(c.workflow.file,'utf8');
  assert.match(yml,/if:\s*\$\{\{ false \}\}/);
  assert.doesNotMatch(yml,/SUPABASE_SERVICE_ROLE_KEY:|WINDSOR_API_KEY:/);
  assert.doesNotMatch(yml,/^\s*schedule:/m);
 }
});
