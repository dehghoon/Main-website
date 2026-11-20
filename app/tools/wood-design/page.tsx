import type { Metadata } from "next";
import { BETA_WARNING } from "@/lib/tool-access/catalog";
import WoodCalculator from "./wood-calculator";
import styles from "../tools.module.css";
const title = "Wood Design Calculator — NDS 2024 Beta | Linkoteq";
const description = "Evaluate a rectangular sawn-lumber beam under a uniform load with NDS 2024 component checks. Approved account access is required. Beta, limited scope.";
const canonical = "https://www.linkoteq.com/tools/wood-design";
export const metadata: Metadata = { title, description, alternates: { canonical },
  robots: { index: true, follow: true }, openGraph: { title, description, url: canonical } };
export default function Preview() {
  return <main className={styles.shell}>
    <a className={styles.back} href="/tools">← Engineering tools</a>
    <header className={styles.intro}><span className={styles.badge}>Beta · NDS 2024 · US units</span>
      <h1>Wood Design</h1><p>Check a single rectangular sawn-lumber beam under a full-span uniform load. Enter material values and adjustment factors from your project sources.</p>
      <p>Limited component checks only. Connections, built-up members, engineered wood products and CSA O86 are not included. A passing component check is not whole-member approval.</p>
      <p>{BETA_WARNING}</p>
    </header><WoodCalculator /></main>;
}
