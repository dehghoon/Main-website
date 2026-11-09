// Offline acceptance gallery; never imports a publishing worker or uses credentials.
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {stories} from '../tests/fixtures/editorial-stories.mjs';
import {renderBlog,renderSlide,renderCollage,planCarousel} from './editorial-media.mjs';
const root=resolve(process.argv[2]||'docs/visual-qa/editorial-v2');await mkdir(root,{recursive:true});
const manifest=[];
for(const s of stories){
 const cover=await renderBlog({...s,seed:s.slug});await writeFile(`${root}/${s.slug}-after.jpg`,cover.bytes);
 const plans=planCarousel(s),slides=[];
 for(let i=0;i<5;i++){const r=await renderSlide(s.creative_brief.slides[i],i,s,plans[i]);slides.push(r);await writeFile(`${root}/${s.slug}-slide-${i+1}.jpg`,r.bytes);}
 await writeFile(`${root}/${s.slug}-collage.jpg`,await renderCollage(slides,s));
 manifest.push({slug:s.slug,title:s.title,cover:cover.plan.signature,slides:slides.map(x=>x.scene)});
}
const sheet=createCanvas(1200,stories.length*335),ctx=sheet.getContext('2d');ctx.fillStyle='#e7edef';ctx.fillRect(0,0,sheet.width,sheet.height);
for(let i=0;i<stories.length;i++){const s=stories[i];for(const [j,kind] of ['before','after'].entries()){try{ctx.drawImage(await loadImage(await readFile(`${root}/${s.slug}-${kind}.jpg`)),j*600,i*335+20,600,315);}catch(e){if(kind==='after')throw e;}}ctx.fillStyle='#183448';ctx.font='bold 16px Arial';ctx.fillText(s.title+' — BEFORE / AFTER',12,i*335+17);}
await writeFile(`${root}/comparison.jpg`,sheet.toBuffer('image/jpeg',90));
const carousel=createCanvas(1500,320),c=carousel.getContext('2d');for(let i=0;i<5;i++){c.drawImage(await loadImage(`${root}/qa-bridge-slide-${i+1}.jpg`),i*300,0,300,300);}await writeFile(`${root}/carousel-overview.jpg`,carousel.toBuffer('image/jpeg',90));
const all=createCanvas(1500,1800),ax=all.getContext('2d');
for(let j=0;j<stories.length;j++)for(let i=0;i<5;i++)ax.drawImage(await loadImage(`${root}/${stories[j].slug}-slide-${i+1}.jpg`),i*300,j*300,300,300);
await writeFile(`${root}/all-carousels.jpg`,all.toBuffer('image/jpeg',90));
await writeFile(`${root}/manifest.json`,JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({stories:stories.length,generatedJpegs:45,output:root}));
