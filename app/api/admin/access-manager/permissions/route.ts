import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser } from "../../../../../lib/structural-labeling/server";
export const dynamic="force-dynamic";
export async function POST(request:NextRequest){
 try{
  const {supabase,user}=await requireAuthenticatedUser(request.headers.get("authorization"));
  if(user.email?.toLowerCase()!=="dehghani.pmp@gmail.com"||!user.email_confirmed_at)
   return NextResponse.json({error:"owner_required"},{status:403,headers:{"Cache-Control":"no-store"}});
  const body=await request.json();
  const email=typeof body.email==="string"?body.email.trim().toLowerCase():"";
  const permission=typeof body.permission==="string"?body.permission.trim():"";
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!permission||typeof body.enabled!=="boolean")
   return NextResponse.json({error:"invalid_permission_request"},{status:400});
  const {data:catalog,error:catalogError}=await supabase.from("platform_permission_catalog").select("permission").eq("permission",permission).eq("active",true).maybeSingle();
  if(catalogError||!catalog)return NextResponse.json({error:"unknown_permission"},{status:400});
  const {data,error}=await supabase.rpc("platform_manage_employee_permission",{p_email:email,p_permission:permission,p_enabled:body.enabled});
  if(error)return NextResponse.json({error:error.message},{status:error.message.includes("not_found")?404:error.message.includes("employee")||error.message.includes("owner")?403:502});
  return NextResponse.json({result:data},{headers:{"Cache-Control":"no-store"}});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"request_failed"},{status:401,headers:{"Cache-Control":"no-store"}});}
}
