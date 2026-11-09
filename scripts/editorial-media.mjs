// Pure local rendering entry points: importing this module never touches a queue.
import {createCanvas,loadImage,GlobalFonts} from '@napi-rs/canvas';
import {planScene,artScene,SHOTS,SUBJECTS,escapeXml} from './editorial-vector-scenes.mjs';
GlobalFonts.registerFromPath(new URL('./assets/fonts/DejaVuSans.ttf',import.meta.url).pathname,'DejaVu Sans');
GlobalFonts.registerFromPath(new URL('./assets/fonts/DejaVuSans-Bold.ttf',import.meta.url).pathname,'DejaVu Sans');
const font='DejaVu Sans';
export function wrapText(ctx,value,width,size,maxLines=3) {
 ctx.font=`bold ${size}px ${font}`;
 const text=String(value||'').trim();if(!text)throw Error('Missing editorial copy');
 const result=[];let line='';
 for(const word of text.split(/\s+/)){
  if(ctx.measureText(word).width>width)throw Error('Unbreakable word exceeds safe text width');
  const next=line?line+' '+word:word;
  if(ctx.measureText(next).width>width){result.push(line);line=word;}else line=next;
 }
 if(line)result.push(line);
 if(result.length>maxLines)throw Error('Copy exceeds mobile-safe layout; shorten headline/detail');
 return result;
}
function svgText(lines,x,y,size,color,step=size*1.17){return lines.map((t,i)=>`<text x="${x}" y="${y+i*step}" font-family="${font}" font-size="${size}" font-weight="bold" fill="${color}">${escapeXml(t)}</text>`).join('');}
export function blogSvg({title,subtitle='',body='',visual='',scene,seed=''}) {
 const ctx=createCanvas(1,1).getContext('2d');
 const plan=planScene({title,body:body+" "+subtitle,visual,scene,seed});
 const layout=['concrete','drawings'].includes(plan.subject)?'light':['coordination','import','structure'].includes(plan.subject)?'split':'panorama';
 const light=layout==='light',ink=light?'#15374b':'#ffffff',paper=light?'#edf1e8':'#102d42';
 const caption=subtitle?wrapText(ctx,subtitle,1088,23,1):[];
 let composition='';
 if(layout==='panorama'){
  const headline=wrapText(ctx,title,1088,46,2);
  composition=`<g transform="translate(270 146) scale(.58)">${artScene(plan)}</g>${svgText(headline,56,99,46,ink)}<path d="M56 228H220" stroke="${plan.colors[2]}" stroke-width="5"/>`;
 } else if(layout==='split') {
  const headline=wrapText(ctx,title,435,45,5);
  composition=`<g transform="translate(500 60) scale(.60)">${artScene(plan)}</g>${svgText(headline,56,161,45,ink,55)}<path d="M56 480H220" stroke="${plan.colors[2]}" stroke-width="5"/>`;
 } else {
  const headline=wrapText(ctx,title,460,44,5);
  composition=`<g transform="translate(20 130) scale(.53)">${artScene(plan)}</g>${svgText(headline,664,196,44,ink,54)}<path d="M664 455H850" stroke="#b67c3d" stroke-width="5"/>`;
 }
 return {plan:{...plan,layout},svg:`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="${paper}"/><text x="56" y="42" font-family="${font}" font-size="19" letter-spacing="2" fill="${light?'#376477':'#8cdbdb'}">LINKOTEQ / ENGINEERING INSIGHTS</text>${composition}<rect y="565" width="1200" height="65" fill="${paper}"/>${svgText(caption,56,603,23,light?'#31566a':'#d1e3e8')}</svg>`};
}
export async function raster(svg,width,height){const canvas=createCanvas(width,height);const ctx=canvas.getContext('2d');ctx.drawImage(await loadImage(Buffer.from(svg)),0,0,width,height);const bytes=canvas.toBuffer('image/jpeg',90);await validateJpeg(bytes,width,height);return {canvas,bytes};}
export async function validateJpeg(bytes,width,height){if(bytes[0]!==255||bytes[1]!==216||bytes.at(-2)!==255||bytes.at(-1)!==217||bytes.length<1024||bytes.length>8*1024*1024)throw Error('Invalid JPEG bytes/size');const image=await loadImage(bytes);if(image.width!==width||image.height!==height)throw Error('Incorrect JPEG dimensions');return true;}
export async function renderBlog(input){const {svg,plan}=blogSvg(input);return {...await raster(svg,1200,630),svg,plan};}
export function planCarousel(asset){
 const slides=asset.creative_brief?.slides;
 if(!Array.isArray(slides)||slides.length!==5||slides.some(s=>!s?.headline||!s?.detail||!s?.visual))throw Error('Exactly five detailed slide briefs required');
 const story=planScene({title:asset.title,body:asset.subtitle,visual:slides.map(s=>s.visual).join(' '),scene:asset.creative_brief?.scene,seed:asset.slug});
 const plans=slides.map((s,i)=>planScene({title:s.headline,detail:s.detail,visual:s.visual,scene:s.scene||story.subject,shot:s.shot||SHOTS[i],seed:asset.slug+':'+i}));
 if(new Set(plans.map(p=>p.signature)).size!==5)throw Error('Carousel requires five distinct subject/shot combinations');
 return plans;
}
export async function renderSlide(slide,idx,asset,plan=planCarousel(asset)[idx]) {
 const ctx=createCanvas(1,1).getContext('2d');
 const heading=wrapText(ctx,slide.headline,1072,52,3);
 const detail=wrapText(ctx,slide.detail,1072,36,2);
 const detailY=Math.max(1045,905+(heading.length-1)*62+50);
 if(detailY+(detail.length-1)*44>1140)throw Error('Slide text exceeds safe area');
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200"><rect width="1200" height="1200" fill="#102d42"/><text x="64" y="58" font-family="${font}" font-size="24" letter-spacing="3" fill="#9fe0df">LINKOTEQ / ENGINEERING INSIGHTS</text><text x="1060" y="58" font-family="${font}" font-size="25" fill="#fff">0${idx+1} / 05</text><g transform="translate(50 85)">${artScene(plan)}</g><rect x="64" y="840" width="80" height="5" fill="${plan.colors[2]}"/>${svgText(heading,64,905,52,'#fff',62)}${svgText(detail,64,detailY,36,'#cce2e8',44)}</svg>`;
 const rendered=await raster(svg,1200,1200);
 const art=await raster(`<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="720">${artScene(plan)}</svg>`,1100,720);
 return {...rendered,artCanvas:art.canvas,svg,scene:plan.signature,headline:slide.headline,plan};
}
export async function renderCollage(slides,asset){
 if(slides.length!==5)throw Error('Collage requires five scenes');
 const canvas=createCanvas(1600,1200),ctx=canvas.getContext('2d');
 ctx.fillStyle='#102d42';ctx.fillRect(0,0,1600,1200);
 ctx.fillStyle='#94dcdf';ctx.font=`bold 24px ${font}`;ctx.fillText('LINKOTEQ / AI IN ENGINEERING',48,49);
 const title=wrapText(ctx,asset.title,1504,44,2);ctx.fillStyle='#fff';title.forEach((s,i)=>ctx.fillText(s,48,111+i*53));
 // Bespoke landscape composition: unwarped art only, captions typeset at final size.
 // No miniature screenshot of Instagram text is used.
 const slots=[[48,205,900,589],[980,205,572,374],[980,690,572,374],[48,900,426,279],[506,900,442,289]];
 slides.forEach((s,i)=>{const [x,y,w,h]=slots[i];ctx.drawImage(s.artCanvas,x,y,w,w*720/1100);ctx.fillStyle='#fff';const size=i===0?33:26;const caption=wrapText(ctx,s.headline,w-24,size,3);const lineHeight=size+5;const boxH=caption.length*lineHeight+20;const cy=Math.min(y+h,1180)-boxH;ctx.fillStyle='rgba(16,45,66,.96)';ctx.fillRect(x,cy,w,boxH);ctx.fillStyle='#fff';caption.forEach((t,j)=>ctx.fillText(t,x+12,cy+size+6+j*lineHeight));});
 const bytes=canvas.toBuffer('image/jpeg',90);await validateJpeg(bytes,1600,1200);return bytes;
}
