import type { Metadata } from "next";
import styles from "../tools.module.css";
const title = "Concrete Beam | Linkoteq";
const description = "Preview the Linkoteq reinforced concrete beam design tool in development, with planned CSA A23.3:2019 and 2024 profiles.";
const canonical = "https://www.linkoteq.com/tools/concrete-beam";
export const metadata: Metadata = { title, description, alternates: { canonical },
  robots: { index: true, follow: true }, openGraph: { title, description, url: canonical } };
export default function Preview() {
  return <main className={styles.shell}>
    <a className={styles.back} href="/tools">← Engineering tools</a>
    <header className={styles.intro}><span className={styles.badge}>In development · Unverified</span>
      <h1>Concrete Beam</h1><p>The planned scope includes rectangular beam flexure, shear and reinforcement checks. CSA A23.3:2019 and 2024 remain separate profiles. Strength calculations are unavailable until edition-specific source verification and benchmark testing are complete.</p>
      <p>This tool is not available for engineering calculations yet.</p>
      <a className="primaryButton" href="/customer-login">Sign in to your workspace</a>
    </header></main>;
}
