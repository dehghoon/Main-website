import type { Metadata } from "next";
import { SITE_ORIGIN, toolRequestPath } from "@/lib/tool-discovery";
import styles from "../tools.module.css";

const title = "Seismic Load Calculator | Linkoteq";
const description = "Explore Linkoteq’s Beta calculator for NBCC 2010 and 2020 seismic base shear and storey forces.";
const canonical = `${SITE_ORIGIN}/tools/seismic`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical },
  openGraph: { title, description, url: canonical },
};

export default function SeismicPreviewPage() {
  return (
    <main className={styles.shell}>
      <a className={styles.back} href="/tools">← Engineering tools</a>
      <header className={styles.intro}>
        <span className={styles.badge}>Beta</span>
        <h1>Seismic Load Calculator</h1>
        <p>Enter building height, storey weights, site hazard and structural system inputs to review seismic base shear and storey forces. The calculator supports NBCC 2010 and NBCC 2020 and can compare the two editions.</p>
        <p className={styles.warning}>NBCC 2020 results are for engineering evaluation. The site benchmark and independent engineering verification are pending.</p>
        <a className={styles.back} href={toolRequestPath("earthquake")}>Request Beta access</a>
      </header>
    </main>
  );
}
