import { ENGINEERING_TOOLS, type EngineeringToolKey } from "./tool-access/catalog";

const publicDetails = {
  snow_load: {
    slug: "snow-load",
    description: "Explore how roof geometry and climate inputs are used in Linkoteq's roof snow load calculator.",
    preview: {
      title: "Uniform roof snow load",
      inputs: [
        ["Ground snow load", "2.40 kPa"],
        ["Associated rain load", "0.40 kPa"],
        ["Roof slope", "0°"],
        ["Basic roof snow load factor", "0.80"],
        ["Importance and exposure factors", "1.00 each"],
      ],
      resultLabel: "Specified roof snow load",
      result: "2.32 kPa",
      detail: "NBCC 2020 uniform roof example from the Snow Load calculator.",
      source: "https://github.com/dehghoon/Snow-Calculator/blob/cad57dd5cc8cb8f942b238285f1f1d04b2227bdc/packages/nbcc2020_roof_snow_engine/examples/basic_usage.py",
    },
  },
  w_section: {
    slug: "w-section",
    description: "See how Linkoteq's steel W-section tool presents member inputs, governing checks and utilization.",
    preview: {
      title: "Steel member verification",
      inputs: [
        ["Section", "W100×19"],
        ["Member lengths in benchmark", "500 mm"],
        ["Steel yield strength", "248 MPa"],
        ["Major-axis moment", "2.38 kN·m"],
        ["Minor-axis moment", "3.63 kN·m"],
      ],
      resultLabel: "Maximum ULS utilization",
      result: "44.31%",
      detail: "Biaxial bending governed this CSA S16:2019 benchmark. The sample flags a non-coincident load envelope and does not include a lateral-torsional buckling check.",
      source: "https://github.com/dehghoon/steel-verification/blob/31de9e870612b206a0f8fee44e55465b18850e99/backend/tests/test_api.py",
    },
  },
  "3d_model": {
    slug: "3d-model",
    description: "Preview Linkoteq's 3D Structural Model workspace for early-stage structural modeling and request Beta access.",
    preview: null,
  },
} as const;

type PublicDetailsKey = keyof typeof publicDetails;

export const PUBLIC_TOOLS = ENGINEERING_TOOLS.flatMap(tool =>
  Object.hasOwn(publicDetails, tool.key)
    ? [{ ...tool, ...publicDetails[tool.key as PublicDetailsKey] }]
    : [],
);

export type PublicTool = (typeof PUBLIC_TOOLS)[number];

export const SITE_ORIGIN = "https://www.linkoteq.com";

export function toolPreviewPath(tool: PublicTool) {
  return `/tools/${tool.slug}`;
}

export function toolRequestPath(toolKey: EngineeringToolKey) {
  return `/customer-login?tool=${toolKey}`;
}
