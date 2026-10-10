"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Building2, ChevronDown, Clock3, Layers3, LifeBuoy, Snowflake, Tag, UsersRound } from "lucide-react";
import { getSupabase } from "@/lib/supabase-browser";

const MODEL_3D_URL = "https://3dmodel.linkoteq.com/";
const W_SECTION_URL = "https://wsection.linkoteq.com/";
const SNOW_LOAD_URL = "https://snow.linkoteq.com/";
const CUSTOMER_DISCOVERY_URL = "https://discovery.linkoteq.com/";
const EMPLOYEE_TIMESHEET_URL = "/blog/login?next=timesheet";

type SessionUser = {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
};

function displayNameFor(user: SessionUser | null | undefined) {
  if (!user) return "";
  const metadata = user.user_metadata ?? {};
  const fullName = typeof metadata.full_name === "string" ? metadata.full_name.trim() : "";
  const name = typeof metadata.name === "string" ? metadata.name.trim() : "";
  if (fullName) return fullName;
  if (name) return name;
  if (user.email) return user.email.split("@")[0];
  return "User";
}

export default function SiteHeader() {
  const [employeeSignedIn, setEmployeeSignedIn] = useState(false);
  const [employeeName, setEmployeeName] = useState("");
  const [returnTo, setReturnTo] = useState("/");

  useEffect(() => {
    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    setReturnTo(current.startsWith("/blog/login") ? "/" : current);

    const supabase = getSupabase();
    if (!supabase) return;

    const applyUser = (user: SessionUser | null | undefined) => {
      setEmployeeSignedIn(Boolean(user));
      setEmployeeName(displayNameFor(user));
    };

    void supabase.auth.getSession().then(({ data }) => applyUser(data.session?.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      applyUser(session?.user);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function signOut() {
    const supabase = getSupabase();
    if (supabase) await supabase.auth.signOut();
    setEmployeeSignedIn(false);
    setEmployeeName("");
    window.location.reload();
  }

  const employeeLoginUrl = `/blog/login?returnTo=${encodeURIComponent(returnTo)}`;

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
              <a href={EMPLOYEE_TIMESHEET_URL}><Clock3 size={16} /> Team Timesheet</a>
            </div>
          </div>
          <a href="/pricing">Pricing</a>
          <div className="navMenu">
            <button className="navMenuButton" type="button">Calculators <ChevronDown size={14} /></button>
            <div className="navDropdown">
              <a href={MODEL_3D_URL}><Layers3 size={16} /> 3D Structural Model</a>
              <a href={W_SECTION_URL}><Building2 size={16} /> W-Section</a>
              <a href={SNOW_LOAD_URL}><Snowflake size={16} /> Snow Load</a>
            </div>
          </div>
        </nav>

        {employeeSignedIn ? (
          <div className="signedInSummary">
            <button className="navCta" type="button" onClick={signOut}>Sign Out</button>
            <span className="signedInGreeting">Hello {employeeName}</span>
          </div>
        ) : (
          <div className="navMenu signInMenu">
            <button className="navCta navMenuButton" type="button">Sign In <ChevronDown size={14} /></button>
            <div className="navDropdown signInDropdown">
              <a href={employeeLoginUrl}>Employee Workspace</a>
              <a href="/customer-login">Client Workspace</a>
            </div>
          </div>
        )}
      </div>

      <nav className="primaryBar" aria-label="Primary navigation">
        <a href="/">Home</a>
        <a href="/#platform">AI Platform</a>
        <a href="/#roadmap">Roadmap</a>
        <div className="navMenu knowledgeMenu">
          <button className="navMenuButton" type="button" aria-haspopup="true">
            Knowledge Center <ChevronDown size={14} />
          </button>
          <div className="navDropdown knowledgeDropdown">
            <a href="/knowledge/documentation">Documentation</a>
            <a href="/structural-labeling"><Tag size={16} /> Structural Labeling</a>
            <a href="/structural-labeling/regionkit"><Layers3 size={16} /> RegionKit</a>
          </div>
        </div>
        <a href="/blog">Blog</a>
      </nav>
    </header>
  );
}
