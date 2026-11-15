import type { Metadata } from 'next';
import ResourcesWorkspace from './resources-workspace';

export const metadata: Metadata = {
  title: 'Resources Workspace | Linkoteq',
  robots: { index: false, follow: false },
};

export default function ResourcesWorkspacePage() {
  return <ResourcesWorkspace />;
}
