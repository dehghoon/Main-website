"use client";

import { useState } from "react";
import type history from "@/lib/command-center/core-history.json";
import styles from "./operations.module.css";

const stages: Record<string, string> = {
  released: "نسخهٔ رسمی منتشر شده",
  candidate: "نامزد انتشار",
  development: "در حال توسعه",
};
const kinds: Record<string, string> = {
  "repository-initialization": "آغاز مخزن، بدون نسخهٔ رسمی",
  "historical-contract": "نقطهٔ تغییر قرارداد در Git",
  "tagged-release": "انتشار رسمی با تگ",
};

export default function CoreHistory({ data, token }: { data: typeof history; token: string }) {
  const [downloadError, setDownloadError] = useState(false);

  async function download(kind: "history" | "schema") {
    setDownloadError(false);
    try {
      const response = await fetch(`/api/admin/access-manager/core?download=${kind}`, {
        headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
      });
      if (!response.ok) throw new Error("Download unavailable");
      const url = URL.createObjectURL(await response.blob());
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = kind === "schema" ? "core-history.schema.json" : "core-history.json";
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setDownloadError(true);
    }
  }

  return <section className={styles.workspace} dir="rtl" lang="fa">
    <div className={styles.panel}>
      <h3>وضعیت Structural Core</h3>
      <p><strong>{stages[data.current.stage]}</strong> · <bdi>{data.current.releaseTag}</bdi> · قرارداد <bdi>{data.current.contractVersion}</bdi></p>
      <p>انتشار خود Core ثبت شده است. مهاجرت ابزارها جداگانه پیگیری می‌شود. نسخهٔ مورد استفاده در محیط اصلی در این گزارش تأیید نشده است.</p>
      <p>تاریخ مرور <bdi>{data.snapshotDate}</bdi> · commit انتشار <bdi>{data.current.releaseCommit.slice(0, 7)}</bdi></p>
      <div className={styles.links}><a href={data.current.releaseNotes}>یادداشت انتشار</a><a href={data.current.migrationMatrix}>ماتریس مهاجرت ابزارها</a></div>
    </div>
    <div className={styles.panel}>
      <h3>تاریخچهٔ Core از آغاز مخزن</h3>
      <ol>{data.versions.map(version => <li key={version.commit}>
        <details>
          <summary><bdi>{version.milestone === "0 / foundation" ? "۰ · آغاز مخزن" : version.milestone}</bdi> · {kinds[version.kind]} · <bdi>{version.publishedAt ? version.publishedAt.slice(0, 10) : version.commitDate}</bdi></summary>
          <div lang="en" dir="ltr"><ul>{version.changes.map(change => <li key={change}>{change}</li>)}</ul></div>
          <a href={version.evidenceUrl}>شاهد در GitHub · <bdi>{version.commit.slice(0, 7)}</bdi></a>
        </details>
      </li>)}</ol>
      <div className={styles.links}>
        <button type="button" onClick={() => void download("history")}>دانلود تاریخچهٔ JSON</button>
        <button type="button" onClick={() => void download("schema")}>دانلود JSON Schema</button>
      </div>
      {downloadError && <p role="alert">دانلود انجام نشد. دوباره تلاش کنید.</p>}
      <details><summary>مشاهدهٔ فایل تاریخچه</summary>
        <pre dir="ltr" style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{JSON.stringify(data, null, 2)}</pre>
      </details>
    </div>
  </section>;
}
