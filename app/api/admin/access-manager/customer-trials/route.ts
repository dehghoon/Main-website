import { ENGINEERING_TOOLS } from "../../../../../lib/tool-access/catalog";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
 const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
 if (!token) return NextResponse.json({error:"unauthorized"},{status:401});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL, key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if (!url||!key) return NextResponse.json({error:"not_configured"},{status:503});
 const db=createClient(url,key,{global:{headers:{Authorization:"Bearer "+token}},auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error:authError}=await db.auth.getUser(token);
 if(authError||!user) return NextResponse.json({error:"unauthorized"},{status:401});
 if(user.email?.toLowerCase()!=="dehghani.pmp@gmail.com"||!user.email_confirmed_at)
  return NextResponse.json({error:"owner_required"},{status:403});
 let body:Record<string,unknown>;
 try {body=await request.json();} catch {return NextResponse.json({error:"invalid_json"},{status:400});}
 const action=body.action;
 if(!["grant","extend","revoke"].includes(String(action))||
 typeof body.customerId!=="string"||!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(body.customerId))
  return NextResponse.json({error:"invalid_request"},{status:400});
 const date=(v:unknown)=>typeof v==="string"&&Number.isFinite(Date.parse(v))?new Date(v).toISOString():null;
 const starts=date(body.startsAt),expires=date(body.expiresAt);
 if(action==="grant"&&(!starts||!expires||starts>=expires))return NextResponse.json({error:"invalid_dates"},{status:400});
 if(action==="extend"&&!expires)return NextResponse.json({error:"invalid_expiry"},{status:400});
 const isBeta=body.accessType==="beta";
 if(action==="grant"&&!isBeta && (!starts || !expires || Date.parse(expires)-Date.parse(starts)!==30*24*60*60*1000)) return NextResponse.json({error:"trial_must_be_30_days"},{status:400});
 const tool = ENGINEERING_TOOLS.find(item=>item.key===body.toolKey);
 if (body.accessType!=="beta" && body.accessType!=="released") return NextResponse.json({error:"invalid_access_type"},{status:400});
 if (!tool || (isBeta ? tool.readiness==="released" : tool.readiness!=="released")) return NextResponse.json({error:"tool_access_type_mismatch"},{status:400});
 if(isBeta && (typeof body.toolKey!=="string"||!/^[a-z0-9][a-z0-9_-]{0,99}$/i.test(body.toolKey)||action==="extend"))
  return NextResponse.json({error:"invalid_beta_request"},{status:400});
 const {data,error}=await db.rpc(isBeta?"owner_manage_customer_beta":action==="grant"?"owner_grant_customer_tool_trial":"owner_manage_customer_trial",{
 p_customer_id:body.customerId,p_starts_at:starts,p_expires_at:expires,
 p_action:action,p_grant_id:typeof body.grantId==="string"?body.grantId:null,
 ...((isBeta || action==="grant")?{p_tool_key:body.toolKey}:{})
 });
 if(error)return NextResponse.json({error:"trial_change_rejected",detail:error.message},{status:409,headers:{"Cache-Control":"no-store"}});
 return NextResponse.json({grantId:data},{headers:{"Cache-Control":"private, no-store"}});
}
