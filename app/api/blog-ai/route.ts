import { NextRequest, NextResponse } from "next/server";

const DEFAULT_SYSTEM = `You are LinkoTech's engineering content agent. Return ONLY valid JSON with these keys: title, excerpt, body_html, seo_title, seo_description, linkedin_copy, tags. The body_html must be publication-ready HTML for the LinkoTech blog, written for professional engineers and decision makers. Use clear headings, concise paragraphs, bullet lists, tables when useful, engineering formulas in readable text, practical examples, and a calculator CTA when calculator_name and calculator_url are provided. Do not invent standards clauses, numerical values, test results, or engineering claims. If the prompt does not provide enough technical basis, explicitly frame uncertain material as general guidance. LinkedIn is the primary marketing channel: linkedin_copy should be professional, concise, credible, include a clear CTA and 3-6 relevant hashtags. SEO title should be <= 60 characters when practical; meta description <= 160 characters when practical.`;

async function requireEmployee(req:NextRequest){
  const token=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"");
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL; const anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if(!token||!url||!anon)return null;
  const userRes=await fetch(`${url}/auth/v1/user`,{headers:{apikey:anon,Authorization:`Bearer ${token}`},cache:"no-store"});
  if(!userRes.ok)return null; const user=await userRes.json();
  const profileRes=await fetch(`${url}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=role`,{headers:{apikey:anon,Authorization:`Bearer ${token}`},cache:"no-store"});
  if(!profileRes.ok)return null; const rows=await profileRes.json(); const role=rows?.[0]?.role;
  return ["member","manager","admin"].includes(role)?user:null;
}

export async function POST(req: NextRequest){
  try{
    if(!await requireEmployee(req))return NextResponse.json({error:"Employee authentication required."},{status:401});
    const {prompt,apiKey,calculator_name,calculator_url,brandPrompt}=await req.json();
    const key=(apiKey||process.env.OPENAI_API_KEY||"").trim();
    if(!key)return NextResponse.json({error:"OpenAI API key is required."},{status:400});
    if(!prompt?.trim())return NextResponse.json({error:"Prompt is required."},{status:400});
    const response=await fetch("https://api.openai.com/v1/chat/completions",{
      method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${key}`},
      body:JSON.stringify({model:"gpt-4o-mini",response_format:{type:"json_object"},temperature:0.35,messages:[{role:"system",content:`${DEFAULT_SYSTEM}\n\n${brandPrompt?.trim()||""}`},{role:"user",content:`Topic/instruction:\n${prompt}\n\nCalculator name: ${calculator_name||"None"}\nCalculator URL: ${calculator_url||"None"}`}]})
    });
    const data=await response.json();
    if(!response.ok)return NextResponse.json({error:data?.error?.message||"AI request failed."},{status:response.status});
    const text=data?.choices?.[0]?.message?.content||"{}";
    return NextResponse.json(JSON.parse(text));
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"AI generation failed."},{status:500});}
}
