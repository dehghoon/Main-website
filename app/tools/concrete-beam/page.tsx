import type { Metadata } from "next";
import ConcreteCalculator from "./concrete-calculator";
import workspaceStyles from "@/app/components/beam-workspace.module.css";
import styles from "../tools.module.css";
const title = "Concrete Beam | Linkoteq";
const description = "Compare concrete beam component checks for USA ACI 318-19 and Canadian CSA A23.3 profiles. Account access required. Limited Beta, no complete member approval.";
const canonical = "https://www.linkoteq.com/tools/concrete-beam";
export const metadata: Metadata = { title, description, alternates: { canonical },
  robots: { index: true, follow: true }, openGraph: { title, description, url: canonical } };
export default function Preview() {
  return <main className={workspaceStyles.page}>
    <a className={styles.back} href="/tools">← Engineering tools</a>
    <header className={styles.intro}><span className={styles.badge}>In development · Unverified</span>
      <h1>Concrete Beam</h1><p>Choose USA (ACI 318-19) or Canada (CSA A23.3:2019 flexure/shear, or 2024 shear only). The server determines internal section parameters for the selected limited profile.</p>
      <p>Approved users can rotate and zoom the reinforced section model and run component checks. CSA 2024 flexure remains unavailable pending source verification. These Beta results do not approve a complete member design.</p>
      <a className="primaryButton" href="/customer-login">Sign in to your workspace</a>
    </header><ConcreteCalculator /></main>;
}
