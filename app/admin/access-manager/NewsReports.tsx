"use client";

import { useEffect, useState } from "react";

type Publication = { platform: string; status: string; caption: string | null; external_post_url: string | null };
type Report = {
  id: string;
  title: string;
  subtitle: string | null;
  created_at: string;
  source_url: string;
  creative_status: string | null;
  image_status: string | null;
  creative_brief: unknown;
  publications: Publication[];
  website: { summary: string; social_links: unknown; video_links: unknown } | null;
};

function secureLink(value: unknown) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

function outputLinks(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  return Object.entries(value).flatMap(([label, raw]) => {
    const url = secureLink(raw);
    return url ? [{ label, url }] : [];
  });
}

const torontoTime = new Intl.DateTimeFormat("en-CA", {
  dateStyle: "medium", timeStyle: "short", timeZone: "America/Toronto",
});

export default function NewsReports({ token }: { token: string }) {
  const [reports, setReports] = useState<Report[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setStatus("loading");
      setReports([]);
      try {
        const response = await fetch("/api/admin/access-manager/news", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Report unavailable");
        const data = await response.json();
        if (!controller.signal.aborted) {
          setReports(data.reports);
          setStatus("ready");
        }
      } catch {
        if (!controller.signal.aborted) setStatus("error");
      }
    }
    void load();
    return () => controller.abort();
  }, [token, revision]);

  return <section aria-labelledby="news-reports-title" style={{ marginBottom: 24 }}>
    <h3 id="news-reports-title">AI engineering news</h3>
    <p>Recent reports saved by the existing news workflow. Times are shown in Toronto time.</p>
    <button type="button" disabled={status === "loading"} onClick={() => setRevision(value => value + 1)}>Refresh reports</button>
    {status === "loading" && <p role="status">Loading reports…</p>}
    {status === "error" && <p role="alert">Saved news reports are unavailable. Try refreshing or check the preview’s database connection.</p>}
    {status === "ready" && reports.length === 0 && <p>No news reports have been saved yet.</p>}
    {reports.map(report => {
      const source = secureLink(report.source_url);
      const links = [...outputLinks(report.website?.social_links), ...outputLinks(report.website?.video_links)];
      return <article key={report.id} style={{ border: "1px solid #dbe5ed", borderRadius: 12, padding: 16, marginTop: 12, overflowWrap: "anywhere" }}>
        <h4>{report.title}</h4>
        <p>Saved {torontoTime.format(new Date(report.created_at))}</p>
        {(report.website?.summary || report.subtitle) && <p>{report.website?.summary || report.subtitle}</p>}
        <p>Creative: {report.creative_status?.replaceAll("_", " ") ?? "Unavailable"} · Image: {report.image_status?.replaceAll("_", " ") ?? "Unavailable"}</p>
        {source && <p><a href={source}>Original source</a></p>}
        {links.length > 0 && <ul>{links.map(({ label, url }) => <li key={url + label}><a href={url}>{label}</a></li>)}</ul>}
        {report.publications.map((publication, index) => {
          const link = publication.status === "published" ? secureLink(publication.external_post_url) : null;
          return <details key={index}>
            <summary>{publication.platform} · {publication.status}</summary>
            {link && <p><a href={link}>Open published post</a></p>}
            {publication.caption && <p style={{ whiteSpace: "pre-wrap" }}>{publication.caption}</p>}
          </details>;
        })}
        {Boolean(report.creative_brief) && <details>
          <summary>Saved creative brief</summary>
          <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{JSON.stringify(report.creative_brief, null, 2)}</pre>
        </details>}
      </article>;
    })}
  </section>;
}
