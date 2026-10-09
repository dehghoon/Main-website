import "./structural-labeling.css";

export default function StructuralLabelingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="structural-labeling-shell">{children}</div>;
}
