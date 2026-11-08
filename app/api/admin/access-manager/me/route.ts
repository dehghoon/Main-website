import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export async function GET(request:NextRequest) {
 const token=request.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
 if(!token)return NextResponse.json({error:"Unauthorized"},{status:401,headers:{"Cache-Control":"no-store"}});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key)return NextResponse.json({error:"Authentication not configured"},{status:503,headers:{"Cache-Control":"no-store"}});
 const auth=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error}=await auth.auth.getUser(token);
 if(error||!user)return NextResponse.json({error:"Unauthorized"},{status:401,headers:{"Cache-Control":"no-store"}});
 if(user.email?.toLowerCase()!=="dehghani.pmp@gmail.com"||!user.email_confirmed_at)
  return NextResponse.json({error:"You don't have access to this page."},{status:403,headers:{"Cache-Control":"no-store"}});
 return NextResponse.json({role:"owner",permissions:["access_manager.manage"]},{headers:{"Cache-Control":"private, no-store"}});
}
