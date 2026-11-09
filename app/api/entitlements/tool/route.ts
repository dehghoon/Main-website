import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser } from "../../../../lib/structural-labeling/server";
import { ENGINEERING_TOOLS } from "../../../../lib/tool-access/catalog";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "private, no-store" };
export async function GET(request: NextRequest) {
 const toolKey=request.nextUrl.searchParams.get("tool");
 const tool=ENGINEERING_TOOLS.find(item=>item.key===toolKey);
 if(!tool) return NextResponse.json({error:"invalid_tool"},{status:400,headers:noStore});
 let db: Awaited<ReturnType<typeof requireAuthenticatedUser>>["supabase"];
 try {
   const authenticated=await requireAuthenticatedUser(request.headers.get("authorization"));
   db=authenticated.supabase;
 } catch {
   return NextResponse.json({error:"authentication_required"},{status:401,headers:noStore});
 }
 // Customer-only endpoint. Never infer employee privileges from client claims.
 // Existing employee sign-in remains unchanged until server-verified SSO federation.
 const rpc=tool.readiness==="released"?"has_active_customer_tool_trial":"has_active_customer_beta";
 const args={p_tool_key:tool.key};
 const {data,error}=await db.rpc(rpc,args);
 if(error)return NextResponse.json({error:"entitlement_unavailable"},{status:503,headers:noStore});
 return NextResponse.json({tool:tool.key,active:data===true,accessType:tool.readiness==="released"?"trial":"beta",requestRequired:data!==true,warning:tool.readiness==="released"?null:"Under development. Evaluation only; not for professional engineering decisions."},{headers:noStore});
}
