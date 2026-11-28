import type { Metadata } from "next";
import styles from "../tools.module.css";

const title = "2D Structural Analysis — Beams, Frames and Trusses | Linkoteq";
const description = "Preview Linkoteq 2D Analysis for plane beams, frames and trusses, with loads, reactions, internal-force diagrams and deflections. Beta integration under review.";
const canonical = "https://www.linkoteq.com/tools/2d-analysis";
export const metadata: Metadata = {
  title, description, alternates: { canonical },
  openGraph: { title, description, url: canonical },
  robots: { index: true, follow: true },
};

export default function Analysis2DPreview() {
  return <main className={styles.shell}>
    <a className={styles.back} href="/tools">← Engineering tools</a>
    <header className={styles.intro}>
      <span className={styles.badge}>Beta · Integration under review</span>
      <h1>2D Analysis</h1>
      <p>Model plane beams, frames and trusses, apply supports and loads, and review reactions, axial and shear forces, bending moments and deflections.</p>
      <p>The workspace includes model import and export, Undo/Redo and report tools. It is based on the GPL-3.0 EduBeam application.</p>
      <p className={styles.warning}>For evaluation and feedback. Integrated access control and release review are still in progress. This page does not grant calculator access or certify calculations for professional use.</p>
      <a className={styles.back} href="/contact/support">Ask about 2D Analysis access →</a>
      <p><a href="/knowledge/documentation">Engineering documentation</a></p>
    </header>
  </main>;
}
