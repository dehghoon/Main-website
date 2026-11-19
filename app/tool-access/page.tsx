import { permanentRedirect } from "next/navigation";
import { PUBLIC_TOOLS, toolPreviewPath } from "@/lib/tool-discovery";

export default async function ToolAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ tool?: string }>;
}) {
  const { tool: toolKey } = await searchParams;
  if (toolKey === "wind_load") permanentRedirect("/tools/wind-load");
  if (toolKey === "earthquake") permanentRedirect("/tools/seismic");
  const tool = PUBLIC_TOOLS.find(item => item.key === toolKey);
  permanentRedirect(tool ? toolPreviewPath(tool) : "/tools");
}
