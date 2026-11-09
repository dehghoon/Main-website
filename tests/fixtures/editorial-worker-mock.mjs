// Subprocess preload: deny any unexpected network access; no real credentials.
import assert from 'node:assert/strict';
import {stories} from './editorial-stories.mjs';
const mode=process.env.EDITORIAL_MOCK_MODE;
const asset={...structuredClone(stories[0]),id:'qa-asset',source_url:'https://example.org/test'};
if(mode==='bad-brief')asset.creative_brief.slides[3].headline='x'.repeat(300);
const uploads=new Map(),patches=[];let writes=0;
globalThis.fetch=async(url,options={})=>{
 const u=new URL(url),method=options.method||'GET';
 assert.equal(u.hostname,'xssiwlwlsyxrwdbninqe.supabase.co');
 if(method==='GET'&&u.pathname==='/rest/v1/ai_news_social_assets')return Response.json([asset]);
 if(method==='GET'&&u.pathname==='/rest/v1/ai_news_social_publications')return Response.json([{status:mode==='published'?'published':'pending'}]);
 if(method==='POST'&&u.pathname.startsWith('/storage/v1/object/blog-media/')){writes++;uploads.set(u.pathname.replace('/storage/v1/object/',''),Buffer.from(options.body));return Response.json({});}
 if(method==='GET'&&u.pathname.startsWith('/storage/v1/object/public/')){const bytes=uploads.get(u.pathname.replace('/storage/v1/object/public/',''));assert.ok(bytes);return new Response(bytes,{headers:{'content-type':'image/jpeg'}});}
 if(method==='PATCH'){writes++;patches.push({url:u,body:JSON.parse(options.body)});return Response.json([asset]);}
 throw Error('Unexpected request '+method+' '+u.pathname);
};
process.on('exit',()=>{
 if(mode==='published'){assert.equal(writes,0);return;}
 if(mode==='bad-brief'){assert.equal(uploads.size,0);assert.equal(patches.length,1);assert.equal(patches[0].body.image_status,'failed');return;}
 assert.equal(uploads.size,6);assert.equal(patches.length,4);
 const posts=patches.filter(p=>p.body.media_urls);
 assert.equal(posts.length,3);
 for(const p of posts){assert.equal(p.url.searchParams.get('status'),'eq.pending');const n=p.url.searchParams.get('platform')==='eq.instagram'?5:1;assert.equal(p.body.media_urls.length,n);assert.equal(new Set(p.body.media_urls).size,n);}
 assert.equal(patches.at(-1).body.image_status,'ready');
});
