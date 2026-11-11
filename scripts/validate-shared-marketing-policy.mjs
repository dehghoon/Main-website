import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
export function validateSharedMarketingPolicy(workflow) {
 const read=p=>JSON.parse(readFileSync(resolve(p),'utf8'));
 const policy=read('contracts/marketing/seo-conversion-v1.json');
 const c=read(workflow);
 const fail=msg=>{throw Error('SHARED MARKETING CONTRACT: '+msg)};
 if(policy.contract_id!=='linkoteq-marketing-seo-conversion'||!/^1\./.test(policy.version))fail('Missing or incompatible shared policy');
 if(c.shared_marketing_policy?.path!=='contracts/marketing/seo-conversion-v1.json'||c.shared_marketing_policy?.major_version!==1||c.shared_marketing_policy?.required_for_future_content!==true)fail('Workflow does not require shared policy');
 for(const k of ['articles','tools','social'])if(!Array.isArray(policy.seo?.[k])||!policy.seo[k].length)fail('Missing SEO policy '+k);
 if(policy.access?.starter_requires_login!==true||policy.access?.paid_plans_active!==false||policy.access?.no_access_control_changes!==true)fail('Access policy changed');
 if(policy.governance?.plugin_mutation!==false)fail('Plugin changes prohibited');
 if(policy.automation?.blog_requires_owner_publish!==true||policy.automation?.no_duplicates!==true)fail('Publication guard missing');
 if(policy.automation?.instagram_slides?.count!==5||policy.automation?.blog_hero?.join('x')!=='1200x630')fail('Image specification mismatch');
 return true;
}
