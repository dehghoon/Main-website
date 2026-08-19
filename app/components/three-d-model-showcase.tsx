import Image from "next/image";
import { ArrowRight, FileImage, FileText, Layers3, PenTool } from "lucide-react";

const MODEL_URL = "https://3dmodel.linkoteq.com/";

const launchOptions = [
  { label: "Upload PDF", icon: FileText, href: `${MODEL_URL}?start=pdf` },
  { label: "Upload Image", icon: FileImage, href: `${MODEL_URL}?start=image` },
  { label: "Upload IFC", icon: Layers3, href: `${MODEL_URL}?start=ifc` },
  { label: "Create Manually", icon: PenTool, href: `${MODEL_URL}?start=manual` },
];

export default function ThreeDModelShowcase() {
  return (
    <section className="modelEngineShowcase" id="3d-model">
      <div className="modelEngineCopy">
        <span className="eyebrow">Core Structural Modeling Engine</span>
        <h2>Create, Load, And Prepare A 3D Structural Model For Analysis.</h2>
        <p>
          Build the structural model manually or start from engineering documents. The LinkoTech 3D Model is the central workspace that connects geometry, assigned loads, calculation modules, and the analysis workflow.
        </p>
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
