import { ENGINEERING_TOOLS, BETA_WARNING } from "../../lib/tool-access/catalog";

export default async function ToolAccessPage({searchParams}: {searchParams: Promise<{tool?:string}>}) {
 const params=await searchParams;
 const tool=ENGINEERING_TOOLS.find(item=>item.key===params.tool);
 if(!tool)return <main style={{padding:40}}><h1>Tool not found</h1><a href="/">Back to tools</a></main>;
 const released=tool.readiness==="released";
 return <main className="authShell"><section className="authCard">
 <a href="/">← LinkoTech tools</a><h1>{tool.name}</h1>
 <p>{released?"This released tool offers a 30-day trial by request.":"This tool is under development. Beta Access is available by request."}</p>
 {!released&&<p role="alert"><strong>Under development:</strong> {BETA_WARNING}</p>}
 <h2>Explore this tool</h2>
 <p>Discover what {tool.name} can do before signing up. The tool overview is public, but calculations, model editing, uploads, and exports require a verified account with an approved tool-specific entitlement.</p>
 <p><strong>Access is not included with registration alone.</strong> Starter (free), Pro, and Company subscriptions are still in development and cannot currently be activated.</p>
 <h2>Customer access</h2>
 <p>Sign in or create a customer account to request {released?"a 30-day trial":"Beta Access"}. Submitting a request does not unlock the tool. Owner approval and a valid entitlement are required.</p>
 <a href={"/customer-login?tool="+encodeURIComponent(tool.key)}>{released?"Sign in to request 30-day Trial":"Sign in to request Beta Access"}</a>
 <h2>Existing employee access</h2>
 <p>Existing employee and Owner access is unchanged. Continue through the existing tool sign-in flow. This link does not grant customer access.</p>
 <p>Use your existing authenticated employee workspace to open the tool. Public links do not grant access.</p>
 </section></main>;
}
