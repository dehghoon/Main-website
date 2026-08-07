const labels: Record<string, string> = {
  "engineering-articles": "Engineering Articles",
  "ai-structural-engineering": "AI in Structural Engineering",
  "bim-ifc-guides": "BIM & IFC Guides",
  "free-downloads": "Free Downloads",
  documentation: "Documentation",
  "white-papers": "White Papers",
  tutorials: "Tutorials",
  faqs: "FAQs",
  "case-studies": "Case Studies",
  "customer-discovery-reports": "Customer Discovery Reports",
};

type KnowledgePageProps = {
  params: Promise<{ slug: string }>;
};

export default async function KnowledgePage({ params }: KnowledgePageProps) {
  const { slug } = await params;
  const title = labels[slug] || "Knowledge Center";

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "96px 6vw",
        background: "#f5f8fb",
        color: "#071525",
      }}
    >
      <h1>{title}</h1>
      <p>This Knowledge Center section is being prepared.</p>
      <p>
        <a href="/">Back to Home</a>
      </p>
    </main>
  );
}
