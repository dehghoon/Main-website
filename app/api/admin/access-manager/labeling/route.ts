import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuthenticatedUser } from "../../../../lib/structural-labeling/server";

export const dynamic = "force-dynamic";
const OWNER_EMAIL = "dehghani.pmp@gmail.com";
const allowed = new Set(["labeling.workspace","labeling.upload","labeling.annotate","labeling.submit"]);

async function owner(request: NextRequest) {
  const token=request.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
  if(!token) return null;
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if(!url||!key) throw new Error("auth_not_configured");
  const auth=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:{user},error}=await auth.auth.getUser(token);
  if(error||!user||user.email?.toLowerCase()!==OWNER_EMAIL||!user.email_confirmed_at) return null;
  return requireAuthenticatedUser(request.headers.get("authorization"));
}
function fail(error:unknown) {
  const message=error instanceof Error?error.message:"request_failed";
  return NextResponse.json({error:message},{status:message==="auth_not_configured"?503:502,headers:{"Cache-Control":"no-store"}});
}
export async function GET(request:NextRequest) {
  try {
    const ctx=await owner(request);
    if(!ctx)return NextResponse.json({error:"You don't have access to this page."},{status:403});
    const {data,error}=await ctx.supabase.rpc("labeling_list_employee_permissions");
    if(error)throw error;
    return NextResponse.json({employees:data??[]},{headers:{"Cache-Control":"private, no-store"}});
  }catch(e){return fail(e);}
}
export async function POST(request:NextRequest) {
  try {
    const ctx=await owner(request);
    if(!ctx)return NextResponse.json({error:"You don't have access to this page."},{status:403});
    const body=await request.json();
    const email=typeof body.email==="string"?body.email.trim():"";
    const permission=typeof body.permission==="string"?body.permission:"";
    if(!email||!allowed.has(permission)||typeof body.enabled!=="boolean")
      return NextResponse.json({error:"invalid_permission_request"},{status:400});
    const {data,error}=await ctx.supabase.rpc("labeling_manage_employee_permission",{p_email:email,p_permission:permission,p_enabled:body.enabled});
    if(error)throw error;
    return NextResponse.json({employee:Array.isArray(data)?data[0]??null:data??null},{headers:{"Cache-Control":"no-store"}});
  }catch(e){return fail(e);}
}
