import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser } from "../../../../../lib/structural-labeling/server";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest) {
 try {
  const {supabase,user}=await requireAuthenticatedUser(request.headers.get("authorization"));
  if(user.email?.toLowerCase()!=="dehghani.pmp@gmail.com"||!user.email_confirmed_at)
   return NextResponse.json({error:"You don't have access to this page."},{status:403,headers:{"Cache-Control":"no-store"}});
  const {data,error}=await supabase.from("profiles").select("id,full_name,email,role").order("full_name");
  if(error) return NextResponse.json({error:"Unable to read Timesheet profiles"},{status:502,headers:{"Cache-Control":"no-store"}});
  return NextResponse.json({profiles:data??[],readOnly:true},{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return NextResponse.json({error:"Authentication unavailable"},{status:401,headers:{"Cache-Control":"no-store"}});}
}
