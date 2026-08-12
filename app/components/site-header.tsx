import Image from "next/image";
import { Building2, ChevronDown, Clock3, LifeBuoy, UsersRound } from "lucide-react";

const W_SECTION_URL = "https://wsection.linkoteq.com/";
const CUSTOMER_DISCOVERY_URL = "https://discovery.linkoteq.com/";
const TIMESHEET_URL = "https://timesheet.linkoteq.com/";

export default function SiteHeader() {
  return (
    <header className="globalHeader">
      <div className="utilityBar">
        <a className="utilityBrand" href="/" aria-label="LinkoTech home">
          <Image src="/linko-logo-final.svg" alt="LinkoTech Engineering Technology" width={220} height={55} priority />
        </a>

        <nav className="utilityNav" aria-label="Utility navigation">
          <a href="/">Home</a>

          <div className="navMenu">
            <button className="navMenuButton" type="button">Contact <ChevronDown size={14} /></button>
            <div className="navDropdown">
              <a href="/contact">Contact Us</a>
              <a href={CUSTOMER_DISCOVERY_URL}><UsersRound size={16} /> Customer Discovery</a>
              <a href="/contact/support"><LifeBuoy size={16} /> Support</a>
            </div>
          </div>

          <div className="navMenu">
            <button className="navMenuButton" type="button">About <ChevronDown size={14} /></button>
            <div className="navDropdown">
              <a href="/about">About Linko</a>
              <a href={TIMESHEET_URL}><Clock3 size={16} /> Team Timesheet</a>
            </div>
          </div>

          <a href="/pricing">Pricing</a>

          <div className="navMenu">
            <button className="navMenuButton" type="button">Calculators <ChevronDown size={14} /></button>
            <div className="navDropdown">
              <a href={W_SECTION_URL}><Building2 size={16} /> W-Section</a>
            </div>
          </div>
        </nav>

        <div className="navMenu signInMenu">
          <button className="navCta navMenuButton" type="button">Sign In <ChevronDown size={14} /></button>
          <div className="navDropdown signInDropdown">
            <a href="/blog/login">Employee Workspace</a>
            <a href="/customer-login">Client Workspace</a>
          </div>
        </div>
      </div>

      <nav className="primaryBar" aria-label="Primary navigation">
        <a href="/">Home</a>
        <a href="/#platform">AI Platform</a>
        <a href="/#roadmap">Roadmap</a>
        <a href="/knowledge/documentation">Knowledge Center</a>
        <a href="/blog">Blog</a>
      </nav>
    </header>
  );
}
