import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(p,'utf8');
test('published article SEO metadata, social preview and JSON-LD are generated',()=>{
 const page=read('app/blog/[slug]/page.tsx');
 for(const token of ['seo_title','seo_description','alternates:{canonical}','openGraph:{','twitter:{','BlogPosting','datePublished','cover_image_alt','status:"eq.published"'])assert.ok(page.includes(token),token);
 assert.ok(page.includes('robots:{index:false,follow:false}'),'unavailable articles must not be indexed');
});
test('sitemap includes only published valid article slugs and robots points to sitemap',()=>{
 const sitemap=read('app/sitemap.ts'),robots=read('app/robots.ts');
 assert.ok(sitemap.includes('status:"eq.published"'));
 assert.ok(sitemap.includes('/^[a-z0-9-]+$/'));
 assert.ok(robots.includes('https://www.linkoteq.com/sitemap.xml'));
});
test('shared SEO contract is mandatory in both content validators',()=>{
 for(const name of ['blog','ai-news-social'])assert.ok(read('scripts/validate-'+name+'-contract.mjs').includes('validateSharedMarketingPolicy'));
});
