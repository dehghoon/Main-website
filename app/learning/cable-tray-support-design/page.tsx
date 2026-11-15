import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_ORIGIN } from '@/lib/tool-discovery';
import styles from '../learning.module.css';
import guide from './guide.module.css';

const title = 'Cable Tray Support Design and Load Calculation | Linkoteq';
const description = 'Calculate a cable tray support reaction in a worked example, then review conduit weight, strut selection, seismic bracing and installation coordination.';
const canonical = `${SITE_ORIGIN}/learning/cable-tray-support-design`;
const wheatland = 'https://www.wheatland.com/wp-content/uploads/2022/05/Rigid-Metal-Conduit-Submittal-Sheet-%E2%80%93-Canada-English.pdf';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical },
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  openGraph: { type: 'article', title, description, url: canonical },
};

export default function CableTraySupportGuide() {
  return (
    <main className={styles.page}>
      <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href="/learning#cable-tray-and-support-systems">Learning &amp; Resources</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Cable Tray Support Design</span>
      </nav>

      <article className={guide.article}>
        <header className={styles.hero}>
          <span className={styles.level}>Intermediate</span>
          <h1>Cable Tray Support Design and Installation</h1>
          <p>Calculate a gravity reaction, trace it into the supporting structure and review the information needed to select and install a support.</p>
        </header>

        <nav aria-label="In this guide" className={guide.contents}>
          <a href="#load-path">Load paths</a>
          <a href="#load-calculation">Worked calculation</a>
          <a href="#conduit-weight">Conduit weight</a>
          <a href="#support-selection">Support and bracing</a>
          <a href="#installation-review">Installation review</a>
        </nav>

        <section id="load-path">
          <h2>Cable Tray and Conduit Support Load Paths</h2>
          <p>A cable tray carries the cables along a shared route. A conduit run carries its own weight plus the conductors inside it. On a common support, account for each run in its actual position so the load on the rail and on each hanger can be checked.</p>
          <figure className={guide.figure}>
            <ol className={guide.flow} aria-label="Gravity load path">
              <li><strong>Tray and cables</strong><span>Distributed load along the run</span></li>
              <li><strong>Support rail</strong><span>Collects the tray reaction</span></li>
              <li><strong>Hangers or bracket</strong><span>Transfer the rail reaction</span></li>
              <li><strong>Building structure</strong><span>Receives load through the attachment</span></li>
            </ol>
            <figcaption>Gravity load path for a typical support arrangement. Conduit supported on the same rail adds load at its own attachment location.</figcaption>
          </figure>
        </section>

        <section id="load-calculation">
          <h2>How to Calculate a Cable Tray Support Load</h2>
          <p>Consider an interior support between two equal 2.4 m bays. The example treats the bays as simply supported and assumes uniform loading. The loads below are hypothetical, unfactored values.</p>
          <table className={guide.table}>
            <caption>Example gravity load inputs</caption>
            <thead><tr><th scope="col">Input</th><th scope="col">Value</th></tr></thead>
            <tbody>
              <tr><th scope="row">Tray and distributed accessories</th><td>0.12 kN/m</td></tr>
              <tr><th scope="row">Installed cables</th><td>0.28 kN/m</td></tr>
              <tr><th scope="row">Tributary length at the interior support</th><td>1.2 m + 1.2 m = 2.4 m</td></tr>
            </tbody>
          </table>
          <p className={guide.result}><strong>Tray reaction at the interior support:</strong> (0.12 + 0.28) kN/m × 2.4 m = <strong>0.96 kN</strong>.</p>
          <p>For this idealization the end support receives 0.48 kN from one bay. The interior reaction is the load delivered by the tray to one support assembly. Add the assembly self-weight and any other supported runs before checking the rail, hanger reactions and attachment. An eccentric tray position can produce unequal hanger reactions. For continuous spans or concentrated loads, use reactions from an analysis appropriate to the actual arrangement.</p>
          <p>Use the tray supplier’s published span and load data for the selected system, including the fitting support requirements and the basis of the published rating. <a href="https://www.eaton.com/us/en-us/catalog/support-systems/imperial-cable-tray-and-ladder.html">Eaton B-Line cable tray system</a></p>
        </section>

        <section id="conduit-weight">
          <h2>How to Read a Conduit Weight Table</h2>
          <p>Open page 2 of the <a href={wheatland}>Wheatland Rigid Metal Conduit Submittal Sheet (PDF)</a>. Find the trade size in the weights and dimensions table, then check the length basis. For example, the 1-inch row lists 73 kg per 100 ft. Convert 100 ft to 30.48 m to get about 2.40 kg/m, or 0.0235 kN/m of bare conduit self-weight using standard gravity. Add conductor and fitting loads separately for the actual run. The cable tray example above uses separate hypothetical inputs.</p>
        </section>

        <section id="support-selection">
          <h2>Strut, Clamp and Seismic Bracing Selection</h2>
          <ol>
            <li><strong>Tray and fittings.</strong> Identify the tray series, span and support locations at bends, tees and transitions.</li>
            <li><strong>Rail and clamps.</strong> Check rail orientation, span, load arrangement and the clamp’s specified range for the selected conduit or attachment.</li>
            <li><strong>Hangers and building attachment.</strong> Resolve the reactions at the actual attachment locations. Check the connection and confirm that the receiving structure can carry the loads.</li>
            <li><strong>Seismic bracing.</strong> When the applicable provisions require it, establish the design mass and lateral demand, then follow that force through the brace, fittings, anchors and supporting structure. The gravity reaction in the worked example is one input to coordination.</li>
          </ol>
          <p>Carry the 0.96 kN tray reaction into the rail model. If the tray is centered between two vertical hangers and the rail is idealized as simply supported, this load alone contributes 0.48 kN to each hanger. In a real review, check the rail’s own weight and the location of every additional run. Reconcile the sum of vertical reactions with the applied gravity load before checking each attachment.</p>
          <p>Look up the selected components and their application limits in the <a href="https://www.atkore.com/resources/submittal-packages">Atkore submittal library</a>. The <a href="https://www.atkore.com/en-ca/products/strut-and-fittings/p1000">Unistrut P1000 product page</a> is an example of where to verify the channel designation before looking up capacity data.</p>
        </section>

        <section id="installation-review">
          <h2>Field Coordination Checklist</h2>
          <ul>
            <li>Confirm the installed route, support spacing, transitions, bend clearance and access for pulling cables.</li>
            <li>Identify clashes with adjacent services, building elements and maintenance access.</li>
            <li>Verify rail orientation, attachment substrate and room to install and inspect the connection.</li>
            <li>Check movement at joints and coordinate bonding, grounding and penetrations with the electrical design.</li>
            <li>For a change in routing or loading, record the revised inputs, support reactions and connection checks before closing the field review.</li>
          </ul>
        </section>

        <p className={styles.notice}>
          Before selecting a support, check the project’s load requirements, the manufacturer’s ratings
          for your layout, and the capacity of the beam, slab, or wall that carries it.
        </p>
      </article>
    </main>
  );
}
