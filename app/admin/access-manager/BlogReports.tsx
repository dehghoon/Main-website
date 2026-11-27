"use client";

import { useEffect, useState } from "react";

type Article = {
  id: string;
  title: string;
  slug: string | null;
  excerpt: string | null;
  created_at: string;
  published_at: string | null;
  hasCover: boolean;
};
type SocialRecord = { id: string; post_id: string; platform: string; status: string; due_at: string | null; external_post_id: string | null };
type Reports = { published: Article[]; drafts: Article[] | null; social: SocialRecord[] | null };

const torontoTime = new Intl.DateTimeFormat("en-CA", {
  dateStyle: "medium", timeStyle: "short", timeZone: "America/Toronto",
});

function ArticleList({ articles, published = false, social }: { articles: Article[]; published?: boolean; social?: SocialRecord[] | null }) {
  if (!articles.length) return <p>{published ? "No published articles found." : "No drafts found."}</p>;
  return <ul style={{ listStyle: "none", padding: 0 }}>
    {articles.map(article => {
      const channels = social?.filter(record => record.post_id === article.id);
      const date = published ? article.published_at : article.created_at;
      return <li key={article.id} style={{ border: "1px solid #dbe5ed", borderRadius: 12, padding: 16, marginBottom: 12, overflowWrap: "anywhere" }}>
        <h5>{article.title}</h5>
        {date && <p>{published ? "Published" : "Saved"} <time dateTime={date}>{torontoTime.format(new Date(date))}</time></p>}
        {article.excerpt && <p>{article.excerpt}</p>}
        <p>{article.hasCover ? "Cover image recorded" : "No cover image"}</p>
        {published && article.slug && <a href={`/blog/${encodeURIComponent(article.slug)}`}>Read article</a>}
        {channels && <details><summary>Social publication records</summary>
          {channels.length ? <ul>{channels.map(record => <li key={record.id}>
            {record.platform} · {record.status}
            {record.due_at && <> · Due {torontoTime.format(new Date(record.due_at))}</>}
            {record.external_post_id && <> · Post ID <bdi>{record.external_post_id}</bdi></>}
          </li>)}</ul> : <p>No social publication records.</p>}
        </details>}
      </li>;
    })}
  </ul>;
}

export default function BlogReports({ token }: { token: string }) {
  const [reports, setReports] = useState<Reports | null>(null);
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setReports(null);
      setError(false);
      try {
        const response = await fetch("/api/admin/access-manager/blog", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Blog reports unavailable");
        const data: Reports = await response.json();
        if (!controller.signal.aborted) setReports(data);
      } catch {
        if (!controller.signal.aborted) setError(true);
      }
    }

    void load();
    return () => controller.abort();
  }, [token, revision]);

  return <section aria-labelledby="blog-reports-title" style={{ marginBottom: 24 }}>
    <h3 id="blog-reports-title">Blog activity</h3>
    <p>Up to 20 recent records per list. Times are shown in Toronto time.</p>
    <button type="button" disabled={!reports && !error} onClick={() => setRevision(value => value + 1)}>Refresh blog activity</button>
    {!reports && !error && <p role="status">Loading blog activity…</p>}
    {error && <p role="alert">Blog records are unavailable. Try refreshing.</p>}
    {reports && <>
      <h4>Drafts</h4>
      {reports.drafts === null
        ? <p>Drafts require the internal database connection.</p>
        : <ArticleList articles={reports.drafts} />}
      <h4>Published articles</h4>
      {reports.social === null && <p>Private social publication records are unavailable in this environment.</p>}
      <ArticleList articles={reports.published} published social={reports.social} />
    </>}
  </section>;
}
