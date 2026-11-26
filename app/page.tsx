import Image from "next/image";
import {
  ArrowRight, FileSearch, Layers3, ListChecks, Repeat2, Wrench,
} from "lucide-react";
import ThreeDModelShowcase from "./components/three-d-model-showcase";
import { PUBLIC_TOOLS, toolPreviewPath } from "@/lib/tool-discovery";
import "./homepage.css";

const CUSTOMER_DISCOVERY_URL = "https://discovery.linkoteq.com/";

const roadmapSteps = [
  { title: "Identify structural elements", detail: "Recognize grids, columns, beams and loads in 2D drawings." },
  { title: "Assemble a 3D model", detail: "Use the relationships between elements to build a structured model." },
  { title: "Connect relevant calculations", detail: "Route model objects to the engineering tools that apply to them." },
];

const workflowHighlights = [
  { title: "2D to 3D", detail: "Drawing-to-model roadmap", icon: Layers3 },
  { title: "Reusable", detail: "Shared calculation engines", icon: Repeat2 },
  { title: "Traceable", detail: "Inputs, checks and references", icon: ListChecks },
];

const products = [
  { title: "Engineering tools", description: "Explore tools for roof snow loads, steel member checks and early-stage structural modeling.", icon: Wrench, href: "#tools", action: "Explore tools" },
  { title: "Drawing intelligence", description: "Identify grids, members and relationships in structural drawings.", icon: FileSearch, href: "#roadmap", action: "View roadmap", upcoming: true },
  { title: "Model orchestration", description: "Connect model objects with the engineering checks that apply to them.", icon: Layers3, href: "#roadmap", action: "View roadmap", upcoming: true },
];

export default function Home() {
  return (
    <main className="homepage" id="top">
      <section className="homeHero" aria-labelledby="homepage-heading">
        <div className="homeContainer homeHeroLayout">
          <div className="homeHeroCopy">
            <h1 id="homepage-heading">Engineering tools from drawings to structural models</h1>
            <p>Explore snow-load and steel checks today, and see how Linkoteq is connecting drawings, calculations and 3D models.</p>
            <a className="homeButton homePrimary" href="#tools">Explore engineering tools <ArrowRight size={18} aria-hidden="true" /></a>
          </div>
          <ThreeDModelShowcase />
          <ul className="homeMetrics" aria-label="Engineering workflow features">
            {workflowHighlights.map(({ title, detail, icon: Icon }) => (
              <li key={title}>
                <Icon size={22} aria-hidden="true" />
                <div><strong>{title}</strong><span>{detail}</span></div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="homeSection homeWhite" id="tools" aria-labelledby="tools-heading">
        <div className="homeContainer">
          <header className="homeIntro">
            <h2 id="tools-heading">Find the right engineering tool</h2>
            <p>Review sample results and access details. Images are stylized from tool screenshots.</p>
          </header>
          <div className="homeGrid">
            {PUBLIC_TOOLS.map((tool) => {
              const artwork = tool.artwork;
              const linkLabel = tool.key === "3d_model" ? "Preview 3D Model" : `Preview ${tool.name}`;
              return (
                <article className="homeCard homeToolCard" key={tool.key}>
                  <div className="homeToolMedia">
                    <Image
                      className="homeToolArtwork"
                      src={artwork.src}
                      alt={artwork.alt}
                      width={900}
                      height={600}
                      sizes="(max-width: 680px) 90vw, 29vw"
                      unoptimized
                    />
                    <span className={`homeBadge ${tool.trialDays ? "homeTrial" : "homeBeta"}`}>
                      {tool.trialDays ? `${tool.trialDays}-day Trial` : "Beta"}
                    </span>
                  </div>
                  <div className="homeToolDetails">
                    <h3>{tool.name}</h3>
                    <p>{tool.description}</p>
                    <div className="homeSample">
                      {tool.preview ? (
                        <>
                          <span>{tool.key === "snow_load" ? "Sample result · Uniform roof" : "Sample result · ULS utilization"}</span>
                          <strong>{tool.preview.result}</strong>
                        </>
                      ) : (
                        <>
                          <span>Workspace access</span>
                          <strong>Beta access by approval</strong>
                        </>
                      )}
                    </div>
                    <a href={toolPreviewPath(tool)} className="homeTextLink">
                      {linkLabel} <ArrowRight size={16} aria-hidden="true" />
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
          <a className="homeButton homeSecondary" href="/tools">Browse all engineering tools</a>
        </div>
      </section>

      <section className="homeSection" id="platform" aria-labelledby="platform-heading">
        <div className="homeContainer">
          <header className="homeIntro">
            <h2 id="platform-heading">One platform for connected engineering workflows</h2>
            <p>Linkoteq is building workflows that connect engineering drawings, models and specialized calculation tools.</p>
          </header>
          <div className="homeGrid">
            {products.map(({ title, description, icon: Icon, href, action, upcoming }) => (
              <article className="homeCard" key={title}>
                <div className="homeCardTop">
                  <Icon size={27} aria-hidden="true" />
                  {upcoming && <span className="homeBadge homeComingSoon">Coming soon</span>}
                </div>
                <h3>{title}</h3>
                <p>{description}</p>
                <a className="homeTextLink" href={href} aria-label={`${action}: ${title}`}>
                  {action} <ArrowRight size={16} aria-hidden="true" />
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="homeSection homeRoadmap" id="roadmap" aria-labelledby="roadmap-heading">
        <div className="homeContainer">
          <header className="homeIntro">
            <h2 id="roadmap-heading">From drawings to structured 3D models</h2>
          </header>
          <ol className="homeRoadmapList">
            {roadmapSteps.map(({ title, detail }, index) => (
              <li key={title}>
                <span className="homeStepNumber" aria-hidden="true">0{index + 1}</span>
                <h3>{title}</h3>
                <p>{detail}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="homeSection homeWhite homeContactSection">
        <div className="homeContainer homeSplit homeContact">
          <div>
            <h2>Help shape the next set of engineering tools</h2>
            <p>Tell us about your engineering workflow in the Customer Discovery questionnaire.</p>
          </div>
          <a className="homeButton homePrimary" href={CUSTOMER_DISCOVERY_URL}>Talk to us <ArrowRight size={18} aria-hidden="true" /></a>
        </div>
      </section>
      <footer className="homeFooter">
        <div className="homeContainer">
          <Image src="/linkoteq-engineering-technology-20261126.svg" alt="Linkoteq Engineering Technology" width={210} height={52} />
          <nav className="homeFooterLinks" aria-label="Footer">
            <a href="/contact">Contact</a>
            <a href="/tools">Tools</a>
            <a href="#roadmap">Roadmap</a>
          </nav>
          <span>© 2026 Linkoteq. All rights reserved.</span>
        </div>
      </footer>
    </main>
  );
}
