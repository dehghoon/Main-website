import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser } from "../../../../../lib/structural-labeling/server";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest){
 try{
  const {supabase,user}=await requireAuthenticatedUser(request.headers.get("authorization"));
  if(user.email?.toLowerCase()!=="dehghani.pmp@gmail.com"||!user.email_confirmed_at)
   return NextResponse.json({error:"You don't have access to this page."},{status:403});
  const {data,error}=await supabase.from("platform_permission_catalog").select("permission,area,label,description").eq("active",true).order("area").order("permission");
  if(error)throw error;
  return NextResponse.json({catalog:data??[]},{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){const message=e instanceof Error?e.message:"request_failed";return NextResponse.json({error:message},{status:message==="authentication_required"?401:502});}
}
