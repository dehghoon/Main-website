import Image from "next/image";
import { ArrowRight, FileImage, FileText, Layers3, PenTool } from "lucide-react";

const MODEL_URL = "https://3dmodel.linkoteq.com/";

const launchOptions = [
  { label: "Upload 2D Plan PDF", icon: FileText, href: `${MODEL_URL}?start=pdf` },
  { label: "Upload 2D Plan Image", icon: FileImage, href: `${MODEL_URL}?start=image` },
  { label: "Upload 2D Plan DXF", icon: FileText, href: `${MODEL_URL}?start=dxf` },
  { label: "Upload IFC File", icon: Layers3, href: `${MODEL_URL}?start=ifc` },
  { label: "Create Manually", icon: PenTool, href: `${MODEL_URL}?start=manual` },
];

export default function ThreeDModelShowcase() {
  return (
    <section className="modelEngineShowcase" id="3d-model">
      <div className="modelEngineCopy">
        <span className="eyebrow">Core Structural Modeling Engine</span>
        <h2>Create, Load, and Prepare a 3D Structural Model for Analysis</h2>
        <p>
          Quickly create early-stage structural models from 2D drawings, sketches, or manually with the support of the LinkoTech <strong className="aiPlatformHighlight">AI Platform</strong>. Built to simplify early design for structural engineers while remaining user-friendly for owners, architects, project managers, and other stakeholders. Models can be progressively developed for detailed structural design.
        </p>
        <p className="modelCreationHint"><strong>Choose a starting point below to create an editable 3D structural model.</strong> LinkoTech converts the available project information into model geometry such as grids, columns, beams, slabs, walls, and nodes for review and development.</p>
        <div className="modelLaunchGrid">
          {launchOptions.map(({ label, icon: Icon, href }) => (
            <a key={label} href={href} className="modelLaunchButton">
              <Icon size={18} />
              <span>{label}</span>
              <ArrowRight size={16} />
            </a>
          ))}
        </div>
        <a className="modelEngineLink" href={MODEL_URL}>Open 3D Model Workspace <ArrowRight size={17} /></a>
      </div>
      <a className="modelEnginePreview" href={MODEL_URL} aria-label="Open LinkoTech 3D Model">
        <Image src="/3d-model-preview.svg" alt="LinkoTech 3D structural model workspace preview" fill sizes="(max-width: 980px) 100vw, 54vw" priority />
        <span className="modelPreviewBadge">Live workspace · 3dmodel.linkoteq.com</span>
      </a>
    </section>
  );
}
