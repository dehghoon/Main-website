import { NextRequest,NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store"};
function session(request:NextRequest){
 const token=request.headers.get("authorization")?.match(/^Bearer (\S+)$/i)?.[1];
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 return token&&url&&key?{token,db:createClient(url,key,{global:{headers:{Authorization:"Bearer "+token}},auth:{persistSession:false,autoRefreshToken:false}})}:null;
}
async function owner(request:NextRequest){
 const s=session(request);if(!s)return null;
 const {data:{user},error}=await s.db.auth.getUser(s.token);
 if(error||!user||user.email?.toLowerCase()!=="dehghani.pmp@gmail.com"||!user.email_confirmed_at)return null;
 return s.db;
}
export async function GET(request:NextRequest){
 const db=await owner(request);if(!db)return NextResponse.json({error:"owner_required"},{status:403,headers});
 const {data,error}=await db.from("customer_tool_access_requests").select("id,customer_id,tool_key,access_type,status,created_at").eq("status","pending").order("created_at",{ascending:true}).limit(100);
 if(error)return NextResponse.json({error:"requests_unavailable"},{status:503,headers});
 return NextResponse.json({requests:data??[]},{headers});
}
export async function POST(request:NextRequest){
 const db=await owner(request);if(!db)return NextResponse.json({error:"owner_required"},{status:403,headers});
 let body:unknown;try{body=await request.json();}catch{return NextResponse.json({error:"invalid_json"},{status:400,headers});}
 if(!body||typeof body!=="object")return NextResponse.json({error:"invalid_request"},{status:400,headers});
 const {requestId,decision}=body as Record<string,unknown>;
 if(typeof requestId!=="string"||!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(requestId)||!["approve","reject"].includes(String(decision)))return NextResponse.json({error:"invalid_request"},{status:400,headers});
 const {data,error}=await db.rpc("owner_review_customer_tool_request",{p_request_id:requestId,p_decision:decision});
 if(error)return NextResponse.json({error:"review_failed",detail:error.message},{status:409,headers});
 return NextResponse.json({grantId:data??null,status:decision==="approve"?"approved":"rejected"},{headers});
}
