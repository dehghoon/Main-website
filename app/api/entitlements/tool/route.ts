import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ENGINEERING_TOOLS } from "../../../../lib/tool-access/catalog";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "private, no-store" };
export async function GET(request: NextRequest) {
 const toolKey=request.nextUrl.searchParams.get("tool");
 const tool=ENGINEERING_TOOLS.find(item=>item.key===toolKey);
 if(!tool) return NextResponse.json({error:"invalid_tool"},{status:400,headers:noStore});
 const token=request.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
 if(!token)return NextResponse.json({error:"authentication_required"},{status:401,headers:noStore});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key)return NextResponse.json({error:"not_configured"},{status:503,headers:noStore});
 const db=createClient(url,key,{global:{headers:{Authorization:"Bearer "+token}},auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error:authError}=await db.auth.getUser(token);
 if(authError||!user)return NextResponse.json({error:"invalid_session"},{status:401,headers:noStore});
 // Customer-only endpoint. Never infer employee privileges from client claims.
 // Existing employee sign-in remains unchanged until server-verified SSO federation.
 const rpc=tool.readiness==="released"?"has_active_customer_trial":"has_active_customer_beta";
 const args=tool.readiness==="released"?{}:{p_tool_key:tool.key};
 const {data,error}=await db.rpc(rpc,args);
 if(error)return NextResponse.json({error:"entitlement_unavailable"},{status:503,headers:noStore});
 return NextResponse.json({tool:tool.key,active:data===true,accessType:tool.readiness==="released"?"trial":"beta",requestRequired:data!==true,warning:tool.readiness==="released"?null:"Under development. Evaluation only; not for professional engineering decisions."},{headers:noStore});
}
