import {SUBJECTS,SHOTS} from './editorial-vector-scenes.mjs';
export function validateEditorialImagePolicy(contract,kind){
 const e=contract.image_engine;
 const require=(ok,message)=>{if(!ok)throw Error('EDITORIAL IMAGE POLICY: '+message);};
 require(e?.id==='linkoteq-editorial-svg'&&e.version===2,'Expected SVG engine v2');
 require(e.scene_module==='scripts/editorial-vector-scenes.mjs'&&e.renderer_module==='scripts/editorial-media.mjs','Incorrect shared modules');
 require(JSON.stringify(e.supported_subjects)===JSON.stringify(Object.keys(SUBJECTS)),'Subject catalog differs from renderer');
 require(JSON.stringify(e.narrative_shots)===JSON.stringify(SHOTS),'Narrative shots differ from renderer');
 require(e.quality_gate==='npm run test:editorial','Missing image acceptance gate');
 for(const key of ['no_paid_image_api','no_latest_core_dependency','preserve_historical_assets'])require(e[key]===true,'Missing '+key);
 if(kind==='blog'){
  require(contract.workflow?.file==='.github/workflows/scheduled-blog-draft-covers.yml','Incorrect blog workflow');
  require(contract.workflow?.input_context?.includes('body'),'Full article body is required');
  require(contract.workflow?.dimensions?.join('x')==='1200x630','Incorrect blog dimensions');
 }else if(kind==='news'){
  require(contract.creative_brief_policy?.slide_count===5,'Exactly five new-story slides required');
  require(JSON.stringify(contract.creative_brief_policy?.shot_order)===JSON.stringify(SHOTS),'Incorrect brief shot order');
  require(contract.schema?.collage_dimensions?.join('x')==='1600x1200','Incorrect collage dimensions');
 }else throw Error('Unknown image policy kind');
}
