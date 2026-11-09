// Original SVG editorial art. No remote assets, paid APIs or Core dependency.
// A subject describes the engineering operation; a shot describes its story role.
import {createHash} from 'node:crypto';
export const SUBJECTS = {
 bridge: {label:'Bridge inspection', cues:[/bridge|viaduct/g,/crack|corrosion|bearing|inspection|inspect/g], colors:['#194e64','#61d9d0','#f6b95d']},
 timber: {label:'Timber fabrication', cues:[/timber|wood|clt|glulam/g,/robot|fabricat|cnc|joinery|cutting/g], colors:['#294b49','#98dac1','#e7aa65']},
 concrete: {label:'Concrete mix laboratory', cues:[/concrete|cement|clinker/g,/carbon|mix|curing|batch|emission/g], colors:['#365350','#a7dca0','#ffc172']},
 coordination: {label:'BIM coordination', cues:[/bim|mep|clash/g,/duct|pipe|coordination|routing|clearance/g], colors:['#233f68','#65d4e5','#ff9c78']},
 flood: {label:'Urban flood modelling', cues:[/flood|stormwater|drainage|runoff/g,/rain|water|catchment|culvert|hydraulic/g], colors:['#24496b','#83d4fc','#f5bc62']},
 drawings: {label:'Drawing extraction', cues:[/drawing|blueprint|pdf|ocr/g,/extract|dimension|schedule|sheet|scan|recognition/g], colors:['#443f69','#c5b4fa','#f2b86f']},
 joist: {label:'Joist framing', cues:[/joist|truss/g,/bay|spacing|span|roof|framing/g], colors:['#263f57','#77dad8','#ffbf7e']},
 import: {label:'Model conversion', cues:[/sap2000|etabs|staad|ifc|interoperability|convert|import/g,/units|axes|mapping|model|source|fidelity/g], colors:['#394b6b','#83c8ff','#edb180']},
 site: {label:'Construction progress', cues:[/construction|jobsite|earthcam|site camera/g,/progress|crane|camera|schedule|tracking/g], colors:['#394b60','#8cd9de','#f4b56d']},
 structure: {label:'Structural engineering', cues:[/structural|steel|beam|column|frame/g,/load|deflection|design|section|analysis|model/g], colors:['#303f65','#83d9f0','#efaf82']}
};
export const SHOTS=['context','detail','process','review','outcome'];
export const escapeXml=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;');
const plain=s=>String(s??'').replace(/<[^>]*>/g,' ').toLowerCase();
export function planScene({title='',body='',visual='',detail='',scene,shot='context',seed=''}={}) {
 if(!SHOTS.includes(shot))throw Error('Unsupported editorial shot: '+shot);
 if(scene&&!SUBJECTS[scene])throw Error('Unsupported editorial scene: '+scene);
 const lead=plain(title+' '+visual),context=plain(body+' '+detail);
 const scores=Object.entries(SUBJECTS).map(([id,s])=>{
  const count=(text,re)=>Math.min(4,[...text.matchAll(new RegExp(re.source,'g'))].length);
  // Require the actual subject; words such as AI, engineer and software never select art.
  const anchors=count(lead,s.cues[0])*4+count(context,s.cues[0]);
  return {id,score:anchors?anchors+count(lead+' '+context,s.cues[1])*2:0};
 }).sort((a,b)=>b.score-a.score);
 const subject=scene||scores[0].id;
 if(!scene&&!scores[0].score)throw Error('No supported engineering subject: provide a specific visual brief or scene');
 const evidence=plain(visual||detail||title).slice(0,240);
 const features={drone:/drone|aerial/.test(lead+' '+context),rain:/rain|storm/.test(lead+' '+context),scan:/scan|extract|ocr/.test(lead+' '+context)};
 return {subject,shot,seed:seed||title,evidence,features,colors:SUBJECTS[subject].colors,signature:subject+':'+shot};
}
// Compatibility for older callers; now scores context rather than first-match regex.
export function chooseTheme(text){return planScene({title:text}).subject;}
export const themes=Object.keys(SUBJECTS);
const p=(x,y,z=0)=>[550+(x-y)*.85,170+(x+y)*.39-z];
const pts=a=>a.map(q=>p(...q).map(n=>n.toFixed(1)).join(',')).join(' ');
const poly=(a,fill,stroke='#17374b',width=1.6)=>`<polygon points="${pts(a)}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round"/>`;
const line=(a,b,color='#cce4e8',w=4)=>`<path d="M${p(...a)}L${p(...b)}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>`;
function box(x,y,z,w,d,h,c='#b5c9cb') {
 return poly([[x,y,z+h],[x+w,y,z+h],[x+w,y+d,z+h],[x,y+d,z+h]],c)+poly([[x,y,z],[x,y+d,z],[x,y+d,z+h],[x,y,z+h]],'#335367')+poly([[x,y+d,z],[x+w,y+d,z],[x+w,y+d,z+h],[x,y+d,z+h]],c);
}
function beam(a,b,c='#f4b56d',w=10){return line(a,b,'#193c52',w+5)+line(a,b,c,w)+line(a.map((v,i)=>i===2?v+3:v),b.map((v,i)=>i===2?v+3:v),'#fff1c5',2);}
function person(x,y,vest='#ffb45d',scale=1) {
 const [a,b]=p(x,y);return `<g transform="translate(${a} ${b}) scale(${scale})"><ellipse cy="4" rx="19" ry="7" fill="#092638" opacity=".22"/><path d="M-9 -26L-12 0M8 -26L12 0" stroke="#253d5a" stroke-width="9" stroke-linecap="round"/><path d="M-11 -59L-19 -35M11 -59L24 -45" stroke="#e6b795" stroke-width="8" stroke-linecap="round"/><path d="M-11 -65H11L15 -26H-15Z" fill="${vest}" stroke="#324962" stroke-width="2"/><path d="M-8 -63V-30M8 -63V-30M-12 -40H12" stroke="#fff6bd" stroke-width="3"/><circle cy="-77" r="12" fill="#d8a282"/><path d="M-14 -80Q-12 -101 10 -91L15 -80Z" fill="#fff0c4"/><path d="M-18 -80H18" stroke="#edc46a" stroke-width="5"/><path d="M18 -48L35 -54L38 -34L23 -30Z" fill="#244a64" stroke="#9cdae6" stroke-width="2"/></g>`;
}
function tree(x,y){const [a,b]=p(x,y);return `<g transform="translate(${a} ${b})"><ellipse rx="27" ry="10" fill="#143b4a" opacity=".15"/><path d="M0 0V-65" stroke="#827155" stroke-width="7"/><ellipse cy="-75" rx="30" ry="39" fill="#508e78"/><ellipse cx="-12" cy="-85" rx="19" ry="26" fill="#8bc5a0"/></g>`;}
function frame({joist=false,clash=false,ghost=false}={}) {
 let s='';for(const y of [60,270])for(const x of [50,240,430])s+=box(x,y,0,12,12,205,ghost?'#b8d7e4':'#dfac79');
 for(const z of [100,205]){for(const y of [60,270])s+=beam([50,y,z],[440,y,z]);for(const x of [50,240,430])s+=beam([x,60,z],[x,282,z]);}
 if(joist)for(let x=65;x<430;x+=45){s+=beam([x,60,218],[x,282,218],'#aee5df',4)+beam([x,60,198],[x,282,198],'#79c6d1',3);for(let y=60;y<270;y+=35)s+=line([x,y,218],[x,y+17,198],'#edf0c2',2)+line([x,y+17,198],[x,y+35,218],'#edf0c2',2);}
 if(clash){s+=beam([0,165,155],[470,165,155],'#73d8f6',24)+beam([240,0,155],[240,340,155],'#ff8877',17);const [cx,cy]=p(240,165,155);s+=`<circle cx="${cx}" cy="${cy}" r="33" fill="#ff725f" fill-opacity=".18" stroke="#ffdc8b" stroke-width="4" stroke-dasharray="7 6"/>`;}
 return s;
}
function bridge(){let s=poly([[0,70,0],[520,70,0],[520,340,0],[0,340,0]],'#56a5bc');for(let y=100;y<330;y+=45)s+=line([10,y,1],[500,y,1],'#a8e4e8',2);for(const x of [90,350])s+=box(x,140,0,35,120,110,'#afc3cb');s+=box(-30,100,110,570,180,18,'#c6d4d6');s+=poly([[-30,120,129],[540,120,129],[540,260,129],[-30,260,129]],'#496276');for(let x=0;x<530;x+=70)s+=line([x,190,130],[x+34,190,130],'#fff2b5',4);for(const y of [100,280]){s+=beam([-30,y,160],[540,y,160],'#91d5df',5);for(let x=-20;x<540;x+=45)s+=line([x,y,130],[x,y,160],'#e1eef0',3);}s+=line([270,281,117],[279,281,108],'#bf634f',3)+line([279,281,108],[274,281,98],'#bf634f',3);return s;}
function timber(){let s=box(20,60,0,360,180,35,'#b17a4f');for(let x=25;x<370;x+=38){s+=box(x,65,35,28,165,18,'#e7b87a');s+=line([x+8,70,54],[x+8,220,54],'#996d48',1.5);}s+=box(390,110,0,90,90,30,'#538e9a');const joints=[[435,155,30],[435,155,140],[330,130,220],[260,130,135]];for(let i=0;i<3;i++)s+=beam(joints[i],joints[i+1],'#f2a760',23);for(const j of joints){const [x,y]=p(...j);s+=`<circle cx="${x}" cy="${y}" r="16" fill="#275469" stroke="#9ac9cd" stroke-width="5"/>`;}s+=line(joints[3],[260,130,70],'#d9f9f5',8);for(let i=0;i<3;i++)s+=box(60+i*20,300+i*12,0,220,24,15,'#d7ab76');return s;}
function concrete(){let s=box(70,60,0,300,145,80,'#c6d7d5');for(let i=0;i<4;i++){s+=box(90+i*65,80,80,45,70,10,['#e9cb96','#99b8b8','#d2d0c1','#a5c5b2'][i]);const [x,y]=p(110+i*65,115,99);s+=`<ellipse cx="${x}" cy="${y}" rx="16" ry="9" fill="#6d827c"/>`; }for(let i=0;i<3;i++){const [x,y]=p(120+i*85,290,0);s+=`<path d="M${x-23} ${y}v-65h46v65" fill="${['#b7c2bb','#b2cab7','#96b5a0'][i]}" stroke="#54716d" stroke-width="2"/><ellipse cx="${x}" cy="${y-65}" rx="23" ry="12" fill="#d8ded2"/><ellipse cx="${x}" cy="${y}" rx="23" ry="11" fill="#96aaa4"/>`; }s+=box(420,80,0,75,95,140,'#76a9b1');s+=poly([[425,176,45],[488,176,45],[488,176,120],[425,176,120]],'#173e55');return s;}
function flood(){let s=poly([[0,0,1],[500,0,1],[500,360,1],[0,360,1]],'#84b1a5');s+=poly([[200,0,3],[300,0,3],[390,360,3],[270,360,3]],'#59b4d4');for(const [x,y,w,d,h] of [[20,30,95,70,85],[340,35,95,80,120],[40,220,110,80,55],[400,250,65,65,80]]){s+=box(x,y,3,w,d,h,'#cfdbd7');for(let a=10;a<w-10;a+=25)s+=line([x+a,y+d+1,h-20],[x+a,y+d+1,h-40],'#5f9aad',10);}for(let y=15;y<340;y+=55)s+=line([230+y*.2,y,7],[255+y*.2,y+28,7],'#c6f3f6',5);s+=box(180,260,5,65,25,20,'#7e9395');return s;}
function drawings(){let s=box(20,60,0,420,270,62,'#9db7c0');s+=poly([[40,80,64],[420,80,64],[420,310,64],[40,310,64]],'#eef0d7');for(let x=60;x<400;x+=65)s+=line([x,100,65],[x,275,65],'#92b4ba',1.2);for(let y=100;y<290;y+=45)s+=line([60,y,65],[395,y,65],'#92b4ba',1.2);s+=poly([[90,130,66],[330,130,66],[330,235,66],[210,235,66],[210,270,66],[90,270,66]],'none','#426a7b',4);s+=line([200,130,67],[200,235,67],'#426a7b',3);s+=box(400,90,65,15,190,12,'#67bfc6');s+=poly([[390,90,67],[420,90,67],[420,280,67],[390,280,67]],'#77d7c8');s+=box(300,360,0,180,60,25,'#d9bd8e');return s;}
function site(){let s=frame();s+=box(-20,320,0,60,60,15,'#c2b09b');s+=beam([10,350,15],[10,350,360],'#e9b658',10)+beam([-60,350,360],[400,350,360],'#e9b658',10)+line([10,350,400],[400,350,360],'#ffe5a4',3)+line([260,350,360],[260,350,240],'#dce7db',3);s+=box(240,330,210,60,45,25,'#b5cdd5');return s;}
function monitor(x=740,y=120,subject='structure') {
 const diagrams={
  bridge:'<path d="M20 100L30 65H166L178 100M50 65V120M145 65V120M25 80H170"/>',
  timber:'<path d="M20 70H175V95H20ZM80 45H110V120H80Z"/>',
  concrete:'<path d="M25 55H55V116H25ZM80 55H110V116H80ZM135 55H165V116H135Z"/>',
  flood:'<path d="M20 55Q60 90 20 120M60 55Q100 90 60 120M100 55Q140 90 100 120M140 55Q180 90 140 120"/>',
  drawings:'<path d="M20 55H175V120H20ZM95 55V120M95 90H175"/>',
  coordination:'<path d="M20 65H175V83H20ZM85 45H105V125H85Z"/>',
 };
 return `<g transform="translate(${x} ${y})"><path d="M0 0H195V145H0Z" fill="#153e56" stroke="#83c6d5" stroke-width="5"/><path d="M80 145v28H140" fill="none" stroke="#6596a7" stroke-width="9"/><path d="M14 22H177M14 32H110" stroke="#8bc3cd" stroke-width="4"/><g fill="none" stroke="#eacb92" stroke-width="3">${diagrams[subject]||diagrams.coordination}</g><circle cx="167" cy="20" r="5" fill="#fac27b"/></g>`;
}
function drone(){return '<g transform="translate(345 110)"><ellipse cy="65" rx="56" ry="12" fill="#103044" opacity=".12"/><path d="M-40 -15L40 15M-40 15L40 -15" stroke="#d9e9e2" stroke-width="8"/><rect x="-15" y="-10" width="30" height="22" rx="8" fill="#f2b563"/><circle cy="15" r="9" fill="#183e54"/>'+[-40,40].flatMap(x=>[-15,15].map(y=>`<ellipse cx="${x}" cy="${y}" rx="23" ry="7" fill="none" stroke="#a7dbdb" stroke-width="3"/>`)).join('')+'</g>';}
function detail(subject){
 const panel='<path d="M280 180L550 35L845 180L570 335Z" fill="#dde8e3" stroke="#8fb4bc" stroke-width="4"/>';
 if(subject==='bridge')return panel+'<path d="M310 180L550 65L810 182L570 298Z" fill="#849b9f"/><path d="M470 110l40 46-27 34 65 30-25 42" fill="none" stroke="#3e4d57" stroke-width="12"/><path d="M455 105l40 46-27 34 65 30-25 42" fill="none" stroke="#ffbd77" stroke-width="3"/><ellipse cx="530" cy="185" rx="125" ry="94" fill="none" stroke="#79d8e4" stroke-width="7" stroke-dasharray="10 7"/>';
 if(subject==='timber'||subject==='joist')return beam([30,170,60],[470,170,60],'#e9b77b',45)+beam([245,10,65],[245,330,65],'#bcdedb',28)+[120,170,220].map(y=>line([245,y,95],[245,y,60],'#284f64',7)).join('');
 if(subject==='concrete')return `<g transform="translate(-150 -30) scale(1.25)">${concrete()}</g>`;
 if(subject==='flood')return box(80,80,0,330,210,25,'#afc4c3')+box(160,160,25,170,80,16,'#456f80')+Array.from({length:8},(_,i)=>beam([175+i*19,160,46],[175+i*19,240,46],'#cad8d5',6)).join('')+poly([[30,20,28],[450,20,28],[450,130,28],[30,130,28]],'#65b9d3');
 if(subject==='drawings')return `<g transform="translate(-150 -40) scale(1.25)">${drawings()}</g>`;
 if(subject==='coordination')return beam([30,160,75],[480,160,75],'#73d8f6',50)+beam([250,20,75],[250,330,75],'#ff8877',37)+`<ellipse cx="625" cy="255" rx="88" ry="64" fill="none" stroke="#ffe8a5" stroke-width="5" stroke-dasharray="10 8"/>`;
 return frame({clash:subject==='coordination',joist:subject==='joist'});
}
export function artScene(input,seed='',accent,warm) {
 const plan=typeof input==='string'?planScene({scene:input,seed}):input;
 const {subject,shot}=plan;if(!SUBJECTS[subject]||!SHOTS.includes(shot))throw Error('Invalid scene plan');
 const [bg,c,a]=plan.colors||SUBJECTS[subject].colors;
 const id='s'+createHash('sha256').update(subject+shot+plan.seed).digest('hex').slice(0,10);
 const world=()=>({bridge, timber,concrete,flood,drawings,site,coordination:()=>frame({clash:true}),joist:()=>frame({joist:true}),import:()=>frame({ghost:true}),structure:()=>frame()})[subject]();
 const slab=box(-60,-30,-20,630,480,20,'#8daeb0');
 const indoor=['timber','concrete','drawings','coordination','import'].includes(subject);
 const environment=indoor?box(-40,-20,0,560,8,195,'#7eaaad')+box(-40,-20,0,8,310,195,'#93bfc0'):tree(-30,30);
 let art='';
 if(shot==='context')art=slab+environment+world()+person(500,310)+person(390,405,'#82d6e4')+(indoor?'':tree(530,60));
 if(shot==='detail')art=slab+detail(subject)+person(510,380)+monitor(780,55,subject);
 if(shot==='process')art=`<g transform="translate(-15 75) scale(.84)">${slab+environment+world()}</g>`+monitor(790,70,subject)+person(500,370,'#8dc4ef')+`<path d="M800 295Q950 390 830 470" fill="none" stroke="${a}" stroke-width="4" stroke-dasharray="9 8"/>`;
 if(shot==='review')art=`<g transform="translate(180 0) scale(.7)">${slab+world()}</g>`+box(90,330,0,270,135,55,'#ceb990')+poly([[110,350,57],[320,350,57],[320,445,57],[110,445,57]],'#e7eadc')+person(80,410,'#88cddc',1.3)+person(380,410,'#f3b56f',1.3)+person(240,500,'#a6c3eb',1.2)+monitor(140,155,subject);
 if(shot==='outcome')art=`<g transform="translate(280 80) scale(.72)">${slab+world()}</g>`+box(0,320,0,260,180,50,'#b7c9c5')+poly([[10,330,52],[245,330,52],[245,485,52],[10,485,52]],'#e8ead5')+person(-20,420)+person(280,450,'#99c9da')+monitor(110,100,subject);
 if(plan.features?.drone&&['context','process'].includes(shot))art+=drone();
 const layout={context:'translate(0 80) scale(1)',detail:'translate(-30 80) scale(1.08)',process:'translate(-60 100) scale(.97)',review:'translate(0 115) scale(1)',outcome:'translate(10 95) scale(.98)'}[shot];
 return `<g data-subject="${subject}" data-shot="${shot}" aria-label="${escapeXml(SUBJECTS[subject].label+' / '+shot)}"><defs><linearGradient id="${id}sky" x2="0" y2="1"><stop stop-color="${bg}"/><stop offset="1" stop-color="#85aeb6"/></linearGradient><radialGradient id="${id}light"><stop stop-color="${a}" stop-opacity=".38"/><stop offset="1" stop-color="${a}" stop-opacity="0"/></radialGradient></defs><rect width="1100" height="720" rx="26" fill="url(#${id}sky)"/><circle cx="850" cy="150" r="340" fill="url(#${id}light)"/><path d="M0 470L260 355L480 435L780 280L1100 395V720H0Z" fill="#c2dbd9" opacity=".12"/><g opacity=".15" fill="${c}">${[0,1,2,3,4].map(i=>`<path d="M${40+i*220} 430v-${50+i%3*30}h100v160h-100Z"/>`).join('')}</g><ellipse cx="570" cy="575" rx="380" ry="95" fill="#0e2d40" opacity=".24"/><g transform="${layout}">${art}</g></g>`;
}
