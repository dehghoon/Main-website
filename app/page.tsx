import Image from "next/image";
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Building2,
  ChevronDown,
  Clock3,
  FileSearch,
  FileText,
  GraduationCap,
  HelpCircle,
  Layers3,
  LifeBuoy,
  Snowflake,
  Sparkles,
  UsersRound,
  Wrench,
  BookOpen,
} from "lucide-react";

const STEEL_COLUMN_URL = "https://wsection.linkoteq.com/";
const SNOW_LOAD_URL = "https://snow.linkoteq.com/";
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
  {
    title: "Engineering Tools",
    description: "Validated Structural Calculations Delivered Through Clear, Interactive Engineering Applications.",
    icon: Wrench,
    status: "Active Development",
  },
  {
    title: "2D Drawing Intelligence",
    description: "From Engineering Drawings To Recognized Grids, Members, Loads, And Structured Digital Models.",
    icon: FileSearch,
    status: "Under Construction",
  },
  {
    title: "Model Orchestration",
    description: "Reusable Engineering Engines Coordinated By AI To Build Traceable, Calculation-Ready Structural Models.",
    icon: BrainCircuit,
    status: "Research Roadmap",
  },
];

const tools = [
  { title: "Customer Discovery", description: "Structured Interviews, Evidence Capture, And Insight Tracking For Product Discovery.", icon: UsersRound, href: CUSTOMER_DISCOVERY_URL, action: "Open Platform" },
  { title: "Team Timesheet", description: "A Lightweight Operational Workspace For Time Capture And Project Visibility.", icon: Clock3, href: TIMESHEET_URL, action: "Open Workspace" },
  { title: "W-Section", description: "Interactive W-section verification with section data, utilization ratios, and report-ready engineering outputs.", icon: Building2, href: STEEL_COLUMN_URL, action: "Open Calculator" },
  { title: "Snow Load", description: "NBCC 2020 roof snow calculations for uniform, lower-roof drift, and projection / parapet loading with ULS, SLS, and report-ready outputs.", icon: Snowflake, href: SNOW_LOAD_URL, action: "Open Calculator" },
];

export default function Home() {
  return (
    <main>
      <header className="siteHeader">
        <a className="brand" href="#top" aria-label="LinkoTech home">
          <Image src="/linko-logo-final.svg" alt="LinkoTech Engineering Technology" width={260} height={65} priority />
        </a>

        <nav className="mainNav" aria-label="Primary navigation">
          <a href="#top">Home</a>
          <a href="#platform">AI Platform</a>
          <a href="#roadmap">Roadmap</a>

          <div className="navMenu">
            <button className="navMenuButton" type="button">Knowledge Center <ChevronDown size={15} /></button>
            <div className="navDropdown wideDropdown">
              {knowledgeItems.map(({ label, href, icon: Icon }) => (
                <a key={label} href={href}><Icon size={16} /><span>{label}</span></a>
              ))}
            </div>
          </div>

          <a href="/blog">Blog</a>

          <div className="navMenu">
            <button className="navMenuButton" type="button">Calculators <ChevronDown size={15} /></button>
            <div className="navDropdown">
              <a href={STEEL_COLUMN_URL}><Building2 size={16} /> W-Section</a>
              <a href={SNOW_LOAD_URL}><Snowflake size={16} /> Snow Load</a>
            </div>
          </div>

          <div className="navMenu">
            <button className="navMenuButton" type="button">About <ChevronDown size={15} /></button>
            <div className="navDropdown">
              <a href="/about">About Linko</a>
              <a href={TIMESHEET_URL}><Clock3 size={16} /> Team Timesheet</a>
            </div>
          </div>

          <div className="navMenu">
            <button className="navMenuButton" type="button">Contact <ChevronDown size={15} /></button>
            <div className="navDropdown">
              <a href="/contact">Contact Us</a>
              <a href={CUSTOMER_DISCOVERY_URL}><UsersRound size={16} /> Customer Discovery</a>
              <a href="/contact/support"><LifeBuoy size={16} /> Support</a>
            </div>
          </div>

          <a href="/pricing">Pricing</a>
        </nav>

        <div className="navMenu signInMenu">
          <button className="navCta navMenuButton" type="button">Sign In <ChevronDown size={15} /></button>
          <div className="navDropdown signInDropdown">
            <a href={TIMESHEET_URL}>Employee Login</a>
            <a href="/customer-login">Customer Login</a>
          </div>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="heroCopy">
          <span className="eyebrow"><Sparkles size={16} /> Engineering Intelligence, Connected</span>
          <h1>Turn Engineering Information Into Decisions, Models, And Reusable Digital Workflows.</h1>
          <p>LinkoTech Is Building An AI-Enabled Engineering Platform That Connects Drawing Intelligence, Validated Calculation Engines, Interactive Applications, And Professional Reporting.</p>
          <div className="heroActions">
            <a className="primaryButton" href="#platform">Discover The AI Platform <ArrowRight size={18} /></a>
            <a className="secondaryButton" href="#tools">View Engineering Tools</a>
          </div>
          <div className="heroMetrics">
            <div><strong>2D → 3D</strong><span>Drawing-To-Model Roadmap</span></div>
            <div><strong>Reusable</strong><span>Shared Engineering Engines</span></div>
            <div><strong>Traceable</strong><span>Checks, Ratios, References, Reports</span></div>
          </div>
        </div>

        <div className="heroVisual heroImagePanel">
          <Image src="/engineering-hero.svg" alt="Engineering Building Model Transitioning From Wireframe To Physical Structure" fill sizes="(max-width: 980px) 100vw, 45vw" priority />
        </div>
      </section>

      <section className="section" id="platform">
        <div className="sectionIntro">
          <span className="eyebrow">AI Platform</span>
          <h2>One Engineering Foundation. Multiple Products.</h2>
          <p>Every Tool Is Designed As A Reusable Module So Future AI Services Can Call The Same Validated Engineering Logic Without Duplication.</p>
        </div>
        <div className="productGrid">
          {products.map(({ title, description, icon: Icon, status }) => (
            <article className="productCard" key={title}>
              <div className="iconBox"><Icon size={24} /></div>
              <span className="status">{status}</span>
              <h3>{title}</h3>
              <p>{description}</p>
              <a href="#roadmap">Learn More <ArrowRight size={16} /></a>
            </article>
          ))}
        </div>
      </section>

      <section className="capabilityShowcase">
        <div className="sectionIntro">
          <span className="eyebrow">Connected Engineering Experience</span>
          <h2>From Drawings To Models, Calculations, Reports, And Secure Delivery.</h2>
        </div>
        <div className="showcaseImageWrap">
          <Image src="/engineering-capabilities.svg" alt="Linko Engineering Capabilities Including AI, Modeling, Applications, Reporting, Standards, And Security" width={1200} height={820} />
        </div>
      </section>

      <section className="section toolsSection" id="tools">
        <div className="sectionIntro">
          <span className="eyebrow">Current Tools</span>
          <h2>Practical Products Already Taking Shape.</h2>
          <p>Early Applications Are Being Developed As Building Blocks For The Broader LinkoTech Engineering Platform.</p>
        </div>
        <div className="toolGrid">
          {tools.map(({ title, description, icon: Icon, href, action }) => (
            <a className="toolCard" key={title} href={href}>
              <Icon size={24} />
              <div><h3>{title}</h3><p>{description}</p></div>
              <span>{action}</span>
            </a>
          ))}
        </div>
      </section>

      <section className="vision" id="roadmap">
        <div>
          <span className="eyebrow">Roadmap</span>
          <h2>From Drawings To Engineering-Ready Digital Objects.</h2>
        </div>
        <p>LinkoTech’s Core Roadmap Is To Recognize Grids, Columns, Beams, Loads, And Relationships From 2D Engineering Documents, Then Assemble Structured 3D Models And Route Each Object Through Validated Engineering Tools.</p>
      </section>

      <section className="cta">
        <div>
          <span className="eyebrow">Build With Us</span>
          <h2>Engineering Software Should Be Intelligent, Transparent, And Reusable.</h2>
        </div>
        <a className="primaryButton" href="/contact">Start A Conversation <ArrowRight size={18} /></a>
      </section>

      <footer>
        <Image src="/linko-logo-final.svg" alt="LinkoTech Engineering Technology" width={210} height={53} />
        <p>Engineering Intelligence For Connected Digital Workflows.</p>
        <span>© 2026 Linko Technology. All Rights Reserved.</span>
      </footer>
    </main>
  );
}
