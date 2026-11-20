import type { Metadata } from "next";
import styles from "../tools.module.css";
const title = "Wood Design | Linkoteq";
const description = "Preview the Linkoteq structural wood design tool in development and follow its progress toward tested beam and member checks.";
const canonical = "https://www.linkoteq.com/tools/wood-design";
export const metadata: Metadata = { title, description, alternates: { canonical },
  robots: { index: true, follow: true }, openGraph: { title, description, url: canonical } };
export default function Preview() {
  return <main className={styles.shell}>
    <a className={styles.back} href="/tools">← Engineering tools</a>
    <header className={styles.intro}><span className={styles.badge}>In development · Unverified</span>
      <h1>Wood Design</h1><p>The planned scope includes wood member bending, shear, bearing, stability and serviceability. Design equations, material catalogs and benchmark checks are not yet integrated. No verified design results are available.</p>
      <p>This tool is not available for engineering calculations yet.</p>
      <a className="primaryButton" href="/customer-login">Sign in to your workspace</a>
    </header></main>;
}
