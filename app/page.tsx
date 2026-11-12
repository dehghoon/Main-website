import Image from "next/image";
import {
  ArrowRight, BarChart3, BrainCircuit, Building2, ChevronDown, Clock3,
  FileSearch, FileText, GraduationCap, HelpCircle, Layers3, LifeBuoy,
  Snowflake, Sparkles, UsersRound, Wrench, BookOpen,
} from "lucide-react";
import ThreeDModelShowcase from "./components/three-d-model-showcase";
import { engineeringTools } from "@/lib/engineering-tools";

const CUSTOMER_DISCOVERY_URL = "https://discovery.linkoteq.com/";
const TIMESHEET_URL = "https://timesheet.linkoteq.com/";

const knowledgeItems = [
  { label: "Engineering Articles", href: "/knowledge/engineering-articles", icon: BookOpen },
  { label: "AI in Structural Engineering", href: "/knowledge/ai-structural-engineering", icon: BrainCircuit },
  { label: "BIM & IFC Guides", href: "/knowledge/bim-ifc-guides", icon: Layers3 },
  { label: "Free Downloads", href: "/knowledge/free-downloads", icon: FileText },
  { label: "Documentation", href: "/knowledge/documentation", icon: FileText },
  { label: "White Papers", href: "/knowledge/white-papers", icon: FileText },
  { label: "Tutorials", href: "/knowledge/tutorials", icon: GraduationCap },
  { label: "FAQs", href: "/knowledge/faqs", icon: HelpCircle },
  { label: "Case Studies", href: "/knowledge/case-studies", icon: BarChart3 },
  { label: "Customer Discovery Reports", href: "/knowledge/customer-discovery-reports", icon: UsersRound },
];

const products = [
  { title: "Engineering Tools", description: "Validated Structural Calculations Delivered Through Clear, Interactive Engineering Applications.", icon: Wrench, status: "Active Development" },
  { title: "2D Drawing Intelligence", description: "From Engineering Drawings To Recognized Grids, Members, Loads, And Structured Digital Models.", icon: FileSearch, status: "Under Construction" },
  { title: "Model Orchestration", description: "Reusable Engineering Engines Coordinated By AI To Build Traceable, Calculation-Ready Structural Models.", icon: BrainCircuit, status: "Research Roadmap" },
];


export default function Home() {
  return (
    <main>
      <ThreeDModelShowcase />
      <aside role="note" style={{maxWidth:1180,margin:"18px auto",padding:"14px 22px",border:"1px solid #d5b985",borderRadius:12,background:"#fff9eb",color:"#614a21",lineHeight:1.6}}><strong>Early development:</strong> LinkoTech engineering tools are evolving. Some workflows, including the 3D Structural Model, may be experimental or incomplete. Confirm current functionality before using results for professional engineering decisions. <a href="/contact" style={{textDecoration:"underline"}}>Ask about early access or provide feedback</a>.</aside>

      <section className="hero" id="top">
        <div className="heroCopy">
          <span className="eyebrow"><Sparkles size={16} /> Engineering Intelligence, Connected</span>
          <h1>Turn Engineering Information Into Decisions, Models, And Reusable Digital Workflows.</h1>
          <p>LinkoTech Is Building An AI-Enabled Engineering Platform That Connects Drawing Intelligence, Validated Calculation Engines, Interactive Applications, And Professional Reporting.</p>
          <div className="heroActions"><a className="primaryButton" href="#3d-model">Create A 3D Structural Model <ArrowRight size={18} /></a><a className="secondaryButton" href="#tools">View Engineering Tools</a></div>
          <div className="heroMetrics"><div><strong>2D → 3D</strong><span>Drawing-To-Model Roadmap</span></div><div><strong>Reusable</strong><span>Shared Engineering Engines</span></div><div><strong>Traceable</strong><span>Checks, Ratios, References, Reports</span></div></div>
        </div>
        <div className="heroVisual heroImagePanel"><Image src="/engineering-hero.svg" alt="Engineering Building Model Transitioning From Wireframe To Physical Structure" fill sizes="(max-width: 980px) 100vw, 45vw" priority /></div>
      </section>

      <section className="section" id="platform"><div className="sectionIntro"><span className="eyebrow">AI Platform</span><h2>One Engineering Foundation. Multiple Products.</h2><p>Every Tool Is Designed As A Reusable Module So Future AI Services Can Call The Same Validated Engineering Logic Without Duplication.</p></div><div className="productGrid">{products.map(({ title, description, icon: Icon, status }) => <article className="productCard" key={title}><div className="iconBox"><Icon size={24} /></div><span className="status">{status}</span><h3>{title}</h3><p>{description}</p><a href="#roadmap">Learn More <ArrowRight size={16} /></a></article>)}</div></section>

      <section className="capabilityShowcase"><div className="sectionIntro"><span className="eyebrow">Connected Engineering Experience</span><h2>From Drawings To Models, Calculations, Reports, And Secure Delivery.</h2></div><div className="showcaseImageWrap"><Image src="/engineering-capabilities.svg" alt="Linko Engineering Capabilities Including AI, Modeling, Applications, Reporting, Standards, And Security" width={1200} height={820} /></div></section>

      <section className="section toolsSection" id="tools">
        <div className="sectionIntro"><span className="eyebrow">Engineering Software</span><h2>Find the right tool for your workflow.</h2><p>Explore our structural engineering applications. Access is subject to each product's current Trial or Beta eligibility and verification status.</p></div>
        <div className="refreshToolGrid">
          {engineeringTools.map((tool) => <article className="refreshToolCard" key={tool.id}>
            <div className="refreshToolCardTop"><span className="refreshToolIcon" aria-hidden="true">{tool.id === "model" ? <Layers3 size={28} /> : tool.id === "wsection" ? <Building2 size={28} /> : <Snowflake size={28} />}</span><span className="refreshStatus">{tool.status}</span></div>
            <h3>{tool.name}</h3><p>{tool.description}</p>
            <a href={tool.href} className="refreshToolLink">Explore tool <ArrowRight size={17} /></a>
          </article>)}
        </div>
        <p className="refreshDisclaimer">Tools are at different stages of validation and access. Beta features are not a substitute for independently verified professional engineering design.</p>
      </section>

      <section className="vision" id="roadmap"><div><span className="eyebrow">Roadmap</span><h2>From Drawings To Engineering-Ready Digital Objects.</h2></div><p>LinkoTech’s Core Roadmap Is To Recognize Grids, Columns, Beams, Loads, And Relationships From 2D Engineering Documents, Then Assemble Structured 3D Models And Route Each Object Through Validated Engineering Tools.</p></section>
      <section className="cta"><div><span className="eyebrow">Build With Us</span><h2>Engineering Software Should Be Intelligent, Transparent, And Reusable.</h2></div><a className="primaryButton" href="/contact">Start A Conversation <ArrowRight size={18} /></a></section>
      <footer><Image src="/linko-logo-final.svg" alt="LinkoTech Engineering Technology" width={210} height={53} /><p>Engineering Intelligence For Connected Digital Workflows.</p><span>© 2026 Linko Technology. All Rights Reserved.</span></footer>
    </main>
  );
}
