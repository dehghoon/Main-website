import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
 const toolKey = request.nextUrl.searchParams.get("tool");
 if (!toolKey || !/^[a-z0-9][a-z0-9_-]{0,99}$/i.test(toolKey))
  return NextResponse.json({error:"invalid_tool"},{status:400});
 const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
 if (!token) return NextResponse.json({error:"authentication_required"},{status:401});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL, key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if (!url||!key) return NextResponse.json({error:"not_configured"},{status:503});
 const db=createClient(url,key,{global:{headers:{Authorization:"Bearer "+token}},auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error:authError}=await db.auth.getUser(token);
 if (authError||!user) return NextResponse.json({error:"invalid_session"},{status:401});
 const {data,error}=await db.rpc("has_active_customer_beta",{p_tool_key:toolKey});
 if (error) return NextResponse.json({error:"entitlement_unavailable"},{status:503,headers:{"Cache-Control":"no-store"}});
 return NextResponse.json({active:data===true,tool:toolKey,category:"unfinished",warning:"This tool is under development and may produce incorrect results. Evaluation only; not for professional engineering decisions."},{headers:{"Cache-Control":"private, no-store"}});
}
