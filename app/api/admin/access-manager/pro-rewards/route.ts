import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const dynamic="force-dynamic";
function response(data:unknown,status=200){return NextResponse.json(data,{status,headers:{"Cache-Control":"private, no-store"}});}
async function ownerDb(request:NextRequest){
 const token=request.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
 if(!token)return null;
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key)return null;
 const db=createClient(url,key,{global:{headers:{Authorization:"Bearer "+token}},auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error}=await db.auth.getUser(token);
 if(error||!user||user.email?.toLowerCase()!=="dehghani.pmp@gmail.com"||!user.email_confirmed_at)return null;
 return db;
}
export async function GET(request:NextRequest){
 const db=await ownerDb(request);if(!db)return response({error:"owner_required"},403);
 // This RPC must be deployed before listing requests; fail closed otherwise.
 const {data,error}=await db.rpc("owner_list_discovery_rewards");
 if(error)return response({error:"reward_list_unavailable"},503);
 return response({requests:data??[]});
}
export async function POST(request:NextRequest){
 const db=await ownerDb(request);if(!db)return response({error:"owner_required"},403);
 let body:Record<string,unknown>;
 try{body=await request.json();}catch{return response({error:"invalid_json"},400);}
 if(typeof body.userId!=="string"||!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(body.userId)||!["verify","reject","activate"].includes(String(body.decision)))return response({error:"invalid_request"},400);
 if(body.decision==="verify" && (typeof body.reason!=="string" || body.reason.trim().length<10))
  return response({error:"survey_verification_note_required"},400);
 const {data,error}=await db.rpc("owner_review_discovery_reward",{p_user_id:body.userId,p_decision:body.decision,p_reason:typeof body.reason==="string"?body.reason.slice(0,1000):null});
 if(error)return response({error:"reward_review_rejected",detail:error.message},409);
 return response({status:data});
}
