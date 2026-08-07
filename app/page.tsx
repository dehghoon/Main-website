import Image from "next/image";
import { ArrowRight, BrainCircuit, Building2, ChevronDown, Clock3, Database, FileSearch, Layers3, LifeBuoy, Sparkles, UsersRound, Wrench } from "lucide-react";

const STEEL_COLUMN_URL = "https://steel.linkoteq.com/";
const CUSTOMER_DISCOVERY_URL = "https://discovery.linkoteq.com/";
const TIMESHEET_URL = "https://timesheet.linkoteq.com/";

const products = [
  {
    title: "Engineering Tools",
    description: "Validated structural calculations delivered through clear, interactive engineering applications.",
    icon: Wrench,
    status: "Active development",
  },
  {
    title: "2D Drawing Intelligence",
    description: "From engineering drawings to recognized grids, members, loads, and structured digital models.",
    icon: FileSearch,
    status: "Under construction",
  },
  {
    title: "Model Orchestration",
    description: "Reusable engineering engines coordinated by AI to build traceable, calculation-ready structural models.",
    icon: BrainCircuit,
    status: "Research roadmap",
  },
];

const tools = [
  { title: "Customer Discovery", description: "Structured interviews, evidence capture, and insight tracking for product discovery.", icon: UsersRound, href: CUSTOMER_DISCOVERY_URL, action: "Open platform" },
  { title: "Team Timesheet", description: "A lightweight operational workspace for time capture and project visibility.", icon: Clock3, href: TIMESHEET_URL, action: "Open workspace" },
  { title: "Steel Column", description: "Interactive steel column verification with section data, utilization ratios, and report-ready outputs.", icon: Building2, href: STEEL_COLUMN_URL, action: "Open tool" },
];

export default function Home() {
  return (
    <main>
      <header className="siteHeader">
        <a className="brand" href="#top" aria-label="LinkoTech home">
          <Image src="/linkotech-logo.svg" alt="LinkoTech" width={300} height={75} priority />
        </a>

        <nav className="mainNav" aria-label="Primary navigation">
          <a href="#top">Home</a>
          <a href="#platform">AI Platform</a>
          <a href="#vision">Roadmap</a>
          <a href="/knowledge/documentation">Knowledge Center</a>
          <a href="/blog">Blog</a>

          <div className="navMenu">
            <button className="navMenuButton" type="button">Calculators <ChevronDown size={15} /></button>
            <div className="navDropdown">
              <a href={STEEL_COLUMN_URL}><Building2 size={16} /> Steel Verification</a>
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
          <span className="eyebrow"><Sparkles size={16} /> Engineering intelligence, connected</span>
          <h1>Turn engineering information into decisions, models, and reusable digital workflows.</h1>
          <p>
            LinkoTech is building an AI-enabled engineering platform that connects drawing intelligence,
            validated calculation engines, interactive applications, and professional reporting.
          </p>
          <div className="heroActions">
            <a className="primaryButton" href="#platform">Discover the platform <ArrowRight size={18} /></a>
            <a className="secondaryButton" href="#tools">View current tools</a>
          </div>
          <div className="heroMetrics">
            <div><strong>2D → 3D</strong><span>Drawing-to-model roadmap</span></div>
            <div><strong>Reusable</strong><span>Shared engineering engines</span></div>
            <div><strong>Traceable</strong><span>Checks, ratios, references, reports</span></div>
          </div>
        </div>

        <div className="heroVisual" aria-hidden="true">
          <div className="gridPlane" />
          <div className="modelStack">
            <div className="modelCard cardOne"><Layers3 /><span>Drawing Layer</span></div>
            <div className="modelCard cardTwo"><Database /><span>Engineering Data</span></div>
            <div className="modelCard cardThree"><BrainCircuit /><span>AI Coordination</span></div>
          </div>
          <div className="orb orbOne" />
          <div className="orb orbTwo" />
        </div>
      </section>

      <section className="section" id="platform">
        <div className="sectionIntro">
          <span className="eyebrow">The platform</span>
          <h2>One engineering foundation. Multiple products.</h2>
          <p>Every tool is designed as a reusable module so future AI services can call the same validated engineering logic without duplication.</p>
        </div>
        <div className="productGrid">
          {products.map(({ title, description, icon: Icon, status }) => (
            <article className="productCard" key={title}>
              <div className="iconBox"><Icon size={24} /></div>
              <span className="status">{status}</span>
              <h3>{title}</h3>
              <p>{description}</p>
              <a href="#contact">Learn more <ArrowRight size={16} /></a>
            </article>
          ))}
        </div>
      </section>

      <section className="section toolsSection" id="tools">
        <div className="sectionIntro">
          <span className="eyebrow">Current tools</span>
          <h2>Practical products already taking shape.</h2>
          <p>Early applications are being developed as building blocks for the broader LinkoTech engineering platform.</p>
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

      <section className="vision" id="vision">
        <div>
          <span className="eyebrow">Long-term vision</span>
          <h2>From drawings to engineering-ready digital objects.</h2>
        </div>
        <p>
          LinkoTech’s core roadmap is to recognize grids, columns, beams, loads, and relationships from 2D engineering documents,
          then assemble structured 3D models and route each object through validated engineering tools.
        </p>
      </section>

      <section className="cta" id="contact">
        <div>
          <span className="eyebrow">Build with us</span>
          <h2>Engineering software should be intelligent, transparent, and reusable.</h2>
        </div>
        <a className="primaryButton" href="/contact">Start a conversation <ArrowRight size={18} /></a>
      </section>

      <footer>
        <Image src="/linkotech-logo.svg" alt="LinkoTech" width={220} height={58} />
        <p>Engineering Intelligence for connected digital workflows.</p>
        <span>© 2026 LinkoTech. All rights reserved.</span>
      </footer>
    </main>
  );
}
