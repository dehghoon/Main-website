"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Building2, ChevronDown, Clock3, LifeBuoy, Snowflake, UsersRound } from "lucide-react";
import { getSupabase } from "@/lib/supabase-browser";

const W_SECTION_URL = "https://wsection.linkoteq.com/";
const SNOW_LOAD_URL = "https://snow.linkoteq.com/";
const CUSTOMER_DISCOVERY_URL = "https://discovery.linkoteq.com/";
const EMPLOYEE_TIMESHEET_URL = "/blog/login?next=timesheet";

export default function SiteHeader() {
  const [employeeSignedIn, setEmployeeSignedIn] = useState(false);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data }) => setEmployeeSignedIn(Boolean(data.session)));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setEmployeeSignedIn(Boolean(session)));
    return () => listener.subscription.unsubscribe();
  }, []);

  async function signOut() {
    const supabase = getSupabase();
    if (supabase) await supabase.auth.signOut();
    setEmployeeSignedIn(false);
    window.location.href = "/";
  }

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
              <a href={W_SECTION_URL}><Building2 size={16} /> W-Section</a>
              <a href={SNOW_LOAD_URL}><Snowflake size={16} /> Snow Load</a>
            </div>
          </div>
        </nav>

        {employeeSignedIn ? (
          <button className="navCta" type="button" onClick={signOut}>Sign Out</button>
        ) : (
          <div className="navMenu signInMenu">
            <button className="navCta navMenuButton" type="button">Sign In <ChevronDown size={14} /></button>
            <div className="navDropdown signInDropdown">
              <a href="/blog/login">Employee Workspace</a>
              <a href="/customer-login">Client Workspace</a>
            </div>
          </div>
        )}
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
