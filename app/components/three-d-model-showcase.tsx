"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { PUBLIC_TOOLS, toolPreviewPath } from "@/lib/tool-discovery";
import { useInternalToolsAccess } from "./header-auth-bridge";

const model = PUBLIC_TOOLS.find(tool => tool.key === "3d_model")!;
const modelPreviewPath = toolPreviewPath(model);

export default function ThreeDModelShowcase() {
  const internalTools = useInternalToolsAccess();
  const modelUrl = internalTools ? model.url : null;
  const modelPath = modelUrl ?? modelPreviewPath;

  return (
    <section className="modelEngineShowcase" id="3d-model">
      <div className="modelEngineCopy">
        <span className="eyebrow">3D Structural Model · Beta</span>
        <h2>See the 3D structural modeling workspace</h2>
        <p>Preview how a structural model brings grids, beams, columns and levels together in one workspace. Beta access is by approval and is for evaluation.</p>
        <a className="modelEngineLink" href={modelPath}>{modelUrl ? "Open 3D Model" : "Preview 3D Model"} <ArrowRight size={17} /></a>
      </div>
      <a className="modelEnginePreview" href={modelPath} aria-label={modelUrl ? "Open the Linkoteq 3D Model" : "Preview the Linkoteq 3D Model"}>
        <Image src="/3d-model-preview.svg" alt="Linkoteq 3D structural model workspace preview" fill sizes="(max-width: 980px) 100vw, 54vw" priority />
        <span className="modelPreviewBadge">Workspace preview</span>
      </a>
    </section>
  );
}
