import { permanentRedirect } from "next/navigation";
import { PUBLIC_TOOLS, toolPreviewPath } from "@/lib/tool-discovery";

export default async function ToolAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ tool?: string }>;
}) {
  const { tool: toolKey } = await searchParams;
  const tool = PUBLIC_TOOLS.find(item => item.key === toolKey);
  permanentRedirect(tool ? toolPreviewPath(tool) : "/tools#development-title");
}
