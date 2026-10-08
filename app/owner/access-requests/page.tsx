import AccessRequestsPanel from "./AccessRequestsPanel";

export default function OwnerAccessRequestsPage() {
  return (
    <main
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "40px 20px 72px",
      }}
    >
      <p style={{ margin: 0, color: "#64748b", fontWeight: 700 }}>
        LinkoTech Owner Administration
      </p>
      <h1 style={{ margin: "8px 0 12px", fontSize: 36 }}>
        Employee Access Requests
      </h1>
      <p style={{ margin: "0 0 28px", color: "#475569", maxWidth: 760 }}>
        New employee accounts receive no feature permissions until the owner
        explicitly approves the required access.
      </p>
      <AccessRequestsPanel />
    </main>
  );
}
