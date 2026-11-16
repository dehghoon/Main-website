"use client";

import Image from "next/image";
import { ArrowRight, Info } from "lucide-react";
import { PUBLIC_TOOLS, toolPreviewPath } from "@/lib/tool-discovery";
import { useInternalToolsAccess } from "./header-auth-bridge";

const model = PUBLIC_TOOLS.find(tool => tool.key === "3d_model")!;

export default function ThreeDModelShowcase() {
  const internalTools = useInternalToolsAccess();
  const modelUrl = internalTools ? model.url : null;
  const modelPath = modelUrl ?? toolPreviewPath(model);

  return (
    <div className="homeModel" id="3d-model">
      <figure className="homeModelCard">
        <Image
          src="/homepage/structural-frame-hero.webp"
          alt="Stylized 3D workspace view with forest-green beams, navy columns and grid planes"
          width={1200}
          height={800}
          sizes="(max-width: 860px) 92vw, 46vw"
          unoptimized
          priority
        />
        <figcaption>
          <div><strong>3D Structural Model</strong><span>Stylized from a workspace screenshot</span></div>
          <span className="homeBadge homeBeta">Beta</span>
          <a className="homeTextLink" href={modelPath}>
            {modelUrl ? "Open 3D Model" : "Preview 3D Model"} <ArrowRight size={16} aria-hidden="true" />
          </a>
        </figcaption>
      </figure>
      <aside className="homeNotice" aria-label="Early development">
        <Info size={17} aria-hidden="true" />
        <p><strong>Early development.</strong> Beta access requires approval. Verify results before professional use.</p>
      </aside>
    </div>
  );
}
