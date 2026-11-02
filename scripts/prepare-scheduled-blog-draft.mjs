#!/usr/bin/env node
// Review-only draft preparation. Never publishes.
const key=process.env.SUPABASE_SERVICE_ROLE_KEY, ai=process.env.OPENAI_API_KEY, gh=process.env.GITHUB_TOKEN;
if(!key||!ai||!gh)throw Error("Configure SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY and GITHUB_TOKEN");
const origin="https://xssiwlwlsyxrwdbninqe.supabase.co", headers={apikey:key,authorization:"Bearer "+key};
const now=new Date(),parts=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Toronto",weekday:"short",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",hourCycle:"h23"}).formatToParts(now),p=x=>parts.find(z=>z.type===x)?.value;
if(process.env.GITHUB_EVENT_NAME==="schedule"&&(!["Mon","Wed"].includes(p("weekday"))||p("hour")!=="09"))process.exit(0);
const slug="linkoteq-review-"+p("year")+"-"+p("month")+"-"+p("day")+"-"+p("weekday").toLowerCase();
const get=async path=>{const r=await fetch(origin+"/rest/v1/"+path,{headers});if(!r.ok)throw Error("Supabase query HTTP "+r.status);return r.json()};
if((await get("blog_posts?slug=eq."+slug+"&select=id")).length){console.log("Slot already exists");process.exit(0)}
const evidence=[];
for(const repo of ["3D-Model","linkoteq-structural-core","Main-website"]){
 const r=await fetch("https://api.github.com/repos/dehghoon/"+repo+"/commits?per_page=10",{headers:{authorization:"Bearer "+gh,accept:"application/vnd.github+json","user-agent":"Linkoteq-marketing"}});
 if(!r.ok)throw Error("GitHub HTTP "+r.status);
 for(const c of await r.json())if(new Date(c.commit.committer.date)>new Date(now.getTime()-14*86400000))evidence.push({repo,sha:c.sha,url:c.html_url,subject:c.commit.message.split("\n")[0]});
}
if(!evidence.length){console.log("No recent evidence, no draft");process.exit(0)}
const instruction="Create a professional English Linkoteq engineering progress blog draft from ONLY the supplied commit subjects. A commit does not prove feature readiness or successful tests. Do not invent facts. Include evidence links and limitations in body. If insufficient engineering evidence return publishable:false. Respond JSON object with publishable,title,excerpt,body,seo_title,seo_description,linkedin_copy. Body at least 500 characters. Do not claim certifications.";
const res=await fetch("https://api.openai.com/v1/chat/completions",{method:"POST",headers:{authorization:"Bearer "+ai,"content-type":"application/json"},body:JSON.stringify({model:process.env.BLOG_DRAFT_MODEL||"gpt-4.1",response_format:{type:"json_object"},messages:[{role:"system",content:instruction},{role:"user",content:JSON.stringify(evidence)}]})});
if(!res.ok)throw Error("AI HTTP "+res.status);
const a=JSON.parse((await res.json()).choices[0].message.content);
if(!a.publishable){console.log("No evidence-backed draft");process.exit(0)}
for(const k of ["title","excerpt","body","seo_title","seo_description","linkedin_copy"])if(typeof a[k]!=="string"||!a[k].trim())throw Error("Missing "+k);
if(a.body.length<500||a.title.length>180)throw Error("Invalid article length");
const authors=await get("blog_posts?select=author_id&order=created_at.desc&limit=1");
if(!authors[0]?.author_id)throw Error("No existing author");
const save=await fetch(origin+"/rest/v1/blog_posts",{method:"POST",headers:{...headers,"content-type":"application/json",prefer:"return=representation"},body:JSON.stringify({title:a.title,excerpt:a.excerpt,body:a.body,seo_title:a.seo_title,seo_description:a.seo_description,linkedin_copy:a.linkedin_copy,slug,author_id:authors[0].author_id,status:"draft",scheduled_at:now.toISOString(),cover_image_url:null})});
if(!save.ok)throw Error("Draft save HTTP "+save.status);
console.log("Draft created for review: "+slug);
