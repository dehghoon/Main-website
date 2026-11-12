import { ENGINEERING_TOOLS } from "../../lib/tool-access/catalog";

export default function ToolsPage() {
 return <main style={{maxWidth:1100,margin:"0 auto",padding:"64px 24px 96px"}}>
  <h1>Explore Linkoteq engineering tools</h1>
  <p>Explore our engineering software before registering. Tool descriptions are public; calculations, editing, uploads and exports require verified sign-in and approved access. Starter, Pro and Company subscriptions are not yet active.</p>
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",gap:20,marginTop:32}}>
   {ENGINEERING_TOOLS.map(tool=><article key={tool.key} style={{border:"1px solid #d4dce5",borderRadius:16,padding:24,background:"white"}}>
    <h2 style={{fontSize:22}}>{tool.name}</h2>
    <p><strong>{tool.readiness==="released"?"30-day Trial by approval":"Beta — under development"}</strong></p>
    <p>{tool.readiness==="released"?"Request a limited trial after accepting the engineering disclaimer.":"Evaluation access only. Features may be incomplete and results unverified."}</p>
    <a href={"/tool-access?tool="+encodeURIComponent(tool.key)} style={{textDecoration:"underline",fontWeight:700}}>Explore and request access</a>
   </article>)}
  </div>
  <p style={{marginTop:28}}>Registration does not grant automatic access. Owner approval is required for Trial and Beta.</p>
 </main>;
}
