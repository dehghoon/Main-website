const plans = [
  { name: "Starter", price: "$0", cadence: "Free", featured: false },
  { name: "Pro", price: "$15 / month", cadence: "$100 / year", featured: true },
  { name: "Company", price: "$100 / month", cadence: "$700 / year", featured: false },
];

const rows = [
  ["View calculation tools", "✓", "✓", "✓"],
  ["View Smart AI Drawings", "✓", "✓", "✓"],
  ["Calculation PDF export", "—", "✓", "✓"],
  ["Calculation Word (.docx) export", "—", "✓", "✓"],
  ["Smart Drawing DXF export", "—", "✓", "✓"],
  ["Smart Drawing IFC export", "—", "✓", "✓"],
  ["Calculation exports", "View only", "100 / calculator / month", "Unlimited"],
  ["Smart AI drawing exports", "View only", "100 / month", "Unlimited"],
  ["ETABS / SAP2000 / STAAD model imports", "5 / month", "Unlimited", "Unlimited"],
  ["Company user access", "—", "—", "Unlimited company users"],
];

export default function PricingPage() {
  return (
    <main style={{padding:"64px 5vw 88px",background:"linear-gradient(180deg,#f8fbfd,#eef4f8)",minHeight:"100vh"}}>
      <section style={{maxWidth:1180,margin:"0 auto"}}>
        <span className="eyebrow">Pricing</span>
        <h1 style={{fontSize:"clamp(42px,6vw,72px)",margin:"12px 0 14px",letterSpacing:"-.045em"}}>Plans for every engineering workflow.</h1>
        <p style={{maxWidth:760,color:"#66788a",fontSize:18,lineHeight:1.7,marginBottom:34}}>Starter, Pro, and Company are future subscription options shown for reference only. Plan enrollment, upgrades, and purchases are currently disabled. LinkoTech employees receive full internal access independent of client subscription plans.</p>
        <div role="note" style={{maxWidth:950,padding:"16px 20px",marginBottom:28,border:"1px solid #d5b985",borderRadius:12,background:"#fff9eb",color:"#614a21",lineHeight:1.6}}><strong>Product development notice:</strong> This pricing table describes planned plan features and limits, not a guarantee that every listed capability is available today. Paid plan enrollment and billing are disabled. Access requests are limited to a 30-day trial for released tools or separate Beta Access for tools under development; both require review and backend entitlement enforcement. Please <a href="/contact" style={{textDecoration:"underline"}}>contact us</a> to confirm the current availability of any tool before relying on it for a project. Do not assume that beta functionality is validated for engineering decisions.</div>

        <div style={{display:"grid",gridTemplateColumns:"minmax(220px,1.3fr) repeat(3,minmax(170px,1fr))",border:"1px solid rgba(7,21,37,.12)",borderRadius:24,overflow:"hidden",background:"white",boxShadow:"0 28px 70px rgba(7,21,37,.10)"}}>
          <div style={{padding:24,background:"#f7fafc",fontWeight:800}}>Features</div>
          {plans.map(plan => <div key={plan.name} style={{padding:24,textAlign:"center",background:plan.featured?"#eefbf7":"#f7fafc",borderLeft:"1px solid rgba(7,21,37,.10)"}}><div style={{fontWeight:850,fontSize:22}}>{plan.name}</div><div style={{fontWeight:850,fontSize:26,marginTop:8}}>{plan.price}</div><div style={{color:"#66788a",marginTop:4}}>{plan.cadence}</div><div aria-label={`${plan.name} enrollment unavailable`} style={{marginTop:12,fontSize:13,fontWeight:750,color:"#815e25"}}>Coming soon · Enrollment disabled</div></div>)}
          {rows.flatMap((row,ri)=>[
            <div key={`l-${ri}`} style={{padding:"15px 22px",borderTop:"1px solid rgba(7,21,37,.08)",fontWeight:650}}>{row[0]}</div>,
            ...row.slice(1).map((cell,ci)=><div key={`${ri}-${ci}`} style={{padding:"15px 18px",borderTop:"1px solid rgba(7,21,37,.08)",borderLeft:"1px solid rgba(7,21,37,.08)",textAlign:"center",fontWeight:cell==="✓"?900:650,color:cell==="✓"?"#0c8b72":"#526577"}}>{cell}</div>)
          ])}
        </div>

        <section aria-label="Current access requests" style={{marginTop:24,padding:20,border:"1px solid #ccd8e0",borderRadius:14,background:"#fff"}}><h2 style={{fontSize:22}}>Access available by request</h2><p><strong>30-Day Trial:</strong> For released tools such as Snow Load. <strong>Beta Access:</strong> For unfinished tools; results may be incomplete or inaccurate and must not be relied on for professional engineering decisions.</p><p>Sign in or register to request access. A request does not automatically grant permission; access is subject to owner approval and server-side verification.</p><a href="/customer-login" style={{textDecoration:"underline",fontWeight:700}}>Sign in or register to request access</a></section><p style={{marginTop:20,color:"#66788a",lineHeight:1.6}}>Subscription enforcement, client roles, quotas, billing status, and entitlement checks will be connected to the client workspace backend. Employee accounts remain full-access internal accounts.</p>
      </section>
    </main>
  );
}
