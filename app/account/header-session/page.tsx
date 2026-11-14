import type { Metadata } from "next";
import HeaderSession from "./header-session";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function HeaderSessionPage() {
  return <HeaderSession />;
}
