import type { Metadata } from "next";
import { SITE_ORIGIN } from "@/lib/tool-discovery";
import { INTERNAL_CALCULATOR_URLS } from "@/lib/tool-access/catalog";
import ToolPreviewAnalytics from "../tool-preview-analytics";
import styles from "../tools.module.css";

const title = "Wind Load Calculator | Linkoteq";
const description = "Explore Linkoteq’s Beta wind load calculator for Canadian wind stations, building pressures and cladding coefficients.";
const canonical = `${SITE_ORIGIN}/tools/wind-load`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical },
  openGraph: { title, description, url: canonical },
};

export default function WindPreviewPage() {
  return (
    <main className={styles.shell}>
      <a className={styles.back} href="/tools">← Engineering tools</a>
      <header className={styles.intro}>
        <span className={styles.badge}>Beta</span>
        <h1>Wind Load Calculator</h1>
        <p>Choose a Canadian wind station and review reference pressures. The calculator includes low-rise, general static and components and cladding workflows.</p>
        <ToolPreviewAnalytics toolKey="wind_load" trialDays={null} url={INTERNAL_CALCULATOR_URLS.wind_load} internalLabel="Open Wind Load Calculator" />
      </header>
    </main>
  );
}
