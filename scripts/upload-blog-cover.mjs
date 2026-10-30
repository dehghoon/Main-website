#!/usr/bin/env node
// Upload an existing locally-rendered JPEG via authenticated Supabase Storage API.
// Uses only GitHub Actions encrypted secret; never prints the key.
import {readFile} from "node:fs/promises";
const project="https://xssiwlwlsyxrwdbninqe.supabase.co";
const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
const id=process.env.POST_ID||"";
const slug=process.env.SLUG||"";
if(!key)throw Error("Configure GitHub Actions secret SUPABASE_SERVICE_ROLE_KEY");
if(!/^[0-9a-f-]{36}$/i.test(id)||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))throw Error("Invalid post ID or slug");
const headers={apikey:key,authorization:"Bearer "+key};
const read=await fetch(project+"/rest/v1/blog_posts?id=eq."+encodeURIComponent(id)+"&select=id,slug,status,cover_image_url",{headers});
if(!read.ok)throw Error("Draft lookup failed HTTP "+read.status);
const rows=await read.json();
if(rows.length!==1||rows[0].status!=="draft"||rows[0].slug!==slug||rows[0].cover_image_url)throw Error("Draft missing, not draft, or already has a cover");
const bytes=await readFile("public/blog/covers/"+slug+".jpg");
if(bytes.length<1024||bytes.length>8*1024*1024)throw Error("JPEG size out of range");
const path="featured/"+id+"/"+slug+".jpg";
const upload=await fetch(project+"/storage/v1/object/blog-media/"+path,{method:"POST",headers:{...headers,"content-type":"image/jpeg","cache-control":"3600","x-upsert":"false"},body:bytes});
if(!upload.ok)throw Error("Storage upload failed HTTP "+upload.status);
const publicUrl=project+"/storage/v1/object/public/blog-media/"+path;
const update=await fetch(project+"/rest/v1/blog_posts?id=eq."+encodeURIComponent(id)+"&status=eq.draft&cover_image_url=is.null",{method:"PATCH",headers:{...headers,"content-type":"application/json",prefer:"return=representation"},body:JSON.stringify({cover_image_url:publicUrl})});
let updated=[];
if(update.ok){try{updated=await update.json();}catch{}}
if(!update.ok||updated.length!==1){
  const cleanup=await fetch(project+"/storage/v1/object/blog-media/"+path,{method:"DELETE",headers});
  if(!cleanup.ok)console.error("Orphan cleanup failed HTTP "+cleanup.status+" for "+path);
  throw Error("Draft changed or update failed; cover upload reverted where possible");
}
console.log(JSON.stringify({ok:true,post_id:id,cover_image_url:publicUrl}));
