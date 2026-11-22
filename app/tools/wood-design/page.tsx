import type { Metadata } from "next";
import { BETA_WARNING } from "@/lib/tool-access/catalog";
import WoodCalculator from "./wood-calculator";
import styles from "../tools.module.css";
const title = "Wood Design — USA & Canada Beta | Linkoteq";
const description = "Evaluate USA NDS 2024 or limited Canadian CSA O86:24 sawn-lumber beam component checks. Approved account access required. Incomplete Beta.";
const canonical = "https://www.linkoteq.com/tools/wood-design";
export const metadata: Metadata = { title, description, alternates: { canonical },
  robots: { index: true, follow: true }, openGraph: { title, description, url: canonical } };
export default function Preview() {
  return <main className={styles.shell}>
    <a className={styles.back} href="/tools">← Engineering tools</a>
    <header className={styles.intro}><span className={styles.badge}>Beta · USA & Canada</span>
      <h1>Wood Design</h1><p>Choose USA NDS 2024 (ASD / LRFD) or Canada CSA O86:24 (limited dry 38 mm framing profile). Check a simply supported sawn-lumber beam under a full-span uniform load, with a rotatable, zoomable section model. Enter documented project material values.</p>
      <p>Limited component checks only. The Canadian profile requires continuous lateral restraint and listed standard depths. Connections, built-up members and engineered wood products are excluded. A passing component check is not whole-member approval.</p>
      <p>{BETA_WARNING}</p>
    </header><WoodCalculator /></main>;
}
